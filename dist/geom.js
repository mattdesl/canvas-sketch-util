var Random = require('./random');
var euclideanDistance = require('euclidean-distance');
var ref = require('gl-matrix');
var vec2 = ref.vec2;
var vec3 = ref.vec3;
var lineclip = require('lineclip');
var arrayAlmostEqual = require('array-almost-equal');
var triangleCentroid = require('triangle-centroid');
var insideTriangle = require('point-in-triangle');

var tmp1 = [];
var tmp2 = [];
var tmpTriangle = [ 0, 0, 0 ];

// Random point in N-dimensional triangle
module.exports.randomPointInTriangle = function (out, a, b, c, u, v) {
  if ( out === void 0 ) out = [];
  if ( u === void 0 ) u = Random.value();
  if ( v === void 0 ) v = Random.value();

  if ((u + v) > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  var dim = a.length;
  var Q = 1 - u - v;
  for (var i = 0; i < dim; i++) {
    out[i] = (a[i] * u) + (b[i] * v) + (c[i] * Q);
  }
  return out;
};

module.exports.getPolylinePerimeter = function (points, closed) {
  if ( closed === void 0 ) closed = false;

  var perimeter = 0;
  var lastPosition = points.length - 1;
  for (var i = 0; i < lastPosition; i++) {
    perimeter += euclideanDistance(points[i], points[i + 1]);
  }
  if (closed && points.length > 1) {
    perimeter += euclideanDistance(points[points.length - 1], points[0]);
  }
  return perimeter;
};

module.exports.getPolylineArclengths = function (path) {
  var totalDistance = 0;
  var distances = [];
  for (var i = 0; i < path.length; i++) {
    if (i > 0) {
      var last = path[i - 1];
      var cur = path[i];
      totalDistance += euclideanDistance(last, cur);
    }
    distances.push(totalDistance);
  }
  for (var i$1 = 0; i$1 < distances.length; i$1++) {
    distances[i$1] /= totalDistance;
  }
  return distances;
};

module.exports.resampleLineBySpacing = function (points, spacing, closed) {
  if ( spacing === void 0 ) spacing = 1;
  if ( closed === void 0 ) closed = false;

  if (spacing <= 0) {
    throw new Error('Spacing must be positive and larger than 0');
  }
  var totalLength = 0;
  var curStep = 0;
  var lastPosition = points.length - 1;
  if (closed) {
    lastPosition++;
  }
  var result = [];
  var tmp = [ 0, 0 ];
  for (var i = 0; i < lastPosition; i++) {
    var repeatNext = i === points.length - 1;
    var cur = points[i];
    var next = repeatNext ? points[0] : points[i + 1];
    var diff = vec2.subtract(tmp, next, cur);

    var curSegmentLength = vec2.length(diff);
    totalLength += curSegmentLength;

    while (curStep * spacing <= totalLength) {
      var curSample = curStep * spacing;
      var curLength = curSample - (totalLength - curSegmentLength);
      var relativeSample = curLength / curSegmentLength;
      result.push(vec2.lerp([], cur, next, relativeSample));
      curStep++;
    }
  }
  return result;
}

module.exports.resampleLineByCount = function (points, count, closed) {
  if ( count === void 0 ) count = 1;
  if ( closed === void 0 ) closed = false;

  if (count <= 0) { return []; }
  var perimeter = module.exports.getPolylinePerimeter(points, closed);
  return module.exports.resampleLineBySpacing(points, perimeter / count, closed);
}

// Returns a list that is a cubic spline of the input points
// This function could probably be optimized for real-time a bit better
module.exports.cubicSpline = function (points, tension, segments, closed) {
  if ( tension === void 0 ) tension = 0.5;
  if ( segments === void 0 ) segments = 25;
  if ( closed === void 0 ) closed = false;

  // unroll pairs into flat array
  points = points.reduce(function (a, b) { return a.concat(b); }, []);

  var pts; // for cloning point array
  var i = 1;
  var l = points.length;
  var rPos = 0;
  var rLen = (l - 2) * segments + 2 + (closed ? 2 * segments : 0);
  var res = new Float32Array(rLen);
  var cache = new Float32Array((segments + 2) * 4);
  var cachePtr = 4;
  var st, st2, st3, st23, st32, parse;

  pts = points.slice(0);
  if (closed) {
    pts.unshift(points[l - 1]); // insert end point as first point
    pts.unshift(points[l - 2]);
    pts.push(points[0], points[1]); // first point as last point
  } else {
    pts.unshift(points[1]); // copy 1. point and insert at beginning
    pts.unshift(points[0]);
    pts.push(points[l - 2], points[l - 1]); // duplicate end-points
  }
  // cache inner-loop calculations as they are based on t alone
  cache[0] = 1; // 1,0,0,0
  for (; i < segments; i++) {
    st = i / segments;
    st2 = st * st;
    st3 = st2 * st;
    st23 = st3 * 2;
    st32 = st2 * 3;
    cache[cachePtr++] = st23 - st32 + 1; // c1
    cache[cachePtr++] = st32 - st23; // c2
    cache[cachePtr++] = st3 - 2 * st2 + st; // c3
    cache[cachePtr++] = st3 - st2; // c4
  }
  cache[++cachePtr] = 1; // 0,1,0,0

  parse = function (pts, cache, l) {
    var i = 2;
    var t, pt1, pt2, pt3, pt4, t1x, t1y, t2x, t2y, c, c1, c2, c3, c4;

    for (i; i < l; i += 2) {
      pt1 = pts[i];
      pt2 = pts[i + 1];
      pt3 = pts[i + 2];
      pt4 = pts[i + 3];
      t1x = (pt3 - pts[i - 2]) * tension;
      t1y = (pt4 - pts[i - 1]) * tension;
      t2x = (pts[i + 4] - pt1) * tension;
      t2y = (pts[i + 5] - pt2) * tension;
      for (t = 0; t < segments; t++) {
        // t * 4
        c = t << 2; // jshint ignore: line
        c1 = cache[c];
        c2 = cache[c + 1];
        c3 = cache[c + 2];
        c4 = cache[c + 3];

        res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
        res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
      }
    }
  };

  // calc. points
  parse(pts, cache, l);

  if (closed) {
    // l = points.length
    pts = [];
    pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
    pts.push(points[0], points[1], points[2], points[3]); // first and second
    parse(pts, cache, 4);
  }
  // add last point
  l = closed ? 0 : points.length - 2;
  res[rPos++] = points[l];
  res[rPos] = points[l + 1];

  // roll back up into pairs
  var rolled = [];
  for (var i$1 = 0; i$1 < res.length / 2; i$1++) {
    rolled.push([ res[i$1 * 2 + 0], res[i$1 * 2 + 1] ]);
  }
  return rolled;
};

module.exports.intersectLineSegmentLineSegment = intersectLineSegmentLineSegment;
function intersectLineSegmentLineSegment (p1, p2, p3, p4) {
  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  var d21x = p2[0] - p1[0];
  var d21y = p2[1] - p1[1];
  var d43x = p4[0] - p3[0];
  var d43y = p4[1] - p3[1];

  // denominator
  var d = d21x * d43y - d21y * d43x;
  if (d === 0) { return -1; }

  var nb = (p1[1] - p3[1]) * d21x - (p1[0] - p3[0]) * d21y;
  var sb = nb / d;
  if (sb < 0 || sb > 1) { return -1; }

  var na = (p1[1] - p3[1]) * d43x - (p1[0] - p3[0]) * d43y;
  var sa = na / d;
  if (sa < 0 || sa > 1) { return -1; }
  return sa;
}

var FaceCull = {
  BACK: -1,
  FRONT: 1,
  NONE: 0
};
module.exports.FaceCull = FaceCull;

module.exports.isTriangleVisible = isTriangleVisible;
function isTriangleVisible (cell, vertices, rayDir, side) {
  if ( side === void 0 ) side = FaceCull.BACK;

  if (side === FaceCull.NONE) { return true; }
  var verts = cell.map(function (i) { return vertices[i]; });
  var v0 = verts[0];
  var v1 = verts[1];
  var v2 = verts[2];
  vec3.subtract(tmp1, v1, v0);
  vec3.subtract(tmp2, v2, v0);
  vec3.cross(tmp1, tmp1, tmp2);
  vec3.normalize(tmp1, tmp1);
  var d = vec3.dot(rayDir, tmp1);
  return side === FaceCull.BACK ? d > 0 : d <= 0;
}

// Whether the 3D triangle face is visible to the camera
// i.e. backface / frontface culling
module.exports.isFaceVisible = isFaceVisible;
function isFaceVisible (cell, vertices, rayDir, side) {
  if ( side === void 0 ) side = FaceCull.BACK;

  if (side === FaceCull.NONE) { return true; }
  if (cell.length === 3) {
    return isTriangleVisible(cell, vertices, rayDir, side);
  }
  if (cell.length !== 4) { throw new Error('isFaceVisible can only handle triangles and quads'); }
};

module.exports.clipPolylinesToBox = clipPolylinesToBox;
function clipPolylinesToBox (polylines, bbox, border, closeLines) {
  if ( border === void 0 ) border = false;
  if ( closeLines === void 0 ) closeLines = true;

  if (border) {
    return polylines.map(function (line) {
      var result = lineclip.polygon(line, bbox);
      if (closeLines && result.length > 2) { result.push(result[0]); }
      return result;
    }).filter(function (lines) { return lines.length > 0; });
  } else {
    return polylines.map(function (line) {
      return lineclip.polyline(line, bbox);
    }).reduce(function (a, b) { return a.concat(b); }, []);
  }
}

// Normal of a 3D triangle face
module.exports.computeFaceNormal = computeFaceNormal;
function computeFaceNormal (cell, positions, out) {
  if ( out === void 0 ) out = [];

  var a = positions[cell[0]];
  var b = positions[cell[1]];
  var c = positions[cell[2]];
  vec3.subtract(out, c, b);
  vec3.subtract(tmp2, a, b);
  vec3.cross(out, out, tmp2);
  vec3.normalize(out, out);
  return out;
}

// Area of 2D or 3D triangle
module.exports.computeTriangleArea = computeTriangleArea;
function computeTriangleArea (a, b, c) {
  if (a.length >= 3 && b.length >= 3 && c.length >= 3) {
    vec3.subtract(tmp1, c, b);
    vec3.subtract(tmp2, a, b);
    vec3.cross(tmp1, tmp1, tmp2);
    return vec3.length(tmp1) * 0.5;
  } else {
    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1])) * 0.5;
  }
}

