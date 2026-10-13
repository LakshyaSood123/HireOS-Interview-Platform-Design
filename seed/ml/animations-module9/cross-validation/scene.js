  var steps = [
    { id: "classification-dataset", label: "A classification dataset", caption: "You already know K-fold cross-validation. Now apply it to classification: 100 emails, of which 20 are spam (pink) and 80 are legitimate (blue)." },
    { id: "class-imbalance", label: "Only 20% spam", caption: "Spam is the rare class: 20 percent. Precision and recall depend on how many spam emails each validation fold contains." },
    { id: "ordinary-split-risk", label: "Risk of an ordinary split", caption: "If folds are dealt out at random, spam can land unevenly: here the five folds hold 9, 6, 3, 2 and 0 spam emails. The last fold has no spam at all, so its recall is not defined, and the others disagree wildly." },
    { id: "five-folds", label: "Five folds of 20 emails", caption: "Split the 100 emails into K = 5 folds of 20 emails each. Each fold will take a turn as the validation fold." },
    { id: "stratified-folds", label: "Stratified folds", caption: "Stratified folds keep the class proportions in every fold: each has 4 spam and 16 legitimate emails, like the whole set. Now every fold's metrics are comparable." },
    { id: "fold-one", label: "Fold 1 validates", caption: "Train on folds 2 to 5, validate on fold 1. Its confusion counts give precision 0.60 and recall 0.75." },
    { id: "rotate-folds", label: "Rotate the validation fold", caption: "Fold 2 validates next: precision 0.80, recall 1.00. Then folds 3, 4 and 5 take their turns." },
    { id: "collect-metrics", label: "Collect the metrics", caption: "Each fold gives its own precision, recall and F1. The spread across folds shows how stable the estimate is." },
    { id: "average-metrics", label: "Average the folds", caption: "Average precision 0.67, recall 0.80 and F1 0.73: a more stable estimate than any single split, and it matches our recurring example." },
    { id: "final-test-locked", label: "The test set stays locked", caption: "Cross-validation folds are for choosing and estimating during development. They are not the final test set, which stays locked and is scored once, after all choices are made." }
  ];

  var FOLDS = [[3, 2, 1, 14], [4, 1, 0, 15], [3, 2, 1, 14], [3, 1, 1, 15], [3, 2, 1, 14]];   // TP, FP, FN, TN per stratified fold
  var FM = FOLDS.map(function (f) { var p = precisionOf(f[0], f[1]), r = recallOf(f[0], f[2]); return { p: p, r: r, f1: f1Of(p, r) }; });
  var AVG = { p: 0, r: 0, f1: 0 };
  FM.forEach(function (m) { AVG.p += m.p / 5; AVG.r += m.r / 5; AVG.f1 += m.f1 / 5; });

  var allG = el("g", {}, svg);
  var allDots = dotGrid(allG, 140, 60, 24, 9, 100, 10, function (i) { return (i % 5 === 2) ? C_SPAM : C_HAM; });
  txt(allG, 260, 336, "note", "100 emails: 20 spam, 80 legitimate", "middle");
  var shareG = el("g", {}, svg);
  card(shareG, 410, 110, 210, 130, "fillB");
  txt(shareG, 515, 152, "big", "20% spam", "middle").setAttribute("font-size", "24");
  txt(shareG, 515, 182, "note", "the rare class", "middle");
  txt(shareG, 515, 204, "note", "metrics rest on few emails", "middle");

  // Folds: five boxes with 20 mini dots each.
  var foldG = el("g", {}, svg);
  var FX = function (i) { return 10 + i * 126; };
  var foldBoxes = [], foldLabels = [], foldDots = [], foldNotes = [];
  var RANDOM_SPAM = [9, 6, 3, 2, 0], STRAT_SPAM = [4, 4, 4, 4, 4];
  for (var f = 0; f < 5; f++) {
    foldBoxes.push(box(foldG, FX(f), 70, 116, 130, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.3)", 8));
    foldLabels.push(txt(foldG, FX(f) + 58, 90, "lbl", "fold " + (f + 1), "middle"));
    foldDots.push(dotGrid(foldG, FX(f) + 18, 108, 20, 6, 20, 5, function () { return C_HAM; }));
    foldNotes.push(txt(foldG, FX(f) + 58, 222, "lbl", "", "middle"));
  }
  function setFolds(spamCounts) {
    foldDots.forEach(function (ds, f) {
      ds.forEach(function (d, i) { d.setAttribute("fill", i < spamCounts[f] ? C_SPAM : C_HAM); });
      foldNotes[f].textContent = spamCounts[f] + " spam";
    });
  }
  var foldMsg = txt(svg, 320, 262, "lbl", "", "middle");

  var runG = el("g", {}, svg);
  var metG = el("g", {}, svg);
  var mTxt = [];
  function metricsFor(f) { return "P " + pct(FM[f].p) + "   R " + pct(FM[f].r); }

  var tblG = el("g", {}, svg);
  card(tblG, 40, 40, 560, 270, "fillA");
  var TX = [96, 220, 340, 460, 560];
  ["fold", "precision", "recall", "F1", "spam"].forEach(function (h, c) { txt(tblG, TX[c], 70, "lbl lbl-y", h, "middle"); });
  FM.forEach(function (m, k) {
    var y = 108 + k * 34;
    [String(k + 1), pct(m.p), pct(m.r), pct(m.f1), "4"].forEach(function (s, c) { txt(tblG, TX[c], y, "big", s, "middle"); });
  });
  var avgRow = el("g", {}, tblG);
  box(avgRow, 52, 262, 536, 34, "rgba(29,181,132,0.25)", C_OK, 6);
  [["average", 96], [pct(AVG.p), 220], [pct(AVG.r), 340], [pct(AVG.f1), 460]].forEach(function (c) { txt(avgRow, c[1], 284, "big", c[0], "middle"); });
  var lockG = el("g", {}, svg);
  lockIcon(lockG, 320, 96, 3);
  card(lockG, 90, 180, 460, 90, "fillB");
  txt(lockG, 320, 212, "lbl lbl-p", "TEST SET: locked", "middle");
  txt(lockG, 320, 238, "note", "folds are for development; the test set is scored once at the very end", "middle");
  var valBadge = el("g", {}, svg);

  function render(index, id) {
    var i = index;
    show(allG, i <= 1); show(shareG, i === 1);
    show(foldG, i >= 2 && i <= 6);
    show(tblG, i === 7 || i === 8);
    show(avgRow, i === 8);
    show(lockG, i === 9);
    foldMsg.textContent = "";
    show(foldMsg, i >= 2 && i <= 6);
    if (i === 2) { setFolds(RANDOM_SPAM); foldMsg.textContent = "random folds: 9, 6, 3, 2, 0 spam. fold 5 has none, so its recall is not defined"; }
    if (i === 3) { setFolds([0, 0, 0, 0, 0]); foldDots.forEach(function (ds) { ds.forEach(function (d) { d.setAttribute("fill", "#8fa89c"); }); }); foldNotes.forEach(function (n) { n.textContent = "20 emails"; }); foldMsg.textContent = "K = 5 folds of 20 emails each"; }
    if (i >= 4) { setFolds(STRAT_SPAM); }
    if (i === 4) foldMsg.textContent = "stratified: every fold keeps 4 spam + 16 legitimate";
    foldBoxes.forEach(function (b, k) {
      var val = (i === 5 && k === 0) || (i === 6 && k === 1);
      b.setAttribute("fill", val ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.05)");
      b.setAttribute("stroke", val ? C_VALID : "rgba(255,255,255,0.3)");
      b.setAttribute("stroke-width", val ? "4" : "2");
    });
    if (i === 5) { foldMsg.textContent = "validate on fold 1 (blue) · train on folds 2 to 5:  " + metricsFor(0); foldLabels[0].textContent = "fold 1 · validation"; }
    else foldLabels[0].textContent = "fold 1";
    if (i === 6) { foldMsg.textContent = "next: validate on fold 2 (blue):  " + metricsFor(1); foldLabels[1].textContent = "fold 2 · validation"; }
    else foldLabels[1].textContent = "fold 2";
  }
