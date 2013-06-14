var array = (function(){
    "use strict";

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

    function arrayBinarySearchValue( array, value ) {
        return arrayBinarySearch( array, function( v, mustEqual ) {
            if( mustEqual === true ) {
                return v === value ? 0 : -1;
            }
            return v >= value ? 1 : -1;
        });
    }

    function arrayBinarySearchKeyValue( array, key, value ) {
        return arrayBinarySearch( array, function( v, mustEqual ) {
            if( mustEqual === true ) {
                return v[key] === value ? 0 : 1;
            }
            return v[key] >= value ? 1 : -1;
        });
    }

    function arrayFill( array, value ) {
        return arrayFillFromTo( array, 0, array.length - 1, value );
    }

    function arrayFillFrom( array, value, startIndex ) {
        return arrayFillFromTo( array, startindex, array.length - 1, value );
    }

    function arrayFillFromTo( array, startIndex, endIndex, value ) {
        for( var i = startIndex; i <= endIndex; ++i ) {
            array[i] = value;
        }
        return array;
    }

    function arrayContains( array, value ) {
        return arraySearch( array, value ) !== -1;
    }

    function arrayContainsFrom( array, startIndex, value ) {
        return arraySearch( array, startIndex, value ) !== -1;
    }

    function arrayContainsFromTo( array, startIndex, endIndex, value ) {
        return arraySearch( array, startIndex, endIndex, value ) !== -1;
    }

    function arraySearch( array, value ) {
        return arraySearchFromTo( array, 0, array.length - 1, value );
    }

    function arraySearchFrom( array, startIndex, value ) {
        return arraySearchFromTo( array, startIndex, array.length - 1, value );
    }

    function arraySearchFromTo( array, startIndex, endIndex, value ) {
        for( var i = startIndex; i <= endIndex; ++i ) {
            if( array[i] === value ) {
                return i;
            }
        }
        return -1;
    }

    function arraySearchFn( array, fn ) {
        return arraySearchFromTo( array, 0, array.length - 1, fn );
    }

    function arraySearchFromFn( array, startIndex, fn ) {
        return arraySearchFromTo( array, startIndex, array.length - 1, fn );
    }

    function arraySearchFromToFn( array, startIndex, endIndex, fn ) {
        for( var i = startIndex; i <= endIndex; ++i ) {
            if( fn( array[i] ) === true ) {
                return i;
            }
        }
        return -1;
    }

    function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
        for( var j = 0; j < len; ++j ) {
            dst[j + dstIndex ] = src[j + srcIndex];
        }
    }

    function arrayMap( array, fn ) {
        return arrayMapInto( array, array, fn );
    }

    function arrayWithMapping( array, fn ) {
        return arrayMapInto( array, new Array( array.length ), fn );
    }

    function arrayMapInto( src, dst, fn ) {
        for( var i = 0, len = src.length; i < len; ++i ) {
            dst[i] = fn( src[i], i, src );
        }
        return dst;
    }

    function arrayEach( array, fn ) {
        for( var i = 0, len = array.length; i < len; ++i ) {
            fn( array[i], i, array );
        }
        return array;
    }

    function arraySome( array, fn ) {
        for( var i = 0, len = array.length; i < len; ++i ) {
            if( fn( array[i], i, array ) === true ) {
                return true;
            }
        }
        return false;
    }

    function arrayEvery( array, fn ) {
        for( var i = 0, len = array.length; i < len; ++i ) {
            if( fn( array[i], i, array ) !== true ) {
                return false;
            }
        }
        return true;
    }

    function arrayReduce( array, fn, init ) {
        "use strict";
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

    function arrayZip( src, dst ) {
        var ret = new Array(src.length);
        for( var i = 0, len = ret.length; i < len; ++i ) {
            ret[i] = [src[i], dst[i]];
        }
        return ret;
    }

    function arrayRemoveOne( array, value ) {
        return arrayRemoveAt( array, arraySearch( array, value ) );
    }

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

    function arrayRemoveAtMany( array, index, count ) {
        var len = array.length;
        count = Math.min( len - index, count );
        len = len - count
        for( var i = index; i < len; ++i ) {
            for( var j = count; j > 0; --j ) {
                array[ i + j - 1 ] = array[ i + j ];
            }
        }
        array.length = len;
        return array;
    }

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

    function arrayConcat( src, dst ) {
        var ret = new Array(src.length+dst.length),
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
    }
})();