module.exports.createHatchLines = createHatchLines;
function createHatchLines (bounds, angle, spacing, out) {
  if ( angle === void 0 ) angle = -Math.PI / 4;
  if ( spacing === void 0 ) spacing = 0.5;
  if ( out === void 0 ) out = [];

  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  spacing = Math.abs(spacing);
  if (spacing === 0) { throw new Error('cannot use a spacing of zero as it will run an infinite loop!'); }

  var xmin = bounds[0][0];
  var ymin = bounds[0][1];
  var xmax = bounds[1][0];
  var ymax = bounds[1][1];

  var w = xmax - xmin;
  var h = ymax - ymin;
  if (w === 0 || h === 0) { return out; }
  var r = Math.sqrt(w * w + h * h) / 2;
  var rotAngle = Math.PI / 2 - angle;
  var ca = Math.cos(rotAngle);
  var sa = Math.sin(rotAngle);
  var cx = bounds[0][0] + (w / 2);
  var cy = bounds[0][1] + (h / 2);
  var i = -r;
  while (i <= r) {
    // Line starts at (i, -r) and goes to (i, +r)
    var x1 = cx + (i * ca) + (r * sa); //  i * ca - (-r) * sa
    var y1 = cy + (i * sa) - (r * ca); //  i * sa + (-r) * ca
    var x2 = cx + (i * ca) - (r * sa); //  i * ca - (+r) * sa
    var y2 = cy + (i * sa) + (r * ca); //  i * sa + (+r) * ca
    i += spacing;
    // Remove any potential hatch lines which are entirely
    // outside of the bounding box
    if ((x1 < xmin && x2 < xmin) || (x1 > xmax && x2 > xmax)) {
      continue;
    }
    if ((y1 < ymin && y2 < ymin) || (y1 > ymax && y2 > ymax)) {
      continue;
    }
    out.push([ [ x1, y1 ], [ x2, y2 ] ]);
  }
  return out;
}

module.exports.expandTriangle = expandTriangle;
function expandTriangle (triangle, border) {
  if ( border === void 0 ) border = 0;

  if (border === 0) { return triangle; }
  var centroid = triangleCentroid(triangle);
  triangle[0] = expandVector(triangle[0], centroid, border);
  triangle[1] = expandVector(triangle[1], centroid, border);
  triangle[2] = expandVector(triangle[2], centroid, border);
  return triangle;
}

module.exports.expandVector = expandVector;
function expandVector (point, centroid, amount) {
  if ( amount === void 0 ) amount = 0;

  point = vec2.copy([], point);
  var dir = vec2.subtract([], centroid, point);
  var maxLen = vec2.length(dir);
  var len = Math.min(maxLen, amount);
  if (maxLen !== 0) { vec2.scale(dir, dir, 1 / maxLen); } // normalize
  vec2.scaleAndAdd(point, point, dir, len);
  return point;
}

