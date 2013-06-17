/* global Queue */
/* exported Deque */
var Deque = (function() {

/**
 * Description.
 *
 *
 */
function Deque( capacity, maxSize, arrayImpl ) {
    _super.constructor.call( this, capacity, maxSize, arrayImpl );
}

var _super = Queue.prototype,
    method = Deque.prototype = Object.create( _super );

method.constructor = Deque;


/**
 * Description.
 *
 *
 */
method.unshift = method.insertFront = function( item ) {
    this._modCount++;
    if( this._queue === null ) {
        this._makeCapacity();
    }
    var size = this._size;

    this._checkCapacity( size + 1 );
    var capacity = this._capacity;

    //Need this._front - 1, but if it is 0, that simply returns 0.
    //It would need to be capacity - 1, I.E. wrap to end, when front is 0
    //Because capacity is a power of two, capacity-bit 2's complement
    //integers can be emulated like this which returns capacity - 1
    //if this._front === 0

    var i = (((( this._front - 1 ) &
        ( capacity - 1) ) ^ capacity ) - capacity );
    this._queue[i] = item;
    this._size = Math.min( size + 1, this._maxSize );
    this._front = i;
};

/**
 * Description.
 *
 *
 */
method.pop = method.removeBack = function() {
    this._modCount++;
    var size = this._size;
    if( size === 0 ){
        return void 0;
    }
    var i = ( this._front + size - 1 ) & ( this._capacity - 1 );

    var ret = this._queue[i];
    this._queue[i] = this._fillValue;

    this._size--;
    return ret;
};

/**
 * Description.
 *
 *
 */
method.peekBack = function() {
    var size = this._size;
    if( size === 0 ) {
        return void 0;
    }
    return this._queue[
        ( this._front + size - 1 ) &
        ( this._capacity - 1 )
    ];
};

method.shift = method.removeFront = method.remove;
method.push = method.insertBack = method.add;
method.peekFront = method.peek;

//Meaningless semantics here
method.peek = method.remove =
    method.add = method.enqueue = method.dequeue = null;


return Deque;})();