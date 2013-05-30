/*global test, deepEqual, DS, ok, strictEqual */
test( "Test ordered map access order", function() {
    var accessOrder = new DS.OrderedMap.inAccessOrder([
        [1, -1], [2, -1], [3, -1], [4, -1]
    ]);

    accessOrder.get(3);
    accessOrder.get(2);
    accessOrder.put(5, -1);
    var it = accessOrder.iterator();

    var r = [1, 4, 3, 2, 5],
        t = [];

    while( it.next() ) {
        t.push( it.key);
    }

    deepEqual( r, t, "must be in correct order");

    accessOrder.set( 1, 2 );

    r.push( r.shift() );

    deepEqual( r, accessOrder.keys(), "must be in correct order");

    accessOrder.get( 1 );

    deepEqual( r, accessOrder.keys(), "must be in correct order");

    accessOrder.get(4);

    r.push( r.shift() );

    deepEqual( r, accessOrder.keys(), "must be in correct order");



});



test( "Test ordered map index of key", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);

    strictEqual( map.indexOfKey(3), 0, "first key" );
    strictEqual( map.indexOfKey(o), 2, "third item" );
    strictEqual( map.indexOfKey("pii"), -1, "-1 for value" );
    strictEqual( map.indexOfKey("Not at all"), -1, "-1 for not found at all");
    strictEqual( map.indexOfKey(null), 5, "last key" );

    map.remove(o);

    strictEqual( map.indexOfKey(o), -1, "no longer found" );

    strictEqual( map.indexOfKey(3), 0, "still first key" );
    strictEqual( map.indexOfKey("string"), 2, "now the second key" );
    strictEqual( map.indexOfKey("Not at all"), -1, "still not found at all");
    strictEqual( map.indexOfKey(null), 4, "last key has reduced index" );

    map.put( "last", "value" );

    strictEqual( map.indexOfKey("last"), 5, "last key has 5th index" );
});

test( "Test ordered map index of value", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);

    strictEqual( map.indexOfValue("obj"), 2, "map indexOf value" );
    strictEqual( map.indexOfValue(o), 5, "map indexOf the object as value too" );
    strictEqual( map.indexOfValue(true), -1, "map has the value as key but not value" );
    strictEqual( map.indexOfValue("Not at all"), -1, "map doesn't contain as value");
    strictEqual( map.indexOfValue(o), 5, "last value" );

    map.remove(o);

    strictEqual( map.indexOfValue(o), 4, "last value with reduced index" );

    strictEqual( map.indexOfValue(3), 2,  "now the second value" );
    strictEqual( map.indexOfValue("string"), -1, "still not found" );
    strictEqual( map.indexOfValue(false), 3, "reduced index");
    strictEqual( map.indexOfValue(o), 4, "last key has reduced index" );

    map.put( "last", "value" );

    strictEqual( map.indexOfValue("value"), 5, "last key has 5th index" );


});

test( "Test ordered map contains key", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);

    strictEqual( map.containsKey(3), true, "first key" );
    strictEqual( map.containsKey(o), true, "third item" );
    strictEqual( map.containsKey("pii"), false, "-1 for value" );
    strictEqual( map.containsKey("Not at all"), false, "-1 for not found at all");
    strictEqual( map.containsKey(null), true, "last key" );

    map.remove(o);

    strictEqual( map.containsKey(o), false, "no longer found" );

    strictEqual( map.containsKey(3), true, "still first key" );
    strictEqual( map.containsKey("string"), true, "now the second key" );
    strictEqual( map.containsKey("Not at all"), false, "still not found at all");
    strictEqual( map.containsKey(null), true, "last key has reduced index" );

    map.put( "last", "value" );

    strictEqual( map.containsKey("last"), true, "last key has 5th index" );

});

