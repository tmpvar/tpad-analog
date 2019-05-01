
var gcode = module.exports = [];

const safeZ = 5
const workOffset = { x: 175, y: 101, z: -49 }
const extents = {x: 40, y: 40, z: 1.5}
const stepSize = {x:1, y:1, z: 0.05}
const stepDir = {x:1, y:1, z:-1}

var G1 = function(x, y, z, readSensor, skipMachineWait) {
  const coords = { x, y, z }

  var str = 'G1 ' + Object.keys(coords).map(function(a) {
    return a.toUpperCase() + Number(coords[a]).toFixed(3);
  }).join(" ");

  gcode.push({
    coords: coords,
    readSensor: readSensor,
    gcode: str,
    machineWait: !skipMachineWait
  })
};

// Report WPos
gcode.push({ gcode: '$10=0' })

// Home
gcode.push({ gcode: '$H' })

// Setup absolute coords
gcode.push({ gcode: 'G21 G90' })
gcode.push({ gcode: 'G1 F800' })

// Setup Machine Coords (initial)
gcode.push({ gcode: 'G10 L20 P1 X0 Y0 Z0' })

// Move to known offset
G1(workOffset.x,  workOffset.y, 0, false, true)
G1(workOffset.x,  workOffset.y, workOffset.z + safeZ, false, true)

// Setup Machine Coords (work offset)
gcode.push({ gcode: `G10 L20 P1 X0 Y0 Z${safeZ}` })

for (var x = 0; x <= extents.x; x+=stepSize.x) {
  for (var y = 0; y <= extents.y; y+=stepSize.y) {
    // move to the new x,y position
    G1(
      x * stepDir.x,
      y * stepDir.y,
      safeZ,
      false
    )

    // move down to the surface
    G1(
      x * stepDir.x,
      y * stepDir.y,
      0,
      false
    )
    for (var z = 0; z <= extents.z; z+=stepSize.z) {
      // move down on z
      G1(
        x * stepDir.x,
        y * stepDir.y,
        z * stepDir.z,
        true
      )
    }

    // move z back to safe distance before we move on x,y
    G1(
      x * stepDir.x,
      y * stepDir.y,
      safeZ,
      false
    )
  }
}

// Home
gcode.push({ gcode: '$H' })

if (!module.parent) {
  console.log(gcode.map((o) => o.gcode).join("\n"))
}
