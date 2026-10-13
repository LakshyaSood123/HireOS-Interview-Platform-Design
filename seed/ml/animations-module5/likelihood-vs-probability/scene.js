  var steps = [
    { id: "fixed-model", label: "Probability: fix the model", caption: "Suppose we KNOW the coin has p = 0.7. The model is fixed. Probability asks what data this model could produce." },
    { id: "possible-data", label: "Possible data, with probabilities", caption: "Flip 5 times. The number of heads could be 0 to 5, and each possible result has a probability: 0.002, 0.028, 0.132, 0.309, 0.360, 0.168. The data vary; the parameter does not. These add up to 1." },
    { id: "observe-data", label: "We observe one result", caption: "We flip the coin and see 4 heads out of 5. Of all the possible data, this is the one that actually happened." },
    { id: "freeze-data", label: "Likelihood: freeze the data", caption: "Now turn the viewpoint around. The data are frozen: 4 heads in 5. We no longer know p. Instead we ask how well each candidate p explains the frozen data." },
    { id: "vary-parameter", label: "Vary the parameter", caption: "Slide p from 0.1 to 0.9 and evaluate the same formula, 5 × p⁴ × (1 − p), at each p. The values trace the likelihood function L(p). Now the parameter varies and the data stay fixed." },
    { id: "compare-likelihood", label: "Compare candidate values of p", caption: "L(0.7) ≈ 0.360 and L(0.4) ≈ 0.077: p = 0.7 explains the observed data about 4.7 times better than p = 0.4. We are comparing parameter values, not asking whether p is true." },
    { id: "probability-vs-likelihood", label: "Side by side", caption: "Probability: model fixed, data vary, the values add up to 1. Likelihood: data fixed, parameter varies, the values do NOT have to add up to 1, and they are not the probability that a p is true." },
    { id: "ml-connection", label: "Both views appear in ML", caption: "Training uses likelihood: the training data are fixed and parameters are adjusted to explain them. Using a trained model asks the probability question: parameters fixed, what data are likely?" }
  ];

  function binom(k, n, p) {
    var c = 1;
    for (var i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
    return c * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  function Lk(p) { return 5 * Math.pow(p, 4) * (1 - p); }
  var PV = [0, 1, 2, 3, 4, 5].map(function (k) { return binom(k, 5, 0.7); });
  var SC = 360; // pixels per unit probability

  // Left panel: PROBABILITY.
  var leftG = el("g", {}, svg);
  card(leftG, 14, 24, 296, 300, "fillA");
  txt(leftG, 162, 48, "lbl lbl-b", "PROBABILITY", "middle");
  box(leftG, 56, 58, 212, 28, "rgba(56,189,248,0.25)", "#38bdf8", 14);
  txt(leftG, 162, 77, "lbl", "model fixed: p = 0.7", "middle");
  var lBase = 280;
  el("line", { x1: 30, y1: lBase, x2: 296, y2: lBase, class: "axis" }, leftG);
  var lBars = [], lVals = [];
  PV.forEach(function (v, k) {
    var cx = 54 + k * 44;
    lBars.push(box(leftG, cx - 15, lBase, 30, 0, "rgba(56,189,248,0.85)", "none", 3));
    lVals.push(txt(leftG, cx, lBase - 6, "lbl", fmt(v, 3), "middle"));
    txt(leftG, cx, lBase + 16, "tick", String(k), "middle");
  });
  txt(leftG, 162, lBase + 36, "note", "possible data: number of heads in 5 flips", "middle");
  var lSum = txt(leftG, 162, 110, "lbl lbl-b", "all possible data: probabilities add up to 1", "middle");
  var lPick = el("rect", { x: 54 + 4 * 44 - 21, y: lBase - PV[4] * SC - 24, width: 42, height: PV[4] * SC + 40, rx: 8, fill: "none", stroke: "#e2b44a", "stroke-width": 3 }, leftG);
  var lPickLbl = txt(leftG, 54 + 4 * 44, lBase - PV[4] * SC - 32, "lbl lbl-y", "observed: 4 heads", "middle"); // above the bracket, not under its top edge

  // Right panel: LIKELIHOOD.
  var rightG = el("g", {}, svg);
  card(rightG, 330, 24, 296, 300, "fillB");
  txt(rightG, 478, 48, "lbl lbl-p", "LIKELIHOOD", "middle");
  box(rightG, 358, 58, 240, 28, "rgba(244,114,182,0.25)", "#f472b6", 14);
  txt(rightG, 478, 77, "lbl", "data fixed: 4 heads in 5", "middle");
  var gr = makeGraph(366, 280, 232, 300);
  el("line", { x1: gr.x(0), y1: gr.y(0), x2: gr.x(1.02), y2: gr.y(0), class: "axis" }, rightG);
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (t) { txt(rightG, gr.x(t), gr.y(0) + 16, "tick", String(t), "middle"); });
  txt(rightG, 478, 316, "note", "candidate parameter p", "middle");
  var curve = el("path", { class: "curve-p" }, rightG);
  var sweepDot = el("circle", { r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, rightG);
  var readout = txt(rightG, 478, 110, "mono", "", "middle");
  var cmpG = el("g", {}, rightG);
  [[0.7, "#1db584"], [0.4, "#e2b44a"]].forEach(function (c) {
    el("circle", { cx: gr.x(c[0]), cy: gr.y(Lk(c[0])), r: 8, fill: c[1], stroke: "#071510", "stroke-width": 2 }, cmpG);
    el("line", { x1: gr.x(c[0]), y1: gr.y(Lk(c[0])), x2: gr.x(c[0]), y2: gr.y(0), stroke: c[1], "stroke-width": 2, "stroke-dasharray": "5 4" }, cmpG);
    txt(cmpG, gr.x(c[0]), gr.y(Lk(c[0])) - 12, "lbl", "p = " + c[0] + ": " + fmt(Lk(c[0]), 3), "middle");
  });
  txt(cmpG, 478, 132, "lbl lbl-g", "0.7 explains the data ≈ 4.7× better than 0.4", "middle");
  var rSum = txt(rightG, 478, 110, "lbl lbl-p", "values need NOT add up to 1", "middle");

  function drawCurve(upto) {
    var d = "";
    for (var t = 0.05; t <= upto + 1e-9; t += 0.01) d += (d ? " L " : "M ") + gr.x(t).toFixed(1) + " " + gr.y(Lk(t)).toFixed(1);
    curve.setAttribute("d", d || "M 0 0");
    sweepDot.setAttribute("cx", gr.x(upto)); sweepDot.setAttribute("cy", gr.y(Lk(upto)));
    readout.textContent = "p = " + fmt(upto, 2) + "    L = " + fmt(Lk(upto), 3);
  }

  var mlG = el("g", {}, svg);
  card(mlG, 40, 50, 270, 240, "fillA");
  txt(mlG, 175, 84, "lbl lbl-b", "USING a trained model", "middle");
  txt(mlG, 175, 118, "big", "parameters fixed", "middle");
  txt(mlG, 175, 146, "lbl", "what data are likely?", "middle");
  txt(mlG, 175, 200, "note", "this is a probability question", "middle");
  txt(mlG, 175, 232, "note", "e.g. how likely is a new example", "middle");
  card(mlG, 330, 50, 270, 240, "fillB");
  txt(mlG, 465, 84, "lbl lbl-p", "TRAINING a model", "middle");
  txt(mlG, 465, 118, "big", "data fixed", "middle");
  txt(mlG, 465, 146, "lbl", "which parameters explain them?", "middle");
  txt(mlG, 465, 200, "note", "this is a likelihood question", "middle");
  txt(mlG, 465, 232, "note", "e.g. maximum likelihood fitting", "middle");

  function render(index, id) {
    var i = index;
    show(leftG, i <= 6);
    show(rightG, i >= 3 && i <= 6);
    show(mlG, i === 7);
    show(lSum, i === 1 || i === 6);
    show(lPick, i >= 2 && i <= 5); show(lPickLbl, i >= 2 && i <= 5);
    show(rSum, i === 6);
    show(cmpG, i === 5 || i === 6);
    show(sweepDot, i === 4);
    show(readout, i === 4);
    leftG.setAttribute("opacity", i >= 3 && i <= 5 ? "0.35" : i === 7 ? "0" : "1");
    PV.forEach(function (v, k) {
      var h = i >= 1 ? v * SC : 0;
      setBox(lBars[k], 54 + k * 44 - 15, lBase - h, 30, h);
      lBars[k].setAttribute("fill", k === 4 && i >= 2 ? "rgba(226,180,74,0.95)" : "rgba(56,189,248,0.85)");
      show(lVals[k], i >= 1);
      lVals[k].setAttribute("y", lBase - h - 6);
    });
    if (i >= 3 && i !== 4) drawCurve(i === 3 ? 0.05 : 0.95);
    if (i === 3) { curve.setAttribute("d", "M 0 0"); }
    if (i === 4) anim("sweep", 2800, function (e) { drawCurve(0.1 + 0.8 * e); });
    if (i === 1) anim("bars", 900, function (e) {
      PV.forEach(function (v, k) { var h = v * SC * e; setBox(lBars[k], 54 + k * 44 - 15, lBase - h, 30, h); lVals[k].setAttribute("y", lBase - h - 6); });
    });
  }