test( "Test ordered map contains value", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);

    strictEqual( map.containsValue("obj"), true, "map indexOf value" );
    strictEqual( map.containsValue(o), true, "map indexOf the object as value too" );
    strictEqual( map.containsValue(true), false, "map has the value as key but not value" );
    strictEqual( map.containsValue("Not at all"), false, "map doesn't contain as value");
    strictEqual( map.containsValue(o), true, "last value" );

    map.remove(o);

    strictEqual( map.containsValue(o), true, "last value with reduced index" );

    strictEqual( map.containsValue(3), true,  "now the second value" );
    strictEqual( map.containsValue("string"), false, "still not found" );
    strictEqual( map.containsValue(false), true, "reduced index");
    strictEqual( map.containsValue(o), true, "last key has reduced index" );

    map.put( "last", "value" );

    strictEqual( map.containsValue("value"), true, "last key has 5th index" );
});

test( "Test ordered map resize", function() {
    var l = 200;
    var map = DS.OrderedMap();
    var a = [];
    var c;
    while(l-- ) {
        a.push( ( c = Math.random() ) );
        map.put( c, true );
        ok( map._capacity > a.length, "greater capacity" );
    }

    strictEqual( map.size(), a.length, "same size" );
    ok( map._capacity > a.length, "greater capacity" );
});


test( "Test ordered map capacity", function() {
    var maps = [new DS.OrderedMap(10), new DS.OrderedMap(100), new DS.OrderedMap(1000), new DS.OrderedMap(10000), new DS.OrderedMap(35000)];
    var expectedCapacity = [13, 193, 1543, 12289, 49157];

    for( var i = 0; i < maps.length; ++i ) {

        strictEqual( maps[i]._capacity, expectedCapacity[i], "expected capacity" );
        strictEqual( maps[i]._buckets, null, "buckets are lazily initialized" );
    }
});

test( "Test ordered map get", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ]);

    strictEqual( map.get(3),4, "value matches key" );
    strictEqual( map.get(3.14),"pii", "value matches key" );
    strictEqual( map.get(o),"obj", "value matches key" );
    strictEqual( map.get("string"),3, "value matches key" );
    strictEqual( map.get(true),false, "value matches key" );
    strictEqual( map.get(null),23, "value matches key" );
    strictEqual( map.get("notfound"),void 0, "undefined on not found" );

});

test( "Test ordered map put", function() {
    var o = {};
    var map = new DS.OrderedMap();

    var a = [
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ];

    for( var i = 0; i < a.length; ++i ) {
        strictEqual(map.put( a[i][0], a[i][1] ), void 0, "undefined is returned when new value is inserted");
        strictEqual( map.size(), i + 1, "size is properly updated" );
    }

    strictEqual( map.get(3),4, "value matches key" );
    strictEqual( map.get(3.14),"pii", "value matches key" );
    strictEqual( map.get(o),"obj", "value matches key" );
    strictEqual( map.get("string"),3, "value matches key" );
    strictEqual( map.get(true),false, "value matches key" );
    strictEqual( map.get(null),23, "value matches key" );
    strictEqual( map.get("notfound"),void 0, "undefined on not found" );

    var size = map.size();


    strictEqual( map.put(3.14, "newpii"), "pii", "returns old value when replacing" );
    strictEqual( map.get(3.14), "newpii", "updated value in tact" );
    strictEqual( size, map.size(), "size doesn't change when updating" );
});

test( "Test ordered map remove", function() {
    var o = {};


    var a = [
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ];

    var map = new DS.OrderedMap(a);
    strictEqual( map.size(), a.length, "matches size");
    strictEqual( map.remove( "notfound"), void 0, "undefined returned when trying to remove unknown key" );
    strictEqual( map.size(), a.length, "size is still the same");


    var size = a.length;
    for( var i = 0; i < a.length; ++i ) {
        strictEqual( map.remove( a[i][0] ), a[i][1], "removed value is returned" );
        strictEqual( map.size(), --size, "size is properly updated" );
    }

    strictEqual( map.size(), 0, "map is empty" );
    strictEqual( map.isEmpty(), true, "map reports as empty" );

});

test( "Test ordered map clear", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ]);
    map.clear();
    strictEqual( map.size(), 0, "map is empty" );
    strictEqual( map.isEmpty(), true, "map reports as empty" );

});



