var tcp = require('net');
var globalFuncs = require('./globals.js');

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

var host = '127.0.0.1';
var port = '5384';
var srcPort = "MP";

var fileName = "";
var fileBody = "";

function fistPacket(socket, msg) {

    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());

    let paddingNeeded = msg.length / 4;
    let padding = "";
    for (var i = 0; i < paddingNeeded; i++) {
        padding += "0";
    }
    msg += padding;

    //  First we will send the SYN
    var seq = 1;
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
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "012", false);

    var seg = serverGlobals.calcChecksum(msg, "");

    //sending msg
    socket.write(tcpHeader);
}

function secondPacket(socket, msg) {

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
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "010");

    var seg = serverGlobals.calcChecksum(tcpHeader, "");

    //sending msg
    socket.write(seg);
}

function fileNamePacket(socket, msg) {

    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());
    var body = processBody(msg.toString());

    if (fileName.length > 0) { // Send packets

        fileBody += body;

        var ackcalc2 = parseInt(sentHeader.seqNumber).toString();
        var acknum2 = parseInt(serverGlobals.hex2a(ackcalc2));

        var pckack = (acknum2 + 1).toString();
        var pckseq = serverGlobals.hex2a(sentHeader.seqNumber);

        /**
         * @param seqNumber
         * @param ackNumber
         * @param srcPort
         * @param dstPort
         * @param flags
         * 
         * Here we send
         */
        var pckTcpHeader = serverGlobals.createTcpHeader(pckseq, pckack, srcPort, serverGlobals.hex2a(sentHeader.dstPort), "018", true);
        var pckBody = body;

        let paddingNeeded = pckBody.length / 4;
        let padding = "";
        for (var i = 0; i < paddingNeeded; i++) {
            padding += "0";
        }
        pckBody += padding;

        var pckseg = serverGlobals.calcChecksum(pckTcpHeader, pckBody);

        socket.write(pckTcpHeader);

    } else { // Send file name

        console.log('File name')
        console.log(body)
        console.log(serverGlobals.hex2a(body))
        fileName = serverGlobals.hex2a(body);

        var ackcalc = parseInt(sentHeader.seqNumber).toString();
        var acknum = parseInt(serverGlobals.hex2a(ackcalc));

        var ack = (acknum + 1).toString();
        var seq = serverGlobals.hex2a(sentHeader.seqNumber);

        /**
         * @param seqNumber 
         * @param ackNumber
         * @param srcPort
         * @param dstPort
         * @param flags
         * 
         * Here we send
         */
        var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "018", true);

        let paddingNeeded = body.length / 4;
        let padding = "";
        for (var i = 0; i < paddingNeeded; i++) {
            padding += "0";
        }
        body += padding;

        var seg = serverGlobals.calcChecksum(tcpHeader, body);

        //sending msg
        socket.write(tcpHeader);
    }

}

function sendFilePacket(socket, msg) {
    var serverGlobals = new globalFuncs();

    var sentHeader = processMsg(msg.toString());
    var body = processBody(msg.toString());

    var seq = parseInt(sentHeader.seqNumber) + 1;
    var ack = parseInt(sentHeader.ackNumber);

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

    var seg = serverGlobals.calcChecksum(tcpHeader, body);

    //sending msg
    socket.write(seg);
}

function savePacketFile(socket, msg) {

    var serverGlobals = new globalFuncs();

    var newFile = Buffer.from(fileBody, 'hex');

    serverGlobals.createFile("./descargas/" + fileName, newFile);

    var sentHeader = processMsg(msg.toString());

    var ack = 15;
    var seq = 14;

    /**
     * @param seqNumber
     * @param ackNumber
     * @param srcPort
     * @param dstPort
     * @param flags
     * 
     * Here we send
     */
    var tcpHeader = serverGlobals.createTcpHeader(seq, ack, serverGlobals.hex2a(sentHeader.srcPort), srcPort, "011", false);

    var seg = serverGlobals.calcChecksum(tcpHeader, "");

    fileName = "";
    fileBody = "";

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

function processBody(msg) {
    return msg.slice(40, msg.length);
}

function run() {

    // Parameter Assignment

    host = args.host;
    port = args.port;
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
        log.Info('Server is listening at port' + port);
        log.Info('Server ip :' + ipaddr);
        log.Info('Server is IP4/IP6 : ' + family);
    });

    server.on('connection', function(socket) {
        log.Info('#### A new client has connected');
        console.log('A new client has connected');

        socket.on('data', function(msg) {
            log.Info(`Data received from client: ${msg.toString()}.`);
            console.log(`Data received from client: ${msg.toString()}.`);

            var parsedHeader = processMsg(msg.toString());

            console.log(parsedHeader);
            log.Info(parsedHeader);

            if (parseInt(parsedHeader.seqNumber) == 1) {
                log.Info('Sending the first packet ...');
                fistPacket(socket, msg.toString());
            } else if (parseInt(parsedHeader.seqNumber) == 32) {
                log.Info('Sending the file name return ...');
                fileNamePacket(socket, msg.toString());
            } else if (parseInt(parsedHeader.seqNumber, 16) > 32) {
                log.Info('Sending the chunk data return ...');
                fileNamePacket(socket, msg.toString());
            } else if (parseInt(parsedHeader.seqNumber) == 14) {
                log.Info('Saving the file ...');
                savePacketFile(socket, msg.toString());
            }
            // else if (parseInt(parsedHeader.flags) == "010") {
            //     secondPacket(socket, msg.toString());
            // } else if (parsedHeader.flags == "008") {
            //     fileNamePacket(socket, msg.toString());
            // } else if (parsedHeader.flags == "001") {
            //     savePacketFile(socket, msg.toString());
            // }
        });

        socket.on('end', function() {
            log.Info('Closing connection with the client');
            console.log('Closing connection with the client');
        });

        socket.on('error', function(err) {
            log.Info(`Error: ${err}`);
            console.log(`Error: ${err}`);
        });
    });

    log.Info('####### Server Init ....');
    server.listen(port, host);

}

run();