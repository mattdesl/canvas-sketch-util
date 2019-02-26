const color = require('../color');
const test = require('tape');

test('should include color names', t => {
  t.deepEqual('magenta' in color.names, true);
  t.deepEqual(color.names.tomato, '#ff6347');
  t.end();
});

test('should parse color strings', t => {
  t.deepEqual(color.parse('rgb(255, 0, 0)'), {
    hex: '#ff0000',
    alpha: 1,
    rgb: [ 255, 0, 0 ],
    rgba: [ 255, 0, 0, 1 ],
    hsl: [ 0, 100, 50 ],
    hsla: [ 0, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('rgb(255, 127, 0)'), {
    hex: '#ff7f00',
    alpha: 1,
    rgb: [ 255, 127, 0 ],
    rgba: [ 255, 127, 0, 1 ],
    hsl: [ 30, 100, 50 ],
    hsla: [ 30, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('hsl(340, 100%, 50%)'), {
    hex: '#ff0055',
    alpha: 1,
    rgb: [ 255, 0, 85 ],
    rgba: [ 255, 0, 85, 1 ],
    hsl: [ 340, 100, 50 ],
    hsla: [ 340, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('hsl(390, 100%, 50%)'), {
    hex: '#ff8000',
    alpha: 1,
    rgb: [ 255, 128, 0 ],
    rgba: [ 255, 128, 0, 1 ],
    hsl: [ 30, 100, 50 ],
    hsla: [ 30, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('hsl(30, 100%, 50%)'), {
    hex: '#ff8000',
    alpha: 1,
    rgb: [ 255, 128, 0 ],
    rgba: [ 255, 128, 0, 1 ],
    hsl: [ 30, 100, 50 ],
    hsla: [ 30, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('hsl(30, 100%, 50%, 0.25)'), {
    hex: '#ff800040',
    alpha: 0.25,
    rgb: [ 255, 128, 0 ],
    rgba: [ 255, 128, 0, 0.25 ],
    hsl: [ 30, 100, 50 ],
    hsla: [ 30, 100, 50, 0.25 ]
  });
  t.deepEqual(color.parse('hsla(30, 100%, 50%, 0.25)'), {
    hex: '#ff800040',
    alpha: 0.25,
    rgb: [ 255, 128, 0 ],
    rgba: [ 255, 128, 0, 0.25 ],
    hsl: [ 30, 100, 50 ],
    hsla: [ 30, 100, 50, 0.25 ]
  });
  t.deepEqual(color.parse('red'), {
    hex: '#ff0000',
    alpha: 1,
    rgb: [ 255, 0, 0 ],
    rgba: [ 255, 0, 0, 1 ],
    hsl: [ 0, 100, 50 ],
    hsla: [ 0, 100, 50, 1 ]
  });
  t.deepEqual(color.parse('orangeredblue'), null);
  t.end();
});

test('should parse hex / rgba', t => {
  const { hexToRGBA, RGBAToHex } = color;
  t.deepEqual(hexToRGBA('#ff0000'), [ 255, 0, 0, 1 ]);
  t.deepEqual(hexToRGBA('#aaa'), [ 170, 170, 170, 1 ]);
  t.deepEqual(hexToRGBA('#ggg'), null);
  t.deepEqual(hexToRGBA('aaa'), null);
  t.deepEqual(hexToRGBA('#ff00ff'), [ 255, 0, 255, 1 ]);
  t.deepEqual(hexToRGBA('#ff00ff00'), [ 255, 0, 255, 0 ]);
  t.deepEqual(hexToRGBA('#ff00ffff'), [ 255, 0, 255, 1 ]);
  t.deepEqual(hexToRGBA('#ff0000aa').map(n => n.toFixed(2)), [ '255.00', '0.00', '0.00', '0.67' ]);
  t.deepEqual(hexToRGBA('#ff0000aa').map(n => n.toFixed(2)), [ '255.00', '0.00', '0.00', '0.67' ]);
  t.deepEqual(RGBAToHex([ 255, 0, 0 ]), '#ff0000');
  t.deepEqual(RGBAToHex([ 255, 255, 0 ]), '#ffff00');
  t.deepEqual(RGBAToHex([ 255, 255, 0, 0.5 ]), '#ffff0080');
  t.deepEqual(RGBAToHex([ 255, 255, 0, 1 ]), '#ffff00');
  t.deepEqual(RGBAToHex([ 255, 255, 0, 0 ]), '#ffff0000');
  t.deepEqual(RGBAToHex([ 128, 120.5, 0, 0.25 ]), '#80790040');
  t.end();
});

test('should normalize various input styles', t => {
  t.deepEqual(color.parse('#fff').hex, '#ffffff');
  t.deepEqual(color.parse([ 25, 15, 250, 0.5 ]).rgba, [ 25, 15, 250, 0.5 ]);
  t.deepEqual(color.parse([ 25, 15, 250 ]).rgba, [ 25, 15, 250, 1 ]);
  t.deepEqual(color.parse({ hex: '#aaa' }).rgba, [ 170, 170, 170, 1 ]);
  t.deepEqual(color.parse('#aaa').rgba, [ 170, 170, 170, 1 ]);
  t.deepEqual(color.parse({ rgb: [ 170, 170, 170 ] }).rgba, [ 170, 170, 170, 1 ]);
  t.deepEqual(color.parse({ rgba: [ 170, 170, 170, 0.5 ] }).rgba, [ 170, 170, 170, 0.5 ]);
  t.deepEqual(color.parse('#ff00ff').hsl, [ 300, 100, 50 ]);
  t.deepEqual(color.parse({ hsl: [ 300, 100, 50 ] }).hex, '#ff00ff');
  t.deepEqual(color.parse({ hsla: [ 300, 100, 50, 0.25 ] }).hex, '#ff00ff40');
  t.deepEqual(color.parse('hsl(390, 100%, 50%)').hsl, [ 30, 100, 50 ]);
  t.deepEqual(color.parse('hsla(390, 100%, 50%, 0.5)').hsla, [ 30, 100, 50, 0.5 ]);
  t.end();
});

test('should normalize various inputs into CSS style strings', t => {
  t.deepEqual(color.style('#fff'), 'rgb(255, 255, 255)');
  t.deepEqual(color.style([ 25, 100, 50 ]), 'rgb(25, 100, 50)');
  t.deepEqual(color.style([ 25, 100, 50, 0.35 ]), 'rgba(25, 100, 50, 0.35)');
  t.deepEqual(color.style('red'), 'rgb(255, 0, 0)');
  t.end();
});

test('should get luminance', t => {
  t.deepEqual(color.relativeLuminance('#ff00ff'), 0.2848);
  t.deepEqual(color.relativeLuminance('#fff'), 1);
  t.end();
});

test('should get contrast ratio', t => {
  t.deepEqual(color.contrastRatio('#fff', 'hsl(200,0%,0%)'), 21);
  t.deepEqual(color.contrastRatio('red', 'hsl(200,0%,0%)'), 5.252);
  t.end();
});

test('should offset HSL', t => {
  t.deepEqual(color.offsetHSL('hsl(200, 50%, 45%)', 270, 20, -10).hsl, [ 110, 70, 35 ]);
  t.deepEqual(color.offsetHSL('hsl(200, 50%, 45%)', 42, -100, -100).hsl, [ 242, 0, 0 ]);
  t.deepEqual(color.offsetHSL('hsl(200, 50%, 45%)', 20, 100, 100).hsl, [ 220, 100, 100 ]);
  t.end();
});

test('should blend', t => {
  t.deepEqual(color.blend('black', 'red').hex, '#ff0000');
  t.deepEqual(color.blend('black', 'red', 0.75).hex, '#bf0000');
  t.deepEqual(color.blend('black', 'rgba(255, 0, 0, 0.75)', 0.5).hex, '#600000');

  const layerTop = 'rgba(255, 0, 0, 0.75)';
  const layerBottom = color.blend('white', 'black', 0.5);
  t.deepEqual(color.blend(layerBottom, layerTop, 0.5).hex, '#b05050');

  t.end();
});
