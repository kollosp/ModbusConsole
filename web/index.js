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

			//data has been found in table
			for(let i in this.modbusData){
				//console.log("this.modbusData", this.modbusData[i].start, addressGroup)
				if(this.modbusData[i].start == addressGroup){
					
					//if value has been changed
					if(this.modbusData[i].d[addressUnit] != value){
					
						//set value in table 
						Vue.set(this.modbusData[i].d, addressUnit,  value)
						
						//set status in table
						Vue.set(this.modbusData[i].s, addressUnit,  1) //set as new value
						
						//clear after 5 secs
						//setTimeout(() => Vue.set(this.modbusData[i].s, addressUnit,  0), 5000);
					}else{
						Vue.set(this.modbusData[i].s, addressUnit,  0) //set as new value
					}
					return
				}
			}			

			//insert at the beginnign
			if(this.modbusData[0].start > address){
				this.modbusData.splice(0,0,{ 
					start: addressGroup,
					d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				})
				this.modbusData[0].d[addressUnit] = value
				return
			
			}

			//insert in the center
			for(let i=0;i<this.modbusData.length-1;++i){
				if(this.modbusData[i].start < address && this.modbusData[i+1].start > address){
					this.modbusData.splice(i,0,{ 
						start: addressGroup,
						d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
						s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
					})
					Vue.set(this.modbusData[i+1].d, addressUnit, value)
					return
				}
			}

			//push back
			this.modbusData.push({ 
				start: addressGroup,
				d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
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

			if(values[values.length-1] == '')
				values.pop()

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

	computed: {
		funcionCode: function() {
			if(this.order.write.data.indexOf(',') > 0){
				let array = this.order.write.data.split(',')
				
				//pop empty element
				if(array[array.length-1] == '')
					array.pop()

				return "FC16, l: " + array.length.toString()
			}
			else
				return "FC6"
		}
	},

	mounted: function(){
		this.modbusData.push({
			start: 32,
			d: [1,2,3,5,8,9,6,25,4,8,5,4,2,3,5,4],
			s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		})

		this.modbusData.push({
			start: 1542,
			d: [1,2,3,5,8,9,6,25,4,8,5,4,2,3,5,4],
			s: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		})
	}
})