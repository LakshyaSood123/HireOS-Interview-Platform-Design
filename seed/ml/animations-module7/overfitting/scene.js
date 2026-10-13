  var steps = [
    { id: "dataset", label: "The training houses", caption: "Our five training houses again. They follow a clear upward trend with a little scatter." },
    { id: "simple-model", label: "A very simple model", caption: "The simplest model ignores size and always predicts the average price, 3.56. It is a flat line." },
    { id: "underfit", label: "Underfitting", caption: "A flat line misses the trend: the residuals are large almost everywhere, and the training MSE is 1.2024. High error even on the training data means underfitting, which is not the same as overfitting." },
    { id: "better-fit", label: "A better fit", caption: "A straight line w = 1.54, b = 0.48 follows the trend and its training MSE drops to 0.0166. It is simple but captures the pattern." },
    { id: "flexible-model", label: "A very flexible model", caption: "A degree-4 curve has five parameters for five houses, enough freedom to bend through every point." },
    { id: "training-perfect", label: "Perfect on the training set", caption: "The curve passes exactly through all five houses: training MSE 0.0. It looks like the best model, but training error alone cannot tell us whether it learned the pattern or the noise." },
    { id: "validation-data", label: "Bring in validation houses", caption: "Three houses the model never saw: (0.75, 1.7), (1.75, 3.3) and (3.4, 5.6). They were held back from fitting, so they test how well each model generalizes." },
    { id: "overfit-revealed", label: "Overfitting revealed", caption: "The curve predicts 2.32, 3.32 and 8.54 for them, against true prices 1.7, 3.3 and 5.6. Its validation MSE is 3.0073 while the line scores 0.0111. Training error 0.0 against validation error 3.0073 is overfitting." },
    { id: "generalization", label: "Generalization is the goal", caption: "Underfit: high error on both sets. Good fit: low on both. Overfit: low on training, much higher on new data. We want models that generalize." }
  ];

  var plotG = el("g", {}, svg);
  var g = housePlot(plotG, 44, 318, 84, 32, 3.8, 9, [0, 3, 6, 9]);
  clipTo("plotclip", 44, 30, 340, 292);
  var constLine = el("path", { class: "curve-y", d: wbPath(g, 0, 3.56, 0, 3.8), "clip-path": "url(#plotclip)" }, plotG);
  var lineWB = lineFit(HOUSES);
  var fitLine = el("path", { class: "curve-g", d: wbPath(g, lineWB[0], lineWB[1], 0, 3.8), "clip-path": "url(#plotclip)" }, plotG);
  var beta4 = ridgeFit(HOUSES, 4, 0);
  var curve = el("path", { class: "curve-p", d: fnPath(g, function (x) { return polyAt(beta4, x); }, 0.35, 3.8, 90), "clip-path": "url(#plotclip)" }, plotG);
  var resConst = HOUSES.map(function (d) { return el("line", { x1: g.x(d[0]), y1: g.y(3.56), x2: g.x(d[0]), y2: g.y(d[1]), stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, plotG); });
  var valRes = VALID.map(function (d) { return el("line", { x1: g.x(d[0]), y1: g.y(polyAt(beta4, d[0])), x2: g.x(d[0]), y2: g.y(d[1]), stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, plotG); });
  var valPred = VALID.map(function (d) { return el("circle", { cx: g.x(d[0]), cy: g.y(polyAt(beta4, d[0])), r: 6, fill: "none", stroke: "#f472b6", "stroke-width": 3 }, plotG); });
  var dotsT = dotSet(plotG, g, HOUSES, C_TRAIN, 6);
  var dotsV = dotSet(plotG, g, VALID, C_VALID, 6);
  var valLbl = txt(plotG, g.x(3.4) + 12, g.y(5.6) + 18, "lbl lbl-b", "held out", "start");
  var badge = el("g", {}, svg);
  var badgeBox = card(badge, 56, 40, 214, 28, "fillB");
  var badgeTxt = txt(badge, 163, 59, "lbl", "", "middle");

  // Bar chart: train vs validation error for three models.
  var chart = el("g", {}, svg);
  card(chart, 392, 30, 240, 306, "fillA");
  txt(chart, 512, 52, "lbl", "error on training vs validation", "middle");
  var BASEY = 262, SC = 58;
  var MODELS = [
    { name: "flat", tag: "underfit", tr: 1.2024, va: 2.5629, x: 428 },
    { name: "line", tag: "good fit", tr: 0.0166, va: 0.0111, x: 512 },
    { name: "curve", tag: "overfit", tr: 0.0, va: 3.0073, x: 596 }
  ];
  el("line", { x1: 402, y1: BASEY, x2: 622, y2: BASEY, class: "axis" }, chart);
  var slots = MODELS.map(function (m) {
    var sg = el("g", {}, chart);
    var h1 = Math.max(2, m.tr * SC), h2 = Math.max(2, m.va * SC);
    box(sg, m.x - 24, BASEY - h1, 22, h1, C_TRAIN, "none", 3);
    box(sg, m.x + 2, BASEY - h2, 22, h2, C_VALID, "none", 3);
    var small1 = m.tr < 0.1, small2 = m.va < 0.1;
    txt(sg, small1 ? m.x - 2 : m.x - 13, BASEY - h1 - 5, "tick", m.tr.toFixed(small1 ? (m.tr === 0 ? 1 : 4) : 2), small1 ? "end" : "middle");
    txt(sg, small2 ? m.x + 2 : m.x + 13, BASEY - h2 - 5, "tick", m.va.toFixed(small2 ? 4 : 2), small2 ? "start" : "middle");
    txt(sg, m.x, BASEY + 16, "lbl", m.name, "middle");
    txt(sg, m.x, BASEY + 32, "note", m.tag, "middle");
    return sg;
  });
  box(chart, 404, 308, 12, 12, C_TRAIN, "none", 2); txt(chart, 420, 318, "note", "training", "start");
  box(chart, 480, 308, 12, 12, C_VALID, "none", 2); txt(chart, 496, 318, "note", "validation", "start");

  function setBadge(s) { badgeTxt.textContent = s; }

  function render(index, id) {
    var i = index;
    show(constLine, i === 1 || i === 2);
    resConst.forEach(function (r) { show(r, i === 2); });
    show(fitLine, i === 3 || i >= 4);
    fitLine.setAttribute("opacity", i === 3 ? "1" : i >= 4 ? "0.45" : "0");
    show(curve, i >= 4);
    dotsV.forEach(function (d) { show(d, i >= 6); });
    show(valLbl, i === 6);
    valRes.forEach(function (r) { show(r, i === 7); });
    valPred.forEach(function (r) { show(r, i === 7); });
    show(badge, i === 2 || i === 3 || i === 5 || i === 7);
    show(chart, i >= 7);
    slots.forEach(function (s, k) { show(s, i === 8 || (i === 7 && k > 0)); });
    if (i === 2) setBadge("underfit: training MSE 1.2024");
    if (i === 3) setBadge("training MSE 0.0166");
    if (i === 5) setBadge("curve: training MSE 0.0");
    if (i === 7) setBadge("validation MSE: line 0.0111, curve 3.0073");
    badgeBox.setAttribute("width", i === 7 ? "290" : "214");
    badgeTxt.setAttribute("x", i === 7 ? 201 : 163);
  }
