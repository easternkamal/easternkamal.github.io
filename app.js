/* QR encoder: QRCode for JavaScript, Copyright (c) 2009 Kazuhiko Arase, MIT license (http://www.opensource.org/licenses/mit-license.php). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. */
var KPQRLib=(function(){var defs={},cache={};
function req(p){var n=p.replace(/^.*\//,"");if(cache[n])return cache[n].exports;var m={exports:{}};cache[n]=m;defs[n](m,m.exports,req);return m.exports}
defs["QR8bitByte"]=function(module,exports,require){
var QRMode = require('./QRMode');

function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};

module.exports = QR8bitByte;

};
defs["QRBitBuffer"]=function(module,exports,require){
function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};

module.exports = QRBitBuffer;

};
defs["QRErrorCorrectLevel"]=function(module,exports,require){
module.exports = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};


};
defs["QRMaskPattern"]=function(module,exports,require){
module.exports = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

};
defs["QRMath"]=function(module,exports,require){
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

module.exports = QRMath;

};
defs["QRMode"]=function(module,exports,require){
module.exports = {
    MODE_NUMBER :       1 << 0,
    MODE_ALPHA_NUM :    1 << 1,
    MODE_8BIT_BYTE :    1 << 2,
    MODE_KANJI :        1 << 3
};

};
defs["QRPolynomial"]=function(module,exports,require){
var QRMath = require('./QRMath');

function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};

module.exports = QRPolynomial;

};
defs["QRRSBlock"]=function(module,exports,require){
var QRErrorCorrectLevel = require('./QRErrorCorrectLevel');

function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

module.exports = QRRSBlock;

};
defs["QRUtil"]=function(module,exports,require){
var QRMode = require('./QRMode');
var QRPolynomial = require('./QRPolynomial');
var QRMath = require('./QRMath');
var QRMaskPattern = require('./QRMaskPattern');

var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};

module.exports = QRUtil;

};
defs["index"]=function(module,exports,require){


















var QR8bitByte = require('./QR8bitByte');
var QRUtil = require('./QRUtil');
var QRPolynomial = require('./QRPolynomial');
var QRRSBlock = require('./QRRSBlock');
var QRBitBuffer = require('./QRBitBuffer');

function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};

module.exports = QRCode;

};
return {QRCode:req("./index"),ECL:req("./QRErrorCorrectLevel")};})();
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};

/* ---------- theme ---------- */
var root=document.documentElement;
try{var saved=localStorage.getItem("kp-theme");if(saved)root.setAttribute("data-theme",saved)}catch(e){}
function isDark(){var t=root.getAttribute("data-theme");return t?t==="dark":window.matchMedia("(prefers-color-scheme:dark)").matches}
function syncThemeBtn(){var b=$("themeBtn");if(b){b.textContent=isDark()?"☀":"☾";b.setAttribute("aria-label",isDark()?"Switch to light theme":"Switch to dark theme")}}
if($("themeBtn"))$("themeBtn").addEventListener("click",function(){
  var next=isDark()?"light":"dark";root.setAttribute("data-theme",next);
  try{localStorage.setItem("kp-theme",next)}catch(e){}syncThemeBtn();
});
syncThemeBtn();

/* ---------- menu, nav, routing ---------- */
var links=$("links");
if($("menuBtn"))$("menuBtn").addEventListener("click",function(){
  var o=links.classList.toggle("open");$("menuBtn").setAttribute("aria-expanded",String(o));
});
var enter={},TOOLSET=["tools","emi","nepali","date","land","pdf","gold","qr"];
function setActive(name){
  document.querySelectorAll("[data-nav]").forEach(function(a){
    if(a.getAttribute("data-nav")===name)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
  });
  var g=$("ddBtn");if(g){if(TOOLSET.indexOf(name)>-1)g.setAttribute("aria-current","page");else g.removeAttribute("aria-current")}
  if(links)links.classList.remove("open");
  if($("ddMenu"))$("ddMenu").classList.remove("open");
  if(enter[name])enter[name]();
}
if(window.KP_SPA){
  var views=Array.prototype.slice.call(document.querySelectorAll(".view"));
  var route=function(first){
    var name=(location.hash||"#home").slice(1);
    if(!views.some(function(v){return v.getAttribute("data-view")===name}))name="home";
    views.forEach(function(v){v.hidden=v.getAttribute("data-view")!==name;if(!v.hidden){v.style.animation="none";void v.offsetWidth;v.style.animation=""}});
    var cur=views.filter(function(v){return !v.hidden})[0];
    document.title=cur.getAttribute("data-title");
    setActive(name);
    if(first!==true)window.scrollTo(0,0);
  };
  window.addEventListener("hashchange",route);
  route(true);
}else{
  setActive(document.body.getAttribute("data-page"));
}
if($("year"))$("year").textContent=new Date().getFullYear();

