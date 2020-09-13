var fs = require('fs');
var path = require('path');

const log = require('node-file-logger');
const args = require('yargs').argv;

const options = {
    folderPath: './logs/',
    fileNamePrefix: 'ProyectoLogs_',
    fileNameExtension: '.log',
    dateFormat: 'YYYY_MM_D',
    timeFormat: 'h:mm:ss A'
};

log.SetUserOptions(options);

var tcp = require('net');
var globalFuncs = require('./globals.js');

var host = '127.0.0.1';
var port = '5384';
var srcPort = "MP";
var file = "../testCases/test.txt";

var hasSentFile = false;
var currentChunk = 0;
var finished = false;

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
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, "--", "002", false);

    var seg = clientGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    console.log(seg);
    socket.write(seg);

}

function secondPacket(socket, msg) {

    var clientGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    //  First we will send the SYN
    var seq = 2;
    var ack = 2;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "010", false);

    console.log(tcpHeader);

    var seg = clientGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.write(seg);
}

function sendFileNamePacket(socket, msg) {
    var clientGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    if (finished) {

        var finseq = 14;
        var finack = 14;

        /**
         * @param seqNumber
         * @param ackNumber
         * @param srcPort
         * @param dstPort
         * @param flags
         * 
         * Here we send
         * "001"; // FIN
         * "011"; // FIN-ACK
         */
        var finTcpHeader = clientGlobals.createTcpHeader(finseq, finack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "001", false);

        var finseg = clientGlobals.calcChecksum(finTcpHeader, "");

        console.log('Client send');
        console.log(processMsg(finseg));
        console.log(finseg);

        socket.write(finseg);

    } else {

        // console.log(!hasSentFile);

        if (!hasSentFile) {
            var seq = "2";
            var ack = "0";
            var fileName = clientGlobals.getFileName(file);

            /**
             * @param seqNumber
             * @param ackNumber
             * @param srcPort
             * @param dstPort
             * @param flags
             * 
             * Here we send
             */
            var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "008", true);
            var body = clientGlobals.createFileNameBody(fileName);

            var seg = clientGlobals.calcChecksum(tcpHeader, body);

            hasSentFile = true;

            console.log('Client send');
            console.log(processMsg(seg));
            console.log(seg);

            socket.write(seg);
        } else {

            let fileContentHex = fs.readFileSync(path.join(__dirname, file), { encoding: 'hex' });

            // console.log('########### recieved header');
            // console.log(sentHeader);

            // var ackcalc = parseInt(sentHeader.ackNumber).toString();
            // var acknum = parseInt(clientGlobals.hex2a(ackcalc));

            // var pckack = (acknum).toString();
            // var pckseq = (acknum).toString();

            // console.log('############## aCKSssss')
            // console.log(sentHeader.ackNumber)
            // console.log(parseInt(sentHeader.ackNumber))
            // console.log('###### finished flag')
            // console.log(finished);

            var pckseq = parseInt(sentHeader.ackNumber, 16);
            var pckack = parseInt(sentHeader.ackNumber, 16);

            var subChunk = fileContentHex.substr(currentChunk * 2920, 2920);

            /**
             * @param seqNumber
             * @param ackNumber
             * @param srcPort
             * @param dstPort
             * @param flags
             * 
             * Here we send
             */
            var pckTcpHeader = clientGlobals.createTcpHeader(pckseq, pckack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "008", false);
            var pckBody = subChunk;

            // console.log('########## TCP Header after ACKSSSSS')
            // console.log(pckTcpHeader)

            currentChunk++;

            if (currentChunk >= Math.ceil(fileContentHex.length / 2920)) {
                // console.log('####### Entered finished flag')
                finished = true;
            }

            var pckseg = clientGlobals.calcChecksum(pckTcpHeader, pckBody);

            console.log('Client send');
            console.log(processMsg(pckseg));
            console.log(pckseg);

            socket.write(pckseg);

        }
    }



}

function sendFilePacket(socket, msg) {

    let fileContentHex = fs.readFileSync(path.join(__dirname, file));

    console.log('length');
    console.log(fileContentHex.length);

    console.log('file data');
    console.log(fileContentHex);

    var clientGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());



    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "018");
    var body = fileContentHex.toString();

    console.log('TCP Header without checksum');
    console.log(tcpHeader);

    console.log('Body');
    console.log(body);

    var seg = clientGlobals.calcChecksum(tcpHeader, body);

    socket.write(seg);
}

