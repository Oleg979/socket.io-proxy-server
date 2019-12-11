///////////////////////////////////////////////////////////////////////////////////////
var https = require("http"),
  io_server = require("socket.io");
var fs = require("fs");
///////////////////////////////////////////////////////////////////////////////////////
// FOR HTTPS
var options = {
  key: fs.readFileSync("./real-keys/key.pem"),
  cert: fs.readFileSync("./real-keys/cert.pem")
};
///////////////////////////////////////////////////////////////////////////////////////
// CLIENT SIDE
var io_client = require("socket.io-client");
var socket_client = io_client.connect("http://localhost:9559", {
  reconnect: true
});
socket_client.on("connect", function() {
  console.log("Proxy connected to server");
});
///////////////////////////////////////////////////////////////////////////////////////
// SERVER SIDE
var server = https.createServer(function(req, res) {
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end("<h1>Hello from Proxy!</h1>");
});

server.listen(8088);
io_server = io_server.listen(server, {
  log: true,
  origins: "*:*"
});

io_server.set("transports", ["xhr-polling", "jsonp-polling"]);

io_server.sockets.on("connection", function(socket_server) {
  console.log("Client connected to proxy");
  ////////////////////////////////////////////////
  // Here we receive requests from actual server to our proxy and forward them to clients
  socket_client.on("response", data => {
    console.log("response from server to proxy");
    socket_server.emit("response", data);
  });
  socket_client.on("presence", isChannelPresent => {
    console.log("presence from server to proxy");
    socket_server.emit("presence", isChannelPresent);
  });
  socket_client.on("connect", isConnected => {
    console.log("connect from server to proxy");
    socket_server.emit("connect", true);
  });
  ////////////////////////////////////////////////
  //Here we recevie requests from actual clients to our proxy and forward them to server
  socket_server.on("request", data => {
    console.log("Request from client to server");
    socket_client.emit("request", data);
  });
  socket_server.on("new-channel", data => {
    console.log("New channel from client to server");
    socket_client.emit("new-channel", data);
    ////////////////////////////////////
    const namespace = io_server.of("/" + data.channel);
    const nsp_socket = io_client.connect(
      `http://localhost:9559/${data.channel}`,
      { reconnect: true }
    );
    namespace.on("connection", function(socket_inside_namespace) {
      console.log("connect to channel: " + data.channel);
      nsp_socket.emit("connection");

      nsp_socket.on("connect", payload => {
        console.log(`connect to ${data.channel} from server to proxy`);
        socket_inside_namespace.emit("connect", true);
      });

      nsp_socket.on("message", payload => {
        console.log(`message to ${data.channel} from server to proxy`);
        socket_inside_namespace.broadcast.emit("message", payload);
      });

      nsp_socket.on("user-left", payload => {
        console.log(`user-left to ${data.channel} from server to proxy`);
        socket_inside_namespace.broadcast.emit("user-left", payload);
      });

      socket_inside_namespace.on("message", payload => {
        console.log(`message to ${data.channel} from client to proxy`);
        nsp_socket.emit("message", payload);
      });

      socket_inside_namespace.on("disconnect", payload => {
        console.log(`disconnect to ${data.channel} from client to proxy`);
        nsp_socket.emit("disconnect", payload);
      });
    });
    ////////////////////////////////////
  });
  socket_server.on("disconnect", data => {
    console.log("Disconnect from client to server");
    socket_client.emit("disconnect", data);
  });
  socket_server.on("presence", data => {
    console.log("Presence from client to server");
    socket_client.emit("presence", data);
  });
  ////////////////////////////////////////////////
});
///////////////////////////////////////////////////////////////////////////////////////
