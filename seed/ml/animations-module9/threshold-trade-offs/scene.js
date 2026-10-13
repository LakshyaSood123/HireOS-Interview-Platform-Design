  var steps = [
    { id: "fixed-probabilities", label: "Fixed model probabilities", caption: "A classifier gave these eight emails a probability of spam. The bar is P(spam); the dot is the true class (pink spam, blue legitimate). Five emails are spam. These probabilities will not change." },
    { id: "threshold-050", label: "Threshold 0.50", caption: "The usual decision rule: flag an email as spam if its probability is at least the threshold. Start with 0.50." },
    { id: "predictions", label: "Predictions at 0.50", caption: "Five emails reach the line and are flagged (pink bars). Each flagged or unflagged email is a TP, FP, FN or TN." },
    { id: "matrix", label: "The confusion matrix at 0.50", caption: "Counting the outcomes: TP = 4, FN = 1, FP = 1, TN = 2." },
    { id: "precision-recall", label: "Precision and recall at 0.50", caption: "Precision = 4 / 5 = 0.80 and recall = 4 / 5 = 0.80. Now watch what moving the threshold does." },
    { id: "lower-threshold", label: "Lower the threshold to 0.30", caption: "We slide the threshold left. The bars, the probabilities, do not move; only the decision rule does." },
    { id: "more-positives", label: "More emails are flagged", caption: "At 0.30 seven emails are flagged. The two newly flagged ones (0.45 legitimate and 0.38 spam) are outlined." },
    { id: "higher-recall", label: "Recall rises, precision falls", caption: "Now all 5 spam emails are caught: recall 1.00. But 2 legitimate emails are flagged too, so precision drops to 0.714. Lower thresholds generally raise recall and may lower precision." },
    { id: "raise-threshold", label: "Raise the threshold to 0.70", caption: "Now we slide the threshold right, past 0.50. The probabilities are still exactly the same." },
    { id: "fewer-positives", label: "Fewer emails are flagged", caption: "At 0.70 only three emails are flagged. The two emails that dropped out (0.62 legitimate and 0.58 spam) are outlined." },
    { id: "precision-recall-change", label: "Precision rises, recall falls", caption: "All flagged emails are spam: precision 1.00. But only 3 of 5 spam emails are found: recall 0.60. Higher thresholds may raise precision and generally lower recall." },
    { id: "compare", label: "Compare the thresholds", caption: "Same probabilities, four thresholds. Lowering the threshold trades precision for recall, raising it does the opposite. In this example; the right choice depends on which mistake costs more." }
  ];

  var DATA8 = [[0.92, 1], [0.83, 1], [0.71, 1], [0.62, 0], [0.58, 1], [0.45, 0], [0.38, 1], [0.20, 0]];
  var BX0 = 100, BW = 270, RY = function (i) { return 66 + i * 33; };
  function evalAt(t) {
    var o = { tp: 0, fp: 0, fn: 0, tn: 0 };
    DATA8.forEach(function (d) { var pr = d[0] >= t ? 1 : 0; if (pr && d[1]) o.tp++; else if (pr) o.fp++; else if (d[1]) o.fn++; else o.tn++; });
    o.p = precisionOf(o.tp, o.fp); o.r = recallOf(o.tp, o.fn); o.flagged = o.tp + o.fp;
    return o;
  }

  var chartG = el("g", {}, svg);
  card(chartG, 8, 36, 410, 296, "fillA");
  txt(chartG, 22, 54, "note", "dot = true class", "start");
  txt(chartG, 200, 54, "note", "bar = P(spam), fixed", "start");
  var rows = DATA8.map(function (d, i) {
    var y = RY(i);
    el("circle", { cx: 34, cy: y + 10, r: 8, fill: colorOf(d[1]), stroke: "#071510", "stroke-width": 2 }, chartG);
    txt(chartG, 52, y + 15, "mono", d[0].toFixed(2), "start").setAttribute("font-size", "11");
    box(chartG, BX0, y, BW, 20, "rgba(255,255,255,0.05)", "none", 4);
    var bar = box(chartG, BX0, y, d[0] * BW, 20, "rgba(226,180,74,0.8)", "none", 4);
    var tag = txt(chartG, BX0 + BW + 12, y + 15, "lbl", "", "start");
    var out = el("rect", { x: 6 + 4, y: y - 3, width: 396, height: 26, rx: 6, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, chartG);
    return { bar: bar, tag: tag, out: out, d: d };
  });
  var tLine = el("line", { stroke: "#e2b44a", "stroke-width": 4, "stroke-dasharray": "7 4" }, svg);
  var tLbl = txt(svg, 0, 28, "lbl lbl-y", "", "middle");
  var fixedNote = txt(svg, 213, 350, "note", "probabilities never change; only the threshold moves", "middle");

  var CMs = cmGrid(svg, 520, 126, 58, 48, { tp: 0, fn: 0, fp: 0, tn: 0 }, true);
  var metrics = el("g", {}, svg);
  card(metrics, 428, 236, 202, 96, "fillG");
  var mFlag = txt(metrics, 442, 254, "lbl", "", "start");
  var mPrec = txt(metrics, 442, 280, "mono", "", "start");
  var mRec = txt(metrics, 442, 306, "mono", "", "start");
  mPrec.style.fill = "#a78bfa"; mRec.style.fill = "#fb923c";
  var callG = el("g", {}, svg);
  card(callG, 428, 40, 202, 34, "fillB");
  var callTxt = txt(callG, 529, 62, "lbl lbl-y", "", "middle");

  var cmpG = el("g", {}, svg);
  card(cmpG, 20, 40, 600, 280, "fillG");
  var CX = [74, 154, 224, 290, 356, 460, 570];
  ["threshold", "flagged", "TP", "FP", "FN", "precision", "recall"].forEach(function (h, c) { txt(cmpG, CX[c], 74, "lbl lbl-y", h, "middle"); });
  [0.3, 0.5, 0.7, 0.9].forEach(function (t, r) {
    var e = evalAt(t), y = 124 + r * 52;
    box(cmpG, 30, y - 26, 580, 40, "rgba(255,255,255,0.05)", "none", 6);
    [t.toFixed(2), String(e.flagged), String(e.tp), String(e.fp), String(e.fn)].forEach(function (s, c) { txt(cmpG, CX[c], y, "big", s, "middle"); });
    var pt = txt(cmpG, CX[5], y, "big", pct(e.p), "middle"); pt.style.fill = "#a78bfa";
    var rt = txt(cmpG, CX[6], y, "big", pct(e.r), "middle"); rt.style.fill = "#fb923c";
  });
  txt(cmpG, 320, 308, "lbl lbl-g", "lower threshold: recall up · higher threshold: precision up (in this example)", "middle");

  function setT(t, colors, tags) {
    var x = BX0 + t * BW;
    setLine(tLine, x, 60, x, 326); // starts below the column headers so it never crosses them
    tLbl.setAttribute("x", x); tLbl.textContent = "threshold " + t.toFixed(2);
    var e = evalAt(t);
    rows.forEach(function (r) {
      var pr = r.d[0] >= t ? 1 : 0;
      r.bar.setAttribute("fill", colors ? (pr ? "rgba(244,114,182,0.85)" : "rgba(56,189,248,0.75)") : "rgba(226,180,74,0.8)");
      var k = pr ? (r.d[1] ? "TP" : "FP") : (r.d[1] ? "FN" : "TN");
      r.tag.textContent = tags ? k : "";
      r.tag.style.fill = { TP: C_TP, FP: C_FP, FN: C_FN, TN: C_TN }[k];
    });
    CMs.set(e);
    mFlag.textContent = "flagged as spam: " + e.flagged;
    mPrec.textContent = "precision " + pct(e.p);
    mRec.textContent = "recall    " + pct(e.r);
    return e;
  }
  function outline(pred) { rows.forEach(function (r) { show(r.out, pred(r.d[0])); }); }

  function render(index, id) {
    var i = index;
    show(chartG, i <= 10); show(cmpG, i === 11);
    show(tLine, i >= 1 && i <= 10); show(tLbl, i >= 1 && i <= 10);
    show(CMs.g, i >= 3 && i <= 10); show(metrics, i >= 4 && i <= 10);
    show(callG, i === 7 || i === 10);
    outline(function () { return false; });
    var t = i >= 8 ? 0.7 : i >= 5 ? 0.3 : 0.5;
    if (i === 5) anim("thr", 1400, function (e) { setT(lerp(0.5, 0.3, e), true, true); });
    else if (i === 8) anim("thr", 1400, function (e) { setT(lerp(0.3, 0.7, e), true, true); });
    else if (i >= 1 && i <= 10) setT(t, i >= 2, i >= 2);
    if (i === 0) { setT(0.5, false, false); }
    if (i === 6) outline(function (p) { return p >= 0.3 && p < 0.5; });
    if (i === 9) outline(function (p) { return p >= 0.5 && p < 0.7; });
    if (i === 7) callTxt.textContent = "recall 1.00 ↑   precision 0.71 ↓";
    if (i === 10) callTxt.textContent = "precision 1.00 ↑   recall 0.60 ↓";
    show(fixedNote, i >= 1);
  }
