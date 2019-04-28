const budo = require('budo')
const babelify = require('babelify')
const skateboard = require('skateboard')
const SerialPort = require('serialport')

const split = require('split2')
const through = require('through2')

budo('./src/index.js', {
  live: true,             // setup live reload
  port: 8000,             // use this port
  browserify: {
    transform: babelify   // ES6
  }
}).on('connect', function (ev) {
  console.log('Server running on %s', ev.uri)
}).on('update', function (buffer) {
  console.log('bundle - %d bytes', buffer.length)
})

var clients = []
skateboard((stream) => {
  console.log("new skateboard stream")
  clients.push(stream)
  stream.on('end', () => {
    clients = clients.filter((a) => a !== stream)
  })
})

function broadcast(buf) {
  clients.forEach((c) => {
    c.write(buf)
  })
}

const sp = new SerialPort('COM3', { baudRate: 115200 }, () => {
  console.log("connected to serialport")
  sp.pipe(split()).pipe(through(onLine))
})

const buf = Buffer.alloc(8)

function onLine(l, enc, done) {
  const sl = String(l)
  const commaIdx = sl.indexOf(',')

  buf.writeUInt32LE(parseInt(sl.substring(0, commaIdx)), 0)
  buf.writeUInt32LE(parseInt(sl.substring(commaIdx + 1)), 4)

  broadcast(buf)
  done()
}
