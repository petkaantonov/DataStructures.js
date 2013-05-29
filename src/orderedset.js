/* global OrderedMap */
var OrderedSet = (function() {
    var _super = Set.prototype,
        method = OrderedSet.prototype = Object.create( _super );

    method.constructor = OrderedSet;

    function OrderedSet( capacity, equality ) {
        _super.constructor.call( this, capacity, equality );
    }

    method._mapType = OrderedMap;

    method.indexOf = function( value ) {
        return this._map.indexOfKey( value );
    };

    method.first = function() {
        return this._map.firstKey();
    };

    method.last = function() {
        return this._map.lastKey();
    };

    method.get = method.nth = function( index ) {
        return this._map.nthKey( index );
    };

    return OrderedSet;
})();
