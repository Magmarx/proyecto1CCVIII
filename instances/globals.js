var fs = require('fs');
var path = require('path');

module.exports = function() {
    this.createTcpHeader = function(seqNumber, ackNumber, srcPort, dstPort, flags, encode) {

        let header = "";

        /**
         * @addLog
         * @description here we will add the source port to the response header
         * @example "MP" -> 4D50
         */
        header += strToHex(srcPort);

        /**
         * @addLog
         * @description here we will add the destination port to the response header
         */
        header += strToHex(dstPort);

        /**
         * @addLog
         * @description here we will add the sequence number to the response header
         */
        var seqStr;
        if (encode) {
            seqStr = strToHex(seqNumber);
        } else {
            seqStr = seqNumber;
        }
        header += pad_with_zeroes(seqStr, 8);

        /**
         * @addLog
         * @description here we will add the ack to the response header
         */
        var ackStr;
        if (encode) {
            ackStr = strToHex(ackNumber);
        } else {
            ackStr = ackNumber;
        }
        header += pad_with_zeroes(ackStr, 8);

        /**
         * @addLog
         * @description here we will add the data offset to the response header
         */
        header += "5";

        /**
         * @addLog
         * @description here we will add the flags to the response header
         */
        header += flags;

        /**
         * @addLog
         * @description here we will add the window size to the response header
         */
        window = "1";
        header += pad_with_zeroes(window, 4);

        /**
         * @addLog
         * @description here we will add the checksum to the response header
         */
        checksum = "0";
        header += pad_with_zeroes(checksum, 4);

        /**
         * @addLog
         * @description here we will add the urgent pointer to the response header
         */
        urgentPointer = "0";
        header += pad_with_zeroes(urgentPointer, 4);


        return header;

    };
    this.createFileNameBody = function(name) {
        return strToHex(name);
    };
    this.calcChecksum = function(header, body) {
        var data = header + body,
            hexArr = [];

        for (var i = 0; i < data.length; i += 2) {
            hexArr.push(parseInt(data.substr(i, 2), 16));
        }

        var checksum = IPv4(hexArr).toString(16);

        header = header.slice(0, -8) + pad_with_zeroes_right(checksum, 8);

        return header.toUpperCase() + body.toUpperCase();
    };
    this.hex2a = function(hexx) {
        var hex = hexx.toString(); //force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    };
    this.getFileName = function(filePath) {
        if (filePath.indexOf('/') > -1) {
            return filePath.split('/').pop();
        } else {
            return filePath;
        }
    };
    this.createFile = function(filePath, fileBuffer) {
        fs.writeFile(filePath, fileBuffer, (err) => {
            if (err) console.log("Error while saving file: " + err);
        });
    };
};

function strToHex(str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i++) {
        var hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex);
    }
    return arr.join('');
}



function pad_with_zeroes(number, length) {

    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;

}

function pad_with_zeroes_right(number, length) {

    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = my_string + '0';
    }

    return my_string;

}

function IPv4(data) {
    for (var sum = 0, i = 0; i < data.length; i += 2) {
        var digit = (data[i] << 8) + data[i + 1];
        sum = (sum + digit) % 65535;
    }

    return (~sum) & 0xFFFF;
}