/**
 * @preserve Copyright (c) 2012 Petka Antonov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
;(function(global) {
    "use strict";;
/* exported hasOwn, toString, isArray, uid,
    toList, toListOfTuples,
    copyProperties, setIteratorMethods, MapForEach, SetForEach, exportCtor,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, SetToJSON,
    SetValueOf, SetToString, MapToJSON, MapValueOf, MapToString, arrayCopy, arraySearch
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


//Takes a constructor function and returns a function that can instantiate the constructor
//Without using the new- keyword.

//Also copies any properties of the constructor unless they are underscore prefixed
//(includes .prototype, so it can still be monkey-patched from outside)
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
                instantiateCode += "case "+ (i + 1) + ": return new Constructor(" + params.slice(0, i + 1).join( ", " ) + ");\n";
            }
            instantiateCode += "case 0: return new Constructor();\n}\nthrow new Error(\"too many arguments\");\n";
        }
        else {
            instantiateCode = "return new Constructor();";
        }

        var code = "return function ConstructorProxy(" + params.join( ", " ) + ") { \"use strict\"; " + instantiateCode + "};";

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

function arraySearch( array, startIndex, length, value ) {
    for( var i = startIndex; i < length; ++i ) {
        if( array[i] === value ) {
            return true;
        }
    }
    return false;
}

function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
    for( var j = 0; j < len; ++j ) {
        dst[j + dstIndex ] = src[j + srcIndex];
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
;
/* jshint -W079 */
/* exported Object */
var Object = (function( Object ) {

    return {
        /* For inheritance without invoking the parent constructor */
        create: Object.create || function( proto ) {
            if( proto === null ) {
                return {};
            }
            function Type(){}
            Type.prototype = proto;
            return new Type();
        },

        defineProperties: Object.defineProperties,
        defineProperty: Object.defineProperty,
        freeze: Object.freeze,
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
        getOwnPropertyNames: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        is: Object.is,
        isExtensible: Object.isExtensible,
        isFrozen: Object.isFrozen,
        isSealed: Object.isSealed,
        keys: Object.keys,
        preventExtensions: Object.preventExtensions,
        seal: Object.seal,
        prototype: Object.prototype
    };


})( ({}.constructor) );
;
/* exported RED, BLACK, arePrimitive, defaultComparer, composeComparators,
    comparePosition, invertedComparator, True, Null */
/* global uid, arrayCopy */
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


