const { EOL } = require('os');
const buble = require('buble');

module.exports = function (sourceCode, opt = {}) {
  const sourcemap = opt.sourcemap || 'inline';
  let { code, map } = buble.transform(sourceCode, Object.assign({
    sourcemap: Boolean(sourcemap),
    transforms: {
      modules: false
    },
    objectAssign: 'Object.assign'
  }, opt));

  if (sourceCode !== code && sourcemap && map && sourcemap === 'inline') {
    code += `${EOL}//# sourceMappingURL=${map.toUrl()}`;
  }

  return { code, map };
};
