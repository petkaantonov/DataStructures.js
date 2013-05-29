/* exported RED, BLACK, arePrimitive, defaultComparer, arrayCopy, composeComparators,
    comparePosition, invertedComparator, True, Null */
/* global uid */
var BLACK = true,
    RED = false,
    OBJ = {}.constructor;


function arePrimitive( a, b ) {
    return OBJ(a) !== a &&
           OBJ(b) !== b;
}


function defaultComparer( a,b ) {
    //primitive or obj with .valueOf() returning primitive
    if( a < b ) {
        return -1;
    }
    if( a > b ) {
        return 1;
    }

    //equal primitives or uncomparable objects for which .valueOf() returns just the object itself
    a = a.valueOf();
    b = b.valueOf();

    if( arePrimitive(a, b ) ) {
        return 0; //Since they were primitive, and < > compares
                  //primitives, they must be equal
    }
    else { //uncomparable objects
        //the expando property is enumerable in ie <9
        a = uid(a);
        b = uid(b);
        return a < b ? -1 : a > b ? 1 : 0;
    }
}

function arrayCopy( arr ) {
    var a = [];

    for( var i = 0; i < arr.length; ++i ) {
        a.push(arr[i]);
    }

    return a;
}

function composeComparators( arg ) {
    if( !Array.isArray(arg) ) {
        arg = arrayCopy(arguments);
    }
    return function( a, b ) {
        for( var i = 0; i < arg.length; ++i ) {
            var result = arg[i](a, b);
            if( result !== 0 ) {
                return result;
            }
        }
    };
}

// Compare Position - MIT Licensed, John Resig
function comparePosition(a, b){
    return a.compareDocumentPosition ?
        a.compareDocumentPosition(b) :
        a.contains ?
            (a !== b && a.contains(b) && 16) +
                (a !== b && b.contains(a) && 8) +
                (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
                    (a.sourceIndex < b.sourceIndex && 4) +
                        (a.sourceIndex > b.sourceIndex && 2) :
                    1) +
            0 :
            0;
}

function invertedComparator( arg ) {
    return function( a, b ) {
        return -1 * arg( a, b );
    };
}

function True() {
    return true;
}

function NULL() {}

var NIL = new NULL();

NIL.left = NIL.right = NIL.key = NIL.contents = NIL.parent = void 0;
NIL.subtreeCount = 0;
NIL.color = BLACK;