/* exported hasOwn, toString, isArray, arrayLike, uid,
    toList, toListOfTuples, arrayRemove1, arrayRemove2,
    copyProperties, setIteratorMethods, MapForEach, SetForEach
*/
var hasOwn = {}.hasOwnProperty,
    toString = {}.toString,

    isArray = [].constructor.isArray || function(arr) {
        return toString.call(arr) === "[object Array]";
    };


function arrayLike( arr ) {
    return !!(arr && ( ( arr.length && ( "0" in arr ) ) || ( arr.size && arr.size() ) ) && typeof arr !== "function");
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


function arrayRemove2( arr, index ) {
    for( var i = index, len = arr.length - 2; i < len; ++i ) {
        arr[i+1] = arr[i+2];
        arr[i] = arr[i+1];
    }

    arr.length = len;
}

function arrayRemove1( arr, index ) {
    for( var i = index, len = arr.length - 1; i < len; ++i ) {
        arr[i] = arr[i+1];
    }
    arr.length = len;
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


