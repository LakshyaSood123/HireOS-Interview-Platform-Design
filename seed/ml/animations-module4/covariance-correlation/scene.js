  var steps = [
    { id: "scatter", label: "Five houses as points", caption: "Each point is one house: size across, price up. We want one number that says whether the two variables move together, and in which direction." },
    { id: "positive", label: "Positive: they rise together", caption: "Bigger houses cost more: as size grows, price grows. The points climb from lower left to upper right. This is positive covariance." },
    { id: "negative", label: "Negative: one up, the other down", caption: "Now imagine price falls as size grows (say, size versus distance to the city). The points slide from upper left to lower right. This is negative covariance." },
    { id: "near-zero", label: "Near zero: no straight-line trend", caption: "Here the points show no consistent upward or downward trend. Knowing the size tells you nothing about which side of the average the price is on. Covariance is about zero." },
    { id: "covariance", label: "How covariance is computed", caption: "Mark the means (the cross). Each point makes a rectangle: its distance from the mean in x times its distance in y. Green rectangles (same side of both means) count positive, red negative. Covariance is their average: (6+2+0+1+8)/5 = 3.4." },
    { id: "rescale", label: "Covariance depends on the units", caption: "Measure size in units ten times larger. The points have exactly the same shape, yet covariance jumps from 3.4 to 34. A raw covariance is hard to compare across variables." },
    { id: "correlation", label: "Correlation removes the units", caption: "Divide by both standard deviations: Corr = Cov / (σx × σy) = 3.4 / (√2 × √6) ≈ 0.98. Correlation is always between −1 and +1: +1 is a perfect rising line, −1 a perfect falling line, 0 no straight-line trend." },
    { id: "zero-not-independence", label: "Zero correlation is not independence", caption: "These points follow y = (x − 3)²: y is completely determined by x. Yet the left and right halves cancel, so covariance and correlation are exactly 0. Correlation only detects straight-line relationships." },
    { id: "ml-connection", label: "Why ML cares", caption: "Highly correlated features are redundant. Collect all the variances and covariances into a covariance matrix: it is the key ingredient of PCA and of the multivariate normal in the next checkpoint." }
  ];

  var XS = [1, 2, 3, 4, 5];
  var DATA = {
    pos: [2, 3, 5, 6, 9],
    neg: [9, 6, 5, 3, 2],
    flat: [4, 6, 3, 6, 4],
    para: [4, 1, 0, 1, 4]
  };
  function mean(v) { var s = 0; v.forEach(function (a) { s += a; }); return s / v.length; }
  function cov(x, y) { var mx = mean(x), my = mean(y), s = 0; for (var i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my); return s / x.length; }
  function corr(x, y) { return cov(x, y) / Math.sqrt(cov(x, x) * cov(y, y)); }

  var PXf = function (x) { return 60 + 56 * x; };
  var PYf = function (y) { return 304 - 26 * y; };
  var L = 60, R = 360, T = 40, B = 304;

  // Quadrants and axes.
  var quadG = el("g", {}, svg);
  var quads = [
    box(quadG, 0, 0, 0, 0, "rgba(29,181,132,0.14)", "none", 0),
    box(quadG, 0, 0, 0, 0, "rgba(29,181,132,0.14)", "none", 0),
    box(quadG, 0, 0, 0, 0, "rgba(248,113,113,0.14)", "none", 0),
    box(quadG, 0, 0, 0, 0, "rgba(248,113,113,0.14)", "none", 0)
  ];
  var axG = el("g", {}, svg);
  el("line", { x1: L, y1: B, x2: R + 10, y2: B, class: "axis" }, axG);
  el("line", { x1: L, y1: B, x2: L, y2: T - 8, class: "axis" }, axG);
  var xTicks = XS.map(function (x) { return txt(axG, PXf(x), B + 16, "tick", String(x), "middle"); });
  txt(axG, R + 10, B + 32, "note", "size", "end");
  txt(axG, L + 6, T - 12, "note", "price", "start");

  var meanG = el("g", {}, svg);
  var mLineV = el("line", { stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "6 4" }, meanG);
  var mLineH = el("line", { stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "6 4" }, meanG);
  var mLbl = txt(meanG, 0, 0, "lbl lbl-y", "means", "start");

  var prodG = el("g", {}, svg);
  var prods = XS.map(function () { return box(prodG, 0, 0, 0, 0, "rgba(29,181,132,0.5)", "none", 0); });

  var curveG = el("g", {}, svg);
  var curvePath = el("path", { fill: "none", stroke: "#f472b6", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, curveG);
  var dCurve = "";
  for (var cx = 0.6; cx <= 5.41; cx += 0.2) dCurve += (dCurve ? " L " : "M ") + PXf(cx).toFixed(1) + " " + PYf((cx - 3) * (cx - 3)).toFixed(1);
  setD(curvePath, dCurve);

  var trendG = el("g", {}, svg);
  var trendPos = arrow(trendG, "g", 5), trendNeg = arrow(trendG, "r", 5), trendFlat = arrow(trendG, "w", 5);
  var trendLbl = txt(trendG, 0, 0, "lbl lbl-g", "", "start");

  var pts = XS.map(function () { return el("circle", { r: 8, fill: "#38bdf8", stroke: "#071510", "stroke-width": 2 }, svg); });
  var cur = DATA.pos.slice();
  function drawPoints(ys) {
    cur = ys;
    for (var i = 0; i < 5; i++) { pts[i].setAttribute("cx", PXf(XS[i])); pts[i].setAttribute("cy", PYf(ys[i])); }
  }
  function morph(target, ms) {
    var from = cur.slice();
    anim("pts", ms, function (e) { drawPoints(from.map(function (v, i) { return lerp(v, target[i], e); })); });
  }
  function drawMeanAndQuads(ys) {
    var mx = mean(XS), my = mean(ys);
    var cxp = PXf(mx), cyp = PYf(my);
    setLine(mLineV, cxp, T - 6, cxp, B);
    setLine(mLineH, L, cyp, R + 6, cyp);
    mLbl.setAttribute("x", cxp + 8); mLbl.setAttribute("y", T + 6);
    setBox(quads[0], cxp, T - 6, R + 6 - cxp, cyp - (T - 6));      // upper right: +
    setBox(quads[1], L, cyp, cxp - L, B - cyp);                      // lower left: +
    setBox(quads[2], L, T - 6, cxp - L, cyp - (T - 6));              // upper left: -
    setBox(quads[3], cxp, cyp, R + 6 - cxp, B - cyp);                // lower right: -
  }
  function drawProducts(ys) {
    var mx = mean(XS), my = mean(ys);
    for (var i = 0; i < 5; i++) {
      var dx = XS[i] - mx, dy = ys[i] - my, p = dx * dy;
      var x1 = PXf(mx), y1 = PYf(my), x2 = PXf(XS[i]), y2 = PYf(ys[i]);
      setBox(prods[i], Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      prods[i].setAttribute("fill", p > 0 ? "rgba(29,181,132,0.55)" : "rgba(248,113,113,0.55)");
      prods[i].setAttribute("opacity", p === 0 ? "0" : "1");
    }
  }

  // Scale bar for correlation.
  var scaleG = el("g", {}, svg);
  var SX = function (c) { return 90 + (c + 1) * 120; };
  el("line", { x1: SX(-1), y1: 190, x2: SX(1), y2: 190, stroke: "#c9dccf", "stroke-width": 3 }, scaleG);
  [-1, 0, 1].forEach(function (c) {
    el("line", { x1: SX(c), y1: 182, x2: SX(c), y2: 198, stroke: "#c9dccf", "stroke-width": 3 }, scaleG);
    txt(scaleG, SX(c), 220, "big", (c > 0 ? "+" : "") + c, "middle");
  });
  txt(scaleG, SX(-1), 242, "note", "falling line", "middle");
  txt(scaleG, SX(0), 242, "note", "no straight-line trend", "middle");
  txt(scaleG, SX(1), 242, "note", "rising line", "middle");
  [[corr(XS, DATA.neg), "#f87171", "falling data"], [corr(XS, DATA.flat), "#c9dccf", "unrelated"], [corr(XS, DATA.pos), "#1db584", "rising data"]].forEach(function (m, i) {
    el("circle", { cx: SX(m[0]), cy: 190, r: 9, fill: m[1], stroke: "#071510", "stroke-width": 2 }, scaleG);
    txt(scaleG, SX(m[0]), i === 1 ? 160 : 160 - (i === 0 ? 0 : 0), "lbl", fmt(m[0], 2), "middle");
  });
  txt(scaleG, 320, 130, "mono", "Corr = Cov / (σx × σy) = 3.4 / √12 ≈ 0.98", "middle");
  txt(scaleG, 320, 290, "lbl lbl-y", "always between −1 and +1, whatever the units", "middle");

  var mlG = el("g", {}, svg);
  txt(mlG, 320, 40, "lbl lbl-y", "the covariance matrix of (size, price)", "middle");
  box(mlG, 150, 60, 150, 60, "rgba(56,189,248,0.2)", "#38bdf8", 8);
  box(mlG, 300, 60, 150, 60, "rgba(29,181,132,0.3)", "#1db584", 8);
  box(mlG, 150, 120, 150, 60, "rgba(29,181,132,0.3)", "#1db584", 8);
  box(mlG, 300, 120, 150, 60, "rgba(56,189,248,0.2)", "#38bdf8", 8);
  txt(mlG, 225, 98, "big", "2.0", "middle"); txt(mlG, 225, 114, "note", "var(size)", "middle");
  txt(mlG, 375, 98, "big", "3.4", "middle"); txt(mlG, 375, 114, "note", "cov(size, price)", "middle");
  txt(mlG, 225, 158, "big", "3.4", "middle"); txt(mlG, 225, 174, "note", "cov(price, size)", "middle");
  txt(mlG, 375, 158, "big", "6.0", "middle"); txt(mlG, 375, 174, "note", "var(price)", "middle");
  card(mlG, 80, 206, 230, 70, "fillB");
  txt(mlG, 195, 236, "lbl", "redundant features", "middle");
  txt(mlG, 195, 258, "note", "high correlation = repeated information", "middle");
  card(mlG, 330, 206, 230, 70, "fillA");
  txt(mlG, 445, 236, "lbl", "used next", "middle");
  txt(mlG, 445, 258, "note", "PCA and the multivariate normal", "middle");

  var panel = el("g", {}, svg);
  card(panel, 390, 40, 236, 168, "fillG");
  var p1 = txt(panel, 508, 68, "note", "", "middle");
  var p2 = txt(panel, 508, 100, "mono", "", "middle");
  var p3 = txt(panel, 508, 132, "mono", "", "middle");
  var p4 = txt(panel, 508, 168, "big", "", "middle");
  var p5 = txt(panel, 508, 194, "note", "", "middle");

  function setTicks(scale) {
    XS.forEach(function (x, i) { xTicks[i].textContent = String(x * scale); });
  }

  function render(index, id) {
    var i = index;
    var key = i === 2 ? "neg" : i === 3 ? "flat" : i === 7 ? "para" : "pos";
    var ys = DATA[key];
    morph(ys, i === 0 ? 0 : 700);
    show(quadG, i === 4 || i === 7);
    show(meanG, i === 4 || i === 7);
    show(prodG, i === 4);
    show(curveG, i === 7);
    show(trendG, i >= 1 && i <= 3);
    show(trendPos, i === 1); show(trendNeg, i === 2); show(trendFlat, i === 3);
    show(axG, i !== 6 && i !== 8);
    vis(pts, i !== 6 && i !== 8);
    show(scaleG, i === 6);
    show(mlG, i === 8);
    show(panel, i !== 6 && i !== 8);
    setTicks(i === 5 ? 10 : 1);
    if (i === 4) { drawMeanAndQuads(DATA.pos); drawProducts(DATA.pos); }
    if (i === 7) drawMeanAndQuads(DATA.para);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = "";
    var c = cov(XS, ys), r = corr(XS, ys);
    if (i === 1) {
      setLine(trendPos, PXf(1) - 6, PYf(0.5), PXf(5) + 4, PYf(10.2));
      trendLbl.setAttribute("x", PXf(1) + 12); trendLbl.setAttribute("y", PYf(8.5)); trendLbl.textContent = "rising together";
    }
    if (i === 2) {
      setLine(trendNeg, PXf(1) - 6, PYf(10), PXf(5) + 4, PYf(0.8));
      trendLbl.setAttribute("x", PXf(3.2)); trendLbl.setAttribute("y", PYf(8.5)); trendLbl.textContent = "one up, one down";
    }
    if (i === 3) {
      setLine(trendFlat, PXf(1), PYf(4.6), PXf(5) + 4, PYf(4.6));
      trendLbl.setAttribute("x", PXf(1.2)); trendLbl.setAttribute("y", PYf(8.2)); trendLbl.textContent = "no consistent trend";
    }
    if (i === 0) { p1.textContent = "5 houses"; p2.textContent = "size (x) and price (y)"; p3.textContent = "do they move together?"; }
    if (i === 1) { p1.textContent = "both rise together"; p2.textContent = "Cov = " + fmt(c, 1); p3.textContent = "positive covariance"; }
    if (i === 2) { p1.textContent = "one rises, one falls"; p2.textContent = "Cov = " + fmt(c, 1); p3.textContent = "negative covariance"; }
    if (i === 3) { p1.textContent = "no straight-line trend"; p2.textContent = "Cov = " + fmt(c, 1); p3.textContent = "near-zero covariance"; }
    if (i === 4) { p1.textContent = "green: same side, + product"; p2.textContent = "products: 6, 2, 0, 1, 8"; p3.textContent = "average = 17 / 5"; p4.textContent = "Cov = 3.4"; }
    if (i === 5) { p1.textContent = "size measured ×10"; p2.textContent = "Cov:  3.4 → 34"; p3.textContent = "same shape of data"; p4.textContent = "Corr: 0.98 → 0.98"; p5.textContent = "correlation did not change"; }
    if (i === 7) { p1.textContent = "y = (x − 3)²"; p2.textContent = "Cov = 0.0"; p3.textContent = "Corr = 0.0"; p4.textContent = "y still depends on x!"; p5.textContent = "uncorrelated ≠ independent"; }
  }
