/* exported hasOwn, toString, isArray, uid,
    toList, toListOfTuples,
    copyProperties, setIteratorMethods, MapForEach, SetForEach, exportCtor,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, SetToJSON,
    SetValueOf, SetToString, MapToJSON, MapValueOf, MapToString
*/
var hasOwn = {}.hasOwnProperty,
    toString = {}.toString,

    isArray = [].constructor.isArray || function(arr) {
        return toString.call(arr) === "[object Array]";
    };

function exportCtor( Ctor ) {
    var ret = function( arg1, arg2, arg3 ) {
        return new Ctor( arg1, arg2, arg3 );
    };

    for( var key in Ctor ) {
        if( hasOwn.call( Ctor, key ) ) {
            ret[key] = Ctor[key];
        }
    }

    return ret;
}

var uid = (function() {
    var id = 0,
        key = "__uid" + (Math.random() + "").replace(/[^0-9]/g, "").substr(5) + "__";

    return function( obj ) {
        if( !hasOwn.call( obj, key ) ) {
            var ret = id++;
            obj[key] = ret;
            return ret;
        }
        return obj[key];
    };
})();

function toList( obj ) {
    var items;
    if( isArray( obj ) ) {
        return obj;
    }
    else if( obj && typeof obj === "object" ) {
        if( "iterator" in obj && typeof obj.iterator === "function" ) {
            var it = obj.iterator();

            items = [];

            while( it.next() ) {
                items.push( it.value );
            }
            return items;
        }
        else {
            items = [];

            for( var k in obj ) {
                if( hasOwn.call( obj, k ) ) {
                    items.push( obj[k] );
                }
            }
            return items;
        }
    }
    else {
        return [];
    }
}

function toListOfTuples( obj ) {
    if( isArray( obj ) ) {
        return obj;
    }
    else if( obj && typeof obj === "object" ) {
        if( "iterator" in obj && typeof obj.iterator === "function" ) {
            var it = obj.iterator(),
                items = [];
            while( it.next() ) {
                items.push( [it.key, it.value] );
            }
            return items;
        }
        else {
            var items = [];
            for( var k in obj ) {
                if( hasOwn.call( obj, k ) ) {
                    items.push( [k, obj[k]] );
                }
            }
            return items;
        }

    }
    else {
        return [];
    }
}

function copyProperties( src, dst ) {
    for( var key in src ) {
        if( hasOwn.call( src, key ) ) {
            dst[key] = src[key];
        }
    }
}

var setIteratorMethods = {
    next: function() {
        var ret = this._iterator.next();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    prev: function() {
        var ret = this._iterator.prev();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    moveToStart: function() {
        this._iterator.moveToStart();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return this;
    },

    moveToEnd: function() {
        this._iterator.moveToEnd();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return this;
    },

    "delete": function() {
        var ret = this._iterator.remove();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    remove: function() {
        var ret = this._iterator.remove();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    }
};

function MapForEach( fn, ctx ) {
    var it = this.iterator();
    if( ctx ) {
        while( it.next() ) {
            if( fn.call( ctx, it.value, it.key, it.index ) === false ) {
                return;
            }
        }
    }
    else {
        while( it.next() ) {
            if( fn( it.value, it.key, it.index ) === false ) {
                return;
            }
        }
    }
}

function SetForEach( fn, ctx ) {
    var it = this.iterator();
    if( ctx ) {
        while( it.next() ) {
            if( fn.call( ctx, it.value, it.index ) === false ) {
                return;
            }
        }
    }
    else {
        while( it.next() ) {
            if( fn( it.value, it.index ) === false ) {
                return;
            }
        }
    }
}

function MapToString() {
    var ret = [],
        it = this.iterator();

    while( it.next() ) {
        ret.push( [
            it.key === this ? null : it.key,
            it.value === this ? null : it.value
        ]);
    }

    return JSON.stringify( ret );
}

function MapValueOf() {
    var it = this.iterator();
    var ret = 31;
    while( it.next() ) {
        ret += (
            Map.hash( it.key === this ? null : it.key ) ^
            Map.hash( it.value === this ? null : it.value )
        );
        ret >>>= 0;
    }
    return ret >>> 0;
}

function MapToJSON() {
    return this.entries();
}

function SetToString() {
    var ret = [],
        it = this.iterator();

    while( it.next() ) {
        ret.push( it.value === this ? null : it.value );
    }

    return JSON.stringify( ret );
}

function SetValueOf() {
    var it = this.iterator();
    var ret = 31;
    while( it.next() ) {
        ret += ( Map.hash( it.value === this ? null : it.value ) );
        ret >>>= 0;
    }
    return ret >>> 0;
}

function SetToJSON() {
    return this.values();
}

function MapKeys() {
    var keys = [],
        it = this.iterator();

    while( it.next() ) {
        keys.push( it.key );
    }
    return keys;
}

function MapValues() {
    var values = [],
        it = this.iterator();

    while( it.next() ) {
        values.push( it.value );
    }
    return values;
}

function MapEntries() {
    var entries = [],
    it = this.iterator();

    while( it.next() ) {
        entries.push( [it.key, it.value] );
    }
    return entries;
}

function MapIteratorCheckModCount() {
    if( this._modCount !== this._map._modCount ) {
        throw new Error( "map cannot be mutated while iterating" );
    }
}
