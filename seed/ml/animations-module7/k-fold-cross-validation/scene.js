  var steps = [
    { id: "training-data", label: "The development houses", caption: "Eight houses are available for building the model (the training and validation houses together). The two test houses stay locked away." },
    { id: "create-folds", label: "Create K = 4 folds", caption: "Deal the eight houses into four folds of two houses each. Every house belongs to exactly one fold." },
    { id: "fold-one-validation", label: "Round 1: validate on fold 1", caption: "Fit the model on folds 2, 3 and 4 (gold). Score it on fold 1 (blue), which it never saw: validation MSE 0.0264." },
    { id: "rotate", label: "Rotate the validation fold", caption: "Round 2 makes fold 2 the validation fold. The other three folds train a fresh model." },
    { id: "fold-two", label: "Round 2: validate on fold 2", caption: "Fit on folds 1, 3 and 4, score on fold 2: validation MSE 0.0004." },
    { id: "continue-rotating", label: "Keep rotating", caption: "Rounds 3 and 4 do the same with folds 3 and 4: validation MSE 0.0252 and 0.0914. Now every house has been used for validation exactly once." },
    { id: "collect-scores", label: "Collect the four scores", caption: "Four scores: 0.0264, 0.0004, 0.0252, 0.0914. Their spread shows how much the result depends on which houses were held out." },
    { id: "average-score", label: "Average them", caption: "The cross-validation score is the average: (0.0264 + 0.0004 + 0.0252 + 0.0914) / 4 = 0.0359. This is one steadier estimate for the straight line." },
    { id: "model-selection", label: "Use it to compare models", caption: "Run the same procedure for other candidates and compare their averages: the line (0.0359) beats the unregularized curve (0.3169) and the ridge curve with λ = 0.3 (0.1662). Then refit the winner on all development data. The folds are not the test set, which stays locked." }
  ];

  var FOLDS = kfolds(DEV, 4);
  var lineFn = polyFitFn(1, 0);
  var CV = cvScore(lineFn, DEV, 4);
  var CV_CURVE0 = cvScore(polyFitFn(4, 0), DEV, 4).mean;
  var CV_CURVE3 = cvScore(polyFitFn(4, 0.3), DEV, 4).mean;

  // Single development-set bar (steps 0).
  var devG = el("g", {}, svg);
  card(devG, 24, 40, 480, 70, "fillA");
  txt(devG, 40, 62, "lbl", "development set: 8 houses", "start");
  DEV.forEach(function (d, i) {
    var cg = el("g", {}, devG);
    el("circle", { cx: 60 + i * 58, cy: 88, r: 14, fill: C_TRAIN, stroke: "#071510", "stroke-width": 2 }, cg);
    txt(cg, 60 + i * 58, 92, "tick", d[0].toFixed(2).replace(/0$/, ""), "middle").style.fill = "#071510";
  });
  var testG = el("g", {}, svg);
  card(testG, 520, 40, 100, 70, "fillB");
  lockIcon(testG, 570, 56, 1.3);
  txt(testG, 570, 96, "lbl lbl-p", "test: locked", "middle");

  // Four rounds, each a row of four fold boxes.
  var ROWY = [118, 168, 218, 268];
  var rows = ROWY.map(function (y, r) {
    var rg = el("g", {}, svg);
    txt(rg, 30, y + 26, "lbl", "round " + (r + 1), "start");
    var boxes = FOLDS.map(function (fold, f) {
      var bx = 104 + f * 98;
      var b = box(rg, bx, y, 90, 38, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.3)", 8);
      txt(rg, bx + 6, y + 12, "tick", "fold " + (f + 1), "start");
      fold.forEach(function (d, k) {
        var cx = bx + 28 + k * 36;
        el("circle", { cx: cx, cy: y + 24, r: 11, fill: "#8fa89c", stroke: "#071510", "stroke-width": 2 }, rg);
        txt(rg, cx, y + 28, "tick", d[0].toFixed(2).replace(/0$/, ""), "middle").style.fill = "#071510";
      });
      return b;
    });
    var score = txt(rg, 506, y + 26, "mono", "", "start");
    var note = txt(rg, 506, y + 8, "tick", "", "start");
    return { g: rg, boxes: boxes, score: score, note: note };
  });
  var legend = el("g", {}, svg);
  box(legend, 104, 324, 14, 14, "rgba(226,180,74,0.5)", C_TRAIN, 3); txt(legend, 124, 336, "note", "training folds", "start");
  box(legend, 230, 324, 14, 14, "rgba(56,189,248,0.5)", C_VALID, 3); txt(legend, 250, 336, "note", "validation fold", "start");

  var arrowRot = arrow(svg, "w", 3); setLine(arrowRot, 70, 160, 70, 176);
  var avgG = el("g", {}, svg);
  card(avgG, 420, 314, 206, 38, "fillG");
  var avgTxt = txt(avgG, 523, 339, "big", "average = " + CV.mean.toFixed(4), "middle");
  var bracket = el("path", { d: "M 600 137 L 612 137 L 612 287 L 600 287", fill: "none", stroke: "#e2b44a", "stroke-width": 3 }, svg);

  // Model comparison panel.
  var cmpG = el("g", {}, svg);
  card(cmpG, 30, 36, 580, 290, "fillG");
  txt(cmpG, 320, 62, "lbl", "average 4-fold validation MSE (lower is better)", "middle");
  var CM = [["straight line", CV.mean, C_FIT], ["curve, λ = 0.3", CV_CURVE3, "#a78bfa"], ["curve, λ = 0", CV_CURVE0, "#f472b6"]];
  CM.forEach(function (m, k) {
    var y = 92 + k * 52;
    txt(cmpG, 50, y + 22, "lbl", m[0], "start");
    box(cmpG, 190, y, Math.max(4, m[1] / 0.32 * 320), 32, m[2], "none", 5);
    txt(cmpG, 196 + Math.max(4, m[1] / 0.32 * 320), y + 22, "mono", m[1].toFixed(4), "start");
  });
  txt(cmpG, 320, 262, "lbl lbl-g", "choose the lowest, then refit it on all 8 development houses", "middle");
  txt(cmpG, 320, 288, "note", "the locked test set is still untouched", "middle");

  function colourRow(r, valFold) {
    rows[r].boxes.forEach(function (b, f) {
      var isV = f === valFold;
      b.setAttribute("fill", isV ? "rgba(56,189,248,0.4)" : "rgba(226,180,74,0.3)");
      b.setAttribute("stroke", isV ? C_VALID : C_TRAIN);
    });
  }
  function neutralRow(r) {
    rows[r].boxes.forEach(function (b) { b.setAttribute("fill", "rgba(255,255,255,0.08)"); b.setAttribute("stroke", "rgba(255,255,255,0.3)"); });
  }

  function render(index, id) {
    var i = index;
    show(devG, i === 0);
    show(testG, i <= 7);
    var rowVis = [i >= 1, i >= 3, i >= 5, i >= 5];
    if (i === 8) rowVis = [false, false, false, false];
    rows.forEach(function (row, r) { show(row.g, rowVis[r]); });
    show(legend, i >= 2 && i <= 7);
    show(arrowRot, i === 3);
    show(avgG, i === 7);
    show(bracket, i === 6 || i === 7);
    show(cmpG, i === 8);
    rows.forEach(function (row, r) {
      var colour = (r === 0 && i >= 2) || (r === 1 && i >= 3) || (r >= 2 && i >= 5);
      if (colour) colourRow(r, r); else neutralRow(r);
      var scoreOn = (r === 0 && i >= 2) || (r === 1 && i >= 4) || (r >= 2 && i >= 5);
      row.score.textContent = scoreOn ? "MSE " + CV.scores[r].toFixed(4) : "";
      row.note.textContent = (r === 0 && i === 2) ? "fit on 2,3,4 → score on 1" : (r === 1 && i === 3) ? "rotate: now fold 2 validates" : (r === 1 && i === 4) ? "fit on 1,3,4 → score on 2" : "";
      row.g.setAttribute("opacity", rowVis[r] ? "1" : "0");
    });
    if (i === 6) rows.forEach(function (row) { row.score.setAttribute("fill", "#e2b44a"); });
    else rows.forEach(function (row) { row.score.removeAttribute("fill"); });
  }
