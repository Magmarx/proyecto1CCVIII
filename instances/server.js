var udp = require('dgram');
var globalFuncs = require('./globals.js');

var port = '5384';
var RTT = 10000;
var srcPort = "DT";

function fistPacket(socket, address, port, msg) {

    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg);

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
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, srcPort, serverGlobals.hex2a(sentHeader.srcPort), "012");

    var seg = serverGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.send(seg, port, address, function(error) {
        if (error) {
            client.close();
        } else {
            console.log('Data sent !!!');
        }

    });
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
    var server = udp.createSocket('udp4');

    // emits when any error occurs
    server.on('error', function(error) {
        console.log('Error: ' + error);
        server.close();
    });

    // emits on new datagram msg
    server.on('message', function(msg, info) {
        console.log('Data received from client : ' + msg.toString());
        console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);

        var parsedHeader = processMsg(msg);

        if (parsedHeader.seqNumber == "1") {
            fistPacket(server, info.address, info.port, msg.toString());
        }


    });

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

    //emits after the socket is closed using socket.close();
    server.on('close', function() {
        console.log('Socket is closed !');
    });

    server.bind(port);

    setTimeout(function() {
        server.close();
    }, RTT);
}

run();