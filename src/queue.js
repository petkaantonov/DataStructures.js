var Queue = (function() {
    var method = Queue.prototype;

    //Manual resizing because the native implementation of unshift and shift are O(N)
    var DEFAULT_CAPACITY = 16;
    var MAX_CAPACITY = 536870912;

    function closestPowerOfTwo( num ) {
        num = num >>> 0;
        num |= (num >> 1);
        num |= (num >> 2);
        num |= (num >> 4);
        num |= (num >> 8);
        num |= (num >> 16);
        num = num >>> 0;
        num++;
        return num;
    }

    function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
        console.log( srcIndex, dstIndex, len );

        for( var j = 0; j < len; ++j ) {
            dst[j + dstIndex ] = src[j + srcIndex];
        }
    }

    function Queue( capacity ) {
        var items = null;

        switch( typeof capacity ) {
        case "number":
            capacity = closestPowerOfTwo( capacity );
            break;
        case "object":
            if( capacity ) {
                items = toList( capacity );
                capacity = closestPowerOfTwo( items.length + 1);
            }
            break;
        default:
            capacity = DEFAULT_CAPACITY;
        }

        this._capacity = Math.max(Math.min( MAX_CAPACITY, capacity ), DEFAULT_CAPACITY);

        this._size = 0;
        this._items = null;
        this._front = 0;

        if( items ) {
            this._makeCapacity();
            this._addAll( items );
        }
    }

    method._makeCapacity = function() {
        var capacity = this._capacity,
            items = this._items = new Array( capacity );

        for( var i = 0; i < capacity; ++i ) {
            items[i] = null;
        }
        this._front = 0;
    };

    method._resizeTo = function( capacity ) {
        var oldItems = this._items,
            oldFront = this._front,
            oldCapacity = this._capacity,
            k = 0,
            size = this._size;

        this._capacity = capacity;

        this._makeCapacity();

        if( oldFront + size <= oldCapacity ) {
            arrayCopy( oldItems, oldFront, this._items, 0, size );
        }
        else {
            var lengthAfterWrapping = size - oldFront + 1;
            arrayCopy( oldItems, oldFront, this._items, 0, lengthAfterWrapping );
            arrayCopy( oldItems, 0, this._items, lengthAfterWrapping, oldFront );
        }

    };


    method._checkCapacity = function( size ) {
        if( size >= MAX_CAPACITY ) {
            throw new Error( "Too many items");
        }
        else if( size >= this._capacity ) {
            this._resizeTo( this._capacity * 2 );
        }
    };

    method._addAll = function( items ) {
        var len = items.length;
        if( len <= 0 ) {
            return;
        }
        this._checkCapacity( len + this._size );

        if( this._items === null ) {
            this._makeCapacity();
        }

        var size = this._size,
            queue = this._items,
            capacity = this._capacity,
            front = this._front,
            index = front + size;


        console.log( index, len, capacity );
        if( index + len <= capacity ) {
            arrayCopy( items, 0, queue, index, len );
        }
        else if( index <= capacity ) {
            var lengthAfterWrapping = index & ( capacity - 1 );
            arrayCopy( items, 0, this._items, index, lengthAfterWrapping );
            arrayCopy( items, lengthAfterWrapping, this._items, 0, len - lengthAfterWrapping );
        }
        else {
            arrayCopy( items, 0, queue, index & ( capacity - 1 ), len );
        }

        this._size += len;


    };

    method.enqueueAll = function( items ) {
        return this._addAll( toList( items ) );
    };

    method.enqueue = function( item ) {
        if( this._items === null ) {
            this._makeCapacity();
        }
        this._checkCapacity( this._size + 1 );
        var i = ( this._front + this._size ) & ( this._capacity - 1 );
        this._items[i] = item;
        this._size++;
    };

    method.dequeue = function() {
        if( this._size === 0 ){
            return void 0;
        }
        var front = this._front,
            ret = this._items[front];

        this._items[front] = null;
        this._front = ( front + 1 ) & ( this._capacity - 1);
        this._size--;
        return ret;
    };

    method.peek = function() {
        if( this._size === 0 ){
            return void 0;
        }
        return this._items[this._front];
    };

    method.size = function() {
        return this._size;
    };

    method.isEmpty = function() {
        return this._size === 0;
    };



    return Queue;
})();
