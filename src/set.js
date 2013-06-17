/* global toList, SetForEach,
    SetToJSON, SetToString, SetValueOf, SetIteratorCheckModCount,
    hash, MapValues, isArray, pow2AtLeast,
    clampCapacity, equality, DEFAULT_CAPACITY, LOAD_FACTOR */
/* exported Set */
/* jshint -W079 */
var Set = (function() {
/**
 * Constructor for sets. Set is a unique collection of values, without
 * any ordering. It is not backed by a map and the memory usage is thus
 * incredibly low.
 *
 * The undefined value is not supported as a value. Use
 * null instead.
 *
 * If ordering is needed consider OrderedSet or SortedSet.
 *
 * @param {int=|Array.<dynamic>|Set} capacity The initial capacity.
 * Can also be an array or another set to initialize the set.
 * @constructor
 */
function Set( capacity ) {
    this._buckets = null;
    this._size = 0;
    this._modCount = 0;
    this._capacity = DEFAULT_CAPACITY;
    this._equality = equality.simpleEquals;
    this._usingSimpleEquals = true;
    this._init( capacity );
}
var method = Set.prototype;

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
        this._capacity =
            clampCapacity( pow2AtLeast( capacity / LOAD_FACTOR ) );
        this._makeBuckets();
        break;
    case "object":
        var items = toList( capacity );
        var size = items.length;
        this._capacity = pow2AtLeast( size / LOAD_FACTOR );
        this._makeBuckets();
        this._addAll( items );
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
method._checkEquals = Map.prototype._checkEquals;

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._resizeTo = Map.prototype._resizeTo;

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._getNextCapacity = Map.prototype._getNextCapacity;

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._isOverCapacity = Map.prototype._isOverCapacity;

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._checkResize = Map.prototype._checkResize;

/**
 * Internal.
 *
 * @return {void}
 *
 */
method._makeBuckets = function _makeBuckets() {
    var length = this._capacity << 0;

    var b = this._buckets = new Array( length < 100000 ? length : 0 );

    for( var i = 0; i < length; ++i ) {
        b[i] = void 0;
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

    for( var i = 0; i < oldLength; i++ ) {

        var value = oldBuckets[i];
        if( value !== void 0) {
            var newIndex = hash( value, this._capacity );

            while( newBuckets[ newIndex ] !== void 0 ) {
                newIndex = ( this._capacity - 1 ) & ( newIndex + 1 );
            }
            newBuckets[ newIndex ] = oldBuckets[ i ];
            oldBuckets[ i ] = void 0;
        }
    }
};


/**
 * Internal.
 *
 * @param {Array.<dynamic>} obj Description of obj parameter.
 * @return {void}
 *
 */
method._addAll = function _addAll( obj ) {
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
        this.add( obj[i] );
    }

};

//API
/**
 * Simple way to iterate the set. The callback fn receives arguments:
 *
 * {dynamic} value, {integer} index
 *
 * Iteration can be very slow in an unordered set.
 *
 * @param {function} fn Description of fn parameter.
 * @param {Object=} ctx Description of ctx parameter.
 * @return {void}
 *
 */
method.forEach = SetForEach;

/**
 * Returns a shallow clone of the set.
 *
 * @return {Set}
 *
 */
method.clone = function clone() {
    return new this.constructor(
        this.toArray()
    );
};

/**
 * Add a value into the set. If the value is already in the
 * set, returns false. Returns true otherwise.
 *
 * The undefined value is not supported as a value. Use
 * null instead.
 *
 * @param {dynamic} value The value to add into the set.
 * @return {boolean}
 * @throws {Error} When value is undefined
 *
 */
method.add = function add( value ) {
    if( value === void 0 ) {
        throw new Error( "Cannot use undefined as a value" );
    }
    if( isArray( value ) ) {
        this._checkEquals();
    }
    var bucketIndex = hash( value, this._capacity ),
        capacity = this._capacity - 1,
        buckets = this._buckets;
    while( true ) {
        var k = buckets[ bucketIndex ];

        if( k === void 0 ) {
            buckets[ bucketIndex ] = value;
            this._size++;
            this._checkResize();
            this._modCount++;
            return true;
        }
        else if( this._equality( k, value ) === true ) {
            return false;
        }

        bucketIndex = ( 1 + bucketIndex ) & capacity;
    }
};

/**
 * Removes the given value from the set. If the
 * value is not in the set, returns false. If the value is in the
 * set, the value is removed and true is returned;
 *
 * You can check if the removal was successful by checking
 *
 * set.remove( value ) === true
 *
 * The undefined value as a value is not supported. Use null instead.
 *
 * @param {dynamic} value The value to remove from the set.
 * @return {boolean}
 *
 */
//Linear probing with step of 1 can use
//the instant clean-up algorithm from
//http://en.wikipedia.org/wiki/Open_addressing
//instead of marking slots as deleted.
method["delete"] = method.remove = function remove( value ) {
    var bucketIndex = hash( value, this._capacity ),
        capacity = this._capacity - 1,
        buckets = this._buckets;
    while( true ) {
        var k = buckets[ bucketIndex ];

        if( k === void 0 ) {
            //value is not in table
            return false;
        }
        else if( this._equality( k, value ) ) {
            break;
        }

        bucketIndex = ( 1 + bucketIndex ) & capacity;
    }

    var entryIndex = bucketIndex;
    buckets[ bucketIndex ] = void 0;
    this._modCount++;

    while( true ) {
        entryIndex = ( 1 + entryIndex ) & capacity;

        var slotValue = buckets[ entryIndex ];

        if( slotValue === void 0 ) {
            break;
        }

        var k = hash( slotValue, capacity + 1 );

        if ( ( bucketIndex <= entryIndex ) ?
            ( ( bucketIndex < k ) && ( k <= entryIndex ) ) :
            ( ( bucketIndex < k ) || ( k <= entryIndex ) ) ) {
            continue;
        }

        buckets[ bucketIndex  ] = buckets[ entryIndex ];
        bucketIndex = entryIndex;
        buckets[ bucketIndex ] = void 0;
    }

    this._size--;
    return true;
};

/**
 * Insert the given values into the set. Can be given in the form
 * of an array or another Set.
 *
 *
 * @param {Array.<dynamic>|Set} items Description of items parameter.
 * @return {void}
 *
 */
method.addAll = function addAll( items ) {
    this._addAll( toList( items ) );
};

/**
 * Remove everything in the set.
 *
 * @return {void}
 *
 */
method.clear = Map.prototype.clear;

/**
 * Returns the set as an array.
 *
 * Iteration can be very slow in an unordered set.
 *
 * @return {Array.<dynamic>}
 *
 */
method.values = method.toArray = MapValues;

/**
 * See if the value is contained in this set.
 *
 * Value cannot be undefined.
 *
 * @param {dynamic} value The value to look up.
 * @return {boolean}
 *
 */
method.contains = function contains( value ) {
    var capacity = this._capacity,
        buckets = this._buckets,
        bucketIndex = hash( value, capacity );

    while( true ) {
        var k = buckets[ bucketIndex ];

        if( k === void 0 ) {
            return false;
        }
        else if( this._equality( k, value ) ) {
            return true;
        }
        bucketIndex = ( 1 + bucketIndex ) & ( capacity - 1 );
    }
};

/**
 * Returns the amount of items in the set.
 *
 * @return {int}
 *
 */
method.size = method.length = Map.prototype.size;

/**
 * See if the set doesn't contain anything.
 *
 * @return {boolean}
 *
 */
method.isEmpty = Map.prototype.isEmpty;

/**
 * See if this set is a proper subset of the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.subsetOf = function subsetOf( set ) {
    var it = this.iterator();
    while( it.next() ) {
        if( !set.contains( it.value ) ) {
            return false;
        }
    }
    return this.size() !== set.size();
};

/**
 * See if this set is a proper superset of the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.supersetOf = function supersetOf( set ) {
    return set.subsetOf( this );
};

/**
 * See if this set is fully contained in the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.allContainedIn = function allContainedIn( set ) {
    var it = this.iterator();
    while( it.next() ) {
        if( !set.contains( it.value ) ) {
            return false;
        }
    }
    return true;
};

/**
 * See if this set is fully contains the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.containsAll = function containsAll( set ) {
    return set.allContainedIn( this );
};

/**
 * Returns a hash code for the set.
 *
 * @return {int}
 *
 */
method.valueOf = SetValueOf;

/**
 * Returns a string representation of the set.
 *
 * @return {String}
 *
 */
method.toString = SetToString;

/**
 * Automatically called by JSON.stringify. If you later parse the JSON
 * you can pass the array to a set constructor.
 *
 * @return {Array.<dynamic>}
 *
 */
method.toJSON = SetToJSON;

/**
 * Returns the union of the argument set and this set. The returned
 * set will have all the members that appear in this set, the second
 * set or both.
 *
 * @param {Set} a The set to union this set with.
 * @return {Set}
 *
 */
method.union = function union( a ) {
    var ret = new this.constructor( ( this.size() + a.size() ) / 0.67 );

    var aHas, bHas,
        itA = this.iterator(),
        itB = a.iterator();

    while( true ) {
        if( aHas = itA.next() ) {
            ret.add( itA.value );
        }
        if( bHas = itB.next() ) {
            ret.add( itB.value );
        }

        if( !aHas && !bHas ) {
            break;
        }
    }

    return ret;
};

/**
 * Returns the intersection of the argument set and this set. The returned
 * set will have all the members that appear in both this set and the
 * argument set.
 *
 * @param {Set} a The set to intersect this set with.
 * @return {Set}
 *
 */
method.intersection = function intersection( a ) {
    var ret = new this.constructor( Math.max( this.size(), a.size() ) / 0.67 );

    var src = this.size() < a.size() ? this : a,
        dst = src === a ? this : a,
        it = src.iterator();

    while( it.next() ) {
        if( dst.contains( it.value ) ) {
            ret.add( it.value );
        }
    }

    return ret;
};

/**
 * Returns the relative complement of this set in relation to the argument
 * set. The returned set will have all the members that are in this set
 * but were not in the argument set.
 *
 * Note that set1.complement(set2) is different from set2.complement(set1)
 *
 * @param {Set} a The set to complement this set with.
 * @return {Set}
 *
 */
method.complement = function complement( a ) {
    var ret = new this.constructor( Math.max( this.size(), a.size() ) / 0.67 );

    var it = this.iterator();

    while( it.next() ) {
        if( !a.contains( it.value ) ) {
            ret.add( it.value );
        }
    }
    return ret;
};

/**
 * Returns the symmetrict difference of this set and the argument set.
 * set. The returned set will have all the members that are in this set
 * and the argument set, but not those that are in both sets.
 *
 * This is relatively expensive operation, requiring iteration of both
 * sets currently.
 *
 * @param {Set} a The argument set.
 * @return {Set}
 *
 */
method.difference = function difference( a ) {
    var ret = new this.constructor( Math.max( this.size(), a.size() ) / 0.67 );

    var it = this.iterator();

    while( it.next() ) {
        if( !a.contains( it.value ) ) {
            ret.add( it.value );
        }
    }

    it = a.iterator();

    while( it.next() ) {
        if( !this.contains( it.value ) ) {
            ret.add( it.value );
        }
    }
    return ret;
};

/**
 * Returns an Iterator for the set. The iterator will become invalid
 * if the set is modified outside that iterator.
 *
 * Iteration can be very slow in an unordered set.
 *
 * @return {MapIterator}
 *
 */
method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {
    /**
     * Iterator constructor for the unordered set.
     *
     * If the iterator cursor is currently pointing at a valid
     * entry, you can retrieve the entry's value and index
     * from the iterator .value and .index properties
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
     * var it = set.iterator();
     *
     * while( it.next() ) {
     *      console.log( it.value, it.index );
     * }
     * //Cursor is now *after* the last entry
     * while( it.prev() ) { //Iterate backwards
     *      console.log(  it.value, it.index );
     * }
     * //Cursor is now *before*the first entry
     *
     * Iteration can be very slow in an unordered set.
     *
     * @param {Set} set Description of set parameter.
     * @constructor
     */
    function Iterator( set ) {
        this.value = void 0;
        this.index = -1;
        this._modCount = set._modCount;

        this._indexDelta = 1;
        this._index = -1;
        this._set = set;
        this._bucketIndex = -1;
    }
    var method = Iterator.prototype;

    /**
     * Internal
     *
     * @return {void}
     *
     */
    method._checkModCount = SetIteratorCheckModCount;

    /**
     * Internal.
     *
     * @return {void}
     *
     */
    method._moveToNextBucketIndex = function _moveToNextBucketIndex() {
        var i = this._bucketIndex + this._indexDelta,
            b = this._set._buckets,
            l = b.length;
        for( ; i < l; i ++ ) {
            if( b[i] !== void 0 ) {
                this.value = b[i];
                this._bucketIndex = i;
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
        var i = this._bucketIndex - 1,
            b = this._set._buckets;
        for( ; i >= 0; i -- ) {
            if( b[i] !== void 0 ) {
                this.value = b[i];
                this._bucketIndex = i;
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

        if( this._index >= this._set._size ) {
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
            this._set._size === 0 ) {
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
     * @return {SetIterator}
     *
     */
    method.moveToStart = function moveToStart() {
        this._checkModCount();
        this.value = void 0;
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
     * @return {SetIterator}
     *
     */
    method.moveToEnd = function moveToEnd() {
        this._checkModCount();
        this.value = void 0;
        this._index = this._set._size;
        this.index = -1;
        this._bucketIndex = this._set._capacity;
        this._indexDelta = 1;

        return this;
    };


    /**
     * If the cursor is pointing at a valid entry, you may delete
     * the value from the iterated set without invalidating this
     * iterator.
     *
     * An iterator becomes invalid if the set is modified behind
     * its back.
     *
     * After successfully calling this method (deletion happend),
     * the cursor does not point at anything. After deletion, you
     * may move the cursor normally with the cursor traversal
     * methods.
     *
     * If deletion happened, returns true. Returns false otherwise.
     *
     * @return {boolean}
     * @return {void}
     *
     */
    method["delete"] = method.remove = function remove() {
        this._checkModCount();

        var i = this._bucketIndex;

        if( i < 0 || i >= this._set._capacity ||
            this.value === void 0 ) {
            return false;
        }

        this._set.remove( this.value );
        this._modCount = this._set._modCount;
        this.value = void 0;
        this.index = -1;

        this._indexDelta = 0;

        return true;
    };


    return Iterator;
})();

method._Iterator = Iterator;


return Set;})();
