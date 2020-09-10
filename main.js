var http = require("http");

http.createServer(function(request, response) {

    response.writeHead(200, { 'Content-Type': 'text/plain' });

    // udpSocket

    // First we do the three way handshake


}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');