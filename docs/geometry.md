#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `geometry`</sup>

---

### `canvas-sketch-util/geometry`

A set of utilities around geometry and shapes, typically for 2D and 3D rendering.

### Example

```js
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

// A list of 2D polylines
const polylines = [
  [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
];

// A bounding box in 2D of our surface area
const margin = 0.5;
const box = [
  margin, margin, pageWidth - margin, pageHeight - margin
]

// Clip the lines to the bounding box
const clipped = clipLinesToBox(polylines, box)
```

### Functions

- [clipPolylinesToBox](#clipPolylinesToBox)

<a name="clipPolylinesToBox"></a>

### `newLines = clipPolylinesToBox(lines, box, border = false, closeLines = true)`

Clips the 2D `lines` list (each containing an array of 2D coordinates) to a 2D bounding box, defined by `[ minX, minY, maxX, maxY ]`. If you specify `border` as true, you will end up with a border line around the clipped bounding box. If you specify `closeLines` as false, paths will not be closed by default, i.e. you will have to close them during rendering.

The return value, `newLines`, is a new list of polylines that has been clipped.

## 

#### <sup>[← Back to Documentation](./README.md)