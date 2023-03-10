/*
    https://www.youtube.com/watch?v=mLflz9gq4EA
    My-y Goddess of the Night 
    Guide me with your light 
    Save us from the demons 
    They're below 
    If you're there you know 
    Nobody can ho-old 
    Hold you down and we go 
*/

const { io } = require("socket.io-client");

function patchEmitter(emitter, websocket) {
    var oldEmit = emitter.emit;
  
    emitter.emit = function() {
        var emitArgs = arguments;
        console.log(emitArgs)
        oldEmit.apply(emitter, arguments);
    }
}

socket = io('https://catwar.su', {
    path: '/ws/blogs/socket.io',
    reconnectionDelay: 10000,
    reconnectionDelayMax: 20000,
    transports: ["websocket"],
    withCredentials: true,
        extraHeaders: {
        "my-custom-header": "abcd"
    }
}); 
patchEmitter(socket)
// Add a connect listener
socket.on('was connected',function() {
  console.log('Client has connected to the server!');
});
// Add a connect listener
socket.on('message',function(data) {
  console.log('Received a message from the server!',data);
});
socket.on('error',function(data) {
    console.log('1',data);
  });
// Add a disconnect listener
socket.on('disconnect',function() {
  console.log('The client has disconnected!');
});

// Sends a message to the server via sockets
function sendMessageToServer(message) {
  socket.send(message);
};

//socket.disconnect().connect();
console.log('-')
sendMessageToServer("owo?")