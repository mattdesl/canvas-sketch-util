const test = require('tape');
const penplot = require('../penplot');
// const convert = require('convert-length');

test('should return a physical SVG', t => {
  let svg;

  svg = penplot.pathsToSVG([
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
  <g fill="none" stroke="black" stroke-width="1.06299px">
    <path d="M0 0 L2 3 L2 1" />
  </g>
</svg>`.trim());

  svg = penplot.pathsToSVG([
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
  <g fill="none" stroke="black" stroke-width="0.03cm">
    <path d="M0 0 L70.86614 106.29921 L70.86614 35.43307" />
  </g>
</svg>`.trim());

  svg = penplot.pathsToSVG([
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
  <g fill="none" stroke="black" stroke-width="0.01181in">
    <path d="M0 0 L180 270 L180 90" />
  </g>
</svg>`.trim());

  svg = penplot.pathsToSVG([
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
  <g fill="none" stroke="blue" stroke-width="1in">
    <path d="M0 0 L180 270 L180 90" />
  </g>
</svg>`.trim());
  t.end();
});

test('discrete', t => {
  const str0 = 'M0 0L5 5';
  const path0 = penplot.createPath(context => context.lineTo(2, 5));

  t.deepEqual(penplot.pathsToPolylines(str0), [
    [ // a polyline...
      [ 0, 0 ], [ 0.21484375, 0.21484375 ], [ 1.58203125, 1.58203125 ], [ 3.41796875, 3.41796875 ], [ 4.78515625, 4.78515625 ], [ 5, 5 ]
    ]
  ]);

  t.deepEqual(penplot.pathsToPolylines([ str0 ]), [
    [ // a polyline...
      [ 0, 0 ], [ 0.21484375, 0.21484375 ], [ 1.58203125, 1.58203125 ], [ 3.41796875, 3.41796875 ], [ 4.78515625, 4.78515625 ], [ 5, 5 ]
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
    [ [ 0, 0 ], [ 0.0859375, 0.21484375 ], [ 0.6328125, 1.58203125 ], [ 1.3671875, 3.41796875 ], [ 1.9140625, 4.78515625 ], [ 2, 5 ] ],
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

test('should handle paths', t => {
  const units = 'cm';

  let path0 = penplot.createPath();
  path0.moveTo(0, 0);
  path0.lineTo(1, 1);

  let path1 = penplot.createPath();
  path1.moveTo(1, 1);
  path1.lineTo(2, 2);

  let svg;
  svg = penplot.pathsToSVG([ path0, path1 ], {
    units,
    width: 5,
    height: 5
  });
  t.equal(svg, `
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="5cm" height="5cm"
    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 177.16535 177.16535">
  <g fill="none" stroke="black" stroke-width="0.03cm">
    <path d="M0 0 L0.10165 0.10165 L0.87588 0.87588 L2.32486 2.32486 L4.34479 4.34479 L8.21812 8.21812 L14.41199 14.41199 L21.02108 21.02108 L27.21495 27.21495 L31.08828 31.08828 L33.10821 33.10821 L34.55719 34.55719 L35.33143 35.33143 L35.43307 35.43307" />
    <path d="M35.43307 35.43307 L35.53472 35.53472 L36.30895 36.30895 L37.75793 37.75793 L39.77786 39.77786 L43.65119 43.65119 L49.84506 49.84506 L56.45416 56.45416 L62.64802 62.64802 L66.52135 66.52135 L68.54128 68.54128 L69.99026 69.99026 L70.7645 70.7645 L70.86614 70.86614" />
  </g>
</svg>`.trim());

  t.end();
});
