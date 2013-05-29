/* global DS, test, strictEqual, notStrictEqual, deepEqual, ok */
test( "Test set contains", function() {
    var o = {};
    var set = new DS.Set([
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ]);

    strictEqual( set.contains(3), true, "should be contained" );
    strictEqual( set.contains(3.14), true, "should be contained" );
    strictEqual( set.contains(o), true, "should be contained" );
    strictEqual( set.contains("string"), true, "should be contained" );
    strictEqual( set.contains(true), true, "should be contained" );
    strictEqual( set.contains(null), true, "should be contained" );
    strictEqual( set.contains("notfound"), false, "is not contained" );
});

test( "Test set add", function() {
    var o = {};
    var set = new DS.Set();

    strictEqual( set.size(), 0, "should be empty");
    strictEqual( set.isEmpty(), true, "should be empty");

    var a = [
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ];
    var s = 0;
    for( var i = 0; i < a.length; ++i ) {
        if( set.contains( a[i] ) ) {
            var size = set.size();
            set.add( a[i] );
            strictEqual( set.size(), size, "element should not be added to the set" );
        }
        else {
            set.add( a[i] );
            strictEqual( set.size(), ++s, "size should be updated since element was added");
            strictEqual( set.contains( a[i] ), true, "should be contained after addition" );
        }
    }
});

test( "Test set remove", function() {
    var o = {};

    var set = new DS.Set([
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ]);

    var size = set.size();

    strictEqual( size, 11, "set size is 11 now" );

    strictEqual( set.remove(3), true, "true should be returned when element was removed " );
    strictEqual( set.size(), 10, "size should be adjusted");

    strictEqual( set.remove(42), false, "false should be returned when element was removed" );
    strictEqual( set.size(), 10, "size still the same" );

    set = new DS.Set();

    strictEqual( set.contains(""), false, "set doesn't contain anything" );
});

test( "Test set clone", function() {
    var o = {};

    var set = new DS.Set([
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ]);

    var set2 = set.clone();

    strictEqual( set2.contains(3), true, "value matches key" );
    strictEqual( set2.contains(3.14), true, "value matches key" );
    strictEqual( set2.contains(o), true, "value matches key" );
    strictEqual( set2.contains("string"), true, "value matches key" );
    strictEqual( set2.contains(true), true, "value matches key" );
    strictEqual( set2.contains(null), true, "value matches key" );
    strictEqual( set2.contains("notfound"), false, "undefined on not found" );

    strictEqual( set.size(), set2.size(), "sizes match");
    set2.add("val", 3);
    notStrictEqual( set.size(), set2.size(), "sizes don't match anymore");

    strictEqual( set.contains("val"), false, "cloned set doesn't affect old one" );
});

test( "Test set clear", function() {
    var o = {};

    var set = new DS.Set([
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ]);

    set.clear();
    strictEqual( set.size(), 0, "set is empty" );
    strictEqual( set.isEmpty(), true, "set reports as empty" );
    set.add(3);
    strictEqual( set.size(), 1, "set size 1" );
    strictEqual( set.isEmpty(), false, "set not reports empty" );
    strictEqual( set.contains(3), true, "value matches key" );

});

test( "Test values", function() {
    var o = {};
    var a = [
        3, 4,
        3.14, "pii",
        o, "obj",
        "string",
        true, false,
        null, 23
    ];

    var set = new DS.Set(a);

    var values = [];

    for( var i = 0; i < a.length; ++i ) {
        values.push( a[i] );
    }

    deepEqual( values.sort(), set.values().sort(), "values returned properly" );
    deepEqual( [], new DS.Set().values(), "empty array" );

});

test( "Test membership-testing methods", function() {

    var emptySet1 = new DS.Set(),
        emptySet2 = new DS.Set(),
        set1 = new DS.Set([
            1, 2, 3
        ]),
        set2 = new DS.Set([
            1, 2, 3
        ]),

        set3 = new DS.Set([
            4, 5, 6
        ]),

        set4 = new DS.Set([
            1, 2, 3, 4, 5
        ]);


    strictEqual( emptySet1.subsetOf( emptySet2 ), false, "empty set is not a proper subset of another empty set" );
    strictEqual( emptySet1.supersetOf( emptySet2 ), false, "empty set is not a proper superset of another empty set" );

    strictEqual( emptySet1.subsetOf( set3 ), true, "empty set is subset of a set that has items" );
    strictEqual( set3.supersetOf( emptySet2 ), true, "set with items is a superset of an empty set" );

    strictEqual( set3.subsetOf( emptySet2 ), false, "set with items is not a subset of empty set" );
    strictEqual( emptySet1.supersetOf( set3 ), false, "empty set is not a proper superset of set with items" );

    strictEqual( emptySet1.containsAll( emptySet2 ), true, "empty set contains empty set" );
    strictEqual( emptySet1.allContainedIn( emptySet2 ), true, "empty set is contained in empty set" );

    strictEqual( emptySet1.allContainedIn( set3 ), true, "empty set is contained in a set that has items" );
    strictEqual( set3.containsAll( emptySet2 ), true, "set with items contains an empty set" );

    strictEqual( set3.allContainedIn( emptySet2 ), false, "set with items is not contained in set with items" );
    strictEqual( emptySet1.containsAll( set3 ), false, "empty set doesn't contain set with items" );

    strictEqual( set1.subsetOf( set2 ), false, "not a proper subset" );
    strictEqual( set2.supersetOf( set2 ), false, "not a proper superset" );

    strictEqual( set1.containsAll( set2 ), true, "contains each other" );
    strictEqual( set2.allContainedIn( set2 ), true, "contains each other" );


    strictEqual( set1.subsetOf( set4 ), true, "a proper subset" );
    strictEqual( set4.supersetOf( set1 ), true, "a proper superset" );

    strictEqual( set1.allContainedIn( set4 ), true, "contained in" );
    strictEqual( set4.containsAll( set1 ), true, "Contains all");


    strictEqual( set3.subsetOf( set4 ), false, "contains each other" );
    strictEqual( set4.supersetOf( set3 ), false, "contains each other" );
    strictEqual( set3.allContainedIn( set4 ), false, "doesnt contain" );
    strictEqual( set4.containsAll( set3 ), false, "doesnt contain" );
});

