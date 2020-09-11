var tcp = require('net');
var globalFuncs = require('./globals.js');

var host = '127.0.0.1';
var port = '5384';
var RTT = 10000;
var srcPort = "DT";

function fistPacket(socket, msg) {

    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    //  First we will send the SYN
    var seq = 1;
    var ack = 50;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "012");

    var seg = serverGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.write(seg);
}

function secondPacket(socket, msg) {

    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    //  First we will send the SYN
    var seq = 50;
    var ack = 50;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "012");

    var seg = serverGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.write(seg);
}

function processMsg(msg) {

    var partMsg = {
        srcPort: msg.slice(0, 4),
        dstPort: msg.slice(4, 8),
        seqNumber: msg.slice(8, 16),
        ackNumber: msg.slice(16, 24),
        offset: msg.slice(24, 25),
        flags: msg.slice(25, 28),
        window: msg.slice(28, 32),
        checksum: msg.slice(32, 36),
        urgentPointer: msg.slice(36, 40)
    };

    return partMsg;
}

function run() {
    // creating a udp server
    var server = tcp.createServer();

    //emits when socket is ready and listening for datagram msgs
    server.on('listening', function() {
        var address = server.address();
        var port = address.port;
        var family = address.family;
        var ipaddr = address.address;
        console.log('Server is listening at port' + port);
        console.log('Server ip :' + ipaddr);
        console.log('Server is IP4/IP6 : ' + family);
    });

    server.on('connection', function(socket) {
        console.log('A new client has connected');

        socket.on('data', function(msg) {
            console.log(`Data received from client: ${msg.toString()}.`);

            var parsedHeader = processMsg(msg.toString());

            console.log(parsedHeader);

            if (parseInt(parsedHeader.seqNumber) == 1) {
                fistPacket(socket, msg.toString());
            } else if (parseInt(parsedHeader.seqNumber) == 50) {
                secondPacket(socket, msg.toString());
            }
        });

        socket.on('end', function() {
            console.log('Closing connection with the client');
        });

        socket.on('error', function(err) {
            console.log(`Error: ${err}`);
        });
    });

    server.listen(port, host);

}

run();