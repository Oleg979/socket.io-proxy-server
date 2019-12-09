var http = require('http'),
io = require('socket.io');
var fs = require('fs');

var server = http.createServer(function(req, res)
{
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end('<h1>Aw, snap! 404</h1>');
});

server.listen(8080);
io = io.listen(server, {
    log: true,
    origins: '*:*'
});

io.sockets.on('connection', function(socket)
{
  console.log('Proxy connected to server.');
  socket.on('disconnect', function() {
  console.log('Proxy disconnected from server');
  });

  socket.on("hello", data => console.log("Hello from proxy to server!"))
});