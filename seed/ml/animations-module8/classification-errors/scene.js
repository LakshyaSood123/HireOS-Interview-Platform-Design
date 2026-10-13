  var steps = [
    { id: "predictions", label: "Predictions and true classes", caption: "Our rule (score at least 4 means spam) predicts all ten emails. Fill colour is the true class, the ring is the predicted class. We choose spam as the positive class: positive just means the class we are looking for." },
    { id: "correct-positive", label: "True positives", caption: "True positive: predicted spam and actually spam. Four emails (scores 5, 6, 7.5 and 9) are caught correctly." },
    { id: "correct-negative", label: "True negatives", caption: "True negative: predicted not spam and actually not spam. Four emails (scores 0.5, 1, 2 and 3) are correctly allowed." },
    { id: "false-positive", label: "A false positive", caption: "False positive: predicted spam but actually real mail. The email with score 4.5 is legitimate, yet it is blocked." },
    { id: "false-negative", label: "A false negative", caption: "False negative: predicted not spam but actually spam. The spam with score 3.5 slips through to the inbox." },
    { id: "compare-errors", label: "All four outcomes", caption: "Every prediction falls into exactly one of four outcomes: 4 true positives, 4 true negatives, 1 false positive and 1 false negative. That is 10 emails." },
    { id: "different-costs", label: "Errors have different costs", caption: "The two mistakes are not equally bad. Blocking a job offer is annoying; letting phishing through can be harmful. In a disease screening, a false negative (a missed case) is usually the worse mistake." },
    { id: "module9-preview", label: "What comes next", caption: "Organizing these four counts in a table and measuring a classifier from them is the job of the next module, Model Evaluation. For now: always define the positive class first." }
  ];

  var viewG = el("g", {}, svg);
  var AX = scoreAxis(viewG, 40, 560, 300, 10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "spam score");
  var ROWY = { 0: 160, 1: 230 };
  var bLine = el("line", { x1: AX.x(4), y1: 100, x2: AX.x(4), y2: 296, stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "8 5" }, viewG);
  txt(viewG, AX.x(4), 92, "lbl lbl-y", "rule: score ≥ 4 → spam", "middle");
  txt(viewG, 612, ROWY[0] + 5, "note", "real mail", "end");
  txt(viewG, 612, ROWY[1] + 5, "note", "spam", "end");
  var KIND = EMAILS.map(function (e) {
    var p = e[0] >= 4 ? 1 : 0;
    return p === 1 ? (e[1] === 1 ? "TP" : "FP") : (e[1] === 0 ? "TN" : "FN");
  });
  var halos = EMAILS.map(function (e) { return el("circle", { cx: AX.x(e[0]), cy: ROWY[e[1]], r: 21, fill: "none", "stroke-width": 4 }, viewG); });
  var dots = EMAILS.map(function (e) {
    var cx = AX.x(e[0]), cy = ROWY[e[1]];
    var ring = el("circle", { cx: cx, cy: cy, r: 15, fill: "none", stroke: colorOf(e[0] >= 4 ? 1 : 0), "stroke-width": 4 }, viewG);
    return el("circle", { cx: cx, cy: cy, r: 9, fill: colorOf(e[1]), stroke: "#071510", "stroke-width": 2 }, viewG);
  });
  var posBadge = el("g", {}, svg);
  chip(posBadge, 450, 8, 170, 28, "positive = spam", "rgba(244,114,182,0.25)", C_SPAM, "lbl");
  var tag = txt(svg, 320, 62, "lbl", "", "middle");
  var legend = txt(svg, 320, 342, "note", "fill = true class · ring = predicted class", "middle");

  // 2x2 table of outcomes.
  var gridG = el("g", {}, svg);
  var GX = 190, GY = 90, CW = 190, CH = 84;
  txt(gridG, GX + CW / 2, GY - 12, "lbl lbl-p", "predicted spam", "middle");
  txt(gridG, GX + CW * 1.5, GY - 12, "lbl lbl-b", "predicted not spam", "middle");
  txt(gridG, GX - 10, GY + CH / 2 + 5, "lbl lbl-p", "actually spam", "end");
  txt(gridG, GX - 10, GY + CH * 1.5 + 5, "lbl lbl-b", "actually real", "end");
  var CELL = [["TP", 4, "true positive", C_OK, 0, 0], ["FN", 1, "false negative", C_BAD, 1, 0], ["FP", 1, "false positive", C_BAD, 0, 1], ["TN", 4, "true negative", C_OK, 1, 1]];
  CELL.forEach(function (c) {
    var x = GX + c[4] * CW, y = GY + c[5] * CH;
    box(gridG, x + 3, y + 3, CW - 6, CH - 6, c[3] === C_OK ? "rgba(29,181,132,0.2)" : "rgba(248,113,113,0.22)", c[3], 8);
    txt(gridG, x + CW / 2, y + 42, "big", String(c[1]), "middle").setAttribute("font-size", "28");
    txt(gridG, x + CW / 2, y + 66, "lbl", c[2], "middle");
  });
  txt(gridG, 320, 296, "note", "the four counts add up to 10 emails", "middle");

  var costG = el("g", {}, svg);
  card(costG, 24, 50, 288, 230, "fillB");
  card(costG, 328, 50, 288, 230, "fillA");
  txt(costG, 168, 80, "lbl lbl-r", "FALSE POSITIVE", "middle");
  txt(costG, 168, 112, "note", "real mail marked spam", "middle");
  txt(costG, 168, 156, "lbl", "a job offer lands", "middle");
  txt(costG, 168, 176, "lbl", "in the spam folder", "middle");
  txt(costG, 168, 224, "note", "annoying, sometimes costly", "middle");
  txt(costG, 472, 80, "lbl lbl-r", "FALSE NEGATIVE", "middle");
  txt(costG, 472, 112, "note", "spam allowed through", "middle");
  txt(costG, 472, 156, "lbl", "a phishing email", "middle");
  txt(costG, 472, 176, "lbl", "reaches the inbox", "middle");
  txt(costG, 472, 224, "note", "can be harmful", "middle");
  txt(costG, 320, 316, "lbl lbl-y", "which is worse depends on the application", "middle");

  var nextG = el("g", {}, svg);
  nextG.appendChild(gridG.cloneNode(true));
  card(nextG, 150, 306, 340, 40, "fillG");
  txt(nextG, 320, 332, "lbl lbl-g", "next module: Model Evaluation", "middle");

  function highlight(kinds, color) {
    EMAILS.forEach(function (e, i) {
      var on = kinds.indexOf(KIND[i]) >= 0;
      halos[i].setAttribute("stroke", color);
      show(halos[i], on);
      dots[i].setAttribute("opacity", on || !kinds.length ? "1" : "0.35");
    });
  }

  function render(index, id) {
    var i = index;
    show(viewG, i <= 4); show(posBadge, i <= 5);
    show(gridG, i === 5); show(costG, i === 6); show(nextG, i === 7);
    show(legend, i <= 4);
    if (i === 0) { highlight([], C_OK); tag.textContent = ""; }
    if (i === 1) { highlight(["TP"], C_OK); tag.textContent = "true positive × 4"; }
    if (i === 2) { highlight(["TN"], C_OK); tag.textContent = "true negative × 4"; }
    if (i === 3) { highlight(["FP"], C_BAD); tag.textContent = "false positive: real mail marked spam"; }
    if (i === 4) { highlight(["FN"], C_BAD); tag.textContent = "false negative: spam let through"; }
    show(tag, i >= 1 && i <= 4);
    if (i > 4) highlight([], C_OK);
  }
