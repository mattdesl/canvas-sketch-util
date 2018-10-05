var defined = require('defined');
var convert = require('convert-length');

var DEFAULT_PEN_THICKNESS = 0.03;
var DEFAULT_PEN_THICKNESS_UNIT = 'cm';

function computePolylineBounds (polylines) {
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  for (var i = 0; i < polylines.length; i++) {
    var path = polylines[i];
    for (var p = 0; p < path.length; p++) {
      var point = path[p];
      if (point[0] < minX) minX = point[0];
      if (point[1] < minY) minY = point[1];
      if (point[0] > maxX) maxX = point[0];
      if (point[1] > maxY) maxY = point[1];
    }
  }
  return {
    min: [ minX, minY ],
    max: [ maxX, maxY ]
  };
}

module.exports.polylinesToSVG = function polylinesToSVG (polylines, opt) {
  opt = opt || {};

  var width = opt.width;
  var height = opt.height;

  var computeBounds = typeof width === 'undefined' || typeof height === 'undefined';
  if (computeBounds) {
    throw new Error('Must specify "width" and "height" options');
  }

  var units = opt.units || 'px';

  var commands = [];
  var convertOptions = {
    roundPixel: false,
    precision: defined(opt.precision, 5),
    pixelsPerInch: 90
  };
  polylines.forEach(function (line) {
    line.forEach(function (point, j) {
      var type = (j === 0) ? 'M' : 'L';
      var x = convert(point[0], units, 'px', convertOptions).toString();
      var y = convert(point[1], units, 'px', convertOptions).toString();
      commands.push(type + x + ' ' + y);
    });
  });

  var svgPath = commands.join(' ');
  var viewWidth = convert(width, units, 'px', convertOptions).toString();
  var viewHeight = convert(height, units, 'px', convertOptions).toString();
  var fillStyle = opt.fillStyle || 'none';
  var strokeStyle = opt.strokeStyle || 'black';
  var lineWidth = opt.lineWidth;

  // Choose a default line width based on a relatively fine-tip pen
  if (typeof lineWidth === 'undefined') {
    // Convert to user units
    lineWidth = convert(DEFAULT_PEN_THICKNESS, DEFAULT_PEN_THICKNESS_UNIT, units, convertOptions).toString();
  }

  return `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg width="${width}${units}" height="${height}${units}"
       xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${viewWidth} ${viewHeight}">
   <g>
     <path d="${svgPath}" fill="${fillStyle}" stroke="${strokeStyle}" stroke-width="${lineWidth}${units}" />
   </g>
</svg>`;
};

module.exports.exportPolylines = function (polylines, opt) {
  return {
    data: module.exports.polylinesToSVG(polylines, opt),
    extension: '.svg'
  };
};

var TO_PX = 35.43307;

module.exports.toSVG = function polylinesToSVG (polylines, opt = {}) {
  const dimensions = opt.dimensions;
  if (!dimensions) throw new TypeError('must specify dimensions currently');
  const decimalPlaces = 5;

  let commands = [];
  polylines.forEach(line => {
    line.forEach((point, j) => {
      const type = (j === 0) ? 'M' : 'L';
      const x = (TO_PX * point[0]).toFixed(decimalPlaces);
      const y = (TO_PX * point[1]).toFixed(decimalPlaces);
      commands.push(`${type}${x} ${y}`);
    });
  });

  const svgPath = commands.join(' ');
  const viewWidth = (dimensions[0] * TO_PX).toFixed(decimalPlaces);
  const viewHeight = (dimensions[1] * TO_PX).toFixed(decimalPlaces);
  const fillStyle = opt.fillStyle || 'none';
  const strokeStyle = opt.strokeStyle || 'black';
  const lineWidth = defined(opt.lineWidth, DEFAULT_PEN_THICKNESS);

  return `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg width="${dimensions[0]}cm" height="${dimensions[1]}cm"
       xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${viewWidth} ${viewHeight}">
   <g>
     <path d="${svgPath}" fill="${fillStyle}" stroke="${strokeStyle}" stroke-width="${lineWidth}cm" />
   </g>
</svg>`;
};
