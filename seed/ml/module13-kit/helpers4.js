
  // ── Module 10 helpers: the customer dataset, K-Means, and an x/y plot ─────────
  var CPTS = [[1, 2], [1.5, 1.8], [2, 2.5], [2.2, 1.7], [6, 6], [6.5, 5.5], [7, 6.2], [6.8, 6.8], [3, 8], [3.5, 8.5], [4, 7.8], [4.2, 8.8]];
  var C0 = [[3, 4], [5, 3], [5, 9.5]];
  var KC = ["#38bdf8", "#e2b44a", "#f472b6", "#a78bfa", "#fb923c"];   // cluster colours by id
  var C_GRAY = "#8fa89c";

  function dist2d(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function nearestIdx(p, centers) {
    var best = 0;
    for (var i = 1; i < centers.length; i++) if (dist2d(p, centers[i]) < dist2d(p, centers[best])) best = i;
    return best;
  }
  function assignAll(pts, centers) { return pts.map(function (p) { return nearestIdx(p, centers); }); }
  function meanPts(pts, labels, k) {
    var sx = 0, sy = 0, n = 0;
    pts.forEach(function (p, i) { if (labels[i] === k) { sx += p[0]; sy += p[1]; n++; } });
    return n ? [sx / n, sy / n] : null;
  }
  function updateAll(pts, labels, centers) {
    return centers.map(function (c, k) { return meanPts(pts, labels, k) || c; });
  }
  function wcssOf(pts, labels, centers) {
    var s = 0;
    pts.forEach(function (p, i) { var d = dist2d(p, centers[labels[i]]); s += d * d; });
    return s;
  }
  // Full run: returns the list of {centers, labels, wcssAssign, newCenters, wcssUpdate}.
  function runKMeans(pts, centers, maxIter) {
    var hist = [], prev = null, c = centers;
    for (var it = 0; it < (maxIter || 10); it++) {
      var labels = assignAll(pts, c);
      var nc = updateAll(pts, labels, c);
      hist.push({ centers: c, labels: labels, wcssAssign: wcssOf(pts, labels, c), newCenters: nc, wcssUpdate: wcssOf(pts, labels, nc) });
      if (prev && prev.join() === labels.join()) break;
      prev = labels; c = nc;
    }
    return hist;
  }
  // Axes for the customer plot; returns a graph mapping with .x(v) / .y(v).
  function custPlot(parent, ox, oy, sx, sy, xmax, ymax, xlab, ylab) {
    var g3 = makeGraph(ox, oy, sx, sy);
    el("line", { x1: g3.x(0), y1: g3.y(0), x2: g3.x(xmax), y2: g3.y(0), class: "axis" }, parent);
    el("line", { x1: g3.x(0), y1: g3.y(0), x2: g3.x(0), y2: g3.y(ymax), class: "axis" }, parent);
    for (var t = 0; t <= xmax; t += 2) txt(parent, g3.x(t), g3.y(0) + 14, "tick", String(t), "middle");
    for (var u = 2; u <= ymax; u += 2) txt(parent, g3.x(0) - 6, g3.y(u) + 4, "tick", String(u), "end");
    txt(parent, g3.x(xmax), g3.y(0) + 28, "note", xlab || "purchases per month", "end");
    txt(parent, g3.x(0) + 6, g3.y(ymax) + 2, "note", ylab || "average spend", "start");
    return g3;
  }
  function ptDots(parent, g3, pts, r) {
    return pts.map(function (p) { return el("circle", { cx: g3.x(p[0]), cy: g3.y(p[1]), r: r || 7, fill: C_GRAY, stroke: "#071510", "stroke-width": 2 }, parent); });
  }
  // A centroid marker: a diamond in the cluster colour with a white outline. Move with setCenter().
  function centerMark(parent, colour) {
    return el("path", { d: "M 0 -11 L 11 0 L 0 11 L -11 0 Z", fill: colour, stroke: "#e6f5ec", "stroke-width": 3 }, parent);
  }
  function setCenter(mark, g3, c) { mark.setAttribute("transform", "translate(" + g3.x(c[0]).toFixed(1) + "," + g3.y(c[1]).toFixed(1) + ")"); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
