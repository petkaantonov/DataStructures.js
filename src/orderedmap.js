var OrderedMap = (function() {
    var _super = Map.prototype,
        hasOwn = {}.hasOwnProperty,
        method = OrderedMap.prototype = Object.create( _super );

    method.constructor = OrderedMap;

    for( var key in _super ) {
        if( hasOwn.call( _super, key ) &&
            key.charAt(0) !== "_" &&
            typeof _super[key] === "function" ) {
            method[ "$" + key ] = _super[key];
        }
    }

    var INSERTION_ORDER = OrderedMap.INSERTION_ORDER = {};
    var ACCESS_ORDER = OrderedMap.ACCESS_ORDER = {};

    function OrderedMap( capacity, equality, ordering ) {
        this._ordering = ordering === ACCESS_ORDER ? ACCESS_ORDER : INSERTION_ORDER;
        this._firstEntry = this._lastEntry = null;
        _super.constructor.call( this, capacity, equality );
    }

    OrderedMap.inAccessOrder = function( capacity, equality ) {
        return new OrderedMap( capacity, equality, ACCESS_ORDER );
    };


    method._resize = function() {
        var entry = this._firstEntry;

        while( entry !== null ) {
            var bucketIndex = this._hashAsBucketIndex( entry.hash );

            entry.next = this._buckets[bucketIndex];
            this._buckets[bucketIndex] = entry;

            entry = entry.nextEntry;
        }
    };

    method.indexOfKey = function( key ) {
        if( this._firstEntry === null ) {
            return -1;
        }
        var eq = this._equality,
            entry = this._firstEntry,
            i = 0;

        while( entry !== null ) {
            if( eq( entry.key, key ) ) {
                return i;
            }
            i++;
            entry = entry.nextEntry;
        }
        return -1;
    };

    method.indexOfValue = function( value ) {
        if( this._firstEntry === null ) {
            return -1;
        }
        var entry = this._firstEntry,
            i = 0;

        while( entry !== null ) {
            if( entry.value === value ) {
                return i;
            }
            i++;
            entry = entry.nextEntry;
        }
        return -1;
    };

    method.firstKey = function() {
        if( this._firstEntry === null ) {
            return void 0;
        }
        return this._firstEntry.key;
    };

    method.first = function() {
        return this.get( this.firstKey() );
    };

    method.lastKey = function( ) {
        if( this._firstEntry === null ) {
            return void 0;
        }

        return this._lastEntry.key;
    };

    method.last = function() {
        return this.get( this.lastKey() );
    };


    method.nthKey = function( index ) {
        if( index < 0 || index >= this._size ) {
            return void 0;
        }
        var entry = this._firstEntry;
        var i = 0;
        while( i < index ) {
            entry = entry.nextEntry;
            i++;
        }
        return entry.key;
    };

    method.nth = function( index ) {
        return this.get( this.nthKey( index ) );
    };

    method.containsValue = method.hasValue = function( value ) {
        return this.indexOfValue( value ) > -1;
    };

    method.clear = function() {
        this.$clear();
        this._firstEntry = this._lastEntry = null;
    };

    method.iterator = function() {
        return new Iterator( this );
    };

    var Iterator = (function( _super ) {
        var method = Iterator.prototype;

        function Iterator( map ) {
            this._map = map;
            this._modCount = map._modCount;
            this.moveToStart();
        }

        method._checkModCount = function() {
            if( this._modCount !== this._map._modCount ) {
                throw new Error( "map cannot be mutated while iterating" );
            }
        };

        method._getNextEntry = function() {
            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                this._index--;
                return ret;
            }
            if( this._currentEntry === null ) {
                return this._map._firstEntry;
            }
            else {
                return this._currentEntry.nextEntry;
            }
        };

        method._getPrevEntry = function() {
            if( this._backingEntry !== null ) {
                var ret = this._backingEntry;
                this._backingEntry = null;
                return ret.prevEntry;
            }
            if( this._currentEntry === null ) {
                return this._map._lastEntry;
            }
            else {
                return this._currentEntry.prevEntry;
            }
        };

        method.next = _super.next;
        method.prev = _super.prev;

        method.moveToStart = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this.index = -1;
            this._index = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.moveToEnd = function() {
            this._checkModCount();
            this.key = this.value = void 0;
            this._index = this._map._size;
            this.index = -1;
            this._backingEntry = this._currentEntry = null;

            return this;
        };

        method.set = method.put = _super.set;

        method["delete"] = method.remove = function() {
            this._checkModCount();

            if( this._currentEntry === null ) {
                return;
            }
            var entry = this._currentEntry,
                backingEntry,
                ret = entry.value;

            backingEntry = this._backingEntry = entry.nextEntry;

            this._map.remove( this.key );
            this._modCount = this._map._modCount;
            this.key = this.value = void 0;
            this.index = -1;

            if( backingEntry === null ) {
                this.moveToEnd();
            }

            return ret;
        };


        return Iterator;
    })( _super._Iterator.prototype );

    method._Iterator = Iterator;

    var Entry = (function() {
        var method = Entry.prototype;

        function Entry( key, value, next, hash ) {
            this.key = key;
            this.value = value;
            this.next = next;
            this.hash = hash;

            this.prevEntry = this.nextEntry = null;
        }

        method.inserted = function( map ) {
            if( map._firstEntry === null ) {
                map._firstEntry = map._lastEntry = this;
            }
            else if( map._firstEntry === map._lastEntry ) {
                map._lastEntry = this;
                map._firstEntry.nextEntry = this;
                this.prevEntry = map._firstEntry;
            }
            else {
                var last = map._lastEntry;
                map._lastEntry = this;
                last.nextEntry = this;
                this.prevEntry = last;
            }
        };

        method.removed = function( map ) {
            var prev = this.prevEntry,
                next = this.nextEntry,
                prevIsNull = prev === null,
                nextIsNull = next === null;

            this.prevEntry = this.nextEntry = this.key = this.value = null;

            if( prevIsNull && nextIsNull ) {
                map._firstEntry = map._lastEntry = null;
            }
            else if( nextIsNull ) {
                map._lastEntry = prev;
                map._lastEntry.nextEntry = null;
            }
            else if( prevIsNull ) {
                map._firstEntry = next;
                map._firstEntry.prevEntry = null;
            }
            else {
                next.prevEntry = prev;
                prev.nextEntry = next;
            }
        };

        method.accessed = function( map ) {
            if( map._ordering === ACCESS_ORDER &&
                map._firstEntry !== null &&
                map._firstEntry !== map._lastEntry &&
                map._lastEntry !== this ) {
                var prev = this.prevEntry,
                    next = this.nextEntry;

                if( prev !== null ) {
                    prev.nextEntry = next;
                }
                else {
                    map._firstEntry = next;
                }
                next.prevEntry = prev;

                var last = map._lastEntry;

                this.nextEntry = null;
                this.prevEntry = last;
                last.nextEntry = this;
                map._lastEntry = this;
            }
        };

        return Entry;
    })();

    method._entryType = Entry;

    return OrderedMap;
})();