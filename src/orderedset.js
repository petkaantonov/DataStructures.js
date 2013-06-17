/* global OrderedMap, setIteratorMethods, copyProperties,
    toList, SetForEach, toList */
/* exported OrderedSet */
var OrderedSet = (function() {
var __value = true;

/**
 * Constructor for ordered sets. Ordered set is like set except
 * it has an inherent order. The inherent order is the order
 * the values are inserted into the set in.
 *
 * Compared to Set, OrderedSet is extremely memory inefficient,
 * has slightly slower lookup but iteration is faster.
 *
 * The undefined value is not supported as a value. Use
 * null instead.
 *
 * Ordering gives a meaning to operations like first,
 * last, nth, indexOf and so on.
 *
 * Deletion of an entry doesn't affect order of other values.
 *
 * @param {int=|Array.<dynamic>|Set} capacity The initial capacity.
 * Can also be an array or another set to initialize the set.
 * @constructor
 */
function OrderedSet( capacity ) {
    this._map = null;
    this._init( capacity );
}
var method = OrderedSet.prototype;


/**
 * Internal.
 *
 *
 */

method._addAll = function _addAll( items ) {
    this._map._setAll( items, __value );
};

/**
 * Internal.
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

/**
 * Simple way to iterate the set. The callback fn receives arguments:
 *
 * {dynamic} value, {integer} index
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
 * @return {OrderedSet}
 *
 */
method.clone = function clone() {
    return new OrderedSet( this.toArray() );
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
    if( value === void 0) {
        throw new Error( "Cannot use undefined as a value" );
    }
    return this._map.put( value, __value ) === void 0;
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
method["delete"] = method.remove = function remove( value ) {
    return this._map.remove( value ) !== void 0;
};

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
    return this._map.hasKey( value );
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
 * Returns the amount of items in the set.
 *
 * @return {int}
 *
 */
method.size = method.length = function size() {
    return this._map.size();
};

/**
 * See if the set doesn't contain anything.
 *
 * @return {boolean}
 *
 */
method.isEmpty = function isEmpty() {
    return this._map.isEmpty();
};

/**
 * See if this set is a proper superset of the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.supersetOf = Set.prototype.supersetOf;

/**
 * See if this set is a proper subset of the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.subsetOf = Set.prototype.subsetOf;

/**
 * See if this set is fully contained in the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.allContainedIn = Set.prototype.allContainedIn;

/**
 * See if this set is fully contains the argument set.
 *
 * @param {Set} set The argument set.
 * @return {boolean}
 *
 */
method.containsAll = Set.prototype.containsAll;

/**
 * Returns a hash code for the set.
 *
 * @return {int}
 *
 */
method.valueOf = Set.prototype.valueOf;

/**
 * Returns a string representation of the set.
 *
 * @return {String}
 *
 */
method.toString = Set.prototype.toString;

/**
 * Automatically called by JSON.stringify. If you later parse the JSON
 * you can pass the array to a set constructor.
 *
 * @return {Array.<dynamic>}
 *
 */
method.toJSON = Set.prototype.toJSON;

/**
 * Returns the union of the argument set and this set. The returned
 * set will have all the members that appear in this set, the second
 * set or both.
 *
 * @param {Set} a The set to union this set with.
 * @return {Set}
 *
 */
method.union = Set.prototype.union;

/**
 * Returns the intersection of the argument set and this set. The returned
 * set will have all the members that appear in both this set and the
 * argument set.
 *
 * @param {Set} a The set to intersect this set with.
 * @return {Set}
 *
 */
method.intersection = Set.prototype.intersection;

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
method.complement = Set.prototype.complement;

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
method.difference = Set.prototype.difference;

/**
 * Find the zero-based index of the value in the set. O(n).
 *
 * Returns -1 if the value is not in the set.
 *
 * Value cannot be undefined. Use null instead.
 *
 * @param {dynamic} value The value to lookup index for.
 * @return {int}
 *
 */
method.indexOf = function indexOf( value ) {
    return this._map.indexOfKey( value );
};

/**
 * Returns the first value in the set. Returns
 * undefined if the set is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.first = function first() {
    return this._map.firstKey();
};

/**
 * Returns the last value in the set. Returns
 * undefined if the set is empty. O(1).
 *
 * @return {dynamic}
 *
 */
method.last = function last() {
    return this._map.lastKey();
};

/**
 * Returns the nth value (0-based) in the set. Returns
 * undefined if the index is out of bounds. O(N).
 *
 * @return {dynamic}
 *
 */
method.get = method.nth = function nth( index ) {
    return this._map.nthKey( index );
};

/**
 * Returns an Iterator for the set. The iterator will become invalid
 * if the set is modified outside the iterator's methods.
 *
 * @return {SetIterator}
 *
 */
method.iterator = function iterator() {
    return new Iterator( this );
};

var Iterator = (function() {
    /**
     * Iterator constructor for the ordered set.
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
     *      console.log( it.value, it.index );
     * }
     * //Cursor is now *before*the first entry
     *
     *
     * @param {OrderedSet} set Description of set parameter.
     * @constructor
     */
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