/* ---------- helpers ---------- */
var money=function(v){return new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Math.round(v))};
function num(el){return Number(String(el.value).replace(/,/g,""))}
function groupInt(str){return str.replace(/\B(?=(\d{3})+(?!\d))/g,",")}
function groupInput(el){
  el.addEventListener("input",function(){
    var v=el.value,pos=el.selectionStart==null?v.length:el.selectionStart;
    var before=v.slice(0,pos).replace(/[^0-9.]/g,"").length;
    var clean=v.replace(/[^0-9.]/g,""),dot=clean.indexOf(".");
    if(dot>-1)clean=clean.slice(0,dot+1)+clean.slice(dot+1).replace(/\./g,"");
    var parts=clean.split("."),out=groupInt(parts[0])+(parts.length>1?"."+parts[1]:"");
    el.value=out;
    var n=0,i=0;while(i<out.length&&n<before){if(/[0-9.]/.test(out[i]))n++;i++}
    try{el.setSelectionRange(i,i)}catch(e){}
  },true);
}
function compact(n){
  if(n>=1e9)return (n/1e9).toFixed(1).replace(/\.0$/,"")+"B";
  if(n>=1e6)return (n/1e6).toFixed(n%1e6?1:0).replace(/\.0$/,"")+"M";
  if(n>=1e3)return Math.round(n/1e3)+"K";
  return String(Math.round(n));
}
var ONES=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
var TENS=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function below100(n){return n<20?ONES[n]:TENS[Math.floor(n/10)]+(n%10?"-"+ONES[n%10]:"")}
function below1000(n){var h=Math.floor(n/100),r=n%100;return (h?ONES[h]+" hundred"+(r?" ":""):"")+(r?below100(r):"")}
function inWords(n){
  if(n===0)return "zero";
  var parts=[],cr=Math.floor(n/1e7),lk=Math.floor(n%1e7/1e5),th=Math.floor(n%1e5/1e3),rest=n%1e3;
  if(cr)parts.push(inWords(cr)+" crore");
  if(lk)parts.push(below100(lk)+" lakh");
  if(th)parts.push(below100(th)+" thousand");
  if(rest)parts.push(below1000(rest));
  return parts.join(" ");
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- EMI calculator ---------- */
if($("loanAmount")){
  var A=$("loanAmount"),R=$("interestRate"),T=$("tenure"),U=$("tenureUnit"),
      As=$("loanAmountR"),Rs=$("interestRateR"),Ts=$("tenureR"),
      schedMode="yearly";
  var sched=[];
  function tenureRange(){
    if(U.value==="years"){Ts.min=1;Ts.max=30;Ts.step=1}else{Ts.min=6;Ts.max=360;Ts.step=1}
  }
  function calc(){
    var P=num(A),rate=Number(R.value),tv=Number(T.value),months=U.value==="years"?tv*12:tv;
    var ok=isFinite(P)&&P>0&&isFinite(rate)&&rate>=0&&rate<=100&&isFinite(months)&&months>=1&&months<=600&&Math.round(months)===months;
    if(!ok){
      $("emiAmount").textContent="Enter valid values";
      ["totalInterest","totalPayment","installments","principalOut"].forEach(function(id){$(id).textContent="-"});
      $("words").textContent="";return;
    }
    var r=rate/1200;
    var emi=r===0?P/months:P*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
    var total=emi*months,interest=total-P;
    $("emiAmount").textContent="NPR "+money(emi);
    $("totalInterest").textContent="NPR "+money(interest);
    $("totalPayment").textContent="NPR "+money(total);
    $("principalOut").textContent="NPR "+money(P);
    $("installments").textContent=months;
    $("words").textContent=cap(inWords(Math.round(P)))+" rupees";
    // schedule
    sched=[];var bal=P,cumI=0;
    for(var m=1;m<=months;m++){
      var i=bal*r,p=Math.min(emi-i,bal);bal=Math.max(bal-p,0);cumI+=i;
      sched.push({m:m,emi:emi,p:p,i:i,bal:bal<0.5?0:bal,cumI:cumI});
    }
    drawDonut(P,interest);drawChart(P,months,interest);drawTable();
  }
  function drawDonut(P,I){
    var C=2*Math.PI*52,pp=P/(P+I),ip=1-pp;
    $("dP").setAttribute("stroke-dasharray",(C*pp)+" "+C);
    $("dI").setAttribute("stroke-dasharray",(C*ip)+" "+C);
    $("dI").setAttribute("stroke-dashoffset",String(-C*pp));
    $("donutPct").textContent=Math.round(ip*100)+"%";
  }
  function drawChart(P,months,I){
    var W=560,H=230,L=58,B=28,Tp=10,Rt=12,pw=W-L-Rt,ph=H-B-Tp,maxY=P+I*0; // balance max is P; cumulative interest max is I
    var top=Math.max(P,I);
    var x=function(m){return L+pw*m/months},y=function(v){return Tp+ph*(1-v/top)};
    var s="";
    for(var g=0;g<=4;g++){
      var v=top*g/4,yy=y(v);
      s+='<line class="grid" x1="'+L+'" x2="'+(W-Rt)+'" y1="'+yy+'" y2="'+yy+'"/><text x="'+(L-8)+'" y="'+(yy+3)+'" text-anchor="end">'+compact(v)+'</text>';
    }
    var step=months<=24?6:months<=72?12:months<=180?24:60;
    for(var m=0;m<=months;m+=step){
      s+='<text x="'+x(m)+'" y="'+(H-8)+'" text-anchor="middle">'+(months<=24?m+"m":(m/12)+"y")+'</text>';
    }
    var area="M"+x(0)+","+y(P),line="",ci="M"+x(0)+","+y(0);
    sched.forEach(function(r){area+=" L"+x(r.m)+","+y(r.bal);ci+=" L"+x(r.m)+","+y(r.cumI)});
    area+=" L"+x(months)+","+y(0)+" L"+x(0)+","+y(0)+" Z";
    s+='<path class="bal" d="'+area+'"/><path class="int" d="'+ci+'"/>';
    s+='<circle cx="'+x(months)+'" cy="'+y(I)+'" r="4" fill="#e0a02e"/>';
    $("chart").innerHTML=s;
  }
  function drawTable(){
    var h="",b="";
    if(schedMode==="yearly"){
      h="<tr><th>Year</th><th>Principal paid</th><th>Interest paid</th><th>Balance</th></tr>";
      var yrs=Math.ceil(sched.length/12);
      for(var y=0;y<yrs;y++){
        var sl=sched.slice(y*12,y*12+12),p=0,i=0;sl.forEach(function(r){p+=r.p;i+=r.i});
        b+="<tr><td>"+(y+1)+"</td><td>"+money(p)+"</td><td>"+money(i)+"</td><td>"+money(sl[sl.length-1].bal)+"</td></tr>";
      }
    }else{
      h="<tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>";
      sched.forEach(function(r){b+="<tr><td>"+r.m+"</td><td>"+money(r.emi)+"</td><td>"+money(r.p)+"</td><td>"+money(r.i)+"</td><td>"+money(r.bal)+"</td></tr>"});
    }
    $("schedHead").innerHTML=h;$("schedBody").innerHTML=b;
  }
  groupInput(A);
  A.addEventListener("input",function(){As.value=num(A);calc()});
  As.addEventListener("input",function(){A.value=groupInt(String(As.value));calc()});
  [[R,Rs],[T,Ts]].forEach(function(p){
    p[0].addEventListener("input",function(){p[1].value=p[0].value;calc()});
    p[1].addEventListener("input",function(){p[0].value=p[1].value;calc()});
  });
  U.addEventListener("change",function(){
    var v=Number(T.value);
    if(U.value==="months")T.value=Math.min(360,Math.max(6,v*12));else T.value=Math.min(30,Math.max(1,Math.round(v/12)));
    tenureRange();Ts.value=T.value;calc();
  });
  document.querySelectorAll("[data-sched]").forEach(function(b){
    b.addEventListener("click",function(){
      schedMode=b.getAttribute("data-sched");
      document.querySelectorAll("[data-sched]").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});
      drawTable();
    });
  });
  tenureRange();calc();
}

