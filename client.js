
///////////////////////////////////////////////////////////////////////////////////////
var https = require('http'),
  io_server = require('socket.io');
var fs = require('fs');
///////////////////////////////////////////////////////////////////////////////////////
// FOR
var options = {
  key: fs.readFileSync('./real-keys/key.pem'),
  cert: fs.readFileSync('./real-keys/cert.pem')
};
///////////////////////////////////////////////////////////////////////////////////////
// CLIENT SIDE
var io_client = require('socket.io-client');
var socket_client = io_client.connect('http://localhost:9559', { reconnect: true });
///////////////////////////////////////////////////////////////////////////////////////
// SERVER SIDE
var server = https.createServer(function (req, res) {
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello from Proxy! 404</h1>');
});

server.listen(8088);
io_server = io_server.listen(server, {
  log: true,
  origins: '*:*'
});

io_server.set('transports', [
  'xhr-polling',
  'jsonp-polling'
]);

io_server.sockets.on('connection', function (socket_server) {
  ////////////////////////////////////////////////
  // Here we receive requests from actual server to our proxy and forward them to clients
  socket_client.on('connect', function () {
    console.log('Proxy connected to server');
  });

  socket_client.on("hello", data => {
    console.log("Hello from server!");
  })

  socket_client.on("response", data => {
    socket_server.emit("response")
  })
  ////////////////////////////////////////////////
  //Here we recevie requests from actual clients to our proxy and forward them to server
  console.log('Client connected to proxy');

  socket_server.on("request", () => {
    socket_client.emit("request");
  })

  socket_server.on('disconnect', function () {
    console.log('Client disconnected from proxy.');
  });
});
///////////////////////////////////////////////////////////////////////////////////////