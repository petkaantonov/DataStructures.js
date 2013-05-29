/* global arrayRemove1 */
var OrderedMap = (function() {
    var _super = Map.prototype,
        hasOwn = {}.hasOwnProperty,
        method = OrderedMap.prototype = Object.create( _super );

    method.constructor = OrderedMap;

    for( var key in _super ) {
        if( hasOwn.call( _super, key ) &&
            key.charAt(0) !== "_" &&
            typeof _super[key] === "function" ) {
            method[ "$" + key ] = _super[key];
        }
    }

    function OrderedMap( capacity, equality ) {
        _super.constructor.call( this, capacity, equality );
    }

    method._removeFromKeyList = function( key ) {
        var eq = this._equality,
            list = this._keyList;

        for( var i = 0, l = list.length; i < l; ++i ) {
            if( eq( list[i], key ) ) {
                arrayRemove1( list, i );
                break;
            }
        }
    };

    method._addToKeyList = function( key ) {
        this._keyList.push( key );
    };



    method.indexOfKey = function( key ) {
        var eq = this._equality,
            list = this._keyList;

        for( var i = 0, l = list.length; i < l; ++i ) {
            if( eq( list[i], key ) ) {
                return i;
            }
        }
        return -1;
    };

    method.indexOfValue = function( value ) {
        var eq = this._equality,
            list = this._keyList;

        for( var i = 0, l = list.length; i < l; ++i ) {
            if( eq( this.get( list[i] ), value ) ) {
                return i;
            }
        }
        return -1;
    };

    method.firstKey = function() {
        if( !this._keyList.length ) {
            return void 0;
        }
        return this._keyList[0];
    };

    method.first = function() {
        return this.get( this.firstKey() );
    };

    method.lastKey = function( ) {
        if( !this._keyList.length ) {
            return void 0;
        }
        return this._keyList[ this._keyList.length - 1 ];
    };

    method.last = function() {
        return this.get( this.lastKey() );
    };


    method.nthKey = function( index ) {
        if( index < 0 || index >= this._keyList.length ) {
            return void 0;
        }
        return this._keyList[index];
    };

    method.nth = function( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.containsValue = method.hasValue = function( value ) {
        return this.indexOfValue( value ) > -1;
    };

    method.put = method.set = function( key, value ) {
        var prevSize = this.size();
        this.$set( key, value );
        if( this.size() !== prevSize ) {
            this._addToKeyList( key );
        }
    };

    method.unset = method["delete"] = method.remove = function( key ) {
        var prevSize = this.size();
        this.$remove( key );
        if( this.size() !== prevSize ) {
            this._removeFromKeyList( key );
        }
    };

    method.clear = function() {
        this.$clear();
        this._keyList = [];
    };

    method.init = function() {
        this._keyList = [];
    };

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this._map = map;
            this._keyList = map._keyList;
            this._modCount = map._modCount;
            this._indexDelta = 1;
            this.moveToStart();
        }

        method._checkModCount = function() {
            if( this._modCount !== this._map._modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method.next = function() {
            this._checkModCount();
            this._index += this._indexDelta;

            if( this._index >= this._keyList.length ) {
                this.moveToEnd();
                return false;
            }

            this._indexDelta = 1;

            this.key = this._keyList[this._index];
            this.value = this._map.get( this.key );
            this.index = this._index;

            return true;

        };

        method.prev = function() {
            this._checkModCount();
            this._index--;

            if( this._index < 0 ||
                this._index >= this._keyList.length ) {
                this.moveToStart();
                return false;
            }

            this.key = this._keyList[this._index];
            this.value = this._map.get( this.key );
            this.index = this._index;

            return true;

        };

        method.moveToStart = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;


            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._keyList.length;
            this.index = -1;

            return this;
        };

        method["delete"] = method.remove = function() {
            this._checkModCount();

            if( this._index < 0 ||
                this._index >= this._map._size ||
                this.key === void 0 ) {
                return;
            }

            var ret = this._map.remove( this.key );
            this._modCount = this._map._modCount;
            this.key = this.value = void 0;
            this.index = -1;

            this._indexDelta = 0;

            return ret;
        };


        return Iterator;
    })();


    return OrderedMap;
})();