/* ---------- Nepali converter (offline, phonetic) ---------- */
if($("unicodeInput")){
  var romanToUnicode={
    vowels:{'aa':'आ','a':'अ','ii':'ई','ee':'ई','i':'इ','uu':'ऊ','oo':'ऊ','u':'उ','ri':'ऋ','e':'ए','ai':'ऐ','o':'ओ','au':'औ'},
    matras:{'aa':'ा','a':'','ii':'ी','ee':'ी','i':'ि','uu':'ू','oo':'ू','u':'ु','ri':'ृ','e':'े','ai':'ै','o':'ो','au':'ौ'},
    consonants:{'ksh':'क्ष','chh':'छ','sh':'श','Sh':'ष','kh':'ख','gh':'घ','ng':'ङ','ch':'च','jh':'झ','ny':'ञ','Th':'ठ','Dh':'ढ','th':'थ','dh':'ध','ph':'फ','bh':'भ','K':'क','T':'ट','D':'ड','N':'ण','t':'त','d':'द','n':'न','p':'प','b':'ब','m':'म','y':'य','r':'र','l':'ल','w':'व','v':'व','s':'स','h':'ह','g':'ग','j':'ज','k':'क','f':'फ','q':'क','x':'क्ष'},
    signs:{'M':'ं','H':'ः','~':'ँ'}
  };
  var specialWords={'namaste':'नमस्ते','nepal':'नेपाल','nepali':'नेपाली','dhanyabad':'धन्यवाद','dhanyavaad':'धन्यवाद','kathmandu':'काठमाडौं','sanchai':'सञ्चै','mero':'मेरो','naam':'नाम','ho':'हो'};
  var tokens=Object.keys(Object.assign({},romanToUnicode.consonants,romanToUnicode.vowels,romanToUnicode.signs)).sort(function(a,b){return b.length-a.length});
  var has=function(o,k){return Object.prototype.hasOwnProperty.call(o,k)};
  var romanToDevanagari=function(text){
    return text.split(/([\s]+)/).map(function(part){
      if(!part||/^\s+$/.test(part))return part;
      var lower=part.toLowerCase();
      if(specialWords[lower])return specialWords[lower];
      var out="",i=0;
      while(i<part.length){
        var rest=part.slice(i),token=tokens.find(function(t){return rest.indexOf(t)===0});
        if(!token){out+=part[i];i++;continue}
        i+=token.length;
        if(romanToUnicode.consonants[token]){
          var next=tokens.find(function(t){return part.slice(i).indexOf(t)===0});
          if(next&&has(romanToUnicode.matras,next)){out+=romanToUnicode.consonants[token]+romanToUnicode.matras[next];i+=next.length}
          else if(next&&romanToUnicode.consonants[next])out+=romanToUnicode.consonants[token]+"्";
          else out+=romanToUnicode.consonants[token];
        }else if(has(romanToUnicode.vowels,token))out+=romanToUnicode.vowels[token];
        else out+=romanToUnicode.signs[token]||token;
      }
      return out;
    }).join("");
  };
  var u2r={'अ':'a','आ':'aa','इ':'i','ई':'ii','उ':'u','ऊ':'uu','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au','क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ng','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'ny','ट':'T','ठ':'Th','ड':'D','ढ':'Dh','ण':'N','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'Sh','स':'s','ह':'h','क्ष':'ksh','त्र':'tra','ज्ञ':'gya','ं':'M','ः':'H','ँ':'~','ा':'aa','ि':'i','ी':'ii','ु':'u','ू':'uu','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au','्':''};
  var CONS=['क','ख','ग','घ','ङ','च','छ','ज','झ','ञ','ट','ठ','ड','ढ','ण','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'];
  var MAT=['ा','ि','ी','ु','ू','ृ','े','ै','ो','ौ'];
  var devanagariToRoman=function(text){
    var chars=Array.from(text),out="";
    for(var i=0;i<chars.length;i++){
      var ch=chars[i];
      if(u2r[ch]!==undefined){
        var base=u2r[ch];
        if(CONS.indexOf(ch)>-1){
          var nx=chars[i+1];
          if(nx==="्"){out+=base;i++}
          else if(nx&&u2r[nx]!==undefined&&MAT.indexOf(nx)>-1){out+=base+u2r[nx];i++}
          else out+=base+"a";
        }else out+=base;
      }else out+=ch;
    }
    return out;
  };
  var mode="unicode",inB=$("unicodeInput"),outB=$("unicodeOutput");
  var update=function(){
    outB.value=mode==="unicode"?romanToDevanagari(inB.value):devanagariToRoman(inB.value);
    $("charCount").textContent=inB.value.length+" characters";
  };
  var setMode=function(m,keep){
    mode=m;var tu=m==="unicode";
    $("toUnicodeMode").setAttribute("aria-pressed",String(tu));
    $("toRomanMode").setAttribute("aria-pressed",String(!tu));
    $("inputLabel").textContent=tu?"Type in English (Romanized Nepali)":"Paste Nepali Unicode text";
    $("outputLabel").textContent=tu?"Nepali Unicode output":"Romanized output";
    $("modeHint").textContent=tu?"Example: namaste → नमस्ते":"Example: नमस्ते → namaste";
    inB.placeholder=tu?"Type here, e.g. namaste, mero naam Kamal ho":"यहाँ नेपाली Unicode text राख्नुहोस्…";
    inB.classList.toggle("deva",!tu);outB.classList.toggle("deva",tu);
    if(!keep)inB.value="";
    update();
  };
  $("toUnicodeMode").addEventListener("click",function(){setMode("unicode")});
  $("toRomanMode").addEventListener("click",function(){setMode("roman")});
  $("swapBtn").addEventListener("click",function(){var o=outB.value;setMode(mode==="unicode"?"roman":"unicode",true);inB.value=o;update()});
  inB.addEventListener("input",update);
  $("clearUnicode").addEventListener("click",function(){inB.value="";update();inB.focus()});
  document.querySelectorAll("[data-ex]").forEach(function(b){b.addEventListener("click",function(){
    if(mode!=="unicode")setMode("unicode");
    inB.value=(inB.value?inB.value+" ":"")+b.getAttribute("data-ex");update();
  })});
  $("copyUnicode").addEventListener("click",function(){copyText(outB.value,$("copyUnicode"),"Copy output")});
  setMode("unicode");
  inB.value="namaste, mero naam Kamal ho";update();
}

/* ---------- Amount tool ---------- */
if($("amtIn")){
  var DIG="०१२३४५६७८९";
  var amt=function(){
    var raw=$("amtIn").value.replace(/,/g,"").trim(),n=Number(raw);
    if(!raw||!isFinite(n)||n<0||n>=1e14){["amtWords","amtDeva","amtGroup"].forEach(function(id){$(id).textContent="-"});return}
    var rupees=Math.floor(n),paisa=Math.round((n-rupees)*100);
    if(paisa===100){rupees+=1;paisa=0}
    var w="Rupees "+inWords(rupees)+(paisa?" and "+inWords(paisa)+" paisa":"")+" only";
    var g=new Intl.NumberFormat("en-IN",{minimumFractionDigits:paisa?2:0,maximumFractionDigits:2}).format(rupees+paisa/100);
    $("amtWords").textContent=cap(w);
    $("amtGroup").textContent="NPR "+g;
    $("amtDeva").textContent="रु "+g.replace(/\d/g,function(d){return DIG[d]});
  };
  groupInput($("amtIn"));$("amtIn").addEventListener("input",amt);amt();
  $("copyWords").addEventListener("click",function(){copyText($("amtWords").textContent,$("copyWords"),"Copy words")});
}

/* ---------- Contact ---------- */
function copyText(t,btn,label){
  if(!t||t==="-")return;
  var done=function(m){btn.textContent=m;setTimeout(function(){btn.textContent=label},1600)};
  try{navigator.clipboard.writeText(t).then(function(){done("Copied")},function(){done("Select and copy")})}
  catch(e){done("Select and copy")}
}
document.querySelectorAll("[data-copy]").forEach(function(b){
  b.addEventListener("click",function(){copyText($(b.getAttribute("data-copy")).textContent,b,b.getAttribute("data-label")||"Copy")});
});
if($("msg")){
  var draft=function(){
    var name=$("cName").value.trim()||"[Your name]",topic=$("cTopic").value,msg=$("msg").value.trim()||"[Your message]";
    var text="Subject: "+topic+"\n\nNamaste Kamal,\n\n"+msg+"\n\nRegards,\n"+name;
    $("draftOut").value=text;
    $("mailLink").setAttribute("href","mailto:"+$("emailText").textContent+"?subject="+encodeURIComponent(topic)+"&body="+encodeURIComponent(text.split("\n\n").slice(1).join("\n\n")));
  };
  ["cName","cTopic","msg"].forEach(function(id){$(id).addEventListener("input",draft)});
  $("copyDraft").addEventListener("click",function(){copyText($("draftOut").value,$("copyDraft"),"Copy draft")});
  draft();
}

/* ---------- dropdown ---------- */
if($("ddBtn")){
  $("ddBtn").addEventListener("click",function(e){e.stopPropagation();var o=$("ddMenu").classList.toggle("open");$("ddBtn").setAttribute("aria-expanded",String(o))});
  document.addEventListener("click",function(e){if(!$("ddMenu").contains(e.target)){$("ddMenu").classList.remove("open");$("ddBtn").setAttribute("aria-expanded","false")}});
}

