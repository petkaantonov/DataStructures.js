/* global MapIteratorCheckModCount, MapEntries, MapValues, MapKeys, MapToJSON, MapToString, MapValueOf,
    toListOfTuples, MapForEach */
/* jshint forin:false */
var NativeMap = (function() {
    var method = NativeMap.prototype,

        hasOwn = {}.hasOwnProperty,

        objKeys = Object.keys || function( obj ) {
            var r = [];
            for( var key in obj ) {
                r.push( key );
            }
            return r;
        };

    function validKey( key ) {
        return "#" + key;
    }

    function NativeMap( entries ) {
        this._map = Object.create( null );
        this._size = 0;
        this._modCount = 0;

        if( entries ) {
            this.putAll( entries );
        }
    }

    method._add = function( key, value ) {
        this._map[key] = value;
        this._size++;
    };

    method.forEach = MapForEach;

    method.clone = function() {
        var ret = new NativeMap();
        for( var key in this._map ) {
            ret._add( key, this._map[key] );
        }
        return ret;
    };



    method.get = function( key ) {
        key = validKey( key );
        return this._map[key];
    };

    method.setAll = method.putAll = function( entries ) {
        entries = toListOfTuples( entries );
        for( var i = 0, len = entries.length; i < len; ++i ) {
            this.set( entries[i][0], entries[i][1] );
        }
    };

    method.set = method.put = function( key, value ) {
        var ret = void 0;
        this._modCount++;
        key = validKey( key );
        if( !hasOwn.call( this._map, key ) ) {
            this._size++;
        }
        else {
            ret = this._map[key];
        }
        this._map[key] = value;
        return ret;
    };

    method.remove = method["delete"] = function( key ) {
        this._modCount++;
        key = validKey( key );
        var ret = this._map[key];
        if( delete this._map[key] ) {
            this._size--;
            return ret;
        }
        return void 0;
    };

    method.containsKey = method.hasKey = function( key ) {
        key = validKey( key );
        return hasOwn.call( this._map, key );
    };

    method.containsValue = method.hasValue = function( value ) {
        for( var key in this._map ) {
            if( this._map[key] === value ) {
                return true;
            }
        }
        return false;
    };

    method.clear = function() {
        this._modCount++;
        this._size = 0;
        this._map = Object.create( null );
    };

    method.size = method.length = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this._map = map;
            this._modCount = this._map._modCount;
            this._keys = objKeys( this._map._map );
            this.moveToStart();
        }

        method._checkModCount = MapIteratorCheckModCount;

        method.next = function() {
            this._checkModCount();
            this.index += this._indexDelta;

            if( this._index >= this._map._size ) {
                this.moveToEnd();
                return false;
            }

            var key = this._keys[this._index];
            this.key = key.substr(1);
            this.value = this._map._map[key];
            this.index = this._index;

            this._indexDelta = 1;

            return true;
        };

        method.prev = function() {
            this._checkModCount();
            this._index--;

            if( this._index < 0 ||
                this._keys.length === 0 ) {
                this.moveToStart();
                return false;
            }

            var key = this._keys[this._index];
            this.key = key.substr(1);
            this.value = this._map._map[key];
            this.index = this._index;

            this._indexDelta = 1;

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
            this.index = -1;
            this._index = this._keys.length;

            return this;
        };

        method.set = method.put = function( value ) {
            this._checkModCount();

            if( this.key === void 0 ) {
                return;
            }
            var ret = this._map._map[ this._keys [ this._index ] ];
            this.value = this._map._map[ this._keys [ this._index ] ] = value;
            return ret;
        };

        method["delete"] = method.remove = function() {
            this._checkModCount();

            if( this.key === void 0 ) {
                return;
            }

            var ret = delete this._map._map[ this._keys[ this._index ] ];
            this.key = this.value = void 0;
            this.index = -1;


            if( this._index + 1 >= this._keys.length ) {
                this.moveToEnd();
            }
            else {
                this._indexDelta = 0;
            }

            return ret;
        };

        return Iterator;
    })();




    return NativeMap;
})();
