/* global Buffer, uid, MapForEach, arrayRemove2, toListOfTuples */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    //TODO equals,
    //  methods from sortedmap
    var primes = (function() {
        //Hash table sizes that roughly double each time, are prime, and as far as as possible from the nearest powers of 2
        var primes = [
            13, 23, 53, 97, 193, 389, 769, 1543, 3079, 6151, 12289, 24593, 49157, 98317, 196613,
            393241, 786433, 1572869, 3145739, 6291469, 12582917, 25165843, 50331653, 100663319,
            201326611, 402653189, 805306457, 1610612741
        ];

        function getPrimeAtLeast( n ) {
            for( var i = 0; i < primes.length; ++i ) {
                if( primes[i] >= n ) {
                    return primes[i];
                }
            }

            return getHighestPrime();
        }

        function getSmallestPrime() {
            return primes[0];
        }

        function getHighestPrime() {
            return primes[primes.length-1];
        }


        return {
            smallest: getSmallestPrime,
            highest: getHighestPrime,
            atLeast: getPrimeAtLeast
        };
    })();

    var hashBoolean = function( bool ) {
        return bool ? 1 : 0;
    };

    var hashString = function( str ) {
        if( str == null ) {
            return 0;
        }

        var hash = 5381,
            i = 0;

        for( var i = 0, l = str.length; i < l; ++i ) {
            hash = ( ( ( hash << 5 ) + hash ) ^ str.charCodeAt( i ) );
        }

        return (hash >>> 0); //The shift is a trick to get unsigned 32-bit
                           //(-1 >>> 0) === 4294967295
    };

    var hashNumber = (function() {
        //No support of reading the bits of a double directly as 2 unsigned ints
        function noSupport( num ) {
            var hash = (num >>> 0);

            if( hash === num ) { //return unsigned integers as is
                return hash;
            }
            /*This seems to come very close to just xoring bits of a double together
            */
            var ret = ((988988137 * num) % 4294967295) >>> 0;
            ret += ret << 13;
            ret ^= ret >> 7;
            ret += ret << 3;
            ret ^= ret >> 17;
            ret += ret << 5;
            return ret >>> 0;
        }

        if( typeof ArrayBuffer !== "undefined" &&
            typeof Uint32Array !== "undefined" ) {

            if( typeof Float64Array !== "undefined" ) {

                var buffer = new ArrayBuffer( 8 );
                var doubleView = new Float64Array( buffer );
                var Uint32View = new Uint32Array( buffer );

                return function( num ) {
                    doubleView[0] = num;
                    return ( Uint32View[0] ^ Uint32View[1] ) >>> 0;
                };

            }
            else if( typeof Float32Array !== "undefined" ) {
                var buffer = new ArrayBuffer( 4 );
                var floatView = new Float32Array( buffer );
                var Uint32View = new Uint32Array( buffer );

                return function( num ) {
                    floatView[0] = num;
                    return Uint32View[0] >>> 0;
                };
            }
            else {
                return noSupport;
            }

        }
        else if( typeof Buffer === "function" &&
                 typeof ((new Buffer()).writeDoubleLE) === "function" ) {

            var buffer = new Buffer( 8 );

            return function( num ) {
                buffer.writeDoubleLE( num, 0 );
                return ( buffer.readUInt32LE( 0 ) ^ buffer.readUInt32LE( 4 ) ) >>> 0;
            };
        }
        else {
            return noSupport;
        }

    })();

    var hash = function( val ) {

        switch( typeof val ) {
        case "number":
            return hashNumber( val );
        case "string":
            return hashString( val );
        case "boolean":
            return hashBoolean( val );

        default:
            var ret;
            if( val == null ) {
                return 0;
            }

            //valueOf should return a number
            if( ( ret = val.valueOf() ) !== val ) {
                return hash( ret );
            }

            return uid( val );
        }
    };

    var equals = function( key1, key2 ) {
        return key1 === key2;
    };

    var clampCapacity = function( capacity ) {
        return Math.max( DEFAULT_CAPACITY, Math.min( MAX_CAPACITY, capacity ) );
    };

    var DEFAULT_CAPACITY = primes.smallest();
    var MAX_CAPACITY = primes.highest();
    var LOAD_FACTOR = 0.67;

    var method = Map.prototype;
    function Map( capacity, equality ) {
        if( typeof capacity === "function" ) {
            var tmp = equality;
            equality = capacity;
            capacity = tmp;
        }

        var setCapacity = DEFAULT_CAPACITY;

        switch( typeof capacity ) {
        case "number":
            setCapacity = primes.atLeast( capacity );
            break;
        case "object":
            setCapacity = -1;
            break;

        default:
            setCapacity = DEFAULT_CAPACITY;
            break;
        }

        if( typeof equality === "function" ) {
            this._equality = equality;
        }
        else {
            this._equality = equals;
        }

        this._buckets = null;
        this._size = 0;
        this._modCount = 0;

        if( setCapacity > -1 || !capacity ) {
            this._capacity = clampCapacity( setCapacity );
            this.init();
        }
        else {
            var tuples = toListOfTuples( capacity );
            this._capacity = primes.atLeast( tuples.length );
            this.init();
            this._setAll( tuples );
        }
    }

    method._makeBuckets = function() {
        var b = this._buckets = new Array( this._capacity );

        for( var i = 0; i < this._capacity; ++i ) {
            b[i] = null;
        }
    };

    method._keyAsBucketIndex = function( key ) {
        return hash( key ) % this._capacity;
    };

    method._bucketByKey = function( key ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }

        var index = this._keyAsBucketIndex( key ),
            ret = this._buckets[index];

        return ret === null ? ( this._buckets[index] = [] ) : ret;
    };

    method._bucketKeyIndex = function( bucket, key ) {
        for( var i = 0, l = bucket.length; i < l; i += 2 ) {
            if( this._equality( bucket[i], key ) ) {
                return i;
            }
        }

        return -1;
    };

    method._resizeTo = function( capacity ) {
        capacity = clampCapacity( capacity );
        if( this._capacity >= capacity ) {
            return;
        }
        this._capacity = capacity;

        var oldBuckets = this._buckets;
        this._makeBuckets();

        if( oldBuckets !== null ) {
            for( var i = 0, l = oldBuckets.length; i < l; ++i ) {
                var entries = oldBuckets[i];
                if( entries !== null ) {
                    for( var j = 0, ll = entries.length; j < ll; j += 2 ) {
                        var bucket = this._bucketByKey( entries[j] );
                        bucket.push( entries[j], entries[j + 1] );
                    }
                }
                oldBuckets[i] = null;
            }
        }
    };

    method._getNextCapacity = function() {
        return primes.atLeast( this._capacity + 1 );
    };

    method._isOverCapacity = function( size ) {
        return size >= this._capacity * LOAD_FACTOR;
    };

    method._checkResize = function() {
        if( this._isOverCapacity( this._size ) ) {
            this._resizeTo( this._getNextCapacity() );
        }
    };

    method._setAll = function( obj ) {
        if( !obj.length ) {
            return;
        }
        var newSize = obj.length + this._size;

        if( this._isOverCapacity( newSize ) ) {
            this._resizeTo( primes.atLeast( ( 1 + newSize / LOAD_FACTOR ) | 0 ) );
        }

        for( var i = 0; i < obj.length; ++i ) {
            var key = obj[i][0],
                value = obj[i][1];
            this.set( key, value );
        }
    };

    //API

    method.forEach = MapForEach;

    method.init = function() {

    };

    method.clone = function() {
        return new this.constructor(
            this.entries(),
            this._equality
        );
    };

    method.containsValue = method.hasValue = function( value ) {
        var it = this.iterator();
        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.containsKey = method.hasKey = function( key ) {
        return this.get( key ) !== void 0;
    };

    method.get = function( key ) {
        var bucket = this._bucketByKey( key ),
            bucketIndex;

        if( bucket.length &&
            (bucketIndex = this._bucketKeyIndex( bucket, key ) ) >= 0  ) {
            return bucket[ bucketIndex + 1 ];
        }
        return void 0;
    };

    method["delete"] = method.unset = method.remove = function( key ) {
        this._modCount++;
        var bucket = this._bucketByKey( key ),
            ret = void 0,
            bucketIndex;

        if( bucket.length &&
            (bucketIndex = this._bucketKeyIndex( bucket, key ) ) >= 0 ) {
            ret = bucket[bucketIndex+1];
            arrayRemove2( bucket, bucketIndex );
            this._size--;
        }
        return ret;
    };

    method.put = method.set = function( key, value ) {
        this._modCount++;
        var bucket = this._bucketByKey( key ),
            ret = void 0,
            bucketIndex;

        if( bucket.length &&
            (bucketIndex = this._bucketKeyIndex( bucket, key ) ) >= 0 ) {
            ret = bucket[bucketIndex+1];
            bucket[bucketIndex+1] = value;
        }
        else {
            this._size++;
            bucket.push( key, value );
            this._checkResize();
        }
        return ret;
    };

    method.putAll = method.setAll = function( obj ) {
        this._modCount++;
        var listOfTuples = toListOfTuples( obj );
        this._setAll( listOfTuples );
    };

    method.clear = function() {
        this._modCount++;
        if( this._buckets === null ) {
            return;
        }
        for( var i = 0, l = this._buckets.length; i < l; ++i ) {
            this._buckets[i] = null;
        }
        this._size = 0;
    };

    method.length = method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.toJSON = function() {
        return this.entries();
    };

    method.toString = function() {
        return this.toJSON().toString();
    };

    method.valueOf = function() {
        var it = this.iterator();
        var ret = 31;
        while( it.next() ){
            ret += ( hash( it.key ) ^ hash( it.value ) );
            ret >>>= 0;
        }
        return ret;
    };

    method.iterator = function() {
        return new Iterator( this );
    };

    method.keys = function() {
        var keys = [],
            it = this.iterator();

        while( it.next() ) {
            keys.push( it.key );
        }
        return keys;
    };

    method.values = function() {
        var values = [],
            it = this.iterator();

        while( it.next() ) {
            values.push( it.value );
        }
        return values;
    };

    method.entries = function() {
        var entries = [],
        it = this.iterator();

        while( it.next() ) {
            entries.push( [it.key, it.value] );
        }
        return entries;
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this._map = map;
            this._modCount = map._modCount;
            this._indexDelta = 1;

            this.moveToStart();
        }

        method._checkModCount = function() {
            if( this._modCount !== this._map._modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method._moveToNextEntry = function() {
            var buckets = this._map._buckets,
                bucket;

            if( this._entryIndex > -1 ) {
                bucket = buckets[this._bucketIndex];
                this._entryIndex += (this._indexDelta * 2);
                if( this._entryIndex >= bucket.length ) {
                    this._entryIndex = 0;
                    for( var i = this._bucketIndex + 1, l = buckets.length; i < l; ++i ) {
                        bucket = buckets[i];

                        if( bucket !== null && bucket.length ) {
                            this._bucketIndex = i;
                            bucket = buckets[i];
                            this.key = bucket[0];
                            this.value = bucket[1];
                            break;
                        }
                    }
                }
                else {
                    this.key = bucket[this._entryIndex];
                    this.value = bucket[this._entryIndex + 1];
                }
            }
            else {
                for( var i = this._bucketIndex, l = buckets.length; i < l; ++i ) {
                    bucket = buckets[i];

                    if( bucket !== null && bucket.length ) {
                        this._bucketIndex = i;
                        this._entryIndex = 0;
                        this.key = bucket[0];
                        this.value = bucket[1];
                        break;
                    }
                }
            }
        };

        method._moveToPrevEntry = function() {
            var buckets = this._map._buckets,
                bucket;

            if( this._entryIndex > -1 ) {
                bucket = buckets[this._bucketIndex];
                this._entryIndex -= 2;
                if( this._entryIndex < 0 ) {
                    for( var i = this._bucketIndex - 1; i >= 0; --i ) {
                        bucket = buckets[i];

                        if( bucket !== null && bucket.length ) {
                            this._bucketIndex = i;
                            this._entryIndex = bucket.length - 2;
                            bucket = buckets[i];
                            this.key = bucket[this._entryIndex];
                            this.value = bucket[this._entryIndex + 1];
                            break;
                        }
                    }
                }
                else {
                    this.key = bucket[this._entryIndex];
                    this.value = bucket[this._entryIndex + 1];
                }
            }
            else {
                for( var i = this._bucketIndex; i >= 0; --i ) {
                    bucket = buckets[i];

                    if( bucket !== null && bucket.length ) {
                        this._bucketIndex = i;
                        this._entryIndex = bucket.length - 2;
                        this.key = bucket[this._entryIndex];
                        this.value = bucket[this._entryIndex + 1];
                        break;
                    }
                }
            }
        };

        //API

        method.next = function() {
            this._checkModCount();
            this._index += this._indexDelta;

            if( this._index >= this._map._size ) {
                this.moveToEnd();
                return false;
            }

            this._moveToNextEntry();
            this.index = this._index;

            this._indexDelta = 1;

            return true;
        };

        method.prev = function() {
            this._checkModCount();
            this._index--;

            if( this._index < 0 ||
                this._index >= this._map._size ) {
                this.moveToStart();
                return false;
            }

            this._moveToPrevEntry();
            this.index = this._index;


            return true;
        };

        method.moveToStart = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._bucketIndex = 0;
            this._entryIndex = -1;

            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._bucketIndex = this._map._capacity - 1;
            this._entryIndex = -1;

            return this;
        };

        method["delete"] = method.remove = function() {
            this._checkModCount();

            if( this._index < 0 ||
                this._index >= this._map._size ||
                this.key === void 0 ) {

                return;
            }
            var ret = this._map.remove( this.key );
            this._modCount = this._map._modCount;
            this.key = this.value = void 0;
            this._indexDelta = 0;
            this.index = -1;

            return ret;
        };

        return Iterator;
    })();

    Map.hashString = hashString;
    Map.hashNumber = hashNumber;
    Map.hashBoolean = hashBoolean;
    Map.hash = hash;

    return Map;
})();