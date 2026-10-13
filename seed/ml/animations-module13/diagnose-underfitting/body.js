
  // right: train / validation F1 bars for the current tree depth; left: a toy decision-boundary picture
  var PXu = function (v) { return 60 + v * 45; }, PYu = function (v) { return 290 - v * 40; };
  var sc = el("g", {}, svg);
  el("line", { x1: 50, y1: 290, x2: 340, y2: 290, class: "axis" }, sc); el("line", { x1: 50, y1: 290, x2: 50, y2: 70, class: "axis" }, sc);
  txt(sc, 340, 308, "note", "days since last activity (low → high)", "end"); txt(sc, 56, 66, "note", "support tickets (low → high)", "start");
  var dotsU = [];
  for (var xu = 1; xu <= 6; xu++) for (var yu = 1; yu <= 5; yu++) {
    var churnU = xu >= 4 && yu >= 3;
    dotsU.push({ x: xu, y: yu, c: churnU, d: el("circle", { cx: PXu(xu), cy: PYu(yu), r: 7, fill: churnU ? K_BAD : K_OK, stroke: "#071510", "stroke-width": 2 }, sc) });
  }
  var cut = el("line", { x1: PXu(3.5), y1: 74, x2: PXu(3.5), y2: 290, stroke: K_VA, "stroke-width": 3.5, "stroke-dasharray": "7 5" }, svg);
  var cut2 = el("g", {}, svg);
  el("line", { x1: PXu(3.5), y1: PYu(2.5), x2: PXu(6.6), y2: PYu(2.5), stroke: K_TR, "stroke-width": 3.5, "stroke-dasharray": "7 5" }, cut2);
  var errs = dotsU.filter(function (p) { return p.x >= 4 && !p.c; }).map(function (p) { return el("circle", { cx: PXu(p.x), cy: PYu(p.y), r: 12, fill: "none", stroke: "#e6f5ec", "stroke-width": 2.5 }, svg); });
  var wk = el("g", {}, svg);
  card(wk, 40, 90, 300, 170, "fillB"); txt(wk, 190, 124, "lbl lbl-y", "few signals are used", "middle"); txt(wk, 190, 160, "note", "the pattern needs idle days AND tickets together", "middle"); txt(wk, 190, 190, "note", "a depth-1 tree can use only one of them", "middle"); txt(wk, 190, 226, "note", "weak or missing features limit any model", "middle");
  var bars = el("g", {}, svg);
  card(bars, 380, 60, 252, 128, "fillA");
  txt(bars, 506, 80, "lbl lbl-y", "tree-style model, F1 score", "middle");
  var dep = txt(bars, 506, 96, "note", "", "middle");
  txt(bars, 396, 120, "lbl", "train", "start"); txt(bars, 396, 148, "lbl", "validation", "start");
  var trBar = hbar(bars, 466, 106, 110, 18, 0.48, K_TR, 0.65), vaBar = hbar(bars, 466, 134, 110, 18, 0.46, K_VA, 0.65);
  var trVal = txt(bars, 590, 120, "mono", "", "start"), vaVal = txt(bars, 590, 148, "mono", "", "start");
  txt(bars, 506, 176, "note", "white mark = 0.65: what the goal needs", "middle");
  var pn = mkPanel(svg, 380, 196, 252, 150, "fillG");
  var lead = el("g", {}, svg);
  card(lead, 40, 90, 300, 170, "fillA");
  txt(lead, 190, 124, "lbl lbl-y", "is the model learning the pattern?", "middle");
  txt(lead, 190, 160, "note", "compare the score on the data it trained on", "middle");
  txt(lead, 190, 182, "note", "with the score on unseen validation data", "middle");
  txt(lead, 190, 220, "note", "both low: a sign the model is not fitting yet", "middle");
  function setBars(tr, va, d) {
    trBar.bar.setAttribute("width", Math.max(2, 110 * tr)); vaBar.bar.setAttribute("width", Math.max(2, 110 * va));
    trBar.bar.setAttribute("fill", K_BAD); vaBar.bar.setAttribute("fill", K_BAD);
    trVal.textContent = tr.toFixed(2); vaVal.textContent = va.toFixed(2); dep.textContent = "max depth " + d;
  }
  function render(i) {
    var showSc = i >= 3 && i !== 5;
    show(lead, i <= 2); show(sc, showSc); show(cut, i === 4 || i === 6); show(cut2, i >= 7);
    errs.forEach(function (e) { show(e, i === 4 || i === 6); });
    show(wk, i === 5);
    show(bars, true);
    trBar.setAttribute("opacity", i >= 0 ? "1" : "0");
    if (i === 0) { setBars(0.48, 0.0, 1); vaBar.setAttribute("opacity", "0"); vaVal.textContent = ""; trVal.textContent = "0.48"; vaBar.bar.setAttribute("width", 2); }
    else vaBar.setAttribute("opacity", "1");
    if (i >= 1 && i <= 6) setBars(0.48, 0.46, 1);
    if (i >= 7) setBars(0.62, 0.58, 2);
    if (i === 0) { trVal.textContent = "0.48"; vaVal.textContent = ""; }
    var rows = [
      ["training result", "F1 0.48", "measured on the data it trained on", "", ""],
      ["validation result", "F1 0.46", "measured on unseen validation data", "", ""],
      ["both are poor", "0.48 and 0.46", "a gap of only 0.02", "weak even where it could learn", ""],
      ["inspect the model", "depth 1", "one question about one feature", "toy picture of 30 customers", ""],
      ["a simple boundary", "one cut", "errors circled in white", "6 stayers are flagged as churn", ""],
      ["weak features?", "possible cause", "signals may be missing or weak", "not only model size", ""],
      ["possible fixes", "change one thing", "better features · a more flexible model", "check training finished", "revisit the framing"],
      ["retry", "depth 2", "second cut: tickets", "F1 0.62 train, 0.58 validation", "better, still below 0.65"],
      ["underfitting", "poor on both", "check model, features, training", "then measure on validation again", "never on the test set"],
    ][i];
    pn.set(rows[0], rows[1], rows[2], rows[3], rows[4]);
  }
  flatCards();
