const test = require('tape');
const math = require('../math');
const index = require('../');

test('should have math functions', t => {
  t.notEqual(typeof index.math, 'undefined');
  t.notEqual(typeof math, 'undefined');
  t.end();
});

test('mod', t => {
  t.equal(math.mod(2, 4), 2);
  t.equal(math.mod(4, 4), 0);
  t.equal(math.mod(5, 4), 1);
  t.equal(math.mod(5, 4), 1);
  t.ok(isNaN(math.mod(0, 0)));
  t.equal(math.mod(-2, 4), 2);
  t.equal(math.mod(-5, 4), 3);
  t.end();
});

test('fract', t => {
  t.equal(math.fract(0.25), 0.25);
  t.equal(math.fract(2.25), 0.25);
  t.equal(math.fract(-2.25), 0.75);
  t.end();
});

test('sign', t => {
  t.equal(math.sign(1), 1);
  t.equal(math.sign(2), 1);
  t.equal(math.sign(-2), -1);
  t.equal(math.sign(0), 0);
  t.end();
});

test('deg and rad', t => {
  t.equal(math.degToRad(360), Math.PI * 2);
  t.equal(math.radToDeg(Math.PI), 180);
  t.end();
});

test('wrapping', t => {
  t.equal(math.wrap(0, 0, 1), 0);
  t.equal(math.wrap(0.5, 0, 1), 0.5);
  t.equal(math.wrap(1, 0, 1), 0.0);
  t.equal(math.wrap(1.5, 0, 1), 0.5);
  t.equal(math.wrap(360, 0, 360), 0);
  t.equal(math.wrap(365, 0, 360), 5);
  t.equal(math.wrap(185, -180, 180), -175);
  t.equal(math.wrap(-185, -180, 180), 175);
  t.end();
});

test('pingPong', t => {
  t.equal(math.pingPong(0, 1), 0);
  t.equal(math.pingPong(0.25, 1), 0.25);
  t.equal(math.pingPong(1.25, 1), 0.75);
  t.end();
});

test('linspace', t => {
  t.deepEqual(math.linspace(4), [ 0, 0.25, 0.5, 0.75 ]);
  t.deepEqual(math.linspace(5, true), [ 0, 0.25, 0.5, 0.75, 1 ]);
  t.end();
});

test('lerps', t => {
  t.equal(math.lerp(0, 1, 0.5), 0.5);
  t.equal(math.lerp(0, 10, 0.5), 5);
  t.equal(math.lerp(-10, 10, 0.25), -5);
  t.equal(math.lerp(0, 1, 1), 1);
  t.equal(math.lerp(0, 1, 2), 2, 'handles unclamped');

  const array = [];
  const result = math.lerpArray([ 0, 0 ], [ 10, 10 ], 0.25, array);
  t.deepEqual(result, [ 2.5, 2.5 ]);
  t.strictEqual(result, array);
  t.deepEqual(math.lerpArray([ 0, 0 ], [ 10, 10 ], 0.5), [ 5, 5 ]);

  t.equal(math.inverseLerp(20, 40, 40), 1);
  t.equal(math.inverseLerp(40, 40, 40), 0);
  t.equal(math.inverseLerp(20, 40, 20), 0);
  t.equal(math.inverseLerp(0, 100, 50), 0.5);

  t.equal(math.lerpFrames([ 0, 0.25, 0.5 ], 0), 0);
  t.equal(math.lerpFrames([ 0, 0.25, 0.5 ], 0.5), 0.25);
  t.equal(math.lerpFrames([ 0, 0.25, 0.5 ], 1), 0.5);
  t.equal(math.lerpFrames([ 0, 0.25, 0.5 ], 2), 0.5);
  t.equal(math.lerpFrames([ 0, 0.25, 0.5 ], -1), 0.0);

  t.deepEqual(math.lerpFrames([ [ 0, 0 ], [ 0.25, 0.5 ], [ 10, 10 ] ], 0), [ 0, 0 ]);
  t.deepEqual(math.lerpFrames([ [ 0, 0 ], [ 5, 0.5 ], [ 10, 10 ] ], 0.75), [ 7.5, 5.25 ]);
  t.deepEqual(math.lerpFrames([ [ 0, 0 ], [ 5, 0.5 ], [ 10, 10 ] ], 1), [ 10, 10 ]);
  t.end();
});

test('clamp', t => {
  t.equal(math.clamp(0.5, 0, 1), 0.5);
  t.equal(math.clamp(1.5, 0, 1), 1);
  t.equal(math.clamp(-1, 0, 1), 0);
  t.equal(math.clamp01(-1), 0);
  t.equal(math.clamp01(2), 1);
  t.end();
});

test('smoothstep', t => {
  t.equal(math.smoothstep(0.0, 0.5, 0.25), 0.5);
  t.end();
});

test('damp', t => {
  t.equal(math.damp(0, 1, 20, 0.1).toFixed(2), '0.86');
  t.equal(math.damp(0, 1, 20, 0.2).toFixed(2), '0.98');
  t.equal(math.damp(1, 0, 20, 0.2).toFixed(2), '0.02');
  t.equal(math.damp(0, 1, 40, 0.1).toFixed(2), '0.98');
  t.deepEqual(math.dampArray([ 2, 0 ], [ 1, 2 ], 20, 0.2).map(n => n.toFixed(2)), [ '1.02', '1.96' ]);
  t.deepEqual(math.dampArray([ 0.25, 0.5 ], [ 1, 1 ], 5, 0.2).map(n => n.toFixed(2)), [ '0.72', '0.82' ]);
  const shared = [];
  t.strictEqual(math.dampArray([ 0.25, 0.5 ], [ 1, 1 ], 5, 0.2, shared), shared);
  t.deepEqual(shared.map(n => n.toFixed(2)), [ '0.72', '0.82' ]);
  t.end();
});

test('mapRange', t => {
  t.equal(math.mapRange(-1, -1, 1, -20, 20, false), -20);
  t.equal(math.mapRange(1, -1, 1, -20, 30, false), 30);
  t.equal(math.mapRange(0, -1, 1, -20, 30, false), 5);
  t.equal(math.mapRange(-2, -1, 1, -20, 20, true), -20);
  t.equal(math.mapRange(-2, -1, 1, -20, 20, false), -40);
  t.equal(math.mapRange(-2, -1, 1, -20, 20), -40);
  t.end();
});

test('expand', t => {
  t.deepEqual(math.expand2D(0.5), [ 0.5, 0.5 ]);
  t.deepEqual(math.expand2D(null, 1), [ 1, 1 ]);
  t.deepEqual(math.expand2D([ null, 0.5 ], 1), [ 1, 0.5 ]);
  t.deepEqual(math.expand2D([ null, 0.5 ]), [ 0, 0.5 ]);
  t.deepEqual(math.expand3D([ 0.25, 0.5 ]), [ 0.25, 0.5, 0 ]);
  t.deepEqual(math.expand4D([ 0.25, 0.5, 0 ], 1), [ 0.25, 0.5, 0, 1 ]);
  t.end();
});
