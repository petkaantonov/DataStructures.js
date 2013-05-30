/* global toList, SetForEach */
var Deque = (function() {
    var method = Deque.prototype;

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
        for( var j = 0; j < len; ++j ) {
            dst[j + dstIndex ] = src[j + srcIndex];
        }
    }

    function Deque( capacity ) {
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

        if( items ) {
            this._makeCapacity();
            this._addAll( items );
        }
    }

    method._checkCapacity = function( size ) {
        if( size >= MAX_CAPACITY ) {
            throw new Error( "Too many items");
        }
        else if( size >= this._capacity ) {
            this._resizeTo( this._capacity * 2 );
        }
    };

    this._resizeTo = function( size ) {
        var capacity = this._capacity = size,
            oldItems = this._items;

        this._makeCapacity();

        var l = this._size >> 1,
            n = capacity - l,
            items = this._items;
            i, j;

        for( i = 0; i < l; ++i ) {
            items[i] = oldItems[i];
            oldItems[i] = null;
        }

        this._firstIndex = j = i;

        for( i = capacity - 1; i >= n; --i ) {
            items[i] = oldItems[j];
            oldItems[j++] = null;
        }

        this._lastIndex = i;
    };

    method._addAll = function( items ) {
        this._checkCapacity( this._size() + items.length );
    };

    method._makeCapacity = function() {
        var capacity = this._capacity,
            items = this._items = new Array( capacity );

        for( var i = 0; i < capacity; ++i ) {
            items[i] = null;
        }
        this._firstIndex = this._lastIndex = 0;
    };

    method.forEach = SetForEach;

    method.insertAllAtEnd = function( items ) {
        items = toList( items );
    };

    method.insertAllFromStart = function( items ) {
        items = toList( items );
    };

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

    method.clear = function() {

    };

    method.size = method.length = function() {

    };

    method.isEmpty = function() {
        return this._size === 0;
    };

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function() {
        var method = Iterator.prototype;

        function Iterator() {

        }

        method.next = function() {

        };

        return Iterator;
    })();


    return Deque;
})();
