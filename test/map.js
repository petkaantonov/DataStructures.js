/* global DS, test, strictEqual, deepEqual, ok */
test( "Test map capacity", function() {
    var maps = [new DS.Map(10), new DS.Map(100), new DS.Map(1000), new DS.Map(10000), new DS.Map(35000)];
    var expectedCapacity = [16, 128, 1024, 16384, 65536];

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

test( "Test map contains value", function() {
    var o = {};
    var map = new DS.Map([
        [3, 4],
        [3.14, "pii"],
        [o, "obj"],
        ["string", 3],
        [true, false],
        [null, o]
    ]);

    strictEqual( map.containsValue("obj"), true, "map contains value" );
    strictEqual( map.containsValue(o), true, "map contains the object as value too" );
    strictEqual( map.containsValue(true), false, "map has the value as key but not value" );
    strictEqual( map.containsValue("Not at all"), false, "map doesn't contain as value");


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
    deepEqual( [], new DS.Map().keys(), "empty array" );
    deepEqual( [], new DS.Map().values(), "empty array" );
    deepEqual( [], new DS.Map().entries(), "empty array" );
});

test( "Test map resize", function() {
    var l = 200;
    var map = DS.Map();
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

test( "Test map foreach", function() {
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