module.exports.clipLineToTriangle = clipLineToTriangle;
function clipLineToTriangle (p1, p2, a, b, c, border, result) {
  if ( border === void 0 ) border = 0;
  if ( result === void 0 ) result = [];

  if (border !== 0) {
    var centroid = triangleCentroid([ a, b, c ]);
    a = expandVector(a, centroid, border);
    b = expandVector(b, centroid, border);
    c = expandVector(c, centroid, border);
  }

  // first check if all points are inside triangle
  tmpTriangle[0] = a;
  tmpTriangle[1] = b;
  tmpTriangle[2] = c;
  if (insideTriangle(p1, tmpTriangle) && insideTriangle(p2, tmpTriangle)) {
    result[0] = p1.slice();
    result[1] = p2.slice();
    return true;
  }

  // triangle segments
  var segments = [
    [ a, b ],
    [ b, c ],
    [ c, a ]
  ];

  for (var i = 0; i < 3; i++) {
    // test against each triangle edge
    var segment = segments[i];
    var p3 = segment[0];
    var p4 = segment[1];

    var fract = intersectLineSegmentLineSegment(p1, p2, p3, p4);
    if (fract >= 0 && fract <= 1) {
      result.push([
        p1[0] + fract * (p2[0] - p1[0]),
        p1[1] + fract * (p2[1] - p1[1])
      ]);
      // when we have 2 result we can stop checking
      if (result.length >= 2) { break; }
    }
  }

  if (arrayAlmostEqual(result[0], result[1])) {
    // if the two points are close enough they are basically
    // touching, or if the border pushed them close together,
    // then ignore this altogether
    result.length = 0;
  }

  return result.length === 2;
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2dlb20uanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUmFuZG9tID0gcmVxdWlyZSgnLi9yYW5kb20nKTtcbmNvbnN0IGV1Y2xpZGVhbkRpc3RhbmNlID0gcmVxdWlyZSgnZXVjbGlkZWFuLWRpc3RhbmNlJyk7XG5jb25zdCB7IHZlYzIsIHZlYzMgfSA9IHJlcXVpcmUoJ2dsLW1hdHJpeCcpO1xuY29uc3QgbGluZWNsaXAgPSByZXF1aXJlKCdsaW5lY2xpcCcpO1xuY29uc3QgYXJyYXlBbG1vc3RFcXVhbCA9IHJlcXVpcmUoJ2FycmF5LWFsbW9zdC1lcXVhbCcpO1xuY29uc3QgdHJpYW5nbGVDZW50cm9pZCA9IHJlcXVpcmUoJ3RyaWFuZ2xlLWNlbnRyb2lkJyk7XG5jb25zdCBpbnNpZGVUcmlhbmdsZSA9IHJlcXVpcmUoJ3BvaW50LWluLXRyaWFuZ2xlJyk7XG5cbmNvbnN0IHRtcDEgPSBbXTtcbmNvbnN0IHRtcDIgPSBbXTtcbmNvbnN0IHRtcFRyaWFuZ2xlID0gWyAwLCAwLCAwIF07XG5cbi8vIFJhbmRvbSBwb2ludCBpbiBOLWRpbWVuc2lvbmFsIHRyaWFuZ2xlXG5tb2R1bGUuZXhwb3J0cy5yYW5kb21Qb2ludEluVHJpYW5nbGUgPSAob3V0ID0gW10sIGEsIGIsIGMsIHUgPSBSYW5kb20udmFsdWUoKSwgdiA9IFJhbmRvbS52YWx1ZSgpKSA9PiB7XG4gIGlmICgodSArIHYpID4gMSkge1xuICAgIHUgPSAxIC0gdTtcbiAgICB2ID0gMSAtIHY7XG4gIH1cbiAgY29uc3QgZGltID0gYS5sZW5ndGg7XG4gIGNvbnN0IFEgPSAxIC0gdSAtIHY7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltOyBpKyspIHtcbiAgICBvdXRbaV0gPSAoYVtpXSAqIHUpICsgKGJbaV0gKiB2KSArIChjW2ldICogUSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmdldFBvbHlsaW5lUGVyaW1ldGVyID0gKHBvaW50cywgY2xvc2VkID0gZmFsc2UpID0+IHtcbiAgbGV0IHBlcmltZXRlciA9IDA7XG4gIGxldCBsYXN0UG9zaXRpb24gPSBwb2ludHMubGVuZ3RoIC0gMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0UG9zaXRpb247IGkrKykge1xuICAgIHBlcmltZXRlciArPSBldWNsaWRlYW5EaXN0YW5jZShwb2ludHNbaV0sIHBvaW50c1tpICsgMV0pO1xuICB9XG4gIGlmIChjbG9zZWQgJiYgcG9pbnRzLmxlbmd0aCA+IDEpIHtcbiAgICBwZXJpbWV0ZXIgKz0gZXVjbGlkZWFuRGlzdGFuY2UocG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXSwgcG9pbnRzWzBdKTtcbiAgfVxuICByZXR1cm4gcGVyaW1ldGVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMuZ2V0UG9seWxpbmVBcmNsZW5ndGhzID0gKHBhdGgpID0+IHtcbiAgbGV0IHRvdGFsRGlzdGFuY2UgPSAwO1xuICBjb25zdCBkaXN0YW5jZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPiAwKSB7XG4gICAgICBjb25zdCBsYXN0ID0gcGF0aFtpIC0gMV07XG4gICAgICBjb25zdCBjdXIgPSBwYXRoW2ldO1xuICAgICAgdG90YWxEaXN0YW5jZSArPSBldWNsaWRlYW5EaXN0YW5jZShsYXN0LCBjdXIpO1xuICAgIH1cbiAgICBkaXN0YW5jZXMucHVzaCh0b3RhbERpc3RhbmNlKTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgIGRpc3RhbmNlc1tpXSAvPSB0b3RhbERpc3RhbmNlO1xuICB9XG4gIHJldHVybiBkaXN0YW5jZXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5yZXNhbXBsZUxpbmVCeVNwYWNpbmcgPSAocG9pbnRzLCBzcGFjaW5nID0gMSwgY2xvc2VkID0gZmFsc2UpID0+IHtcbiAgaWYgKHNwYWNpbmcgPD0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignU3BhY2luZyBtdXN0IGJlIHBvc2l0aXZlIGFuZCBsYXJnZXIgdGhhbiAwJyk7XG4gIH1cbiAgbGV0IHRvdGFsTGVuZ3RoID0gMDtcbiAgbGV0IGN1clN0ZXAgPSAwO1xuICBsZXQgbGFzdFBvc2l0aW9uID0gcG9pbnRzLmxlbmd0aCAtIDE7XG4gIGlmIChjbG9zZWQpIHtcbiAgICBsYXN0UG9zaXRpb24rKztcbiAgfVxuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgY29uc3QgdG1wID0gWyAwLCAwIF07XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGFzdFBvc2l0aW9uOyBpKyspIHtcbiAgICBjb25zdCByZXBlYXROZXh0ID0gaSA9PT0gcG9pbnRzLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgY3VyID0gcG9pbnRzW2ldO1xuICAgIGNvbnN0IG5leHQgPSByZXBlYXROZXh0ID8gcG9pbnRzWzBdIDogcG9pbnRzW2kgKyAxXTtcbiAgICBjb25zdCBkaWZmID0gdmVjMi5zdWJ0cmFjdCh0bXAsIG5leHQsIGN1cik7XG5cbiAgICBsZXQgY3VyU2VnbWVudExlbmd0aCA9IHZlYzIubGVuZ3RoKGRpZmYpO1xuICAgIHRvdGFsTGVuZ3RoICs9IGN1clNlZ21lbnRMZW5ndGg7XG5cbiAgICB3aGlsZSAoY3VyU3RlcCAqIHNwYWNpbmcgPD0gdG90YWxMZW5ndGgpIHtcbiAgICAgIGxldCBjdXJTYW1wbGUgPSBjdXJTdGVwICogc3BhY2luZztcbiAgICAgIGxldCBjdXJMZW5ndGggPSBjdXJTYW1wbGUgLSAodG90YWxMZW5ndGggLSBjdXJTZWdtZW50TGVuZ3RoKTtcbiAgICAgIGxldCByZWxhdGl2ZVNhbXBsZSA9IGN1ckxlbmd0aCAvIGN1clNlZ21lbnRMZW5ndGg7XG4gICAgICByZXN1bHQucHVzaCh2ZWMyLmxlcnAoW10sIGN1ciwgbmV4dCwgcmVsYXRpdmVTYW1wbGUpKTtcbiAgICAgIGN1clN0ZXArKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMucmVzYW1wbGVMaW5lQnlDb3VudCA9IChwb2ludHMsIGNvdW50ID0gMSwgY2xvc2VkID0gZmFsc2UpID0+IHtcbiAgaWYgKGNvdW50IDw9IDApIHJldHVybiBbXTtcbiAgY29uc3QgcGVyaW1ldGVyID0gbW9kdWxlLmV4cG9ydHMuZ2V0UG9seWxpbmVQZXJpbWV0ZXIocG9pbnRzLCBjbG9zZWQpO1xuICByZXR1cm4gbW9kdWxlLmV4cG9ydHMucmVzYW1wbGVMaW5lQnlTcGFjaW5nKHBvaW50cywgcGVyaW1ldGVyIC8gY291bnQsIGNsb3NlZCk7XG59XG5cbi8vIFJldHVybnMgYSBsaXN0IHRoYXQgaXMgYSBjdWJpYyBzcGxpbmUgb2YgdGhlIGlucHV0IHBvaW50c1xuLy8gVGhpcyBmdW5jdGlvbiBjb3VsZCBwcm9iYWJseSBiZSBvcHRpbWl6ZWQgZm9yIHJlYWwtdGltZSBhIGJpdCBiZXR0ZXJcbm1vZHVsZS5leHBvcnRzLmN1YmljU3BsaW5lID0gKHBvaW50cywgdGVuc2lvbiA9IDAuNSwgc2VnbWVudHMgPSAyNSwgY2xvc2VkID0gZmFsc2UpID0+IHtcbiAgLy8gdW5yb2xsIHBhaXJzIGludG8gZmxhdCBhcnJheVxuICBwb2ludHMgPSBwb2ludHMucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiKSwgW10pO1xuXG4gIHZhciBwdHM7IC8vIGZvciBjbG9uaW5nIHBvaW50IGFycmF5XG4gIHZhciBpID0gMTtcbiAgdmFyIGwgPSBwb2ludHMubGVuZ3RoO1xuICB2YXIgclBvcyA9IDA7XG4gIHZhciByTGVuID0gKGwgLSAyKSAqIHNlZ21lbnRzICsgMiArIChjbG9zZWQgPyAyICogc2VnbWVudHMgOiAwKTtcbiAgdmFyIHJlcyA9IG5ldyBGbG9hdDMyQXJyYXkockxlbik7XG4gIHZhciBjYWNoZSA9IG5ldyBGbG9hdDMyQXJyYXkoKHNlZ21lbnRzICsgMikgKiA0KTtcbiAgdmFyIGNhY2hlUHRyID0gNDtcbiAgdmFyIHN0LCBzdDIsIHN0Mywgc3QyMywgc3QzMiwgcGFyc2U7XG5cbiAgcHRzID0gcG9pbnRzLnNsaWNlKDApO1xuICBpZiAoY2xvc2VkKSB7XG4gICAgcHRzLnVuc2hpZnQocG9pbnRzW2wgLSAxXSk7IC8vIGluc2VydCBlbmQgcG9pbnQgYXMgZmlyc3QgcG9pbnRcbiAgICBwdHMudW5zaGlmdChwb2ludHNbbCAtIDJdKTtcbiAgICBwdHMucHVzaChwb2ludHNbMF0sIHBvaW50c1sxXSk7IC8vIGZpcnN0IHBvaW50IGFzIGxhc3QgcG9pbnRcbiAgfSBlbHNlIHtcbiAgICBwdHMudW5zaGlmdChwb2ludHNbMV0pOyAvLyBjb3B5IDEuIHBvaW50IGFuZCBpbnNlcnQgYXQgYmVnaW5uaW5nXG4gICAgcHRzLnVuc2hpZnQocG9pbnRzWzBdKTtcbiAgICBwdHMucHVzaChwb2ludHNbbCAtIDJdLCBwb2ludHNbbCAtIDFdKTsgLy8gZHVwbGljYXRlIGVuZC1wb2ludHNcbiAgfVxuICAvLyBjYWNoZSBpbm5lci1sb29wIGNhbGN1bGF0aW9ucyBhcyB0aGV5IGFyZSBiYXNlZCBvbiB0IGFsb25lXG4gIGNhY2hlWzBdID0gMTsgLy8gMSwwLDAsMFxuICBmb3IgKDsgaSA8IHNlZ21lbnRzOyBpKyspIHtcbiAgICBzdCA9IGkgLyBzZWdtZW50cztcbiAgICBzdDIgPSBzdCAqIHN0O1xuICAgIHN0MyA9IHN0MiAqIHN0O1xuICAgIHN0MjMgPSBzdDMgKiAyO1xuICAgIHN0MzIgPSBzdDIgKiAzO1xuICAgIGNhY2hlW2NhY2hlUHRyKytdID0gc3QyMyAtIHN0MzIgKyAxOyAvLyBjMVxuICAgIGNhY2hlW2NhY2hlUHRyKytdID0gc3QzMiAtIHN0MjM7IC8vIGMyXG4gICAgY2FjaGVbY2FjaGVQdHIrK10gPSBzdDMgLSAyICogc3QyICsgc3Q7IC8vIGMzXG4gICAgY2FjaGVbY2FjaGVQdHIrK10gPSBzdDMgLSBzdDI7IC8vIGM0XG4gIH1cbiAgY2FjaGVbKytjYWNoZVB0cl0gPSAxOyAvLyAwLDEsMCwwXG5cbiAgcGFyc2UgPSBmdW5jdGlvbiAocHRzLCBjYWNoZSwgbCkge1xuICAgIHZhciBpID0gMjtcbiAgICB2YXIgdCwgcHQxLCBwdDIsIHB0MywgcHQ0LCB0MXgsIHQxeSwgdDJ4LCB0MnksIGMsIGMxLCBjMiwgYzMsIGM0O1xuXG4gICAgZm9yIChpOyBpIDwgbDsgaSArPSAyKSB7XG4gICAgICBwdDEgPSBwdHNbaV07XG4gICAgICBwdDIgPSBwdHNbaSArIDFdO1xuICAgICAgcHQzID0gcHRzW2kgKyAyXTtcbiAgICAgIHB0NCA9IHB0c1tpICsgM107XG4gICAgICB0MXggPSAocHQzIC0gcHRzW2kgLSAyXSkgKiB0ZW5zaW9uO1xuICAgICAgdDF5ID0gKHB0NCAtIHB0c1tpIC0gMV0pICogdGVuc2lvbjtcbiAgICAgIHQyeCA9IChwdHNbaSArIDRdIC0gcHQxKSAqIHRlbnNpb247XG4gICAgICB0MnkgPSAocHRzW2kgKyA1XSAtIHB0MikgKiB0ZW5zaW9uO1xuICAgICAgZm9yICh0ID0gMDsgdCA8IHNlZ21lbnRzOyB0KyspIHtcbiAgICAgICAgLy8gdCAqIDRcbiAgICAgICAgYyA9IHQgPDwgMjsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuICAgICAgICBjMSA9IGNhY2hlW2NdO1xuICAgICAgICBjMiA9IGNhY2hlW2MgKyAxXTtcbiAgICAgICAgYzMgPSBjYWNoZVtjICsgMl07XG4gICAgICAgIGM0ID0gY2FjaGVbYyArIDNdO1xuXG4gICAgICAgIHJlc1tyUG9zKytdID0gYzEgKiBwdDEgKyBjMiAqIHB0MyArIGMzICogdDF4ICsgYzQgKiB0Mng7XG4gICAgICAgIHJlc1tyUG9zKytdID0gYzEgKiBwdDIgKyBjMiAqIHB0NCArIGMzICogdDF5ICsgYzQgKiB0Mnk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIGNhbGMuIHBvaW50c1xuICBwYXJzZShwdHMsIGNhY2hlLCBsKTtcblxuICBpZiAoY2xvc2VkKSB7XG4gICAgLy8gbCA9IHBvaW50cy5sZW5ndGhcbiAgICBwdHMgPSBbXTtcbiAgICBwdHMucHVzaChwb2ludHNbbCAtIDRdLCBwb2ludHNbbCAtIDNdLCBwb2ludHNbbCAtIDJdLCBwb2ludHNbbCAtIDFdKTsgLy8gc2Vjb25kIGxhc3QgYW5kIGxhc3RcbiAgICBwdHMucHVzaChwb2ludHNbMF0sIHBvaW50c1sxXSwgcG9pbnRzWzJdLCBwb2ludHNbM10pOyAvLyBmaXJzdCBhbmQgc2Vjb25kXG4gICAgcGFyc2UocHRzLCBjYWNoZSwgNCk7XG4gIH1cbiAgLy8gYWRkIGxhc3QgcG9pbnRcbiAgbCA9IGNsb3NlZCA/IDAgOiBwb2ludHMubGVuZ3RoIC0gMjtcbiAgcmVzW3JQb3MrK10gPSBwb2ludHNbbF07XG4gIHJlc1tyUG9zXSA9IHBvaW50c1tsICsgMV07XG5cbiAgLy8gcm9sbCBiYWNrIHVwIGludG8gcGFpcnNcbiAgY29uc3Qgcm9sbGVkID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzLmxlbmd0aCAvIDI7IGkrKykge1xuICAgIHJvbGxlZC5wdXNoKFsgcmVzW2kgKiAyICsgMF0sIHJlc1tpICogMiArIDFdIF0pO1xuICB9XG4gIHJldHVybiByb2xsZWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5pbnRlcnNlY3RMaW5lU2VnbWVudExpbmVTZWdtZW50ID0gaW50ZXJzZWN0TGluZVNlZ21lbnRMaW5lU2VnbWVudDtcbmZ1bmN0aW9uIGludGVyc2VjdExpbmVTZWdtZW50TGluZVNlZ21lbnQgKHAxLCBwMiwgcDMsIHA0KSB7XG4gIC8vIFJlZmVyZW5jZTpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2V2aWwtbWFkL0VnZ0JvdC9ibG9iL21hc3Rlci9pbmtzY2FwZV9kcml2ZXIvZWdnYm90X2hhdGNoLnB5XG4gIGNvbnN0IGQyMXggPSBwMlswXSAtIHAxWzBdO1xuICBjb25zdCBkMjF5ID0gcDJbMV0gLSBwMVsxXTtcbiAgY29uc3QgZDQzeCA9IHA0WzBdIC0gcDNbMF07XG4gIGNvbnN0IGQ0M3kgPSBwNFsxXSAtIHAzWzFdO1xuXG4gIC8vIGRlbm9taW5hdG9yXG4gIGNvbnN0IGQgPSBkMjF4ICogZDQzeSAtIGQyMXkgKiBkNDN4O1xuICBpZiAoZCA9PT0gMCkgcmV0dXJuIC0xO1xuXG4gIGNvbnN0IG5iID0gKHAxWzFdIC0gcDNbMV0pICogZDIxeCAtIChwMVswXSAtIHAzWzBdKSAqIGQyMXk7XG4gIGNvbnN0IHNiID0gbmIgLyBkO1xuICBpZiAoc2IgPCAwIHx8IHNiID4gMSkgcmV0dXJuIC0xO1xuXG4gIGNvbnN0IG5hID0gKHAxWzFdIC0gcDNbMV0pICogZDQzeCAtIChwMVswXSAtIHAzWzBdKSAqIGQ0M3k7XG4gIGNvbnN0IHNhID0gbmEgLyBkO1xuICBpZiAoc2EgPCAwIHx8IHNhID4gMSkgcmV0dXJuIC0xO1xuICByZXR1cm4gc2E7XG59XG5cbmNvbnN0IEZhY2VDdWxsID0ge1xuICBCQUNLOiAtMSxcbiAgRlJPTlQ6IDEsXG4gIE5PTkU6IDBcbn07XG5tb2R1bGUuZXhwb3J0cy5GYWNlQ3VsbCA9IEZhY2VDdWxsO1xuXG5tb2R1bGUuZXhwb3J0cy5pc1RyaWFuZ2xlVmlzaWJsZSA9IGlzVHJpYW5nbGVWaXNpYmxlO1xuZnVuY3Rpb24gaXNUcmlhbmdsZVZpc2libGUgKGNlbGwsIHZlcnRpY2VzLCByYXlEaXIsIHNpZGUgPSBGYWNlQ3VsbC5CQUNLKSB7XG4gIGlmIChzaWRlID09PSBGYWNlQ3VsbC5OT05FKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgdmVydHMgPSBjZWxsLm1hcChpID0+IHZlcnRpY2VzW2ldKTtcbiAgY29uc3QgdjAgPSB2ZXJ0c1swXTtcbiAgY29uc3QgdjEgPSB2ZXJ0c1sxXTtcbiAgY29uc3QgdjIgPSB2ZXJ0c1syXTtcbiAgdmVjMy5zdWJ0cmFjdCh0bXAxLCB2MSwgdjApO1xuICB2ZWMzLnN1YnRyYWN0KHRtcDIsIHYyLCB2MCk7XG4gIHZlYzMuY3Jvc3ModG1wMSwgdG1wMSwgdG1wMik7XG4gIHZlYzMubm9ybWFsaXplKHRtcDEsIHRtcDEpO1xuICBjb25zdCBkID0gdmVjMy5kb3QocmF5RGlyLCB0bXAxKTtcbiAgcmV0dXJuIHNpZGUgPT09IEZhY2VDdWxsLkJBQ0sgPyBkID4gMCA6IGQgPD0gMDtcbn1cblxuLy8gV2hldGhlciB0aGUgM0QgdHJpYW5nbGUgZmFjZSBpcyB2aXNpYmxlIHRvIHRoZSBjYW1lcmFcbi8vIGkuZS4gYmFja2ZhY2UgLyBmcm9udGZhY2UgY3VsbGluZ1xubW9kdWxlLmV4cG9ydHMuaXNGYWNlVmlzaWJsZSA9IGlzRmFjZVZpc2libGU7XG5mdW5jdGlvbiBpc0ZhY2VWaXNpYmxlIChjZWxsLCB2ZXJ0aWNlcywgcmF5RGlyLCBzaWRlID0gRmFjZUN1bGwuQkFDSykge1xuICBpZiAoc2lkZSA9PT0gRmFjZUN1bGwuTk9ORSkgcmV0dXJuIHRydWU7XG4gIGlmIChjZWxsLmxlbmd0aCA9PT0gMykge1xuICAgIHJldHVybiBpc1RyaWFuZ2xlVmlzaWJsZShjZWxsLCB2ZXJ0aWNlcywgcmF5RGlyLCBzaWRlKTtcbiAgfVxuICBpZiAoY2VsbC5sZW5ndGggIT09IDQpIHRocm93IG5ldyBFcnJvcignaXNGYWNlVmlzaWJsZSBjYW4gb25seSBoYW5kbGUgdHJpYW5nbGVzIGFuZCBxdWFkcycpO1xufTtcblxubW9kdWxlLmV4cG9ydHMuY2xpcFBvbHlsaW5lc1RvQm94ID0gY2xpcFBvbHlsaW5lc1RvQm94O1xuZnVuY3Rpb24gY2xpcFBvbHlsaW5lc1RvQm94IChwb2x5bGluZXMsIGJib3gsIGJvcmRlciA9IGZhbHNlLCBjbG9zZUxpbmVzID0gdHJ1ZSkge1xuICBpZiAoYm9yZGVyKSB7XG4gICAgcmV0dXJuIHBvbHlsaW5lcy5tYXAobGluZSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBsaW5lY2xpcC5wb2x5Z29uKGxpbmUsIGJib3gpO1xuICAgICAgaWYgKGNsb3NlTGluZXMgJiYgcmVzdWx0Lmxlbmd0aCA+IDIpIHJlc3VsdC5wdXNoKHJlc3VsdFswXSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pLmZpbHRlcihsaW5lcyA9PiBsaW5lcy5sZW5ndGggPiAwKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcG9seWxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgIHJldHVybiBsaW5lY2xpcC5wb2x5bGluZShsaW5lLCBiYm94KTtcbiAgICB9KS5yZWR1Y2UoKGEsIGIpID0+IGEuY29uY2F0KGIpLCBbXSk7XG4gIH1cbn1cblxuLy8gTm9ybWFsIG9mIGEgM0QgdHJpYW5nbGUgZmFjZVxubW9kdWxlLmV4cG9ydHMuY29tcHV0ZUZhY2VOb3JtYWwgPSBjb21wdXRlRmFjZU5vcm1hbDtcbmZ1bmN0aW9uIGNvbXB1dGVGYWNlTm9ybWFsIChjZWxsLCBwb3NpdGlvbnMsIG91dCA9IFtdKSB7XG4gIGNvbnN0IGEgPSBwb3NpdGlvbnNbY2VsbFswXV07XG4gIGNvbnN0IGIgPSBwb3NpdGlvbnNbY2VsbFsxXV07XG4gIGNvbnN0IGMgPSBwb3NpdGlvbnNbY2VsbFsyXV07XG4gIHZlYzMuc3VidHJhY3Qob3V0LCBjLCBiKTtcbiAgdmVjMy5zdWJ0cmFjdCh0bXAyLCBhLCBiKTtcbiAgdmVjMy5jcm9zcyhvdXQsIG91dCwgdG1wMik7XG4gIHZlYzMubm9ybWFsaXplKG91dCwgb3V0KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gQXJlYSBvZiAyRCBvciAzRCB0cmlhbmdsZVxubW9kdWxlLmV4cG9ydHMuY29tcHV0ZVRyaWFuZ2xlQXJlYSA9IGNvbXB1dGVUcmlhbmdsZUFyZWE7XG5mdW5jdGlvbiBjb21wdXRlVHJpYW5nbGVBcmVhIChhLCBiLCBjKSB7XG4gIGlmIChhLmxlbmd0aCA+PSAzICYmIGIubGVuZ3RoID49IDMgJiYgYy5sZW5ndGggPj0gMykge1xuICAgIHZlYzMuc3VidHJhY3QodG1wMSwgYywgYik7XG4gICAgdmVjMy5zdWJ0cmFjdCh0bXAyLCBhLCBiKTtcbiAgICB2ZWMzLmNyb3NzKHRtcDEsIHRtcDEsIHRtcDIpO1xuICAgIHJldHVybiB2ZWMzLmxlbmd0aCh0bXAxKSAqIDAuNTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gTWF0aC5hYnMoKGFbMF0gLSBjWzBdKSAqIChiWzFdIC0gYVsxXSkgLSAoYVswXSAtIGJbMF0pICogKGNbMV0gLSBhWzFdKSkgKiAwLjU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlSGF0Y2hMaW5lcyA9IGNyZWF0ZUhhdGNoTGluZXM7XG5mdW5jdGlvbiBjcmVhdGVIYXRjaExpbmVzIChib3VuZHMsIGFuZ2xlID0gLU1hdGguUEkgLyA0LCBzcGFjaW5nID0gMC41LCBvdXQgPSBbXSkge1xuICAvLyBSZWZlcmVuY2U6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ldmlsLW1hZC9FZ2dCb3QvYmxvYi9tYXN0ZXIvaW5rc2NhcGVfZHJpdmVyL2VnZ2JvdF9oYXRjaC5weVxuICBzcGFjaW5nID0gTWF0aC5hYnMoc3BhY2luZyk7XG4gIGlmIChzcGFjaW5nID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCB1c2UgYSBzcGFjaW5nIG9mIHplcm8gYXMgaXQgd2lsbCBydW4gYW4gaW5maW5pdGUgbG9vcCEnKTtcblxuICBjb25zdCB4bWluID0gYm91bmRzWzBdWzBdO1xuICBjb25zdCB5bWluID0gYm91bmRzWzBdWzFdO1xuICBjb25zdCB4bWF4ID0gYm91bmRzWzFdWzBdO1xuICBjb25zdCB5bWF4ID0gYm91bmRzWzFdWzFdO1xuXG4gIGNvbnN0IHcgPSB4bWF4IC0geG1pbjtcbiAgY29uc3QgaCA9IHltYXggLSB5bWluO1xuICBpZiAodyA9PT0gMCB8fCBoID09PSAwKSByZXR1cm4gb3V0O1xuICBjb25zdCByID0gTWF0aC5zcXJ0KHcgKiB3ICsgaCAqIGgpIC8gMjtcbiAgY29uc3Qgcm90QW5nbGUgPSBNYXRoLlBJIC8gMiAtIGFuZ2xlO1xuICBjb25zdCBjYSA9IE1hdGguY29zKHJvdEFuZ2xlKTtcbiAgY29uc3Qgc2EgPSBNYXRoLnNpbihyb3RBbmdsZSk7XG4gIGNvbnN0IGN4ID0gYm91bmRzWzBdWzBdICsgKHcgLyAyKTtcbiAgY29uc3QgY3kgPSBib3VuZHNbMF1bMV0gKyAoaCAvIDIpO1xuICBsZXQgaSA9IC1yO1xuICB3aGlsZSAoaSA8PSByKSB7XG4gICAgLy8gTGluZSBzdGFydHMgYXQgKGksIC1yKSBhbmQgZ29lcyB0byAoaSwgK3IpXG4gICAgY29uc3QgeDEgPSBjeCArIChpICogY2EpICsgKHIgKiBzYSk7IC8vICBpICogY2EgLSAoLXIpICogc2FcbiAgICBjb25zdCB5MSA9IGN5ICsgKGkgKiBzYSkgLSAociAqIGNhKTsgLy8gIGkgKiBzYSArICgtcikgKiBjYVxuICAgIGNvbnN0IHgyID0gY3ggKyAoaSAqIGNhKSAtIChyICogc2EpOyAvLyAgaSAqIGNhIC0gKCtyKSAqIHNhXG4gICAgY29uc3QgeTIgPSBjeSArIChpICogc2EpICsgKHIgKiBjYSk7IC8vICBpICogc2EgKyAoK3IpICogY2FcbiAgICBpICs9IHNwYWNpbmc7XG4gICAgLy8gUmVtb3ZlIGFueSBwb3RlbnRpYWwgaGF0Y2ggbGluZXMgd2hpY2ggYXJlIGVudGlyZWx5XG4gICAgLy8gb3V0c2lkZSBvZiB0aGUgYm91bmRpbmcgYm94XG4gICAgaWYgKCh4MSA8IHhtaW4gJiYgeDIgPCB4bWluKSB8fCAoeDEgPiB4bWF4ICYmIHgyID4geG1heCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoKHkxIDwgeW1pbiAmJiB5MiA8IHltaW4pIHx8ICh5MSA+IHltYXggJiYgeTIgPiB5bWF4KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG91dC5wdXNoKFsgWyB4MSwgeTEgXSwgWyB4MiwgeTIgXSBdKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cy5leHBhbmRUcmlhbmdsZSA9IGV4cGFuZFRyaWFuZ2xlO1xuZnVuY3Rpb24gZXhwYW5kVHJpYW5nbGUgKHRyaWFuZ2xlLCBib3JkZXIgPSAwKSB7XG4gIGlmIChib3JkZXIgPT09IDApIHJldHVybiB0cmlhbmdsZTtcbiAgbGV0IGNlbnRyb2lkID0gdHJpYW5nbGVDZW50cm9pZCh0cmlhbmdsZSk7XG4gIHRyaWFuZ2xlWzBdID0gZXhwYW5kVmVjdG9yKHRyaWFuZ2xlWzBdLCBjZW50cm9pZCwgYm9yZGVyKTtcbiAgdHJpYW5nbGVbMV0gPSBleHBhbmRWZWN0b3IodHJpYW5nbGVbMV0sIGNlbnRyb2lkLCBib3JkZXIpO1xuICB0cmlhbmdsZVsyXSA9IGV4cGFuZFZlY3Rvcih0cmlhbmdsZVsyXSwgY2VudHJvaWQsIGJvcmRlcik7XG4gIHJldHVybiB0cmlhbmdsZTtcbn1cblxubW9kdWxlLmV4cG9ydHMuZXhwYW5kVmVjdG9yID0gZXhwYW5kVmVjdG9yO1xuZnVuY3Rpb24gZXhwYW5kVmVjdG9yIChwb2ludCwgY2VudHJvaWQsIGFtb3VudCA9IDApIHtcbiAgcG9pbnQgPSB2ZWMyLmNvcHkoW10sIHBvaW50KTtcbiAgY29uc3QgZGlyID0gdmVjMi5zdWJ0cmFjdChbXSwgY2VudHJvaWQsIHBvaW50KTtcbiAgY29uc3QgbWF4TGVuID0gdmVjMi5sZW5ndGgoZGlyKTtcbiAgY29uc3QgbGVuID0gTWF0aC5taW4obWF4TGVuLCBhbW91bnQpO1xuICBpZiAobWF4TGVuICE9PSAwKSB2ZWMyLnNjYWxlKGRpciwgZGlyLCAxIC8gbWF4TGVuKTsgLy8gbm9ybWFsaXplXG4gIHZlYzIuc2NhbGVBbmRBZGQocG9pbnQsIHBvaW50LCBkaXIsIGxlbik7XG4gIHJldHVybiBwb2ludDtcbn1cblxubW9kdWxlLmV4cG9ydHMuY2xpcExpbmVUb1RyaWFuZ2xlID0gY2xpcExpbmVUb1RyaWFuZ2xlO1xuZnVuY3Rpb24gY2xpcExpbmVUb1RyaWFuZ2xlIChwMSwgcDIsIGEsIGIsIGMsIGJvcmRlciA9IDAsIHJlc3VsdCA9IFtdKSB7XG4gIGlmIChib3JkZXIgIT09IDApIHtcbiAgICBsZXQgY2VudHJvaWQgPSB0cmlhbmdsZUNlbnRyb2lkKFsgYSwgYiwgYyBdKTtcbiAgICBhID0gZXhwYW5kVmVjdG9yKGEsIGNlbnRyb2lkLCBib3JkZXIpO1xuICAgIGIgPSBleHBhbmRWZWN0b3IoYiwgY2VudHJvaWQsIGJvcmRlcik7XG4gICAgYyA9IGV4cGFuZFZlY3RvcihjLCBjZW50cm9pZCwgYm9yZGVyKTtcbiAgfVxuXG4gIC8vIGZpcnN0IGNoZWNrIGlmIGFsbCBwb2ludHMgYXJlIGluc2lkZSB0cmlhbmdsZVxuICB0bXBUcmlhbmdsZVswXSA9IGE7XG4gIHRtcFRyaWFuZ2xlWzFdID0gYjtcbiAgdG1wVHJpYW5nbGVbMl0gPSBjO1xuICBpZiAoaW5zaWRlVHJpYW5nbGUocDEsIHRtcFRyaWFuZ2xlKSAmJiBpbnNpZGVUcmlhbmdsZShwMiwgdG1wVHJpYW5nbGUpKSB7XG4gICAgcmVzdWx0WzBdID0gcDEuc2xpY2UoKTtcbiAgICByZXN1bHRbMV0gPSBwMi5zbGljZSgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gdHJpYW5nbGUgc2VnbWVudHNcbiAgY29uc3Qgc2VnbWVudHMgPSBbXG4gICAgWyBhLCBiIF0sXG4gICAgWyBiLCBjIF0sXG4gICAgWyBjLCBhIF1cbiAgXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIC8vIHRlc3QgYWdhaW5zdCBlYWNoIHRyaWFuZ2xlIGVkZ2VcbiAgICBjb25zdCBzZWdtZW50ID0gc2VnbWVudHNbaV07XG4gICAgbGV0IHAzID0gc2VnbWVudFswXTtcbiAgICBsZXQgcDQgPSBzZWdtZW50WzFdO1xuXG4gICAgY29uc3QgZnJhY3QgPSBpbnRlcnNlY3RMaW5lU2VnbWVudExpbmVTZWdtZW50KHAxLCBwMiwgcDMsIHA0KTtcbiAgICBpZiAoZnJhY3QgPj0gMCAmJiBmcmFjdCA8PSAxKSB7XG4gICAgICByZXN1bHQucHVzaChbXG4gICAgICAgIHAxWzBdICsgZnJhY3QgKiAocDJbMF0gLSBwMVswXSksXG4gICAgICAgIHAxWzFdICsgZnJhY3QgKiAocDJbMV0gLSBwMVsxXSlcbiAgICAgIF0pO1xuICAgICAgLy8gd2hlbiB3ZSBoYXZlIDIgcmVzdWx0IHdlIGNhbiBzdG9wIGNoZWNraW5nXG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+PSAyKSBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoYXJyYXlBbG1vc3RFcXVhbChyZXN1bHRbMF0sIHJlc3VsdFsxXSkpIHtcbiAgICAvLyBpZiB0aGUgdHdvIHBvaW50cyBhcmUgY2xvc2UgZW5vdWdoIHRoZXkgYXJlIGJhc2ljYWxseVxuICAgIC8vIHRvdWNoaW5nLCBvciBpZiB0aGUgYm9yZGVyIHB1c2hlZCB0aGVtIGNsb3NlIHRvZ2V0aGVyLFxuICAgIC8vIHRoZW4gaWdub3JlIHRoaXMgYWx0b2dldGhlclxuICAgIHJlc3VsdC5sZW5ndGggPSAwO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdC5sZW5ndGggPT09IDI7XG59XG4iXSwibmFtZXMiOlsiY29uc3QiLCJsZXQiLCJpIl0sIm1hcHBpbmdzIjoiQUFBQUEsR0FBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkNBLEdBQUssQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUN4RCxPQUFvQixHQUFHLE9BQU8sQ0FBQyxXQUFXO0FBQWxDO0FBQU0sb0JBQThCO0FBQzVDQSxHQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQ0EsR0FBSyxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQ3ZEQSxHQUFLLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDdERBLEdBQUssQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRXBEQSxHQUFLLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNoQkEsR0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7QUFDaEJBLEdBQUssQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDOzs7QUFHaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsWUFBRyxDQUFDLEdBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFrQixFQUFFLENBQWtCLEVBQUUsQUFBRzsyQkFBM0QsR0FBRzt1QkFBYyxH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QUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7TUFDckIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNiLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ2pCLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ2pCLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ2pCLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO01BQ25DLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO01BQ25DLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO01BQ25DLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO01BQ25DLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFOztRQUU3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNYLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZCxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7UUFFbEIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQztRQUN4RCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDO09BQ3pEO0tBQ0Y7R0FDRixDQUFDOzs7RUFHRixLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzs7RUFFckIsSUFBSSxNQUFNLEVBQUU7O0lBRVYsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNULEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDdEI7O0VBRUQsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDbkMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzs7RUFHMUJBLEdBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxD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QUM7O0VBRTFCQSxHQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7RUFDdEJBLEdBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztFQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBRSxPQUFPLEdBQUcsR0FBQztFQUNuQ0EsR0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN2Q0EsR0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7RUFDckNBLEdBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztFQUM5QkEsR0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0VBQzlCQSxHQUFLLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNsQ0EsR0FBSyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDbENDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDWCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7O0lBRWJELEdBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDQSxHQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FB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