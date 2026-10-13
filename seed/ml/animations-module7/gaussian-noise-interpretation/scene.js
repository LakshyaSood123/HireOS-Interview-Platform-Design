  var steps = [
    { id: "perfect-line", label: "An imagined perfect line", caption: "Suppose prices really follow the underlying line y = 1.5x + 0.5. If there were no noise, every house would sit exactly on it (the rings)." },
    { id: "add-noise", label: "Add random noise", caption: "Real prices carry random disturbances: y = 1.5x + 0.5 + ε. Each house is nudged off the line by its own small amount ε." },
    { id: "noisy-observations", label: "What we actually observe", caption: "We only see the nudged points, never the perfect line. The red bars are the noise ε = y − (1.5x + 0.5): 0, +0.05, +0.20, −0.15, +0.20." },
    { id: "residuals", label: "Collect the noise values", caption: "Move the five noise values onto a number line. They are small, positive and negative, and cluster around zero. (Residuals of a fitted line use the opposite sign, ŷ − y; the sizes are the same.)" },
    { id: "gaussian-noise", label: "Model noise as Gaussian", caption: "Assume each ε is drawn from a bell curve centred at 0 with spread σ = 0.2. Small disturbances are common and big ones rare, and every house has its own bell around the line." },
    { id: "likelihood-view", label: "Likelihood of the observations", caption: "For a candidate line, read the bell height at each observed price. The likelihood is the product of those heights: 1.99 × 1.93 × 1.21 × 1.51 × 1.21 ≈ 8.50. A line whose bells sit under the data scores high." },
    { id: "mse-connection", label: "Maximum likelihood is least squares", caption: "−log L = (n/2)·log(2πσ²) + SSE/(2σ²). With σ fixed, the smaller the squared error, the larger the likelihood. The line with the lowest MSE also has the lowest negative log-likelihood." },
    { id: "ml-interpretation", label: "What this means for ML", caption: "Squared error is not arbitrary: it is what you minimize when you assume independent Gaussian noise of constant spread. If noise is heavy-tailed or its spread changes, another loss may be better." }
  ];

  var SIG = 0.2;
  var NOISE = HOUSES.map(function (d) { return d[1] - (1.5 * d[0] + 0.5); });

  var plotG = el("g", {}, svg);
  var g = housePlot(plotG, 46, 318, 84, 56, 3.8, 5.6, [0, 1, 2, 3, 4, 5]);
  clipTo("plotclip", 46, 8, 330, 314);
  var trueLine = el("path", { class: "curve-g", d: wbPath(g, 1.5, 0.5, 0, 3.8), "clip-path": "url(#plotclip)", "stroke-dasharray": "7 5" }, plotG);
  var rings = HOUSES.map(function (d) {
    return el("circle", { cx: g.x(d[0]), cy: g.y(1.5 * d[0] + 0.5), r: 7, fill: "none", stroke: C_FIT, "stroke-width": 3 }, plotG);
  });
  var bellG = el("g", {}, plotG);
  HOUSES.forEach(function (d) {
    var yc = 1.5 * d[0] + 0.5, pts = "", k;
    for (k = 0; k <= 40; k++) {
      var yy = yc - 0.7 + (1.4 * k) / 40;
      pts += (k ? " L " : "M ") + (g.x(d[0]) + 0.13 * pdf(yy - yc, SIG) * g.sx).toFixed(1) + " " + g.y(yy).toFixed(1);
    }
    el("path", { d: pts + " L " + g.x(d[0]) + " " + g.y(yc + 0.7) + " L " + g.x(d[0]) + " " + g.y(yc - 0.7) + " Z", fill: "rgba(56,189,248,0.28)", stroke: "#38bdf8", "stroke-width": 1.5 }, bellG);
  });
  var noiseBars = HOUSES.map(function () { return el("line", { stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, plotG); });
  var dotsA = dotSet(plotG, g, HOUSES, C_TRAIN, 6);
  var mkG = el("g", {}, plotG);
  HOUSES.forEach(function (d) {
    var yc = 1.5 * d[0] + 0.5, e = d[1] - yc;
    var hx = g.x(d[0]) + 0.13 * pdf(e, SIG) * g.sx;
    el("line", { x1: g.x(d[0]), y1: g.y(d[1]), x2: hx, y2: g.y(d[1]), stroke: "#e6f5ec", "stroke-width": 3 }, mkG);
    el("circle", { cx: hx, cy: g.y(d[1]), r: 4, fill: "#e6f5ec" }, mkG);
  });

  function placeDots(e) {
    HOUSES.forEach(function (d, i) {
      var yc = 1.5 * d[0] + 0.5;
      var yy = lerp(yc, d[1], e);
      dotsA[i].setAttribute("cy", g.y(yy));
      setLine(noiseBars[i], g.x(d[0]), g.y(yc), g.x(d[0]), g.y(yy));
    });
  }

  // Right panel: number line of noise values, and the bell curve.
  var panelG = el("g", {}, svg);
  card(panelG, 400, 30, 232, 214, "fillA");
  var NX = function (v) { return 516 + v * 250; };
  var BASE = 196;
  txt(panelG, 516, 52, "lbl", "noise ε = y − (1.5x + 0.5)", "middle");
  el("line", { x1: NX(-0.43), y1: BASE, x2: NX(0.43), y2: BASE, class: "axis" }, panelG);
  [-0.4, -0.2, 0, 0.2, 0.4].forEach(function (v) { txt(panelG, NX(v), BASE + 13, "tick", v.toFixed(1), "middle"); });
  var bellPts = "";
  for (var kk = 0; kk <= 60; kk++) {
    var vv = -0.43 + (0.86 * kk) / 60;
    bellPts += (kk ? " L " : "M ") + NX(vv).toFixed(1) + " " + (BASE - pdf(vv, SIG) * 52).toFixed(1);
  }
  var bellCurve = el("path", { class: "curve", d: bellPts }, panelG);
  var numDots = HOUSES.map(function (d, i) {
    return el("circle", { cx: NX(NOISE[i]), cy: BASE - 7 - (i % 2) * 0, r: 6, fill: C_TRAIN, stroke: "#071510", "stroke-width": 2 }, panelG);
  });
  var dropLines = HOUSES.map(function (d, i) {
    return el("line", { x1: NX(NOISE[i]), y1: BASE, x2: NX(NOISE[i]), y2: BASE - pdf(NOISE[i], SIG) * 52, stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "3 3" }, panelG);
  });
  var panelNote = txt(panelG, 516, 74, "note", "", "middle");
  var likTxt = txt(panelG, 516, 234, "mono", "", "middle");

  // mse-connection table
  var tblG = el("g", {}, svg);
  card(tblG, 30, 34, 580, 250, "fillG");
  var TCOL = [60, 250, 360, 470, 575];
  ["line", "Σ squared residuals", "MSE", "−log L (σ = 0.2)"].forEach(function (h, c) {
    txt(tblG, [60, 235, 365, 500][c], 66, "lbl lbl-y", h, c === 0 ? "start" : "middle");
  });
  var LINES = [[1.0, 1.0], [1.5, 0.5], [1.54, 0.48]];
  var rowBoxes = [];
  LINES.forEach(function (wb, r) {
    var y = 106 + r * 44;
    var sse = 0;
    HOUSES.forEach(function (d) { var e = wb[0] * d[0] + wb[1] - d[1]; sse += e * e; });
    var nllv = HOUSES.length / 2 * Math.log(2 * Math.PI * SIG * SIG) + sse / (2 * SIG * SIG);
    var rb = box(tblG, 44, y - 22, 552, 36, "rgba(255,255,255,0.0)", "none", 6);
    rowBoxes.push(rb);
    txt(tblG, 60, y, "mono", "w=" + wb[0].toFixed(2) + " b=" + wb[1].toFixed(2), "start");
    txt(tblG, 235, y, "mono", sse.toFixed(3), "middle");
    txt(tblG, 365, y, "mono", (sse / 5).toFixed(4), "middle");
    txt(tblG, 500, y, "mono", nllv.toFixed(2), "middle");
  });
  txt(tblG, 320, 244, "lbl lbl-g", "smaller squared error  ⇔  smaller −log L  ⇔  higher likelihood", "middle");
  var winNote = txt(tblG, 320, 268, "note", "", "middle");

  var mlG = el("g", {}, svg);
  var mlBoxes = [["Assume", "y = w·x + b + ε", "ε ~ Gaussian(0, σ²)"], ["Maximize", "the likelihood", "of the observed prices"], ["Equivalent to", "least squares", "minimize squared residuals"]];
  mlBoxes.forEach(function (b, i) {
    var x = 30 + i * 205;
    card(mlG, x, 50, 180, 110, i === 2 ? "fillG" : i === 1 ? "fillB" : "fillA");
    txt(mlG, x + 90, 80, "lbl lbl-y", b[0], "middle");
    txt(mlG, x + 90, 110, "big", b[1], "middle").setAttribute("font-size", "14");
    txt(mlG, x + 90, 134, "note", b[2], "middle");
    if (i < 2) { var ar = arrow(mlG, "w", 3); setLine(ar, x + 184, 105, x + 201, 105); }
  });
  txt(mlG, 320, 206, "lbl lbl-r", "Caution: Gaussian noise is an assumption, not a law", "middle");
  txt(mlG, 320, 230, "note", "heavy-tailed noise (rare huge outliers) or changing spread → consider another loss", "middle");

  function render(index, id) {
    var i = index;
    show(plotG, i <= 5);
    show(trueLine, true);
    rings.forEach(function (r) { show(r, i <= 1); });
    dotsA.forEach(function (d) { show(d, i >= 1); });
    noiseBars.forEach(function (b) { show(b, i >= 1 && i <= 3); });
    show(bellG, i === 4 || i === 5);
    show(mkG, i === 5);
    show(panelG, i >= 3 && i <= 5);
    show(tblG, i === 6);
    show(mlG, i === 7);
    if (i === 0) placeDots(0);
    if (i === 1) anim("noise", 1100, placeDots);
    if (i >= 2) placeDots(1);
    if (i >= 3 && i <= 5) {
      var showBell = i >= 4;
      show(bellCurve, showBell);
      dropLines.forEach(function (d) { show(d, i >= 4); });
      numDots.forEach(function (d, k) {
        d.setAttribute("cy", i >= 4 ? BASE - pdf(NOISE[k], SIG) * 52 : BASE - 7);
      });
      panelNote.textContent = i === 3 ? "small, both signs, centred near 0" : i === 4 ? "bell curve: σ = 0.2" : "bell height at each noise value";
      var prod = 1;
      NOISE.forEach(function (e) { prod *= pdf(e, SIG); });
      likTxt.textContent = i === 5 ? "likelihood ≈ " + prod.toFixed(2) : "";
    }
    if (i === 6) {
      rowBoxes.forEach(function (rb, r) { rb.setAttribute("fill", r === 2 ? "rgba(29,181,132,0.25)" : "rgba(255,255,255,0.0)"); });
      winNote.textContent = "the fitted line (w = 1.54, b = 0.48) wins on all three";
    }
  }
