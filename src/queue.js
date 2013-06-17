/* global toList, arraySearch, arrayCopy, SetForEach, SetValueOf */
/* exported Queue */
var Queue = (function() {
var DEFAULT_CAPACITY = 16;
var MAX_CAPACITY = 536870912;

/**
 * Description.
 *
 *
 */
function clampCapacity( capacity ) {
    return Math.max(
            Math.min( MAX_CAPACITY, capacity ),
            DEFAULT_CAPACITY
    );
}

/**
 * Description.
 *
 *
 */
function nextPowerOfTwo( num ) {
    num = ((num >>> 0) - 1);
    num |= (num >>> 1);
    num |= (num >>> 2);
    num |= (num >>> 4);
    num |= (num >>> 8);
    num |= (num >>> 16);
    return (num + 1)>>>0;
}

/**
 * This is efficient array implementation that provides O(1) for random
 * access, removing at front, removing at back (deque only), adding at
 * front, adding at back( deque only)
 *
 * It resizes itself automatically and uses power of two physical sizes to
 * take advantage of bitwise wizardry in wrapping to avoid modulo
 * operations and if blocks.
 *
 * It should perform much better than the native Javascript array when
 * using the unshift/shift methods which need to do full move of all
 * indices every time. Random access etc is slower, but much faster than
 * would be in a linked list O(N).
 *
 * I didn't use this implementation because of random access though but to
 * avoid creating a ton of objects and have better spatial locality of
 * reference. I implemented the random access methods just because it was
 * possible to do so efficiently. Could be useful if you need queue/deque
 * but also random access...
 */
function Queue( capacity, maxSize, _arrayImpl ) {
    var items = null;

    this._maxSize = (maxSize = maxSize >>> 0) > 0 ?
        Math.min( maxSize, MAX_CAPACITY ) :
        MAX_CAPACITY;

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

    this._capacity = clampCapacity( capacity );

    this._size = 0;
    this._queue = null;
    this._front = 0;
    this._modCount = 0;

    if( _arrayImpl != null ) {
        this._arrayImpl = _arrayImpl;
        this._fillValue = 0;
    }
    else {
        this._arrayImpl = Array;
        this._fillValue = null;
    }

    if( items ) {
        this._makeCapacity();
        this._addAll( items );
    }
}
var method = Queue.prototype;

/**
 * Description.
 *
 *
 */
method._checkCapacity = function( size ) {
    if( this._capacity < size && size < this._maxSize ) {
        this._resizeTo( this._capacity * 2 );
    }
};

/**
 * Description.
 *
 *
 */
method._makeCapacity = function() {
    var capacity = this._capacity,
        items = this._queue = new this._arrayImpl( capacity ),
        fill = this._fillValue;


    for( var i = 0; i < capacity; ++i ) {
        items[i] = fill;
    }
    this._front = 0;
};

/**
 * Description.
 *
 *
 */
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
    else {//Cannot perform copy directly, perform as much as possible
            //at the end, and then copy the rest to the beginning of the buffer
        var lengthBeforeWrapping =
            size - ( ( oldFront + size ) & ( oldCapacity - 1 ) );

        arrayCopy( oldQueue, oldFront, newQueue, 0, lengthBeforeWrapping );
        arrayCopy(
            oldQueue,
            0,
            newQueue,
            lengthBeforeWrapping,
            size - lengthBeforeWrapping
        );
    }

};

/**
 * Description.
 *
 *
 */
method._addAll = function( items ) {
    this._modCount++;
    var size = this._size;

    var len = items.length;
    if( len <= 0 ) {
        return;
    }
    this._checkCapacity( len + size );

    if( this._queue === null ) {
        this._makeCapacity();
    }

    var queue = this._queue,
        capacity = this._capacity,
        insertionPoint = ( this._front + size) & ( capacity - 1 );

     //Can perform direct linear copy
    if( insertionPoint + len < capacity ) {
        arrayCopy( items, 0, queue, insertionPoint, len );
    }
    else {
        //Cannot perform copy directly, perform as much as possible
        //at the end, and then copy the rest to the beginning of the buffer
        var lengthBeforeWrapping = capacity - insertionPoint;
        arrayCopy( items, 0, queue, insertionPoint, lengthBeforeWrapping );
        arrayCopy(
            items,
            lengthBeforeWrapping,
            queue,
            0,
            len - lengthBeforeWrapping
        );
    }

    this._size = Math.min( size + len, this._maxSize );


};

//API

/**
 * Description.
 *
 *
 */
method.forEach = SetForEach;

/**
 * Description.
 *
 *
 */
method.get = function( index ) {
    var i = (index >>> 0);
    if( i < 0 || i >= this._size ) {
        return void 0;
    }
    i = ( this._front + i ) & ( this._capacity - 1 );
    return this._queue[i];
};

/**
 * Description.
 *
 *
 */
method.set = function( index, value ) {
    this._modCount++;
    var i = (index >>> 0);
    if( i < 0 || i >= this._size ) {
        return void 0;
    }
    i = ( this._front + i ) & ( this._capacity - 1 );
    var ret = this._queue[i];
    this._queue[i] = value;
    return ret;
};

/**
 * Description.
 *
 *
 */
method.addAll = function( items ) {
    this._modCount++;
    return this._addAll( toList( items ) );
};

/**
 * Description.
 *
 *
 */
method.add = method.enqueue = function( item ) {
    this._modCount++;
    var size = this._size;
    if( this._queue === null ) {
        this._makeCapacity();
    }
    this._checkCapacity( size + 1 );
    var i = ( this._front + size ) & ( this._capacity - 1 );
    this._queue[i] = item;
    this._size = Math.min( size + 1, this._maxSize );
};

/**
 * Description.
 *
 *
 */
method.remove = method.dequeue = function() {
    this._modCount++;
    if( this._size === 0 ){
        return void 0;
    }
    var front = this._front,
        ret = this._queue[front];

    this._queue[front] = this._fillValue;
    this._front = ( front + 1 ) & ( this._capacity - 1);
    this._size--;
    return ret;
};

/**
 * Description.
 *
 *
 */
method.peek = function() {
    if( this._size === 0 ){
        return void 0;
    }
    return this._queue[this._front];
};

/**
 * Description.
 *
 *
 */
method.clear = function() {
    this._modCount++;
    var queue = this._queue,
        fill = this._fillValue;
    for( var i = 0, len = queue.length; i < len; ++i ) {
        queue[i] = fill;
    }
    this._size = 0;
    this._front = 0;
};

/**
 * Description.
 *
 *
 */
method.size = function() {
    return this._size;
};

/**
 * Description.
 *
 *
 */
method.isEmpty = function() {
    return this._size === 0;
};

/**
 * Description.
 *
 *
 */
method.toArray = method.toJSON = method.values = function() {
    if( this._size === 0 ) {
        return [];
    }
    var size = this._size,
        queue = this._queue,
        front = this._front,
        capacity = this._capacity,
        ret = new Array( size );

    if( front + size <= capacity ) {
        arrayCopy( queue, front, ret, 0, size );
    }
    else {
        var lengthBeforeWrapping =
            size - ( ( front + size ) & ( capacity - 1 ) );
        arrayCopy( queue, front, ret, 0, lengthBeforeWrapping );
        arrayCopy(
            queue,
            0,
            ret,
            lengthBeforeWrapping,
            size - lengthBeforeWrapping
        );
    }

    return ret;
};

/**
 * Description.
 *
 *
 */
method.contains = function( value ) {
    var size = this._size;

    if( size === 0 ) {
        return false;
    }

    var queue = this._queue,
        front = this._front,
        capacity = this._capacity;

    if( front + size <= capacity ) {
        return arraySearch( queue, front, size, value );
    }
    else {
        var lengthBeforeWrapping =
            size - ( ( front + size ) & ( capacity - 1 ) );
        return  arraySearch( queue, front, lengthBeforeWrapping, value ) ?
                true :
                arraySearch( queue, 0, size - lengthBeforeWrapping, value );
    }
};

/**
 * Description.
 *
 *
 */
method.valueOf = SetValueOf;

/**
 * Description.
 *
 *
 */
method.toString = function() {
    return JSON.stringify( this.values() );
};

/**
 * Description.
 *
 *
 */
method.iterator = function() {
    return new Iterator( this );
};

var Iterator = (function() {


    /**
     * Description.
     *
     *
     */
    function Iterator( queue ) {
        this._queue = queue;
        this._modCount = this._queue._modCount;
        this._items = this._queue._queue;
        this.moveToStart();
    }
    var method = Iterator.prototype;

    /**
     * Description.
     *
     *
     */
    method._checkModCount = function() {
        if( this._modCount !== this._queue._modCount ) {
            throw new Error( "Cannot mutate queue while iterating" );
        }
    };

    /**
     * Description.
     *
     *
     */
    method.next = function() {
        this._checkModCount();

        var i = ++this._index;

        if( i >= this._queue._size ) {
            this.moveToEnd();
            return false;
        }

        var item = this._items[
                ( this._queue._front + i ) &
                ( this._queue._capacity - 1 )
        ];

        this.value = item;
        this.index = i;

        return true;
    };

    /**
     * Description.
     *
     *
     */
    method.prev = function() {
        this._checkModCount();

        var i = --this._index;

        if( i < 0 || this._queue._size === 0 ) {
            this.moveToStart();
            return false;
        }

        var item = this._items[
            ( this._queue._front + i ) &
            ( this._queue._capacity - 1 )
        ];

        this.value = item;
        this.index = i;

        return true;
    };

    /**
     * Description.
     *
     *
     */
    method.moveToStart = function() {
        this._checkModCount();

        this.index = -1;
        this._index = -1;
        this.value = void 0;

        return this;
    };

    /**
     * Description.
     *
     *
     */
    method.moveToEnd = function() {
        this._checkModCount();

        this.index = -1;
        this._index = this._queue._size;
        this.value = void 0;

        return this;
    };

    return Iterator;
})();

return Queue;})();