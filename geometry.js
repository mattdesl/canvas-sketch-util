var lineclip = require('lineclip');

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
