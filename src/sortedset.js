/* global defaultComparer, SortedMap, SetForEach, setIteratorMethods,
    copyProperties, toList, RedBlackTree */
var SortedSet = (function() {

    var method = SortedSet.prototype;

    function SortedSet( values, comparator ) {
        if( typeof values === "function" ) {
            var tmp = comparator;
            comparator = values;
            values = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );
        this._addAll( toList(values) );

    }

    method.forEach = SetForEach;

    method.getComparator = SortedMap.prototype.getComparator;

    method.clear = SortedMap.prototype.clear;


    method.values = method.toArray = method.toJSON = function() {
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

    method.add = function( value ) {
        this._tree.set( value, true );
        return this;
    };

    method._addAll = function( values ) {
        for( var i = 0, l = values.length; i < l; ++i ) {
            this.add( values[i] );
        }
    };

    method.addAll = function( arr ) {
        var values = toList(arr);
        this._addAll( values );
        return this;
    };

    method.clone = function() {
        return new SortedSet( this.values() );
    };

    method.remove = function( value ) {
        var ret = this._tree.unset( value );
        return ret ? ret.key : ret;
    };

    method.subsetOf = function( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
                return false;
            }
        }
        return this.size() !== set.size();
    };

    method.supersetOf = function( set ) {
        return set.subsetOf(this);
    };

    method.allContainedIn = function( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
                return false;
            }
        }
        return true;
    };

    method.containsAll = function( set ) {
        return set.allContainedIn( this );
    };

    method.valueOf = function() {
        var it = this.iterator();
        var ret = 31;
        while( it.next() ) {
            ret ^= ( Map.hash( it.value ) );
            ret >>>= 0;
        }
        return ret;
    };

    method.toString = function() {
        return this.values().toString();
    };

    method.union = function(a) {
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


    method.intersection = function(a) {
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

    method.complement = function( a ) {
        var ret = new SortedSet( this.getComparator() ),
            it = this.iterator();

        while( it.next() ) {
            if( !a.contains( it.key ) ) {
                ret.add( it.key );
            }
        }

        return ret;
    };


    method.difference = function( a ) {
        var ret = this.union( a ),
            tmp = this.intersection( a ),
            it = tmp.iterator();

        while( it.next() ) {
            ret.remove( it.key );
        }

        return ret;
    };

    method.iterator = function() {
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


    return SortedSet;
})();