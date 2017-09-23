var app = require('express')();
var http = require('http');

var io = require('socket.io')();
const httpProxy = require('http-proxy');

var port = process.env.PORT || 3000;


//
// Setup our server to proxy standard HTTP requests
//
var proxy = new httpProxy.createProxyServer({
	target: {
		host: 'localhost',
		port: port
	}
});
var proxyServer = http.createServer(function (req, res) {
	proxy.web(req, res);
});

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
proxyServer.on('upgrade', function (req, socket, head) {
	proxy.ws(req, socket, head);
});

proxyServer.listen(80);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const users = {};
let lastID = 0;
let disconnectTimeOut = 3000;

io.on('connection', function(socket) {
  let userId = socket.handshake.query.id;

  if (userId === 'undefined') {
    userId = lastID + 1;
    lastID +=1;
    socket.emit('yourID', userId);
  }
  users[userId] = {
    lastConnection: Date.now(),
    isConnected: true
  };
  console.log(users);
  console.log('Connected user id:', socket.id);
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function(data) {
    console.log('Disconnected:', socket.id);
    users[userId].isConnected = false;
    setTimeout(() => {
    }, disconnectTimeOut);
  });

});

const server = app.listen(port, function(){
  console.log('listening on *:' + port);
});

io.attach(server);
