const transform = require('./transform');
const concat = require('concat-stream');
const duplexer = require('duplexer2');
const through = require('through2');
const path = require('path');
const { PassThrough } = require('stream');

const createBubleify = (opt = {}) => {
  const extensions = [ '.js', '.jsx', '.es', '.es6' ];
  return (file) => {
    const ext = path.extname(file).toLowerCase();
    if (!extensions.includes(ext)) return PassThrough();

    const output = through();
    return duplexer(concat(buffer => {
      try {
        const { code } = transform(buffer.toString(), Object.assign({}, opt, {
          sourcemap: opt.sourcemap ? 'inline' : false,
          file: file,
          source: file
        }));
        output.push(code);
      } catch (err) {
        output.emit('error', err);
      }
      output.push(null);
    }), output);
  };
};

module.exports = createBubleify({ sourcemap: 'inline' });
