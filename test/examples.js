const math = require('../math');
const random = require('../random');

// Linear interpolation
console.log(math.lerp(0, 50, 0.5)); // -> 25

// Random between 0..1
console.log(random.value());

// Random between min..max
console.log(random.range(20, 30));

// Random point inside a 2D unit circle
const [ x, y ] = random.insideCircle();

// Random 2D Simplex noise
console.log(random.noise2D(x, y));

// Randomly shuffles a shallow copy of the array
console.log(random.shuffle([ 'a', 'b', 'c' ]));

// Deterministic randomness
const seed = 200;
const seeded = random.createRandom(seed);
console.log(seeded.range(10, 30), seeded.value());

// Weighted random color palette
console.log(random.weightedSet([
  { value: '#ff0000', weight: 1000 },
  { value: 'blue', weight: 250 },
  { value: 'green', weight: 500 }
]));

// Random Gaussian distribution for less uniform randomness
console.log(random.gaussian());
