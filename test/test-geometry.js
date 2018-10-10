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
