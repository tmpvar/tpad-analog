
var gcode = module.exports = [];

const safeZ = 5
const extents = {x: 40, y: 40, z: 1}
const stepSize = {x:5, y:5, z: 0.1}
const stepDir = {x:1, y:1, z:-2}

var G1 = function(x, y, z, readSensor) {
  const coords = { x, y, z }


  var str = 'G1 ' + Object.keys(coords).map(function(a) {
    return a.toUpperCase() + Number(coords[a]).toFixed(3);
  }).join(" ");

  gcode.push({
    coords: coords,
    readSensor: readSensor,
    gcode: str
  })
};

for (var x = 0; x < extents.x; x+=stepSize.x) {
  for (var y = 0; y < extents.y; y+=stepSize.y) {
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
    for (var z = 0; z < extents.z; z+=stepSize.z) {
      // move down on z
      G1(
        x * stepDir.x,
        y * stepDir.x,
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

if (!module.parent) {
  console.log(gcode.map((o) => o.gcode).join("\n"))
}
