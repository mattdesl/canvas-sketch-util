const test = require('tape');
const penplot = require('../penplot');

test('should return a physical SVG', t => {
  let svg;

  svg = penplot.polylinesToSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    width: 5,
    height: 5
  });

  t.equal(svg, `
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="5px" height="5px"
    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 5 5">
  <g>
    <path d="M0 0 L2 3 L2 1" fill="none" stroke="black" stroke-width="1.06299px" />
  </g>
</svg>`.trim());

  svg = penplot.polylinesToSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    units: 'cm',
    width: 5,
    height: 5
  });

  t.equal(svg, `
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="5cm" height="5cm"
    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 177.16535 177.16535">
  <g>
    <path d="M0 0 L70.86614 106.29921 L70.86614 35.43307" fill="none" stroke="black" stroke-width="0.03cm" />
  </g>
</svg>`.trim());

  svg = penplot.polylinesToSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    units: 'in',
    width: 5,
    height: 5
  });

  t.equal(svg, `
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="5in" height="5in"
    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 450 450">
  <g>
    <path d="M0 0 L180 270 L180 90" fill="none" stroke="black" stroke-width="0.01181in" />
  </g>
</svg>`.trim());

  svg = penplot.polylinesToSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    units: 'in',
    lineWidth: 1,
    strokeStyle: 'blue',
    width: 5,
    height: 5
  });

  t.equal(svg, `
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="5in" height="5in"
    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 450 450">
  <g>
    <path d="M0 0 L180 270 L180 90" fill="none" stroke="blue" stroke-width="1in" />
  </g>
</svg>`.trim());
  t.end();
});

test('discrete', t => {
  const str0 = 'M0 0L5 5';
  const path0 = penplot.createPath(context => context.lineTo(2, 5));

  t.deepEqual(penplot.pathsToPolylines(str0), [
    [ // a polyline...
      [ 0, 0 ], [ 0.78125, 0.78125 ], [ 4.21875, 4.21875 ], [ 5, 5 ]
    ]
  ]);

  t.deepEqual(penplot.pathsToPolylines([ str0 ]), [
    [ // a polyline...
      [ 0, 0 ], [ 0.78125, 0.78125 ], [ 4.21875, 4.21875 ], [ 5, 5 ]
    ]
  ]);

  t.deepEqual(penplot.pathsToPolylines([ [ 0, 0 ], [ 1, 1 ] ]), [
    [ [ 0, 0 ], [ 1, 1 ] ]
  ]);

  t.deepEqual(penplot.pathsToPolylines([
    [ [ 0, 0 ], [ 1, 1 ] ],
    [ [ 2, 4 ], [ 3, 3 ] ]
  ]), [
    [ [ 0, 0 ], [ 1, 1 ] ],
    [ [ 2, 4 ], [ 3, 3 ] ]
  ]);

  t.deepEqual(penplot.pathsToPolylines([
    [ [ 0, 0 ], [ 1, 1 ] ],
    path0,
    [ [ 2, 4 ], [ 3, 3 ] ]
  ]), [
    [ [ 0, 0 ], [ 1, 1 ] ],
    [ [ 0, 0 ], [ 0.3125, 0.78125 ], [ 1.6875, 4.21875 ], [ 2, 5 ] ],
    [ [ 2, 4 ], [ 3, 3 ] ]
  ]);

  t.end();
});

test('convert to SVG paths', t => {
  const path0 = penplot.createPath(context => context.arc(0, 0, 5, 0, Math.PI * 2));
  const str0 = path0.toString();
  const actual = 'M5,0A5,5,0,1,1,-5,0A5,5,0,1,1,5,0';
  t.deepEqual(penplot.convertToSVGPath(str0), actual, 'convert string');
  t.deepEqual(penplot.convertToSVGPath(path0), actual, 'convert path');
  t.deepEqual(penplot.convertToSVGPath([ path0, path0 ]), [ actual, actual ], 'convert paths');
  t.deepEqual(penplot.convertToSVGPath([ str0, str0 ]), [ actual, actual ], 'convert strings');
  t.deepEqual(penplot.convertToSVGPath([ [ 0, 0 ], [ 1, 1 ] ]), 'M0 0 L1 1', 'convert polyline');
  t.deepEqual(penplot.convertToSVGPath([
    [ [ 0, 0 ], [ 1, 1 ] ],
    [ [ 1, 1 ], [ 2, 2 ] ]
  ]), [ 'M0 0 L1 1', 'M1 1 L2 2' ], 'convert polyline');

  t.deepEqual(penplot.convertToSVGPath([
    [ [ 0, 0 ], [ 1, 1 ] ],
    path0,
    [
      [ [ 0, 0 ], [ 1, 1 ] ],
      [ [ 1, 1 ], [ 2, 2 ] ]
    ],
    str0
  ]), [
    'M0 0 L1 1',
    'M5,0A5,5,0,1,1,-5,0A5,5,0,1,1,5,0',
    'M0 0 L1 1',
    'M1 1 L2 2',
    'M5,0A5,5,0,1,1,-5,0A5,5,0,1,1,5,0'
  ], 'convert nested mixed');
  t.end();
});
