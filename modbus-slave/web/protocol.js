let protocol = {
    crc16: function(buffer, length) {
        let crc = 0xFFFF;
        let odd;

        for (var i = 0; i < length; i++) {
            crc = crc ^ buffer[i];

            for (var j = 0; j < 8; j++) {
                odd = crc & 0x0001;
                crc = crc >> 1;
                if (odd) {
                    crc = crc ^ 0xA001;
                }
            }
        }

        return crc;
    },

    /**
     * Function build modbus response frame
     * @param device modbus device address
     * @param functionCode modbus function code
     * @param data an object or array, it depends on functionCode
     * @returns {bufffer}
     */
    build: function(device, functionCode, data) {
        switch (functionCode) {
            case 3: return protocol.build0x3(device, data)
            case 6: return protocol.build0x6(device, data)
            case 0x10: return protocol.build0x10(device, data)
            default: throw(Error("Modbus protocol syntax: Unknown function " + func))
        }
    },

    /**
     *
     * @param device
     * @param data
     * @returns {buffer}
     */
    build0x6: function(device, data) { return Buffer.alloc(10) },

    build0x10: function(device, data) {
        let buffer = Buffer.alloc(8)
        let offset = 0
        offset = buffer.writeUInt8(device, offset)
        offset = buffer.writeUInt8(0x10, offset)

        //address and register count
        for(let i in data)
            offset = buffer.writeUInt16BE(data[i], offset)

        buffer.writeUInt16LE(protocol.crc16(buffer.slice(0, -2),buffer.length - 2), offset)
        return buffer
    },

    /**
     * Function builds 0x3 modbus response frame
     * @param device modbus device address
     * @param data array contains following cells
     * @returns {bufffer} buffer prepared to send
     */
    build0x3: function(device, data) {
        //device and functionCode + datalength + data + crc16
        let buffer = Buffer.alloc(2+1+data.length*2+2)
        let offset = 0
        offset = buffer.writeUInt8(device, offset)
        offset = buffer.writeUInt8(0x3, offset)

        offset = buffer.writeUInt8(data.length*2, offset)

        for(let i in data) {
            offset = buffer.writeUInt16BE(data[i], offset)
        }

        buffer.writeUInt16LE(protocol.crc16(buffer.slice(0, -2),buffer.length - 2), offset)
        return buffer
    },

    parse: function(buffer) {
        let device = buffer[0]
        let func = buffer[1]
        let d = {}

        switch(func) {
            case 3: d = protocol.parse0x3(buffer); break
            case 6: d = protocol.parse0x6(buffer); break
            case 0x10: d = protocol.parse0x10(buffer); break
            default: throw(Error("Modbus protocol syntax: Unknown function " + func))
        }

        d.functionCode = func
        d.device = device
        return d
    },

    parse0x3: function (buffer) {
        return {
            address: buffer[2]*0x100 + buffer[3],
            count: buffer[4]*0x100 + buffer[5]
        }
    },

    parse0x6: function (buffer) {

    },

    parse0x10: function (buffer) {
        let address = buffer[2]*0x100 + buffer[3]
        let registers = buffer[4]*0x100 + buffer[5]
        let bytes = buffer[6]
        let values = []

        for(let i=7;i<buffer.length-2;i+=2)
            values.push(buffer[i]*0x100 + buffer[i+1])

        return {
            address: address,
            registers: registers,
            bytes: bytes,
            values: values
        }
    }
}

module.exports = protocol