const express = require('express')
const bodyParser = require('body-parser')
const ModbusRTU = require("modbus-serial")
const Serial = require("serialport")
const app = express()
const path = require('path');
const port = 3100
let MAX_BUFFER_LENGTH = 256
const protocol = require('./protocol')
const fs = require('fs')

module.exports = function (serialConfig, database) {


	//if enable then server will be sending responses
	let enable = true

	app.use(bodyParser.json());       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		extended: true
	}));

	app.use((req, res, next) => {
		console.log(" #", req.method, req.url)
		next()
	})

	let server = null
	app.use('/', express.static(__dirname + '/'))


	app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))

	const createSerial = function () {
		let buffer = Buffer.alloc(0)


		//when all frame received
		const onDataReceived = function (data) {

			console.log(" # Server received (parsed):", data)

			if(enable == false) {
				console.log(" # Server is disabled, no response will be send")
				return
			}

			switch (data.functionCode) {
				case 3: response0x3(data); break;
				case 0x10: response0x10(data); break;
			}
		}

		//create on data event handler
		const onData = function (chunk) {
			buffer = Buffer.concat([buffer, chunk]);
			console.log(" # chunk received (raw):", chunk.toString('hex'))

			let bufferLength = buffer.length;
			if (bufferLength > MAX_BUFFER_LENGTH) {
				buffer = buffer.slice(-MAX_BUFFER_LENGTH);
				bufferLength = MAX_BUFFER_LENGTH;
			}

			for(let i=0;i<bufferLength;++i){
				let unitId = buffer[i]
				let command = buffer[i+1]



				break;

				try {
					let data = buffer
					buffer = data.slice(-offset);
					data = protocol.parse(data)
					onDataReceived()
				}catch(e) {
					//console.error(e)
					return
				}

			}


		}

		const response0x10 = function(data) {
			database.changed = false
			let response = []
			for(let i=0;i<data.values.length;++i){
				let key = 'v' + (parseInt(i)+data.address).toString(16)
				if(database.data[key] != data.values[i]) {
					database.changed = true
					database.data[key] = {value: data.values[i], max: 0xffff, min: 0}
				}

			}

			response.push(data.address)
			response.push(data.registers)

			data = protocol.build(data.device, data.functionCode, response)
			console.log("response:", data.toString('hex'))
			server.write(data)

			dbSave()
		}

		const response0x3 = function(data) {
			database.changed = false
			let response = []
			for(let i=0;i<data.count;++i){
				let key = 'v' + (parseInt(i)+data.address).toString(16)
				if(database.data[key] == undefined) {
					database.changed = true
					database.data[key] = {value: 0, max: 0xffff, min: 0}
				}

				response.push(database.data[key].value)
			}

			data = protocol.build(data.device, data.functionCode, response)
			console.log("response:", data.toString('hex'))

			server.write(data)
			dbSave()
		}

		const dbSave = function(){
			if(database.changed){
				console.log("saving")
				fs.writeFileSync(database.path, JSON.stringify(database.data, null, 4))
			}
		}

		const onError = function (e) {
			console.error(" # Server error:", e)
		}

		const openPort = function (err) {
			if (err) console.error(" # Server error:", err)
			else console.log(" # Server has been opened")
		}

		//if serial is opened close it
		if (server)
			delete server

		try {
			//create port
			server = new Serial(serialConfig.dev, serialConfig)
			server.on('data', onData)
			server.on('error', onError)

			server.open(openPort)
		} catch (e) {
			console.error(e)
		}
	}

	createSerial()

	app.post('/start', (req, res) => {
		enable = true
		res.send(enable)
	})

	app.post('/stop', (req, res) => {
		enable = false
		res.send(enable)
	})

	app.post('/status', (req, res) => {
		res.send(enable)
	})

	app.post('/load', (req, res) => {
		res.send(database.data)
	})

	app.post('/update', (req, res) => {
		console.log(req.body)

		database.data[req.body.key] = {
			value: req.body.value,
			max: req.body.max,
			min: req.body.min
		}

		fs.writeFileSync(database.path, JSON.stringify(database.data, null, 4))

		res.send(database.data[req.body.key])
	})


	app.listen(port, () => console.log(`Console app listening on port ${port}!`))
}