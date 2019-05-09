var modbus = new Vue({
	el: '#modbus',
	data: {
		dev: {
			address: "1",
			bitrate: "9600",
			data: "8",
			parity: 'none',
			stopBits: "1"
		},

		order: {
			read: {
				startAdd: "0",
				dataCount: "1"
			},

			write: {
				startAdd: "0",
				data: "0"
			}
		},

		//modbusData will contain [{start: 0x165, d: []}, ..]
		//d max size is 16 because of display format
		modbusData: []
	},

	methods:{
		insertValueToArray: function(address, value){
			let addressUnit = address%16
			let addressGroup = address - addressUnit

			console.log(address, addressGroup, addressUnit, value);

			for(let i in this.modbusData){
				console.log("this.modbusData", this.modbusData[i].start, addressGroup)
				if(this.modbusData[i].start == addressGroup){
					console.log("found")
					Vue.set(this.modbusData[i].d, addressUnit,  value)
					console.log(this.modbusData[i].d[addressUnit])
					return
				}
			}			

			//insert at the beginnign
			if(this.modbusData[0].start > address){
				this.modbusData.splice(0,0,{ 
					start: addressGroup,
					d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
				})
				this.modbusData[0].d[addressUnit] = value
				return
			
			}

			//insert in the center
			for(let i=0;i<this.modbusData.length-1;++i){
				if(this.modbusData[i].start < address && this.modbusData[i+1].start > address){
					this.modbusData.splice(i,0,{ 
						start: addressGroup,
						d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
					})
					Vue.set(this.modbusData[i+1].d, addressUnit, value)
					return
				}
			}

			//push back
			this.modbusData.push({ 
				start: addressGroup,
				d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
			})
			Vue.set(this.modbusData[this.modbusData.length-1].d, addressUnit, value)
		},

		read: function(){

			let startAdd = parseInt(this.order.read.startAdd)
			let dataCount = parseInt(this.order.read.dataCount)			

			console.log("read", startAdd, dataCount)


			axios({
				method: 'post',
				url: '/read',

				data: {
					start: startAdd,
					dataCount: dataCount
				}
			}).
			then(function(res) {
				for(let i in res.data){
					console.log("i", i, res.data[i])
					modbus.insertValueToArray(startAdd + parseInt(i), res.data[i])
				}
			})
		},

		write: function(){

			let startAdd = parseInt(this.order.write.startAdd)
			
			let values = this.order.write.data.split(',')


			for(let i of values)
				i = parseInt(i)			

			console.log("write", startAdd, values)
			axios({
				method: 'post',
				url: '/write',

				data: {
					start: startAdd,
					data: values
				}
			}).
			then(function(res) {
				for(let i in res.data){
					console.log("i", i, res.data[i])
					modbus.insertValueToArray(startAdd + parseInt(i), res.data[i])
				}
			})
		},

		update: function(){

		},

		displayHex(obj){
			return "0x" + parseInt(obj).toString(16)
		}
	},

	mounted: function(){
		this.modbusData.push({
			start: 32,
			d: [1,2,3,5,8,9,6,25,4,8,5,4,2,3,5,4]
		})

		this.modbusData.push({
			start: 1542,
			d: [1,2,3,5,8,9,6,25,4,8,5,4,2,3,5,4]
		})
	}
})