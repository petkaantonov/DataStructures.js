/* global toList, arraySearch, arrayCopy, global, SetForEach, SetValueOf */
var Queue = (function() {
    var method = Queue.prototype;

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

    /*  This is efficient array implementation that provides
        O(1) for random access, removing at front, removing at back (deque only),
        adding at front, adding at back( deque only)

        It resizes itself automatically and uses power of two physical sizes to take
        advantage of bitwise wizardry in wrapping to avoid modulo operations and if blocks.

        It should perform much better than the native Javascript array when using the unshift/shift
        methods which need to do full move of all indices every time.
        Random access etc is slower, but much faster than would be in a linked list O(N).

        I didn't use this implementation because of random access though but to avoid creating a ton of
        objects and have better spatial locality of reference. I implemented the random access methods just because it was possible
        to do so efficiently. Could be useful if you need queue/deque but also random access...
    */

    var Array = [].constructor;

    function Queue( capacity, arrayImpl ) {
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

        if( arrayImpl != null ) {
            this._arrayImpl = arrayImpl;
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
            items = this._queue = new this._arrayImpl( capacity ),
            fill = this._fillValue;


        for( var i = 0; i < capacity; ++i ) {
            items[i] = fill;
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
        else {//Cannot perform copy directly, perform as much as possible
                //at the end, and then copy the rest to the beginning of the buffer
            var lengthBeforeWrapping = size - ( ( oldFront + size ) & ( oldCapacity - 1 ) );
            arrayCopy( oldQueue, oldFront, newQueue, 0, lengthBeforeWrapping );
            arrayCopy( oldQueue, 0, newQueue, lengthBeforeWrapping, size - lengthBeforeWrapping );
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

    method.add = method.enqueue = function( item ) {
        this._modCount++;
        if( this._queue === null ) {
            this._makeCapacity();
        }
        this._checkCapacity( this._size + 1 );
        var i = ( this._front + this._size ) & ( this._capacity - 1 );
        this._queue[i] = item;
        this._size++;
    };

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

    method.peek = function() {
        if( this._size === 0 ){
            return void 0;
        }
        return this._queue[this._front];
    };

    method.clear = function() {
        this._modCount++;
        this._front = this._size = 0;
        var queue = this._queue,
            fill = this._fillValue;
        for( var i = 0, len = queue.length; i < len; ++i ) {
            queue[i] = fill;
        }
    };

    method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };

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
            var lengthBeforeWrapping = size - ( ( front + size ) & ( capacity - 1 ) );
            arrayCopy( queue, front, ret, 0, lengthBeforeWrapping );
            arrayCopy( queue, 0, ret, lengthBeforeWrapping, size - lengthBeforeWrapping );
        }

        return ret;
    };

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
            var lengthBeforeWrapping = size - ( ( front + size ) & ( capacity - 1 ) );
            return  arraySearch( queue, front, lengthBeforeWrapping, value ) ?
                    true :
                    arraySearch( queue, 0, size - lengthBeforeWrapping, value );
        }
    };

    method.valueOf = SetValueOf;

    method.toString = function() {
        return JSON.stringify( this.values() );
    };

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

    function makeCtor( name, arrayImpl ) {
        Queue[name] = function( arg ) {
            return new Queue( arg, arrayImpl );
        };
    }

    var arrays = ("Uint16Array Uint32Array Uint8Array "+
        "Uint8ClampedArray Int16Array Int32Array "+
        "Int8Array Float32Array Float64Array").split(" ");

    for( var i = 0, len = arrays.length; i < len; ++i ) {
        var name = arrays[i];

        if( global[name] != null ) {
            makeCtor( name.replace( "Array", ""), global[name] );
        }
    }

    return Queue;
})();
