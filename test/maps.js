function circular( map ) {

    map.put( "circular value", map );
    strictEqual( map.toString(), '[["circular value",null]]', "expecting null" );
    map.clear();
    map.put( map, "circular key" );
    strictEqual( map.toString(), '[[null,"circular key"]]', "expecting null" );
    map.clear();
    map.put( map, map );
    strictEqual( map.toString(), '[[null,null]]', "expecting null" );
    map.clear();
    map.put( [map], [map] );
    throws( function() {
        map.toString();
    }, Error, "expecting JSON error" );
}

test( "Test circular map to string", function() {


    circular(DS.Map());
    circular(DS.OrderedMap());
    circular(DS.SortedMap());
});