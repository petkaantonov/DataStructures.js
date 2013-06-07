var itemCount = 1000000;

var items = [];

var half = itemCount;

for( var i = 0; i < half; ++i ) {
    items.push( i + "" );
}

var ds = typeof require !== "undefined" && require('../dist/data_structures.js') || DS;
var Map = ds.Map;
var datenow = typeof performance!== "undefined" && function(){return performance.now()} || Date.now;



(function ENTRY_FUNCTION_MAP(){ //Naming to distinguish in v8 dumps
    var a = new Map(itemCount / 0.67);
    var o = {};
    var c;
    var half = itemCount;

    for( var i = 0; i < half; ++i ) {
        a.put( i, o );
    }

    for( var i = 0; i < 1e5; ++i ) {
        a.get(i);
    }

    var now = datenow();

    for( var i = 0; i < half; ++i ) {
        c = a.get(i);
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = half * 2, l = half * 2 + half; i < l; ++i ) {
        c = a.get(i);
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = half-1; i >= 0; --i ) {
        c = a.get(i);
    }

    if( c === 3 ) {
        Math.rand()
    }

    var duration = ( datenow() - now );
    var ops = (half + (half * 2));
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using when using DS.Map with integers");
    },50);
})();


(function ENTRY_FUNCTION_NATIVE(){ //Naming to distinguish in v8 dumps
    var a = {};
    var o = {};

    var c;

    var half = itemCount;

    for( var i = 0; i < half; ++i ) {
        a[i] = o;
    }

    for( var i = 0; i < 1e5; ++i ) {
        a[i];
    }

    var now = datenow();

    for( var i = 0; i < half; ++i ) {
        c = a[i];
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = half * 2, l = half * 2 + half; i < l; ++i ) {
        c = a[i];
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = half-1; i >= 0; --i ) {
        c = a[i];
    }

    if( c === 3 ) {
        Math.rand()
    }



    var duration = ( datenow() - now );
    var ops = (half + (half * 2));
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native with integers");
    },50);
})();



(function ENTRY_FUNCTION_MAP_STRING(){ //Naming to distinguish in v8 dumps

    var a = new Map(itemCount / 0.67);
    var o = {};
    var c;

    var half = itemCount;


    for( var i = 0, len = items.length; i < len; ++i ) {
        c = a.put( items[i], o );
    }

    for( var i = 0, len = items.length; i < 1e5; ++i ) {
        c = a.get( items[i] );
    }

    var now = datenow();

    for( var i = 0, len = items.length; i < len; ++i ) {
        c = a.get( items[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }

    c = a.get( "notfound" );

    for( var i = items.length - 1; i >= 0; --i ) {
        c = a.get( items[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }


    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using DS.Map with strings");
    },50);
})();

(function ENTRY_FUNCTION_NATIVE_STRING(){ //Naming to distinguish in v8 dumps
    var a = {};
    var o = {};
    var c;

    var half = itemCount;

    for( var i = 0, len = items.length; i < len; ++i ) {
        a[items[i]]= o;
    }

    for( var i = 0, len = items.length; i < 1e5; ++i ) {
        a[ items[i] ];
    }
var hpr = {}.hasOwnProperty;
    var now = datenow();

    for( var i = 0, len = items.length; i < len; ++i ) {
        var it = items[i];
        if( hpr.call(  a, it ) ) {
            c = a[ it ];
        }
    }
    if( c === 3 ) {
        Math.rand()
    }


    a[ "notfound" ];

    for( var i = items.length - 1; i >= 0; --i ) {
        var it = items[i];
        if( hpr.call(  a, it ) ) {
            c = a[ it ];
        }
    }

    if( c === 3 ) {
        Math.rand()
    }


    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native with strings");
    },50);
})();