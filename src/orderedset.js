/* global OrderedMap, setIteratorMethods, copyProperties,
    toList, SetForEach, toList */
/* exported OrderedSet */
var OrderedSet = (function() {
var __value = true;

/**
 * Description.
 *
 *
 */
function OrderedSet( capacity ) {
    this._map = null;
    this._init( capacity );
}
var method = OrderedSet.prototype;


/**
 * Description.
 *
 *
 */

method._addAll = function _addAll( items ) {
    this._map._setAll( items, __value );
};

/**
 * Description.
 *
 *
 */
method._init = function _init( capacity ) {
    if( typeof capacity === "object" &&
        capacity !== null ) {
        capacity = toList( capacity );
        this._map = new OrderedMap( capacity.length | 0 );
        this._addAll( capacity );
    }
    else if( typeof capacity === "number" ) {
        this._map = new OrderedMap( capacity );
    }
    else {
        this._map = new OrderedMap();
    }
};

//API

method.forEach = SetForEach;

/**
 * Description.
 *
 *
 */
method.clone = function clone() {
    return new OrderedSet( this.toArray() );
};

/**
 * Description.
 *
 *
 */
method.add = function add( value ) {
    return this._map.put( value, __value ) === void 0;
};

/**
 * Description.
 *
 *
 */
method["delete"] = method.remove = function remove( value ) {
    return this._map.remove( value ) !== void 0;
};

/**
 * Description.
 *
 *
 */
method.contains = function contains( value ) {
    return this._map.hasKey( value );
};

/**
 * Description.
 *
 *
 */
method.addAll = function addAll( items ) {
    this._addAll( toList( items ) );
};

/**
 * Description.
 *
 *
 */
method.clear = function clear() {
    return this._map.clear();
};

/**
 * Description.
 *
 *
 */
method.toArray = method.values = function toArray() {
    return this._map.keys();
};

/**
 * Description.
 *
 *
 */
method.size = method.length = function size() {
    return this._map.size();
};

/**
 * Description.
 *
 *
 */
method.isEmpty = function isEmpty() {
    return this._map.isEmpty();
};

method.supersetOf = Set.prototype.supersetOf;
method.subsetOf = Set.prototype.subsetOf;
method.allContainedIn = Set.prototype.allContainedIn;
method.containsAll = Set.prototype.containsAll;
method.valueOf = Set.prototype.valueOf;
method.toString = Set.prototype.toString;
method.toJSON = Set.prototype.toJSON;
method.union = Set.prototype.union;
method.intersection = Set.prototype.intersection;
method.complement = Set.prototype.complement;
method.difference = Set.prototype.difference;

/**
 * Description.
 *
 *
 */
method.indexOf = function indexOf( value ) {
    return this._map.indexOfKey( value );
};

/**
 * Description.
 *
 *
 */
method.first = function first() {
    return this._map.firstKey();
};

/**
 * Description.
 *
 *
 */
method.last = function last() {
    return this._map.lastKey();
};

/**
 * Description.
 *
 *
 */
method.get = method.nth = function nth( index ) {
    return this._map.nthKey( index );
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
    function Iterator( set ) {
        this._iterator = set._map.iterator();
        this.value = void 0;
        this.index = -1;
    }
    var method = Iterator.prototype;

    copyProperties( setIteratorMethods, method );

    return Iterator;
})();



return OrderedSet;})();
