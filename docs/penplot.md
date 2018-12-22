#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `penplot`</sup>

---

### `canvas-sketch-util/penplot`

A set of utilities around pen plotting with the [AxiDraw V3](https://shop.evilmadscientist.com/productsmenu/846). This is ideally used alongside [canvas-sketch](https://github.com/mattdesl/canvas-sketch) CLI tools for exporting SVG files.

### Example

```js
const { polylinesToSVG } = require('canvas-sketch-util/penplot');

// A list of 2D polylines
const polylines = [
  [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
];

// Generate a SVG file as a string
const svg = polylinesToSVG(polylines, {
  width: 2,
  height: 2,
  units: 'cm',
  lineWidth: 0.04
});
```

### Functions

- [polylinesToSVG](#polylinesToSVG)
- [renderPolylines](#renderPolylines)

<a name="polylinesToSVG"></a>

### `svg = polylinesToSVG(lines, opt)`

Generates a physically-sized SVG file as a string from the given list of `lines` (each containing an array of 2D coordinates) with the specified options in `opt`.

Options:

- `units` (defaults to `'px'`) a unit string like `'cm'`, `'px'`, `'in'`, etc
- `width` (required) the width of the resulting output in `units`
- `height` (required) the height of the resulting output in `units`
- `lineWidth` (defaults to 0.03 cm in user `units`) the line width of strokes
- `strokeStyle` (defaults to `'black'`) the color of the strokes
- `precision` (defaults to 5) the decimal precision for floating point numbers as they are converted to strings
- `fillStyle` (defaults to `'none'`) the fill style of SVG path elements

Returns a string of the SVG file.

The SVG is formatted in such a way that it can be easily opened and exported to AxiDraw V3 with Inkscape.

<a name="renderPolylines"></a>

### `layers = renderPolylines(lines, props)`

Renders the specified list of `lines` (each containing an array of 2D coordinates) using the specified `props` (expected to be from `canvas-sketch`), returning an array of renderable layers: `[ canvas, svgOutput ]`.

> :bulb: 
> 
> <sup>This is a convenience function to be used alongside `canvas-sketch`.</sup>

This will render the lines as 2D paths into the canvas context given by `props`, and then convert them into a SVG file. The return value is a list of layers that can be used for exporting both a PNG and SVG file with `canvas-sketch-cli`.

Example:

```js
const canvasSketch = require('canvas-sketch');
const { renderPolylines } = require('canvas-sketch-util/penplot');

const settings = {
  dimensions: 'A4',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = ({ width, height }) => {
  // List of polylines for our pen plot
  let lines = [];

  // ... popupate array with 2D polylines ...

  // Export both PNG and SVG files on 'Cmd + S'
  return props => renderPolylines(lines, props);
};

canvasSketch(sketch, settings);
```

You can also override settings such as `lineWidth` or `strokeStyle` if you want a different SVG output:

```js
const sketch = ({ width, height }) => {
  // ...
  return props => renderPolylines(lines, {
    ...props,
    lineWidth: 0.05
  });
};
```

Full list of expected props:

- `context` (required) The canvas context
- `units` The units of the artwork
- `width` (required) the width of the artwork in `units`
- `height` (required) the width of the artwork in `units`
- `background` The background `fillStyle` for 2D canvas, default `'white'`
- `foreground` The foreground `strokeStyle` applied only to the 2D canvas, defaults to `'black'` (use this if you wish to have a white stroke on black PNG, but still a black stroke SVG)
- Other properties passed into `polylinesToSVG` function

## 

#### <sup>[← Back to Documentation](./README.md)