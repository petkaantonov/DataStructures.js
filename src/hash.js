/* global isArray, uid, MersenneTwister */
/* exported hash */
var hash = (function() {

var haveTypedArrays = typeof ArrayBuffer !== "undefined" &&
        typeof Uint32Array !== "undefined" &&
        typeof Float64Array !== "undefined";

var seeds = [
    5610204, 986201666, 907942159, 902349351, 797161895, 789759260,
    711023356, 576887056, 554056888, 546816461, 546185508, 524085435,
    459334166, 456527883, 383222467, 301138872, 147250593, 103672245,
    44482651, 874080556, 634220932, 600693396, 598579635, 575448586,
    450435477, 320251763, 315455317, 171499680, 164922379, 113615305,
    891544618, 787150959, 781424867, 692252409, 681534962, 600000618,
    507066596, 449273102, 169958990, 878159962, 794651257, 696691070,
    575407780, 567682439, 533628822, 458239955, 387357286, 373364136,
    345493840, 312464221, 303942867, 53740513, 874713788, 737200732,
    689774193, 557290539, 491474729, 463844961, 381345944, 235288247,
    146111809, 952752630, 870989848, 850671622, 818854957, 579958572,
    376499176, 93332135, 24878659, 969563338, 876939429, 863026139,
    877798289, 409188290, 382588822, 170007484, 456227876, 95501317,
    577863864, 559755423, 972015729, 582556160, 543151278, 451276979,
    401520780, 285701754, 101224795
];


var seed = seeds[ ( Math.random() * seeds.length ) | 0 ];

var seedTable = (function(){
    var ArrayConstructor = typeof Int32Array !== "undefined" ?
            Int32Array :
            Array;
    var r = new ArrayConstructor( 8192 );

    var m = new MersenneTwister( seed );

    for( var i = 0; i < r.length; ++i ) {
        r[i] = ( m.genrandInt32() & 0xFFFFFFFF );
    }
    return r;

})();


/**
 * Calculates a hash integer value for the given boolean.
 *
 * @param {boolean} b The input boolean.
 * @return {int} The hash.
 *
 */
function hashBoolean( b ) {
    var x = seedTable[0];
    var a = (b ? 7 : 3 );
    x = (seedTable[a] ^ x);
    return x;
}

/**
 * Calculates a hash integer value for the given string.
 * Strings with .length > 8191 will have a simple hash
 * based on the length only.
 *
 * @param {string} str The input string.
 * @return {int} The hash.
 *
 */
function hashString( str ) {
    var x = seedTable[0],
        len = str.length & 0x3FFFFFFF;

    if( len > 8191 ) {
        return hashInt( len );
    }

    for( var i = 0; i < len; ++i ) {
        x = ( ( str.charCodeAt( i ) & 0xFF ) * seedTable[ i ] + x ) | 0;
    }

    return x & 0x3FFFFFFF;
}

/**
 * Calculates a hash integer value for the given integer.
 * Using the integer itself would cause a lot of probing.
 *
 * @param {int} i The input integer.
 * @return {int} The hash.
 *
 */
function hashInt( i ) {
    var r = ( ( seedTable[ ( i & 0xFF) ] ) ^
        ( ( seedTable[ ( ( i >> 8 ) & 0xFF ) | 0x100 ] >> 1) ^
        ( ( seedTable[ ( ( i >> 16 ) & 0xFF ) | 0x200 ] >> 2) ^
        ( ( seedTable[ ( ( i >> 24 ) & 0xFF) | 0x300 ] >> 3) ^
        seedTable[ 0 ] ) ) ) );
    return r & 0x3FFFFFFF;
}

if( haveTypedArrays ) {
    var FLOAT_BUFFER = new ArrayBuffer( 8 ),
        FLOAT_BUFFER_FLOAT_VIEW = new Float64Array( FLOAT_BUFFER ),
        FLOAT_BUFFER_INT_VIEW = new Int32Array( FLOAT_BUFFER );

    /**
     * Calculates a hash integer value for the given floating
     * point number. Relies on the ability to read binary
     * representation of the float for a good hash.
     *
     * @param {float} f The input float.
     * @return {int} The hash.
     *
     */
    var hashFloat = function hashFloat( f ) {
        var x = seedTable[0];
        FLOAT_BUFFER_FLOAT_VIEW[0] = f;
        var i = FLOAT_BUFFER_INT_VIEW[0];
        var a = ((i >> 24) & 0xFF) | 0x700;
        x = (seedTable[a] >> 7) ^ x;
        a = ((i >> 16) & 0xFF) | 0x600;
        x = (seedTable[a] >> 6) ^ x;
        a = ((i >> 8) & 0xFF) | 0x500;
        x = (seedTable[a] >> 5) ^ x;
        a = (i & 0xFF) | 0x400;
        x = (seedTable[a] >> 4) ^ x;
        i = FLOAT_BUFFER_INT_VIEW[1];
        a = ((i >> 24) & 0xFF) | 0x300;
        x = (seedTable[a] >> 3) ^ x;
        a = ((i >> 16) & 0xFF) | 0x200;
        x = (seedTable[a] >> 2) ^ x;
        a = ((i >> 8) & 0xFF) | 0x100;
        x = (seedTable[a] >> 1) ^ x;
        a = (i & 0xFF);
        x = (seedTable[a]) ^ x;
        return x & 0x3FFFFFFF;
    };
}
else {
    var hashFloat = hashInt;
}

/**
 * Calculates a int hash value for the given input
 * array.
 *
 * @param {Array.<dynamic>} array The input array.
 * @return {int} The hash.
 *
 */
function hashArray( array ) {
    var x = seedTable[0],
        len = array.length & 0x3FFFFFFF;

    for( var i = 0; i < len; ++i ) {
        var val = array[i];
        if( val === array ) {//Skip infinite recursion
            continue;
        }
        x = ( ( hash( array[i], 0x40000000 ) +
            seedTable[ i & 8191 ] ) ^ x ) | 0;
    }

    return x & 0x3FFFFFFF;
}

/**
 * Returns a hash integer value for the given object. Calls
 * .valueOf() of the object which should return an integer.
 * However, by default it will return the object itself, in
 * which case identity hash is used.
 *
 * @param {Object|null} obj The object to hash. Can be null.
 * @return {int} The hash.
 *
 */
function hashObject( obj ) {
    if( obj == null ) {
        return seedTable[134];
    }
    var ret;
    //valueOf returned a number
    if( ( ret = obj.valueOf() ) !== obj ) {
        return ret;
    }
    return uid( obj );
}

/**
 * Returns an integer hash of the given value. Supported
 * types are:
 *
 * Strings, integers, floats, objects and arrays of
 * them.
 *
 * @param {dynamic} val The value to hash.
 * @param {int} tableSize The amount of buckets in the hash table.
 * Must be a power of two.
 * @return {int}
 *
 */
function hash( val, tableSize ) {
    var t = typeof val,
        bitAnd = tableSize - 1;
    if( t === "string" ) {
        return hashString( val ) & bitAnd;
    }
    else if( t === "number" ) {
        if( ( val | 0 ) === val ) {
            return hashInt( val & 0x3FFFFFFF ) & bitAnd;
        }
        return hashFloat( val ) & bitAnd;
    }
    else if( t === "boolean" ) {
        return hashBoolean( val ) & bitAnd;
    }
    else {
        if( isArray( val ) ) {
            return hashArray( val ) & bitAnd;
        }
        return hashObject( val ) & bitAnd;
    }
}

return hash;})();
