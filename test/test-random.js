const test = require('tape');
const random = require('../random');
const index = require('../');

test('should have random functions', t => {
  t.notEqual(typeof index.random, 'undefined');
  t.notEqual(typeof random, 'undefined');
  t.end();
});

test('value', t => {
  t.equal(typeof random.value(), 'number');
  t.equal(typeof random.getSeed(), 'undefined');

  random.setSeed(250);
  t.equal(random.getSeed(250), 250);

  t.equal(random.value().toFixed(2), '0.35');
  random.setSeed(251);
  t.equal(random.value().toFixed(2), '0.29');
  random.setSeed(250);
  t.equal(random.value().toFixed(2), '0.35');
  t.notEqual(random.valueNonZero(), 0);
  t.equal(random.noise1D(0.5).toFixed(2), '-0.51');
  t.equal(random.noise2D(0.5, 0.5).toFixed(2), '0.31');
  t.equal(random.noise3D(0.75, 0.5, 0.5).toFixed(2), '0.64');
  t.equal(random.noise4D(0.25, 0.5, 0.5, 0.5).toFixed(2), '-0.13');
  t.throws(() => random.noise4D(0.25, 0.5, 0.5));
  t.equal(random.sign(), -1);
  t.equal(random.boolean(), true);
  t.equal(random.chance(0.5), false);
  t.equal(random.chance(1), true);
  t.equal(random.range(0, 5).toFixed(2), '4.73');
  t.equal(random.rangeFloor(1, 5), 1);
  t.equal(random.rangeFloor(100), 31);
  t.equal(random.pick([ 'a', 'b', 'c' ]), 'a');
  t.deepEqual(random.shuffle([ 'a', 'b', 'c' ]), [ 'c', 'a', 'b' ]);

  const radius = 4;
  let result = random.onCircle(radius);
  t.equal(result.length, 2);
  t.ok(result.every(n => {
    return typeof n === 'number' && n <= radius;
  }));

  result = random.insideCircle(radius);
  t.equal(result.length, 2);
  t.ok(result.every(n => {
    return typeof n === 'number' && n <= radius;
  }));

  result = random.onSphere(radius);
  t.equal(result.length, 3);
  t.ok(result.every(n => {
    return typeof n === 'number' && n <= radius;
  }));

  result = random.insideSphere(radius);
  t.equal(result.length, 3);
  t.ok(result.every(n => {
    return typeof n === 'number' && n <= radius;
  }));

  t.deepEqual(random.quaternion().map(n => n.toFixed(2)), [
    '-0.89', '-0.10', '-0.44', '0.01'
  ]);

  t.deepEqual(random.weighted([ 0, 100, 50 ]), 1);
  t.deepEqual(random.weightedSet([
    { value: 'a', weight: 10000 },
    { value: 'b', weight: 100 },
    { value: 'c', weight: 50 }
  ]), 'a');
  t.deepEqual(random.weightedSetIndex([
    { value: 'a', weight: 10 },
    { value: 'b', weight: 10000 },
    { value: 'c', weight: 50 }
  ]), 1);

  let g = random.gaussian(0, 1);
  t.ok(g >= -3 & g <= 3);

  g = random.gaussian(0, 30);
  t.ok(g >= -60 & g <= 60);

  random.setSeed(256);
  const a = [ random.value(), random.value() ];
  t.deepEqual(a.map(n => n.toFixed(2)), [ '0.27', '0.38' ]);

  random.setSeed(256);
  const b = [ random.value(), random.value() ];
  t.deepEqual(b.map(n => n.toFixed(2)), [ '0.27', '0.38' ]);

  random.setSeed(null);
  const c = [ random.value(), random.value() ];
  t.notDeepEqual(c.map(n => n.toFixed(2)), [ '0.27', '0.38' ]);

  const instance = random.createRandom();
  t.deepEqual(typeof instance.getSeed(), 'undefined');

  const instance2 = instance.createRandom(256);
  t.deepEqual(instance2.getSeed(), 256);

  const instance3 = random.createRandom(256);
  t.deepEqual(instance3.getSeed(), 256);
  t.end();
});
