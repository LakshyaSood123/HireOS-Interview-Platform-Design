
  // ── Module 7 helpers: the house dataset and plain regression maths ─────────
  var HOUSES = [[1.0, 2.0], [1.5, 2.8], [2.0, 3.7], [2.5, 4.1], [3.0, 5.2]];
  var VALID = [[0.75, 1.7], [1.75, 3.3], [3.4, 5.6]];
  var TESTH = [[2.25, 3.9], [2.9, 5.0]];
  var DEV = HOUSES.concat(VALID);
  var C_TRAIN = "#e2b44a", C_VALID = "#38bdf8", C_TEST = "#f472b6", C_FIT = "#1db584", C_RES = "#f87171";

  function lineFit(data) {
    var n = data.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += data[i][0] / n; my += data[i][1] / n; }
    var sxy = 0, sxx = 0;
    for (i = 0; i < n; i++) {
      sxy += (data[i][0] - mx) * (data[i][1] - my);
      sxx += (data[i][0] - mx) * (data[i][0] - mx);
    }
    var w = sxy / sxx;
    return [w, my - w * mx];
  }
  function mseOf(f, data) {
    var s = 0;
    data.forEach(function (d) { var r = f(d[0]) - d[1]; s += r * r; });
    return s / data.length;
  }
  function solveLin(A, rhs) {
    var n = A.length, M = [], i, c, r, k;
    for (i = 0; i < n; i++) M.push(A[i].concat([rhs[i]]));
    for (c = 0; c < n; c++) {
      var p = c;
      for (r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      for (r = c + 1; r < n; r++) {
        var f = M[r][c] / M[c][c];
        for (k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    var out = [];
    for (r = n - 1; r >= 0; r--) {
      var s = M[r][n];
      for (k = r + 1; k < n; k++) s -= M[r][k] * out[k];
      out[r] = s / M[r][r];
    }
    return out;
  }
  function polyFeat(x, deg) {
    var z = x - 2, out = [];
    for (var k = 0; k <= deg; k++) out.push(Math.pow(z, k));
    return out;
  }
  // Ridge: minimises MSE + lam * (sum of squared weights); index 0 (the intercept) is not penalised.
  function ridgeFit(data, deg, lam) {
    var X = data.map(function (d) { return polyFeat(d[0], deg); });
    var n = X.length, p = deg + 1, A = [], rhs = [], i, j, r;
    for (i = 0; i < p; i++) {
      A.push([]);
      for (j = 0; j < p; j++) {
        var s = 0;
        for (r = 0; r < n; r++) s += X[r][i] * X[r][j];
        if (i === j && i > 0) s += lam * n;
        A[i].push(s);
      }
      var q = 0;
      for (r = 0; r < n; r++) q += X[r][i] * data[r][1];
      rhs.push(q);
    }
    return solveLin(A, rhs);
  }
  function polyAt(beta, x) {
    var f = polyFeat(x, beta.length - 1), s = 0;
    for (var i = 0; i < beta.length; i++) s += beta[i] * f[i];
    return s;
  }
  function sumSq(beta) {
    var s = 0;
    for (var i = 1; i < beta.length; i++) s += beta[i] * beta[i];
    return s;
  }
  function sgn(v, n) { if (Math.abs(v) < 0.0005) return (0).toFixed(n === undefined ? 2 : n); return (v < 0 ? "−" : "+") + Math.abs(v).toFixed(n === undefined ? 2 : n); }
  function gdPath(epochs) {
    var w = 0, b = 0, n = HOUSES.length, out = [[0, 0]], e, i;
    for (e = 1; e <= epochs; e++) {
      var gw = 0, gb = 0;
      for (i = 0; i < n; i++) { var r = w * HOUSES[i][0] + b - HOUSES[i][1]; gw += 2 / n * r * HOUSES[i][0]; gb += 2 / n * r; }
      w -= 0.1 * gw; b -= 0.1 * gb;
      out.push([w, b]);
    }
    return out;
  }
  function kfolds(data, k) {
    var folds = [], j, i;
    for (j = 0; j < k; j++) { folds.push([]); for (i = j; i < data.length; i += k) folds[j].push(data[i]); }
    return folds;
  }
  function cvScore(fit, data, k) {
    var folds = kfolds(data, k), total = 0, j, m, scores = [];
    for (j = 0; j < k; j++) {
      var tr = [];
      for (m = 0; m < k; m++) if (m !== j) tr = tr.concat(folds[m]);
      var s = mseOf(fit(tr), folds[j]);
      scores.push(s); total += s / k;
    }
    return { scores: scores, mean: total };
  }
  function polyFitFn(deg, lam) {
    return function (tr) { var beta = ridgeFit(tr, deg, lam); return function (x) { return polyAt(beta, x); }; };
  }
  // Axes + labels for the house plot; returns the graph mapping.
  function housePlot(parent, ox, oy, sx, sy, xmax, ymax, yticks) {
    var g = makeGraph(ox, oy, sx, sy);
    drawAxes(parent, g, xmax, ymax, [0, 1, 2, 3], yticks || [0, 2, 4, 6]);
    txt(parent, g.x(xmax), g.y(0) + 28, "note", "size (×100 m²)", "end");
    txt(parent, g.x(0) + 6, g.y(ymax) + 4, "note", "price ($100k)", "start");
    return g;
  }
  function dotSet(parent, g, data, fill, r) {
    return data.map(function (d) {
      return el("circle", { cx: g.x(d[0]), cy: g.y(d[1]), r: r || 6, fill: fill, stroke: "#071510", "stroke-width": 2 }, parent);
    });
  }
  function pathEl(parent, cls) { return el("path", { class: cls, d: "M 0 0" }, parent); }
  function fnPath(g, f, a, b, n) { return curveD(g, f, a, b, n || 60); }
  function wbPath(g, w, b, a, c) { return "M " + g.x(a).toFixed(1) + " " + g.y(w * a + b).toFixed(1) + " L " + g.x(c).toFixed(1) + " " + g.y(w * c + b).toFixed(1); }
  function pdf(z, sigma) { return Math.exp(-0.5 * z * z / (sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI)); }
  function lockIcon(parent, x, y, s) {
    var g = el("g", {}, parent);
    box(g, x - 8 * s, y - 1 * s, 16 * s, 12 * s, "#f472b6", "#071510", 2);
    el("path", { d: "M " + (x - 5 * s) + " " + (y - 1 * s) + " v " + (-5 * s) + " a " + (5 * s) + " " + (5 * s) + " 0 0 1 " + (10 * s) + " 0 v " + (5 * s), fill: "none", stroke: "#f472b6", "stroke-width": 2.5 }, g);
    return g;
  }
