
  // ── Module 11 helpers: Gaussians, a 1D spend dataset, a 2D overlapping dataset, and EM ──
  var SPEND = [1.3, 1.8, 2.1, 2.4, 2.9, 3.9, 4.4, 4.8, 5.1, 5.4, 5.9, 6.2, 7.3, 7.9, 8.4, 8.9];
  var MIX3 = [{ w: 0.30, m: 2, s: 0.8 }, { w: 0.45, m: 5, s: 1.0 }, { w: 0.25, m: 8, s: 0.9 }];
  var TWO = [{ w: 0.4, m: 3, s: 1.0 }, { w: 0.6, m: 6, s: 1.5 }];
  var P10 = [1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3];
  var GCOL = ["#38bdf8", "#e2b44a", "#f472b6"];     // component colours A, B, C
  var GNAME = ["A", "B", "C"];

  function gpdf(x, m, s) { return Math.exp(-((x - m) * (x - m)) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s); }
  function mixPdf(x, comps) { var t = 0; comps.forEach(function (c) { t += c.w * gpdf(x, c.m, c.s); }); return t; }
  function resp1(x, comps) {
    var sc = comps.map(function (c) { return c.w * gpdf(x, c.m, c.s); }), tot = 0;
    sc.forEach(function (v) { tot += v; });
    return { dens: comps.map(function (c) { return gpdf(x, c.m, c.s); }), scores: sc, total: tot, r: sc.map(function (v) { return v / tot; }) };
  }
  function mstep1(pts, R) {
    return R[0].map(function (_, k) {
      var N = 0, sx = 0, i;
      for (i = 0; i < pts.length; i++) { N += R[i][k]; sx += R[i][k] * pts[i]; }
      var mu = sx / N, v = 0;
      for (i = 0; i < pts.length; i++) v += R[i][k] * (pts[i] - mu) * (pts[i] - mu);
      return { w: N / pts.length, m: mu, s: Math.sqrt(v / N), n: N };
    });
  }
  function ll1(pts, comps) { var t = 0; pts.forEach(function (x) { t += Math.log(mixPdf(x, comps)); }); return t; }

  // 2D: 34 customers from three overlapping groups; (purchases per month, average spend).
  var GP = [[2.96, 2.95], [1.4, 2.51], [1.55, 1.27], [1.58, 2.61], [2.26, 2.22], [1.24, 3.04], [2.42, 2.68], [1.93, 2.43], [2.36, 4.53], [2.31, 2.85], [4.82, 6.36], [5, 8.31], [4.65, 6.11], [5.76, 6.23], [3.63, 7.22], [5.01, 6.19], [5.66, 5.73], [4.4, 6.53], [4.33, 6.9], [5.75, 5.83], [5.4, 5.47], [6.14, 6.44], [4.61, 6.27], [4.82, 5.58], [8.73, 5.34], [6.09, 5.32], [8.41, 4.99], [7.51, 6.67], [7.34, 4.46], [8.56, 4.33], [6.81, 2.82], [7.74, 4.65], [6.19, 5.93], [7.14, 5.27]];
  var GINIT = [{ w: 1 / 3, mx: 2, my: 5, sx: 1.6, sy: 1.6 }, { w: 1 / 3, mx: 5, my: 3, sx: 1.6, sy: 1.6 }, { w: 1 / 3, mx: 8, my: 3.5, sx: 1.6, sy: 1.6 }];
  function dens2(p, c) { return gpdf(p[0], c.mx, c.sx) * gpdf(p[1], c.my, c.sy); }
  function resp2(pts, comps) {
    return pts.map(function (p) {
      var sc = comps.map(function (c) { return c.w * dens2(p, c); }), t = 0;
      sc.forEach(function (v) { t += v; });
      return sc.map(function (v) { return v / t; });
    });
  }
  function ll2(pts, comps) { var t = 0; pts.forEach(function (p) { var s = 0; comps.forEach(function (c) { s += c.w * dens2(p, c); }); t += Math.log(s); }); return t; }
  function mstep2(pts, R) {
    return R[0].map(function (_, k) {
      var N = 0, mx = 0, my = 0, i;
      for (i = 0; i < pts.length; i++) { N += R[i][k]; mx += R[i][k] * pts[i][0]; my += R[i][k] * pts[i][1]; }
      mx /= N; my /= N;
      var vx = 0, vy = 0;
      for (i = 0; i < pts.length; i++) { vx += R[i][k] * (pts[i][0] - mx) * (pts[i][0] - mx); vy += R[i][k] * (pts[i][1] - my) * (pts[i][1] - my); }
      return { w: N / pts.length, mx: mx, my: my, sx: Math.max(Math.sqrt(vx / N), 0.25), sy: Math.max(Math.sqrt(vy / N), 0.25) };
    });
  }
  function runEM2(pts, comps, iters) {
    var hist = [], c = comps;
    for (var it = 0; it < iters; it++) {
      var R = resp2(pts, c);
      hist.push({ comps: c, R: R, ll: ll2(pts, c), next: mstep2(pts, R) });
      c = hist[hist.length - 1].next;
    }
    return hist;
  }
  function kmeans2(pts, centers, iters) {
    var C = centers, L = null;
    for (var it = 0; it < iters; it++) {
      L = pts.map(function (p) { return nearestIdx(p, C); });
      C = C.map(function (c, k) { return meanPts(pts, L, k) || c; });
    }
    return { labels: L, centers: C };
  }
  function argmaxArr(a) { var b = 0; a.forEach(function (v, i) { if (v > a[b]) b = i; }); return b; }
  // Blend three component colours by responsibility.
  function blendColor(r) {
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var rgb = [0, 0, 0];
    r.forEach(function (v, k) { var h = hex(GCOL[k]); for (var i = 0; i < 3; i++) rgb[i] += v * h[i]; });
    return "rgb(" + rgb.map(function (v) { return Math.round(v); }).join(",") + ")";
  }
  // An axis-aligned ellipse for a 2D component, mult standard deviations wide.
  function compEllipse(parent, colour) { return el("ellipse", { fill: colour, "fill-opacity": 0.18, stroke: colour, "stroke-width": 3 }, parent); }
  function setCompEllipse(node, g3, c, mult) {
    node.setAttribute("cx", g3.x(c.mx)); node.setAttribute("cy", g3.y(c.my));
    node.setAttribute("rx", Math.max(2, mult * c.sx * g3.sx)); node.setAttribute("ry", Math.max(2, mult * c.sy * g3.sy));
  }
  // 1D density plot: axes plus a helper to draw a curve of f over x in [0, 10].
  function densAxes(parent, g1, ymax, ticksY) {
    el("line", { x1: g1.x(0), y1: g1.y(0), x2: g1.x(10), y2: g1.y(0), class: "axis" }, parent);
    for (var t = 0; t <= 10; t += 1) txt(parent, g1.x(t), g1.y(0) + 15, "tick", String(t), "middle");
    txt(parent, g1.x(10), g1.y(0) + 30, "note", "average monthly spend", "end");
    (ticksY || []).forEach(function (v) { el("line", { x1: g1.x(0), y1: g1.y(v), x2: g1.x(10), y2: g1.y(v), stroke: "rgba(255,255,255,0.07)" }, parent); txt(parent, g1.x(0) - 6, g1.y(v) + 4, "tick", v.toFixed(2), "end"); });
  }
  function curvePath(parent, g1, f, colour, width, dash) {
    var a = { d: curveD(g1, f, 0, 10, 140), fill: "none", stroke: colour, "stroke-width": width || 3 };
    if (dash) a["stroke-dasharray"] = dash;
    return el("path", a, parent);
  }
  function areaPath(parent, g1, f, colour, opacity) {
    var d = "M " + g1.x(0) + " " + g1.y(0), n = 140, i, v;
    for (i = 0; i <= n; i++) { v = 10 * i / n; d += " L " + g1.x(v).toFixed(1) + " " + g1.y(f(v)).toFixed(1); }
    d += " L " + g1.x(10) + " " + g1.y(0) + " Z";
    return el("path", { d: d, fill: colour, "fill-opacity": opacity || 0.25, stroke: "none" }, parent);
  }
