/* global Buffer, uid, MapForEach, toListOfTuples */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    //TODO equals,

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
        }
        else {
            var tuples = toListOfTuples( capacity );
            this._capacity = primes.atLeast( tuples.length );
            this._setAll( tuples );
        }
    }

    method._resizesInPlace = false;

    method._makeBuckets = function() {
        var b = this._buckets = new Array( this._capacity );

        for( var i = 0; i < this._capacity; ++i ) {
            b[i] = null;
        }
    };

    method._hashAsBucketIndex = function( hash ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hash % this._capacity;
    };

    method._keyAsBucketIndex = function( key ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hash( key ) % this._capacity;
    };

    method._resized = function( oldBuckets ) {
        var newBuckets = this._buckets,
            newLen = newBuckets.length,
            oldLength = oldBuckets.length;

        for( var i = 0; i < oldLength; ++i ) {
            var entry = oldBuckets[i];
            while( entry !== null ) {
                oldBuckets[i] = null;

                var bucketIndex = entry.hash % newLen,
                    next = entry.next;

                entry.next = newBuckets[bucketIndex];
                newBuckets[bucketIndex] = entry;
                entry = next;

            }
        }
    };

    method._resizeTo = function( capacity ) {
        capacity = clampCapacity( capacity );
        if( this._capacity >= capacity ) {
            return;
        }
        this._capacity = capacity;

        var buckets = this._buckets,
            oldLength;

        if( buckets === null ) {
            this._makeBuckets();
            return;
        }

        //Ordered map can be resized in place
        if( this._resizesInPlace ) {
            oldLength = buckets.length;
            buckets.length = capacity;
            for( var i = oldLength; i < capacity; ++i ) {
                buckets[i] = null;
            }
            this._resized( oldLength );
        }
        else {
            this._makeBuckets();
            this._resized( buckets );
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

    method._getEntryWithKey = function( entry, key ) {
        var eq = this._equality;
        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                return entry;
            }
            entry = entry.next;
        }
        return null;
    };
                                    //Used by set
    method._setAll = function( obj, __value ) {
        if( !obj.length ) {
            return;
        }
        var newSize = obj.length + this._size;

        if( this._isOverCapacity( newSize ) ) {
            this._resizeTo( primes.atLeast( ( 1 + newSize / LOAD_FACTOR ) | 0 ) );
        }

        if( arguments.length > 1 ) {
            for( var i = 0; i < obj.length; ++i ) {
                this.set( obj[i], __value );
            }
        }
        else {
            for( var i = 0; i < obj.length; ++i ) {
                this.set( obj[i][0], obj[i][1] );
            }
        }
    };

    //API

    method.forEach = MapForEach;


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
        var bucketIndex = this._keyAsBucketIndex( key );
        return this._getEntryWithKey( this._buckets[bucketIndex], key ) !== null;
    };

    method.get = function( key ) {
        var bucketIndex = this._keyAsBucketIndex( key ),
            entry = this._getEntryWithKey( this._buckets[bucketIndex], key );

        if( entry !== null ) {
            entry.accessed( this );
            return entry.value;
        }
        return void 0;
    };


    method["delete"] = method.unset = method.remove = function( key ) {
        this._modCount++;
        var bucketIndex = this._keyAsBucketIndex( key ),
            ret = void 0,
            entry = this._buckets[bucketIndex],
            eq = this._equality,
            prevEntry = null;

        var eq = this._equality;

        //Find the entry in the bucket
        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                break;
            }
            prevEntry = entry;
            entry = entry.next;
        }

        //It was found in the bucket, remove
        if( entry !== null ) {
            ret = entry.value;
            if( prevEntry === null) { //It was the first entry in the bucket
                this._buckets[bucketIndex] = entry.next;
            }
            else {
                prevEntry.next = entry.next;
            }
            this._size--;
            entry.removed( this );
        }
        return ret;
    };




    method.put = method.set = function( key, value ) {
        this._modCount++;
        var h = hash( key ),
            bucketIndex = this._hashAsBucketIndex( h),
            ret = void 0,
            oldEntry = this._buckets[bucketIndex],
            entry = this._getEntryWithKey( oldEntry, key );

        if( entry === null ) {
            this._size++;
            this._buckets[ bucketIndex ] = entry = new this._entryType( key, value, oldEntry, h );
            entry.inserted( this );
            this._checkResize();
        }
        else {
            ret = entry.value;
            entry.value = value;
            entry.accessed( this );
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
            this._backingEntry = null;
            this.moveToStart();

        }

        method._checkModCount = function() {
            if( this._modCount !== this._map._modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method._getNextEntryFromEntry = function( entry ) {

            if( entry !== null && entry.next !== null ) {
                return entry.next;
            }

            var buckets = this._map._buckets;

            for( var i = this._bucketIndex + 1, l = buckets.length; i < l; ++i ) {
                entry = buckets[i];

                if( entry !== null ) {
                    this._bucketIndex = i;
                    return entry;
                }
            }

            return null;

        };

        method._getNextEntry = function() {

            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                this._index--;
                return ret;
            }

            return this._getNextEntryFromEntry( this._currentEntry );
        };

        method._getPrevEntry = function() {
            var buckets = this._map._buckets,
                entry = this._currentEntry,
                backingEntry;

            if( entry === null &&
                ( ( backingEntry = this._backingEntry ) !== null ) ) {
                this._backingEntry = null;
                entry = backingEntry;
            }

            if( entry !== null ) {
                var first = buckets[this._bucketIndex];
                if( first !== entry ) {
                    var next = entry;
                    entry = first;
                    while( entry.next !== next ) {
                        entry = entry.next;
                    }
                    return entry;
                }
            }

            for( var i = this._bucketIndex - 1; i >= 0; --i ) {
                entry = buckets[i];

                if( entry !== null ) {
                    this._bucketIndex = i;
                    while( entry.next !== null ) {
                        entry = entry.next;
                    }
                    return entry;
                }
            }

            return entry;
        };

        //API

        method.next = function() {
            this._checkModCount();
            this._index++;

            if( this._backingEntry === null &&
                this._index >= this._map._size ) {
                this.moveToEnd();
                return false;
            }

            var entry = this._currentEntry = this._getNextEntry();

            this.key = entry.key;
            this.value = entry.value;
            this.index = this._index;

            return true;
        };

        method.prev = function() {
            this._checkModCount();
            this._index--;

            if( this._index < 0 ||
                this._map._size === 0 ) {
                this.moveToStart();
                return false;
            }
            var entry = this._currentEntry = this._getPrevEntry();

            this.key = entry.key;
            this.value = entry.value;
            this.index = this._index;


            return true;
        };

        method.moveToStart = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._bucketIndex = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._bucketIndex = this._map._capacity;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.set = method.put = function( value ) {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            var ret = this.value;
            this._currentEntry.value = this.value = value;
            return ret;
        };

        method["delete"] = method.remove = function() {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            this._backingEntry = this._getNextEntryFromEntry( this._currentEntry );
            this._currentEntry = null;
            var ret = this._map.remove( this.key );
            this._modCount = this._map._modCount;

            this.key = this.value = void 0;
            this.index = -1;

            if( this._backingEntry === null ) {
                this.moveToEnd();
            }

            return ret;
        };

        return Iterator;
    })();

    method._Iterator = Iterator;

    var Entry = (function() {
        var method = Entry.prototype;
        function Entry( key, value, next, hash ) {
            this.key = key;
            this.value = value;
            this.next = next;
            this.hash = hash;
        }

        method.inserted = function() {

        };

        method.removed = function() {
            this.key = this.value = null;
        };

        method.accessed = function() {

        };

        return Entry;
    })();

    method._entryType = Entry;

    Map.hashString = hashString;
    Map.hashNumber = hashNumber;
    Map.hashBoolean = hashBoolean;
    Map.hash = hash;

    return Map;
})();