/* global copyProperties, setIteratorMethods, toList, SetForEach */
/* jshint -W079 */
var Set = (function() {
    var method = Set.prototype;

    var __value = true;
    function Set( capacity, equality ) {
        if( typeof capacity === "function" ) {
            var tmp = equality;
            equality = capacity;
            capacity = tmp;
        }
        var items = null;

        switch( typeof capacity ) {
        case "number":
            break;
        case "object":
            if( capacity ) {
                items = toList( capacity );
            }
            break;
        }

        if( items ) {
            this._map = new this._mapType( items.length, equality );
            this._addAll( items );
        }
        else {
            this._map = new this._mapType( capacity, equality );
        }
    }

    method.forEach = SetForEach;

    method._mapType = Map;

    method._addAll = function( items ) {
        for( var i = 0, l = items.length; i < l; ++i ) {
            this._map.put( items[i], __value );
        }
    };

    //API

    method.clone = function() {
        return new this.constructor(
            this._map.keys(),
            this._map._equality
        );
    };

    method.add = function( value ) {
        return this._map.put( value, __value );
    };

    method.remove = function( value ) {
        return this._map.remove( value ) === __value;
    };

    method.addAll = function( items ) {
        this._addAll( toList( items ) );
    };

    method.clear = function() {
        this._map.clear();
    };

    method.values = method.toArray = function() {
        return this._map.keys();
    };

    method.contains = function( value ) {
        return this._map.containsKey( value );
    };

    method.size = method.length = function() {
        return this._map.size();
    };

    method.isEmpty = function() {
        return this.size() === 0;
    };

    method.subsetOf = function( set ) {
        var it = this.iterator();
        while( it.next() ) {
            if( !set.contains( it.value ) ) {
                return false;
            }
        }
        return this.size() !== set.size();
    };

    method.supersetOf = function( set ) {
        return set.subsetOf( this );
    };

    method.allContainedIn = function( set ) {
        var it = this.iterator();
        while( it.next() ) {
            if( !set.contains( it.value ) ) {
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

    method.toJSON = function() {
        return this.values();
    };

    method.union = function( a ) {
        var ret = new this.constructor( this.size() + a.size(), this._map._equality );

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

    method.intersection = function( a ) {
        var ret = new this.constructor( Math.max( this.size(), a.size() ), this._map._equality );

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

    method.complement = function( a ) {
        var ret = new this.constructor( Math.max( this.size(), a.size() ), this._map._equality );

        var it = this.iterator();

        while( it.next() ) {
            if( !a.contains( it.value ) ) {
                ret.add( it.value );
            }
        }
        return ret;
    };

    method.difference = function( a ) {
        var ret = this.union( a ),
            tmp = this.intersection( a ),
            it = tmp.iterator();

        while( it.next() ) {
            ret.remove( it.value );
        }

        return ret;
    };

    method.iterator = function() {
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

    return Set;
})();
