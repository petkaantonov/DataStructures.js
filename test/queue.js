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

queued = queued.concat( "1234567891234556678".split("") );
q.enqueueAll("1234567891234556678".split(""));

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