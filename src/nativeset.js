/* global toList */
var NativeSet = (function() {
    var _super = Set.prototype,
        method = NativeSet.prototype = Object.create( _super );

    method.constructor = NativeSet;

    function NativeSet( items ) {
        this._map = Map.Native();
        this.addAll( items );
    }

    method._addAll = function( items ) {
        for( var i = 0, len = items.length; i < len; ++i ) {
            this._map.set( items[i], true );
        }
    };

    method.addAll = function( items ) {
        this.addAll( toList( items ) );
    };

    method._mapType = function(){};

    return NativeSet;
})();
