  var steps = [
    { id: "precision-only", label: "Judge by precision only", caption: "Two spam filters. By precision alone, Model A (0.95) looks much better than Model B (0.75)." },
    { id: "recall-only", label: "Judge by recall only", caption: "By recall alone, the picture flips: Model B (0.75) finds far more spam than Model A (0.40)." },
    { id: "imbalanced-pair", label: "Model A: precision 0.95, recall 0.40", caption: "Model A is very reliable when it flags an email, but it misses 60 percent of the spam." },
    { id: "balanced-pair", label: "Model B: precision 0.75, recall 0.75", caption: "Model B is less precise but finds far more spam. It is balanced." },
    { id: "need-combination", label: "Which is better?", caption: "It depends on the goal. Often we want one number that reflects both precision and recall." },
    { id: "f1-formula", label: "The F1 score", caption: "F1 = 2 × (precision × recall) / (precision + recall). It is the harmonic mean of precision and recall." },
    { id: "harmonic-balance", label: "A mean that rewards balance", caption: "The ordinary average of 0.95 and 0.40 is 0.675, but the harmonic mean is only 0.563: pulled toward the smaller value. For the balanced pair both means are 0.75." },
    { id: "calculate-example", label: "Our recurring example", caption: "Precision 0.667 and recall 0.80 give F1 = 2 × 0.667 × 0.80 / 1.467 = 0.727, slightly below the plain average 0.733 and closer to the weaker number." },
    { id: "interpret", label: "How to read F1", caption: "F1 is high only when both are high, and it falls if either is low. It treats precision and recall as equally important, so it is a common summary, not the best metric for every problem. It evaluates a model; it is not automatically the training loss." }
  ];

  var BASE = 290, HT = 200;
  var chartG = el("g", {}, svg);
  el("line", { x1: 40, y1: BASE, x2: 600, y2: BASE, class: "axis" }, chartG);
  [0, 0.5, 1].forEach(function (v) { txt(chartG, 34, BASE - v * HT + 4, "tick", v.toFixed(1), "end"); });
  var MODELS = [{ n: "Model A", p: 0.95, r: 0.40, x: 170 }, { n: "Model B", p: 0.75, r: 0.75, x: 400 }];
  var PB = [], RB = [], PV = [], RV = [];
  MODELS.forEach(function (m) {
    PB.push(box(chartG, m.x - 52, BASE - m.p * HT, 48, m.p * HT, "#a78bfa", "none", 5));
    RB.push(box(chartG, m.x + 4, BASE - m.r * HT, 48, m.r * HT, "#fb923c", "none", 5));
    PV.push(txt(chartG, m.x - 28, BASE - m.p * HT - 6, "lbl", m.p.toFixed(2), "middle"));
    RV.push(txt(chartG, m.x + 28, BASE - m.r * HT - 6, "lbl", m.r.toFixed(2), "middle"));
    txt(chartG, m.x, BASE + 22, "lbl", m.n, "middle");
  });
  txt(chartG, 600, 56, "lbl", "■ precision", "end").style.fill = "#a78bfa";
  txt(chartG, 600, 76, "lbl", "■ recall", "end").style.fill = "#fb923c";
  var verdict = txt(svg, 320, 40, "big", "", "middle");
  var qG = el("g", {}, svg);
  txt(qG, 285, 150, "big", "?", "middle").setAttribute("font-size", "46");
  txt(qG, 285, 180, "lbl lbl-y", "which is better?", "middle");

  var fG = el("g", {}, svg);
  card(fG, 60, 70, 520, 190, "fillG");
  txt(fG, 320, 122, "mono", "F1 = 2 × (P × R) / (P + R)", "middle").setAttribute("font-size", "22");
  txt(fG, 320, 166, "lbl lbl-y", "the harmonic mean of precision (P) and recall (R)", "middle");
  txt(fG, 320, 206, "note", "high only when BOTH are high", "middle");
  txt(fG, 320, 228, "note", "0 if either is 0", "middle");

  var mG = el("g", {}, svg);
  function numLine(y, p, r, title) {
    var X = function (v) { return 60 + v * 520; };
    txt(mG, 60, y - 34, "lbl", title, "start");
    el("line", { x1: X(0), y1: y, x2: X(1), y2: y, stroke: "#c9dccf", "stroke-width": 3 }, mG);
    [0, 0.5, 1].forEach(function (v) { txt(mG, X(v), y + 20, "tick", v.toFixed(1), "middle"); });
    var am = (p + r) / 2, hm = 2 * p * r / (p + r);
    el("circle", { cx: X(p), cy: y, r: 8, fill: "#a78bfa", stroke: "#071510", "stroke-width": 2 }, mG);
    el("circle", { cx: X(r), cy: y, r: 8, fill: "#fb923c", stroke: "#071510", "stroke-width": 2 }, mG);
    el("rect", { x: X(am) - 5, y: y - 24, width: 10, height: 10, fill: "#c9dccf" }, mG);
    txt(mG, X(am), y - 30, "note", "average " + am.toFixed(3), "middle");
    el("rect", { x: X(hm) - 5, y: y + 10, width: 10, height: 10, fill: C_OK }, mG);
    txt(mG, X(hm), y + 36, "lbl lbl-g", "F1 " + hm.toFixed(3), "middle");
  }
  numLine(110, 0.95, 0.40, "P 0.95, R 0.40");
  numLine(230, 0.75, 0.75, "P 0.75, R 0.75");

  var calcG = el("g", {}, svg);
  card(calcG, 60, 60, 520, 230, "fillA");
  txt(calcG, 320, 100, "lbl lbl-y", "recurring example", "middle");
  txt(calcG, 320, 140, "mono", "P = 16 / 24 = 0.667      R = 16 / 20 = 0.80", "middle");
  txt(calcG, 320, 186, "mono", "F1 = 2 × 0.667 × 0.80 / (0.667 + 0.80)", "middle");
  txt(calcG, 320, 232, "big", "F1 ≈ 0.727", "middle").setAttribute("font-size", "26");
  txt(calcG, 320, 268, "note", "plain average would be 0.733: F1 sits nearer the weaker number", "middle");

  var intG = el("g", {}, svg);
  [["Both must be high", "F1 falls if either P or R is low", "fillA"], ["A choice, not a law", "assumes P and R matter equally", "fillB"], ["Evaluation, not training", "F1 compares models; it is not the loss", "fillG"]].forEach(function (c, k) {
    var x = 20 + k * 206;
    card(intG, x, 90, 192, 150, c[2]);
    txt(intG, x + 96, 140, "lbl lbl-y", c[0], "middle");
    txt(intG, x + 96, 176, "note", c[1], "middle");
  });

  function render(index, id) {
    var i = index;
    var bars = i <= 4;
    show(chartG, bars);
    PB.forEach(function (b, k) { show(b, i === 0 || i >= 4 || (i === 2 && k === 0) || (i === 3 && k === 1)); show(PV[k], i === 0 || i >= 4 || (i === 2 && k === 0) || (i === 3 && k === 1)); });
    RB.forEach(function (b, k) { show(b, i === 1 || i >= 4 || (i === 2 && k === 0) || (i === 3 && k === 1)); show(RV[k], i === 1 || i >= 4 || (i === 2 && k === 0) || (i === 3 && k === 1)); });
    show(verdict, i <= 3);
    if (i === 0) verdict.textContent = "by precision alone: Model A wins";
    if (i === 1) verdict.textContent = "by recall alone: Model B wins";
    if (i === 2) verdict.textContent = "reliable, but misses 60% of spam";
    if (i === 3) verdict.textContent = "balanced: finds 75% of spam, 75% reliable";
    show(qG, i === 4);
    show(fG, i === 5); show(mG, i === 6); show(calcG, i === 7); show(intG, i === 8);
  }
