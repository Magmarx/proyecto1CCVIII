var tcp = require('net');
var globalFuncs = require('./globals.js');

var host = '10.8.0.18';
var port = '9999';
var srcPort = "MP";

function firstPacket(socket) {

    var clientGlobals = new globalFuncs();

    //  First we will send the SYN
    var seq = 1;
    var ack = 0;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, "--", "002");

    var seg = clientGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    console.log(seg);
    socket.write(seg);

}

function secondPacket(socket, msg) {

    var clientGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    //  First we will send the SYN
    var seq = 50;
    var ack = 50;

    console.log('50 seq and ack');

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "010");

    console.log(tcpHeader);

    var seg = clientGlobals.calcChecksum(tcpHeader, "");

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

    console.log('####### Client Init ....');

    // creating a client socket

    var client = new tcp.Socket();

    console.log(host);
    console.log(port);
    client.connect(port, host, function() {
        console.log('Connected');

        firstPacket(client, host, port);

    });

    client.on('close', function() {
        console.log('Connection closed');
    });

    client.on('data', function(msg, info) {
        console.log('Data received from server : ' + msg.toString());
        console.log('Received %d bytes from %s:%d\n', msg.length);

        var parsedHeader = processMsg(msg.toString());

        if (parseInt(parsedHeader.seqNumber) == 1) {
            secondPacket(client, msg.toString());
        }
    });

}

run();