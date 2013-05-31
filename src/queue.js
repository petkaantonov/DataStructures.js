/* global toList */
var Queue = (function() {
    var method = Queue.prototype;

    //Manual resizing because the native implementation of unshift and shift are O(N)
    var DEFAULT_CAPACITY = 16;
    var MAX_CAPACITY = 536870912;

    function nextPowerOfTwo( num ) {
        num = ((num >>> 0) - 1);
        num |= (num >>> 1);
        num |= (num >>> 2);
        num |= (num >>> 4);
        num |= (num >>> 8);
        num |= (num >>> 16);
        return (num + 1)>>>0;
    }

    function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
        for( var j = 0; j < len; ++j ) {
            dst[j + dstIndex ] = src[j + srcIndex];
        }
    }

    function Queue( capacity ) {
        var items = null;

        switch( typeof capacity ) {
        case "number":
            capacity = nextPowerOfTwo( capacity );
            break;
        case "object":
            if( capacity ) {
                items = toList( capacity );
                capacity = nextPowerOfTwo( items.length );
            }
            break;
        default:
            capacity = DEFAULT_CAPACITY;
        }

        this._capacity = Math.max(Math.min( MAX_CAPACITY, capacity ), DEFAULT_CAPACITY);

        this._size = 0;
        this._queue = null;
        this._front = 0;

        if( items ) {
            this._makeCapacity();
            this._addAll( items );
        }
    }

    method._checkCapacity = function( size ) {
        if( size > MAX_CAPACITY ) {
            throw new Error( "Too many items");
        }
        else if( size > this._capacity ) {
            this._resizeTo( this._capacity * 2 );
        }
    };

    method._makeCapacity = function() {
        var capacity = this._capacity,
            items = this._queue = new Array( capacity );

        for( var i = 0; i < capacity; ++i ) {
            items[i] = null;
        }
        this._front = 0;
    };

    method._resizeTo = function( capacity ) {
        var oldQueue = this._queue,
            newQueue,
            oldFront = this._front,
            oldCapacity = this._capacity,
            size = this._size;

        this._capacity = capacity;

        this._makeCapacity();

        newQueue = this._queue;
            //Can perform direct linear copy
        if( oldFront + size <= oldCapacity ) {
            arrayCopy( oldQueue, oldFront, newQueue, 0, size );
        }
        else { //Cannot perform copy directly, perform as much as possible
                //at the end, and then copy the rest to the beginning of the buffer
            var lengthBeforeWrapping = size - oldFront + 1;
            arrayCopy( oldQueue, oldFront, newQueue, 0, lengthBeforeWrapping );
            arrayCopy( oldQueue, 0, newQueue, lengthBeforeWrapping, oldFront );
        }

    };

    method._addAll = function( items ) {
        var len = items.length;
        if( len <= 0 ) {
            return;
        }
        this._checkCapacity( len + this._size );

        if( this._queue === null ) {
            this._makeCapacity();
        }

        var queue = this._queue,
            capacity = this._capacity,
            insertionPoint = this._front + this._size & ( capacity - 1 );

         //Can perform direct linear copy
        if( insertionPoint + len < capacity ) {
            arrayCopy( items, 0, queue, insertionPoint, len );
        }
        else {
            //Cannot perform copy directly, perform as much as possible
            //at the end, and then copy the rest to the beginning of the buffer
            var lengthBeforeWrapping = capacity - insertionPoint;
            arrayCopy( items, 0, queue, insertionPoint, lengthBeforeWrapping );
            arrayCopy( items, lengthBeforeWrapping, queue, 0, len - lengthBeforeWrapping );
        }

        this._size += len;


    };

    //API

    method.addAll = function( items ) {
        return this._addAll( toList( items ) );
    };

    method.unshift = method.enqueue = function( item ) {
        if( this._queue === null ) {
            this._makeCapacity();
        }
        this._checkCapacity( this._size + 1 );
        var i = ( this._front + this._size ) & ( this._capacity - 1 );
        this._queue[i] = item;
        this._size++;
    };

    method.shift = method.dequeue = function() {
        if( this._size === 0 ){
            return void 0;
        }
        var front = this._front,
            ret = this._queue[front];

        this._queue[front] = null;
        this._front = ( front + 1 ) & ( this._capacity - 1);
        this._size--;
        return ret;
    };

    method.peekFront = function() {
        if( this._size === 0 ){
            return void 0;
        }
        return this._queue[this._front];
    };

    method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.toArray = method.toJSON = method.values = function() {
    };



    return Queue;
})();