function composeComparators( arg ) {
    if( !Array.isArray(arg) ) {
        arg = arrayCopy(arguments, 0, [], 0, arguments.length);
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
NIL.color = BLACK;;
/* global RED, NIL */
var RedBlackNode = (function() {
    var method = RedBlackNode.prototype;

    function RedBlackNode(key, value, parent) {
        this.left = NIL;
        this.right = NIL;
        this.parent = parent;
        this.key = key;
        this.value = value;
        this.color = RED;
        this.subtreeCount = 1;
    }

    method.setValue = function( value ) {
        this.value = value;
    };

    method.getValue = function() {
        return this.value;
    };

    method.getUncle = function() {
        var gp = this.getGrandparent();

        if( !gp ) {
            return NIL;
        }

        if( gp.left === this.parent ) {
            return gp.right;
        }
        else if( gp.right === this.parent ) {
            return gp.left;
        }
        else {
            return NIL;
        }
    };

    method.getGrandparent = function() {
        if( this.parent && this.parent.parent ) {
            return this.parent.parent;
        }
        return null;
    };

    method.isRightChild = function() {
        return !!(this.parent && this.parent.right === this);
    };

    method.isLeftChild = function() {
        return !!(this.parent && this.parent.left === this);
    };

    method.setLeftChild = function( node ) {
        this.left = node;
        if( node && node !== NIL ) {
            node.parent = this;
        }
    };

    method.setRightChild = function( node ) {
        this.right = node;
        if( node && node !== NIL ) {
            node.parent = this;
        }
    };

    method.getSuccessor = function() {
        if( this.right !== NIL ) {
            var node = this.right;
            while( node.left !== NIL ) {
                node = node.left;
            }
            return node;
        }
        else {
            var parent = this.parent;
            var firstLeft = this;

            while (firstLeft.isRightChild()) {
                firstLeft = parent;
                parent = parent.parent;
            }

            return parent || null;
        }
    };

    method.getPrecedessor = function() {
        if( this.left !== NIL ) {
            var node = this.left;
            while( node.right !== NIL ) {
                node = node.right;
            }
            return node;
        }
        else {
            var parent = this.parent;
            var firstRight = this;

            while (firstRight.isLeftChild()) {
                firstRight = parent;
                parent = parent.parent;
            }

            return parent || null;
        }
    };

    method.rotateLeft = function() {
        var right = this.right,
            parent = this.parent;


        this.setRightChild(right.left);

        if( this.isRightChild() ) {
            parent.setRightChild(right);
        }
        else if( this.isLeftChild() ) {
            parent.setLeftChild(right);
        }
        else {
            right.parent = null;
        }

        right.setLeftChild(this);

        this.subtreeCount = 1 + this.left.subtreeCount + this.right.subtreeCount;
        right.subtreeCount = 1 + right.left.subtreeCount + right.right.subtreeCount;
    };


    method.rotateRight = function() {
        var left = this.left,
            parent = this.parent;

        this.setLeftChild(left.right);

        if( this.isRightChild()) {
            parent.setRightChild(left);
        }
        else if( this.isLeftChild() ) {
            parent.setLeftChild(left);
        }
        else {
            left.parent = null;
        }

        left.setRightChild(this);

        this.subtreeCount = 1 + this.left.subtreeCount + this.right.subtreeCount;
        left.subtreeCount = 1 + left.left.subtreeCount + left.right.subtreeCount;
    };
    return RedBlackNode;
})();



;
/* global RED, BLACK, NIL, defaultComparer, RedBlackNode */
var RedBlackTree = (function() {

    var method = RedBlackTree.prototype;

    function RedBlackTree( comparator ) {
        this.root = null;
        this.length = 0;
        this.comparator = typeof comparator === "function" ? comparator : defaultComparer;
        this.modCount = 0;
    }

    method.size = method.length = function length() {
        return this.length;
    };

    //The root reference might point to wrong node after insertion/deletion
    //simply find the node without parent is the new root
    //The cost is often 0 or 1-2 operations in worst case because
    //the root only changes when the rotations are happening near it
    method.updateRootReference = function updateRootReference() {
        var cur = this.root;
        if( cur && cur.parent ) {
            while( ( cur = cur.parent ) ) {
                if( !cur.parent ) {
                    this.root = cur;
                    break;
                }
            }
        }
    };

    method.getComparator = function getComparator() {
        return this.comparator;
    };


    method.modified = function modified() {
        this.modCount++;
    };

    method.clear = function clear() {
        this.modified();
        this.root = null;
        this.length = 0;
    };

    method.set = function set( key, value ) {
        if( key == null ) {
            return void 0;
        }
        if( value === void 0 ) {
            return void 0;
        }
        this.modified();

        var node = key instanceof RedBlackNode ? key : this.nodeByKey( key ),
            ret = void 0;

        if( node ) {
            ret = node.value;
            node.setValue( value );
        }
        else {
            insert.call( this, key, value );
        }
        return ret;
    };

    method.setAt = function setAt( index, value ) {
        if( value === void 0 ) {
            return;
        }
        var node = this.nodeByIndex( index );

        if( node ) {
            return this.set( node, value );
        }
    };

    method.unsetAt = function unsetAt( index ) {
        var node = this.nodeByIndex( index );

        if( node ) {
            return this.unset( node );
        }
    };

    method.unset = function unset( key ) {
        if( key == null ) {
            return void 0;
        }
        this.modified();
        var node = key instanceof RedBlackNode ? key : this.nodeByKey( key );

        if( node ) {

            var newRoot = treeRemove( this.root, node );
            this.length--;
            if( newRoot !== void 0 ) {
                this.root = newRoot;
            }
            else {
                this.updateRootReference();
            }
            return node;
        }
        else {
            return void 0;
        }
    };



    //node with key >= inputKey
    method.nodeByKeyAtLeast = function nodeByKeyAtLeast( key ) {
        return greaterKeys.call( this, key, true );
    };

    //node with key > inputKey
    method.nodeByGreaterKey = function nodeByGreaterKey( key ) {
        return greaterKeys.call( this, key, false );
    };

    //node with key <= inputKey
    method.nodeByKeyAtMost = function nodeByKeyAtMost( key ) {
        return lesserKeys.call( this, key, true );
    };

    //node with key < inputKey
    method.nodeByLesserKey = function nodeByLesserKey( key ) {
        return lesserKeys.call( this, key, false );

    };

    method.nodeByKey = function nodeByKey( key ) {
        if( key == null ) {
            return void 0;
        }
        var node = this.root;

        if( !node ) {
            return void 0;
        }

        while( node !== NIL ) {
            var comp = this.comparator( node.key, key );
            if( comp === 0 ) {
                return node;
            }
            else {
                node = comp > 0 ? node.left : node.right;
            }
        }
        return void 0;
    };

    method.indexOfNode = function indexOfNode( node ) {
        if( !node ) {
            return -1;
        }

        var ret = rank( this.root, node );
        if( ret ) {
            return ret - 1;
        }
        return -1;
    };

    method.indexOfKey = function indexOfKey( key ) {
        if( key == null ) {
            return void 0;
        }

        return this.indexOfNode( this.nodeByKey( key ) );
    };

    method.nodeByIndex = function nodeByIndex( index ) {
        index = +index;
        if( !isFinite( index ) ) {
            return void 0;
        }
        if( index < 0 ) {
            index = index + this.length;
        }
        if( index < 0 ) {
            return this.firstNode();
        }
        if( index >= this.length ) {
            return this.lastNode();
        }

                               //OS-Select indexing is 1-based
        return nthNode( this.root, index + 1 );
    };

    method.firstNode = function firstNode() {
        var cur = this.root,
            prev;

        if( !cur ) {
            return void 0;
        }

        while( cur !== NIL ) {
            prev = cur;
            cur = cur.left;
        }
        return prev;
    };

    method.lastNode = function lastNode() {
        var cur = this.root,
            prev;

        if( !cur ) {
            return void 0;
        }

        while( cur !== NIL ) {
            prev = cur;
            cur = cur.right;
        }
        return prev;
    };

    method.iterator = function iterator() {
        return new Iterator( this );
    };



    var rotateWords = {
        left: "rotateLeft",
        right: "rotateRight"
    };

    var LEFT = "left",
        RIGHT = "right";

    function treeRemoveFix( root, node ) {

        while( node.color === BLACK && node !== root) {
            var isLeft = node.isLeftChild(),
                dir = isLeft ? LEFT : RIGHT, //Avoid duplicating the symmetry
                rotateDir = rotateWords[dir],
                oppositeDir = isLeft ? RIGHT : LEFT,
                rotateOppositeDir = rotateWords[oppositeDir];

            var parent = node.parent,
                sibling = parent[oppositeDir];

            if( sibling.color === RED ) {
                sibling.color = BLACK;
                parent.color = RED;
                parent[rotateDir]();
                sibling = parent[oppositeDir];
            }

            if( sibling[dir].color === BLACK &&
                sibling[oppositeDir].color === BLACK ) {
                sibling.color = RED;
                node = node.parent;
            }
            else {
                if( sibling[oppositeDir].color === BLACK ) {
                    sibling[dir].color = BLACK;
                    sibling.color = RED;
                    sibling[rotateOppositeDir]();
                    sibling = node.parent[oppositeDir];
                }

                sibling.color = node.parent.color;
                node.parent.color = BLACK;
                sibling[oppositeDir].color = BLACK;
                node.parent[rotateDir]();
                node = root;
            }
        }
        node.color = BLACK;
    }

    //Return new value for root, undefined otherwise
    function treeRemove( root, node ) {
        var current, successor;

        if( node.left !== NIL &&
            node.right !== NIL ) {
            successor = node.getSuccessor();
            node.key = successor.key;
            node.value = successor.value;
            node = successor;
        }

        if( node.left !== NIL ) {
            current = node.left;
        }
        else {
            current = node.right;
        }

        if( current !== NIL ) {
            var parent = node.parent;

            if( node.isLeftChild() ) {
                parent.setLeftChild(current);
            }
            else if( node.isRightChild() ) {
                parent.setRightChild(current);
            }

            node.left = node.right = NIL;

            var upd = current;
            while( upd ) {
                upd.subtreeCount = upd.left.subtreeCount + upd.right.subtreeCount + 1;
                upd = upd.parent;
            }

            if( node.color === BLACK ) {
                treeRemoveFix(parent ? root : current, current);
            }

            if( !parent ) {
                current.parent = null;
                return current;
            }
        }
        else if( !node.parent ) {
            return null;
        }
        else {
            if( node.color === BLACK ) {
                treeRemoveFix( root, node );
            }

            if( node.isLeftChild() ) {
                node.parent.setLeftChild(NIL);
            }
            else if( node.isRightChild() ) {
                node.parent.setRightChild(NIL);
            }

            var upd = node;
            while( upd ) {
                upd.subtreeCount = upd.left.subtreeCount + upd.right.subtreeCount + 1;
                upd = upd.parent;
            }
        }
    }



    //Return true if the node was inserted into the tree, false otherwise
    function treeInsert( fn, root, node ) {

        while( root && root !== NIL ) {
            var comp = fn( root.key, node.key );

            if( comp === 0 ) {
                return false;
            }
            root.subtreeCount++;
            if( comp > 0 ) {

                if( root.left === NIL ) {
                    root.setLeftChild(node);
                    return true;
                }
                else {
                    root = root.left;
                }
            }
            else {
                if( root.right === NIL ) {
                    root.setRightChild(node);
                    return true;
                }
                else {
                    root = root.right;
                }
            }

        }
        return false;
    }

    function insert( key, value ) {
        var node = new RedBlackNode(key, value, null);
        if( !this.root ) {
            this.root = node;
            this.length = 1;
            node.color = BLACK;
        }
        else if( treeInsert( this.comparator, this.root, node ) ) {
            this.length++;
            while( node.parent && node.parent.color === RED ) {

                var uncle = node.getUncle(),
                    grandparent = node.getGrandparent(),
                    parent = node.parent;

                if( uncle.color === RED ) {
                    parent.color = BLACK;
                    uncle.color = BLACK;
                    grandparent.color = RED;
                    node = grandparent;
                    continue;
                }

                if( parent.isLeftChild() ) {
                    if( node.isRightChild() ) {
                        node = node.parent;
                        node.rotateLeft();
                    }

                    node.parent.color = BLACK;
                    grandparent = node.getGrandparent();
                    grandparent.color = RED;
                    grandparent.rotateRight();

                }
                else if( parent.isRightChild() ) {
                    if( node.isLeftChild() ) {
                        node = node.parent;
                        node.rotateRight();
                    }
                    node.parent.color = BLACK;
                    grandparent = node.getGrandparent();
                    grandparent.color = RED;
                    grandparent.rotateLeft();
                }
            }
            this.updateRootReference();
            this.root.color = BLACK;
        }
    }
    //1-based indexing
    function nthNode( root, n ) {
        while( root && root !== NIL ) {
            var r = root.left.subtreeCount + 1;
            if( n === r ) {
                return root;
            }

            if( n < r ) {
                root = root.left;
            }
            else {
                n -= r;
                root = root.right;
            }
        }
        return void 0;
    }

    function rank( root, node ) {
        if( !root || root === NIL ) {
            return void 0;
        }
        if( !node || node === NIL ) {
            return void 0;
        }
        var i = node.left.subtreeCount + 1;

        while( node !== root ) {
            if( node.isRightChild() ) {
                i += (node.parent.left.subtreeCount + 1);
            }
            node = node.parent;
        }
        return i;
    }

                            //true = less-than-or-equal
                            //false = less-than
    function lesserKeys( key, open ) {
        if( key == null ) {
            return void 0;
        }

        var node = this.root;

        while( node && node !== NIL ) {
            var comp = this.comparator( node.key, key );


            if( open && comp === 0 ) {
                return node;
            }//node's key is less than input key
            else if( comp < 0 ) {
                //there is also no greater keys
                if( node.right === NIL ) {
                    return node;
                }
                else {
                    node = node.right;
                }
            }
            else { //node's key is equal or greater, go for backingNode
                if( node.left !== NIL ) {
                    node = node.left;
                }
                else {
                    //second least node in the tree
                    //return least or undefined
                    return node.getPrecedessor() || void 0;
                }
            }
        }
        return void 0;
    }

                            //true = less-than-or-equal
                            //false = less-than
    function greaterKeys( key, open ) {
        if( key == null ) {
            return void 0;
        }

        var node = this.root;

        while( node && node !== NIL ) {
            var comp = this.comparator( node.key, key );

            if( open && comp === 0 ) {
                return node;
            }   //node's key is greater than input key
            else if( comp > 0 ) {
                //there is also no lesser keys

                if( node.left === NIL ) {
                    return node;
                }
                else {
                    node = node.left;
                }
            }
            else { //node's key is less, try to find a greater key
                if( node.right !== NIL ) {
                    node = node.right;
                }
                else {
                    //second greatest node in the tree
                    //return greatest or undefined
                    return node.getSuccessor() || void 0;
                }
            }
        }
        return void 0;
    }

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( tree ) {
            this.key = this.value = void 0;
            this.index = -1;
            this._modCount = tree.modCount;

            this._index = -1;
            this._tree = tree;
            this._backingNode = null;
            this._currentNode = null;
        }

        method._checkModCount = function _checkModCount() {
            if( this._modCount !== this._tree.modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method._getPrevNode = function _getPrevNode() {
            var ret;
            if( this._currentNode === null ) {
                if( this._backingNode !== null ) {
                    ret = this._backingNode;
                    this._backingNode = null;
                    return ret.getPrecedessor();

                }
                else {
                    ret = this._tree.lastNode();
                }
            }
            else {
                ret = this._currentNode.getPrecedessor();
            }
            return ret;
        };

        method._getNextNode = function _getNextNode() {

            var ret;
            if( this._currentNode === null ) {
                if( this._backingNode !== null ) {
                    ret = this._backingNode;
                    this._backingNode = null;
                    this._index--;
                }
                else {

                    ret = this._tree.firstNode();
                }
            }
            else {
                ret = this._currentNode.getSuccessor();
            }
            return ret;
        };

        method.next = function next() {
            this._checkModCount();

            this._index++;

            if( this._backingNode === null &&
                this._index >= this._tree.size()
            ) {
                this.moveToEnd();
                return false;
            }

            this._currentNode = this._getNextNode();
            this.key = this._currentNode.key;
            this.value = this._currentNode.value;
            this.index = this._index;

            return true;
        };

        method.prev = function prev() {
            this._checkModCount();

            this._index--;

            if( this._index < 0 ||
                this._tree.size() === 0 ) {
                this.moveToStart();
                return false;
            }

            this._currentNode = this._getPrevNode();

            this.key = this._currentNode.key;
            this.value = this._currentNode.value;
            this.index = this._index;

            return true;

        };

        method.moveToStart = function moveToStart() {
            this._checkModCount();

            this._index = -1;
            this.key = this.value = void 0;
            this.index = -1;
            this._currentNode = null;

            return this;
        };

        method.moveToEnd = function moveToEnd() {
            this._checkModCount();

            this._index = this._tree.size();
            this.key = this.value = void 0;
            this.index = -1;
            this._currentNode = null;

            return this;
        };

        method.set = method.put = function put( value ) {
            this._checkModCount();

            if( this._currentNode === null ) {
                return;
            }

            var ret = this.value;
            this._currentNode.value = this.value = value;
            return ret;
        };

        method["delete"] = method.remove = function remove() {
            this._checkModCount();

            if( this._currentNode === null ) {
                return;
            }

            var ret = this._currentNode.value,
                backingNode,
                parent;

            this._backingNode = backingNode = this._currentNode.getSuccessor();

            this._tree.unset( this._currentNode );

            this.key = this.value = void 0;
            this.index = -1;
            this._currentNode = null;
            this._modCount = this._tree.modCount;


            if( backingNode === null ) {
                this.moveToEnd();
            }
            else if( ( parent = backingNode.parent ) !== null &&
                this._tree.comparator( parent.key, backingNode.key ) === 0 ) {
                this._backingNode = parent;
            }

            return ret;
        };


        return Iterator;
    })();

    method._Iterator = Iterator;



    return RedBlackTree;
})();

;
/* global Buffer, uid, MapForEach, toListOfTuples,
    MapIteratorCheckModCount, MapEntries, MapKeys, MapValues, MapValueOf,
    MapToJSON, MapToString */
/* exported Map */
/* jshint -W079 */
var Map = (function() {
    var haveTypedArrays = typeof ArrayBuffer !== "undefined" &&
            typeof Uint32Array !== "undefined" &&
            typeof Float64Array !== "undefined";

    function pow2AtLeast( n ) {
        n = n >>> 0;
        n = n - 1;
        n = n | (n >> 1);
        n = n | (n >> 2);
        n = n | (n >> 4);
        n = n | (n >> 8);
        n = n | (n >> 16);
        return n + 1;
    }

    function hashHash( key, tableSize ) {
        var h = key | 0;
        h =  h ^ ( h >> 20 ) ^ ( h >> 12 );
        return ( h ^ ( h >> 7 ) ^ ( h >> 4 ) ) & ( tableSize - 1 );
    }

    function hashBoolean( bool ) {
        return bool | 0;
    }

    function hashString( str ) {
        var h = 5381,
            i = 0;

        for( var i = 0, l = str.length; i < l; ++i ) {
            h = (((h << 5) + h ) ^ str.charCodeAt( i ) );
        }

        return h;
    }

    var hashNumber = (function() {
        if( haveTypedArrays ) {

            var buffer = new ArrayBuffer( 8 );
            var doubleView = new Float64Array( buffer );
            var Uint32View = new Uint32Array( buffer );

            return function hashFloat( num ) {
                doubleView[0] = num;
                return ( Uint32View[0] ^ Uint32View[1] ) & 0x3FFFFFFF;
            };

        }
        else if( typeof Buffer === "function" &&
                 typeof ((new Buffer()).writeDoubleLE) === "function" ) {

            var buffer = new Buffer( 8 );

            return function hashFloat( num ) {
                buffer.writeDoubleLE( num, 0 );
                return ( buffer.readUInt32LE( 0 ) ^ buffer.readUInt32LE( 4 ) ) & 0x3FFFFFFF;
            };
        }
        else {
            //No support of reading the bits of a double directly as 2 unsigned ints
            return function hashFloat( num ) {
                return num | 0;
            };
        }
    })();

    function hashObject( obj ) {
        if( obj === null ) {
            return 0;
        }
        var ret;
        //valueOf returned a number
        if( ( ret = obj.valueOf() ) !== obj ) {
            return ret;
        }
        return uid( obj );
    }

    function hash( val ) {
        switch( typeof val ) {
        case "number":
            if( ( val | 0 ) === val ) {
                return val & 0x3fffffff;
            }
            return hashNumber( val );
        case "string":
            return hashString( val );
        case "boolean":
            return hashBoolean( val );
        default:
            return hashObject( val );
        }
    }

    function equals( key1, key2 ) {
        return key1 === key2;
    }

    function clampCapacity( capacity ) {
        return Math.max( DEFAULT_CAPACITY, Math.min( MAX_CAPACITY, capacity ) );
    }

    var DEFAULT_CAPACITY = 1 << 4;
    var MAX_CAPACITY = 1 << 30;

    var method = Map.prototype;
    function Map( capacity, equality ) {
        this._buckets = null;
        this._size = 0;
        this._modCount = 0;
        this._capacity = DEFAULT_CAPACITY;
        this._equality = equals;
        this._init( capacity, equality );
    }

    method._init = function _init( capacity, equality ) {
        if( typeof capacity === "function" ) {
            var tmp = equality;
            equality = capacity;
            capacity = tmp;
        }

        if( typeof equality === "function" ) {
            this._equality = equality;
        }

        if( capacity == null ) {
            return;
        }

        switch( typeof capacity ) {
        case "number":
            this._capacity = clampCapacity( pow2AtLeast( capacity ) );
            break;
        case "object":
            var tuples = toListOfTuples( capacity );
            var size = tuples.length;
            var capacity = pow2AtLeast( size );
            if( ( ( size << 2 ) - size ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._capacity = capacity;
            this._setAll( tuples );
            break;
        }
    };

    method._makeBuckets = function _makeBuckets() {
        var capacity = this._capacity;
                                //kInitialMaxFastElementArray = 100000
        var b = this._buckets = new Array( capacity < 99999 ? capacity : 0 );

        for( var i = 0; i < capacity; ++i ) {
            b[i] = null;
        }
    };

    method._hashAsBucketIndex = function _hashAsBucketIndex( hash ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hashHash( hash, this._capacity );
    };

    method._keyAsBucketIndex = function _keyAsBucketIndex( key ) {
        if( this._buckets === null ) {
            this._makeBuckets();
        }
        return hashHash( hash( key ), this._capacity );
    };

    method._resized = function _resized( oldBuckets ) {
        var newBuckets = this._buckets,
            newLen = newBuckets.length,
            oldLength = oldBuckets.length;

        for( var i = 0; i < oldLength; ++i ) {
            var entry = oldBuckets[i];
            while( entry !== null ) {
                var bucketIndex = hashHash( entry.hash, newLen ),
                    next = entry.next;

                entry.next = newBuckets[bucketIndex];
                newBuckets[bucketIndex] = entry;
                entry = next;

            }
            oldBuckets[i] = null;
        }
    };

    method._resizeTo = function _resizeTo( capacity ) {
        capacity = clampCapacity( capacity );
        if( this._capacity >= capacity ) {
            return;
        }
        var oldBuckets = this._buckets;
        this._capacity = capacity;
        this._makeBuckets();

        if( oldBuckets !== null ) {
            this._resized( oldBuckets );
        }
    };

    method._getNextCapacity = function _getNextCapacity() {
        return this._capacity * 2;
    };

    method._isOverCapacity = function _isOverCapacity( size ) {
        return ( ( size << 2 ) - size ) >= ( this._capacity << 1 );
    }; //Load factor of 0.67

    method._checkResize = function _checkResize() {
        if( this._isOverCapacity( this._size ) ) {
            this._resizeTo( this._getNextCapacity() );
        }
    };

    method._getEntryWithKey = function _getEntryWithKey( entry, key ) {
        var eq = this._equality;
        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                return entry;
            }
            entry = entry.next;
        }
        return null;
    };
                                             //Used by Set and OrderedSet
    method._setAll = function _setAll( obj, __value ) {
        if( !obj.length ) {
            return;
        }
        var newSize = obj.length + this._size;

        if( this._isOverCapacity( newSize ) ) {
            var capacity = pow2AtLeast( newSize );
            if( ( ( newSize << 2 ) - newSize ) >= ( capacity << 1 ) ) {
                capacity = capacity << 1;
            }
            this._resizeTo( capacity );
        }

        if( arguments.length > 1 ) {
            for( var i = 0; i < obj.length; ++i ) {
                this.set( obj[i], __value );
            }
        }
        else {
            for( var i = 0; i < obj.length; ++i ) {
                this.set( obj[i][0], obj[i][1] );
            }
        }
    };

    //API

    method.forEach = MapForEach;


    method.clone = function clone() {
        return new this.constructor(
            this.entries(),
            this._equality
        );
    };

    method.containsValue = method.hasValue = function hasValue( value ) {
        if( value === void 0 ) {
            return false;
        }
        var it = this.iterator();
        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.containsKey = method.hasKey = function hasKey( key ) {
        if( key === void 0 ) {
            return false;
        }
        var bucketIndex = this._keyAsBucketIndex( key );
        return this._getEntryWithKey( this._buckets[bucketIndex], key ) !== null;
    };

    method.get = function get( key ) {
        if( key === void 0 ) {
            return void 0;
        }
        var bucketIndex = this._keyAsBucketIndex( key ),
            entry = this._getEntryWithKey( this._buckets[bucketIndex], key );

        if( entry !== null ) {
            entry.accessed( this );
            return entry.value;
        }
        return void 0;
    };


    method["delete"] = method.unset = method.remove = function remove( key ) {
        if( key === void 0 ) {
            return void 0;
        }
        this._modCount++;
        var bucketIndex = this._keyAsBucketIndex( key ),
            ret = void 0,
            entry = this._buckets[bucketIndex],
            eq = this._equality,
            prevEntry = null;

        var eq = this._equality;

        //Find the entry in the bucket
        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                break;
            }
            prevEntry = entry;
            entry = entry.next;
        }

        //It was found in the bucket, remove
        if( entry !== null ) {
            ret = entry.value;
            if( prevEntry === null) { //It was the first entry in the bucket
                this._buckets[bucketIndex] = entry.next;
            }
            else {
                prevEntry.next = entry.next;
            }
            this._size--;
            entry.removed( this );
        }
        return ret;
    };

    method.put = method.set = function set( key, value ) {
        if( key === void 0 || value === void 0) {
            return void 0;
        }
        this._modCount++;
        var h = hash( key ),
            bucketIndex = this._hashAsBucketIndex( h ),
            ret = void 0,
            oldEntry = this._buckets[bucketIndex],
            entry = this._getEntryWithKey( oldEntry, key );

        if( entry === null ) {
            this._size++;
            this._buckets[ bucketIndex ] = entry = new this._entryType( key, value, oldEntry, h );
            entry.inserted( this );
            this._checkResize();
        }
        else {
            ret = entry.value;
            entry.value = value;
            entry.accessed( this );
        }

        return ret;
    };

    method.putAll = method.setAll = function setAll( obj ) {
        this._modCount++;
        var listOfTuples = toListOfTuples( obj );
        this._setAll( listOfTuples );
    };

    method.clear = function clear() {
        this._modCount++;
        if( this._buckets === null ) {
            return;
        }
        this._buckets = null;
        this._size = 0;
    };

    method.length = method.size = function size() {
        return this._size;
    };

    method.isEmpty = function isEmpty() {
        return this._size === 0;
    };


    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function iterator() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this.key = this.value = void 0;
            this.index = -1;
            this._modCount = map._modCount;

            this._index = -1;
            this._map = map;
            this._backingEntry = null;
            this._currentEntry = null;
            this._bucketIndex = -1;

        }

        method._checkModCount = MapIteratorCheckModCount;

        method._getNextEntryFromEntry = function _getNextEntryFromEntry( entry ) {

            if( entry !== null && entry.next !== null ) {
                return entry.next;
            }

            var buckets = this._map._buckets;

            for( var i = this._bucketIndex + 1, l = buckets.length; i < l; ++i ) {
                entry = buckets[i];

                if( entry !== null ) {
                    this._bucketIndex = i;
                    return entry;
                }
            }

            return null;

        };

        method._getNextEntry = function _getNextEntry() {

            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                this._index--;
                return ret;
            }

            return this._getNextEntryFromEntry( this._currentEntry );
        };

        method._getPrevEntry = function _getPrevEntry() {
            var buckets = this._map._buckets,
                entry = this._currentEntry,
                backingEntry;

            if( entry === null &&
                ( ( backingEntry = this._backingEntry ) !== null ) ) {
                this._backingEntry = null;
                entry = backingEntry;
            }

            if( entry !== null ) {
                var first = buckets[this._bucketIndex];
                if( first !== entry ) {
                    var next = entry;
                    entry = first;
                    while( entry.next !== next ) {
                        entry = entry.next;
                    }
                    return entry;
                }
            }

            for( var i = this._bucketIndex - 1; i >= 0; --i ) {
                entry = buckets[i];

                if( entry !== null ) {
                    this._bucketIndex = i;
                    while( entry.next !== null ) {
                        entry = entry.next;
                    }
                    return entry;
                }
            }

            return entry;
        };

        //API

        method.next = function next() {
            this._checkModCount();
            this._index++;

            if( this._backingEntry === null &&
                this._index >= this._map._size ) {
                this.moveToEnd();
                return false;
            }

            var entry = this._currentEntry = this._getNextEntry();

            this.key = entry.key;
            this.value = entry.value;
            this.index = this._index;

            return true;
        };

        method.prev = function prev() {
            this._checkModCount();
            this._index--;

            if( this._index < 0 ||
                this._map._size === 0 ) {
                this.moveToStart();
                return false;
            }
            var entry = this._currentEntry = this._getPrevEntry();

            this.key = entry.key;
            this.value = entry.value;
            this.index = this._index;


            return true;
        };

        method.moveToStart = function moveToStart() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._bucketIndex = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.moveToEnd = function moveToEnd() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._bucketIndex = this._map._capacity;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.set = method.put = function put( value ) {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            var ret = this.value;
            this._currentEntry.value = this.value = value;
            return ret;
        };

        method["delete"] = method.remove = function remove() {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            this._backingEntry = this._getNextEntryFromEntry( this._currentEntry );
            this._currentEntry = null;
            var ret = this._map.remove( this.key );
            this._modCount = this._map._modCount;

            this.key = this.value = void 0;
            this.index = -1;

            if( this._backingEntry === null ) {
                this.moveToEnd();
            }

            return ret;
        };

        return Iterator;
    })();

    method._Iterator = Iterator;

    var Entry = (function() {
        var method = Entry.prototype;
        function Entry( key, value, next, hash ) {
            this.key = key;
            this.value = value;
            this.next = next;
            this.hash = hash;
        }

        method.inserted = function inserted() {

        };

        method.removed = function removed() {
            this.key = this.value = this.next = null;
        };

        method.accessed = function accessed() {

        };

        return Entry;
    })();

    method._entryType = Entry;

    Map.hashString = hashString;
    Map.hashNumber = hashNumber;
    Map.hashBoolean = hashBoolean;
    Map.hash = hash;

    Map._hashHash = hashHash;

    return Map;
})();;
var OrderedMap = (function() {
    var _super = Map.prototype,
        hashHash = Map._hashHash,
        method = OrderedMap.prototype = Object.create( _super );

    method.constructor = OrderedMap;

    var INSERTION_ORDER = OrderedMap._INSERTION_ORDER = {};
    var ACCESS_ORDER = OrderedMap._ACCESS_ORDER = {};

    function OrderedMap( capacity, equality ) {
        _super.constructor.call( this, capacity, equality );
        this._ordering = INSERTION_ORDER;
        this._firstEntry = this._lastEntry = null;
        _super._init.call( this, capacity, equality );
    }

    OrderedMap.inAccessOrder = function inAccessOrder( capacity, equality ) {
        var ret = new OrderedMap( capacity, equality );
        ret._ordering = ACCESS_ORDER;
        return ret;
    };

    //Override init because it is only valid to call it after
    //_firstEntry and _lastEntry properties are created
    method._init = function _init() {};

    method._resized = function _resized() {
        var newBuckets = this._buckets,
            newLen = newBuckets.length,
            entry = this._firstEntry;

        while( entry !== null ) {
            var bucketIndex = hashHash( entry.hash, newLen );

            entry.next = newBuckets[bucketIndex];
            newBuckets[bucketIndex] = entry;

            entry = entry.nextEntry;
        }
    };

    method.indexOfKey = function indexOfKey( key ) {
        if( this._firstEntry === null ) {
            return -1;
        }
        var eq = this._equality,
            entry = this._firstEntry,
            i = 0;

        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                return i;
            }
            i++;
            entry = entry.nextEntry;
        }
        return -1;
    };

    method.indexOfValue = function indexOfValue( value ) {
        if( this._firstEntry === null ) {
            return -1;
        }
        var entry = this._firstEntry,
            i = 0;

        while( entry !== null ) {
            if( entry.value === value ) {
                return i;
            }
            i++;
            entry = entry.nextEntry;
        }
        return -1;
    };

    method.firstKey = function firstKey() {
        if( this._firstEntry === null ) {
            return void 0;
        }
        return this._firstEntry.key;
    };

    method.first = function first() {
        return this.get( this.firstKey() );
    };

    method.lastKey = function lastKey( ) {
        if( this._firstEntry === null ) {
            return void 0;
        }

        return this._lastEntry.key;
    };

    method.last = function last() {
        return this.get( this.lastKey() );
    };


    method.nthKey = function nthKey( index ) {
        if( index < 0 || index >= this._size ) {
            return void 0;
        }
        var entry = this._firstEntry;
        var i = 0;
        while( i < index ) {
            entry = entry.nextEntry;
            i++;
        }
        return entry.key;
    };

    method.nth = function nth( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.containsValue = method.hasValue = function hasValue( value ) {
        return this.indexOfValue( value ) > -1;
    };

    method.clear = function clear() {
        _super.clear.call( this );
        this._firstEntry = this._lastEntry = null;
    };

    method.iterator = function iterator() {
        return new Iterator( this );
    };

    var Iterator = (function( _super ) {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this.key = this.value = void 0;
            this.index = -1;
            this._modCount = map._modCount;

            this._index = -1;
            this._map = map;
            this._backingEntry = null;
            this._currentEntry = null;
        }

        method._checkModCount = function _checkModCount() {
            if( this._modCount !== this._map._modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method._getNextEntry = function _getNextEntry() {
            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                this._index--;
                return ret;
            }
            if( this._currentEntry === null ) {
                return this._map._firstEntry;
            }
            else {
                return this._currentEntry.nextEntry;
            }
        };

        method._getPrevEntry = function _getPrevEntry() {
            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                return ret.prevEntry;
            }
            if( this._currentEntry === null ) {
                return this._map._lastEntry;
            }
            else {
                return this._currentEntry.prevEntry;
            }
        };

        method.next = _super.next;
        method.prev = _super.prev;

        method.moveToStart = function moveToStart() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.moveToEnd = function moveToEnd() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.set = method.put = _super.set;

        method["delete"] = method.remove = function remove() {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            var entry = this._currentEntry,
                backingEntry,
                ret = entry.value;

            backingEntry = this._backingEntry = entry.nextEntry;

            this._map.remove( this.key );
            this._modCount = this._map._modCount;
            this.key = this.value = void 0;
            this.index = -1;

            if( backingEntry === null ) {
                this.moveToEnd();
            }

            return ret;
        };


        return Iterator;
    })( _super._Iterator.prototype );

    method._Iterator = Iterator;

    var Entry = (function() {
        var method = Entry.prototype;

        function Entry( key, value, next, hash ) {
            this.key = key;
            this.value = value;
            this.next = next;
            this.hash = hash;

            this.prevEntry = this.nextEntry = null;
        }

        method.inserted = function inserted( map ) {
            if( map._firstEntry === null ) {
                map._firstEntry = map._lastEntry = this;
            }
            else if( map._firstEntry === map._lastEntry ) {
                map._lastEntry = this;
                map._firstEntry.nextEntry = this;
                this.prevEntry = map._firstEntry;
            }
            else {
                var last = map._lastEntry;
                map._lastEntry = this;
                last.nextEntry = this;
                this.prevEntry = last;
            }
        };

        method.removed = function removed( map ) {
            var prev = this.prevEntry,
                next = this.nextEntry,
                prevIsNull = prev === null,
                nextIsNull = next === null;

            this.prevEntry = this.nextEntry = this.key = this.value = this.next = null;

            if( prevIsNull && nextIsNull ) {
                map._firstEntry = map._lastEntry = null;
            }
            else if( nextIsNull ) {
                map._lastEntry = prev;
                map._lastEntry.nextEntry = null;
            }
            else if( prevIsNull ) {
                map._firstEntry = next;
                map._firstEntry.prevEntry = null;
            }
            else {
                next.prevEntry = prev;
                prev.nextEntry = next;
            }
        };

        method.accessed = function accessed( map ) {
            if( map._ordering === ACCESS_ORDER &&
                map._firstEntry !== null &&
                map._firstEntry !== map._lastEntry &&
                map._lastEntry !== this ) {
                var prev = this.prevEntry,
                    next = this.nextEntry;

                if( prev !== null ) {
                    prev.nextEntry = next;
                }
                else {
                    map._firstEntry = next;
                }
                next.prevEntry = prev;

                var last = map._lastEntry;

                this.nextEntry = null;
                this.prevEntry = last;
                last.nextEntry = this;
                map._lastEntry = this;
            }
        };

        return Entry;
    })();

    method._entryType = Entry;

    return OrderedMap;
})();;
/* global toListOfTuples, MapForEach, RedBlackTree, defaultComparer,
    MapValueOf, MapEntries, MapKeys, MapValues, MapToString, MapToJSON */
