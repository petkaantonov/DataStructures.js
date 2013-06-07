/* global Buffer, uid, MapForEach, toListOfTuples,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, MapValueOf,
    MapToJSON, MapToString */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    var haveTypedArrays = typeof ArrayBuffer !== "undefined" &&
            typeof Uint32Array !== "undefined" &&
            typeof Float64Array !== "undefined";

    function pow2AtLeast( n ) {
        n = n >>> 0;
        n = n - 1;
        n = n | (n >> 1);
        n = n | (n >> 2);
        n = n | (n >> 4);
        n = n | (n >> 8);
        n = n | (n >> 16);
        return n + 1;
    }

    function hashBoolean( bool ) {
        return bool | 0;
    }

    function hashString( str ) {
        var h = 5381,
            i = 0;

        for( var i = 0, l = str.length; i < l; ++i ) {
            h = (((h << 5) + h ) ^ str.charCodeAt( i ) );
        }

        return h;
    }

    var hashFloat = (function() {
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
            //No support of reading the bits of a double directly as 2 unsigned ints
            return function hashFloat( num ) {
                return num | 0;
            };
        }
    })();

    function hashObject( obj ) {
        if( obj === null ) {
            return 0;
        }
        var ret;
        //valueOf returned a number
        if( ( ret = obj.valueOf() ) !== obj ) {
            return ret;
        }
        return uid( obj );
    }

    function hash( val, tableSize ) {
        switch( typeof val ) {
        case "number":
            if( ( val | 0 ) === val ) {
                return val & ( tableSize - 1 );
            }
            return hashFloat( val ) & ( tableSize - 1 );
        case "string":
            return hashString( val ) & ( tableSize - 1 );
        case "boolean":
            return hashBoolean( val ) & ( tableSize - 1 );
        default:
            return hashObject( val ) & ( tableSize - 1 );
        }
    }

    function equals( key1, key2 ) {
        return key1 === key2;
    }

    function clampCapacity( capacity ) {
        return Math.max( DEFAULT_CAPACITY, Math.min( MAX_CAPACITY, capacity ) );
    }

    var DEFAULT_CAPACITY = 1 << 4;
    var MAX_CAPACITY = 1 << 30;

    var method = Map.prototype;
    function Map( capacity, equality ) {
        this._buckets = null;
        this._size = 0;
        this._modCount = 0;
        this._capacity = DEFAULT_CAPACITY;
        this._equality = equals;
        this._init( capacity, equality );
    }

    method._init = function _init( capacity, equality ) {
        if( typeof capacity === "function" ) {
            var tmp = equality;
            equality = capacity;
            capacity = tmp;
        }

        if( typeof equality === "function" ) {
            this._equality = equality;
        }

        if( capacity == null ) {
            return;
        }

        switch( typeof capacity ) {
        case "number":
            this._capacity = clampCapacity( pow2AtLeast( capacity ) );
            break;
        case "object":
            var tuples = toListOfTuples( capacity );
            var size = tuples.length;
            var capacity = pow2AtLeast( size );
            if( ( ( size << 2 ) - size ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._capacity = capacity;
            this._setAll( tuples );
            break;
        }
    };

    method._makeBuckets = function _makeBuckets() {
        var capacity = this._capacity;
                                //kInitialMaxFastElementArray = 100000
        var b = this._buckets = new Array( capacity < 99999 ? capacity : 0 );

        for( var i = 0; i < capacity; ++i ) {
            b[i] = null;
        }
    };

    method._keyAsBucketIndex = function _keyAsBucketIndex( key ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hash( key, this._capacity );
    };

    method._resized = function _resized( oldBuckets ) {
        var newBuckets = this._buckets,
            oldLength = oldBuckets.length;

        for( var i = 0; i < oldLength; ++i ) {
            var entry = oldBuckets[i];
            while( entry !== null ) {
                var bucketIndex = this._keyAsBucketIndex( entry.key ),
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
                                             //Used by Set and OrderedSet
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
            throw new Error( "Cannot use undefined as a key or value" );
        }
        this._modCount++;
        var bucketIndex = this._keyAsBucketIndex( key ),
            ret = void 0,
            oldEntry = this._buckets[bucketIndex],
            entry = this._getEntryWithKey( oldEntry, key );

        if( entry === null ) {
            this._size++;
            this._buckets[ bucketIndex ] = entry = new this._entryType( key, value, oldEntry );
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
        this._buckets = null;
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
            this.key = this.value = void 0;
            this.index = -1;
            this._modCount = map._modCount;

            this._index = -1;
            this._map = map;
            this._backingEntry = null;
            this._currentEntry = null;
            this._bucketIndex = -1;

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
        function Entry( key, value, next ) {
            this.key = key;
            this.value = value;
            this.next = next;
        }

        method.inserted = function inserted() {

        };

        method.removed = function removed() {
            this.key = this.value = this.next = null;
        };

        method.accessed = function accessed() {

        };

        return Entry;
    })();

    method._entryType = Entry;

    Map.hashString = hashString;
    Map.hashFloat = hashFloat;
    Map.hashBoolean = hashBoolean;

    return Map;
})();