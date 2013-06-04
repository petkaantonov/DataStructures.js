/* global defaultComparer, SortedMap, SetForEach, setIteratorMethods,
    copyProperties, toList, RedBlackTree,
    SetValueOf, SetToString, SetToJSON */
var SortedSet = (function() {

    var method = SortedSet.prototype;

    function SortedSet( values, comparator ) {
        this._tree = null;
        this._init( values, comparator );
    }

    method._init = function _init( values, comparator ) {
        if( typeof values === "function" ) {
            var tmp = comparator;
            comparator = values;
            values = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );

        if( typeof values === "object" && values != null ) {
            this._addAll( toList(values) );
        }
    };

    //API
    method.forEach = SetForEach;

    method.getComparator = SortedMap.prototype.getComparator;

    method.clear = SortedMap.prototype.clear;


    method.values = method.toArray = function toArray() {
        var values = [],
            it = this.iterator();

        while( it.next() ) {
            values.push( it.value );
        }
        return values;
    };

    method.contains = SortedMap.prototype.containsKey;
    method.get = method.nth = SortedMap.prototype.nthKey;
    method.first = SortedMap.prototype.firstKey;
    method.last = SortedMap.prototype.lastKey;
    method.size = method.length = SortedMap.prototype.size;
    method.isEmpty = SortedMap.prototype.isEmpty;

    method.add = function add( value ) {
        this._tree.set( value, true );
        return this;
    };

    method._addAll = function _addAll( values ) {
        for( var i = 0, l = values.length; i < l; ++i ) {
            this.add( values[i] );
        }
    };

    method.addAll = function addAll( arr ) {
        var values = toList(arr);
        this._addAll( values );
        return this;
    };

    method.clone = function clone() {
        return new SortedSet( this.values() );
    };

    method.remove = function remove( value ) {
        var ret = this._tree.unset( value );
        return ret ? ret.key : ret;
    };

    method.subsetOf = function subsetOf( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
                return false;
            }
        }
        return this.size() !== set.size();
    };

    method.supersetOf = function supersetOf( set ) {
        return set.subsetOf(this);
    };

    method.allContainedIn = function allContainedIn( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
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

    method.union = function union(a) {
        var ret = new SortedSet( this.getComparator() ),

            aHas, bHas,

            itA = this.iterator(),
            itB = a.iterator();

        while( true ) {
            if( aHas = itA.next() ) {
                ret.add( itA.key );
            }
            if( bHas = itB.next() ) {
                ret.add( itB.key );
            }

            if( !aHas && !bHas ) {
                break;
            }
        }

        return ret;
    };


    method.intersection = function intersection(a) {
        var ret = new SortedSet( this.getComparator() ),
            src = this.size() < a.size() ? this : a,
            dst = src === a ? this : a,
            it = src.iterator();

        while( it.next() ) {
            if( dst.contains( it.key ) ) {
                ret.add( it.key );
            }
        }

        return ret;
    };

    method.complement = function complement( a ) {
        var ret = new SortedSet( this.getComparator() ),
            it = this.iterator();

        while( it.next() ) {
            if( !a.contains( it.key ) ) {
                ret.add( it.key );
            }
        }

        return ret;
    };


    method.difference = function difference( a ) {
        var ret = this.union( a ),
            tmp = this.intersection( a ),
            it = tmp.iterator();

        while( it.next() ) {
            ret.remove( it.key );
        }

        return ret;
    };

    method.iterator = function iterator() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( set ) {
            this._iterator = set._tree.iterator();
            this.value = void 0;
            this.index = -1;
            this.moveToStart();
        }

        copyProperties( setIteratorMethods, method );


        return Iterator;
    })();

    method._Iterator = Iterator;

    return SortedSet;
})();