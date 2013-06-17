/* global DS, test, strictEqual, deepEqual */
/* jshint -W024 */
test( "Test sorted set forward iterator", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    var b = a.clone(), c = a.values();


    var t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.next();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a._tree;

    var it = t.iterator();
    var i = 0;
    while( it.next() ) {
        strictEqual( it.key, c[i], "iterator key must match" );
        strictEqual( it.index, i++, "iterator index must match" );
    }

    strictEqual( it.key, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test sorted set backward iterator", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]), b = a.clone(), c = a.values();

    var t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a._tree;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.prev();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a._tree;

    var it = t.iterator().moveToEnd();
    var i = 0;
    var l = c.length;
    while( it.prev() ) {
        var ind = l-i-1;
        strictEqual( it.key, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        i++;
    }

    strictEqual( it.key, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test sorted set backward remove", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    var it = a.iterator().moveToEnd();
    var size = a.size();
    var l = size;
    var i = 0;
    var c = a.values();
    while(it.prev()){
        var ind = l-i-1;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        it.remove();
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }

    strictEqual( a.size(), 0, "should be empty after run");

});

test( "Test sorted set forward remove", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);


    var it = a.iterator().moveToStart();
    var size = a.size();
    var i = 0;
    var c = a.values();
    while(it.next()){
        var ind = i;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, 0, "iterator index must be 0" );
        it.remove();
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }

    strictEqual( a.size(), 0, "should be empty after run");

});

test( "Test sorted set traversals after removal", function() {
    var a = new DS.SortedSet( [15, 38, 4, 2, 40, 39, 33, 36, 20, 7, 22, 42,
        49, 9, 21, 34, 25, 18, 3, 19, 0, 5, 10, 23, 24, 48, 41, 12, 28, 47,
        30, 31, 32, 46, 6, 35, 44, 37, 17, 1, 13, 14, 45, 8, 11, 27, 26, 29,
        16, 43, 50
    ]);

    var it = a.iterator();
    var i = 0;
    for( i = 0; i < 10; ++i ) {
        it.next();
    }

    strictEqual( it.value, 9, "should be 9");
    strictEqual( it.index, 9, "index should be 9");

    it.remove();
    it.next();

    strictEqual( it.index, 9, "index should be 9" );
    strictEqual( it.value, 10, "next should be after removal 10" );

    it.next();
    it.next();
    it.next();

    strictEqual( it.index, 12, "index should be 12" );
    strictEqual( it.value, 13, "next should 13 now " );

    it.remove();
    it.prev();

    strictEqual( it.index, 11, "index should be 11" );
    strictEqual( it.value, 12, "Previous of deleted 13 is 12" );

    it.prev();
    it.prev();
    it.prev();

    strictEqual( it.index, 8, "index should be 8" );
    strictEqual( it.value, 8, "Should be 8 since 9 was deleted before" );
});



