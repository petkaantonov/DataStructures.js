/* exported array */
var array = (function(){

"use strict";

/**
 * Description.
 *
 *
 */
function arrayReverse( array ) {
    var m = array.length - 1,
        len = array.length >> 1;
    for( var i = 0; i < len; ++i ) {
        var tmp = array[i];
        array[i] = array[m-i];
        array[m-i] = tmp;
    }
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayBinarySearch( array, fn ) {
    var min = 0,
        max = array.length - 1;

    while( min < max ) {
        var mid = ( max + min ) >> 1;

        if( fn( array[ mid ], false ) < 0 ) {
            min = mid + 1;
        }
        else {
            max = mid;
        }
    }
    if( max === min && fn( array[ min ], true ) === 0 ) {
        return min;
    }
    else {
        return -1;
    }
}

/**
 * Description.
 *
 *
 */
function arrayBinarySearchValue( array, value ) {
    return arrayBinarySearch( array, function( v, mustEqual ) {
        if( mustEqual === true ) {
            return v === value ? 0 : -1;
        }
        return v >= value ? 1 : -1;
    });
}

/**
 * Description.
 *
 *
 */
function arrayBinarySearchKeyValue( array, key, value ) {
    return arrayBinarySearch( array, function( v, mustEqual ) {
        if( mustEqual === true ) {
            return v[key] === value ? 0 : 1;
        }
        return v[key] >= value ? 1 : -1;
    });
}

/**
 * Description.
 *
 *
 */
function arrayFill( array, value ) {
    return arrayFillFromTo( array, 0, array.length - 1, value );
}

/**
 * Description.
 *
 *
 */
function arrayFillFrom( array, value, startIndex ) {
    return arrayFillFromTo( array, startIndex, array.length - 1, value );
}

/**
 * Description.
 *
 *
 */
function arrayFillFromTo( array, startIndex, endIndex, value ) {
    for( var i = startIndex; i <= endIndex; ++i ) {
        array[i] = value;
    }
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayContains( array, value ) {
    return arraySearch( array, value ) !== -1;
}

/**
 * Description.
 *
 *
 */
function arrayContainsFrom( array, startIndex, value ) {
    return arraySearch( array, startIndex, value ) !== -1;
}

/**
 * Description.
 *
 *
 */
function arrayContainsFromTo( array, startIndex, endIndex, value ) {
    return arraySearch( array, startIndex, endIndex, value ) !== -1;
}

/**
 * Description.
 *
 *
 */
function arraySearch( array, value ) {
    return arraySearchFromTo( array, 0, array.length - 1, value );
}

/**
 * Description.
 *
 *
 */
function arraySearchFrom( array, startIndex, value ) {
    return arraySearchFromTo( array, startIndex, array.length - 1, value );
}

/**
 * Description.
 *
 *
 */
function arraySearchFromTo( array, startIndex, endIndex, value ) {
    for( var i = startIndex; i <= endIndex; ++i ) {
        if( array[i] === value ) {
            return i;
        }
    }
    return -1;
}

/**
 * Description.
 *
 *
 */
function arraySearchFn( array, fn ) {
    return arraySearchFromTo( array, 0, array.length - 1, fn );
}

/**
 * Description.
 *
 *
 */
function arraySearchFromFn( array, startIndex, fn ) {
    return arraySearchFromTo( array, startIndex, array.length - 1, fn );
}

/**
 * Description.
 *
 *
 */
function arraySearchFromToFn( array, startIndex, endIndex, fn ) {
    for( var i = startIndex; i <= endIndex; ++i ) {
        if( fn( array[i] ) === true ) {
            return i;
        }
    }
    return -1;
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

/**
 * Description.
 *
 *
 */
function arrayMap( array, fn ) {
    return arrayMapInto( array, array, fn );
}

/**
 * Description.
 *
 *
 */
function arrayWithMapping( array, fn ) {
    return arrayMapInto( array, new Array( array.length ), fn );
}

/**
 * Description.
 *
 *
 */
function arrayMapInto( src, dst, fn ) {
    for( var i = 0, len = src.length; i < len; ++i ) {
        dst[i] = fn( src[i], i, src );
    }
    return dst;
}

/**
 * Description.
 *
 *
 */
function arrayEach( array, fn ) {
    for( var i = 0, len = array.length; i < len; ++i ) {
        fn( array[i], i, array );
    }
    return array;
}

/**
 * Description.
 *
 *
 */
function arraySome( array, fn ) {
    for( var i = 0, len = array.length; i < len; ++i ) {
        if( fn( array[i], i, array ) === true ) {
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
function arrayEvery( array, fn ) {
    for( var i = 0, len = array.length; i < len; ++i ) {
        if( fn( array[i], i, array ) !== true ) {
            return false;
        }
    }
    return true;
}

/**
 * Description.
 *
 *
 */
function arrayReduce( array, fn, init ) {
    var len = array.length,
        i = 0;

    if( arguments.length < 3 ) {
        if( len < 1 ) {
            return null;
        }
        else {
            i = 1;
            init = array[0];
        }
    }
    else {
        i = 0;
    }

    for( ; i < len; ++i ) {
        init = fn( init, array[i], i, array );
    }
    return init;
}

/**
 * Description.
 *
 *
 */
function arrayZip( src, dst ) {
    var ret = new Array(src.length);
    for( var i = 0, len = ret.length; i < len; ++i ) {
        ret[i] = [src[i], dst[i]];
    }
    return ret;
}

/**
 * Description.
 *
 *
 */
function arrayRemoveOne( array, value ) {
    return arrayRemoveAt( array, arraySearch( array, value ) );
}

/**
 * Description.
 *
 *
 */
function arrayRemoveAll( array, value ) {
    var i = 0, j;

    while( true ) {
        j = arraySearchFrom( array, i, value );

        if( j === -1 ) {
            break;
        }
        else {
            arrayRemoveAt( array, j );
        }
        i = j;
    }

    return array;
}

/**
 * Description.
 *
 *
 */
function arrayRemoveAt( array, index ) {
    var len = array.length;
    if( index >= len ) {
        return array;
    }
    for( var i = index, len = array.length - 1; i < len; ++i ) {
        array[ i ] = array[ i + 1 ];
    }
    array.length = len;
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayRemoveAtMany( array, index, count ) {
    var len = array.length;
    count = Math.min( len - index, count );
    len = len - count;
    for( var i = index; i < len; ++i ) {
        for( var j = count; j > 0; --j ) {
            array[ i + j - 1 ] = array[ i + j ];
        }
    }
    array.length = len;
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayInsertAt( array, index, value ) {
    var len = array.length;
    if( index >= len ) {
        array.push( value );
        return array;
    }
    array.push( value );
    for( var i = array.length - 1; i > index; --i ) {
        array[ i ] = array[ i - 1 ];
    }
    array[ index ] = value;
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayInsertAtMany( array, index, values ) {
    var len,
        origLen = array.length;
    if( index >= origLen ) {
        array.push.apply( array, values );
        return array;
    }
    len = values.length;
    array.length = origLen + len;
    for( var i = 0; i < len; ++i ) {
        array[ origLen + 1 ] = values[ i ];
    }
    for( var i = array.length - len; i > index; --i ) {
        array[ i + len - 1 ] = array[ i - 1 ];
    }
    for( var i = 0; i < len; ++i ) {
        array[ index + i] = values[i];
    }
    return array;
}

/**
 * Description.
 *
 *
 */
function arrayConcat( src, dst ) {
    var ret = new Array(src.length+dst.length),
        len,
        i;

    for( i = 0, len = src.length; i < len; ++i ) {
        ret[i] = src[i];
    }
    var j = i;
    for( i = 0, len = dst.length; i < len; ++i ) {
        ret[j++] = dst[i];
    }
    return ret;
}

return {
    reverse: arrayReverse,
    binarySearch: arrayBinarySearch,
    binarySearchValue: arrayBinarySearchValue,
    binarySearchKeyValue: arrayBinarySearchKeyValue,
    fill: arrayFill,
    fillFrom: arrayFillFrom,
    fillFromTo: arrayFillFromTo,
    contains: arrayContains,
    containsFrom: arrayContainsFrom,
    containsFromTo: arrayContainsFromTo,
    search: arraySearch,
    searchFrom: arraySearchFrom,
    searchFromTo: arraySearchFromTo,
    searchFn: arraySearchFn,
    searchFromFn: arraySearchFromFn,
    searchFromToFn: arraySearchFromToFn,
    copy: arrayCopy,
    map: arrayMap,
    mapInto: arrayMapInto,
    withMapping: arrayWithMapping,
    each: arrayEach,
    some: arraySome,
    every: arrayEvery,
    zip: arrayZip,
    reduce: arrayReduce,
    removeOne: arrayRemoveOne,
    removeAll: arrayRemoveAll,
    removeAt: arrayRemoveAt,
    removeAtMany: arrayRemoveAtMany,
    insertAt: arrayInsertAt,
    insertAtMany: arrayInsertAtMany,
    concat: arrayConcat
};
})();