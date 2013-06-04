/* global OrderedMap */
var OrderedSet = (function() {
    var _super = Set.prototype,
        method = OrderedSet.prototype = Object.create( _super );

    method.constructor = OrderedSet;

    function OrderedSet( capacity, equality ) {
        _super.constructor.call( this, capacity, equality );
    }

    method._mapType = OrderedMap;

    method.indexOf = function indexOf( value ) {
        return this._map.indexOfKey( value );
    };

    method.first = function first() {
        return this._map.firstKey();
    };

    method.last = function last() {
        return this._map.lastKey();
    };

    method.get = method.nth = function nth( index ) {
        return this._map.nthKey( index );
    };

    return OrderedSet;
})();
