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

    /*  This is efficient array implementation that provides
        O(1) for random access, removing at front, removing at back (deque only),
        adding at front, adding at back( deque only)

        It resizes itself automatically and uses power of two physical sizes to avoid modulo operations.

        It should perform much better than the native Javascript array when using the unshift/shift
        methods. Random access etc is slower, but much faster than would be in a linked list O(N).

        I didn't use this implementation because of random access though but to avoid creating a ton of
        objects and have better reference locality. I implemented the random access methods just because it was possible
        to do so efficiently. Could be useful if you need queue/deque but also random access...
    */

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
        this._modCount = 0;

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
        this._modCount++;
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
            insertionPoint = ( this._front + this._size ) & ( capacity - 1 );

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

    method.forEach = SetForEach;

    method.get = function( index ) {
        var i = (index >>> 0);
        if( i < 0 || i >= this._size ) {
            return void 0;
        }
        i = ( this._front + i ) & ( this._capacity - 1 );
        return this._queue[i];
    };

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

    method.addAll = function( items ) {
        this._modCount++;
        return this._addAll( toList( items ) );
    };

    method.unshift = method.enqueue = function( item ) {
        this._modCount++;
        if( this._queue === null ) {
            this._makeCapacity();
        }
        this._checkCapacity( this._size + 1 );
        var i = ( this._front + this._size ) & ( this._capacity - 1 );
        this._queue[i] = item;
        this._size++;
    };

    method.shift = method.dequeue = function() {
        this._modCount++;
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

    method.clear = function() {
        this._modCount++;
        this._front = this._size = 0;
        var queue = this._queue;
        for( var i = 0, len = queue.length; i < len; ++i ) {
            queue[i] = null;
        }
    };

    method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.toArray = method.toJSON = method.values = MapValues;

    method.valueOf = SetValueOf;

    method.toString = SetToString;

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator( queue ) {
            this._queue = queue;
            this._modCount = this._queue._modCount;
            this._items = this._queue._queue;
            this.moveToStart();
        }

        method._checkModCount = function() {
            if( this._modCount !== this._queue._modCount ) {
                throw new Error( "Cannot mutate queue while iterating" );
            }
        };
        method.next = function() {
            this._checkModCount();

            var i = ++this._index;

            if( i >= this._queue._size ) {
                this.moveToEnd();
                return false;
            }
            var item = this._items[( this._queue._front + i ) & ( this._queue._capacity - 1 )];

            this.value = item;
            this.index = i;

            return true;
        };

        method.prev = function() {
            this._checkModCount();

            var i = --this._index;

            if( i < 0 || this._queue._size === 0 ) {
                this.moveToStart();
                return false;
            }

            var item = this._items[( this._queue._front + i ) & ( this._queue._capacity - 1 )];

            this.value = item;
            this.index = i;

            return true;
        };

        method.moveToStart = function() {
            this._checkModCount();

            this.index = -1;
            this._index = -1;
            this.value = void 0;

            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();

            this.index = -1;
            this._index = this._queue._size;
            this.value = void 0;

            return this;
        };

        return Iterator;
    })();

    return Queue;
})();