/* ---------- command palette ---------- */
(function(){
  var pal=$("pal");if(!pal)return;
  var items=Array.prototype.slice.call(document.querySelectorAll("#links a[data-nav]")).map(function(a){
    return {label:a.childNodes[0].textContent.trim(),desc:(a.querySelector("small")||{}).textContent||"",href:a.getAttribute("href"),kw:(a.getAttribute("data-kw")||"")};
  });
  var inp=$("palIn"),list=$("palList"),sel=0,shown=[];
  function render(){
    var q=inp.value.trim().toLowerCase();
    shown=items.filter(function(i){return !q||(i.label+" "+i.desc+" "+i.kw).toLowerCase().indexOf(q)>-1});
    if(sel>=shown.length)sel=0;
    list.innerHTML=shown.length?shown.map(function(i,n){return '<li><a href="'+i.href+'" aria-selected="'+(n===sel)+'">'+i.label+'<small>'+i.desc+'</small></a></li>'}).join(""):'<li class="pal-empty">No matching page.</li>';
  }
  function open(){pal.classList.add("open");inp.value="";sel=0;render();inp.focus()}
  function close(){pal.classList.remove("open")}
  document.addEventListener("keydown",function(e){
    var k=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&k==="k"){e.preventDefault();pal.classList.contains("open")?close():open();return}
    if(!pal.classList.contains("open"))return;
    if(k==="escape")close();
    else if(k==="arrowdown"){e.preventDefault();sel=Math.min(sel+1,shown.length-1);render()}
    else if(k==="arrowup"){e.preventDefault();sel=Math.max(sel-1,0);render()}
    else if(k==="enter"&&shown[sel]){e.preventDefault();close();location.href=shown[sel].href}
  });
  inp.addEventListener("input",function(){sel=0;render()});
  pal.addEventListener("click",function(e){if(e.target===pal||e.target.closest("a"))close()});
  if($("palBtn"))$("palBtn").addEventListener("click",open);
})();

