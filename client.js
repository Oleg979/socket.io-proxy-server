
////////////////////////////////////
// CLIENT SIDE
var io_client = require('socket.io-client');
var socket = io_client.connect('http://localhost:9559', {reconnect: true});

socket.on('connect', function() { 
  console.log('Proxy connected to server');
});
////////////////////////////////////
// SERVER SIDE
var https = require('https'),
io_server = require('socket.io');
var fs = require('fs');

var options = {
  key: fs.readFileSync('./real-keys/key.pem'),
  cert: fs.readFileSync('./real-keys/cert.pem')
};

var server = https.createServer(options, function(req, res)
{
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end('<h1>Hello from Proxy! 404</h1>');
});

server.listen(8088);
io_server = io_server.listen(server, {
    log: true,
    origins: '*:*'
});

io_server.sockets.on('connection', function(socket)
{
  console.log('Client connected to proxy');
  socket.on('disconnect', function() {
    console.log('Client disconnected from proxy.');
  });
});
////////////////////////////////////
