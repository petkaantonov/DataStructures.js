/* exported hasOwn, toString, isArray, uid,
    toList, toListOfTuples,
    copyProperties, setIteratorMethods, MapForEach, SetForEach, exportCtor,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, SetToJSON,
    SetValueOf, SetToString, MapToJSON, MapValueOf, MapToString,
    arrayCopy, arraySearch, SetIteratorCheckModCount
*/
/* jshint -W079 */
var Array = [].constructor,

    Function = function(){}.constructor,

    hasOwn = {}.hasOwnProperty,

    toString = {}.toString,

    ownNames = {}.constructor.getOwnPropertyNames || function( obj ) {
        var r = [];

        for( var key in obj ) {
            if( hasOwn.call( obj, key ) ) {
                r.push( key );
            }
        }
        return r;
    },

    isArray = [].constructor.isArray || function(arr) {
        return toString.call(arr) === "[object Array]";
    };


//Takes a constructor function and returns a function that
//can instantiate the constructor Without using
//the new- keyword.

//Also copies any properties of the constructor
//unless they are underscore prefixed
//(includes .prototype, so it can still be
//monkey-patched from outside)
/**
 * Description.
 *
 *
 */
var exportCtor = (function() {

    var rnocopy = /(?:^_|^(?:length|name|arguments|caller|callee)$)/;
    return function exportCtor( Constructor ) {
        var params = new Array( Constructor.length ),
            instantiateCode = "";

        for( var i = 0, len = params.length; i < len; ++i ) {
            params[i] = "param$" + i;
        }

        if( params.length ) {
            instantiateCode = "switch( arguments.length ) {\n";
            for( var i = params.length - 1; i >= 0; --i ) {
                instantiateCode += "case "+ (i + 1) +
                    ": return new Constructor(" + params.slice(0, i + 1)
                    .join( ", " ) + ");\n";
            }
            instantiateCode += "case 0: return new Constructor();\n}"+
                "\nthrow new Error(\"too many arguments\");\n";
        }
        else {
            instantiateCode = "return new Constructor();";
        }

        var code = "return function ConstructorProxy(" +
            params.join( ", " ) + ") { \"use strict\"; " +
            instantiateCode + "};";

        var ret = new Function( "Constructor", code )( Constructor );

        var names = ownNames( Constructor );

        for( var i = 0, len = names.length; i < len; ++i ) {
            if( !rnocopy.test( names[ i ] ) ) {
                ret[ names[ i ] ] = Constructor[ names[ i ] ];
            }
        }

        return ret;
    };
})();


/**
 * Description.
 *
 *
 */
var uid = (function() {
    var id = 0,
        key = "__uid" +
            (Math.random() + "").replace(/[^0-9]/g, "")
            .substr(5) + "__";

    return function uid( obj ) {
        if( !hasOwn.call( obj, key ) ) {
            var ret = id++;
            obj[key] = ret;
            return ret;
        }
        return obj[key];
    };
})();

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
function copyProperties( src, dst ) {
    for( var key in src ) {
        if( hasOwn.call( src, key ) ) {
            dst[key] = src[key];
        }
    }
}

/**
 * Description.
 *
 *
 */
function arraySearch( array, startIndex, length, value ) {
    for( var i = startIndex; i < length; ++i ) {
        if( array[i] === value ) {
            return true;
        }
    }
    return false;
}

/**
 * Description.
 *
 *
 */
function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
    for( var j = 0; j < len; ++j ) {
        dst[j + dstIndex ] = src[j + srcIndex];
    }
}

var setIteratorMethods = {
    /**
     * Description.
     *
     *
     */
    next: function next() {
        var ret = this._iterator.next();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    /**
     * Description.
     *
     *
     */
    prev: function prev() {
        var ret = this._iterator.prev();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    /**
     * Description.
     *
     *
     */
    moveToStart: function moveToStart() {
        this._iterator.moveToStart();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return this;
    },

    /**
     * Description.
     *
     *
     */
    moveToEnd: function moveToEnd() {
        this._iterator.moveToEnd();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return this;
    },

    /**
     * Description.
     *
     *
     */
    "delete": function $delete() {
        var ret = this._iterator.remove();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    },

    /**
     * Description.
     *
     *
     */
    remove: function remove() {
        var ret = this._iterator.remove();
        this.value = this._iterator.key;
        this.index = this._iterator.index;
        return ret;
    }
};

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
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

/**
 * Description.
 *
 *
 */
function MapValueOf() {
    return 1;
}

/**
 * Description.
 *
 *
 */
function MapToJSON() {
    return this.entries();
}

/**
 * Description.
 *
 *
 */
function SetToString() {
    var ret = [],
        it = this.iterator();

    while( it.next() ) {
        ret.push( it.value === this ? null : it.value );
    }

    return JSON.stringify( ret );
}

/**
 * Description.
 *
 *
 */
function SetValueOf() {
    return 1;
}

/**
 * Description.
 *
 *
 */
function SetToJSON() {
    return this.values();
}

/**
 * Description.
 *
 *
 */
function MapKeys() {
    var keys = [],
        it = this.iterator();

    while( it.next() ) {
        keys.push( it.key );
    }
    return keys;
}

/**
 * Description.
 *
 *
 */
function MapValues() {
    var values = [],
        it = this.iterator();

    while( it.next() ) {
        values.push( it.value );
    }
    return values;
}

/**
 * Description.
 *
 *
 */
function MapEntries() {
    var entries = [],
    it = this.iterator();

    while( it.next() ) {
        entries.push( [it.key, it.value] );
    }
    return entries;
}

/**
 * Description.
 *
 *
 */
function MapIteratorCheckModCount() {
    if( this._modCount !== this._map._modCount ) {
        throw new Error( "map cannot be mutated while iterating" );
    }
}

/**
 * Description.
 *
 *
 */
function SetIteratorCheckModCount() {
    if( this._modCount !== this._set._modCount ) {
        throw new Error( "set cannot be mutated while iterating" );
    }
}