var SortedMap = (function() {
    var method = SortedMap.prototype;

    function SortedMap( keyValues, comparator ) {
        this._tree = null;
        this._init( keyValues, comparator );
    }

    method._init = function _init( keyValues, comparator ) {
        if( typeof keyValues === "function" ) {
            var tmp = comparator;
            comparator = keyValues;
            keyValues = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );

        if( typeof keyValues === "object" ) {
            this._setAll( toListOfTuples( keyValues ) );
        }
    };

    method._setAll = function _setAll( items ) {
        for( var i = 0, l = items.length; i < l; ++i ) {
            this.set( items[i][0], items[i][1] );
        }
    };
    //API
    method.forEach = MapForEach;

    method.getComparator = function getComparator() {
        return this._tree.getComparator();
    };

    method.clone = function clone() {
        return new SortedMap( this.entries(), this.comparator );
    };

    method.clear = function clear() {
        this._tree.clear();
        return this;
    };

    method.put = method.set = function set( key, value ) {
        return this._tree.set( key, value );
    };

    method.putAll = method.setAll = function setAll( arr ) {
        var items = toListOfTuples( arr );
        this._setAll( items );
        return this;
    };

    method["delete"] = method.remove = method.unset = function unset( key ) {
        var ret = this._tree.unset( key );
        return ret ? ret.getValue() : ret;
    };

    method.get = function get( key ) {
        var node = this._tree.nodeByKey(key);
        if( !node ) {
            return void 0;
        }
        return node.getValue();
    };

    method.containsKey = method.hasKey = function hasKey( key ) {
        return !!this._tree.nodeByKey( key );
    };

    method.containsValue = method.hasValue = function hasValue( value ) {
        var it = this.iterator();

        while( it.next() ) {
            if( it.value === value ) {
                return true;
            }
        }
        return false;
    };

    method.first = function first() {
        return this.get( this.firstKey() );
    };

    method.last = function last() {
        return this.get( this.lastKey() );
    };

    method.nth = function nth( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.nthKey = function nthKey( index ) {
        var node = this._tree.nodeByIndex(index);
        if( !node ) {
            return void 0;
        }
        return node.key;
    };

    method.firstKey = function firstKey() {
        var first = this._tree.firstNode();

        if( !first ) {
            return void 0;
        }
        return first.key;
    };

    method.lastKey = function lastKey() {
        var last = this._tree.lastNode();

        if( !last) {
            return void 0;
        }
        return last.key;
    };

    method.size = method.length = function length() {
        return this._tree.size();
    };

    method.isEmpty = function isEmpty() {
        return this._tree.size() === 0;
    };

    method.keys = MapKeys;

    method.values = MapValues;

    method.entries = MapEntries;

    method.iterator = function iterator() {
        return this._tree.iterator();
    };

    method.toJSON = MapToJSON;

    method.toString = MapToString;

    method.valueOf = MapValueOf;

    return SortedMap;
})();;
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
;
/* global OrderedMap */
var OrderedSet = (function() {
    var _super = Set.prototype,
        method = OrderedSet.prototype = Object.create( _super );

    method.constructor = OrderedSet;

    function OrderedSet( capacity, equality ) {
        _super.constructor.call( this, capacity, equality );
    }

    method._mapType = OrderedMap;

    method.indexOf = function indexOf( value ) {
        return this._map.indexOfKey( value );
    };

    method.first = function first() {
        return this._map.firstKey();
    };

    method.last = function last() {
        return this._map.lastKey();
    };

    method.get = method.nth = function nth( index ) {
        return this._map.nthKey( index );
    };

    return OrderedSet;
})();
;
/* global defaultComparer, SortedMap, SetForEach, setIteratorMethods,
    copyProperties, toList, RedBlackTree,
    SetValueOf, SetToString, SetToJSON */
var SortedSet = (function() {

    var method = SortedSet.prototype;

    function SortedSet( values, comparator ) {
        this._tree = null;
        this._init( values, comparator );
    }

    method._init = function _init( values, comparator ) {
        if( typeof values === "function" ) {
            var tmp = comparator;
            comparator = values;
            values = tmp;
        }

        if( typeof comparator !== "function" ) {
            comparator = defaultComparer;
        }

        this._tree = new RedBlackTree( comparator );

        if( typeof values === "object" && values != null ) {
            this._addAll( toList(values) );
        }
    };

    //API
    method.forEach = SetForEach;

    method.getComparator = SortedMap.prototype.getComparator;

    method.clear = SortedMap.prototype.clear;


    method.values = method.toArray = function toArray() {
        var values = [],
            it = this.iterator();

        while( it.next() ) {
            values.push( it.value );
        }
        return values;
    };

    method.contains = SortedMap.prototype.containsKey;
    method.get = method.nth = SortedMap.prototype.nthKey;
    method.first = SortedMap.prototype.firstKey;
    method.last = SortedMap.prototype.lastKey;
    method.size = method.length = SortedMap.prototype.size;
    method.isEmpty = SortedMap.prototype.isEmpty;

    method.add = function add( value ) {
        this._tree.set( value, true );
        return this;
    };

    method._addAll = function _addAll( values ) {
        for( var i = 0, l = values.length; i < l; ++i ) {
            this.add( values[i] );
        }
    };

    method.addAll = function addAll( arr ) {
        var values = toList(arr);
        this._addAll( values );
        return this;
    };

    method.clone = function clone() {
        return new SortedSet( this.values() );
    };

    method.remove = function remove( value ) {
        var ret = this._tree.unset( value );
        return ret ? ret.key : ret;
    };

    method.subsetOf = function subsetOf( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
                return false;
            }
        }
        return this.size() !== set.size();
    };

    method.supersetOf = function supersetOf( set ) {
        return set.subsetOf(this);
    };

    method.allContainedIn = function allContainedIn( set ) {
        var it = this.iterator();

        while( it.next() ) {
            if( !set.contains( it.key ) ) {
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

    method.union = function union(a) {
        var ret = new SortedSet( this.getComparator() ),

            aHas, bHas,

            itA = this.iterator(),
            itB = a.iterator();

        while( true ) {
            if( aHas = itA.next() ) {
                ret.add( itA.key );
            }
            if( bHas = itB.next() ) {
                ret.add( itB.key );
            }

            if( !aHas && !bHas ) {
                break;
            }
        }

        return ret;
    };


    method.intersection = function intersection(a) {
        var ret = new SortedSet( this.getComparator() ),
            src = this.size() < a.size() ? this : a,
            dst = src === a ? this : a,
            it = src.iterator();

        while( it.next() ) {
            if( dst.contains( it.key ) ) {
                ret.add( it.key );
            }
        }

        return ret;
    };

    method.complement = function complement( a ) {
        var ret = new SortedSet( this.getComparator() ),
            it = this.iterator();

        while( it.next() ) {
            if( !a.contains( it.key ) ) {
                ret.add( it.key );
            }
        }

        return ret;
    };


    method.difference = function difference( a ) {
        var ret = this.union( a ),
            tmp = this.intersection( a ),
            it = tmp.iterator();

        while( it.next() ) {
            ret.remove( it.key );
        }

        return ret;
    };

    method.iterator = function iterator() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( set ) {
            this._iterator = set._tree.iterator();
            this.value = void 0;
            this.index = -1;
            this.moveToStart();
        }

        copyProperties( setIteratorMethods, method );


        return Iterator;
    })();

    method._Iterator = Iterator;

    return SortedSet;
})();;
/* global toList, arraySearch, arrayCopy, global, SetForEach, SetValueOf */
var Queue = (function() {
    var method = Queue.prototype;

    var DEFAULT_CAPACITY = 16;
    var MAX_CAPACITY = 536870912;

    function nextPowerOfTwo( num ) {
        num = ((num >>> 0) - 1);
        num |= (num >>> 1);
        num |= (num >>> 2);
        num |= (num >>> 4);
        num |= (num >>> 8);
        num |= (num >>> 16);
        return (num + 1)>>>0;
    }

    /*  This is efficient array implementation that provides
        O(1) for random access, removing at front, removing at back (deque only),
        adding at front, adding at back( deque only)

        It resizes itself automatically and uses power of two physical sizes to take
        advantage of bitwise wizardry in wrapping to avoid modulo operations and if blocks.

        It should perform much better than the native Javascript array when using the unshift/shift
        methods which need to do full move of all indices every time.
        Random access etc is slower, but much faster than would be in a linked list O(N).

        I didn't use this implementation because of random access though but to avoid creating a ton of
        objects and have better spatial locality of reference. I implemented the random access methods just because it was possible
        to do so efficiently. Could be useful if you need queue/deque but also random access...
    */

    var Array = [].constructor;

    /**/
    function Queue( capacity, maxSize, _arrayImpl ) {
        var items = null;

        this._maxSize = (maxSize = maxSize >>> 0) > 0 ?
            Math.min( maxSize, MAX_CAPACITY ) :
            MAX_CAPACITY;

        switch( typeof capacity ) {
        case "number":
            capacity = nextPowerOfTwo( capacity );
            break;
        case "object":
            if( capacity ) {
                items = toList( capacity );
                capacity = nextPowerOfTwo( items.length );
            }
            break;
        default:
            capacity = DEFAULT_CAPACITY;
        }

        this._capacity = Math.max(Math.min( MAX_CAPACITY, capacity ), DEFAULT_CAPACITY);

        this._size = 0;
        this._queue = null;
        this._front = 0;
        this._modCount = 0;

        if( _arrayImpl != null ) {
            this._arrayImpl = _arrayImpl;
            this._fillValue = 0;
        }
        else {
            this._arrayImpl = Array;
            this._fillValue = null;
        }

        if( items ) {
            this._makeCapacity();
            this._addAll( items );
        }
    }

    method._checkCapacity = function( size ) {
        if( this._capacity < size && size < this._maxSize ) {
            this._resizeTo( this._capacity * 2 );
        }
    };

    method._makeCapacity = function() {
        var capacity = this._capacity,
            items = this._queue = new this._arrayImpl( capacity ),
            fill = this._fillValue;


        for( var i = 0; i < capacity; ++i ) {
            items[i] = fill;
        }
        this._front = 0;
    };

    method._resizeTo = function( capacity ) {
        var oldQueue = this._queue,
            newQueue,
            oldFront = this._front,
            oldCapacity = this._capacity,
            size = this._size;

        this._capacity = capacity;

        this._makeCapacity();

        newQueue = this._queue;

        //Can perform direct linear copy
        if( oldFront + size <= oldCapacity ) {
            arrayCopy( oldQueue, oldFront, newQueue, 0, size );
        }
        else {//Cannot perform copy directly, perform as much as possible
                //at the end, and then copy the rest to the beginning of the buffer
            var lengthBeforeWrapping = size - ( ( oldFront + size ) & ( oldCapacity - 1 ) );
            arrayCopy( oldQueue, oldFront, newQueue, 0, lengthBeforeWrapping );
            arrayCopy( oldQueue, 0, newQueue, lengthBeforeWrapping, size - lengthBeforeWrapping );
        }

    };

    method._addAll = function( items ) {
        this._modCount++;
        var size = this._size;

        var len = items.length;
        if( len <= 0 ) {
            return;
        }
        this._checkCapacity( len + size );

        if( this._queue === null ) {
            this._makeCapacity();
        }

        var queue = this._queue,
            capacity = this._capacity,
            insertionPoint = ( this._front + size) & ( capacity - 1 );

         //Can perform direct linear copy
        if( insertionPoint + len < capacity ) {
            arrayCopy( items, 0, queue, insertionPoint, len );
        }
        else {
            //Cannot perform copy directly, perform as much as possible
            //at the end, and then copy the rest to the beginning of the buffer
            var lengthBeforeWrapping = capacity - insertionPoint;
            arrayCopy( items, 0, queue, insertionPoint, lengthBeforeWrapping );
            arrayCopy( items, lengthBeforeWrapping, queue, 0, len - lengthBeforeWrapping );
        }

        this._size = Math.min( size + len, this._maxSize );


    };

    //API

    method.forEach = SetForEach;

    method.get = function( index ) {
        var i = (index >>> 0);
        if( i < 0 || i >= this._size ) {
            return void 0;
        }
        i = ( this._front + i ) & ( this._capacity - 1 );
        return this._queue[i];
    };

    method.set = function( index, value ) {
        this._modCount++;
        var i = (index >>> 0);
        if( i < 0 || i >= this._size ) {
            return void 0;
        }
        i = ( this._front + i ) & ( this._capacity - 1 );
        var ret = this._queue[i];
        this._queue[i] = value;
        return ret;
    };

    method.addAll = function( items ) {
        this._modCount++;
        return this._addAll( toList( items ) );
    };

    method.add = method.enqueue = function( item ) {
        this._modCount++;
        var size = this._size;
        if( this._queue === null ) {
            this._makeCapacity();
        }
        this._checkCapacity( size + 1 );
        var i = ( this._front + size ) & ( this._capacity - 1 );
        this._queue[i] = item;
        this._size = Math.min( size + 1, this._maxSize );
    };

    method.remove = method.dequeue = function() {
        this._modCount++;
        if( this._size === 0 ){
            return void 0;
        }
        var front = this._front,
            ret = this._queue[front];

        this._queue[front] = this._fillValue;
        this._front = ( front + 1 ) & ( this._capacity - 1);
        this._size--;
        return ret;
    };

    method.peek = function() {
        if( this._size === 0 ){
            return void 0;
        }
        return this._queue[this._front];
    };

    method.clear = function() {
        this._modCount++;
        var queue = this._queue,
            fill = this._fillValue;
        for( var i = 0, len = queue.length; i < len; ++i ) {
            queue[i] = fill;
        }
        this._size = 0;
        this._front = 0;
    };

    method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.toArray = method.toJSON = method.values = function() {
        if( this._size === 0 ) {
            return [];
        }
        var size = this._size,
            queue = this._queue,
            front = this._front,
            capacity = this._capacity,
            ret = new Array( size );

        if( front + size <= capacity ) {
            arrayCopy( queue, front, ret, 0, size );
        }
        else {
            var lengthBeforeWrapping = size - ( ( front + size ) & ( capacity - 1 ) );
            arrayCopy( queue, front, ret, 0, lengthBeforeWrapping );
            arrayCopy( queue, 0, ret, lengthBeforeWrapping, size - lengthBeforeWrapping );
        }

        return ret;
    };

    method.contains = function( value ) {
        var size = this._size;

        if( size === 0 ) {
            return false;
        }

        var queue = this._queue,
            front = this._front,
            capacity = this._capacity;

        if( front + size <= capacity ) {
            return arraySearch( queue, front, size, value );
        }
        else {
            var lengthBeforeWrapping = size - ( ( front + size ) & ( capacity - 1 ) );
            return  arraySearch( queue, front, lengthBeforeWrapping, value ) ?
                    true :
                    arraySearch( queue, 0, size - lengthBeforeWrapping, value );
        }
    };

    method.valueOf = SetValueOf;

    method.toString = function() {
        return JSON.stringify( this.values() );
    };

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( queue ) {
            this._queue = queue;
            this._modCount = this._queue._modCount;
            this._items = this._queue._queue;
            this.moveToStart();
        }

        method._checkModCount = function() {
            if( this._modCount !== this._queue._modCount ) {
                throw new Error( "Cannot mutate queue while iterating" );
            }
        };
        method.next = function() {
            this._checkModCount();

            var i = ++this._index;

            if( i >= this._queue._size ) {
                this.moveToEnd();
                return false;
            }
            var item = this._items[( this._queue._front + i ) & ( this._queue._capacity - 1 )];

            this.value = item;
            this.index = i;

            return true;
        };

        method.prev = function() {
            this._checkModCount();

            var i = --this._index;

            if( i < 0 || this._queue._size === 0 ) {
                this.moveToStart();
                return false;
            }

            var item = this._items[( this._queue._front + i ) & ( this._queue._capacity - 1 )];

            this.value = item;
            this.index = i;

            return true;
        };

        method.moveToStart = function() {
            this._checkModCount();

            this.index = -1;
            this._index = -1;
            this.value = void 0;

            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();

            this.index = -1;
            this._index = this._queue._size;
            this.value = void 0;

            return this;
        };

        return Iterator;
    })();

    function makeCtor( name, arrayImpl ) {
        Queue[name] = function( capacity, maxSize ) {
            return new Queue( capacity, maxSize, arrayImpl );
        };
    }

    var arrays = ("Uint16Array Uint32Array Uint8Array "+
        "Uint8ClampedArray Int16Array Int32Array "+
        "Int8Array Float32Array Float64Array").split(" ");

    for( var i = 0, len = arrays.length; i < len; ++i ) {
        var name = arrays[i];

        if( global[name] != null ) {
            makeCtor( name.replace( "Array", ""), global[name] );
        }
    }

    return Queue;
})();;
/* global Queue, global */
var Deque = (function() {
    var _super = Queue.prototype,
        method = Deque.prototype = Object.create( _super );

    method.constructor = Deque;

    function Deque( capacity, maxSize, arrayImpl ) {
        _super.constructor.call( this, capacity, maxSize, arrayImpl );
    }

    method.unshift = method.insertFront = function( item ) {
        this._modCount++;
        if( this._queue === null ) {
            this._makeCapacity();
        }
        var size = this._size;

        this._checkCapacity( size + 1 );
        var capacity = this._capacity;
        //Need this._front - 1, but if it is 0, that simply returns 0.
        //It would need to be capacity - 1, I.E. wrap to end, when front is 0
        //Because capacity is a power of two, capacity-bit 2's complement
        //integers can be emulated like this which returns capacity - 1 if this._front === 0
        var i = (((( this._front - 1 ) & ( capacity - 1) ) ^ capacity ) - capacity );
        this._queue[i] = item;
        this._size = Math.min( size + 1, this._maxSize );
        this._front = i;
    };

    method.pop = method.removeBack = function() {
        this._modCount++;
        var size = this._size;
        if( size === 0 ){
            return void 0;
        }
        var i = ( this._front + size - 1 ) & ( this._capacity - 1 );

        var ret = this._queue[i];
        this._queue[i] = this._fillValue;

        this._size--;
        return ret;
    };

    method.peekBack = function() {
        var size = this._size;
        if( size === 0 ) {
            return void 0;
        }
        return this._queue[( this._front + size - 1 ) & ( this._capacity - 1 )];
    };

    method.shift = method.removeFront = method.remove;
    method.push = method.insertBack = method.add;
    method.peekFront = method.peek;

    //Meaningless semantics here
    method.peek = method.remove = method.add = method.enqueue = method.dequeue = null;
    //I would use delete but that probably makes the
    //object degenerate into hash table for 20x slower performance.

    function makeCtor( name, maxSize, arrayImpl ) {
        Deque[name] = function( capacity, maxSize ) {
            return new Deque( capacity, maxSize, arrayImpl );
        };
    }

    var arrays = ("Uint16Array Uint32Array Uint8Array "+
        "Uint8ClampedArray Int16Array Int32Array "+
        "Int8Array Float32Array Float64Array").split(" ");

    for( var i = 0, len = arrays.length; i < len; ++i ) {
        var name = arrays[i];

        if( global[name] != null ) {
            makeCtor( name.replace( "Array", ""), global[name] );
        }
    }

    return Deque;
})();;
/* global Set, OrderedSet, SortedSet, Map, OrderedMap, SortedMap,
    defaultComparer, invertedComparator, arePrimitive, composeComparators,
    comparePosition, global, exportCtor, Queue, Deque */

