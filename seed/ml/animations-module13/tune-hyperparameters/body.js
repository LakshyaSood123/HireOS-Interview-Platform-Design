
  var gBase = el("g", {}, svg);
  card(gBase, 40, 70, 250, 200, "fillB"); card(gBase, 350, 70, 250, 200, "fillA");
  txt(gBase, 165, 100, "lbl lbl-y", "parameters", "middle"); txt(gBase, 165, 132, "note", "learned from the training data", "middle"); txt(gBase, 165, 156, "note", "split questions inside the tree", "middle"); txt(gBase, 165, 180, "note", "weights, biases", "middle");
  txt(gBase, 475, 100, "lbl lbl-y", "hyperparameters", "middle"); txt(gBase, 475, 132, "note", "chosen by us, outside the fitting", "middle"); txt(gBase, 475, 156, "note", "max depth · regularization strength", "middle"); txt(gBase, 475, 180, "note", "learning rate · decision threshold", "middle");
  txt(gBase, 320, 304, "lbl lbl-y", "tree-style model", "middle");
  var hp = el("g", {}, svg);
  card(hp, 100, 90, 440, 150, "fillA");
  txt(hp, 320, 126, "lbl lbl-y", "the hyperparameter we tune", "middle");
  txt(hp, 320, 168, "big", "max_depth", "middle");
  txt(hp, 320, 200, "note", "how many questions in a row the tree may ask", "middle");
  txt(hp, 320, 224, "note", "candidate settings: 1, 2, 4, 8", "middle");
  var cols = DEPTHS.map(function (d, k) {
    var g = el("g", {}, svg), x = 30 + k * 150;
    card(g, x, 64, 140, 230, "fillA");
    txt(g, x + 70, 92, "lbl lbl-y", "depth " + d[0], "middle");
    txt(g, x + 70, 112, "tick", "candidate " + "abcd"[k], "middle");
    g.x = x; return g;
  });
  var trainRow = el("g", {}, svg), valRow = el("g", {}, svg), pickRow = el("g", {}, svg);
  DEPTHS.forEach(function (d, k) {
    var x = 30 + k * 150;
    txt(trainRow, x + 70, 142, "note", "fit on training data", "middle");
    txt(trainRow, x + 70, 160, "tick", "(train F1 " + d[1].toFixed(2) + ")", "middle");
    txt(valRow, x + 70, 192, "note", "validation F1", "middle");
    box(valRow, x + 20, 202, Math.max(3, d[2] * 100), 16, K_VA, "none", 4);
    txt(valRow, x + 70, 240, "mono", d[2].toFixed(3), "middle");
  });
  var best = el("rect", { x: 30 + 2 * 150 - 4, y: 60, width: 148, height: 238, rx: 12, fill: "none", stroke: K_OK, "stroke-width": 4 }, pickRow);
  txt(pickRow, 30 + 2 * 150 + 70, 270, "lbl lbl-g", "best on validation", "middle");
  var lockG = el("g", {}, svg);
  card(lockG, 30, 306, 580, 44, "fillB");
  lockIcon(lockG, 70, 326, 1.1);
  txt(lockG, 340, 334, "lbl lbl-y", "the test set stays locked: it plays no part in choosing a depth", "middle");
  var note = txt(svg, 320, 330, "note", "", "middle");
  function render(i) {
    show(gBase, i === 0); show(hp, i === 1);
    cols.forEach(function (g, k) { show(g, i >= 2 + k && i <= 8 || (i === 9 && true)); });
    cols.forEach(function (g, k) { show(g, i >= 2 + k); });
    show(trainRow, i >= 6); show(valRow, i >= 7); show(pickRow, i >= 8); show(lockG, i === 9);
    note.textContent = i === 6 ? "each candidate is trained on the training data only" : (i === 7 ? "each trained model is judged on the validation data" : (i === 8 ? "select by validation F1, not by training F1 (depth 8 would win there)" : ""));
  }
  flatCards();