test( "Test ordered set forward iterator", function() {
    var a = new DS.OrderedSet( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
), b = a.clone(), c = a.values();

    var t = a;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.next();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a;

    var it = t.iterator();
    var i = 0;
    while( it.next() ) {
        strictEqual( it.value, c[i], "iterator key must match" );
        strictEqual( it.index, i++, "iterator index must match" );
    }

    strictEqual( it.value, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test ordered set backward iterator", function() {
    var a = new DS.OrderedSet( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
), b = a.clone(), c = a.values();

    var t = a;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.prev();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a;

    var it = t.iterator().moveToEnd();
    var i = 0;
    var l = c.length;
    while( it.prev() ) {
        var ind = l-i-1;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        i++;
    }

    strictEqual( it.value, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test ordered set backward remove", function() {
    var a = new DS.OrderedSet( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);

    var it = a.iterator().moveToEnd();
    var size = a.size();
    var l = size;
    var i = 0;
    var c = a.values();
    while(it.prev()){
        var ind = l-i-1;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        it.remove();
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }
    strictEqual( a.size(), 0, "should be empty after run");

});

test( "Test ordered set forward remove", function() {
    var a = new DS.OrderedSet( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);


    var it = a.iterator().moveToStart();
    var size = a.size();
    var i = 0;
    var c = a.values();
    while(it.next()){
        var ind = i;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, 0, "iterator index must be 0" );
        it.remove();
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }

    strictEqual( a.size(), 0, "should be empty after run");

});

test( "Test ordered set traversals after removal", function() {
    var a = new DS.OrderedSet( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);

    var it = a.iterator();
    for( var i = 0; i < 10; ++i ) {
        it.next();
    }

    strictEqual( it.value, 9, "should be 9");
    strictEqual( it.index, 9, "index should be 9" );


    it.remove();
    it.next();

    strictEqual( it.index, 9, "index should be 9" );
    strictEqual( it.value, 10, "next should be after removal 10" );


    it.next();
    it.next();
    it.next();

    strictEqual( it.index, 12, "index should be 12" );
    strictEqual( it.value, 13, "next should 13 now " );

    it.remove();
    it.prev();
    strictEqual( it.index, 11, "index should be 11" );

    strictEqual( it.value, 12, "Previous of deleted 13 is 12" );

    it.prev();
    it.prev();
    it.prev();

    strictEqual( it.index, 8, "index should be 8" );
    strictEqual( it.value, 8, "Should be 8 since 9 was deleted before" );
});

test( "Test set forward iterator", function() {
    var a = new DS.Set( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);
    var b = a.clone(), c = a.values();

    var t = a;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.next();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.next();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a;
    var c = t.values();
    var it = t.iterator();
    var i = 0;
    while( it.next() ) {
        strictEqual( it.value, c[i], "iterator key must match" );
        strictEqual( it.index, i++, "iterator index must match" );
    }

    strictEqual( it.value, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test set backward iterator", function() {
    var a = new DS.Set( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
), b = a.clone(), c = a.values();

    var t = a;

    throws( function() {
        var it = t.iterator();
        t.clear();
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.add(59);
        t.remove(59);
        it.prev();
    }, Error, "must throw when modified during iteration" );

    a = b.clone();
    t = a;

    throws( function() {
        var it = t.iterator();
        t.remove(40);
        it.prev();
    }, Error, "must throw when modified during iteration" );
    a = b.clone();
    t = a;

    var it = t.iterator().moveToEnd();
    var c = t.values();
    var i = 0;
    var l = c.length;

    while( it.prev() ) {
        var ind = l-i-1;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        i++;
    }

    strictEqual( it.value, void 0, "iterator key must be undefined at end" );
    strictEqual( it.value, void 0, "iterator value must be undefined at end" );
});

test( "Test set backward remove", function() {
    var a = new DS.Set( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);

    var it = a.iterator().moveToEnd();
    var size = a.size();
    var l = size;
    var i = 0;
    var c = a.values();
    while(it.prev()){
        var ind = l-i-1;
        strictEqual( it.value, c[ind], "iterator key must match" );
        strictEqual( it.index, ind, "iterator index must match" );
        it.remove();
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }
    strictEqual( a.size(), 0, "should be empty after run");

});

test( "Test set forward remove", function() {
    var a = new DS.Set( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
);


    var it = a.iterator().moveToStart();
    var size = a.size();
    var i = 0;
    var c = a.values();
    var d = [];
    while(it.next()){
        var ind = i;
        d.push( it.value );
        strictEqual( it.index, 0, "iterator index must be 0" );
        var value = it.value;
        strictEqual( a.contains( value ), true, "value is contained");
        it.remove();
        strictEqual( a.contains( value ), false, "value is not contained");
        strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
        strictEqual( it.index, -1, "iterator index -1 after .remove()" );
        strictEqual( a.size(), --size, "size must be adjusted after iterator removal" );
        i++;
    }

    strictEqual( a.size(), 0, "should be empty after run");
    deepEqual( d.sort(), c.sort(), "should be equal" );

});

test( "Test set traversals after removal", function() {
    var a = new DS.Set( [0, 14, 35, 20, 28, 40, 17, 45, 25, 34, 11, 50, 15, 1, 39, 22, 30, 2, 44, 3, 4, 33, 19, 6, 49, 27, 8, 38, 12, 16, 43, 24, 32, 48, 37, 21, 29, 9, 42, 13, 18, 47, 26, 36, 5, 41, 23, 7, 31, 10, 46]);

    var arr = a.values();

    var it = a.iterator();
    for( var i = 0; i < 10; ++i ) {
        it.next();
    }

    strictEqual( it.value, arr[9], "should be whatever is at 9");
    strictEqual( it.index, 9, "index should be 9");


    it.remove();
    it.next();

    strictEqual( it.index, 9, "index should be 9" );
    strictEqual( it.value, arr[10], "next should be after removal 10" );

    it.next();
    it.next();
    it.next();

    strictEqual( it.index, 12, "index should be 12" );
    strictEqual( it.value, arr[13], "next should 13 now " );

    it.remove();
    it.prev();

    strictEqual( it.index, 11, "index should be 11" );
    strictEqual( it.value, arr[12], "Previous of deleted 13 is 12" );

    it.prev();
    it.prev();
    it.prev();

    strictEqual( it.index, 8, "index should be 8" );
    strictEqual( it.value, arr[8], "Should be 8 since 9 was deleted before" );
});

/*The iterators for the tested sets are actually backed up
by the corresponding map iterators so the tests will only test map iterator API here */
test( "Test sorted map iteration", function() {
    var a = new DS.SortedMap([
        [5, "john"],
        [2, "doe"],
        [10, "mary"],
        [43, "casper"],
        [1, "elizabeth"]
    ]);

    var it = a.iterator();

    it.next();

    strictEqual( it.value, "elizabeth", "Should be the first value");
    strictEqual( it.key, 1, "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    it.next();

    strictEqual( it.value, "doe", "Should be the second value");
    strictEqual( it.key, 2, "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.next();

    strictEqual( it.value, "john", "Should be the third value");
    strictEqual( it.key, 5, "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.next();

    strictEqual( it.value, "mary", "Should be the fourth value");
    strictEqual( it.key, 10, "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.next();

    strictEqual( it.value, "casper", "Should be the fifth value");
    strictEqual( it.key, 43, "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    strictEqual( it.next(), false, "should be no more iterations");


    it.prev();

    strictEqual( it.value, "casper", "Should be the fifth value");
    strictEqual( it.key, 43, "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    it.prev();

    strictEqual( it.value, "mary", "Should be the fourth value");
    strictEqual( it.key, 10, "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.prev();

    strictEqual( it.value, "john", "Should be the third value");
    strictEqual( it.key, 5, "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.prev();

    strictEqual( it.value, "doe", "Should be the second value");
    strictEqual( it.key, 2, "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.prev();

    strictEqual( it.value, "elizabeth", "Should be the first value");
    strictEqual( it.key, 1, "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    strictEqual( it.prev(), false, "should be no more iterations" );

    it.next();
    it.remove();
    strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
    strictEqual( it.key, void 0, "iterator key undefined after .remove()" );
    strictEqual( it.index, -1, "iterator index -1 after .remove()" );
});

test( "Test ordered map iteration", function() {
    var a = new DS.OrderedMap([
        [1, "elizabeth"],
        [2, "doe"],
        [5, "john"],
        [10, "mary"],
        [43, "casper"]

    ]);

    var it = a.iterator();

    it.next();

    strictEqual( it.value, "elizabeth", "Should be the first value");
    strictEqual( it.key, 1, "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    it.next();

    strictEqual( it.value, "doe", "Should be the second value");
    strictEqual( it.key, 2, "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.next();

    strictEqual( it.value, "john", "Should be the third value");
    strictEqual( it.key, 5, "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.next();

    strictEqual( it.value, "mary", "Should be the fourth value");
    strictEqual( it.key, 10, "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.next();

    strictEqual( it.value, "casper", "Should be the fifth value");
    strictEqual( it.key, 43, "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    strictEqual( it.next(), false, "should be no more iterations");


    it.prev();

    strictEqual( it.value, "casper", "Should be the fifth value");
    strictEqual( it.key, 43, "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    it.prev();

    strictEqual( it.value, "mary", "Should be the fourth value");
    strictEqual( it.key, 10, "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.prev();

    strictEqual( it.value, "john", "Should be the third value");
    strictEqual( it.key, 5, "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.prev();

    strictEqual( it.value, "doe", "Should be the second value");
    strictEqual( it.key, 2, "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.prev();

    strictEqual( it.value, "elizabeth", "Should be the first value");
    strictEqual( it.key, 1, "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    strictEqual( it.prev(), false, "should be no more iterations" );

    it.next();
    it.remove();
    strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
    strictEqual( it.key, void 0, "iterator key undefined after .remove()" );
    strictEqual( it.index, -1, "iterator index -1 after .remove()" );
});

test( "Test map iteration", function() {
    var a = new DS.Map([
        [1, "elizabeth"],
        [2, "doe"],
        [5, "john"],
        [10, "mary"],
        [43, "casper"]
    ]);

    var entries = a.entries();

    var it = a.iterator();

    it.next();

    strictEqual( it.value, entries[0][1], "Should be the first value");
    strictEqual( it.key, entries[0][0], "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    it.next();

    strictEqual( it.value, entries[1][1], "Should be the second value");
    strictEqual( it.key, entries[1][0], "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.next();

    strictEqual( it.value, entries[2][1], "Should be the third value");
    strictEqual( it.key, entries[2][0], "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.next();

    strictEqual( it.value, entries[3][1], "Should be the fourth value");
    strictEqual( it.key, entries[3][0], "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.next();

    strictEqual( it.value, entries[4][1], "Should be the fifth value");
    strictEqual( it.key, entries[4][0], "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    strictEqual( it.next(), false, "should be no more iterations");


    it.prev();

    strictEqual( it.value, entries[4][1], "Should be the fifth value");
    strictEqual( it.key, entries[4][0], "should be the fifth key");
    strictEqual( it.index, 4, "should be the fifth index");

    it.prev();

    strictEqual( it.value, entries[3][1], "Should be the fourth value");
    strictEqual( it.key, entries[3][0], "should be the fourth key");
    strictEqual( it.index, 3, "should be the fourth index");

    it.prev();

    strictEqual( it.value, entries[2][1], "Should be the third value");
    strictEqual( it.key, entries[2][0], "should be the third key");
    strictEqual( it.index, 2, "should be the third index");

    it.prev();

    strictEqual( it.value, entries[1][1], "Should be the second value");
    strictEqual( it.key, entries[1][0], "should be the second key");
    strictEqual( it.index, 1, "should be the second index");

    it.prev();

    strictEqual( it.value, entries[0][1], "Should be the first value");
    strictEqual( it.key, entries[0][0], "should be the first key");
    strictEqual( it.index, 0, "should be the first index");

    strictEqual( it.prev(), false, "should be no more iterations" );

    it.next();
    it.remove();
    strictEqual( it.value, void 0, "itereator key undefined after .remove()" );
    strictEqual( it.key, void 0, "iterator key undefined after .remove()" );
    strictEqual( it.index, -1, "iterator index -1 after .remove()" );
});


test( "Test map iterator updates", function() {
    var a = [[1,2],[3,4],[5,6]];
    var smap = DS.SortedMap(a),
        omap = DS.OrderedMap(a),
        map = DS.Map(a);

    var it = smap.iterator();

    while( it.next() ) {
        it.set( 5 );
        strictEqual( it.value, 5, "iterator updated value");
    }

    it = omap.iterator();

    while( it.next() ) {
        it.set( 5 );
        strictEqual( it.value, 5, "iterator updated value");
    }

    it = map.iterator();

    while( it.next() ) {
        it.set( 5 );
        strictEqual( it.value, 5, "iterator updated value");

    }

    strictEqual( smap.get(1), 5, "updated value");
    strictEqual( smap.get(3), 5, "updated value");
    strictEqual( smap.get(5), 5, "updated value");

    strictEqual( omap.get(1), 5, "updated value");
    strictEqual( omap.get(3), 5, "updated value");
    strictEqual( omap.get(5), 5, "updated value");

    strictEqual( map.get(1), 5, "updated value");
    strictEqual( map.get(3), 5, "updated value");
    strictEqual( map.get(5), 5, "updated value");
});

