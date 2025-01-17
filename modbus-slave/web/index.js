var modbus = new Vue({
	el: '#modbus',
	data: {
		status: true, //server is disable or enable
		modbusData: {},
		busy: false
	},

	methods:{
		displayHex(obj){
			return "0x" + parseInt(obj).toString(16)
		},

		load: function() {
			let self = this
			axios.post('/load').then(m => {
				self.modbusData = m.data
				self.busy = false
			}).catch(e => console.error(e))
		},

		format: function(value, separator = "<br>"){
			return value.toString() + separator + '[0x' + parseInt(value).toString(16) + ']'
		},

		loadStatus: function(){
			let self = this
			axios.post('/status').then(m => {
				self.status = m.data
			}).catch(e => console.error(e))
		},

		start: function(){
			let self = this
			axios.post('/start').then(m => {
				self.status = m.data
			}).catch(e => console.error(e))
		},

		stop: function(){
			let self = this
			axios.post('/stop').then(m => {
				self.status = m.data
			}).catch(e => console.error(e))
		},

		inputChanged: function(key) {
			text = document.getElementById('input' + key).value
			let value = parseInt(text)
			let m = this.modbusData[key]
			if(value >= m.min && value <= m.max) {
				this.modbusData[key].value = value

				axios.post('/update',{
					key: key,
					value: parseInt(m.value),
					max: parseInt(m.max),
					min: parseInt(m.min)
				}).then(m => this.modbusData[key] = m.data).catch(e => console.error(e))
			}
		},

		sliderChanged: function(key) {
			let m = this.modbusData[key]
			console.log(key, m)
			axios.post('/update',{
				key: key,
				value: parseInt(m.value),
				max: parseInt(m.max),
				min: parseInt(m.min)
			}).then(m => this.modbusData[key] = m.data).catch(e => console.error(e))
		}
	},

	computed: {

	},

	mounted: function(){
		this.load()
		let self = this
		setInterval(() => {
			if(self.busy == false){
				self.busy = true
				self.load()
			}
		}, 100)
		this.loadStatus()
	}
})