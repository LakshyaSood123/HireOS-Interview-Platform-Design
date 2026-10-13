  var steps = [
    { id: "probability-output", label: "The model outputs probabilities", caption: "This classifier outputs an estimated probability of spam for each email, P(spam | x). The bars show the ten emails ordered by spam score. A probability is the model's estimate, not yet a decision." },
    { id: "threshold-05", label: "Choose a threshold", caption: "To act we need a rule: if the probability is at least the threshold, predict spam. The common default threshold is 0.5." },
    { id: "class-decision", label: "Turn probabilities into classes", caption: "Bars at or above the line become spam (pink), bars below become not spam (blue). Red crosses mark the mistakes: the real mail at 0.62 and the spam at 0.38." },
    { id: "example-high", label: "A high probability", caption: "P(spam) = 0.97 is at least 0.5, so this email is predicted spam. The probability is 0.97; the prediction is the class spam." },
    { id: "example-low", label: "A low probability", caption: "P(spam) = 0.12 is below 0.5, so this email is predicted not spam." },
    { id: "raise-threshold", label: "Raise the threshold to 0.8", caption: "A stricter threshold: only emails with P(spam) at least 0.8 are called spam. The bars have not changed, but the decisions have." },
    { id: "predictions-change", label: "Decisions changed, probabilities did not", caption: "Two emails changed their decision (outlined): the real mail at 0.62 is no longer blocked, but the spam at 0.73 now slips through. The probabilities are exactly the same as before." },
    { id: "lower-threshold", label: "Lower the threshold to 0.3", caption: "A looser threshold: P(spam) at least 0.3 is called spam. Now the spam at 0.38 is caught, but the real mail at 0.62 is still blocked. 0.5 is a common default, not always best." },
    { id: "tradeoff-preview", label: "A preview of the trade-off", caption: "Different thresholds make different mistakes: a low threshold blocks real mail, a high one lets spam through. Model Evaluation studies how to measure and choose." }
  ];

  var SORTED = EMAILS.slice().sort(function (a, b) { return a[0] - b[0]; });
  var BASE = 290, H = 190, BX = function (i) { return 74 + i * 54; };
  function PY(p) { return BASE - p * H; }
  var chartG = el("g", {}, svg);
  el("line", { x1: 54, y1: BASE, x2: 612, y2: BASE, class: "axis" }, chartG);
  el("line", { x1: 54, y1: PY(1), x2: 54, y2: BASE, class: "axis" }, chartG);
  [0, 0.5, 1].forEach(function (v) { txt(chartG, 48, PY(v) + 4, "tick", String(v), "end"); });
  txt(chartG, 56, PY(1) - 6, "note", "P(spam)", "start");
  var probLbls = [];
  var bars = SORTED.map(function (e, i) {
    var p = probOf(e[0]);
    var b = box(chartG, BX(i) - 17, PY(p), 34, p * H, "rgba(226,180,74,0.8)", "#071510", 4);
    probLbls.push({ i: i, p: p });
    el("circle", { cx: BX(i), cy: BASE + 22, r: 7, fill: colorOf(e[1]), stroke: "#071510", "stroke-width": 2 }, chartG);
    txt(chartG, BX(i), BASE + 44, "tick", String(e[0]), "middle");
    return b;
  });
  txt(chartG, 612, BASE + 44, "note", "spam score", "end");
  txt(chartG, 84, BASE + 62, "note", "dot = true class (blue not spam, pink spam)", "start");

  var tLine = el("line", { stroke: "#e2b44a", "stroke-width": 4, "stroke-dasharray": "8 5" }, svg);
  var tLbl = txt(svg, 62, 0, "lbl lbl-y", "", "start");
  // Probability labels sit above the threshold line and carry a dark outline, so the dashed line never strikes through them.
  var valG = el("g", {}, svg);
  probLbls.forEach(function (l) {
    var t = txt(valG, BX(l.i), PY(l.p) - 5, "tick", l.p.toFixed(2), "middle");
    t.setAttribute("stroke", "#071510"); t.setAttribute("stroke-width", "4"); t.setAttribute("paint-order", "stroke");
  });
  var crosses = SORTED.map(function (e, i) { var c = txt(svg, BX(i), 0, "big", "✕", "middle"); c.style.fill = C_BAD; return c; });
  var changedRings = SORTED.map(function (e, i) { return el("rect", { x: BX(i) - 22, y: 80, width: 44, height: 214, rx: 6, fill: "none", stroke: "#e2b44a", "stroke-width": 3 }, svg); });
  var callG = el("g", {}, svg);
  card(callG, 150, 36, 340, 36, "fillG");
  var callTxt = txt(callG, 320, 60, "lbl", "", "middle");
  var counter = txt(svg, 320, 28, "mono", "", "middle");

  var tableG = el("g", {}, svg);
  card(tableG, 40, 50, 560, 230, "fillG");
  ["threshold", "real mail blocked", "spam missed"].forEach(function (h, c) { txt(tableG, [110, 300, 480][c], 84, "lbl lbl-y", h, "middle"); });
  var TH = [0.3, 0.5, 0.8];
  TH.forEach(function (t, r) {
    var y = 130 + r * 52, fp = 0, fn = 0;
    SORTED.forEach(function (e) { var p = probOf(e[0]) >= t ? 1 : 0; if (p === 1 && e[1] === 0) fp++; if (p === 0 && e[1] === 1) fn++; });
    box(tableG, 60, y - 24, 520, 40, "rgba(255,255,255,0.05)", "none", 6);
    txt(tableG, 110, y, "big", String(t), "middle");
    txt(tableG, 300, y, "big", String(fp), "middle");
    txt(tableG, 480, y, "big", String(fn), "middle");
  });
  txt(tableG, 320, 268, "lbl lbl-g", "lower threshold: block more real mail  ·  higher threshold: miss more spam", "middle");

  function setThreshold(t, colors) {
    var y = PY(t);
    setLine(tLine, 54, y, 612, y);
    tLbl.setAttribute("y", y - 8); tLbl.textContent = "threshold " + t.toFixed(2);
    var fp = 0, fn = 0;
    SORTED.forEach(function (e, i) {
      var pr = probOf(e[0]) >= t ? 1 : 0;
      var bad = pr !== e[1];
      if (pr === 1 && e[1] === 0) fp++;
      if (pr === 0 && e[1] === 1) fn++;
      bars[i].setAttribute("fill", colors ? (pr === 1 ? "rgba(244,114,182,0.85)" : "rgba(56,189,248,0.85)") : "rgba(226,180,74,0.8)");
      crosses[i].setAttribute("y", PY(probOf(e[0])) - 26);
      show(crosses[i], colors && bad);
    });
    counter.textContent = colors ? "real mail blocked " + fp + "    spam missed " + fn : "";
  }
  function changedVs(t0, t1) {
    return SORTED.map(function (e) { return (probOf(e[0]) >= t0) !== (probOf(e[0]) >= t1); });
  }

  function render(index, id) {
    var i = index;
    show(chartG, i <= 7); show(valG, i <= 7);
    show(tLine, i >= 1 && i <= 7); show(tLbl, i >= 1 && i <= 7);
    show(callG, i === 3 || i === 4);
    show(tableG, i === 8);
    show(counter, (i >= 2 && i <= 2) || (i >= 5 && i <= 7));
    changedRings.forEach(function (r) { show(r, false); });
    var t = i >= 7 ? 0.3 : i >= 5 ? 0.8 : 0.5;
    if (i === 5) {
      anim("thr", 1200, function (e) { setThreshold(lerp(0.5, 0.8, e), true); });
    } else if (i === 7) {
      anim("thr", 1200, function (e) { setThreshold(lerp(0.5, 0.3, e), true); });
    } else if (i >= 1) setThreshold(t, i >= 2);
    if (i === 8) crosses.forEach(function (c) { show(c, false); });
    if (i === 0) { show(tLine, false); counter.textContent = ""; bars.forEach(function (b) { b.setAttribute("fill", "rgba(226,180,74,0.8)"); }); crosses.forEach(function (c) { show(c, false); }); }
    if (i === 6) {
      var ch = changedVs(0.5, 0.8);
      changedRings.forEach(function (r, k) { show(r, ch[k]); });
    }
    if (i === 3) { callTxt.textContent = "score 7.5: P(spam) = 0.97 ≥ 0.5  →  predicted spam"; bars.forEach(function (b, k) { b.setAttribute("opacity", SORTED[k][0] === 7.5 ? "1" : "0.35"); }); }
    else if (i === 4) { callTxt.textContent = "score 2.0: P(spam) = 0.12 < 0.5  →  predicted not spam"; bars.forEach(function (b, k) { b.setAttribute("opacity", SORTED[k][0] === 2.0 ? "1" : "0.35"); }); }
    else bars.forEach(function (b) { b.setAttribute("opacity", "1"); });
  }
