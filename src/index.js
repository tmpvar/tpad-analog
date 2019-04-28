const fc = require('fc')
const center = require('ctx-translate-center')
const createCamera = require('ctx-camera')
const ndarray = require('ndarray')

const skateboard = require('skateboard')

const sampleCount = 1000
var sampleLoc = 0
const samples = ndarray(new Uint32Array(sampleCount * 2), [sampleCount, 2])


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const oscBase = 440
const oscMin = 80

// create Oscillator node
var osc1 = audioCtx.createOscillator();
var osc1freq = 0;
osc1.type = 'sine';
osc1.frequency.setValueAtTime(0, audioCtx.currentTime); // value in hertz
osc1.start();

var osc2 = audioCtx.createOscillator();
var osc2freq = 0;
osc2.type = 'triangle';
osc2.frequency.setValueAtTime(0, audioCtx.currentTime); // value in hertz
osc2.start();

var gainNode = audioCtx.createGain();
osc1.connect(gainNode);
osc2.connect(gainNode);

gainNode.connect(audioCtx.destination);


var sampleDebug = 0;
var samplesPerSecond = 0;
setInterval(() => {
  samplesPerSecond = (sampleDebug + samplesPerSecond) / 2
  sampleDebug = 0
}, 100)

const threshold = 50
const invSteps = 0.750

function trailingEdge(c, p, falloff, thres) {
  if (c < thres) {
    return Math.max(p * falloff, 0)
  } else {
    return Math.max(p, c * falloff)
  }
}

skateboard({ port: 8080 }, (stream) => {
  console.log('connected')

  stream.on("data", (buf) => {
    sampleDebug++
    const u32 = new Uint32Array(buf)
    // the right pad is garbo so scale it up a bit
    u32[1] *= 4

    var p1 = samples.get(sampleLoc % sampleCount, 0)
    var p2 = samples.get(sampleLoc % sampleCount, 1)

    u32[0] = trailingEdge(u32[0], p1, invSteps, threshold)
    u32[1] = trailingEdge(u32[1], p2, invSteps, threshold)

    sampleLoc++
    const sampleIdx = sampleLoc % sampleCount
    samples.set(sampleIdx, 0, u32[0])
    samples.set(sampleIdx, 1, u32[1])
    osc1freq = (osc1freq +  u32[0]) / 2.0
    osc2freq = (osc2freq +  u32[1]) / 2.0

    osc1.frequency.setValueAtTime(
      osc1freq,
      audioCtx.currentTime
    );

    osc2.frequency.setValueAtTime(
      osc2freq,
      audioCtx.currentTime
    );

  })
})

const ctx = fc(render, 1)
const camera = createCamera(ctx, window, {})
const width = 1
const spacing = 1
const height = 300
function render() {
  ctx.clear();
  ctx.save()
    ctx.font = "40px monospace"
    ctx.fillStyle = "red"
    ctx.fillText('l: '+samples.get((sampleLoc) % sampleCount, 0), 50, 40)
    ctx.fillStyle = "yellow"
    ctx.fillText('r: ' + samples.get((sampleLoc) % sampleCount, 1), 50, 80)

    ctx.fillStyle = "white"
    ctx.fillText('sps: ' + Number(samplesPerSecond * 10).toFixed(2), 50, 120)

    camera.begin()
    center(ctx)
    ctx.translate(-sampleCount * spacing / 2.0, 0)
    ctx.scale(1, -1)
    ctx.fillStyle = "red"
    for (var idx = 0; idx < sampleCount; idx++) {
      var sample = samples.get((sampleLoc - idx) % sampleCount, 0)
      ctx.fillRect(idx * spacing, 0, width, Math.max(sample/1024 * height, 1))
    }

    ctx.fillStyle = "yellow"
    for (var idx = 0; idx < sampleCount; idx++) {
      var sample = samples.get((sampleLoc - idx) % sampleCount, 1)
      ctx.fillRect(idx * spacing, -height, width, Math.max(sample/1024 * height, 1))
    }

    ctx.strokeStyle = "#f0f"
    ctx.strokeRect(-1, -1, samples.length * spacing, height)
  camera.end()
  ctx.restore()
}