var DS = {

    Set: exportCtor( Set ),
    OrderedSet: exportCtor( OrderedSet ),
    SortedSet: exportCtor( SortedSet ),

    Map: exportCtor( Map ),
    OrderedMap: exportCtor( OrderedMap ),
    SortedMap: exportCtor( SortedMap ),

    Queue: exportCtor( Queue ),
    Deque: exportCtor( Deque ),

    compare: {
        NATURAL_ASC: defaultComparer,

        NATURAL_DESC: invertedComparator(defaultComparer),

        NUMERIC_ASC: function( a, b ) {
            return a-b;
        },

        NUMERIC_DESC: function( a, b ) {
            return b-a;
        },

        LOCALE: function( a, b ) {
            if( !arePrimitive( a, b ) ) {
                a = a.toString();
                b = b.toString();
            }
            return a.localeCompare(b);
        },

        DOM: function( a, b ) {
            if( a === b ) {
                return 0;
            }
            return (3 - (comparePosition(a, b) & 6));
        },

        invertedComparator: invertedComparator,

        composeComparators: composeComparators
    }
};




if( typeof module !== "undefined" && module.exports ) {
    module.exports = DS;
}
else if ( typeof define === "function" && define.amd && define.amd.DS ) {
    define( "DS", [], function () { return DS; } );
}
else if ( global ) {
    global.DS = DS;
};
})(this);



