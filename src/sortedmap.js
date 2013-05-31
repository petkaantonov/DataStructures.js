/* global toListOfTuples, MapForEach, RedBlackTree, defaultComparer,
    MapValueOf, MapEntries, MapKeys, MapValues, MapToString, MapToJSON */
var SortedMap = (function() {
    var method = SortedMap.prototype;

    function SortedMap( keyValues, comparator ) {
        if( typeof keyValues === "function" ) {
            var tmp = comparator;
            comparator = keyValues;
            keyValues = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );
        this._setAll( toListOfTuples( keyValues ) );
    }

    method.forEach = MapForEach;

    method._setAll = function( items ) {
        for( var i = 0, l = items.length; i < l; ++i ) {
            this.set( items[i][0], items[i][1] );
        }
    };

    method.getComparator = function() {
        return this._tree.getComparator();
    };

    method.clone = function() {
        return new SortedMap( this.entries(), this.comparator );
    };

    method.clear = function() {
        this._tree.clear();
        return this;
    };

    method.put = method.set = function( key, value ) {
        return this._tree.set( key, value );
    };

    method.putAll = method.setAll = function( arr ) {
        var items = toListOfTuples( arr );
        this._setAll( items );
        return this;
    };

    method["delete"] = method.remove = method.unset = function( key ) {
        var ret = this._tree.unset( key );
        return ret ? ret.getValue() : ret;
    };

    method.get = function( key ) {
        var node = this._tree.nodeByKey(key);
        if( !node ) {
            return void 0;
        }
        return node.getValue();
    };

    method.containsKey = method.hasKey = function( key ) {
        return !!this._tree.nodeByKey( key );
    };

    method.containsValue = method.hasValue = function( value ) {
        var it = this.iterator();

        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.first = function() {
        return this.get( this.firstKey() );
    };

    method.last = function() {
        return this.get( this.lastKey() );
    };

    method.nth = function( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.nthKey = function( index ) {
        var node = this._tree.nodeByIndex(index);
        if( !node ) {
            return void 0;
        }
        return node.key;
    };

    method.firstKey = function() {
        var first = this._tree.firstNode();

        if( !first ) {
            return void 0;
        }
        return first.key;
    };

    method.lastKey = function() {
        var last = this._tree.lastNode();

        if( !last) {
            return void 0;
        }
        return last.key;
    };



    method.size = method.length = function() {
        return this._tree.size();
    };

    method.isEmpty = function() {
        return this._tree.size() === 0;
    };

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function() {
        return this._tree.iterator();
    };

    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    return SortedMap;
})();