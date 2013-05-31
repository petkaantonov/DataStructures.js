(function(){
    "use strict";

    var hashString = function( str ) {
        var hash = 5381,
            i = 0;

        for( var i = 0, l = str.length; i < l; ++i ) {
            hash = ( ( ( hash << 5 ) + hash ) ^ str.charCodeAt( i ) );
        }

        return (hash >>> 0);
    };

    //Like above but ensures no number ever goes above
    //2^30 - 1 I.E. Doesn't force Double mode in V8
    var hashStringSmi = (function() {
        var smiMask = 0x39FFFFFF;

        return function( str ) {
            var hash = 5381,
                i = 0;

            for( var i = 0, l = str.length; i < l; ++i ) {
                hash = ( ( ( ( hash & smiMask ) << 5 ) + ( hash & 0x1F ) ) ^ str.charCodeAt( i ) );
            }

            return hash;
        }
    })();

    var randomString = (function() {

        var buffer = new Uint16Array(16);

        return function() {
            crypto.getRandomValues( buffer );
            var ret = "";
            for( var i = 0, len = buffer.length; i < len; ++i ) {
                ret += String.fromCharCode( buffer[i] );
            }
            return ret;
        };

    })();


    var primes = (function() {
        //Hash table sizes that roughly double each time, are prime, and as far as as possible from the nearest powers of 2
        var primes = [
            13, 23, 53, 97, 193, 389, 769, 1543, 3079, 6151, 12289, 24593, 49157, 98317, 196613,
            393241, 786433, 1572869, 3145739, 6291469, 12582917, 25165843, 50331653, 100663319,
            201326611, 402653189, 805306457, 1610612741
        ];

        function getPrimeAtLeast( n ) {
            for( var i = 0; i < primes.length; ++i ) {
                if( primes[i] >= n ) {
                    return primes[i];
                }
            }

            return getHighestPrime();
        }

        function getSmallestPrime() {
            return primes[0];
        }

        function getHighestPrime() {
            return primes[primes.length-1];
        }


        return {
            smallest: getSmallestPrime,
            highest: getHighestPrime,
            atLeast: getPrimeAtLeast
        };
    })();

    var randomStrings = [];

    for( var i = 0; i < 1e4; i++ ) {
        randomStrings.push( randomString() );
    }

    function getNormalCollisions( tableSize ) {
        var o = {};
        var collisions = 0;
        var orig = tableSize >>> 0;
        tableSize = primes.atLeast( orig / 0.67 );
        for( var i = 0, len = orig; i < len; ++i ) {
            var hash = hashString( randomStrings[i] ) % tableSize;
            if( !o[hash] ) {
                o[hash] = true;
            }
            else {
                collisions++
            }
        }
        return collisions;
    }

    function getSmiCollisions( tableSize ) {
        var o = {};
        var collisions = 0;
        var orig = tableSize >>> 0;
        tableSize = primes.atLeast( orig / 0.67 );
        for( var i = 0, len = orig; i < len; ++i ) {
            var hash = hashStringSmi( randomStrings[i] ) % tableSize;
            if( !o[hash] ) {
                o[hash] = true;
            }
            else {
                collisions++
            }
        }
        return collisions;
    }

    var sizes = [ 5, 10, 20, 50, 150, 350, 750, 1500, 3000, 6000, 7500, 10000 ];

    sizes.forEach( function( size ) {

        var normalCol = getNormalCollisions( size ),
            smiCol = getSmiCollisions( size );

        console.log(
            "With ", size, "items in a table",
            "normal hashing collided", normalCol, "times",
            "while SMI hashing collided", smiCol, "times.",
            (smiCol < normalCol ? "SMI wins." :
            smiCol > normalCol ? "Normal wins." :
            "It's a tie.")
        );
    });

    function smiHashSpeed() {
        var now = Date.now();
        var l = 5;
        while( l-- ) {
            for( var i = 0, len = randomStrings.length; i < len; ++i ) {
                hashStringSmi( randomStrings[i] );
            }
        }
        return Date.now() - now;
    }

    function normalHashSpeed() {
        var now = Date.now();
        var l = 5;
        while( l-- ) {
            for( var i = 0, len = randomStrings.length; i < len; ++i ) {
                hashString( randomStrings[i] );
            }
        }
        return Date.now() - now;
    }

    var smiTimes = [],
        total,
        normalTimes = [];

    var l = total = 20;
    while(l--) {
        smiTimes.push( smiHashSpeed() );
        normalTimes.push( normalHashSpeed() );
    }

    function sum( a, b ) {
        return a + b;
    }

    var smiAvg = smiTimes.reduce( sum ) / total;
    var normalAvg = normalTimes.reduce( sum ) / total;


    console.log( "SMI average time for 50000 hashes:", smiAvg, "milliseconds" );
    console.log( "normal average time for 50000 hashes:", normalAvg, "milliseconds" );
})();