/* ---------- lazy libraries ---------- */
var LIBS={
  date:[["https://cdn.jsdelivr.net/npm/nepali-date-converter@3.4.2/dist/nepali-date-converter.umd.js","https://unpkg.com/nepali-date-converter@3.4.2/dist/nepali-date-converter.umd.js"]],
  pdf:[["https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"],["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"]]
};
var loaded={};
function loadOne(urls){
  return new Promise(function(res,rej){
    var i=0;
    (function next(){
      if(i>=urls.length)return rej(new Error("A required library did not load. Check your internet connection and reload the page."));
      var s=document.createElement("script");s.src=urls[i++];
      s.onload=function(){res()};s.onerror=function(){s.remove();next()};
      document.head.appendChild(s);
    })();
  });
}
function ensure(key){
  if(!loaded[key])loaded[key]=Promise.all(LIBS[key].map(loadOne)).then(function(){
    if(key==="pdf"&&window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }).catch(function(e){loaded[key]=null;throw e});
  return loaded[key];
}
function el(tag,text,cls){var n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n}

/* ---------- Date converter (AD <-> BS) ---------- */
if($("dateInput")){
  var dMode="ad-to-bs",dRes=$("dateResult"),dIn=$("dateInput"),bsIn=$("bsDateInput");
  var MONTHS=["Baisakh","Jestha","Asar","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];
  var p2=function(n){return String(n).padStart(2,"0")};
  var showD=function(title,detail,err){dRes.className="res"+(err?" err":"");dRes.replaceChildren(el("strong",title),el("span",detail));$("copyDate").hidden=err||!/\d{4}-\d{2}-\d{2}/.test(detail+title)};
  var setDMode=function(m){
    dMode=m;var ad=m==="ad-to-bs";
    $("adToBsMode").setAttribute("aria-pressed",String(ad));$("bsToAdMode").setAttribute("aria-pressed",String(!ad));
    $("adField").hidden=!ad;$("bsDateFields").hidden=ad;
    showD("Converted date will appear here","Choose a date and select Convert date.");$("copyDate").hidden=true;
  };
  var convertDate=function(){
    ensure("date").then(function(){
      if(typeof NepaliDate==="undefined")throw new Error("Date library did not load. Check your internet connection and reload the page.");
      if(dMode==="ad-to-bs"){
        if(!dIn.value)throw new Error("Please select an English (AD) date.");
        var a=dIn.value.split("-").map(Number),ad=new Date(a[0],a[1]-1,a[2]);
        if(ad.getFullYear()!==a[0]||ad.getMonth()!==a[1]-1||ad.getDate()!==a[2])throw new Error("Please enter a valid date.");
        var bs=new NepaliDate(ad).getBS();
        showD("Nepali date (Bikram Sambat)",bs.year+"-"+p2(bs.month+1)+"-"+p2(bs.date)+" ("+bs.date+" "+MONTHS[bs.month]+" "+bs.year+")");
      }else{
        var m=bsIn.value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if(!m)throw new Error("Enter the Nepali date as YYYY-MM-DD, for example 2083-08-03.");
        var y=+m[1],mo=+m[2],d=+m[3];
        if(mo<1||mo>12||d<1||d>32)throw new Error("Please enter a valid Nepali date.");
        var nd=new NepaliDate(y,mo-1,d),chk=nd.getBS();
        if(chk.year!==y||chk.month!==mo-1||chk.date!==d)throw new Error("That day does not exist in the selected Nepali month.");
        var js=nd.toJsDate();
        if(!(js instanceof Date)||isNaN(js.getTime()))throw new Error("This Nepali date is outside the supported calendar data.");
        showD("English date (Gregorian)",js.getFullYear()+"-"+p2(js.getMonth()+1)+"-"+p2(js.getDate()));
      }
    }).catch(function(e){showD("Unable to convert date",e.message||"Please check the date and try again.",true)});
  };
  $("adToBsMode").addEventListener("click",function(){setDMode("ad-to-bs")});
  $("bsToAdMode").addEventListener("click",function(){setDMode("bs-to-ad")});
  $("convertDateBtn").addEventListener("click",convertDate);
  $("todayDateBtn").addEventListener("click",function(){
    var n=new Date();dIn.value=n.getFullYear()+"-"+p2(n.getMonth()+1)+"-"+p2(n.getDate());setDMode("ad-to-bs");convertDate();
  });
  $("clearDateBtn").addEventListener("click",function(){dIn.value="";bsIn.value="";setDMode(dMode)});
  dIn.addEventListener("change",function(){if(dMode==="ad-to-bs")convertDate()});
  bsIn.addEventListener("input",function(){if(dMode==="bs-to-ad"&&/^\d{4}-\d{1,2}-\d{1,2}$/.test(bsIn.value.trim()))convertDate()});
  $("copyDate").addEventListener("click",function(){var t=dRes.textContent.match(/\d{4}-\d{2}-\d{2}/);copyText(t?t[0]:"",$("copyDate"),"Copy date")});
  setDMode("ad-to-bs");
  enter.date=function(){
    ensure("date").then(function(){
      var b=new NepaliDate(new Date()).getBS();
      $("todayBs").textContent=b.year+"-"+p2(b.month+1)+"-"+p2(b.date)+" ("+b.date+" "+MONTHS[b.month]+")";
    }).catch(function(){$("todayBs").textContent="needs internet"});
  };
}

/* ---------- Land converter ---------- */
if($("landValue")){
  var LU={ropani:["Ropani",508.737],aana:["Aana",31.7960625],paisa:["Paisa",7.949015625],daam:["Daam",1.98725390625],bigha:["Bigha",6772.63],kattha:["Kattha",338.6315],dhur:["Dhur",16.931575],sqm:["Square metres",1],sqft:["Square feet",0.09290304]};
  var fmt=function(n,d){return new Intl.NumberFormat("en-US",{maximumFractionDigits:d}).format(n)};
  var landRes=$("landResult");
  var convertLand=function(){
    var v=num($("landValue")),f=$("landFrom").value,t=$("landTo").value;
    if($("landValue").value===""||!isFinite(v)||v<0){landRes.className="res err";landRes.replaceChildren(el("strong","Enter a valid non-negative area."));$("landAll").replaceChildren();return}
    var sqm=v*LU[f][1];
    landRes.className="res";
    landRes.replaceChildren(el("strong",fmt(v,6)+" "+LU[f][0]+" = "+fmt(sqm/LU[t][1],6)+" "+LU[t][0]),el("span","Equivalent area: "+fmt(sqm,3)+" square metres."));
    var g=$("landAll");g.replaceChildren();
    Object.keys(LU).forEach(function(k){var d=el("div");if(k===t)d.className="on";d.append(el("small",LU[k][0]),el("b",fmt(sqm/LU[k][1],6)));g.append(d)});
  };
  groupInput($("landValue"));$("landValue").addEventListener("input",convertLand);
  ["landFrom","landTo"].forEach(function(id){$(id).addEventListener("change",convertLand)});
  $("convertLandBtn").addEventListener("click",convertLand);
  $("swapLandBtn").addEventListener("click",function(){var a=$("landFrom"),b=$("landTo"),x=a.value;a.value=b.value;b.value=x;convertLand()});
  $("clearLandBtn").addEventListener("click",function(){$("landValue").value="";convertLand()});
  convertLand();
}

/* ---------- PDF tools ---------- */
if($("pdfMergeBtn")){
  var DLNOTE=window.KP_SPA?" This preview blocks downloads, so the file saves only on the hosted site.":"";
  var readPdf=function(file){
    if(!file)return Promise.reject(new Error("Please choose a PDF file."));
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))return Promise.reject(new Error("Please select a valid PDF file."));
    return file.arrayBuffer().then(function(b){return new Uint8Array(b)});
  };
  var savePdf=function(bytes,name){
    var url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"})),a=document.createElement("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);
  };
  var safeName=function(f){return f.name.replace(/\.pdf$/i,"")||"document"};
  var runTool=function(btn,status,task){
    $(btn).disabled=true;$(status).textContent="Working…";
    return ensure("pdf").then(task).catch(function(e){$(status).textContent=e&&e.message?e.message:"Could not process this PDF. Check that the file is valid and not password-protected."}).then(function(){$(btn).disabled=false});
  };
  var bindDrop=function(zone,input,onFiles){
    ["dragenter","dragover"].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.add("over")})});
    ["dragleave","drop"].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.remove("over")})});
    zone.addEventListener("drop",function(e){onFiles(Array.prototype.slice.call(e.dataTransfer.files))});
    input.addEventListener("change",function(){onFiles(Array.prototype.slice.call(input.files));});
  };
  // single-file tools: show the chosen name
  [["pdfExtractFile","pdfExtractDrop"],["pdfRotateFile","pdfRotateDrop"],["pdfCompressFile","pdfCompressDrop"]].forEach(function(p){
    var inp=$(p[0]),zone=$(p[1]);
    bindDrop(zone,inp,function(files){
      if(files.length&&inp.files!==files){try{var dt=new DataTransfer();dt.items.add(files[0]);inp.files=dt.files}catch(e){}}
      zone.querySelector(".fname").textContent=files.length?files[0].name:"";
    });
  });
  // merge list
  var mergeFiles=[];
  var renderMerge=function(){
    var ul=$("mergeList");ul.replaceChildren();
    mergeFiles.forEach(function(f,i){
      var li=el("li");li.append(el("span",(i+1)+". "+f.name));
      [["↑","up"],["↓","down"],["✕","del"]].forEach(function(b){var x=el("button",b[0]);x.type="button";x.setAttribute("data-act",b[1]);x.setAttribute("data-i",i);x.setAttribute("aria-label",({up:"Move up",down:"Move down",del:"Remove"})[b[1]]+" "+f.name);li.append(x)});
      ul.append(li);
    });
  };
  bindDrop($("pdfMergeDrop"),$("pdfMergeFiles"),function(files){
    files.forEach(function(f){mergeFiles.push(f)});$("pdfMergeFiles").value="";renderMerge();
  });
  $("mergeList").addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    var i=+b.getAttribute("data-i"),a=b.getAttribute("data-act");
    if(a==="del")mergeFiles.splice(i,1);
    else if(a==="up"&&i>0){var t=mergeFiles[i];mergeFiles[i]=mergeFiles[i-1];mergeFiles[i-1]=t}
    else if(a==="down"&&i<mergeFiles.length-1){var t2=mergeFiles[i];mergeFiles[i]=mergeFiles[i+1];mergeFiles[i+1]=t2}
    renderMerge();
  });
  $("pdfMergeBtn").addEventListener("click",function(){runTool("pdfMergeBtn","pdfMergeStatus",async function(){
    if(mergeFiles.length<2)throw new Error("Add at least two PDF files.");
    var merged=await PDFLib.PDFDocument.create();
    for(var f of mergeFiles){
      var src=await PDFLib.PDFDocument.load(await readPdf(f));
      var pages=await merged.copyPages(src,src.getPageIndices());pages.forEach(function(p){merged.addPage(p)});
    }
    savePdf(await merged.save({useObjectStreams:true}),"merged-document.pdf");
    $("pdfMergeStatus").textContent="Merged "+mergeFiles.length+" files successfully."+DLNOTE;
  })});
  var parseRanges=function(value,count){
    if(!value.trim())throw new Error("Enter the page numbers or ranges to extract.");
    var sel=new Set();
    value.split(",").forEach(function(part){
      var item=part.trim(),m=item.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if(!m)throw new Error("Invalid page range: "+item);
      var s=+m[1],e=+(m[2]||m[1]);
      if(s<1||e<s||e>count)throw new Error("Page range "+item+" is outside 1-"+count+".");
      for(var n=s;n<=e;n++)sel.add(n-1);
    });
    return Array.from(sel).sort(function(a,b){return a-b});
  };
  $("pdfExtractBtn").addEventListener("click",function(){runTool("pdfExtractBtn","pdfExtractStatus",async function(){
    var file=$("pdfExtractFile").files[0],src=await PDFLib.PDFDocument.load(await readPdf(file));
    var idx=parseRanges($("pdfPageRange").value,src.getPageCount()),out=await PDFLib.PDFDocument.create();
    (await out.copyPages(src,idx)).forEach(function(p){out.addPage(p)});
    savePdf(await out.save({useObjectStreams:true}),safeName(file)+"-extracted.pdf");
    $("pdfExtractStatus").textContent="Extracted "+idx.length+" page(s)."+DLNOTE;
  })});
  $("pdfRotateBtn").addEventListener("click",function(){runTool("pdfRotateBtn","pdfRotateStatus",async function(){
    var file=$("pdfRotateFile").files[0],doc=await PDFLib.PDFDocument.load(await readPdf(file)),angle=Number($("pdfRotateAngle").value);
    doc.getPages().forEach(function(p){p.setRotation(PDFLib.degrees((p.getRotation().angle+angle)%360))});
    savePdf(await doc.save({useObjectStreams:true}),safeName(file)+"-rotated.pdf");
    $("pdfRotateStatus").textContent="Rotated "+doc.getPageCount()+" page(s)."+DLNOTE;
  })});
  var canvasJpeg=function(c,q){return new Promise(function(res,rej){c.toBlob(function(b){b?b.arrayBuffer().then(res).catch(rej):rej(new Error("Could not encode a PDF page."))},"image/jpeg",q)})};
  $("pdfCompressBtn").addEventListener("click",function(){runTool("pdfCompressBtn","pdfCompressStatus",async function(){
    if(!window.pdfjsLib)throw new Error("PDF rendering library did not load. Check your internet connection and reload the page.");
    var file=$("pdfCompressFile").files[0],data=await readPdf(file),target=Number($("pdfTargetSize").value);
    if(!isFinite(target)||target<0.1||target>50)throw new Error("Enter a target between 0.1 and 50 MB.");
    var pdf=await pdfjsLib.getDocument({data:data}).promise,limit=target*1024*1024;
    var tries=[{scale:1.25,quality:.72},{scale:1.05,quality:.58},{scale:.85,quality:.44},{scale:.7,quality:.32}],best=null,bestSize=Infinity;
    for(var ti=0;ti<tries.length;ti++){
      var st=tries[ti],out=await PDFLib.PDFDocument.create();
      for(var n=1;n<=pdf.numPages;n++){
        $("pdfCompressStatus").textContent="Optimizing page "+n+" of "+pdf.numPages+"…";
        $("pdfCompressBar").style.width=Math.round(((ti+(n-1)/pdf.numPages)/tries.length)*100)+"%";
        var page=await pdf.getPage(n),orig=page.getViewport({scale:1}),vp=page.getViewport({scale:st.scale}),cv=document.createElement("canvas");
        cv.width=Math.max(1,Math.floor(vp.width));cv.height=Math.max(1,Math.floor(vp.height));
        var ctx=cv.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);
        await page.render({canvasContext:ctx,viewport:vp}).promise;
        var img=await out.embedJpg(await canvasJpeg(cv,st.quality));
        out.addPage([orig.width,orig.height]).drawImage(img,{x:0,y:0,width:orig.width,height:orig.height});
        cv.width=1;cv.height=1;
      }
      var bytes=await out.save({useObjectStreams:true});
      if(bytes.length<bestSize){best=bytes;bestSize=bytes.length}
      if(bytes.length<=limit)break;
    }
    $("pdfCompressBar").style.width="100%";
    if(!best)throw new Error("Compression failed.");
    savePdf(best,safeName(file)+"-compressed.pdf");
    var actual=(bestSize/1048576).toFixed(2);
    $("pdfCompressStatus").textContent=(bestSize<=limit?"Done: "+actual+" MB (target "+target+" MB). Pages are image-based after compression.":"Best result: "+actual+" MB; target "+target+" MB could not be reached.")+DLNOTE;
    await pdf.destroy();
  })});
  enter.pdf=function(){ensure("pdf").catch(function(){})};
}


