/* global copyProperties, setIteratorMethods, toList, SetForEach,
    SetToJSON, SetToString, SetValueOf */
/* jshint -W079 */
var Set = (function() {

var method = Set.prototype;


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
        this._capacity = clampCapacity( pow2AtLeast( capacity ) );
        this._makeBuckets();
        break;
    case "object":
        var items = toList( capacity );
        var size = items.length;
        var capacity = pow2AtLeast( size );
        if( ( ( size << 2 ) - size ) >= ( capacity << 1 ) ) {
            capacity = capacity << 1;
        }
        this._capacity = capacity;
        this._makeBuckets();
        this._addAll( items );
        break;
    default:
        this._makeBuckets();
    }
};

method._checkEquals = Map.prototype._checkEquals;
method._resizeTo = Map.prototype._resizeTo;
method._getNextCapacity = Map.prototype._getNextCapacity;
method._isOverCapacity = Map.prototype._isOverCapacity;
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

    for( var i = 0; i < oldLength; i++ ) {

        var key = oldBuckets[i];
        if( key !== void 0) {
            var newIndex = hash( key, this._capacity );

            while( newBuckets[ newIndex ] !== void 0 ) {
                newIndex = ( this._capacity - 1 ) & ( newIndex + 1 );
            }
            newBuckets[ newIndex ] = oldBuckets[ i ];
            oldBuckets[i] =  = void 0;
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
 * set, nothing happens.
 *
 * The undefined value is not supported as a value. Use
 * null instead.
 *
 * @param {dynamic} value The value to add into the set.
 * @return {void}
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
    this._modCount++;
    var bucketIndex = hash( value, this._capacity ),
        capacity = this._capacity - 1,
        buckets = this._buckets;
    while( true ) {
        var k = buckets[ bucketIndex ];

        if( k === void 0 ) {
            buckets[ bucketIndex ] = value;
            this._size++;
            this._checkResize();
            return void 0;
        }
        else if( this._equality( k, value ) === true ) {
            return void 0;
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
    this._modCount++;
    var bucketIndex = hash( key, this._capacity ),
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

    while( true ) {
        entryIndex = ( 1 + entryIndex ) & capacity;

        var slotKey = buckets[ entryIndex ];

        if( slotKey === void 0 ) {
            break;
        }

        var k = hash( slotKey, capacity + 1 );

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

method.subsetOf = function subsetOf( set ) {
    var it = this.iterator();
    while( it.next() ) {
        if( !set.contains( it.value ) ) {
            return false;
        }
    }
    return this.size() !== set.size();
};

method.supersetOf = function supersetOf( set ) {
    return set.subsetOf( this );
};

method.allContainedIn = function allContainedIn( set ) {
    var it = this.iterator();
    while( it.next() ) {
        if( !set.contains( it.value ) ) {
            return false;
        }
    }
    return true;
};

method.containsAll = function containsAll( set ) {
    return set.allContainedIn( this );
};

method.valueOf = SetValueOf;

method.toString = SetToString;

method.toJSON = SetToJSON;

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

method.difference = function difference( a ) {
    var ret = this.union( a ),
        tmp = this.intersection( a ),
        it = tmp.iterator();

    while( it.next() ) {
        ret.remove( it.value );
    }

    return ret;
};

method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {
    var method = Iterator.prototype;

    function Iterator( set ) {
        this._iterator = set._map.iterator();
        this.value = void 0;
        this.index = -1;
        this.moveToStart();
    }

    copyProperties( setIteratorMethods, method );

    return Iterator;
})();

method._Iterator = Iterator;


return Set;})();
