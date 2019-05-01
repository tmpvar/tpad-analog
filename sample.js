const SerialPort = require('serialport')
const split = require('split2')
const gcodeLines = require('./gcode')
const through = require('through2')
const fs = require('fs')
const path = require('path')

const grblSP = new SerialPort('/dev/tty.usbmodem1411', { baudRate: 115200 }, (err) => {
  if (err) {
    console.log(err.message)
    process.exit(1)
  }

  console.log("connected to grbl")
})

const sensorSP = new SerialPort('/dev/tty.usbmodem1421', { baudRate: 115200 }, (err) => {
  if (err) {
    console.log(err.message)
    process.exit(1)
  }
  console.log("connected to load cell sensor")
})

const outStream = fs.createWriteStream(path.join(process.cwd(), 'out.ndjson'))

function log(obj) {
  outStream.write(JSON.stringify(obj, null, 0) + '\n')
}

const sensorSPread = sensorSP.pipe(split())
const grblSPread = grblSP.pipe(split())

async function readSensor(){
  var value = new Promise((resolve,reject)=>{
    sensorSPread.once("data",function(dBuffer){
      var parts = dBuffer.toString().split(",").map((a)=>{
        return parseFloat(a.trim())
      })
      var sensorData = {
        left:parts[0],
        right:parts[1],
        load:parts[2]
      }

      resolve(sensorData)
    })
  })
  sensorSP.write("\n")

  return value
}

const EPSILON = 0.009
function epsCmp(a, b) {
  return Math.abs(a - b) < EPSILON
}

async function waitForMachineMove(o) {
  const ret = new Promise((resolve, reject) => {
    const ticker = setInterval(() => {
      grblSP.write("?\n")
    }, 500)

    var handler = through((buf, enc, done) => {
      const str = String(buf)

      if (str.trim() === "" || str === "ok") {
        return done()
      }

      //<Alarm,MPos:0.000,0.000,0.000,WPos:199.000,199.000,0.999>
      const matches = str.match(/\|WPos:([-\d\.,]+)\|/)
      if (matches) {
        const parts = matches[1].split(',').map(parseFloat)
        if (
          epsCmp(parts[0], o.coords.x) &&
          epsCmp(parts[1], o.coords.y) &&
          epsCmp(parts[2], o.coords.z)
        ) {
          grblSPread.unpipe(handler)
          clearInterval(ticker)
          resolve(true)
        }
      }
      done()
    })
    grblSPread.pipe(handler)
  })

  return ret;
}

async function moveMachine(o){
  grblSP.write(o.gcode + '\n')
  if (!o.machineWait) {
    return Promise.resolve(true)
  }
  return waitForMachineMove(o)
}

setTimeout(async function () {

  for await (let o of gcodeLines) {
    await moveMachine(o)

    if (o.readSensor) {
      var sensorOutputObj = await readSensor()
      var out = Object.assign(sensorOutputObj, o.coords)
      console.log(JSON.stringify(out))
      log(out)
    }
  }

}, 4000);