/* ---------- Gold rate calculator ---------- */
if($("rateHall")){
  var TOLA=11.664,saved=false,store=null;
  try{store=JSON.parse(localStorage.getItem("kp-gold")||"null")}catch(e){}
  if(store&&store.h){$("rateHall").value=store.h;$("rateTaj").value=store.t;$("rateSil").value=store.s;saved=true}
  ["rateHall","rateTaj","rateSil","gWeight","budget"].forEach(function(id){groupInput($(id))});
  var NAMES={h:"Gold, hallmark",t:"Gold, tajabi",s:"Silver"};
  var rateOf=function(k){return num($({h:"rateHall",t:"rateTaj",s:"rateSil"}[k]))};
  var fm=function(n,d){return new Intl.NumberFormat("en-US",{maximumFractionDigits:d==null?0:d}).format(n)};
  var goldCalc=function(){
    var k=$("gMetal").value,r=rateOf(k),w=num($("gWeight")),u=$("gUnit").value;
    var mk=Number($("gMakeP").value)||0,tx=Number($("gTaxP").value)||0;
    var rows="";["h","t","s"].forEach(function(m){var x=rateOf(m);rows+="<tr><td>"+NAMES[m]+"</td><td>"+(x>0?fm(x):"-")+"</td><td>"+(x>0?fm(x/TOLA*10,0):"-")+"</td><td>"+(x>0?fm(x/TOLA,1):"-")+"</td></tr>"});
    $("rateRows").innerHTML=rows;
    $("gLabel").textContent=NAMES[k]+" value";
    if(!(r>0)||!isFinite(w)||w<0){
      $("gTotal").textContent="Enter valid values";["gWeightOut","gBase","gMake","gTax"].forEach(function(id){$(id).textContent="-"});
      $("budgetOut").className="res err";$("budgetOut").replaceChildren(el("strong","Enter a rate first"));return;
    }
    var grams=w*({tola:TOLA,gram:1,g10:10})[u],tolas=grams/TOLA;
    var base=tolas*r,make=base*mk/100,tax=(base+make)*tx/100;
    $("gTotal").textContent="NPR "+fm(base+make+tax);
    $("gWeightOut").textContent=fm(tolas,3)+" tola · "+fm(grams,2)+" g";
    $("gBase").textContent="NPR "+fm(base);$("gMake").textContent="NPR "+fm(make);$("gTax").textContent="NPR "+fm(tax);
    var b=num($("budget")),bo=$("budgetOut");
    if(isFinite(b)&&b>0){
      var bt=b/r;bo.className="res";
      bo.replaceChildren(el("strong",fm(bt,3)+" tola"),el("span","About "+fm(bt*TOLA,2)+" grams of "+NAMES[k].toLowerCase()+" at NPR "+fm(r)+" per tola, before making charges and tax."));
    }else{bo.className="res err";bo.replaceChildren(el("strong","Enter a budget"))}
  };
  var onRate=function(){
    saved=true;$("rateBadge").textContent="Your rates";
    try{localStorage.setItem("kp-gold",JSON.stringify({h:$("rateHall").value,t:$("rateTaj").value,s:$("rateSil").value}))}catch(e){}
    goldCalc();
  };
  ["rateHall","rateTaj","rateSil"].forEach(function(id){$(id).addEventListener("input",onRate)});
  ["gMetal","gUnit","gWeight","gMakeP","gTaxP","budget"].forEach(function(id){$(id).addEventListener("input",goldCalc);$(id).addEventListener("change",goldCalc)});
  if(saved)$("rateBadge").textContent="Your rates";
  goldCalc();
}


