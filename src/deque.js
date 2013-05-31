/* global Queue */
var Deque = (function() {
    var _super = Queue.prototype,
        method = Deque.prototype = Object.create( _super );

    method.constructor = Deque;

    function Deque() {
        _super.constructor.apply( this, arguments );
    }

    method.insertLast = function( item ) {
        return item;
    };

    method.insertFirst = function( item ) {
        return item;
    };

    method.contains = function( item ) {
        return item;
    };

    method.removeFirst = function() {
        if( this._size === 0 ) {
            return void 0;
        }
    };

    method.removeLast = function() {
        if( this._size === 0 ) {
            return void 0;
        }
    };

    method.getFirst = function() {
        if( this._size === 0 ) {
            return void 0;
        }
    };

    method.getLast = function() {
        if( this._size === 0 ) {
            return void 0;
        }
    };

    return Deque;
})();