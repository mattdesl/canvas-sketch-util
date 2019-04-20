var lineclip = require('lineclip');

module.exports.clipSegmentToCircle = require('./lib/clip/clip-segment-to-circle');
module.exports.clipLineToCircle = require('./lib/clip/clip-line-to-circle');

module.exports.clipPolylinesToBox = function (polylines, bbox, border, closeLines) {
  closeLines = closeLines !== false;
  border = Boolean(border);

  if (border) {
    return polylines.map(function (line) {
      var result = lineclip.polygon(line, bbox);
      if (closeLines && result.length > 2) {
        result.push(result[0]);
      }
      return result;
    }).filter(function (lines) {
      return lines.length > 0;
    });
  } else {
    return polylines.map(function (line) {
      return lineclip.polyline(line, bbox);
    }).reduce(function (a, b) {
      return a.concat(b);
    }, []);
  }
};

module.exports.createHatchLines = createHatchLines;
function createHatchLines (bounds, angle, spacing, out) {
  if (angle == null) angle = -Math.PI / 4;
  if (spacing == null) spacing = 0.5;
  if (out == null) out = [];

  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  spacing = Math.abs(spacing);
  if (spacing === 0) throw new Error('cannot use a spacing of zero as it will run an infinite loop!');

  var xmin = bounds[0][0];
  var ymin = bounds[0][1];
  var xmax = bounds[1][0];
  var ymax = bounds[1][1];

  var w = xmax - xmin;
  var h = ymax - ymin;
  if (w === 0 || h === 0) return out;
  var r = Math.sqrt(w * w + h * h) / 2;
  var rotAngle = Math.PI / 2 - angle;
  var ca = Math.cos(rotAngle);
  var sa = Math.sin(rotAngle);
  var cx = bounds[0][0] + (w / 2);
  var cy = bounds[0][1] + (h / 2);
  var i = -r;
  while (i <= r) {
    // Line starts at (i, -r) and goes to (i, +r)
    var x1 = cx + (i * ca) + (r * sa); //  i * ca - (-r) * sa
    var y1 = cy + (i * sa) - (r * ca); //  i * sa + (-r) * ca
    var x2 = cx + (i * ca) - (r * sa); //  i * ca - (+r) * sa
    var y2 = cy + (i * sa) + (r * ca); //  i * sa + (+r) * ca
    i += spacing;
    // Remove any potential hatch lines which are entirely
    // outside of the bounding box
    if ((x1 < xmin && x2 < xmin) || (x1 > xmax && x2 > xmax)) {
      continue;
    }
    if ((y1 < ymin && y2 < ymin) || (y1 > ymax && y2 > ymax)) {
      continue;
    }
    out.push([ [ x1, y1 ], [ x2, y2 ] ]);
  }
  return out;
}

// TODO: N-Dimensional bounding box computation
// module.exports.getBounds = function computePolylineBounds (polylines) {
//   var minX = Infinity;
//   var minY = Infinity;
//   var maxX = -Infinity;
//   var maxY = -Infinity;
//   for (var i = 0; i < polylines.length; i++) {
//     var path = polylines[i];
//     for (var p = 0; p < path.length; p++) {
//       var point = path[p];
//       if (point[0] < minX) minX = point[0];
//       if (point[1] < minY) minY = point[1];
//       if (point[0] > maxX) maxX = point[0];
//       if (point[1] > maxY) maxY = point[1];
//     }
//   }
//   return {
//     min: [ minX, minY ],
//     max: [ maxX, maxY ]
//   };
// }
