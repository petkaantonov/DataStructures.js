/* global RED, NIL */
var RedBlackNode = (function() {
    var method = RedBlackNode.prototype;

    function RedBlackNode( key, value, parent ) {
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



