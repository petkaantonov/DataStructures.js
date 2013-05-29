/* global DS, test, strictEqual, ok, equal */
function assertSubtreeCount( node ) {
    return node.subtreeCount === ( node.left.subtreeCount + node.right.subtreeCount + 1 );
}

function assertRbl( root, comparator ) {
    var RED = false;
                        //Only leaf nodes can have undefined key
    if( root == null || root.key === void 0) {
        return 1;
    }

    var left = root.left,
        right = root.right;


    if( root.color === RED && (
        left.color === RED || right.color === RED
    )) {
        ok( false, "Red violation");
        return;
    }

    if( !assertSubtreeCount( root  ) ) {
        ok( false, "subtreeCount is wrong");
    }

    var leftHeight = assertRbl(left, comparator),
        rightHeight = assertRbl(right, comparator);


    if( left.key !== void 0 && comparator(left.key, root.key) >= 0 ) {
        ok( false, "Binary tree violation");
        return;
    }
    if ( right.key !== void 0 && comparator(right.key, root.key) <= 0 ) {
        ok( false, "Binary tree violation");
        return;
    }


    if( leftHeight !== 0 && rightHeight !== 0 && leftHeight !== rightHeight ) {
        ok( false, "Black violation");
        return;
    }

    if( leftHeight !== 0 && rightHeight !== 0 ) {
        return root.color === RED ? leftHeight : leftHeight + 1;
    }
    else {
        return 0;
    }

}

test( "Simple remove", function() {
    var s = new DS.SortedSet([ 0.0512588310521096, 0.04778186255134642] );
    s.remove(0.0512588310521096);
    ok( !s.contains(0.0512588310521096));
});

test( "Check red-black and BST properties and invariants when inserting", function() {
    var set = new DS.SortedSet();

    var l = 500,
        r;

    var comparator = set.getComparator();

    while(l--) {
        do {
            r = Math.floor(Math.random()*20000000);
        } while(set.contains(r));
        set.add(r);

        ok(set.contains(r), "Set must contain the inserted item");

        assertRbl(set._tree.root, comparator);
    }
});

test( "Check red-black and BST properties and invariants when deleting", function() {
    var set = new DS.SortedSet();

    var l = 500, r;

    var comparator = set.getComparator();

    while(l--) {
        do {
            r = Math.floor(Math.random()*20000000);
        } while(set.contains(r));
        set.add(r);
    }
    var valuesToRemove = set.toArray();
    var l = valuesToRemove.length;

    while( valuesToRemove.length ) {
        var index = Math.floor(Math.random()*valuesToRemove.length);
        var item = valuesToRemove.splice( index, 1 )[0];
        ok( set.contains(item), "Set must contain item" );
        set.remove(item);
        l--;
        ok( !set.contains(item), "value was not removed" );
        equal( set.size(), l, "set size was not adjusted" );
        assertRbl(set._tree.root, comparator);
    }
    ok( !set._tree.root, "root must be cleared in empty set");
    equal( set.size(), 0, "set length must be 0" );
    ok( set.isEmpty(), "set must be isEmpty()" );

});


test( "Test  atleast functions", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    strictEqual( a._tree.nodeByKeyAtLeast(6.5).key, 7, "must be 7" );
    strictEqual( a._tree.nodeByKeyAtLeast(50).key, 50, "must be 50" );
    strictEqual( a._tree.nodeByKeyAtLeast(51), void 0, "must be undefined" );
    strictEqual( a._tree.nodeByKeyAtLeast(-1).key, 0, "must be 0" );
    strictEqual( a._tree.nodeByKeyAtLeast(-0.001).key, 0, "must be 0" );
});

test( "Test  lesser functions", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    strictEqual( a._tree.nodeByLesserKey(6.5).key, 6, "must be 6" );
    strictEqual( a._tree.nodeByLesserKey(50).key, 49, "must be 49" );
    strictEqual( a._tree.nodeByLesserKey(51).key, 50, "must be 50" );
    strictEqual( a._tree.nodeByLesserKey(-1), void 0, "must be undefined" );
    strictEqual( a._tree.nodeByLesserKey(-0.001), void 0, "must be undefined" );
});

test( "Test  at most functions", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    strictEqual( a._tree.nodeByKeyAtMost(6.5).key, 6, "must be 6" );
    strictEqual( a._tree.nodeByKeyAtMost(50).key, 50, "must be 50" );
    strictEqual( a._tree.nodeByKeyAtMost(51).key, 50, "must be 50" );
    strictEqual( a._tree.nodeByKeyAtMost(-1), void 0, "must be undefined" );
    strictEqual( a._tree.nodeByKeyAtMost(-0.001), void 0, "must be undefined" );
});

test( "Test  greater functions", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    strictEqual( a._tree.nodeByGreaterKey(6.5).key, 7, "must be 7" );
    strictEqual( a._tree.nodeByGreaterKey(50), void 0, "must be undefined" );
    strictEqual( a._tree.nodeByGreaterKey(51), void 0, "must be undefined" );
    strictEqual( a._tree.nodeByGreaterKey(-1).key, 0, "must be 0" );
    strictEqual( a._tree.nodeByGreaterKey(-0.001).key, 0, "must be 0" );
    strictEqual( a._tree.nodeByGreaterKey(0).key, 1, "must be 1" );
});

test( "Test indexOfKey/node", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    var it = a._tree.iterator(),
        i = 0;

    while( it.next() ) {
        strictEqual( a._tree.indexOfKey( it.key ), i++, "indexOf returns correct index");
    }

    strictEqual( a._tree.indexOfKey( -3 ), -1, "indexOf returns -1 on non-existent key" );

});

test( "Test nodeByIndex", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    var b = [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ];

    var c;

    while(c=b.shift()) {
        strictEqual( a._tree.nodeByIndex( c ).key, c, "nodeByIndex returns correct node");
    }

    strictEqual( a._tree.nodeByIndex( -4 ).key, 47, "nodeByIndex returns correct node with negative index");
    strictEqual( a._tree.nodeByIndex( -1 ).key, 50, "nodeByIndex returns correct node with negative index");
    strictEqual( a._tree.nodeByIndex( -a.size() ).key, 0, "nodeByIndex returns correct node with negative index");
    strictEqual( a._tree.nodeByIndex( -70 ), a._tree.firstNode(), "nodeByIndex returns first node with incorrect negative index");

    strictEqual( a._tree.nodeByIndex( 70 ), a._tree.lastNode(), "nodeByIndex returns last node with incorrect positive index");
});

test( "Test firstNode", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]), b = new DS.SortedSet();

    strictEqual( a._tree.firstNode( ).key, 0, "first node returned correctly");

    strictEqual( b._tree.firstNode( ), void 0, "undefined with no first node");

});

test( "Test lastNode", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]), b = new DS.SortedSet();

    strictEqual( a._tree.lastNode( ).key, 50, "last node returned correctly");

    strictEqual( b._tree.lastNode( ), void 0, "undefined with no last node");

});

test( "Test nodeByKey", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    strictEqual( a._tree.nodeByKey( 5).key, 5, "correct node by key");

    strictEqual( a._tree.nodeByKey( -3), void 0, "undefined with no node");

});

test( "Test clear", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);
    a.clear();
    strictEqual( a.size(), 0, "correct size after .clear()");
    strictEqual( a.isEmpty(), true, "empty after .clear()");
    strictEqual( a._tree.root, null, "root null after .clear()");

});