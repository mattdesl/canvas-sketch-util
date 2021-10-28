import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';


const config = {
  input: './src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'canvasSketchUtil',
  },
  plugins: [
    commonjs(), // To use CommonJS syntax
    resolve(),  // To locate 3rd party modules in node_modules
    json(),     // To import json
 // terser(),   // To minify your bundle
  ],
};

// Set the environment variable before you run the build command:
// > NODE_ENV=production npm run build
if (process.env.NODE_ENV === 'production') {
  config.plugins.push(terser());
}

export default config;