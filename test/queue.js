/*
var queued = "abcdefghijklmnop".split("");
var dequed = [];

var q = new DS.Queue();
q.enqueue("a");
q.enqueueAll("bcdefghijklmnop".split(""))

var i = 0;
while( i < 11 ) {
    dequed.push(q.dequeue());
    i++;
}
var put = "daa rem uni ok not hai there what up dog desk per top kol mo ne mo ji to".split(" ");
queued = queued.concat( );
q.enqueueAll(put);

var i = 0;
while( i < 14 ) {
    dequed.push( q.dequeue() );
    i++;
}

queued = queued.concat("1234567891234556678".split("") );


q.enqueueAll("1234567891234556678".split(""));

q.enqueue(1)

q.enqueue(2)
q.enqueue(3)

queued.push( 1, 2, 3 );

dequed.forEach( function(v){
console.log(v);
var i = queued.indexOf(v);
if( i< 0 ) throw "asd";
    queued.splice( i, 1 );
});


queued.sort();

var qar = queue.toArray();

var buckets = [{"key":false,"value":true,"next":null,"hash":0},{"key":true,"value":true,"next":null,"hash":1},null,null,null,null,{"key":"pii","value":true,"next":null,"hash":193426421},{"key":"string","value":true,"next":null,"hash":2141447536},{"key":{"__uid322767358273__":8},"value":true,"next":{"key":3.14,"value":true,"next":{"key":4,"value":true,"next":null,"hash":1074790400},"hash":300063655},"hash":8},null,{"key":3,"value":true,"next":null,"hash":1074266112},{"key":"obj","value":true,"next":null,"hash":193420290},null,null,null,null,null,null,null,null,null,null,null];

var oldLength = 13;

var len = buckets.length;

for( var i = 0; i < oldLength; ++i ) {
    var entry = buckets[i];
    while( entry !== null ) {
        var bucketIndex = entry.hash % len,
            entryAtIndex = buckets[bucketIndex],
            next = entry.next;

        if( entry !== entryAtIndex ) {
            entry.next = entryAtIndex;
            buckets[bucketIndex] = entry;
        }

        entry = next;

    }
}

*/