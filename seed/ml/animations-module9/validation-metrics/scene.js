  var steps = [
    { id: "candidate-models", label: "Three candidate classifiers", caption: "Three classifiers have been scored on the VALIDATION set. Which one is best? That depends on which question we care about." },
    { id: "accuracy-view", label: "View: accuracy", caption: "By accuracy, Model C is best (0.94). But accuracy treats every mistake alike." },
    { id: "precision-view", label: "View: precision", caption: "By precision, Model C is again best (0.95): when it flags an email, it is almost always right." },
    { id: "recall-view", label: "View: recall", caption: "By recall the winner is Model A (0.95), and Model C is the worst (0.45): it misses more than half of the positives." },
    { id: "f1-view", label: "View: F1", caption: "By F1, which balances precision and recall, Model B wins (0.83, against 0.81 for A and 0.61 for C). Each metric crowns a different model." },
    { id: "application-costs", label: "Costs decide the metric", caption: "Spam filtering: a false positive blocks legitimate mail, so precision matters. Fraud screening: a false negative is missed fraud, so recall matters. If both matter, F1 is one balanced summary." },
    { id: "choose-metric", label: "Choose the metric first", caption: "The order is: understand the cost of each mistake, pick the metric that reflects it, then compare models. Precision and F1 are ways to evaluate models, not automatically the training loss." },
    { id: "compare-validation", label: "Compare on validation data", caption: "Fraud screening where flagged cases are reviewed by a person: false alarms are cheap, missed fraud is costly. Recall is the metric, and Model A leads on it." },
    { id: "select-model", label: "Select the model", caption: "We select Model A using validation data only. Hyperparameters and model choice are decided on validation data, never on the test set." },
    { id: "test-stays-locked", label: "The test set stays locked", caption: "The test set is scored once, after the model and metric are final. If we picked the winner by test score, it would stop being an honest estimate." }
  ];

  var MV = { A: { acc: 0.92, p: 0.70, r: 0.95 }, B: { acc: 0.91, p: 0.86, r: 0.80 }, C: { acc: 0.94, p: 0.95, r: 0.45 } };
  var NAMES = ["A", "B", "C"];
  NAMES.forEach(function (n) { MV[n].f1 = f1Of(MV[n].p, MV[n].r); });
  var MC = { A: "#38bdf8", B: "#1db584", C: "#f472b6" };

  var tableG = el("g", {}, svg);
  card(tableG, 40, 50, 560, 250, "fillA");
  var TX = [110, 260, 360, 460, 560];
  ["model", "accuracy", "precision", "recall", "F1"].forEach(function (h, c) { txt(tableG, TX[c], 86, "lbl lbl-y", h, "middle"); });
  var trows = NAMES.map(function (n, r) {
    var y = 140 + r * 50;
    var band = box(tableG, 50, y - 28, 540, 40, "rgba(255,255,255,0.05)", "none", 6);
    txt(tableG, TX[0], y, "big", "Model " + n, "middle").style.fill = MC[n];
    var cells = ["acc", "p", "r", "f1"].map(function (k, c) { return txt(tableG, TX[c + 1], y, "big", MV[n][k].toFixed(k === "f1" ? 2 : 2), "middle"); });
    return { band: band, cells: cells };
  });
  var f1Col = trows.map(function (r) { return r.cells[3]; });

  var barG = el("g", {}, svg);
  var BASE = 270, HT = 190;
  el("line", { x1: 60, y1: BASE, x2: 590, y2: BASE, class: "axis" }, barG);
  [0, 0.5, 1].forEach(function (v) { txt(barG, 54, BASE - v * HT + 4, "tick", v.toFixed(1), "end"); });
  var barTitle = txt(barG, 320, 46, "big", "", "middle");
  var bars = NAMES.map(function (n, k) {
    var x = 130 + k * 190;
    txt(barG, x + 40, BASE + 24, "big", "Model " + n, "middle").style.fill = MC[n];
    return { n: n, bar: box(barG, x, BASE, 80, 0, MC[n], "none", 6), val: txt(barG, x + 40, BASE - 10, "big", "", "middle"), x: x };
  });
  var winTag = txt(barG, 320, 322, "lbl lbl-g", "", "middle");

  var costG = el("g", {}, svg);
  [["Spam filtering", "false positive = legitimate mail blocked", "care about PRECISION", "fillA"], ["Fraud screening", "false negative = fraud missed", "care about RECALL", "fillB"], ["Both matter", "balance false alarms and misses", "consider F1", "fillG"]].forEach(function (c, k) {
    var x = 14 + k * 208;
    card(costG, x, 70, 196, 190, c[3]);
    txt(costG, x + 98, 108, "lbl lbl-y", c[0], "middle");
    txt(costG, x + 98, 148, "note", c[1], "middle");
    txt(costG, x + 98, 172, "note", "↓", "middle");
    txt(costG, x + 98, 206, "big", c[2], "middle").setAttribute("font-size", "13");
  });
  var flowG = el("g", {}, svg);
  [["1  Costs", "which mistake hurts more?", "fillB"], ["2  Metric", "precision · recall · F1", "fillA"], ["3  Compare", "models on validation data", "fillG"]].forEach(function (c, k) {
    var x = 16 + k * 208;
    card(flowG, x, 90, 192, 110, c[2]);
    txt(flowG, x + 96, 136, "big", c[0], "middle");
    txt(flowG, x + 96, 168, "note", c[1], "middle");
    if (k < 2) { var ar = arrow(flowG, "w", 3); setLine(ar, x + 194, 145, x + 206, 145); }
  });
  txt(flowG, 320, 250, "lbl lbl-y", "metrics evaluate models · they are not automatically the training loss", "middle");
  var pickG = el("g", {}, svg);
  card(pickG, 120, 80, 400, 150, "fillG");
  txt(pickG, 320, 126, "big", "Model A selected", "middle").setAttribute("font-size", "26");
  txt(pickG, 320, 164, "lbl lbl-g", "highest validation recall: 0.95", "middle");
  txt(pickG, 320, 196, "note", "chosen with validation data only", "middle");
  var lockG = el("g", {}, svg);
  lockIcon(lockG, 320, 100, 3);
  card(lockG, 100, 190, 440, 70, "fillB");
  txt(lockG, 320, 220, "lbl lbl-p", "TEST SET: locked until the end", "middle");
  txt(lockG, 320, 244, "note", "scored once, after model and metric are final", "middle");

  function showBars(key, label) {
    barTitle.textContent = label;
    var best = NAMES[0];
    NAMES.forEach(function (n) { if (MV[n][key] > MV[best][key]) best = n; });
    bars.forEach(function (b) {
      var h = MV[b.n][key] * HT;
      setBox(b.bar, b.x, BASE - h, 80, h);
      b.val.setAttribute("y", BASE - h - 8);
      b.val.textContent = MV[b.n][key].toFixed(2);
      b.bar.setAttribute("opacity", b.n === best ? "1" : "0.45");
    });
    winTag.textContent = "best on " + label + ": Model " + best;
  }

  function render(index, id) {
    var i = index;
    show(tableG, i === 0 || i === 7);
    show(barG, i >= 1 && i <= 4);
    show(costG, i === 5); show(flowG, i === 6); show(pickG, i === 8); show(lockG, i === 9);
    if (i === 1) showBars("acc", "accuracy");
    if (i === 2) showBars("p", "precision");
    if (i === 3) showBars("r", "recall");
    if (i === 4) showBars("f1", "F1");
    trows.forEach(function (r, k) {
      var hot = i === 7 && NAMES[k] === "A";
      r.band.setAttribute("fill", hot ? "rgba(29,181,132,0.25)" : "rgba(255,255,255,0.05)");
      r.cells.forEach(function (c, ci) { c.setAttribute("opacity", i === 7 && ci !== 2 ? "0.35" : "1"); });
    });
  }
