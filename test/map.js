/* global DS, test, strictEqual, deepEqual */
test( "Test map capacity", function() {
    var maps = [new DS.Map(10), new DS.Map(100), new DS.Map(1000), new DS.Map(10000), new DS.Map(35000)];
    var expectedCapacity = [13, 193, 1543, 12289, 49157];

    for( var i = 0; i < maps.length; ++i ) {

        strictEqual( maps[i]._capacity, expectedCapacity[i], "expected capacity" );
        strictEqual( maps[i]._buckets, null, "buckets are lazily initialized" );
    }
});

test( "Test map get", function() {
    var o = {};
    var map = new DS.Map([
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

test( "Test map put", function() {
    var o = {};
    var map = new DS.Map();

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

test( "Test map remove", function() {
    var o = {};


    var a = [
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, 23]
    ];

    var map = new DS.Map(a);
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

test( "Test map clear", function() {
    var o = {};
    var map = new DS.Map([
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

test( "Test map clone", function() {
    var o = {};
    var map = new DS.Map([
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

    var map = new DS.Map(a);

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

});
