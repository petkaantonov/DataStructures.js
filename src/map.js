/* global Buffer, uid, MapForEach, toListOfTuples,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, MapValueOf,
    MapToJSON, MapToString */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
var Error = global.Error;
var LOAD_FACTOR = 0.67;

/**
 * Constructor for Maps. Map is a simple lookup structure without
 * any ordering. Fast lookup, slow iteration. Memory
 * efficient.
 *
 * The undefined value is not supported as a key nor as a value. Use
 * null instead.
 *
 * If ordering is needed consider OrderedMap or SortedMap.
 *
 * Array of tuples initialization:
 *
 * var map = new Map([
 *      [0, "zero"],
 *      [5, "five"],
 *      [10, "ten"],
 *      [13, "thirteen"]
 * ]);
 *
 * @param {int=|Object=|Array.<Tuple>|Map} capacity The initial capacity.
 * Can also be a object, array of tuples or another map to initialize
 * the map.
 * @constructor
 */
function Map( capacity ) {
    this._buckets = null;
    this._size = 0;
    this._modCount = 0;
    this._capacity = DEFAULT_CAPACITY;
    this._equality = equality.simpleEquals;
    this._usingSimpleEquals = true;
    this._init( capacity );
}
var method = Map.prototype;

/**
 * Internal.
 *
 * @param {int=} capacity Description of capacity parameter.
 * @return {void}
 *
 */
method._init = function _init( capacity ) {
    if( capacity == null ) {
        this._makeBuckets();
        return;
    }

    switch( typeof capacity ) {
    case "number":
        this._capacity = clampCapacity( pow2AtLeast( capacity / LOAD_FACTOR ) );
        this._makeBuckets();
        break;
    case "object":
        var tuples = toListOfTuples( capacity );
        var size = tuples.length;
        this._capacity = pow2AtLeast( size / LOAD_FACTOR );
        this._makeBuckets();
        this._setAll( tuples );
        break;
    default:
        this._makeBuckets();
    }
};

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._checkEquals = function _checkEquals() {
    if( this._usingSimpleEquals === true ) {
        this._usingSimpleEquals = false;
        this._equality = equality.equals;
    }
};

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._makeBuckets = function _makeBuckets() {
    var length = this._capacity << 1;

    var b = this._buckets = new Array( length < 100000 ? length : 0 );

    if( length >= 100000 ) {
        for( var i = 0; i < length; ++i ) {
            b[i] = void 0;
        }
    }
};

/**
 * Internal.
 *
 * @param {Array.<dynamic>} oldBuckets Description of oldBuckets parameter.
 * @return {void}
 *
 */
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

/**
 * Internal.
 *
 * @param {int} capacity Description of capacity parameter.
 * @return {void}
 *
 */
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

/**
 * Internal.
 *
 * @return {int}
 *
 */
method._getNextCapacity = function _getNextCapacity() {
    return (this._capacity < 200000 ?
        this._capacity << 2 :
        this._capacity << 1);
};

/**
 * Internal.
 *
 * @param {int} size Description of size parameter.
 * @return {boolean}
 *
 */
method._isOverCapacity = function _isOverCapacity( size ) {
    return ( ( size << 2 ) - size ) >= ( this._capacity << 1 );
}; //Load factor of 0.67

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._checkResize = function _checkResize() {
    if( this._isOverCapacity( this._size ) ) {
        this._resizeTo( this._getNextCapacity() );
    }
};

/**
 * Internal.
 *
 * @param {Array.<Tuple>} obj Description of obj parameter.
 * @return {void}
 *
 */
method._setAll = function _setAll( obj ) {
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

    for( var i = 0; i < obj.length; ++i ) {
        this.set( obj[ i ][ 0 ], obj[ i ][ 1 ] );
    }

};

//API

/**
 * Simple way to iterate the map. The callback fn receives arguments:
 *
 * {dynamic} value, {dynamic} key, {integer} index
 *
 * Iteration can be very slow in an unordered map.
 *
 * @param {function} fn Description of fn parameter.
 * @param {Object=} ctx Description of ctx parameter.
 * @return {void}
 *
 */
method.forEach = MapForEach;

/**
 * Returns a shallow clone of the map.
 *
 * @return {Map}
 *
 */
method.clone = function clone() {
    return new this.constructor( this.entries() );
};

/**
 * See if the value is contained in the map.
 *
 * Iteration can be very slow in an unordered map.
 *
 * @param {dynamic} value The value to lookup.
 * @return {boolean}
 *
 */
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

/**
 * See if the key is contained in the map.
 *
 * @param {dynamic} key The key to lookup.
 * @return {boolean}
 *
 */
method.containsKey = method.hasKey = function hasKey( key ) {
    return this.get( key ) !== void 0;
};

