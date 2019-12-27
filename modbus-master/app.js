
let port = require("./web/www")

console.log(" # Argv:", process.argv.join(', '))


const portConfig = {
    dev: '/dev/ttyUSB1',
    parity: 'none',
    baudRate: 9600,
    modbusDev: 1
}


//start in console mode
if(process.argv.indexOf('console') != -1){
    console.log(' # Running in console mode')
    let {read, write} = port(false, portConfig)


    setInterval(() => {
        process.stdout.write('.')

        try {
            read(0x100, 12, (d) => {
                process.stdout.write(JSON.stringify(d))
            })
        }catch (e) {
            console.error(e)
        }
    }, 500)

}
else{
    console.log(' # Running in gui mode')

    //run web service
    port(true, portConfig)
}
