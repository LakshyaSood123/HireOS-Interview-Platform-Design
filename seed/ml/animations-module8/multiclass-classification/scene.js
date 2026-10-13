  var steps = [
    { id: "three-classes", label: "Three classes", caption: "Now emails come in three kinds: personal, promotional or spam. That is multiclass classification: more than two classes, and each email still has exactly one." },
    { id: "input-example", label: "One email to classify", caption: "A new email arrives with two features: 7 suspicious words and 3 promotional words. The model must choose one of the three classes." },
    { id: "class-scores", label: "One score per class", caption: "A common design gives one score per class: personal 0.5, promotional 1.2, spam 2.1. These are raw scores, not yet probabilities." },
    { id: "compare-scores", label: "Compare the scores", caption: "Compare the three scores with each other: 2.1 beats 1.2 beats 0.5. No single threshold is involved; the classes compete." },
    { id: "probabilities", label: "Scores become probabilities", caption: "Softmax turns the class scores into probabilities that sum to 1 and keeps the order: personal 0.126, promotional 0.253, spam 0.622. Its purpose is just this conversion." },
    { id: "choose-largest", label: "Choose the largest", caption: "The predicted class is the one with the largest probability: spam. A class can win with less than 0.5, for example 0.40 against 0.35 and 0.25." },
    { id: "decision-regions", label: "Decision regions", caption: "In feature space each class owns a region, and the boundaries meet between regions. Our email lands in the spam region." },
    { id: "ml-example", label: "Two ways to build it", caption: "One-versus-rest trains one binary classifier per class and picks the most confident. A single model with class scores and softmax compares all classes at once. Both predict one class." }
  ];

  var CC = { personal: "#38bdf8", promotional: "#e2b44a", spam: "#f472b6" };
  var NAMES = ["personal", "promotional", "spam"];
  var RAW = [0.5, 1.2, 2.1];
  var exps = RAW.map(function (v) { return Math.exp(v); });
  var tot = exps.reduce(function (a, b) { return a + b; }, 0);
  var PROBS = exps.map(function (v) { return v / tot; });

  var classG = el("g", {}, svg);
  NAMES.forEach(function (n, k) {
    var x = 30 + k * 200;
    card(classG, x, 80, 180, 130, k === 2 ? "fillB" : k === 1 ? "fillG" : "fillA");
    txt(classG, x + 90, 118, "big", n, "middle");
    txt(classG, x + 90, 148, "note", ["a note from a friend", "a sale announcement", "a scam message"][k], "middle");
    el("circle", { cx: x + 90, cy: 182, r: 12, fill: CC[n], stroke: "#071510", "stroke-width": 2 }, classG);
  });
  txt(classG, 320, 250, "lbl lbl-y", "more than two classes · exactly one per email", "middle");

  var mailG = el("g", {}, svg);
  card(mailG, 20, 44, 200, 150, "fillB");
  txt(mailG, 120, 74, "lbl lbl-p", "NEW EMAIL", "middle");
  txt(mailG, 120, 110, "mono", "suspicious words: 7", "middle");
  txt(mailG, 120, 138, "mono", "promo words: 3", "middle");
  txt(mailG, 120, 174, "note", "which class?", "middle");

  // Score bars (raw, then probabilities).
  var barG = el("g", {}, svg);
  var bars = NAMES.map(function (n, k) {
    var y = 70 + k * 64;
    txt(barG, 330, y + 26, "lbl", n, "end");
    box(barG, 342, y, 280, 40, "rgba(255,255,255,0.05)", "none", 5);
    var b = box(barG, 342, y, 10, 40, CC[n], "none", 5);
    var v = txt(barG, 350, y + 26, "mono", "", "start");
    return { bar: b, val: v };
  });
  var ranking = txt(svg, 482, 52, "lbl lbl-y", "", "middle");
  var sumTxt = txt(svg, 482, 276, "mono", "", "middle");
  var winChip = el("g", {}, svg);
  chip(winChip, 342, 290, 280, 44, "predicted class: spam", "rgba(244,114,182,0.4)", C_SPAM, "big");
  var leftNote = txt(svg, 120, 240, "note", "", "middle");

  // Decision regions.
  var RP = makeGraph(150, 320, 32, 28);
  var regG = el("g", {}, svg);
  function scoreOf(k, u, v) { return k === 0 ? 4 - 0.6 * u - 0.6 * v : k === 1 ? -2 + 0.9 * v - 0.1 * u : -3 + 0.8 * u - 0.1 * v; }
  for (var iu = 0; iu < 25; iu++) {
    for (var iv = 0; iv < 25; iv++) {
      var u = (iu + 0.5) * 0.4, v = (iv + 0.5) * 0.4, best = 0;
      for (var k = 1; k < 3; k++) if (scoreOf(k, u, v) > scoreOf(best, u, v)) best = k;
      el("rect", { x: RP.x(iu * 0.4), y: RP.y((iv + 1) * 0.4), width: RP.sx * 0.4 + 0.6, height: RP.sy * 0.4 + 0.6, fill: CC[NAMES[best]], opacity: 0.28 }, regG);
    }
  }
  el("line", { x1: RP.x(0), y1: RP.y(0), x2: RP.x(10), y2: RP.y(0), class: "axis" }, regG);
  el("line", { x1: RP.x(0), y1: RP.y(0), x2: RP.x(0), y2: RP.y(10), class: "axis" }, regG);
  txt(regG, RP.x(10), RP.y(0) + 16, "note", "suspicious words", "end");
  txt(regG, RP.x(0) + 6, RP.y(10) + 10, "note", "promo words", "start");
  txt(regG, RP.x(1.6), RP.y(1.4), "lbl lbl-b", "personal", "middle");
  txt(regG, RP.x(2.6), RP.y(8.4), "lbl lbl-y", "promotional", "middle");
  txt(regG, RP.x(8.3), RP.y(2.0), "lbl lbl-p", "spam", "middle");
  el("circle", { cx: RP.x(7), cy: RP.y(3), r: 9, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, regG);
  txt(regG, RP.x(7) + 14, RP.y(3) - 12, "lbl", "our email", "start");

  var mlG = el("g", {}, svg);
  card(mlG, 24, 50, 288, 230, "fillA");
  card(mlG, 328, 50, 288, 230, "fillG");
  txt(mlG, 168, 80, "lbl lbl-b", "ONE-VERSUS-REST", "middle");
  ["personal vs rest", "promotional vs rest", "spam vs rest"].forEach(function (t, k) {
    chip(mlG, 54, 98 + k * 40, 228, 32, t, "rgba(56,189,248,0.15)", "rgba(56,189,248,0.4)", "note");
  });
  txt(mlG, 168, 242, "note", "pick the most confident classifier", "middle");
  txt(mlG, 472, 80, "lbl lbl-g", "CLASS SCORES + SOFTMAX", "middle");
  txt(mlG, 472, 130, "mono", "0.5  1.2  2.1", "middle");
  txt(mlG, 472, 160, "note", "↓ softmax", "middle");
  txt(mlG, 472, 190, "mono", "0.13  0.25  0.62", "middle");
  txt(mlG, 472, 242, "note", "probabilities sum to 1; pick the largest", "middle");
  txt(mlG, 320, 316, "lbl lbl-y", "same idea for 3, 10 or 1000 classes: one class wins", "middle");

  function setBars(vals, maxv, fmt) {
    bars.forEach(function (b, k) {
      var w = Math.max(6, (vals[k] / maxv) * 215);
      setBox(b.bar, 342, 70 + k * 64, w, 40);
      b.val.textContent = fmt(vals[k]);
      b.val.setAttribute("x", 342 + w + 8);
    });
  }

  function render(index, id) {
    var i = index;
    show(classG, i === 0);
    show(mailG, i >= 1 && i <= 5);
    show(barG, i >= 2 && i <= 5);
    show(ranking, i === 3);
    show(sumTxt, i === 4 || i === 5);
    show(winChip, i === 5);
    show(regG, i === 6);
    show(mlG, i === 7);
    if (i === 3) ranking.textContent = "2.1  >  1.2  >  0.5";
    if (i >= 2 && i <= 3) { setBars(RAW, 2.4, function (v) { return v.toFixed(1); }); bars.forEach(function (b) { b.bar.setAttribute("opacity", "1"); }); }
    if (i === 3) bars.forEach(function (b, k) { b.bar.setAttribute("opacity", k === 2 ? "1" : "0.45"); });
    if (i >= 4) { setBars(PROBS, 0.7, function (v) { return v.toFixed(3); }); bars.forEach(function (b, k) { b.bar.setAttribute("opacity", i === 5 && k !== 2 ? "0.4" : "1"); }); }
    if (i >= 4) sumTxt.textContent = "sum = " + (PROBS[0] + PROBS[1] + PROBS[2]).toFixed(3);
  }
