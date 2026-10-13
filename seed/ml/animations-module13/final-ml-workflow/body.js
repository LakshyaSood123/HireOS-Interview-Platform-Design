
  var CH = [
    ["Frame problem", "churn in 30 days"], ["Data", "1,000 customers"], ["Features + target", "no leakage"], ["Split", "700 / 150 / 150"], ["Baseline", "recall 0.40"],
    ["Choose models", "logistic · tree"], ["Train", "fit parameters"], ["Validate", "F1 0.67 / 0.68"], ["Diagnose", "under / overfit"], ["Tune", "max_depth 4"],
    ["Compare", "tree meets goal"], ["Lock", "model + settings"], ["Final test", "once · F1 0.64"], ["Monitor", "drift, retrain"],
  ];
  var CAP = [
    "a vague wish becomes a measurable question: will this customer cancel within 30 days?",
    "1,000 customer observations over 20 weeks; about 20% churn",
    "five features known on day 0, target churned_30d; the leaky closed date is removed",
    "chronological 700 / 150 / 150 · the test set is locked",
    "a simple rule sets the bar: accuracy 0.81, but recall only 0.40",
    "candidates to test, not winners: logistic-style and tree-style",
    "training adjusts parameters using the training data only",
    "validation: logistic F1 0.67, recall 0.70, below the goal",
    "poor on both = underfitting · train 0.97 vs validation 0.59 = overfitting",
    "validation picks max_depth 4 (F1 0.676); training score alone would pick 8",
    "same data, same protocol: the tree meets the goal (recall 0.80, precision 0.59)",
    "model and settings are locked: tree-style, max_depth 4",
    "test set, evaluated once: precision 0.54, recall 0.79, F1 0.64",
    "after launch: usage has shifted 25% since training → investigate, retrain if needed",
    "a disciplined, iterative process, not “pick an algorithm, train, done”",
  ];
  var cells = CH.map(function (c, k) {
    var x = 24 + (k % 5) * 122, y = 64 + Math.floor(k / 5) * 88;
    var g = chip(svg, x, y, 112, 66, "", "fillA", "lbl");
    g.t.textContent = ""; txt(g, x + 56, y + 28, "lbl", c[0], "middle"); txt(g, x + 56, y + 50, "tick", c[1], "middle");
    txt(g, x + 10, y + 14, "tick", String(k + 1), "start");
    g.setAttribute("data-x", x);
    if (k % 5 !== 4) txt(svg, x + 117, y + 38, "big", "›", "middle");
    return { g: g, card: g.firstChild };
  });
  var arrows = [];
  svg.querySelectorAll("text").forEach(function (t) { if (t.textContent === "›") arrows.push(t); });
  var banner = el("g", {}, svg);
  card(banner, 512, 240, 112, 66, "fillG");
  txt(banner, 568, 268, "lbl lbl-y", "Reliable", "middle"); txt(banner, 568, 288, "lbl lbl-y", "ML system", "middle");
  var iter = el("g", {}, svg);
  el("path", { d: "M 24 294 L 8 294 L 8 212 L 24 212", fill: "none", stroke: K_VA, "stroke-width": 3 }, iter);
  el("path", { d: "M 18 206 L 26 212 L 18 218", fill: "none", stroke: K_VA, "stroke-width": 3 }, iter);
  txt(iter, 14, 232, "tick", "iterate", "start");
  var cap = el("g", {}, svg);
  card(cap, 24, 316, 600, 36, "fillB");
  var capT = txt(cap, 324, 339, "note", "", "middle");
  function render(i) {
    cells.forEach(function (c, k) {
      show(c.g, k <= i);
      c.card.setAttribute("class", i === 14 ? "fillG" : (k === i ? "fillB" : "fillG"));
    });
    var map = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13];
    arrows.forEach(function (a, n) { a.setAttribute("opacity", map[n] < i ? "1" : "0"); });
    show(banner, i === 14); show(iter, i === 14);
    capT.textContent = CAP[i];
  }
  flatCards();
