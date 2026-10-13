  var steps = [
    { id: "overfit-model", label: "The overfit model", caption: "The degree-4 curve (λ = 0) hits every training house but swings wildly outside them. Validation MSE: 3.0073." },
    { id: "large-weights", label: "Large weights", caption: "The wiggle comes from large weights on the curved terms. The sum of squared weights Σw² is 4.73. A flexible model with big weights can bend sharply." },
    { id: "add-penalty", label: "Add a penalty", caption: "Ridge changes what we minimize. Loss is still the squared error, but the objective = MSE + λ·Σw² adds a price for large weights. The intercept is left out of the penalty." },
    { id: "small-lambda", label: "A small λ = 0.01", caption: "A little penalty already tames the curve. Training MSE rises slightly to 0.0061 and validation MSE falls from 3.0073 to 0.7002. λ is a hyperparameter we choose; it is not the learning rate η." },
    { id: "balanced-lambda", label: "A balanced λ = 0.3", caption: "The weights shrink to Σw² = 0.752, the curve is smooth, training MSE is 0.091 and validation MSE is down to 0.0822. We traded a worse training fit for a better generalization." },
    { id: "large-lambda", label: "Too large: λ = 10", caption: "Now the penalty overwhelms the data: the weights are almost zero (Σw² = 0.009) and the curve is nearly flat. Both errors are high: training 1.018, validation 1.9712. This is underfitting." },
    { id: "compare-models", label: "Compare all the λ values", caption: "As λ grows, training error rises and the weights shrink. Validation error falls and then rises again; λ = 0.3 is the best of these." },
    { id: "generalization", label: "Choose λ by validation", caption: "Pick λ with held-out data, never by training error. Note that the plain straight line (validation 0.0111) still beats every ridge curve here: regularization rescues a flexible model, it does not beat a model that already suits the data." }
  ];

  var LAMS = [0, 0.01, 0.3, 1, 10];
  var FITS = LAMS.map(function (l) { return ridgeFit(HOUSES, 4, l); });
  var STATS = FITS.map(function (b, k) {
    return { tr: mseOf(function (x) { return polyAt(b, x); }, HOUSES), va: mseOf(function (x) { return polyAt(b, x); }, VALID), sw: sumSq(b), lam: LAMS[k] };
  });

  var plotG = el("g", {}, svg);
  var g = housePlot(plotG, 44, 318, 84, 32, 3.8, 9, [0, 3, 6, 9]);
  clipTo("plotclip", 44, 30, 340, 292);
  var COLS = ["#f472b6", "#a78bfa", "#1db584", "#e2b44a", "#38bdf8"];
  var curves = FITS.map(function (b, k) {
    return el("path", { d: fnPath(g, function (x) { return polyAt(b, x); }, 0.3, 3.8, 90), fill: "none", stroke: COLS[k], "stroke-width": 3, "clip-path": "url(#plotclip)" }, plotG);
  });
  var dotsT = dotSet(plotG, g, HOUSES, C_TRAIN, 6);
  var dotsV = dotSet(plotG, g, VALID, C_VALID, 5);
  var curveTag = txt(plotG, 60, 52, "lbl", "", "start");

  // Coefficient bars.
  var coefG = el("g", {}, svg);
  card(coefG, 392, 30, 240, 154, "fillA");
  txt(coefG, 512, 50, "lbl", "weights on the curved terms", "middle");
  var maxC = 0;
  FITS[0].slice(1).forEach(function (c) { maxC = Math.max(maxC, Math.abs(c)); });
  var ZERO = 114, CS = 46 / maxC;
  el("line", { x1: 404, y1: ZERO, x2: 620, y2: ZERO, class: "axis" }, coefG);
  var coefBars = [0, 1, 2, 3].map(function (k) {
    var x = 436 + k * 56;
    txt(coefG, x, 156, "lbl-s", "w" + (k + 1), "middle");
    return { x: x, bar: box(coefG, x - 14, ZERO, 28, 1, "#e2b44a", "none", 3), val: txt(coefG, x, ZERO, "tick", "", "middle") };
  });
  var swTxt = txt(coefG, 512, 175, "lbl lbl-y", "", "middle"); // inside the card, below the w labels
  function setCoefs(b) {
    coefBars.forEach(function (c, k) {
      var v = b[k + 1], h = Math.abs(v) * CS;
      setBox(c.bar, c.x - 14, v >= 0 ? ZERO - h : ZERO, 28, Math.max(1, h));
      c.val.setAttribute("y", v >= 0 ? ZERO - h - 4 : ZERO + h + 12);
      c.val.textContent = v.toFixed(2);
    });
  }

  // Readout card.
  var readG = el("g", { transform: "translate(0,16)" }, svg);
  card(readG, 392, 176, 240, 160, "fillG");
  var rLam = txt(readG, 410, 202, "mono", "", "start");
  var rTr = txt(readG, 410, 228, "mono", "", "start");
  var rVa = txt(readG, 410, 254, "mono", "", "start");
  var rSw = txt(readG, 410, 280, "mono", "", "start");
  var rObj = txt(readG, 410, 306, "mono", "", "start");
  function setRead(k) {
    var s = STATS[k];
    rLam.textContent = "λ = " + s.lam;
    rTr.textContent = "train MSE " + s.tr.toFixed(4);
    rVa.textContent = "valid MSE " + s.va.toFixed(4);
    rSw.textContent = "Σw² = " + s.sw.toFixed(3);
    rObj.textContent = "objective " + (s.tr + s.lam * s.sw).toFixed(4);
  }

  // Objective formula card.
  var objG = el("g", { transform: "translate(0,16)" }, svg);
  card(objG, 392, 176, 240, 160, "fillB");
  txt(objG, 512, 202, "lbl lbl-p", "ridge objective", "middle");
  txt(objG, 512, 234, "mono", "MSE  +  λ · Σw²", "middle");
  box(objG, 410, 252, 100, 26, "rgba(56,189,248,0.4)", "#38bdf8", 4);
  txt(objG, 460, 270, "note", "fit error", "middle");
  box(objG, 514, 252, 100, 26, "rgba(244,114,182,0.4)", "#f472b6", 4);
  txt(objG, 564, 270, "note", "weight penalty", "middle");
  txt(objG, 512, 304, "note", "λ prices large weights", "middle");
  txt(objG, 512, 322, "note", "(not the learning rate η)", "middle");

  // Comparison table.
  var tblG = el("g", {}, svg);
  card(tblG, 392, 30, 240, 306, "fillG");
  var CX = [430, 482, 538, 600];
  ["λ", "train", "valid", "Σw²"].forEach(function (h, c) { txt(tblG, CX[c], 56, "lbl lbl-y", h, "middle"); });
  var tRows = STATS.map(function (s, k) {
    var y = 86 + k * 34;
    var rb = box(tblG, 398, y - 18, 228, 28, "rgba(255,255,255,0)", "none", 4);
    txt(tblG, CX[0], y, "mono", String(s.lam), "middle");
    txt(tblG, CX[1], y, "note", s.tr.toFixed(4), "middle");
    txt(tblG, CX[2], y, "note", s.va.toFixed(4), "middle");
    txt(tblG, CX[3], y, "note", s.sw.toFixed(3), "middle");
    el("circle", { cx: 406, cy: y - 4, r: 4, fill: COLS[k] }, tblG);
    return rb;
  });
  txt(tblG, 512, 280, "note", "bigger λ: smaller weights, higher training error", "middle");
  txt(tblG, 512, 298, "note", "validation error: down, then up", "middle");

  // Validation-versus-lambda chart.
  var chartG = el("g", {}, svg);
  card(chartG, 392, 30, 240, 306, "fillA");
  txt(chartG, 512, 52, "lbl", "error as λ grows", "middle");
  var BY = 250, SC = 60;
  el("line", { x1: 404, y1: BY, x2: 622, y2: BY, class: "axis" }, chartG);
  STATS.forEach(function (s, k) {
    var x = 430 + k * 45, h1 = Math.max(2, s.tr * SC), h2 = Math.max(2, s.va * SC);
    box(chartG, x - 17, BY - h1, 16, h1, C_TRAIN, "none", 3);
    box(chartG, x + 1, BY - h2, 16, h2, C_VALID, "none", 3);
    txt(chartG, x, BY + 14, "tick", String(s.lam), "middle");
    txt(chartG, x + 9, BY - h2 - 4, "tick", s.va.toFixed(2), "middle");
  });
  txt(chartG, 512, BY + 30, "note", "ridge strength λ", "middle");
  txt(chartG, 512, BY + 50, "lbl lbl-g", "plain line: validation 0.0111", "middle");
  txt(chartG, 512, BY + 66, "note", "(lower than every validation bar above)", "middle");
  box(chartG, 538, 64, 12, 12, C_TRAIN, "none", 2); txt(chartG, 554, 74, "note", "training", "start");
  box(chartG, 538, 82, 12, 12, C_VALID, "none", 2); txt(chartG, 554, 92, "note", "validation", "start");
  var best = box(chartG, 430 + 2 * 45 - 20, 70, 40, BY - 62, "rgba(29,181,132,0.12)", "#1db584", 4);
  txt(chartG, 430 + 2 * 45, 84, "lbl lbl-g", "best", "middle");

  function showOnly(k) { curves.forEach(function (c, j) { c.setAttribute("opacity", j === k ? "1" : "0"); }); }

  function render(index, id) {
    var i = index;
    dotsV.forEach(function (d) { show(d, i >= 3); });
    show(coefG, i >= 0 && i <= 5);
    show(readG, i === 0 || (i >= 3 && i <= 5) || i === 1);
    show(objG, i === 2);
    show(tblG, i === 6);
    show(chartG, i === 7);
    show(curveTag, i <= 5);
    if (i <= 2) { showOnly(0); setCoefs(FITS[0]); setRead(0); swTxt.textContent = "Σw² = " + STATS[0].sw.toFixed(2) + (i >= 1 ? "   (large)" : ""); curveTag.textContent = "λ = 0 (no penalty)"; }
    if (i === 3) { showOnly(1); setCoefs(FITS[1]); setRead(1); swTxt.textContent = "Σw² = " + STATS[1].sw.toFixed(3); curveTag.textContent = "λ = 0.01"; }
    if (i === 4) { showOnly(2); setCoefs(FITS[2]); setRead(2); swTxt.textContent = "Σw² = " + STATS[2].sw.toFixed(3); curveTag.textContent = "λ = 0.3"; }
    if (i === 5) { showOnly(4); setCoefs(FITS[4]); setRead(4); swTxt.textContent = "Σw² = " + STATS[4].sw.toFixed(3); curveTag.textContent = "λ = 10 (too large)"; }
    if (i === 6) { curves.forEach(function (c) { c.setAttribute("opacity", "0.85"); }); }
    if (i === 7) { showOnly(2); }
    tRows.forEach(function (rb, k) { rb.setAttribute("fill", k === 2 ? "rgba(29,181,132,0.22)" : "rgba(255,255,255,0)"); });
    if (i === 1) { coefBars.forEach(function (c) { c.bar.setAttribute("fill", "#f87171"); }); }
    else { coefBars.forEach(function (c) { c.bar.setAttribute("fill", "#e2b44a"); }); }
  }
