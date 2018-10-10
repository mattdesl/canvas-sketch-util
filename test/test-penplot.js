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
