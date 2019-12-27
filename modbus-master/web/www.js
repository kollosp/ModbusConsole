const express = require('express')
const bodyParser = require('body-parser')
const ModbusRTU = require("modbus-serial");
const app = express()
const path = require('path');
const port = 3000

module.exports = (guiMode, portConfig) => {

	//if giu is enable
	if(guiMode == true) {
		app.use(bodyParser.json());       // to support JSON-encoded bodies
		app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
			extended: true
		}));

		app.use('/', express.static(__dirname + '/'))
		app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
		app.listen(port, () => console.log(`Example app listening on port ${port}!`))

		app.post('/read', (req, res) => {
			read(req.body.start, req.body.dataCount, (data) => {
				res.send(data)
			})
		})

		app.post('/write', (req, res) => {
			write(req.body.start, req.body.data, () => {
				console.log("reading after writing:", req.body.data.length)
				read(req.body.start, req.body.data.length, (data) => {
					res.send(data)
				})
			})
		})
	}

	let client = new ModbusRTU()

	const initModbus = function(dev, modbusDev, baudRate, parity, callback){

		if(client.isOpen)	{
			callback(client)
			return
		}

		client.connectRTUBuffered(dev, { baudRate: baudRate, parity: parity })
			.then(() => {client.setID(modbusDev)})
			.then(() => {callback(client)})
			.catch((e) => console.error(e))
	}

	const readArrayOfQuestions = function(client, questions, ret, callback, i=0){
		if(i == questions.length){
			callback(ret)
			return
		}

		client.readHoldingRegisters(questions[i].start, questions[i].dataCount)
			.then((d) => {

				for(let k of d.data)
					ret.push(k)
				readArrayOfQuestions(client, questions, ret, callback, ++i)
			})
			.catch((e) => console.error(e))

		/*console.log(questions[i], i);
		for(let j=0;j<questions[i].dataCount;++j){
			ret.push(Math.floor((Math.random() * 1000) + 1))
		}

		readArrayOfQuestions(client, questions, ret, callback, ++i)*/
	}

	const read = function(start, dataCount, callback, maxFrameLen = 12) {
		let ret = []


		let questions = [] //{start: 0, dataCount: [1-12]}

		//cat log query to smaller parts
		let nextStart = start
		while(dataCount > 0){
			let d = 0
			if(dataCount >= maxFrameLen)
				d = maxFrameLen
			else d = dataCount

			//crate sub query
			questions.push({
				start: nextStart,
				dataCount: d
			})

			nextStart = nextStart + maxFrameLen
			dataCount = dataCount - maxFrameLen
		}

		//console.log(questions)

		initModbus(portConfig.dev, portConfig.modbusDev, portConfig.baudRate, portConfig.parity, (client) => {
			readArrayOfQuestions(client, questions, [], (d) => {
				console.log(d)
				callback(d)
			})
		})
	}

	const write = function(start, data, callback) {
		initModbus(portConfig.dev, portConfig.modbusDev, portConfig.baudRate, portConfig.parity, (client) => {


			for(let k in data)
				if(typeof data[k] ==  "string")
					data[k] = parseInt(data[k])

			let prom
			//console.log(data)
			if(data.length == 1){
				//use modbus function 6 (write register)
				prom = client.writeRegister(start, data[0])
			}
			else{
				//use modbus function 16 (write multiple registers)
				prom = client.writeRegisters(start, data)
			}

			prom.then((d) => {
				console.log("written:", d)
				callback()
			})
			.catch((e) => console.error(e))
		})
	}

	return {read, write}
}
