  var steps = [
    { id: "outcomes", label: "The values of a fair die", caption: "Let X be the roll of a fair die. It can take the values 1, 2, 3, 4, 5 and 6. We want one number that says where the average of many rolls will settle." },
    { id: "probabilities", label: "Each value has a probability", caption: "Every value has probability 1/6. Expectation will weight each value by how likely it is. Here all weights are equal." },
    { id: "weight-values", label: "Weight each value by its probability", caption: "Multiply each value by its probability: 1 × 1/6, 2 × 1/6, and so on up to 6 × 1/6. Likely values would count for more; unlikely ones for less." },
    { id: "contributions", label: "Each value's contribution", caption: "Each product is that value's contribution to the average. Bigger values contribute more here, because all probabilities are equal." },
    { id: "sum", label: "Add the contributions", caption: "Place the contributions end to end. They add up to 1/6 + 2/6 + 3/6 + 4/6 + 5/6 + 6/6 = 21/6 = 3.5." },
    { id: "expected-value", label: "The expected value", caption: "E[X] = Σ x · P(X = x) = 3.5. It sits in the middle of the die's values, the balance point of the distribution. Notice that no roll can ever show 3.5." },
    { id: "repeated-experiment", label: "Repeat the experiment", caption: "Roll 12 times and track the running average: 6, 4, 4.3, 3.5, 3.6 ... It swings at first, then settles near 3.5. With more rolls it settles ever closer." },
    { id: "ml-loss", label: "Expectation in ML: expected loss", caption: "A model's error varies from example to example. Its expected loss weights each error by how often it happens: 0×0.5 + 1×0.3 + 4×0.2 = 1.1. Training tries to make this number small." }
  ];

  var CX = function (i) { return 70 + i * 100; };
  var facesG = el("g", {}, svg);
  for (var i = 0; i < 6; i++) {
    box(facesG, CX(i) - 34, 36, 68, 52, "rgba(56,189,248,0.16)", "#38bdf8", 10);
    txt(facesG, CX(i), 72, "big", String(i + 1), "middle").setAttribute("font-size", "24");
  }
  txt(facesG, 320, 24, "lbl", "values x", "middle");

  var probG = el("g", {}, svg);
  for (var j = 0; j < 6; j++) {
    box(probG, CX(j) - 28, 106, 56, 30, "rgba(244,114,182,0.3)", "#f472b6", 6);
    txt(probG, CX(j), 127, "lbl", "P = 1/6", "middle");
  }

  var wG = el("g", {}, svg);
  for (var k = 0; k < 6; k++) {
    txt(wG, CX(k), 170, "mono", (k + 1) + " × 1/6", "middle");
  }

  // Contribution segments: columns first, then stacked end to end.
  var segs = [];
  var segG = el("g", {}, svg);
  var UNIT = 140;
  var X0 = 70;
  for (var s = 0; s < 6; s++) {
    segs.push(box(segG, 0, 0, 10, 10, "rgba(29,181,132,0.75)", "#071510", 3));
  }
  var segLbls = [];
  for (var t = 0; t < 6; t++) segLbls.push(txt(segG, 0, 0, "lbl", (t + 1) + "/6", "middle"));
  function placeSegs(e) {
    var cum = 0;
    for (var q = 0; q < 6; q++) {
      var h = ((q + 1) / 6) * 120;
      var colX = CX(q) - 24, colY = 336 - h, colW = 48, colH = h;
      var w = ((q + 1) / 6) * UNIT;
      var stX = X0 + cum, stY = 170, stW = w - 2, stH = 56;
      cum += w;
      var x = lerp(colX, stX, e), y = lerp(colY, stY, e), ww = lerp(colW, stW, e), hh = lerp(colH, stH, e);
      setBox(segs[q], x, y, ww, hh);
      segs[q].setAttribute("fill", q % 2 ? "rgba(29,181,132,0.6)" : "rgba(29,181,132,0.9)");
      segLbls[q].setAttribute("x", x + ww / 2);
      segLbls[q].setAttribute("y", e < 0.5 ? y - 6 : y + hh / 2 + 4);
    }
  }
  var totalLbl = txt(svg, X0 + 3.5 * UNIT / 2, 156, "big", "21/6 = 3.5", "middle");
  var totalLine = el("line", { x1: X0, y1: 242, x2: X0 + 3.5 * UNIT, y2: 242, stroke: "#e2b44a", "stroke-width": 3 }, svg);
  var baseline = el("line", { x1: 30, y1: 336, x2: 610, y2: 336, class: "axis" }, svg);

  // Number line with the balance point.
  var nlG = el("g", {}, svg);
  el("line", { x1: 60, y1: 210, x2: 580, y2: 210, stroke: "#c9dccf", "stroke-width": 2 }, nlG);
  var NX = function (v) { return 90 + (v - 1) * 88; };
  for (var v = 1; v <= 6; v++) {
    el("line", { x1: NX(v), y1: 202, x2: NX(v), y2: 218, stroke: "#c9dccf", "stroke-width": 2 }, nlG);
    txt(nlG, NX(v), 238, "lbl", String(v), "middle");
  }
  el("polygon", { points: NX(3.5) + ",212 " + (NX(3.5) - 16) + ",246 " + (NX(3.5) + 16) + ",246", fill: "#e2b44a" }, nlG);
  txt(nlG, NX(3.5), 268, "big", "E[X] = 3.5", "middle");
  txt(nlG, NX(3.5), 292, "note", "the balance point: no face shows 3.5", "middle");

  // Running average chart.
  var rolls = [6, 2, 5, 1, 4, 3, 6, 2, 4, 3, 5, 1];
  var runAvg = [], acc = 0;
  rolls.forEach(function (r, idx) { acc += r; runAvg.push(acc / (idx + 1)); });
  var gr = makeGraph(70, 330, 40, 40);
  var runG = el("g", {}, svg);
  drawAxes(runG, gr, 12.8, 6.4, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6]);
  txt(runG, gr.x(12.8), gr.y(0) + 30, "note", "number of rolls", "end");
  txt(runG, gr.x(0) + 8, gr.y(6.4) - 2, "note", "running average", "start");
  var target = el("line", { x1: gr.x(0), y1: gr.y(3.5), x2: gr.x(12.6), y2: gr.y(3.5), stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "6 4" }, runG);
  txt(runG, gr.x(12.6), gr.y(3.5) + 20, "lbl lbl-y", "E[X] = 3.5", "end");
  var pts = runAvg.map(function (a, idx) { return el("circle", { cx: gr.x(idx + 1), cy: gr.y(a), r: 5, fill: "#38bdf8", stroke: "#071510", "stroke-width": 1.5 }, runG); });
  var runLine = el("polyline", { fill: "none", stroke: "#38bdf8", "stroke-width": 2 }, runG);
  var runNote = txt(runG, 330, 70, "mono", "", "middle");
  function drawRun(e) {
    var n = Math.max(1, Math.round(e * 12));
    var pp = [];
    for (var q = 0; q < 12; q++) {
      pts[q].setAttribute("opacity", q < n ? "1" : "0");
      if (q < n) pp.push(gr.x(q + 1) + "," + gr.y(runAvg[q]));
    }
    runLine.setAttribute("points", pp.join(" "));
    runNote.textContent = "after " + n + " rolls: average " + fmt(runAvg[n - 1], 2);
  }

  // Expected loss.
  var lossG = el("g", {}, svg);
  txt(lossG, 320, 40, "lbl", "a model's squared error on a random example", "middle");
  [[0, 0.5], [1, 0.3], [4, 0.2]].forEach(function (r, idx) {
    var y = 62 + idx * 62;
    card(lossG, 60, y, 150, 48, "fillB");
    txt(lossG, 135, y + 31, "big", "error = " + r[0], "middle");
    box(lossG, 230, y + 8, r[1] * 360, 32, "rgba(244,114,182,0.8)", "none", 4);
    txt(lossG, 230 + r[1] * 360 + 8, y + 30, "lbl", "probability " + r[1], "start");
  });
  card(lossG, 60, 262, 520, 70, "fillG");
  txt(lossG, 320, 290, "mono", "0 × 0.5  +  1 × 0.3  +  4 × 0.2", "middle");
  txt(lossG, 320, 318, "big", "expected loss = 1.1", "middle");

  function render(index, id) {
    var i = index;
    show(facesG, i <= 3);
    show(probG, i >= 1 && i <= 3);
    show(wG, i >= 2 && i <= 3);
    show(segG, i >= 3 && i <= 4);
    show(baseline, i >= 3 && i <= 4);
    show(totalLbl, i === 4); show(totalLine, i === 4);
    show(nlG, i === 5);
    show(runG, i === 6);
    show(lossG, i === 7);
    var dy = [100, 84, 40, 0][Math.min(i, 3)];
    place(facesG, 0, dy);
    place(probG, 0, i === 1 ? dy : i === 2 ? 30 : 0);
    place(wG, 0, i === 2 ? 20 : 0);
    if (i === 3) placeSegs(0);
    if (i === 4) anim("segs", 1300, function (e) { placeSegs(e); });
    if (i === 6) anim("run", 3000, function (e) { drawRun(e); });
  }
