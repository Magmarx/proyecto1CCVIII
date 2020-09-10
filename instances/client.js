var udp = require('dgram');
var globalFuncs = require('./globals.js');

var host = '127.0.0.1';
var port = '5384';
var srcPort = "KH";

function firstPacket(socket, address, port) {

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
    socket.send(seg, port, address, function(error) {
        if (error) {
            console.log('Data Send Error :( ');
        } else {
            console.log('Data sent !!!');
        }
    });

}

function run() {

    console.log('####### Client Init ....');

    // creating a client socket

    var client = udp.createSocket('udp4');
    var clientGlobals = new globalFuncs();

    firstPacket(client, host, port);

    // globals.createTcpHeader(0, 0, "KH", "--", []);



    //buffer msg
    // var data = Buffer.from('siddheshrane');

    client.on('message', function(msg, info) {
        console.log('Data received from server : ' + msg.toString());
        console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
    });

    // //sending msg
    // client.send(data, port, host, function(error) {
    //     if (error) {
    //         client.close();
    //     } else {
    //         console.log('Data sent !!!');
    //     }
    // });

    // var data1 = Buffer.from('hello');
    // var data2 = Buffer.from('world');

    // //sending multiple msg
    // client.send([data1, data2], port, host, function(error) {
    //     if (error) {
    //         client.close();
    //     } else {
    //         console.log('Data sent !!!');
    //     }
    // });

}

run();