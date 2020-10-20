
//configurate
let serialConfig = {
    dev: '/dev/ttyUSB0',
    baudRate: 9600,
    parity: 'none',
    stopBits: 1,
    dataBits: 8,
    autoOpen: false
}

let device = 2

let database = {
    path: __dirname + "/db.json",
    data: {}
}

try{
    database.data = require(database.path)
}catch(e) {

}

//run
require('./web/www')(device, serialConfig, database)
