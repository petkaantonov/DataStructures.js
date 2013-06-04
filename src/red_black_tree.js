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

