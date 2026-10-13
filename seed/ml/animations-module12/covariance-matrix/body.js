
  var origAx = el("g", {}, svg);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(8), y2: OP.y(0), class: "axis" }, origAx);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(0), y2: OP.y(7), class: "axis" }, origAx);
  txt(origAx, OP.x(8), OP.y(0) + 16, "note", "usage", "end");
  txt(origAx, OP.x(0) + 6, OP.y(7) + 4, "note", "spend", "start");
  var cenAx = frameAxes(svg, CP, 4.5, 3.5);
  el("line", { x1: CP.x(-4.5), y1: CP.y(0), x2: CP.x(4.5), y2: CP.y(0), stroke: "#e2b44a", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, cenAx);
  el("line", { x1: CP.x(0), y1: CP.y(-3.5), x2: CP.x(0), y2: CP.y(3.5), stroke: "#e2b44a", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, cenAx);
  var meanDot = el("circle", { cx: CP.x(0), cy: CP.y(0), r: 5, fill: "none", stroke: "#e6f5ec", "stroke-width": 2 }, svg);
  var rects = el("g", {}, svg);
  DC.forEach(function (c) {
    var a = CP.pt([0, 0]), b = CP.pt(c);
    el("rect", { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(a[0] - b[0]), height: Math.abs(a[1] - b[1]), fill: "rgba(29,181,132,0.14)", stroke: "rgba(29,181,132,0.5)", "stroke-width": 1 }, rects);
  });
  var xseg = el("g", {}, svg), yseg = el("g", {}, svg);
  DC.forEach(function (c) {
    var b = CP.pt(c);
    el("line", { x1: CP.x(0), y1: b[1], x2: b[0], y2: b[1], stroke: "#38bdf8", "stroke-width": 2 }, xseg);
    el("line", { x1: b[0], y1: CP.y(0), x2: b[0], y2: b[1], stroke: "#f472b6", "stroke-width": 2 }, yseg);
  });
  var dots = dotsAt(svg, OP, DX, 7);
  var panel = el("g", {}, svg);
  card(panel, 410, 62, 222, 186, "fillG");
  var q1 = txt(panel, 521, 92, "lbl lbl-y", "", "middle");
  var q2 = txt(panel, 521, 130, "big", "", "middle");
  var q3 = txt(panel, 521, 160, "note", "", "middle");
  var q4 = txt(panel, 521, 182, "note", "", "middle");
  var q5 = txt(panel, 521, 204, "note", "", "middle");
  var q6 = txt(panel, 521, 226, "note", "", "middle");
  var mg = el("g", {}, svg);
  card(mg, 410, 62, 222, 262, "fillA");
  txt(mg, 521, 88, "lbl lbl-y", "covariance matrix S", "middle");
  txt(mg, 496, 118, "tick", "usage", "middle"); txt(mg, 576, 118, "tick", "spend", "middle");
  txt(mg, 433, 153, "tick", "usage", "middle"); txt(mg, 433, 203, "tick", "spend", "middle");
  var M = matGrid(mg, 456, 124, 2, 2, 80, 50, [[f2(DSXX), f2(DSXY)], [f2(DSXY), f2(DSYY)]]);
  var m1 = txt(mg, 521, 252, "note", "", "middle");
  var m2 = txt(mg, 521, 274, "note", "", "middle");
  var m3 = txt(mg, 521, 296, "note", "", "middle");
  function setPanel(a, b, c, d, e, f) { q1.textContent = a; q2.textContent = b; q3.textContent = c || ""; q4.textContent = d || ""; q5.textContent = e || ""; q6.textContent = f || ""; }
  function render(i) {
    var left = i <= 4;
    show(origAx, i === 0); show(cenAx, i >= 1); show(meanDot, i >= 1);
    dots.forEach(function (d) { show(d, true); });
    show(rects, i === 4 || i === 6); show(xseg, i === 2 || i === 5); show(yseg, i === 3 || i === 5);
    show(panel, left); show(mg, i >= 5);
    var prods = DC.map(function (c) { return (c[0] * c[1]).toFixed(2); });
    if (i === 0) setPanel("raw data X", "6 × 2", "rows = customers", "columns = usage, spend", "means: " + f2(DMEAN[0]) + " and " + f2(DMEAN[1]));
    if (i === 1) setPanel("center the data", "Xc = X − means", "subtract each column's mean", "the cloud's center moves", "to the origin");
    if (i === 2) setPanel("spread in usage", "var = " + f2(DSXX), "sum of (x − mean)² = 17.50", "divided by n − 1 = 5", "");
    if (i === 3) setPanel("spread in spend", "var = " + f2(DSYY), "sum of (y − mean)² = 13.50", "divided by n − 1 = 5", "");
    if (i === 4) setPanel("moving together", "cov = " + f2(DSXY), "products (x − mean)(y − mean):", prods.join("  "), "sum 14.50 / 5 = " + f2(DSXY), "all positive: they rise together");
    if (i >= 5) {
      M.cells.forEach(function (row, r) { row.forEach(function (c, k) { c.setAttribute("class", "cell " + ((i === 5 && r === k) ? "hl-col" : (i === 6 && r !== k) ? "hl-row" : "")); }); });
    }
    if (i === 5) { m1.textContent = "diagonal = variances"; m2.textContent = "usage " + f2(DSXX) + ", spend " + f2(DSYY); m3.textContent = ""; }
    if (i === 6) { m1.textContent = "off-diagonal = covariance"; m2.textContent = f2(DSXY) + " in both places (symmetric)"; m3.textContent = "positive: they rise together"; }
    if (i === 7) { m1.textContent = "S = XcᵀXc / (n − 1)"; m2.textContent = "correlation = " + f2(DSXY) + " / √(" + f2(DSXX) + " × " + f2(DSYY) + ") = " + f2(DSXY / Math.sqrt(DSXX * DSYY)); m3.textContent = "covariance has units; correlation does not"; }
    if (i === 8) { m1.textContent = "next: eigenvectors of S"; m2.textContent = "= the principal directions"; m3.textContent = "eigenvalues = variances along them"; }
  }
