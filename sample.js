const SerialPort = require('serialport')
const split = require('split2')
const grblSP = new SerialPort('COM4', { baudRate: 9600 }, () => {
  console.log("connected to grbl")
  //sp.pipe(split()).pipe(through(onLine))
})
const sensorSP = new SerialPort('COM5', { baudRate: 115200 }, () => {
  console.log("connected to load cell sensor")
  setTimeout(function () {
    readSensor(function(o){
      console.log(o)
    })
  }, 2000);
})
const sensorSPread = sensorSP.pipe(split())
function readSensor(fn){
  sensorSP.write("\n")
  sensorSPread.once("data",function(dBuffer){
    //console.log(dBuffer.toString())
    var parts = dBuffer.toString().split(",").map((a)=>{
      return parseFloat(a.trim())
    })
    var sensorData = {
      left:parts[0],
      right:parts[1],
      load:parts[2]
    }
    fn(sensorData)
  })
}
//combine x,y,z,d
