const test = require('tape');
const penplot = require('../penplot');
const index = require('..');

test('should return a physical SVG', t => {
  console.log(penplot.toSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    width: 5,
    height: 5
  }));

  console.log(penplot.polylinesToSVG([
    [ [ 0, 0 ], [ 2, 3 ], [ 2, 1 ] ]
  ], {
    width: 5,
    height: 5,
    units: 'cm'
  }));
  t.end();
});
