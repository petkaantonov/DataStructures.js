/* global Buffer, uid, MapForEach, toListOfTuples, NativeMap, exportCtor,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, MapValueOf,
    MapToJSON, MapToString */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    var haveTypedArrays = typeof ArrayBuffer !== "undefined" &&
            typeof Uint32Array !== "undefined" &&
            typeof Float64Array !== "undefined";

    var pow2AtLeast = function pow2AtLeast( n ) {
        n = n >>> 0;
        n = n - 1;
        n = n | (n >> 1);
        n = n | (n >> 2);
        n = n | (n >> 4);
        n = n | (n >> 8);
        n = n | (n >> 16);
        return n + 1;
    };

    var seeds = [3145739, 6291469, 12582917,
        25165843, 50331653, 100663319,
        201326611, 402653189, 805306457,
        1610612741
    ];

    var random = seeds[( Math.random()*seeds.length ) | 0];

    var hashHash = function hashHash( key, tableSize ) {
        var h = key | 0;
        h =  h ^ (h >>> 20) ^ (h >>> 12);
        return (h ^ (h >>> 7) ^ (h >>> 4)) & (tableSize - 1);
    };


    var hashBoolean = function( bool ) {
        return bool | 0;
    };

    var hashString = function hashString( str ) {
        var h = 5381,
            i = 0;

        for( var i = 0, l = str.length; i < l; ++i ) {
            h = (((h << 5) + h ) +  str.charCodeAt( i ) ) >>> 0;
        }

        return h;
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

        if( haveTypedArrays ) {

            var buffer = new ArrayBuffer( 8 );
            var doubleView = new Float64Array( buffer );
            var Uint32View = new Uint32Array( buffer );

            return function hashFloat( num ) {
                doubleView[0] = num;
                return ( Uint32View[0] ^ Uint32View[1] ) & 0x3FFFFFFF;
            };

        }
        else if( typeof Buffer === "function" &&
                 typeof ((new Buffer()).writeDoubleLE) === "function" ) {

            var buffer = new Buffer( 8 );

            return function hashFloat( num ) {
                buffer.writeDoubleLE( num, 0 );
                return ( buffer.readUInt32LE( 0 ) ^ buffer.readUInt32LE( 4 ) ) & 0x3FFFFFFF;
            };
        }
        else {
            return noSupport;
        }

    })();

    var hashObject = function hashObject( obj ) {
        if( obj === null ) {
            return 0;
        }
        var ret;
        //valueOf returned a number
        if( ( ret = obj.valueOf() ) !== obj ) {
            return ret;
        }
        return uid( obj );
    };

    var hash = function hashFunction( val ) {
        switch( typeof val ) {
        case "number":
            if( ( val | 0 ) === val ) {
                return val & 0x3fffffff;
            }
            return hashNumber( val );
        case "string":
            return hashString( val );
        case "boolean":
            return hashBoolean( val );
        default:
            return hashObject( val );
        }
    };

    var equals = function( key1, key2 ) {
        return key1 === key2;
    };

    var clampCapacity = function( capacity ) {
        return Math.max( DEFAULT_CAPACITY, Math.min( MAX_CAPACITY, capacity ) );
    };

    var DEFAULT_CAPACITY = 1 << 4;
    var MAX_CAPACITY = 1 << 30;

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
            setCapacity = pow2AtLeast( capacity );
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
            var size = tuples.length;
            var capacity = pow2AtLeast( size );
            if( ( ( size << 2 ) - size ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._capacity = capacity;
            this._setAll( tuples );
        }
    }

    method._makeBuckets = function _makeBuckets() {
        var capacity = this._capacity;
        var b = this._buckets = new Array( capacity );

        for( var i = 0; i < capacity; ++i ) {
            b[i] = null;
        }
    };

    method._hashAsBucketIndex = function _hashAsBucketIndex( hash ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hashHash( hash, this._capacity );
    };

    method._keyAsBucketIndex = function _keyAsBucketIndex( key ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hashHash( hash( key ), this._capacity );
    };

    method._resized = function _resized( oldBuckets ) {
        var newBuckets = this._buckets,
            newLen = newBuckets.length,
            oldLength = oldBuckets.length;

        for( var i = 0; i < oldLength; ++i ) {
            var entry = oldBuckets[i];
            while( entry !== null ) {
                var bucketIndex = hashHash( entry.hash, newLen ),
                    next = entry.next;

                entry.next = newBuckets[bucketIndex];
                newBuckets[bucketIndex] = entry;
                entry = next;

            }
            oldBuckets[i] = null;
        }
    };

    method._resizeTo = function _resizeTo( capacity ) {
        capacity = clampCapacity( capacity );
        if( this._capacity >= capacity ) {
            return;
        }
        var oldBuckets = this._buckets;
        this._capacity = capacity;
        this._makeBuckets();

        if( oldBuckets !== null ) {
            this._resized( oldBuckets );
        }
    };

    method._getNextCapacity = function _getNextCapacity() {
        return this._capacity * 2;
    };

    method._isOverCapacity = function _isOverCapacity( size ) {
        return ( ( size << 2 ) - size ) >= ( this._capacity << 1 );
    }; //Load factor of 0.67

    method._checkResize = function _checkResize() {
        if( this._isOverCapacity( this._size ) ) {
            this._resizeTo( this._getNextCapacity() );
        }
    };

    method._getEntryWithKey = function _getEntryWithKey( entry, key ) {
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
    method._setAll = function _setAll( obj, __value ) {
        if( !obj.length ) {
            return;
        }
        var newSize = obj.length + this._size;

        if( this._isOverCapacity( newSize ) ) {
            var capacity = pow2AtLeast( newSize );
            if( ( ( newSize << 2 ) - newSize ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._resizeTo( capacity );
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


    method.clone = function clone() {
        return new this.constructor(
            this.entries(),
            this._equality
        );
    };

    method.containsValue = method.hasValue = function hasValue( value ) {
        if( value === void 0 ) {
            return false;
        }
        var it = this.iterator();
        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.containsKey = method.hasKey = function hasKey( key ) {
        if( key === void 0 ) {
            return false;
        }
        var bucketIndex = this._keyAsBucketIndex( key );
        return this._getEntryWithKey( this._buckets[bucketIndex], key ) !== null;
    };

    method.get = function get( key ) {
        if( key === void 0 ) {
            return void 0;
        }
        var bucketIndex = this._keyAsBucketIndex( key ),
            entry = this._getEntryWithKey( this._buckets[bucketIndex], key );

        if( entry !== null ) {
            entry.accessed( this );
            return entry.value;
        }
        return void 0;
    };


    method["delete"] = method.unset = method.remove = function remove( key ) {
        if( key === void 0 ) {
            return void 0;
        }
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

    method.put = method.set = function set( key, value ) {
        if( key === void 0 || value === void 0) {
            return void 0;
        }
        this._modCount++;
        var h = hash( key ), //Did not inline hash called from hash
            bucketIndex = this._hashAsBucketIndex( h ),
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

    method.putAll = method.setAll = function setAll( obj ) {
        this._modCount++;
        var listOfTuples = toListOfTuples( obj );
        this._setAll( listOfTuples );
    };

    method.clear = function clear() {
        this._modCount++;
        if( this._buckets === null ) {
            return;
        }
        for( var i = 0, l = this._buckets.length; i < l; ++i ) {
            this._buckets[i] = null;
        }
        this._size = 0;
    };

    method.length = method.size = function size() {
        return this._size;
    };

    method.isEmpty = function isEmpty() {
        return this._size === 0;
    };


    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function iterator() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this._map = map;
            this._modCount = map._modCount;
            this._backingEntry = null;
            this.moveToStart();

        }

        method._checkModCount = MapIteratorCheckModCount;

        method._getNextEntryFromEntry = function _getNextEntryFromEntry( entry ) {

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

        method._getNextEntry = function _getNextEntry() {

            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                this._index--;
                return ret;
            }

            return this._getNextEntryFromEntry( this._currentEntry );
        };

        method._getPrevEntry = function _getPrevEntry() {
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

        method.next = function next() {
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

        method.prev = function prev() {
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

        method.moveToStart = function moveToStart() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._bucketIndex = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.moveToEnd = function moveToEnd() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._bucketIndex = this._map._capacity;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.set = method.put = function put( value ) {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            var ret = this.value;
            this._currentEntry.value = this.value = value;
            return ret;
        };

        method["delete"] = method.remove = function remove() {
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

        method.inserted = function inserted() {

        };

        method.removed = function removed() {
            this.key = this.value = null;
        };

        method.accessed = function accessed() {

        };

        return Entry;
    })();

    method._entryType = Entry;

    Map.hashString = hashString;
    Map.hashNumber = hashNumber;
    Map.hashBoolean = hashBoolean;
    Map.hash = hash;

    Map.Native = exportCtor( NativeMap );

    return Map;
})();