/* ---------- Bank QR generator ---------- */
if($("qrCanvas")){
  var BANKS=[
      // Class A: Commercial Banks
      { group: "Class A — Commercial Banks", name: "Nabil Bank Limited", swift: "NARBNPKA", nchl: "0901", colorFrom: "#047857", colorTo: "#065f46" },
      { group: "Class A — Commercial Banks", name: "Global IME Bank Limited", swift: "GLBBNPKA", nchl: "1901", colorFrom: "#b91c1c", colorTo: "#1e3a8a" },
      { group: "Class A — Commercial Banks", name: "NIC Asia Bank Limited", swift: "NICENPKA", nchl: "1601", colorFrom: "#dc2626", colorTo: "#991b1b" },
      { group: "Class A — Commercial Banks", name: "Nepal Investment Mega Bank Limited", swift: "NIBLNPKT", nchl: "0401", colorFrom: "#1d4ed8", colorTo: "#1e3a8a" },
      { group: "Class A — Commercial Banks", name: "Siddhartha Bank Limited", swift: "SIDDNPKA", nchl: "1801", colorFrom: "#d97706", colorTo: "#92400e" },
      { group: "Class A — Commercial Banks", name: "Laxmi Sunrise Bank Limited", swift: "LXBLNPKA", nchl: "1401", colorFrom: "#ea580c", colorTo: "#7c2d12" },
      { group: "Class A — Commercial Banks", name: "Sanima Bank Limited", swift: "SNMANPKA", nchl: "2201", colorFrom: "#0369a1", colorTo: "#0c4a6e" },
      { group: "Class A — Commercial Banks", name: "Himalayan Bank Limited", swift: "HIMANPKA", nchl: "0701", colorFrom: "#1e40af", colorTo: "#172554" },
      { group: "Class A — Commercial Banks", name: "Everest Bank Limited", swift: "EVBLNPKA", nchl: "1001", colorFrom: "#b91c1c", colorTo: "#7f1d1d" },
      { group: "Class A — Commercial Banks", name: "Kumari Bank Limited", swift: "KMBLNPKA", nchl: "1301", colorFrom: "#0284c7", colorTo: "#075985" },
      { group: "Class A — Commercial Banks", name: "Prime Commercial Bank Limited", swift: "PCBLNPKA", nchl: "2401", colorFrom: "#1d4ed8", colorTo: "#1e40af" },
      { group: "Class A — Commercial Banks", name: "Prabhu Bank Limited", swift: "PRVUNPKA", nchl: "2701", colorFrom: "#dc2626", colorTo: "#7f1d1d" },
      { group: "Class A — Commercial Banks", name: "Citizens Bank International Limited", swift: "CTZNNPKA", nchl: "2301", colorFrom: "#0d9488", colorTo: "#115e59" },
      { group: "Class A — Commercial Banks", name: "NMB Bank Limited", swift: "NMBBNPKA", nchl: "2601", colorFrom: "#0369a1", colorTo: "#1e3a8a" },
      { group: "Class A — Commercial Banks", name: "Machhapuchchhre Bank Limited", swift: "MBLNNPKA", nchl: "1201", colorFrom: "#1e40af", colorTo: "#0f172a" },
      { group: "Class A — Commercial Banks", name: "Nepal SBI Bank Limited", swift: "NSBINPKA", nchl: "0801", colorFrom: "#1d4ed8", colorTo: "#1e3a8a" },
      { group: "Class A — Commercial Banks", name: "Standard Chartered Bank Nepal Limited", swift: "SCBLNPKA", nchl: "0601", colorFrom: "#047857", colorTo: "#1d4ed8" },
      { group: "Class A — Commercial Banks", name: "Rastriya Banijya Bank Limited", swift: "RBBANPKA", nchl: "0201", colorFrom: "#1e3a8a", colorTo: "#0f172a" },
      { group: "Class A — Commercial Banks", name: "Nepal Bank Limited", swift: "NEBLNPKA", nchl: "0101", colorFrom: "#b91c1c", colorTo: "#1e3a8a" },
      { group: "Class A — Commercial Banks", name: "Agricultural Development Bank Limited", swift: "ADBLNPKA", nchl: "0301", colorFrom: "#15803d", colorTo: "#14532d" },

      // Class B: Development Banks
      { group: "Class B — Development Banks", name: "Muktinath Bikas Bank Limited", swift: "MNBBNPKA", nchl: "5401", colorFrom: "#0369a1", colorTo: "#0c4a6e" },
      { group: "Class B — Development Banks", name: "Garima Bikas Bank Limited", swift: "GBBLNPKA", nchl: "5901", colorFrom: "#1d4ed8", colorTo: "#1e3a8a" },
      { group: "Class B — Development Banks", name: "Kamana Sewa Bikas Bank Limited", swift: "KSBBNPKA", nchl: "6001", colorFrom: "#047857", colorTo: "#064e3b" },
      { group: "Class B — Development Banks", name: "Jyoti Bikas Bank Limited", swift: "JBBLNPKA", nchl: "5601", colorFrom: "#b91c1c", colorTo: "#7f1d1d" },
      { group: "Class B — Development Banks", name: "Shine Resunga Development Bank Limited", swift: "SRDBNPKA", nchl: "5801", colorFrom: "#0284c7", colorTo: "#075985" },
      { group: "Class B — Development Banks", name: "Mahalaxmi Bikas Bank Limited", swift: "MLBBNPKA", nchl: "5201", colorFrom: "#b91c1c", colorTo: "#991b1b" },
      { group: "Class B — Development Banks", name: "Lumbini Bikas Bank Limited", swift: "LBBLNPKA", nchl: "5501", colorFrom: "#0d9488", colorTo: "#115e59" },
      { group: "Class B — Development Banks", name: "Shangri-la Development Bank Limited", swift: "SADBNPKA", nchl: "5701", colorFrom: "#1e40af", colorTo: "#172554" },

      // Class C: Finance Companies
      { group: "Class C — Finance Companies", name: "ICFC Finance Limited", swift: "ICFCNPKA", nchl: "7501", colorFrom: "#1e3a8a", colorTo: "#0f172a" },
      { group: "Class C — Finance Companies", name: "Manjushree Finance Limited", swift: "MJFLNPKA", nchl: "7601", colorFrom: "#047857", colorTo: "#065f46" },
      { group: "Class C — Finance Companies", name: "Goodwill Finance Limited", swift: "GWFLNPKA", nchl: "7101", colorFrom: "#0369a1", colorTo: "#0c4a6e" },
      { group: "Class C — Finance Companies", name: "Pokhara Finance Limited", swift: "PKFLNPKA", nchl: "7301", colorFrom: "#1d4ed8", colorTo: "#1e40af" },
      { group: "Class C — Finance Companies", name: "Reliance Finance Limited", swift: "RLFLNPKA", nchl: "7701", colorFrom: "#b91c1c", colorTo: "#7f1d1d" }
    ];
  var qMode="fonepay_json",qOk=false;
  var qBank=$("bankSelect"),qGroups={};
  BANKS.forEach(function(b,i){
    if(!qGroups[b.group]){var g=document.createElement("optgroup");g.label=b.group;qGroups[b.group]=g;qBank.appendChild(g)}
    var o=document.createElement("option");o.value=i;o.textContent=b.name+" ("+b.swift+")";qGroups[b.group].appendChild(o);
  });
  var crc16=function(str){
    var c=0xFFFF;
    for(var i=0;i<str.length;i++){c^=(str.charCodeAt(i)&0xFF)<<8;for(var k=0;k<8;k++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}
    return c.toString(16).toUpperCase().padStart(4,"0");
  };
  window.__kpCrc=crc16;
  var tlv=function(t,v){v=String(v);var l=String(v.length);return t+(l.length<2?"0"+l:l)+v};
  var ascii=function(s){return /^[\x20-\x7E]*$/.test(s)};
  var cleanNo=function(){return $("accNo").value.replace(/[\s\-]/g,"")};
  var nameVal=function(){var n=$("accName").value.trim();return $("upTog").checked?n.toUpperCase():n};
  var maskNo=function(n){if(!n)return "00000000000000";if(!$("maskTog").checked||n.length<=6)return n;return n.slice(0,3)+new Array(n.length-5).join("•")+n.slice(-3)};
  var buildQ=function(bank,name,no){
    if(qMode==="fonepay_json")return JSON.stringify({accountNumber:no||"00000000000000",accountName:name||"ACCOUNT HOLDER NAME",bankCode:bank.swift});
    var mName=(name||"ACCOUNT HOLDER").slice(0,25),city=($("mCity").value.trim().toUpperCase()||"KATHMANDU").slice(0,15);
    if(!ascii(mName+city+no))throw new Error("The EMV format accepts English letters, digits and common symbols only.");
    var amt=parseFloat($("fixedAmt").value.replace(/,/g,"")),has=isFinite(amt)&&amt>0;
    var t26=tlv("00","np.gov.nrb")+tlv("01",bank.swift)+tlv("02",no||"00000000000000");
    var raw=tlv("00","01")+tlv("01",has?"12":"11")+tlv("26",t26)+tlv("52","0000")+tlv("53","524")+(has?tlv("54",amt.toFixed(2)):"")+tlv("58","NP")+tlv("59",mName)+tlv("60",city)+"6304";
    return raw+crc16(raw);
  };
  /* draw a QR with whole-pixel modules and a 4-module quiet zone; returns a canvas */
  var qrCanvasFor=function(text,target){
    var q=new KPQRLib.QRCode(0,KPQRLib.ECL.M);q.addData(text);q.make();
    var n=q.getModuleCount(),cell=Math.max(2,Math.floor(target/(n+8))),size=cell*(n+8),cv=document.createElement("canvas");
    cv.width=size;cv.height=size;var ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);ctx.fillStyle="#0f172a";
    for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))ctx.fillRect((c+4)*cell,(r+4)*cell,cell,cell);
    return cv;
  };
  var curText="";
  var qrUpdate=function(){
    var bank=BANKS[qBank.value]||BANKS[0],name=nameVal(),no=cleanNo();
    $("dispSwift").textContent=bank.swift;$("dispNchl").textContent=bank.nchl;
    $("qHead").style.background="linear-gradient(135deg,"+bank.colorFrom+","+bank.colorTo+")";
    $("qBadge").textContent=bank.swift;$("qBank").textContent=bank.name;
    $("qName").textContent=name||"ACCOUNT HOLDER NAME";$("qNo").textContent=maskNo(no);
    var amt=parseFloat($("fixedAmt").value.replace(/,/g,""));
    if(qMode==="nepalqr_emv"&&isFinite(amt)&&amt>0){$("qAmt").hidden=false;$("qAmtVal").textContent=new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(amt)}else $("qAmt").hidden=true;
    try{
      curText=buildQ(bank,name,no);
      $("payloadPreview").textContent=curText;
      var cv=qrCanvasFor(curText,440),dst=$("qrCanvas");dst.width=cv.width;dst.height=cv.height;dst.getContext("2d").drawImage(cv,0,0);
      qOk=!!(name&&no);
      $("qrErr").textContent=qOk?"":"The preview uses sample data. Enter the account holder name and account number to enable downloads.";
    }catch(e){qOk=false;$("qrErr").textContent=e.message||"Could not create the QR code."}
    ["dlCard","dlPlain","copyPayload"].forEach(function(id){$(id).disabled=!qOk});
  };
  var setQ=function(m){
    qMode=m;var e=m==="nepalqr_emv";
    $("modeJson").setAttribute("aria-pressed",String(!e));$("modeEmv").setAttribute("aria-pressed",String(e));
    $("emvOpts").hidden=!e;qrUpdate();
  };
  $("modeJson").addEventListener("click",function(){setQ("fonepay_json")});
  $("modeEmv").addEventListener("click",function(){setQ("nepalqr_emv")});
  groupInput($("fixedAmt"));
  ["bankSelect","accName","accNo","fixedAmt","mCity","maskTog","upTog"].forEach(function(id){$(id).addEventListener("input",qrUpdate);$(id).addEventListener("change",qrUpdate)});
  $("copyPayload").addEventListener("click",function(){copyText(curText,$("copyPayload"),"Copy payload")});
  var DLQ=window.KP_SPA?" This preview blocks downloads, so the file saves only on the hosted site.":"";
  var saveCanvas=function(cv,name){
    var a=document.createElement("a");a.download=name;a.href=cv.toDataURL("image/png");document.body.appendChild(a);a.click();a.remove();
    $("qrStatus").textContent="Image saved."+DLQ;
  };
  $("dlPlain").addEventListener("click",function(){
    if(!qOk)return;var bank=BANKS[qBank.value]||BANKS[0],q=qrCanvasFor(curText,600);
    saveCanvas(q,bank.swift+"_QR.png");
  });
  $("dlCard").addEventListener("click",function(){
    if(!qOk)return;
    var bank=BANKS[qBank.value]||BANKS[0],name=nameVal(),no=cleanNo(),W=720,H=920,cv=document.createElement("canvas");
    cv.width=W;cv.height=H;var ctx=cv.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
    var g=ctx.createLinearGradient(0,0,W,175);g.addColorStop(0,bank.colorFrom);g.addColorStop(1,bank.colorTo);ctx.fillStyle=g;ctx.fillRect(0,0,W,175);
    var F="Manrope, Segoe UI, Arial, sans-serif";
    ctx.fillStyle="rgba(255,255,255,.85)";ctx.font="bold 20px "+F;ctx.textAlign="left";ctx.fillText("SCAN TO PAY · NEPAL",44,58);ctx.textAlign="right";ctx.fillText(bank.swift,W-44,58);
    ctx.fillStyle="#fff";ctx.font="800 32px "+F;ctx.textAlign="left";ctx.fillText(bank.name,44,118,W-88);
    var q=qrCanvasFor(curText,440),qx=Math.round((W-q.width)/2),qy=215;
    ctx.strokeStyle="#e2e8f0";ctx.lineWidth=3;ctx.strokeRect(qx-12,qy-12,q.width+24,q.height+24);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(q,qx,qy);
    ctx.fillStyle="#0f172a";ctx.font="800 30px "+F;ctx.textAlign="center";ctx.fillText(name,W/2,745,W-80);
    ctx.fillStyle="#475569";ctx.font="600 26px 'JetBrains Mono', monospace";ctx.fillText(maskNo(no),W/2,795,W-80);
    ctx.strokeStyle="#f1f5f9";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,845);ctx.lineTo(W-60,845);ctx.stroke();
    ctx.fillStyle="#94a3b8";ctx.font="600 20px "+F;ctx.fillText("Mobile Banking  ·  Fonepay  ·  ConnectIPS",W/2,885);
    saveCanvas(cv,bank.swift+"_"+(name||"BankQR").replace(/\s+/g,"_")+".png");
  });
  /* verifier */
  LIBS.jsqr=[["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"]];
  $("qrFile").addEventListener("change",function(){
    var f=$("qrFile").files[0];if(!f)return;
    $("qrDrop").querySelector(".fname").textContent=f.name;$("decBox").hidden=true;$("decErr").hidden=true;
    var rd=new FileReader();
    rd.onload=function(ev){
      var img=new Image();
      img.onload=function(){
        var c=document.createElement("canvas");c.width=img.width;c.height=img.height;var x=c.getContext("2d");x.drawImage(img,0,0);
        var d=x.getImageData(0,0,c.width,c.height);
        ensure("jsqr").then(function(){
          var r=jsQR(d.data,d.width,d.height);
          if(r){$("decText").textContent=r.data;$("decBox").hidden=false}
          else{$("decErr").replaceChildren(el("strong","No QR code found"),el("span","Try cropping closer to the QR square."));$("decErr").hidden=false}
        }).catch(function(e){$("decErr").replaceChildren(el("strong","Could not decode"),el("span",e.message));$("decErr").hidden=false});
      };
      img.onerror=function(){$("decErr").replaceChildren(el("strong","Not a readable image"));$("decErr").hidden=false};
      img.src=ev.target.result;
    };
    rd.readAsDataURL(f);
  });
  $("qrDrop").addEventListener("dragover",function(e){e.preventDefault();$("qrDrop").classList.add("over")});
  $("qrDrop").addEventListener("dragleave",function(){$("qrDrop").classList.remove("over")});
  $("qrDrop").addEventListener("drop",function(e){
    e.preventDefault();$("qrDrop").classList.remove("over");
    try{if(e.dataTransfer.files.length){$("qrFile").files=e.dataTransfer.files;$("qrFile").dispatchEvent(new Event("change"))}}catch(x){}
  });
  qBank.value="0";qrUpdate();
}

/* run the first page's hook (core ran before these were registered) */
(function(){
  var cur=window.KP_SPA?(location.hash||"#home").slice(1):document.body.getAttribute("data-page");
  if(enter[cur])enter[cur]();
})();

})();
