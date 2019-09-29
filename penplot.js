var defined = require('defined');
var convert = require('convert-length');
var d3 = require('d3-path');
var svgPathContours = require('svg-path-contours');
var svgPathParse = require('parse-svg-path');
var svgPathAbs = require('abs-svg-path');

var DEFAULT_PEN_THICKNESS = 0.03;
var DEFAULT_PEN_THICKNESS_UNIT = 'cm';
var DEFAULT_PIXELS_PER_INCH = 90;

// Takes SVG string and returns a list of absolute commands
module.exports.getSVGCommands = getSVGCommands;
function getSVGCommands (svgString) {
  return svgPathAbs(svgPathParse(svgString));
}

// A Path helper for arcs, curves and lineTo commands
module.exports.createPath = createPath;
function createPath (fn) {
  var path = d3.path();
  path.toContours = toContours.bind(path);
  path.toCommands = toCommands.bind(path);
  if (typeof fn === 'function') fn(path);
  return path;
}

// Functions to be bound to new path interfaces
function toCommands () {
  return getSVGCommands(this.toString());
}

function toContours (opt) {
  var commands = svgPathParse(this.toString());
  return getContoursFromRawCommands(commands, opt);
}

module.exports.getContourResolution = function (props) {
  if (typeof props === 'string') props = { units: props };
  return Math.max(1, convert(1, props.units, 'px'));
};

module.exports.getSVGContours = getSVGContours;
function getSVGContours (svg, opt) {
  if (!svg) throw new Error('Must specify a SVG string or list of path commands');
  if (typeof svg === 'string') {
    svg = svgPathParse(svg);
  }
  return getContoursFromRawCommands(svg, opt);
}

function getContoursFromRawCommands (commands, opt) {
  if (typeof opt === 'number') {
    opt = { resolution: opt };
  } else if (opt == null) {
    opt = { resolution: null }; // let it default
  }
  var resolution = opt.resolution;
  if (resolution == null) {
    // default resolution
    resolution = 1;
  }
  if (resolution <= 0 || !isFinite(resolution) || typeof resolution !== 'number') {
    throw new Error('{ resolution } must be finite and above zero');
  }
  return svgPathContours(commands, resolution);
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
    pixelsPerInch: DEFAULT_PIXELS_PER_INCH
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

  return [
    '<?xml version="1.0" standalone="no"?>',
    '  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
    '      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '  <svg width="' + width + units + '" height="' + height + units + '"',
    '      xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' + viewWidth + ' ' + viewHeight + '">',
    '    <g>',
    '      <path d="' + svgPath + '" fill="' + fillStyle + '" stroke="' + strokeStyle + '" stroke-width="' + lineWidth + units + '" />',
    '    </g>',
    '</svg>'
  ].join('\n');
};

module.exports.renderPolylines = function (polylines, opt) {
  opt = opt || {};

  var context = opt.context;
  if (!context) throw new Error('Must specify "context" options');

  var units = opt.units || 'px';

  var width = opt.width;
  var height = opt.height;
  if (typeof width === 'undefined' || typeof height === 'undefined') {
    throw new Error('Must specify "width" and "height" options');
  }

  // Choose a default line width based on a relatively fine-tip pen
  var lineWidth = opt.lineWidth;
  if (typeof lineWidth === 'undefined') {
    // Convert to user units
    lineWidth = convert(DEFAULT_PEN_THICKNESS, DEFAULT_PEN_THICKNESS_UNIT, units, {
      roundPixel: false,
      pixelsPerInch: DEFAULT_PIXELS_PER_INCH
    });
  }

  // Clear canvas
  context.clearRect(0, 0, width, height);

  // Fill with white
  context.fillStyle = opt.background || 'white';
  context.fillRect(0, 0, width, height);

  // Draw lines
  polylines.forEach(function (points) {
    context.beginPath();
    points.forEach(function (p) {
      context.lineTo(p[0], p[1]);
    });
    context.strokeStyle = opt.foreground || opt.strokeStyle || 'black';
    context.lineWidth = lineWidth;
    context.lineJoin = opt.lineJoin || 'round';
    context.lineCap = opt.lineCap || 'round';
    context.stroke();
  });

  // Save layers
  return [
    // Export PNG as first layer
    context.canvas,
    // Export SVG for pen plotter as second layer
    {
      data: module.exports.polylinesToSVG(polylines, opt),
      extension: '.svg'
    }
  ];
};