test( "Test ordered map clone", function() {
    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ]);
    var map2 = map.clone();

    strictEqual( map2.get(3),4, "value matches key" );
    strictEqual( map2.get(3.14),"pii", "value matches key" );
    strictEqual( map2.get(o),"obj", "value matches key" );
    strictEqual( map2.get("string"),3, "value matches key" );
    strictEqual( map2.get(true),false, "value matches key" );
    strictEqual( map2.get(null),23, "value matches key" );
    strictEqual( map2.get("notfound"),void 0, "undefined on not found" );

    map2.put("val", 3);

    strictEqual( map.get("val"), void 0, "cloned map doesn't affect old one" );

});


test( "Test array returning methods", function() {
    var o = {};
    var a = [
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ];

    var map = new DS.OrderedMap(a);

    var keys = [],
        values = [],
        entries = a;

    for( var i = 0; i < a.length; ++i ) {
        keys.push( a[i][0] );
        values.push( a[i][1] );
    }

    deepEqual( keys.sort(), map.keys().sort(), "keys returned properly" );
    deepEqual( values.sort(), map.values().sort(), "values returned properly" );
    deepEqual( entries.sort(), map.entries().sort(), "entries returned properly" );
    deepEqual( [], new DS.OrderedMap().keys(), "empty array" );
    deepEqual( [], new DS.OrderedMap().values(), "empty array" );
    deepEqual( [], new DS.OrderedMap().entries(), "empty array" );
});

test( "Test ordered map foreach", function() {
    var o = {};
    var a = [
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ];

    var map = new DS.OrderedMap(a);

    a = map.entries(); // Have the array laid out in same order

    var i = 0;

    map.forEach( function( value, key, index ) {
        strictEqual( index, i++, "index passed correctly" );
        strictEqual( key, a[index][0], "correct key" );
        strictEqual( value, a[index][1], "correct value" );
    });

    map.forEach( function() {
        strictEqual( this, o, "correct context");
    }, o);

    i = 0;
    map.forEach( function() {
        i++;
        return false;
    });

    strictEqual( i, 1, "return false breaks forEach" );

});

test( "Test positional methods", function() {


    var o = {};
    var map = new DS.OrderedMap([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);


    strictEqual( map.firstKey(), 3, "first key is 3");
    strictEqual( map.first(), 4, "first value is 4");

    strictEqual( map.lastKey(), null, "last key is null");
    strictEqual( map.last(), o, "last value is o");

    var map2 = new DS.OrderedMap();

    strictEqual( map2.firstKey(), void 0, "first key is undefined");
    strictEqual( map2.first(), void 0, "first value is undefined");
    strictEqual( map2.lastKey(), void 0, "last key is undefined");
    strictEqual( map2.last(), void 0, "last value is undefined");

    var map3 = new DS.OrderedMap([[o,o]]);

    strictEqual( map3.firstKey(), map3.lastKey(), "first key is last key");
    strictEqual( map3.first(),  map3.last(), "first value is last value");


    strictEqual( map.nthKey( -3 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nthKey( -1 ), void 0, "incorrect index is undefined" );
    strictEqual( map2.nthKey( 0 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nthKey( 6 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nthKey( 60 ), void 0, "incorrect index is undefined" );

    strictEqual( map.nth( -3 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nth( -1 ), void 0, "incorrect index is undefined" );
    strictEqual( map2.nth( 0 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nth( 6 ), void 0, "incorrect index is undefined" );
    strictEqual( map.nth( 60 ), void 0, "incorrect index is undefined" );

    strictEqual( map.nthKey( 0 ), 3, "correct index is 3" );
    strictEqual( map.nthKey( 4 ), true, "correct index is true" );
    strictEqual( map.nthKey( 5 ), null, "correct index is null" );


    strictEqual( map.nth( 0 ), 4, "correct index is 4" );
    strictEqual( map.nth( 4 ), false, "correct index is false" );
    strictEqual( map.nth( 5 ), o, "correct index is o" );

});