  var steps = [
    {"id": "problem-type", "label": "Problem type", "caption": "Each customer is churn or stay: a binary classification problem, so we look at classifiers."},
    {"id": "baseline", "label": "The baseline", "caption": "The simplest sensible rule flags customers inactive for over 30 days: accuracy 0.81, recall only 0.40."},
    {"id": "linear-model", "label": "Logistic-style model", "caption": "A logistic-style model weighs each feature: fast and easy to explain."},
    {"id": "tree-model", "label": "Tree-style model", "caption": "A tree-style model asks a sequence of yes or no questions and can capture interactions."},
    {"id": "complexity", "label": "Complexity", "caption": "More flexible models can fit more patterns, including accidental ones, and have more to tune."},
    {"id": "interpretability", "label": "Interpretability", "caption": "Retention staff need to understand a flag. All three candidates can be explained when kept small."},
    {"id": "constraints", "label": "Constraints", "caption": "Staff must understand a flag, daily scoring is cheap, and we have 700 training customers."},
    {"id": "candidate-set", "label": "Candidate set", "caption": "Three hypotheses to test, not winners chosen in advance."},
    {"id": "choose-to-test", "label": "Choose to test", "caption": "Train all three and measure each on the validation set under the same protocol."}
  ];

  var CX = [30, 232, 434], CWID = 176;
  var gType = el("g", {}, svg);
  card(gType, 60, 70, 520, 130, "fillA");
  txt(gType, 320, 106, "lbl lbl-y", "problem type", "middle");
  txt(gType, 320, 142, "big", "binary classification", "middle");
  txt(gType, 320, 172, "note", "each customer is churn (1) or stay (0): a classifier is the right family", "middle");
  box(gType, 140, 226, 150, 40, "rgba(248,113,113,0.3)", K_BAD, 8); txt(gType, 215, 251, "lbl", "churn = 1", "middle");
  box(gType, 350, 226, 150, 40, "rgba(29,181,132,0.3)", K_OK, 8); txt(gType, 425, 251, "lbl", "stay = 0", "middle");
  var cards = [];
  var DEFS = [
    ["baseline rule", "inactive > 30 days → flag", "accuracy " + n2(M_BASE.acc) + " · recall " + n2(M_BASE.r), 1, 3, "yes"],
    ["logistic-style", "weighs each feature", "linear boundary", 2, 2, "yes"],
    ["tree-style", "asks yes / no questions", "can capture interactions", 3, 1, "at small depth"],
  ];
  DEFS.forEach(function (d, k) {
    var g = el("g", {}, svg);
    card(g, CX[k], 60, CWID, 250, "fillA");
    txt(g, CX[k] + CWID / 2, 90, "lbl lbl-y", d[0], "middle");
    txt(g, CX[k] + CWID / 2, 118, "note", d[1], "middle");
    txt(g, CX[k] + CWID / 2, 138, "note", d[2], "middle");
    g.cx = CX[k];
    cards.push(g);
  });
  // tiny pictures
  var pic0 = el("g", {}, cards[0]); el("line", { x1: CX[0] + 40, y1: 190, x2: CX[0] + 136, y2: 190, stroke: "#c9dccf", "stroke-width": 2 }, pic0); el("line", { x1: CX[0] + 98, y1: 170, x2: CX[0] + 98, y2: 210, stroke: K_VA, "stroke-width": 3 }, pic0); txt(pic0, CX[0] + 88, 164, "tick", "30 days", "middle");
  var pic1 = el("g", {}, cards[1]);
  [["usage", -0.6], ["tickets", 0.5], ["idle days", 0.9]].forEach(function (w, k) { txt(pic1, CX[1] + 20, 172 + k * 18, "tick", w[0], "start"); box(pic1, CX[1] + 84 + (w[1] < 0 ? w[1] * 50 : 0), 164 + k * 18, Math.abs(w[1]) * 50, 9, w[1] < 0 ? K_TR : K_BAD, "none", 3); });
  var pic2 = el("g", {}, cards[2]);
  [[CX[2] + 88, 160], [CX[2] + 52, 192], [CX[2] + 124, 192]].forEach(function (p, k) { el("circle", { cx: p[0], cy: p[1], r: 8, fill: k === 0 ? K_VA : "#c9dccf" }, pic2); if (k) el("line", { x1: CX[2] + 88, y1: 168, x2: p[0], y2: p[1] - 8, stroke: "#c9dccf", "stroke-width": 2 }, pic2); });
  txt(pic2, CX[2] + 88, 214, "tick", "idle > 20?  tickets > 2?", "middle");
  var cbars = el("g", {}, svg), ibars = el("g", {}, svg);
  DEFS.forEach(function (d, k) {
    box(cbars, CX[k] + 18, 238, d[3] * 46, 12, K_VA, "none", 4); txt(cbars, CX[k] + CWID / 2, 272, "note", "complexity " + d[3], "middle");
    txt(ibars, CX[k] + CWID / 2, 246, "lbl", "explainable: " + d[5], "middle");
  });
  var cons = el("g", {}, svg);
  card(cons, 30, 322, 580, 28, "fillG");
  txt(cons, 320, 341, "note", "constraints: staff must understand a flag · daily scoring is cheap · 700 training customers", "middle");
  var sel = el("g", {}, svg);
  card(sel, 30, 322, 580, 28, "fillB");
  txt(sel, 320, 341, "lbl lbl-y", "no winner yet: train all three, measure each on the validation set", "middle");
  var q = el("g", {}, svg);
  [0, 1, 2].forEach(function (k) { txt(q, CX[k] + CWID / 2, 296, "big", "?", "middle"); });
  function render(i) {
    show(gType, i === 0);
    cards.forEach(function (g, k) { show(g, i >= 4 || (i >= 1 && k < i)); });
    show(cbars, i === 4); show(ibars, i === 5); show(cons, i === 6); show(sel, i === 8); show(q, i === 7);
  }
  flatCards();