function finishConnection(socket, msg) {
    var clientGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    //  First we will send the SYN
    var seq = 15;
    var ack = 15;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = clientGlobals.createTcpHeader(seq, ack, srcPort, clientGlobals.hex2a(sentHeader.dstPort), "008", false);

    console.log(tcpHeader);

    var seg = clientGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.write(seg);

    socket.destroy();
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

    // Parameter Assignment
    host = args.host;
    port = args.port;
    file = args.file;

    log.Info('####### Client Init ....');

    // creating a client socket

    var client = new tcp.Socket();

    console.log(host);
    console.log(port);
    client.connect(port, host, function() {
        console.log('Connected');
        log.Info('Connected');

        firstPacket(client);

    });

    client.on('close', function() {
        log.Info('Connection closed');
        console.log('Connection closed');
    });

    client.on('data', function(msg, info) {
        console.log('Data received from server : ' + msg.toString());
        log.Info('Data received from server : ' + msg.toString());
        console.log('Received %d bytes from %s:%d\n', msg.length);
        log.Info('Received %d bytes from %s:%d\n', msg.length);

        var parsedHeader = processMsg(msg.toString());

        console.log(parsedHeader);

        // Check ACK

        // if (parseInt(parsedHeader.seqNumber) == 1) {
        if (parseInt(parsedHeader.ackNumber) == 2) { // We review if the ack is correct
            log.Info('The First packet is correct, sending the second packet ...');
            secondPacket(client, msg.toString());
            sendFileNamePacket(client, msg.toString());
        }
        // else { // We resend if its incorrect
        //     log.Info('The ack is incorrect well resend the first packet of the 3whs');
        //     log.Info(parsedHeader.toString());
        //     firstPacket(client);
        // }
        // }
        // else if (parseInt(parsedHeader.seqNumber) == 32) {
        //     if (parseInt(parsedHeader.ackNumber) == 33) {
        //         console.log('Entered the file send');
        //         log.Info('The name packet was sent correctly, sending the chunks ...');
        //         sendFileNamePacket(client, msg.toString());
        //     } else {
        //         log.Info('The ack is incorrect well resend the file name packet');
        //         hasSentFile = false;
        //         sendFileNamePacket(client, msg.toString());
        //     }
        // } 
        else if (parseInt(parsedHeader.ackNumber, 16) > 32) {
            console.log('Entered the chunk send');
            log.Info('The data chunck packet was sent correctly, sending the other chunks ...');
            sendFileNamePacket(client, msg.toString());
        } else if (parseInt(parsedHeader.ackNumber) == 15) { // We review if the ack is correct
            log.Info('The Fin packet is correct, sending the last packet and closing the connection ...');
            finishConnection(client, msg.toString());
        }
        // else if (parseInt(parsedHeader.seqNumber) == 14) {
        //     if (parseInt(parsedHeader.ackNumber) == 15) { // We review if the ack is correct
        //         log.Info('The Fin packet is correct, sending the last packet and closing the connection ...');
        //         finishConnection(client, msg.toString());
        //     } else { // We resend if its incorrect
        //         log.Info('The Fin packet was incorrect resending the fin packet');
        //         sendFileNamePacket(client, msg.toString());
        //     }

        // }

        // if (parseInt(parsedHeader.ackNumber) == 30) {

        // }

        // if ((parseInt(parsedHeader.seqNumber) < 50)) {
        //     secondPacket(client, msg.toString());
        // }

        // if (parsedHeader.flags == "018") {
        //     sendFileNamePacket(client, msg.toString());
        // } else if (parsedHeader.flags == "010") {
        //     sendFileNamePacket(client, msg.toString());
        // } else if ((parsedHeader.flags == "012") && ((parseInt(parsedHeader.seqNumber) < 50))) {
        //     secondPacket(client, msg.toString());
        // } else if (parsedHeader.flags == "011") {
        //     finishConnection(client, msg.toString());
        // }


    });

}

run();