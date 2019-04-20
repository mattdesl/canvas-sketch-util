const test = require('tape');
const geometry = require('../geometry');

test('should clip lines', t => {
  const lines = [
    [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
  ];
  const box = [
    1, 1, 2, 2
  ];
  const trimmed = geometry.clipPolylinesToBox(lines, box);
  t.deepEqual(trimmed, [ [ [ 1, 1 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 1, 1.5 ] ] ]);
  t.end();
});

test('should clip lines with border', t => {
  const lines = [
    [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
  ];
  const box = [
    1, 1, 2, 2
  ];
  const trimmed = geometry.clipPolylinesToBox(lines, box, true);
  t.deepEqual(trimmed, [ [ [ 1, 1 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 1, 1.5 ], [ 1, 1 ] ] ]);
  t.end();
});

test('should clip lines with border but not closed paths', t => {
  const lines = [
    [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
  ];
  const box = [
    1, 1, 2, 2
  ];
  const trimmed = geometry.clipPolylinesToBox(lines, box, true, false);
  t.deepEqual(trimmed, [ [ [ 1, 1 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 1, 1.5 ] ] ]);
  t.end();
});

// Not sure of a good way to test this...
// test('should get hatch lines', t => {
//   const bbox = [
//     [ 0, 0 ], [ 2, 2 ]
//   ];
//   const lines = geometry.createHatchLines(bbox, 0, 1).map(line => {
//     return line.map(point => point.map(n => Math.floor(n)))
//   });
//   t.deepEqual(lines);
//   t.end();
// });

test('should clip line', t => {
  let line, circle, radius, hits, isHit;

  // line collides with two points in circle
  line = [
    [ 0, 0 ], [ 1, 2 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipLineToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0.4, 0.9 ], [ -0.4, -0.9 ] ]);

  // line collides with edge of circle
  line = [
    [ 0, 0 ], [ 1, 0 ]
  ];
  circle = [ 0, 1 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipLineToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ] ]);

  // line does not collide with circle
  line = [
    [ 0, 0 ], [ 1, 0 ]
  ];
  circle = [ 0, 2 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipLineToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, false);
  t.deepEqual(toFixed1(hits), []);
  t.end();
});

test('should clip segment', t => {
  let line, circle, radius, hits, isHit;

  // first point is inside, second is outside
  line = [
    [ 0, 0 ], [ 1, 2 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ], [ 0.4, 0.9 ] ]);

  // second point is inside, first is outside
  line = [
    [ 1, 2 ], [ 0, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ], [ 0.4, 0.9 ] ]);

  // first point is inside, second is on edge
  line = [
    [ 0, 0 ], [ 1, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ], [ 1, 0 ] ]);

  // both points inside
  line = [
    [ 0, 0 ], [ 0.3, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 2;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ], [ 0.3, 0 ] ]);

  // both points outside
  line = [
    [ 0, 0 ], [ 0.3, 0 ]
  ];
  circle = [ 0, 4 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, false);
  t.deepEqual(toFixed1(hits), []);

  // first point is outside, second is on edge
  line = [
    [ 2, 0 ], [ 1, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 1, 0 ] ]);

  // first point is outside, second point is inside
  line = [
    [ 2, 0 ], [ 0.5, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0.5, 0 ], [ 1, 0 ] ]);

  // both points outside of circle but still leads to collision
  line = [
    [ -2, 0 ], [ 2, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ -1, 0 ], [ 1, 0 ] ]);

  // one point lies just outside of circle edge, the other far outside
  line = [
    [ 0.1, 0 ], [ 4, 0 ]
  ];
  circle = [ 0, 1 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, false);
  t.deepEqual(toFixed1(hits), []);

  // both points outside of circle, no collision
  line = [
    [ -1, 2 ], [ 4, 2.2 ]
  ];
  circle = [ 0, 1 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, false);
  t.deepEqual(toFixed1(hits), []);

  // e.g going through centre of circle
  line = [
    [ -2, 0 ], [ 4, 0 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ -1, 0 ], [ 1, 0 ] ]);

  // e.g going through at an angle
  line = [
    [ -2, 0.5 ], [ 4, 0.25 ]
  ];
  circle = [ 0, 0 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ -0.9, 0.5 ], [ 0.9, 0.4 ] ]);

  // both points outside of circle but leads to exactly one collision
  // i.e. line segment intersects with edge of circle
  line = [
    [ -4, 0 ], [ 4, 0 ]
  ];
  circle = [ 0, 1 ];
  radius = 1;
  hits = [];
  isHit = geometry.clipSegmentToCircle(line[0], line[1], circle, radius, hits);
  t.deepEqual(isHit, true);
  t.deepEqual(toFixed1(hits), [ [ 0, 0 ] ]);

  t.end();
});

function toFixed1 (hits) {
  return hits.map(h => h.map(n => parseFloat(n.toFixed(1))));
}