/**
 * Get the value associated with the given key in this map.
 *
 * Returns undefined if not found. Key cannot be undefined.
 *
 * @param {dynamic} key The key to lookup value for.
 * @return {dynamic}
 * @return {void}
 *
 */
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

/**
 * Associate a value with a key. If the key is already in the
 * map, that key is updated with the given value. Otherwise a
 * new entry is added.
 *
 * If a value was updated, returns the old value. If the key was
 * inserted into the map, returns undefined.
 *
 * The undefined value is not supported as a key nor as a value. Use
 * null instead.
 *
 * @param {dynamic} key The key to associate with value.
 * @param {dynamic} value The value to associate with key.
 * @return {dynamic}
 * @return {void}
 * @throws {Error} When key or value is undefined
 *
 */
method.put = method.set = function set( key, value ) {
    if( key === void 0 || value === void 0 ) {
        throw new Error( "Cannot use undefined as a key or value" );
    }
    if( isArray( key ) ) {
        this._checkEquals();
    }

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
            this._modCount++;
            return void 0;
        }
        else if( this._equality( k, key ) === true ) {

            //update
            var ret = buckets[ ( bucketIndex << 1 ) + 1 ];
            buckets[ ( bucketIndex << 1 ) + 1 ] = value;
            this._modCount++;
            return ret;
        }

        bucketIndex = ( 1 + bucketIndex ) & capacity;
    }
};

/**
 * Removes a value associated with the given key in the map. If the
 * key is not in the map, returns undefined. If the key is in the map,
 * returns the value associated with the key.
 *
 * You can check if the removal was successful by checking
 *
 * map.remove( myKey ) !== void 0
 *
 * The undefined value as a key or value is not supported. Use null instead.
 *
 * @param {dynamic} key The key to remove from the map.
 * @return {dynamic}
 * @return {void}
 *
 */
//Linear probing with step of 1 can use
//the instant clean-up algorithm from
//http://en.wikipedia.org/wiki/Open_addressing
//instead of marking slots as deleted.
method["delete"] = method.unset = method.remove = function remove( key ) {
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

    buckets[ ( bucketIndex << 1 ) ] =
        buckets[ ( bucketIndex << 1 ) + 1 ] = void 0;

    this._modCount++;

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
        buckets[ ( bucketIndex << 1 ) + 1 ] =
            buckets[ ( entryIndex << 1 ) + 1 ];

        bucketIndex = entryIndex;

        buckets[ ( bucketIndex << 1 ) ] =
            buckets[ ( bucketIndex << 1 ) + 1 ] = void 0;
    }

    this._size--;
    return ret;
};

/**
 * Insert the given key-value pairs into the map. Can be given in the form
 * of an array of tuples, another Map, or an Object which will be
 * reflectively iterated over for string keys.
 *
 * Array of tuples example:
 *
 * map.setAll([
 *      [0, "zero"],
 *      [5, "five"],
 *      [10, "ten"],
 *      [13, "thirteen"]
 * ]);
 *
 * The array of tuples syntax supports all types of keys, not just strings.
 *
 * @param {Array.<Tuple>|Map|Object} obj Description of obj parameter.
 * @return {void}
 *
 */
method.putAll = method.setAll = function setAll( obj ) {
    this._modCount++;
    var listOfTuples = toListOfTuples( obj );
    this._setAll( listOfTuples );
};

/**
 * Remove everything in the map.
 *
 * @return {void}
 *
 */
method.clear = function clear() {
    this._modCount++;
    this._capacity = DEFAULT_CAPACITY;
    this._size = 0;
    this._makeBuckets();
};

/**
 * Returns the amount of items in the map.
 *
 * @return {int}
 *
 */
method.length = method.size = function size() {
    return this._size;
};

/**
 * See if the map doesn't contain anything.
 *
 * @return {boolean}
 *
 */
method.isEmpty = function isEmpty() {
    return this._size === 0;
};

/**
 * Automatically called by JSON.stringify. If you later parse the JSON
 * you can pass the array of tuples to a map constructor.
 *
 * @return {Array.<Tuple>}
 *
 */
method.toJSON = MapToJSON;

/**
 * Returns a string representation of the map.
 *
 * @return {String}
 *
 */
method.toString = MapToString;

/**
 * Returns a hash code for the map.
 *
 * @return {int}
 *
 */
method.valueOf = MapValueOf;

/**
 * Returns the keys in the map as an array.
 *
 * Iteration can be very slow in an unordered map.
 *
 * @return {Array.<dynamic>}
 *
 */
method.keys = MapKeys;

/**
 * Returns the values in the map as an array.
 *
 * Iteration can be very slow in an unordered map.
 *
 * @return {Array.<dynamic>}
 *
 */
method.values = MapValues;

