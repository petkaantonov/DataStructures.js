/* global Buffer, uid, MapForEach, toListOfTuples,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, MapValueOf,
    MapToJSON, MapToString */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    var haveTypedArrays = typeof ArrayBuffer !== "undefined" &&
            typeof Uint32Array !== "undefined" &&
            typeof Float64Array !== "undefined";

    var Error = global.Error;

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

    var seedTable = (function(){
        var r = new ( typeof Int32Array !== "undefined" ? Int32Array : Array )( 8192 );
        if( typeof crypto !== "undefined" && crypto !== null &&
            typeof crypto.getRandomValues === "function" ) {
            crypto.getRandomValues( r );
            return r;
        }
        else {
            var max = Math.pow( 2, 32 );
            for( var i = 0; i < r.length; ++i ) {
                r[i] = ((Math.random() * max) | 0);
            }
            return r;
        }
    })();

    function hashBoolean( b) {
        var x = seedTable[0];
        var a = (b ? 7 : 3 );
        x = (seedTable[a] ^ x);
        return x;
    }

    function hashString( str ) {
        var x = seedTable[0],
            len = str.length & 0x3FFFFFFF;

        if( len > 8191 ) {
            return hashInt( len );
        }

        for( var i = 0; i < len; ++i ) {
            x = ( ( str.charCodeAt( i ) & 0xFF ) * seedTable[ i ] + x ) | 0;
        }

        return x & 0x3FFFFFFF;
    }


    function hashInt( i ) {
        var r = ( ( seedTable[ ( i & 0xFF) ] ) ^
            ( ( seedTable[ ( ( i >> 8 ) & 0xFF ) | 0x100 ] >> 1) ^
            ( ( seedTable[ ( ( i >> 16 ) & 0xFF ) | 0x200 ] >> 2) ^
            ( ( seedTable[ ( ( i >> 24 ) & 0xFF) | 0x300 ] >> 3) ^
            seedTable[ 0 ] ) ) ) );
        return r & 0x3FFFFFFF;
    }

    if( haveTypedArrays ) {
        var FLOAT_BUFFER = new ArrayBuffer( 8 ),
            FLOAT_BUFFER_FLOAT_VIEW = new Float64Array( FLOAT_BUFFER ),
            FLOAT_BUFFER_INT_VIEW = new Int32Array( FLOAT_BUFFER );

        var hashFloat = function hashFloat( f ) {
            var x = seedTable[0];
            FLOAT_BUFFER_FLOAT_VIEW[0] = f;
            var i = FLOAT_BUFFER_INT_VIEW[0];
            var a = ((i >> 24) & 0xFF) | 0x700;
            x = (seedTable[a] >> 7) ^ x;
            a = ((i >> 16) & 0xFF) | 0x600;
            x = (seedTable[a] >> 6) ^ x;
            a = ((i >> 8) & 0xFF) | 0x500;
            x = (seedTable[a] >> 5) ^ x;
            a = (i & 0xFF) | 0x400;
            x = (seedTable[a] >> 4) ^ x;
            i = FLOAT_BUFFER_INT_VIEW[1];
            a = ((i >> 24) & 0xFF) | 0x300;
            x = (seedTable[a] >> 3) ^ x;
            a = ((i >> 16) & 0xFF) | 0x200;
            x = (seedTable[a] >> 2) ^ x;
            a = ((i >> 8) & 0xFF) | 0x100;
            x = (seedTable[a] >> 1) ^ x;
            a = (i & 0xFF);
            x = (seedTable[a]) ^ x;
            return x & 0x3FFFFFFF;
        }
    }
    else {
        var hashFloat = hashInt;
    }

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
        var t = typeof val;
        if( t === "string" ) {
            return hashString( val ) & ( tableSize - 1 );
        }
        else if( t === "number" ) {
            if( ( val | 0 ) === val ) {
                return hashInt( val & 0x3FFFFFFF) & ( tableSize - 1 );
            }
            return hashFloat( val ) & ( tableSize - 1 );
        }
        else if( t === "boolean" ) {
            return hashBoolean( val ) & ( tableSize - 1 );
        }
        else {
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
            this._makeBuckets();
            return;
        }

        switch( typeof capacity ) {
        case "number":
            this._capacity = clampCapacity( pow2AtLeast( capacity ) );
            this._makeBuckets();
            break;
        case "object":
            var tuples = toListOfTuples( capacity );
            var size = tuples.length;
            var capacity = pow2AtLeast( size );
            if( ( ( size << 2 ) - size ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._capacity = capacity;
            this._makeBuckets();
            this._setAll( tuples );
            break;
        default:
            this._makeBuckets();
        }



    };

    method._makeBuckets = function _makeBuckets() {
        var length = this._capacity << 1;

        var b = this._buckets = new Array( length < 100000 ? length : 0 );

        if( length >= 100000 ) {
            for( var i = 0; i < length; ++i ) {
                b[i] = void 0;
            }
        }
    };

    method._resized = function _resized( oldBuckets ) {
        var newBuckets = this._buckets,
            oldLength = oldBuckets.length;

        for( var i = 0; i < oldLength; i+=2 ) {

            var key = oldBuckets[i];
            if( key !== void 0) {
                var newIndex = hash( key, this._capacity );

                while( newBuckets[ newIndex << 1 ] !== void 0 ) {
                    newIndex = ( this._capacity - 1 ) & ( newIndex + 1 );
                }
                newBuckets[ newIndex << 1 ] = oldBuckets[ i ];
                newBuckets[ ( newIndex << 1 ) + 1 ] = oldBuckets[ i + 1 ];

                oldBuckets[i] = oldBuckets[i+1] = void 0;
            }
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
        return (this._capacity < 200000 ? this._capacity << 2 : this._capacity << 1);
    };

    method._isOverCapacity = function _isOverCapacity( size ) {
        return ( ( size << 2 ) - size ) >= ( this._capacity << 1 );
    }; //Load factor of 0.67

    method._checkResize = function _checkResize() {
        if( this._isOverCapacity( this._size ) ) {
            this._resizeTo( this._getNextCapacity() );
        }
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
                capacity <<= 1;
                if( capacity < 100000 ) {
                    capacity <<= 1;
                }
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
        return this.get( key ) !== void 0;
    };

    method.get = function get( key ) {
        var capacity = this._capacity,
            buckets = this._buckets,
            bucketIndex = hash( key, capacity );

        while( true ) {
            var k = buckets[ bucketIndex << 1 ];

            if( k === void 0 ) {
                return void 0;
            }
            else if( this._equality( k, key ) ) {
                return buckets[ ( bucketIndex << 1 ) + 1 ];
            }
            bucketIndex = ( 1 + bucketIndex ) & ( capacity - 1 );

        }
    };

    method.put = method.set = function set( key, value ) {
        if( key === void 0 || value === void 0 ) {
            throw new Error( "Cannot use undefined as a key or value" );
        }
        this._modCount++;
        var bucketIndex = hash( key, this._capacity ),
            capacity = this._capacity - 1,
            buckets = this._buckets;
        while( true ) {
            var k = buckets[ bucketIndex << 1 ];

            if( k === void 0 ) {
                //Insertion
                buckets[ bucketIndex << 1 ] = key;
                buckets[ ( bucketIndex << 1 ) + 1 ] = value;
                this._size++;
                this._checkResize();
                return void 0;
            }
            else if( this._equality( k, key ) ) {
                //update
                var ret = buckets[ ( bucketIndex << 1 ) + 1 ];
                buckets[ ( bucketIndex << 1 ) + 1 ] = value;
                return ret;
            }

            bucketIndex = ( 1 + bucketIndex ) & capacity;
        }
    };


    //From http://en.wikipedia.org/wiki/Open_addressing
    method["delete"] = method.unset = method.remove = function remove( key ) {
        this._modCount++;
        var bucketIndex = hash( key, this._capacity ),
            capacity = this._capacity - 1,
            buckets = this._buckets;
        while( true ) {
            var k = buckets[ bucketIndex << 1 ];

            if( k === void 0 ) {
                //key is not in table
                return void 0;
            }
            else if( this._equality( k, key ) ) {
                break;
            }

            bucketIndex = ( 1 + bucketIndex ) & capacity;
        }

        var entryIndex = bucketIndex;
        var ret = buckets[ ( bucketIndex << 1 ) + 1 ];
        buckets[ ( bucketIndex << 1 ) ] = buckets[ ( bucketIndex << 1 ) + 1 ] = void 0;
        while( true ) {
            entryIndex = ( 1 + entryIndex ) & capacity;

            var slotKey = buckets[ entryIndex << 1 ];

            if( slotKey === void 0 ) {
                break;
            }

            var k = hash( slotKey, capacity + 1 );

            if ( ( bucketIndex <= entryIndex ) ?
                ( ( bucketIndex < k ) && ( k <= entryIndex ) ) :
                ( ( bucketIndex < k ) || ( k <= entryIndex ) ) ) {
                continue;
            }
            buckets[ ( bucketIndex << 1 ) ] = buckets[ ( entryIndex << 1 ) ];
            buckets[ ( bucketIndex << 1 ) + 1 ] = buckets[ ( entryIndex << 1 ) + 1 ];
            bucketIndex = entryIndex;
            buckets[ ( bucketIndex << 1 ) ] = buckets[ ( bucketIndex << 1 ) + 1 ] = void 0;
        }

        this._size--;
        return ret;
    };



    method.putAll = method.setAll = function setAll( obj ) {
        this._modCount++;
        var listOfTuples = toListOfTuples( obj );
        this._setAll( listOfTuples );
    };

    method.clear = function clear() {
        this._modCount++;
        this._makeBuckets();
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

            this._indexDelta = 1;
            this._index = -1;
            this._map = map;
            this._bucketIndex = -1;
        }

        method._checkModCount = MapIteratorCheckModCount;

        method._moveToNextBucketIndex = function _moveToNextBucketIndex() {
            var i = ( this._bucketIndex << 1 ) + ( this._indexDelta << 1 ),
                b = this._map._buckets,
                l = b.length;
            for( ; i < l; i += 2 ) {
                if( b[i] !== void 0 ) {
                    this.key = b[i];
                    this.value = b[i+1];
                    this._bucketIndex = i >> 1;
                    break;
                }
            }
        };

        method._moveToPrevBucketIndex = function _moveToPrevBucketIndex() {
            var i = ( this._bucketIndex << 1 ) - 2,
                b = this._map._buckets;
            for( ; i >= 0; i -= 2 ) {
                if( b[i] !== void 0 ) {
                    this.key = b[i];
                    this.value = b[i+1];
                    this._bucketIndex = i >> 1;
                    break;
                }
            }
        };

        //API

        method.next = function next() {
            this._checkModCount();
            this._index += this._indexDelta;

            if( this._index >= this._map._size ) {
                this.moveToEnd();
                return false;
            }

            this._moveToNextBucketIndex();
            this.index = this._index;
            this._indexDelta = 1;

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

            this._moveToPrevBucketIndex();
            this.index = this._index;

            this._indexDelta = 1;

            return true;
        };

        method.moveToStart = function moveToStart() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._bucketIndex = -1;
            this._indexDelta = 1;

            return this;
        };

        method.moveToEnd = function moveToEnd() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._bucketIndex = this._map._capacity;
            this._indexDelta = 1;

            return this;
        };

        method.set = method.put = function put( value ) {
            this._checkModCount();
            var i = this._bucketIndex;

            if( i < 0 || i >= this._map._capacity ) {
                return;
            }

            var ret = this.value;
            this._map._buckets[ ( i << 1 ) + 1 ] = this.value = value;
            return ret;
        };

        method["delete"] = method.remove = function remove() {
            this._checkModCount();

            var i = this._bucketIndex;

            if( i < 0 || i >= this._map._capacity ) {
                return;
            }

            var ret = this._map.remove( this.key );
            this._modCount = this._map._modCount;
            this.key = this.value = void 0;
            this.index = -1;

            this._indexDelta = 0;

            return ret;
        };

        return Iterator;
    })();

    method._Iterator = Iterator;


    return Map;
})();