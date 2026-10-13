
  var CMX = CM_VAL.logistic;   // TP, FP, FN, TN
  var ev = M_LOGI;
  var gPop = el("g", {}, svg);
  card(gPop, 30, 70, 360, 180, "fillA");
  txt(gPop, 210, 98, "lbl lbl-y", "150 validation customers (churn = positive)", "middle");
  box(gPop, 50, 120, 320 * 0.2, 36, K_BAD, "none", 6); box(gPop, 50 + 320 * 0.2, 120, 320 * 0.8, 36, K_OK, "none", 6);
  txt(gPop, 50 + 32, 143, "lbl", "30 churn", "middle"); txt(gPop, 50 + 64 + 128, 144, "mono", "120 stay", "middle");
  var flagRow = el("g", {}, svg);
  box(flagRow, 50, 180, 320 * 33 / 150, 28, "rgba(226,180,74,0.6)", K_VA, 6); txt(flagRow, 50 + 320 * 33 / 300, 199, "lbl", "flags 33", "middle");
  txt(flagRow, 210, 232, "note", "21 are real churners, 12 would have stayed", "middle");
  var gMat = el("g", {}, svg);
  var M = cmGrid(gMat, 90, 110, 120, 70, CMX);
  txt(gMat, 210, 80, "lbl lbl-y", "validation confusion matrix", "middle");
  txt(gMat, 210, 270, "note", "logistic-style model · 150 customers", "middle");
  var goalG = el("g", {}, svg);
  card(goalG, 30, 60, 360, 220, "fillA");
  txt(goalG, 210, 86, "lbl lbl-y", "against the goal", "middle");
  txt(goalG, 50, 130, "lbl", "recall " + n2(ev.r), "start"); var rb = hbar(goalG, 150, 116, 200, 18, ev.r, K_BAD, 0.75);
  txt(goalG, 50, 190, "lbl", "precision " + n2(ev.p), "start"); var pb = hbar(goalG, 150, 176, 200, 18, ev.p, K_OK, 0.5);
  txt(goalG, 210, 230, "note", "white marks: recall 0.75, precision 0.50", "middle");
  txt(goalG, 210, 256, "lbl lbl-r", "recall misses the goal", "middle");
  var panel = mkPanel(svg, 410, 60, 222, 220, "fillG");
  var sumG = el("g", {}, svg);
  card(sumG, 90, 60, 460, 230, "fillG");
  txt(sumG, 320, 90, "big", "validation summary", "middle");
  [["accuracy", ev.acc], ["precision", ev.p], ["recall", ev.r], ["F1", ev.f1]].forEach(function (r, k) { txt(sumG, 130, 130 + k * 30, "lbl", r[0], "start"); hbar(sumG, 240, 116 + k * 30, 220, 16, r[1], k === 2 ? K_BAD : K_OK); txt(sumG, 474, 130 + k * 30, "mono", n2(r[1]), "start"); });
  txt(sumG, 320, 268, "note", "baseline accuracy was " + n2(M_BASE.acc) + ", yet its recall was only " + n2(M_BASE.r), "middle");
  function render(i) {
    show(gPop, i <= 1); show(flagRow, i === 1);
    show(gMat, i >= 2 && i <= 6); show(goalG, i === 7); show(sumG, i === 8);
    show(panel.g, i <= 7);
    if (i >= 2 && i <= 6) {
      var all = [[0, 0], [0, 1], [1, 0], [1, 1]];
      all.forEach(function (c) { M.cells[c[0]][c[1]].setAttribute("class", "cell"); });
      if (i === 3) { M.mark(0, 0, "hl-col"); M.mark(1, 1, "hl-col"); }
      if (i === 4) { M.mark(0, 0, "hl-col"); M.mark(1, 0, "hl-both"); }
      if (i === 5) { M.mark(0, 0, "hl-col"); M.mark(0, 1, "hl-both"); }
      if (i === 6) { M.mark(0, 0, "hl-col"); M.mark(0, 1, "hl-row"); M.mark(1, 0, "hl-row"); }
    }
    var rows = [
      ["validation data", "150 customers", "30 churn (20%), 120 stay", "not used for training", "the test set is still locked"],
      ["predictions", "33 flagged", "the model flags 33 customers", "21 real churners, 12 would stay", ""],
      ["confusion matrix", "TP 21 · FN 9", "FP 12 · TN 108", "four outcomes, positive = churn", ""],
      ["accuracy", n2(ev.acc), "(TP + TN) / all = 129 / 150", "dominated by the many who stay", ""],
      ["precision", n2(ev.p), "TP / (TP + FP) = 21 / 33", "of those flagged, how many churn", ""],
      ["recall", n2(ev.r), "TP / (TP + FN) = 21 / 30", "of the churners, how many we catch", ""],
      ["F1", n2(ev.f1), "harmonic mean of precision, recall", "a balance, not the goal itself", ""],
      ["business priority", "", "missing a churner is costly", "so recall matters most here", "contacting too many costs money"],
    ][Math.min(i, 7)];
    panel.set(rows[0], rows[1], rows[2], rows[3], rows[4]);
  }
  flatCards();