test( "test set valueOf method", function() {
    var o = {};

    var set = new DS.Set([
        3, 4,
        3.14, "pii",
        o, "obj",
        "string", 3,
        true, false,
        null, 23
    ]);
    var val = set.valueOf();
    ok( typeof val === "number", "returns a number" );
    strictEqual( val | 0, val, "returns an integer" );
    ok( val > 0, "greater than 0");
    ok( val < (-1 >>> 0), "less than 0xffffffff");
});

test( "Test set toString method", function() {
    var o = {};
    var a = [
        3, 4,
        3.14, "pii",
        o, "obj",
        "string",
        true, false,
        null, 23
    ];

    var set = new DS.Set(a);

    strictEqual( set.toString(), set.values().toString(), "same as values to string" );

});

test( "Test set theoretical operations ", function() {

    var emptySet1 = new DS.Set(),
        emptySet2 = new DS.Set(),
        set1 = new DS.Set([
            1, 2, 3
        ]),
        set2 = new DS.Set([
            1, 2, 3
        ]),

        set3 = new DS.Set([
            4, 5, 6
        ]),

        set4 = new DS.Set([
            1, 2, 3, 4, 5
        ]);

    deepEqual( emptySet1.union( emptySet2 ).values(), [], "the union of empty sets is an empty set" );
    deepEqual( set1.union( set2 ).values(), set1.values(), "the union of equal sets is just the first set" );
    deepEqual( set1.union( emptySet1 ).values(), set1.values(), "the union of set and empty set is just the first set" );
    deepEqual( set3.union( set4 ).values(), new DS.Set([1,2,3,4,5,6]).values(), "just the 6 is added in an union" );

    deepEqual( emptySet1.intersection( emptySet2 ).values(), [], "the intersection of empty sets is an empty set" );
    deepEqual( set1.intersection( set2 ).values(), set1.values(), "the intersection of equal sets is just the first set" );
    deepEqual( set1.intersection( emptySet1 ).values(), [], "the intersection of set and empty set is an empty set" );
    deepEqual( set3.intersection( set4 ).values(), new DS.Set([4,5]).values(), "just the 4 and 5 is added in an intersection" );

    deepEqual( emptySet1.complement( emptySet2 ).values(), [], "the complement of empty sets is an empty set" );
    deepEqual( set1.complement( set2 ).values(), [], "the complement of equal sets is empty" );
    deepEqual( set1.complement( emptySet1 ).values(), set1.values(), "the complement of set and empty set is just the first set" );
    deepEqual( emptySet1.complement( set1 ).values(), [], "the complement of empty set and set with items is empty set" );
    deepEqual( set3.complement( set4 ).values(), new DS.Set([6]).values(), "just the 6 is added in an complement" );
    deepEqual( set4.complement( set3 ).values(), new DS.Set([1,2,3]).values(), "just the 1,2,3 is added in an complement" );

    deepEqual( emptySet1.difference( emptySet2 ).values(), [], "the difference of empty sets is an empty set" );
    deepEqual( set1.difference( set2 ).values(), [], "the difference of equal sets is empty set" );
    deepEqual( set1.difference( emptySet1 ).values(), set1.values(), "the difference of set and empty set is just the first set" );
    deepEqual( set3.difference( set4 ).values(), new DS.Set([1,2,3,6]).values(), "just the 1,2,3,6 is added in a difference" );
});

test( "Test foreach", function() {
    var o = {};
    var a = [
        3, 4,
        3.14, "pii",
        o, "obj",
        "string",
        true, false,
        null, 23
    ];


    var set = new DS.Set(a);

    a = set.values(); // Have the array laid out in same order

    var i = 0;

    set.forEach( function( value, index ) {
        strictEqual( index, i++, "index passed correctly" );
        strictEqual( value, a[index], "correct value" );
    });

    set.forEach( function() {
        strictEqual( this, o, "correct context");
    }, o);

    i = 0;
    set.forEach( function() {
        i++;
        return false;
    });

    strictEqual( i, 1, "return false breaks forEach" );

});
