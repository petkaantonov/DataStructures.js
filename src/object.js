/* jshint -W079 */
/* exported Object */
var Object = (function( Object ) {

    return {
        /* For inheritance without invoking the parent constructor */
        create: Object.create || function( proto ) {
            function Type(){}
            Type.prototype = proto;
            return new Type();
        },

        defineProperties: Object.defineProperties,
        defineProperty: Object.defineProperty,
        freeze: Object.freeze,
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
        getOwnPropertyNames: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        is: Object.is,
        isExtensible: Object.isExtensible,
        isFrozen: Object.isFrozen,
        isSealed: Object.isSealed,
        keys: Object.keys,
        preventExtensions: Object.preventExtensions,
        seal: Object.seal,
        prototype: Object.prototype
    };


})( ({}.constructor) );
