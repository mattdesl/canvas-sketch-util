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

test('should check collinearity', t => {
  const pointsHoriz = [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0 ]
  ];
  const pointsOff = [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0.1 ]
  ];
  const angle = 45 * Math.PI / 180;
  const dir = [ Math.cos(angle), Math.sin(angle) ];
  const pointsAngled = [ 0, 1, 2 ].map(t => {
    return [
      dir[0] * t,
      dir[1] * t
    ];
  });
  t.equals(geometry.arePointsCollinear(...pointsHoriz), true);
  t.equals(geometry.arePointsCollinear(...pointsOff), false);
  t.equals(geometry.arePointsCollinear(...pointsAngled), true);
  t.end();
});

test('should remove duplicates', t => {
  const pointsHoriz = [
    [ 0, 0 ],
    [ 0, 0 ],
    [ 1, 0 ],
    [ 1.5, 0 ],
    [ 1.5 + 1e-14, 0 ],
    [ 2, 0 ]
  ];
  t.deepEqual(geometry.removeDuplicatePoints(pointsHoriz), [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 1.5, 0 ],
    [ 2, 0 ]
  ]);
  t.deepEqual(geometry.removeDuplicatePoints([
    [ 1.5, 0 ],
    [ 1.5 + 1e-5, 0 ]
  ]), [
    [ 1.5, 0 ],
    [ 1.5 + 1e-5, 0 ]
  ]);
  t.end();
});

test('should remove collinearity', t => {
  t.deepEqual(geometry.removeCollinearPoints([
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0 ]
  ]), [
    [ 0, 0 ],
    [ 2, 0 ]
  ]);

  t.deepEqual(geometry.removeCollinearPoints([
    [ 1, 1 ],
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0 ]
  ]), [
    [ 1, 1 ],
    [ 0, 0 ],
    [ 2, 0 ]
  ]);

  t.deepEqual(geometry.removeCollinearPoints([
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0 ],
    [ 3, 0 ]
  ]), [
    [ 0, 0 ],
    [ 3, 0 ]
  ]);

  t.deepEqual(geometry.removeCollinearPoints([
    [ 1, 1 ],
    [ 0, 0 ],
    [ 0.5, 0 ],
    [ 1.75, 0 ],
    [ 1, 0 ],
    [ 2, 0 ]
  ]), [
    [ 1, 1 ],
    [ 0, 0 ],
    [ 1.75, 0 ],
    [ 1, 0 ],
    [ 2, 0 ]
  ]);

  t.deepEqual(geometry.removeCollinearPoints([
    [ 1, 1 ],
    [ 0, 0 ],
    [ 1, 0 ],
    [ 2, 0 ],
    [ 1, 0 ]
  ]), [
    [ 1, 1 ],
    [ 0, 0 ],
    [ 2, 0 ],
    [ 1, 0 ]
  ]);

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

  // also handle nested box format
  const trimmed2 = geometry.clipPolylinesToBox(lines, [
    [ 1, 1 ], [ 2, 2 ]
  ], true, false);
  t.deepEqual(trimmed2, [ [ [ 1, 1 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 1, 1.5 ] ] ]);
  t.end();
});

// Not sure of a good way to test this...
test('should get hatch lines', t => {
  const bbox = [
    [ 0, 0 ], [ 1, 1 ]
  ];
  let lines = geometry.createHatchLines(bbox, 0, 0.5).map(line => {
    return line.map(point => point.map(n => Math.floor(n)));
  });
  t.deepEqual(lines, [ [ [ 1, 0 ], [ -1, 0 ] ], [ [ 1, 0 ], [ -1, 0 ] ] ]);

  // also handles flat box format
  lines = geometry.createHatchLines([
    0, 0, 1, 1
  ], 0, 0.5).map(line => {
    return line.map(point => point.map(n => Math.floor(n)));
  });
  t.deepEqual(lines, [ [ [ 1, 0 ], [ -1, 0 ] ], [ [ 1, 0 ], [ -1, 0 ] ] ]);
  t.end();
});

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

test('should get bounds', t => {
  const lines = [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ];
  t.deepEqual(geometry.getBounds(lines), [ [ 0, 0 ], [ 1.5, 1.5 ] ]);
  t.throws(() => geometry.getBounds([]));
  t.deepEqual(geometry.getBounds([ [ 1, 1 ] ]), [ [ 1, 1 ], [ 1, 1 ] ]);
  t.deepEqual(geometry.getBounds([ [ 1, 1 ], [ -1, 4 ] ]), [ [ -1, 1 ], [ 1, 4 ] ]);
  t.end();
});

function toFixed1 (hits) {
  return hits.map(h => h.map(n => parseFloat(n.toFixed(1))));
}
