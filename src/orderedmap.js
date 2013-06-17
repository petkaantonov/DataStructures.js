/* global MapIteratorCheckModCount, DEFAULT_CAPACITY, isArray,
    pow2AtLeast, hash, equality */
/* exported OrderedMap */
var OrderedMap = (function() {

var INSERTION_ORDER = OrderedMap._INSERTION_ORDER = {};
var ACCESS_ORDER = OrderedMap._ACCESS_ORDER = {};

/**
 * Description.
 *
 *
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
 * Description.
 *
 *
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
 * Description.
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
 * Description.
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
 * Description.
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
 * Description.
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
 * Description.
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


method.clone = function clone() {
    if( this._ordering === ACCESS_ORDER ) {
        return OrderedMap.inAccessOrder( this.entries() );
    }
    else {
        return new OrderedMap( this.entries() );
    }
};

/**
 * Description.
 *
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
 * Description.
 *
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
 * Description.
 *
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
 * Description.
 *
 *
 */
method.containsValue = method.hasValue = function hasValue( value ) {
    return this.indexOfValue( value ) !== -1;
};

/**
 * Description.
 *
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
 * Description.
 *
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
 * Description.
 *
 *
 */
method.firstKey = function firstKey() {
    if( this._firstEntry === null ) {
        return void 0;
    }
    return this._firstEntry.key;
};

/**
 * Description.
 *
 *
 */
method.first = function first() {
    return this.get( this.firstKey() );
};

/**
 * Description.
 *
 *
 */
method.lastKey = function lastKey( ) {
    if( this._firstEntry === null ) {
        return void 0;
    }

    return this._lastEntry.key;
};

/**
 * Description.
 *
 *
 */
method.last = function last() {
    return this.get( this.lastKey() );
};

/**
 * Description.
 *
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
 * Description.
 *
 *
 */
method.nth = function nth( index ) {
    return this.get( this.nthKey( index ) );
};


/**
 * Description.
 *
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
 * Description.
 *
 *
 */
method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {


    /**
     * Description.
     *
     *
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
     * Description.
     *
     *
     */
    method._checkModCount = MapIteratorCheckModCount;

    /**
     * Description.
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
     * Description.
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
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
     * Description.
     *
     *
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
     * Description.
     *
     *
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