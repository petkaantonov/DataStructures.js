/* global MapIteratorCheckModCount, DEFAULT_CAPACITY, isArray,
    pow2AtLeast, hash, equality */
/* exported OrderedMap */
var OrderedMap = (function() {

var INSERTION_ORDER = OrderedMap._INSERTION_ORDER = {};
var ACCESS_ORDER = OrderedMap._ACCESS_ORDER = {};

/**
 * Constructor for ordered maps. Ordered map is like map except
 * it has an inherent order. The inherent order is by default
 * the order entries are inserted into the map.
 *
 * You may use OrderedMap.inAccessOrder() constructor to construct
 * an ordered map that is ordered according to access order. Any
 * access will bump the target entry at the end of the map.
 *
 * Compared to Map, OrderedMap is less memory efficient,
 * lookup is slightly slower but iteration is faster.
 *
 * The undefined value is not supported as a key nor as a value. Use
 * null instead.
 *
 * Ordering gives a meaning to operations like firstKey, firstValue,
 * lastKey, lastValue, nthKey, nthValue, indexOfKey, indexOfValue and so on.
 *
 * Array of tuples initialization:
 *
 * var map = OrderedMap([
 *      [0, "zero"],
 *      [5, "five"],
 *      [10, "ten"],
 *      [13, "thirteen"]
 * ]);
 *
 * @param {int=|Object=|Array.<Tuple>|Map} capacity The initial capacity.
 * Can also be a object, array of tuples or another map to initialize
 * the ordered map.
 * @constructor
 */
function OrderedMap( capacity ) {
    this._buckets = null;
    this._size = 0;
    this._modCount = 0;
    this._capacity = DEFAULT_CAPACITY;
    this._equality = equality.simpleEquals;
    this._usingSimpleEquals = true;
    this._ordering = INSERTION_ORDER;
    this._firstEntry = this._lastEntry = null;
    this._init( capacity );
}
var method = OrderedMap.prototype;

/**
 * Constructs an ordered map that is ordered according
 * to accesses.
 * @param {int=|Object=|Array.<Tuple>|Map} capacity The initial capacity.
 * Can also be a object, array of tuples or another map to initialize
 * the ordered map.
 */
OrderedMap.inAccessOrder = function inAccessOrder( capacity ) {
    var ret = new OrderedMap( capacity );
    ret._ordering = ACCESS_ORDER;
    return ret;
};


method._init = Map.prototype._init;
method._checkEquals = Map.prototype._checkEquals;
method._resizeTo = Map.prototype._resizeTo;
method._getNextCapacity = Map.prototype._getNextCapacity;
method._isOverCapacity = Map.prototype._isOverCapacity;
method._checkResize = Map.prototype._checkResize;

/**
 * Internal.
 *
 *
 */
method._resized = function _resized() {
    var newBuckets = this._buckets,
        entry = this._firstEntry;

    while( entry !== null ) {
        var bucketIndex = this._keyAsBucketIndex( entry.key );

        entry.next = newBuckets[bucketIndex];
        newBuckets[bucketIndex] = entry;

        entry = entry.nextEntry;
    }
};

/**
 * Internal.
 *
 *
 */
method._makeBuckets = function _makeBuckets() {
    var capacity = this._capacity;
    var b = this._buckets = new Array( capacity < 10000 ? capacity : 0 );

    for( var i = 0; i < capacity; ++i ) {
        b[i] = null;
    }
};

/**
 * Internal.
 *
 *
 */
method._keyAsBucketIndex = function _keyAsBucketIndex( key ) {
    if( this._buckets === null ) {
        this._makeBuckets();
    }
    return hash( key, this._capacity );
};

/**
 * Internal.
 *
 *
 */
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

/**
 * Internal.
 *
 *
 */
                        //Used by OrderedSet
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


method.forEach = Map.prototype.forEach;
method.length = method.size = Map.prototype.size;
method.isEmpty = Map.prototype.isEmpty;
method.toJSON = Map.prototype.toJSON;
method.toString = Map.prototype.toString;
method.valueOf = Map.prototype.valueOf;
method.keys = Map.prototype.keys;
method.values = Map.prototype.values;
method.entries = Map.prototype.entries;
method.putAll = method.setAll = Map.prototype.putAll;
method.containsKey = method.hasKey = Map.prototype.hasKey;

/**
 * Returns a shallow clone of the ordered map.
 *
 * @return {OrderedMap}
 *
 */
method.clone = function clone() {
    if( this._ordering === ACCESS_ORDER ) {
        return OrderedMap.inAccessOrder( this.entries() );
    }
    else {
        return new OrderedMap( this.entries() );
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
method.put = method.set = function put( key, value ) {
    if( key === void 0 || value === void 0) {
        throw new Error( "Cannot use undefined as a key or value" );
    }
    if( isArray( key ) ) {
        this._checkEquals();
    }
    var bucketIndex = this._keyAsBucketIndex( key ),
        ret = void 0,
        oldEntry = this._buckets[bucketIndex],
        entry = this._getEntryWithKey( oldEntry, key );

    this._modCount++;
    if( entry === null ) {
        this._size++;
        this._buckets[ bucketIndex ] = entry =
            new Entry( key, value, oldEntry );

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
method["delete"] = method.unset = method.remove = function remove( key ) {
    if( key === void 0 ) {
        return void 0;
    }
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
        this._modCount++;
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

/**
 * Get the value associated with the given key in this map.
 *
 * Returns undefined if not found.
 *
 * Key cannot be undefined. Use null instead.
 *
 * @param {dynamic} key The key to lookup value for.
 * @return {dynamic}
 * @return {void}
 *
 */
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

/**
 * See if the value is contained in the map.
 *
 * @param {dynamic} value The value to lookup.
 * @return {boolean}
 *
 */
method.containsValue = method.hasValue = function hasValue( value ) {
    return this.indexOfValue( value ) !== -1;
};

/**
 * Find the zero-based index of the key in the map. O(n).
 *
 * Returns -1 if the key is not in the map.
 *
 * Key cannot be undefined. Use null instead.
 *
 * @param {dynamic} key They key to lookup index for.
 * @return {int}
 *
 */
method.indexOfKey = function indexOfKey( key ) {
    if( this._firstEntry === null ) {
        return -1;
    }
    var eq = this._equality,
        entry = this._firstEntry,
        i = 0;

    while( entry !== null ) {
        if( eq( entry.key, key ) ) {
            return i;
        }
        i++;
        entry = entry.nextEntry;
    }
    return -1;
};

/**
 * Find the zero-based index of the value in the map. O(n).
 *
 * Returns -1 if the value is not in the map.
 *
 * @param {dynamic} value They value to lookup index for.
 * @return {int}
 *
 */
method.indexOfValue = function indexOfValue( value ) {
    if( this._firstEntry === null ) {
        return -1;
    }
    var entry = this._firstEntry,
        i = 0;

    while( entry !== null ) {
        if( entry.value === value ) {
            return i;
        }
        i++;
        entry = entry.nextEntry;
    }
    return -1;
};

/**
 * Returns the first key in the map. Returns
 * undefined if the map is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.firstKey = function firstKey() {
    if( this._firstEntry === null ) {
        return void 0;
    }
    return this._firstEntry.key;
};

/**
 * Returns the first value in the map. Returns
 * undefined if the map is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.first = function first() {
    return this.get( this.firstKey() );
};

/**
 * Returns the last key in the map. Returns
 * undefined if the map is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.lastKey = function lastKey( ) {
    if( this._firstEntry === null ) {
        return void 0;
    }

    return this._lastEntry.key;
};

/**
 * Returns the last value in the map. Returns
 * undefined if the map is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.last = function last() {
    return this.get( this.lastKey() );
};

/**
 * Returns the nth key (0-based) in the map. Returns
 * undefined if the index is out of bounds. O(N).
 *
 * @return {dynamic}
 *
 */
method.nthKey = function nthKey( index ) {
    if( index < 0 || index >= this._size ) {
        return void 0;
    }
    var entry = this._firstEntry;
    var i = 0;
    while( i < index ) {
        entry = entry.nextEntry;
        i++;
    }
    return entry.key;
};

/**
 * Returns the nth value (0-based) in the map. Returns
 * undefined if the index is out of bounds. O(N).
 *
 * @return {dynamic}
 *
 */
method.nth = method.nthValue = function nth( index ) {
    return this.get( this.nthKey( index ) );
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
    this._firstEntry = this._lastEntry = null;
    this._makeBuckets();
};

/**
 * Returns an Iterator for the map. The iterator will become invalid
 * if the map is modified outside that iterator.
 *
 * @return {MapIterator}
 *
 */
method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {


    /**
     * Iterator constructor for the ordered map.
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
     *
     * @param {OrderedMap} map Description of map parameter.
     * @constructor
     */
    function Iterator( map ) {
        this.key = this.value = void 0;
        this.index = -1;
        this._modCount = map._modCount;

        this._index = -1;
        this._map = map;
        this._backingEntry = null;
        this._currentEntry = null;
    }
    var method = Iterator.prototype;

    /**
     * Internal.
     *
     *
     */
    method._checkModCount = MapIteratorCheckModCount;

    /**
     * Internal.
     *
     *
     */
    method._getNextEntry = function _getNextEntry() {
        if( this._backingEntry !== null ) {
            var ret = this._backingEntry;
            this._backingEntry = null;
            this._index--;
            return ret;
        }
        if( this._currentEntry === null ) {
            return this._map._firstEntry;
        }
        else {
            return this._currentEntry.nextEntry;
        }
    };

    /**
     * Internal.
     *
     *
     */
    method._getPrevEntry = function _getPrevEntry() {
        if( this._backingEntry !== null ) {
            var ret = this._backingEntry;
            this._backingEntry = null;
            return ret.prevEntry;
        }
        if( this._currentEntry === null ) {
            return this._map._lastEntry;
        }
        else {
            return this._currentEntry.prevEntry;
        }
    };

    /**
     * Move the cursor forward by one position. Returns true if the cursor is
     * pointing at a valid entry. Returns false otherwise.
     *
     * @return {boolean}
     *
     */
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
        var entry = this._currentEntry = this._getPrevEntry();

        this.key = entry.key;
        this.value = entry.value;
        this.index = this._index;


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
        this._backingEntry = this._currentEntry = null;

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
        this._backingEntry = this._currentEntry = null;

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

        if( this._currentEntry === null ) {
            return;
        }

        var ret = this.value;
        this._currentEntry.value = this.value = value;
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
    method["delete"] = method.remove = function remove() {
        this._checkModCount();

        if( this._currentEntry === null ) {
            return;
        }
        var entry = this._currentEntry,
            backingEntry,
            ret = entry.value;

        backingEntry = this._backingEntry = entry.nextEntry;

        this._map.remove( this.key );
        this._modCount = this._map._modCount;
        this.key = this.value = void 0;
        this.index = -1;

        if( backingEntry === null ) {
            this.moveToEnd();
        }

        return ret;
    };


    return Iterator;
})();

method._Iterator = Iterator;

var Entry = (function() {

    /**
     * Ordered maps use separate chaining with linked lists
     * to maintain reasonable performance.
     *
     * @constructor
     *
     */
    function Entry( key, value, next ) {
        this.key = key;
        this.value = value;
        this.next = next;

        this.prevEntry = this.nextEntry = null;
    }
    var method = Entry.prototype;

    /**
     * When an entry is inserted, it should be placed
     * at the end for both access order and insert orderd
     * maps.
     *
     * @param {OrderedMap} map The map this entry was inserted
     * into.
     * @return {void}
     *
     */
    method.inserted = function inserted( map ) {
        if( map._firstEntry === null ) {
            map._firstEntry = map._lastEntry = this;
        }
        else if( map._firstEntry === map._lastEntry ) {
            map._lastEntry = this;
            map._firstEntry.nextEntry = this;
            this.prevEntry = map._firstEntry;
        }
        else {
            var last = map._lastEntry;
            map._lastEntry = this;
            last.nextEntry = this;
            this.prevEntry = last;
        }
    };

    /**
     * When an entry is removed, bookkeeping within the map's
     * backing linked list needs to be performed.
     *
     * @param {OrderedMap} map The map this entry was removed
     * from.
     * @return {void}
     */
    method.removed = function removed( map ) {
        var prev = this.prevEntry,
            next = this.nextEntry,
            prevIsNull = prev === null,
            nextIsNull = next === null;

        this.prevEntry = this.nextEntry =
            this.key = this.value = this.next = null;

        if( prevIsNull && nextIsNull ) {
            map._firstEntry = map._lastEntry = null;
        }
        else if( nextIsNull ) {
            map._lastEntry = prev;
            map._lastEntry.nextEntry = null;
        }
        else if( prevIsNull ) {
            map._firstEntry = next;
            map._firstEntry.prevEntry = null;
        }
        else {
            next.prevEntry = prev;
            prev.nextEntry = next;
        }
    };

    /**
     * When an entry is accessed (get or value update), ordered maps
     * using access order have to move the entry to the back.
     *
     * @param {OrderedMap} map The map this entry was accessed in.
     * @return {void}
     */
    method.accessed = function accessed( map ) {
        if( map._ordering === ACCESS_ORDER &&
            map._firstEntry !== null &&
            map._firstEntry !== map._lastEntry &&
            map._lastEntry !== this ) {
            var prev = this.prevEntry,
                next = this.nextEntry;

            if( prev !== null ) {
                prev.nextEntry = next;
            }
            else {
                map._firstEntry = next;
            }
            next.prevEntry = prev;

            var last = map._lastEntry;

            this.nextEntry = null;
            this.prevEntry = last;
            last.nextEntry = this;
            map._lastEntry = this;
        }
    };

    return Entry;
})();

return OrderedMap;})();