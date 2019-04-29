const SerialPort = require('serialport')
const split = require('split2')
const grblSP = new SerialPort('COM4', { baudRate: 9600 }, () => {
  console.log("connected to grbl")
  //sp.pipe(split()).pipe(through(onLine))
  //<Alarm,MPos:0.000,0.000,0.000,WPos:199.000,199.000,0.999>
})
const sensorSP = new SerialPort('COM5', { baudRate: 115200 }, () => {
  console.log("connected to load cell sensor")
  setTimeout(async function () {
    var sensorOutputObj = await readSensor()
    console.log(sensorOutputObj)
    var grblOutputObj = await readMachine()
    console.log(grblOutputObj)
  }, 2000);
})
const sensorSPread = sensorSP.pipe(split())
async function readSensor(){
  var value = new Promise((resolve,reject)=>{
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
      //fn(sensorData)
      resolve(sensorData)
    })
  })
  sensorSP.write("\n")

  return value
}
//combine x,y,z,d
