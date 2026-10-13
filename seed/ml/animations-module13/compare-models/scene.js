  var steps = [
    {"id": "candidate-models", "label": "Candidate models", "caption": "Three candidates: the baseline rule, the logistic-style model and the tree-style model at depth 4."},
    {"id": "same-data", "label": "Same data", "caption": "Every candidate is trained on the same 700 customers and judged on the same 150 validation customers."},
    {"id": "same-protocol", "label": "Same protocol", "caption": "Same data, same metrics, same validation set. The test set is not part of the comparison."},
    {"id": "metric-table", "label": "Metric table", "caption": "Precision, recall and F1 for each candidate on the validation set."},
    {"id": "performance", "label": "Performance against the goal", "caption": "Only the tree-style model reaches recall 0.75 and precision 0.50: recall 0.80, precision 0.59."},
    {"id": "complexity", "label": "Complexity", "caption": "The tree is the most complex candidate. More complexity means more to tune, explain and keep stable."},
    {"id": "interpretability", "label": "Interpretability", "caption": "All three can be explained to retention staff; the tree stays small at depth 4."},
    {"id": "select-model", "label": "Select the model", "caption": "The tree-style model meets the goal by trading some precision (0.64 to 0.59) for recall (0.70 to 0.80)."},
    {"id": "lock-choice", "label": "Lock the choice", "caption": "The model and its settings are written down: tree-style, max_depth 4. Nothing changes after this."},
    {"id": "test-ready", "label": "Test set ready", "caption": "Only now is the test set used, exactly once, on the locked model."}
  ];

  var NAMES = ["baseline rule", "logistic-style", "tree-style (depth 4)"], MS = [M_BASE, M_LOGI, M_TREE];
  var gCand = el("g", {}, svg);
  NAMES.forEach(function (n, k) { var c = chip(gCand, 40 + k * 200, 120, 180, 90, n, k === 2 ? "fillG" : "fillA", "lbl"); txt(gCand, 130 + k * 200, 190, "note", ["complexity 1", "complexity 2", "complexity 3"][k], "middle"); });
  txt(gCand, 320, 80, "lbl lbl-y", "three candidates, one project", "middle");
  var gData = el("g", {}, svg);
  NAMES.forEach(function (n, k) { chip(gData, 24, 80 + k * 70, 170, 50, n, "fillA", "lbl"); arrowLine(gData, "w", 2.5, 198, 105 + k * 70, 262, 105 + k * 70); });
  card(gData, 270, 70, 330, 200, "fillG");
  txt(gData, 435, 100, "lbl lbl-y", "the same for every candidate", "middle");
  box(gData, 290, 118, 290, 56, "rgba(56,189,248,0.25)", K_TR, 8); txt(gData, 435, 142, "lbl", "fit on: 700 training customers", "middle"); txt(gData, 435, 162, "note", "weeks 1-14", "middle");
  box(gData, 290, 190, 290, 56, "rgba(226,180,74,0.25)", K_VA, 8); txt(gData, 435, 214, "lbl", "judge on: 150 validation customers", "middle"); txt(gData, 435, 234, "note", "weeks 15-17", "middle");
  var gProt = el("g", {}, svg);
  card(gProt, 100, 60, 440, 250, "fillG");
  txt(gProt, 320, 92, "big", "one fair protocol", "middle");
  ["same training data for every candidate", "same validation set for every candidate", "same metrics: precision, recall, F1", "the test set is not part of the comparison"].forEach(function (s, k) { tick(gProt, 140, 134 + k * 38, 9); txt(gProt, 166, 139 + k * 38, "lbl", s, "start"); });
  var gTab = el("g", {}, svg);
  ["precision", "recall", "F1", "meets goal"].forEach(function (c, j) { txt(gTab, 160 + j * 110 + 52, 90, "tick", c, "middle"); });
  NAMES.forEach(function (n, k) { txt(gTab, 150, 126 + k * 48, "lbl", n, "end"); });
  var T = matGrid(gTab, 160, 100, 3, 4, 110, 46, MS.map(function (m) { return [n2(m.p), n2(m.r), n2(m.f1), meetsGoal(m) ? "yes" : "no"]; }));
  var note = txt(svg, 320, 262, "lbl lbl-y", "", "middle"), note2 = txt(svg, 320, 288, "note", "", "middle");
  var gCx = el("g", {}, svg);
  NAMES.forEach(function (n, k) { txt(gCx, 60, 110 + k * 56, "lbl", n, "start"); box(gCx, 250, 96 + k * 56, (k + 1) * 90, 22, K_VA, "none", 5); txt(gCx, 250 + (k + 1) * 90 + 10, 112 + k * 56, "mono", String(k + 1), "start"); });
  txt(gCx, 320, 290, "note", "more complexity: more to tune, explain and keep stable", "middle");
  var gInt = el("g", {}, svg);
  [["baseline rule", "a one-line rule", true], ["logistic-style", "one weight per feature", true], ["tree-style (depth 4)", "a short list of questions", true]].forEach(function (r, k) {
    card(gInt, 60, 76 + k * 66, 520, 52, "fillG"); tick(gInt, 90, 102 + k * 66, 10); txt(gInt, 120, 107 + k * 66, "lbl", r[0], "start"); txt(gInt, 560, 107 + k * 66, "note", r[1], "end");
  });
  txt(gInt, 320, 292, "note", "all three can be explained to retention staff; the tree stays small at depth 4", "middle");
  var gLock = el("g", {}, svg);
  card(gLock, 120, 80, 400, 180, "fillB");
  lockIcon(gLock, 320, 110, 2);
  txt(gLock, 320, 170, "big", "locked choice", "middle");
  txt(gLock, 320, 200, "mono", "tree-style · max_depth 4", "middle");
  txt(gLock, 320, 232, "note", "no more changes to the model or its settings", "middle");
  var gTest = el("g", {}, svg);
  card(gTest, 120, 80, 400, 180, "fillA");
  txt(gTest, 320, 112, "lbl lbl-y", "test set: 150 customers", "middle");
  box(gTest, 160, 128, 320, 34, K_TE, "none", 8); txt(gTest, 320, 151, "lbl", "ready, used exactly once", "middle");
  txt(gTest, 320, 196, "note", "now, and only now, evaluate the locked model on it", "middle");
  txt(gTest, 320, 226, "note", "the result is an estimate, not another round of tuning", "middle");
  function render(i) {
    show(gCand, i === 0); show(gData, i === 1); show(gProt, i === 2);
    show(gTab, i >= 3 && i <= 4 || i === 7);
    show(gCx, i === 5); show(gInt, i === 6); show(gLock, i === 8); show(gTest, i === 9);
    T.cells.forEach(function (row, r) { row.forEach(function (c, k) { c.setAttribute("class", "cell " + ((i === 4 && k === 1) ? "hl-col" : (i === 7 && r === 2) ? "hl-col" : "")); }); });
    note.textContent = i === 3 ? "validation results, positive class = churn" : (i === 4 ? "goal: recall >= 0.75 and precision >= 0.50" : (i === 7 ? "only the tree-style model meets both parts of the goal" : ""));
    note2.textContent = i === 3 ? "150 validation customers · same data, same protocol" : (i === 4 ? "recall rises 0.40 → 0.70 → 0.80; precision gives way a little" : (i === 7 ? "it trades some precision (0.64 → 0.59) for recall (0.70 → 0.80)" : ""));
  }
  flatCards();
