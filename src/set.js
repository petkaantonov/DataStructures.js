/* global copyProperties, setIteratorMethods, toList, SetForEach,
    SetToJSON, SetToString, SetValueOf */
/* jshint -W079 */
var Set = (function() {
    var method = Set.prototype;

    var __value = true;

    function Set( capacity, equality ) {
        this._map = null;
        this._init( capacity, equality );
    }

    method._init = function _init( capacity, equality ) {
        if( typeof capacity === "function" ) {
            var tmp = equality;
            equality = capacity;
            capacity = tmp;
        }

        if( typeof capacity === "number" ) {
            this._map = new this._mapType( capacity, equality );
        }
        else {
            this._map = new this._mapType( equality );
        }

        if( typeof capacity === "object" && capacity != null) {
            this._addAll( toList( capacity ) );
        }
    };

    method._mapType = Map;

    method._addAll = function _addAll( items ) {
        this._map._setAll( items, __value );
    };

    //API

    method.forEach = SetForEach;

    method.clone = function clone() {
        return new this.constructor(
            this._map.keys(),
            this._map._equality
        );
    };

    method.add = function add( value ) {
        return this._map.put( value, __value );
    };

    method.remove = function remove( value ) {
        return this._map.remove( value ) === __value;
    };

    method.addAll = function addAll( items ) {
        this._addAll( toList( items ) );
    };

    method.clear = function clear() {
        this._map.clear();
    };

    method.values = method.toArray = function toArray() {
        return this._map.keys();
    };

    method.contains = function contains( value ) {
        return this._map.containsKey( value );
    };

    method.size = method.length = function length() {
        return this._map.size();
    };

    method.isEmpty = function isEmpty() {
        return this.size() === 0;
    };

    method.subsetOf = function subsetOf( set ) {
        var it = this.iterator();
        while( it.next() ) {
            if( !set.contains( it.value ) ) {
                return false;
            }
        }
        return this.size() !== set.size();
    };

    method.supersetOf = function supersetOf( set ) {
        return set.subsetOf( this );
    };

    method.allContainedIn = function allContainedIn( set ) {
        var it = this.iterator();
        while( it.next() ) {
            if( !set.contains( it.value ) ) {
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

    method.union = function union( a ) {
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

    method.intersection = function intersection( a ) {
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

    method.complement = function complement( a ) {
        var ret = new this.constructor( Math.max( this.size(), a.size() ), this._map._equality );

        var it = this.iterator();

        while( it.next() ) {
            if( !a.contains( it.value ) ) {
                ret.add( it.value );
            }
        }
        return ret;
    };

    method.difference = function difference( a ) {
        var ret = this.union( a ),
            tmp = this.intersection( a ),
            it = tmp.iterator();

        while( it.next() ) {
            ret.remove( it.value );
        }

        return ret;
    };

    method.iterator = function iterator() {
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
