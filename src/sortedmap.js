/* global toListOfTuples, MapForEach, RedBlackTree, defaultComparer,
    MapValueOf, MapEntries, MapKeys, MapValues, MapToString, MapToJSON */
var SortedMap = (function() {
    var method = SortedMap.prototype;

    function SortedMap( keyValues, comparator ) {
        this._tree = null;
        this._init( keyValues, comparator );
    }

    method._init = function _init( keyValues, comparator ) {
        if( typeof keyValues === "function" ) {
            var tmp = comparator;
            comparator = keyValues;
            keyValues = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );

        if( typeof keyValues === "object" ) {
            this._setAll( toListOfTuples( keyValues ) );
        }
    };

    method._setAll = function _setAll( items ) {
        for( var i = 0, l = items.length; i < l; ++i ) {
            this.set( items[i][0], items[i][1] );
        }
    };
    //API
    method.forEach = MapForEach;

    method.getComparator = function getComparator() {
        return this._tree.getComparator();
    };

    method.clone = function clone() {
        return new SortedMap( this.entries(), this.comparator );
    };

    method.clear = function clear() {
        this._tree.clear();
        return this;
    };

    method.put = method.set = function set( key, value ) {
        return this._tree.set( key, value );
    };

    method.putAll = method.setAll = function setAll( arr ) {
        var items = toListOfTuples( arr );
        this._setAll( items );
        return this;
    };

    method["delete"] = method.remove = method.unset = function unset( key ) {
        var ret = this._tree.unset( key );
        return ret ? ret.getValue() : ret;
    };

    method.get = function get( key ) {
        var node = this._tree.nodeByKey(key);
        if( !node ) {
            return void 0;
        }
        return node.getValue();
    };

    method.containsKey = method.hasKey = function hasKey( key ) {
        return !!this._tree.nodeByKey( key );
    };

    method.containsValue = method.hasValue = function hasValue( value ) {
        var it = this.iterator();

        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.first = function first() {
        return this.get( this.firstKey() );
    };

    method.last = function last() {
        return this.get( this.lastKey() );
    };

    method.nth = function nth( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.nthKey = function nthKey( index ) {
        var node = this._tree.nodeByIndex(index);
        if( !node ) {
            return void 0;
        }
        return node.key;
    };

    method.firstKey = function firstKey() {
        var first = this._tree.firstNode();

        if( !first ) {
            return void 0;
        }
        return first.key;
    };

    method.lastKey = function lastKey() {
        var last = this._tree.lastNode();

        if( !last) {
            return void 0;
        }
        return last.key;
    };

    method.size = method.length = function length() {
        return this._tree.size();
    };

    method.isEmpty = function isEmpty() {
        return this._tree.size() === 0;
    };

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function iterator() {
        return this._tree.iterator();
    };

    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    return SortedMap;
})();