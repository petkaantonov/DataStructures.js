function seqString( i ) {
    var src = i.toString(26),
        dst = "";

    for( var i = 0, len = src.length; i < len; ++i ) {
        var ch = src.charCodeAt(i);
        if( ch <= 57 ) {
            if(i > 0 || len === 1) {
                dst+= String.fromCharCode(ch+49)
            }
            else {
                dst+= String.fromCharCode(ch+48)
            }
        }
        else {
            dst+= String.fromCharCode(ch+10);
        }
    }

    return dst + dst + dst + dst + dst + dst;
}

var itemCount = 500000;

var stringItems = [];

var half = itemCount;

for( var i = 0; i < half; ++i ) {
    stringItems.push( seqString(i));
}

var intItems = [];

for( var i = 0; i < half; ++i ) {
    intItems.push( (i * 3194013094 +1354) & 0x3FFFFFFF );
}

var floatItems = [];

for( var i = 0; i < half; ++i ) {
    floatItems.push( 130.14341 * i * 134013 / 0.14 + 1304.434 );
}



var ds = typeof require !== "undefined" && require('../dist/data_structures.js') || DS;
var Map = ds.Map;
var datenow = typeof performance!== "undefined" && function(){return performance.now()} || Date.now;



(function ENTRY_FUNCTION_MAP(){ //Naming to distinguish in v8 dumps
    var a = new Map(itemCount / 0.67);
    var o = {};
    var c;
    var half = itemCount;

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        c = a.put( intItems[i], o );
    }

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        c = a.get( intItems[i] );
    }

    var now = datenow();

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        c = a.get( intItems[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = intItems.length - 1; i >= 0; --i ) {
        c = a.get( intItems[i] );
    }


    if( c === 3 ) {
        Math.rand()
    }

    var duration = ( datenow() - now );
    var ops = (half* 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using DS.Map filled with", itemCount, "integers");
    },50);
})();


(function ENTRY_FUNCTION_NATIVE(){ //Naming to distinguish in v8 dumps
    var a = {};
    var o = {};

    var c;

    var half = itemCount;

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        a[intItems[i]]= o;
    }

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        a[ intItems[i] ];
    }

    var now = datenow();

    for( var i = 0, len = intItems.length; i < len; ++i ) {
        c = a[ intItems[i] ];
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = intItems.length - 1; i >= 0; --i ) {
        c = a[ intItems[i] ];
    }


    if( c === 3 ) {
        Math.rand()
    }

    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native filled with", itemCount, "integers");
    },50);
})();



(function ENTRY_FUNCTION_MAP_STRING(){ //Naming to distinguish in v8 dumps

    var a = new Map(itemCount / 0.67);
    var o = {};
    var c;

    var half = itemCount;


    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        c = a.put( stringItems[i], o );
    }

    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        c = a.get( stringItems[i] );
    }

    var now = datenow();

    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        c = a.get( stringItems[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }

    c = a.get( "notfound" );

    for( var i = stringItems.length - 1; i >= 0; --i ) {
        c = a.get( stringItems[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }


    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using DS.Map filled with", itemCount, "strings");
    },50);
})();

(function ENTRY_FUNCTION_NATIVE_STRING(){ //Naming to distinguish in v8 dumps
    var a = {};
    var o = {};
    var c;

    var half = itemCount;

    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        a[stringItems[i]]= o;
    }

    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        a[ stringItems[i] ];
    }
var hpr = {}.hasOwnProperty;
    var now = datenow();

    for( var i = 0, len = stringItems.length; i < len; ++i ) {
        var it = stringItems[i];
        if( hpr.call(  a, it ) ) {
            c = a[ it ];
        }
    }
    if( c === 3 ) {
        Math.rand()
    }


    a[ "notfound" ];

    for( var i = stringItems.length - 1; i >= 0; --i ) {
        var it = stringItems[i];
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
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native filled with", itemCount, "strings");
    },50);
})();

(function ENTRY_FUNCTION_MAP_FLOAT(){ //Naming to distinguish in v8 dumps
    var a = new Map(itemCount / 0.67);
    var o = {};
    var c;
    var half = itemCount;

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        c = a.put( floatItems[i], o );
    }

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        c = a.get( floatItems[i] );
    }

    var now = datenow();

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        c = a.get( floatItems[i] );
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = floatItems.length - 1; i >= 0; --i ) {
        c = a.get( floatItems[i] );
    }


    if( c === 3 ) {
        Math.rand()
    }

    var duration = ( datenow() - now );
    var ops = (half* 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using when using DS.Map filled with", itemCount, "floats");
    },50);
})();


(function ENTRY_FUNCTION_NATIVE_FLOAT(){ //Naming to distinguish in v8 dumps
    var a = {};
    var o = {};

    var c;

    var half = itemCount;

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        a[floatItems[i]]= o;
    }

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        a[ floatItems[i] ];
    }

    var now = datenow();

    for( var i = 0, len = floatItems.length; i < len; ++i ) {
        c = a[ floatItems[i] ];
    }

    if( c === 3 ) {
        Math.rand()
    }

    for( var i = floatItems.length - 1; i >= 0; --i ) {
        c = a[ floatItems[i] ];
    }


    if( c === 3 ) {
        Math.rand()
    }

    var duration = ( datenow() - now );
    var ops = (half * 2);
    var opsps = Math.round( ops * ( 1000 / duration));

    setTimeout(function(){
        console.log( "Completed", ops , "operations in", duration, "milliseconds. ", opsps, "OP/s", "when using Native filled with", itemCount, "floats");
    },50);
})();
