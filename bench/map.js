var itemCount = 1000000;

var items = [];

var half = itemCount;

for( var i = 0; i < half; ++i ) {
    items.push( i + "" );
}

var ds = typeof require !== "undefined" && require('../dist/data_structures.js') || DS;
var Map = ds.Map;
var datenow = typeof performance!== "undefined" && function(){return performance.now()} || Date.now || function(){ return +new Date();};

var maps = [];

(function ENTRY_FUNCTION_MAP(){ //Naming to distinguish in v8 dumps
    var a = new Map(itemCount / 0.67);
    var o = {};

    var half = itemCount;

    for( var i = 0; i < half; ++i ) {
        a.put( i, o );
    }

    for( var i = 0; i < half; ++i ) {
        a.get(i);
    }

    var now = datenow();

    for( var i = 0; i < half; ++i ) {
        a.get(i);
    }

    for( var i = half * 2, l = half * 2 + half; i < l; ++i ) {
        a.get(i);
    }


    for( var i = half-1; i >= 0; --i ) {
        a.get(i);
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

    var half = itemCount;

    for( var i = 0; i < half; ++i ) {
        a[i] = o;
    }

    for( var i = 0; i < half; ++i ) {
        a[i];
    }

    var now = datenow();

    for( var i = 0; i < half; ++i ) {
        a[i];
    }

    for( var i = half * 2, l = half * 2 + half; i < l; ++i ) {
        a[i];
    }

    for( var i = half-1; i >= 0; --i ) {
        a[i];
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

    var half = itemCount;


    for( var i = 0, len = items.length; i < len; ++i ) {
        a.put( items[i], o );
    }

    for( var i = 0, len = items.length; i < len; ++i ) {
        a.get( items[i] );
    }

    var now = datenow();

    for( var i = 0, len = items.length; i < len; ++i ) {
        a.get( items[i] );
    }

    a.get( "notfound" );

    for( var i = items.length - 1; i >= 0; --i ) {
        a.get( items[i] );
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

    var half = itemCount;

    for( var i = 0, len = items.length; i < len; ++i ) {
        a[items[i]]= o;
    }

    for( var i = 0, len = items.length; i < len; ++i ) {
        a[ items[i] ];
    }
var hpr = {}.hasOwnProperty;
    var now = datenow();

    for( var i = 0, len = items.length; i < len; ++i ) {
        var it = items[i];
        if( hpr.call(  a, it ) ) {
            a[ it ];
        }
    }

    a[ "notfound" ];

    for( var i = items.length - 1; i >= 0; --i ) {
        var it = items[i];
        if( hpr.call(  a, it ) ) {
            a[ it ];
        }
    }


    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native with strings");
    },50);
})();
