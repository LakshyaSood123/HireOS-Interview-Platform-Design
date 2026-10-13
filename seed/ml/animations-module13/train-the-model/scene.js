  var steps = [
    {"id": "training-data", "label": "Training data", "caption": "Eight toy training customers: days since last activity, and whether they churned."},
    {"id": "initial-parameters", "label": "Initial parameters", "caption": "The weight and bias start at 0, so every customer gets probability 0.5. The learning rate 0.5 is our choice."},
    {"id": "predictions", "label": "Predictions", "caption": "With w = 0 and b = 0 every prediction is 0.5, far from the labels of the churners."},
    {"id": "loss", "label": "Loss", "caption": "The log-loss of these predictions is 0.693 (ln 2): high, because nothing has been learned."},
    {"id": "gradient", "label": "Gradient", "caption": "The gradient says how the loss changes with each parameter. We will step the other way."},
    {"id": "update", "label": "Update", "caption": "w = w - 0.5 grad_w and b = b - 0.5 grad_b: the loss falls from 0.693 to 0.667."},
    {"id": "repeat", "label": "Repeat", "caption": "Repeat predict, loss, gradient, update. Every step uses the training data only."},
    {"id": "loss-decreases", "label": "Loss decreases", "caption": "Over five steps the loss falls from 0.693 to 0.602."},
    {"id": "trained-model", "label": "Trained model", "caption": "The trained parameters are w = 0.287 and b = -0.378. Validation data was never used in this loop."}
  ];

  var TD = [2, 5, 8, 12, 20, 25, 30, 35], TY = [0, 0, 0, 0, 1, 0, 1, 1], TX = TD.map(function (d) { return d / 10; });
  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function lossAt(w, b) { var s = 0; TX.forEach(function (x, i) { var p = sig(w * x + b); s += -(TY[i] * Math.log(p) + (1 - TY[i]) * Math.log(1 - p)); }); return s / TX.length; }
  var ST = [[0, 0]], GR = [];
  for (var gs = 0; gs < 5; gs++) {
    var cw = ST[gs][0], cb = ST[gs][1], gw = 0, gb = 0;
    TX.forEach(function (x, i) { var e = sig(cw * x + cb) - TY[i]; gw += e * x / TX.length; gb += e / TX.length; });
    GR.push([gw, gb]); ST.push([cw - 0.5 * gw, cb - 0.5 * gb]);
  }
  var LS = ST.map(function (s) { return lossAt(s[0], s[1]); });
  var PX = function (v) { return 50 + v * 82; }, PY = function (p) { return 270 - p * 190; };
  el("line", { x1: 40, y1: 270, x2: 350, y2: 270, class: "axis" }, svg); el("line", { x1: 40, y1: 270, x2: 40, y2: 70, class: "axis" }, svg);
  [0, 1, 2, 3].forEach(function (v) { txt(svg, PX(v), 286, "tick", String(v * 10), "middle"); });
  [[0, "0"], [0.5, "0.5"], [1, "1"]].forEach(function (r) { txt(svg, 34, PY(r[0]) + 4, "tick", r[1], "end"); });
  txt(svg, 350, 302, "note", "days since last activity", "end"); txt(svg, 46, 62, "note", "predicted churn probability", "start");
  function curveFor(s, color, wdt) { var d = ""; for (var v = 0; v <= 3.7; v += 0.1) d += (v ? " L " : "M ") + PX(v).toFixed(1) + " " + PY(sig(s[0] * v + s[1])).toFixed(1); return el("path", { d: d, fill: "none", stroke: color, "stroke-width": wdt || 3 }, svg); }
  var curves = ST.map(function (s, k) { return curveFor(s, k === 5 ? K_VA : "#38bdf8", k === 5 ? 4 : 2.5); });
  var resid = TX.map(function (x, i) { return el("line", { x1: PX(x), y1: PY(TY[i]), x2: PX(x), y2: PY(sig(0 * x)), stroke: K_BAD, "stroke-width": 2, "stroke-dasharray": "4 3" }, svg); });
  var pts = TX.map(function (x, i) { return el("circle", { cx: PX(x), cy: PY(TY[i]), r: 7, fill: TY[i] ? K_BAD : K_OK, stroke: "#071510", "stroke-width": 2 }, svg); });
  txt(svg, 200, 330, "note", "red = churned, green = stayed (8 toy training customers)", "middle");
  // loss chart
  var LG = el("g", {}, svg);
  card(LG, 410, 56, 222, 124, "fillA");
  txt(LG, 521, 76, "lbl lbl-y", "loss on the training data", "middle");
  var LX = function (s) { return 436 + s * 36; }, LY = function (l) { return 152 - (l - 0.58) / 0.12 * 66; };
  el("line", { x1: 430, y1: 160, x2: 620, y2: 160, class: "axis" }, LG);
  [0, 1, 2, 3, 4, 5].forEach(function (s) { txt(LG, LX(s), 174, "tick", String(s), "middle"); });
  var lpath = el("path", { d: "M 0 0", fill: "none", stroke: K_VA, "stroke-width": 3 }, LG);
  var ldots = LS.map(function (l, s) { return el("circle", { cx: LX(s), cy: LY(l), r: 5, fill: K_VA, stroke: "#071510", "stroke-width": 1.5 }, LG); });
  var pn = mkPanel(svg, 410, 188, 222, 160, "fillG");
  function setLoss(upTo) {
    var d = ""; for (var s = 0; s <= upTo; s++) d += (s ? " L " : "M ") + LX(s).toFixed(1) + " " + LY(LS[s]).toFixed(1);
    lpath.setAttribute("d", d);
    ldots.forEach(function (c, s) { show(c, s <= upTo); });
  }
  function render(i) {
    var cur = [0, 0, 0, 0, 0, 1, 5, 5, 5][i], showCurve = i >= 1;
    curves.forEach(function (c, k) { var on = showCurve && (i <= 4 ? k === 0 : (i === 5 ? k <= 1 : k <= 5)); show(c, on); c.setAttribute("opacity", on ? (k === cur || (i >= 6 && k === 5) ? "1" : (i >= 5 ? "0.35" : "1")) : "0"); });
    resid.forEach(function (l, k) { var s = ST[0]; l.setAttribute("y2", PY(sig(s[0] * TX[k] + s[1]))); show(l, i === 2 || i === 3); });
    pts.forEach(function (p) { show(p, true); });
    show(LG, i >= 3);
    if (i >= 3) setLoss(i === 3 || i === 4 ? 0 : (i === 5 ? 1 : (i === 6 ? 5 : 5)));
    var g0 = GR[0];
    var rows = [
      ["training data", "8 toy customers", "feature: days since last activity", "label: churned or stayed", "", ""],
      ["initial parameters", "w = 0, b = 0", "every customer gets probability 0.5", "learning rate 0.5 is our choice", "", ""],
      ["predictions", "p = 0.5 for all", "dashed lines: prediction vs label", "far off for the churners", "", ""],
      ["loss", n3(LS[0]), "average log-loss of the predictions", "high at the start (ln 2)", "", ""],
      ["gradient", "grad_w " + n3(g0[0]), "grad_b " + n3(g0[1]), "the direction the loss rises;", "we step the opposite way", ""],
      ["update", "w " + n3(ST[1][0]) + ", b " + n3(ST[1][1]), "w - 0.5 * grad_w", "b - 0.5 * grad_b", "loss falls to " + n3(LS[1]), ""],
      ["repeat", "5 steps", "predict, loss, gradient, update", "each step uses TRAINING data only", "", ""],
      ["loss decreases", n3(LS[0]) + " → " + n3(LS[5]), "each update lowers the loss", "", "", ""],
      ["trained model", "w " + n3(ST[5][0]) + ", b " + n3(ST[5][1]), "parameters fitted to training data", "validation was never used here", "next: judge it on validation", ""],
    ][i];
    pn.set(rows[0], rows[1], rows[2], rows[3], rows[4], rows[5]);
  }
  flatCards();
