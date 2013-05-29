/* global Set, OrderedSet, SortedSet, Map, OrderedMap, SortedMap,
    defaultComparer, invertedComparator, arePrimitive, composeComparators,
    comparePosition, global*/
var DS = {

    Set: Set,
    OrderedSet: OrderedSet,
    SortedSet: SortedSet,

    Map: Map,
    OrderedMap: OrderedMap,
    SortedMap: SortedMap,

    compare: {
        NATURAL_ASC: defaultComparer,

        NATURAL_DESC: invertedComparator(defaultComparer),

        NUMERIC_ASC: function( a, b ) {
            return a-b;
        },

        NUMERIC_DESC: function( a, b ) {
            return b-a;
        },

        LOCALE: function( a, b ) {
            if( !arePrimitive( a, b ) ) {
                a = a.toString();
                b = b.toString();
            }
            return a.localeCompare(b);
        },

        DOM: function( a, b ) {
            if( a === b ) {
                return 0;
            }
            return (3 - (comparePosition(a, b) & 6));
        },

        invertedComparator: invertedComparator,

        composeComparators: composeComparators
    }
};


if( typeof module !== "undefined" && module.exports ) {
    module.exports = DS;
}
else if ( typeof define === "function" && define.amd && define.amd.DS ) {
    define( "DS", [], function () { return DS; } );
}
else if ( global ) {
    global.DS = DS;
}