/**
 * Returns the key-value pairs in the map as an array of tuples.
 *
 * Iteration can be very slow in an unordered map.
 *
 * @return {Array.<Tuple>}
 *
 */
method.entries = MapEntries;

/**
 * Returns an Iterator for the map. The iterator will become invalid
 * if the map is modified outside that iterator.
 *
 * Iteration can be very slow in an unordered map.
 *
 * @return {MapIterator}
 *
 */
method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {
    /**
     * Iterator constructor for the unordered map.
     *
     * If the iterator cursor is currently pointing at a valid
     * entry, you can retrieve the entry's key, value and index
     * from the iterator .key, .value and .index properties
     * respectively.
     *
     * For performance, they are just simple properties but
     * they are meant to be read-only.
     *
     * You may reset the cursor at no cost to the beginning (
     * .moveToStart()) or to the end (.moveToEnd()).
     *
     * You may move the cursor one item forward (.next())
     * or backward (.prev()).
     *
     * Example:
     *
     * var it = map.iterator();
     *
     * while( it.next() ) {
     *      console.log( it.key, it.value, it.index );
     * }
     * //Cursor is now *after* the last entry
     * while( it.prev() ) { //Iterate backwards
     *      console.log( it.key, it.value, it.index );
     * }
     * //Cursor is now *before*the first entry
     *
     * Iteration can be very slow in an unordered map.
     *
     * @param {Map} map Description of map parameter.
     * @constructor
     */
    function Iterator( map ) {
        this.key = this.value = void 0;
        this.index = -1;
        this._modCount = map._modCount;

        this._indexDelta = 1;
        this._index = -1;
        this._map = map;
        this._bucketIndex = -1;
    }
    var method = Iterator.prototype;

    /**
     * Internal
     *
     * @return {void}
     *
     */
    method._checkModCount = MapIteratorCheckModCount;

    /**
     * Internal.
     *
     * @return {void}
     *
     */
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

    /**
     * Internal.
     *
     * @return {void}
     *
     */
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

    /**
     * Move the cursor forward by one position. Returns true if the cursor is
     * pointing at a valid entry. Returns false otherwise.
     *
     * @return {boolean}
     *
     */
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

    /**
     * Move the cursor backward by one position. Returns true if the cursor is
     * pointing at a valid entry. Returns false otherwise.
     *
     * @return {boolean}
     *
     */
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

    /**
     * Move the cursor before the first entry. The cursor is not
     * pointing at a valid entry, you may move to the first entry after
     * calling this method by calling .next().
     *
     * This method operates in constant time.
     *
     * @return {MapIterator}
     *
     */
    method.moveToStart = function moveToStart() {
        this._checkModCount();
        this.key = this.value = void 0;
        this.index = -1;
        this._index = -1;
        this._bucketIndex = -1;
        this._indexDelta = 1;

        return this;
    };

    /**
     * Move the cursor after the last entry. The cursor is not pointing at
     * a valid entry, you may move to the last entry after calling this
     * method by calling .prev().
     *
     * This method operates in constant time.
     *
     * @return {MapIterator}
     *
     */
    method.moveToEnd = function moveToEnd() {
        this._checkModCount();
        this.key = this.value = void 0;
        this._index = this._map._size;
        this.index = -1;
        this._bucketIndex = this._map._capacity;
        this._indexDelta = 1;

        return this;
    };

    /**
     * If the cursor is pointing at a valid entry, you may update
     * the entry's value with this method without invalidating
     * the iterator.
     *
     * An iterator becomes invalid if the map is modified behind
     * its back.
     *
     * You may call this method multiple times while the cursor
     * is pointing at the same entry, with each call replacing the
     * last call's value for the key.
     *
     * Returns the previous value that was associated with the key.
     * Returns undefined if the cursor was not pointing at an entry.
     *
     * @param {dynamic} value The value to associate
     * with the current cursor's key in the map.
     * @return {dynamic}
     * @return {void}
     *
     */
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

    /**
     * If the cursor is pointing at a valid entry, you may delete
     * the entry's associated key-value mapping from the map with
     * this method without invalidating the iterator.
     *
     * An iterator becomes invalid if the map is modified behind
     * its back.
     *
     * After successfully calling this method (deletion happend),
     * the cursor does not point at anything. After deletion, you
     * may move the cursor normally with the cursor traversal
     * methods.
     *
     * If deletion happened, returns the value that was associated
     * with the deleted key. Returns undefined otherwise.
     *
     * @return {dynamic}
     * @return {void}
     *
     */
    method["delete"] = method.remove = method.unset = function remove() {
        this._checkModCount();

        var i = this._bucketIndex;

        if( i < 0 || i >= this._map._capacity ||
            this.key === void 0 ) {
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


return Map;})();