  var steps = [
    { id: "training-data", label: "Emails the model trained on", caption: "A spam classifier is fitted to a set of training emails. Its parameters are tuned to these particular examples." },
    { id: "high-training-score", label: "A high training score", caption: "Scored on those same emails, it reaches 98 percent accuracy. That looks excellent, but the model has seen these emails." },
    { id: "new-data", label: "New, unseen emails", caption: "Now fresh emails arrive that were not used to fit the model. This validation data shows how the model behaves on mail it has never seen." },
    { id: "performance-drop", label: "Performance drops", caption: "Validation accuracy is only 84 percent: a 14-point gap. The validation score is the better guide to real use. A large gap is the overfitting you saw in Regression in Practice." },
    { id: "imbalanced-data", label: "A different problem: imbalance", caption: "A mailbox of 100 emails has 95 legitimate emails and only 5 spam. When one class is rare, accuracy can hide a lot." },
    { id: "always-negative", label: "A model that always says legitimate", caption: "Consider a lazy model that predicts legitimate for every email. It never flags anything." },
    { id: "high-accuracy", label: "95% accuracy", caption: "It is right for all 95 legitimate emails: 95 correct out of 100, so 95 percent accuracy. That sounds great." },
    { id: "missed-positive-class", label: "But it misses every spam", caption: "Yet it catches 0 of the 5 spam emails. A high accuracy came from ignoring the rare class completely." },
    { id: "need-better-metrics", label: "We need better metrics", caption: "Accuracy is one performance metric, not the whole story. Next: a table of the four outcomes, then precision, recall and F1, which look at each kind of mistake." }
  ];

  // Training / validation emails: two groups of small dots.
  var trainG = el("g", {}, svg);
  card(trainG, 30, 50, 280, 200, "fillA");
  txt(trainG, 170, 76, "lbl lbl-y", "TRAINING EMAILS (seen by the model)", "middle");
  dotGrid(trainG, 70, 106, 28, 9, 40, 8, function (i) { return i % 5 === 0 ? C_SPAM : C_HAM; });
  var modelBox = el("g", {}, svg);
  card(modelBox, 340, 90, 120, 100, "fillG");
  txt(modelBox, 400, 128, "lbl lbl-g", "classifier", "middle");
  txt(modelBox, 400, 152, "note", "fitted to these", "middle");
  txt(modelBox, 400, 168, "note", "emails", "middle");
  var a1 = arrow(modelBox, "w", 3); setLine(a1, 314, 140, 336, 140);
  var gaugeG = el("g", {}, svg);
  var gtrain = box(gaugeG, 490, 60, 24, 0, C_OK, "none", 4);
  box(gaugeG, 490, 60, 24, 190, "rgba(255,255,255,0.06)", "none", 4);
  var gtrain2 = box(gaugeG, 490, 250 - 186, 24, 186, C_OK, "none", 4);
  txt(gaugeG, 502, 54, "big", "98%", "middle");
  txt(gaugeG, 502, 268, "note", "training accuracy", "middle");

  var newG = el("g", {}, svg);
  card(newG, 30, 270, 280, 70, "fillB");
  txt(newG, 170, 292, "lbl lbl-b", "NEW EMAILS (never seen)", "middle");
  dotGrid(newG, 70, 318, 28, 8, 8, 8, function (i) { return i % 4 === 0 ? C_SPAM : C_HAM; });

  var dropG = el("g", {}, svg);
  card(dropG, 330, 200, 300, 140, "fillB");
  var bTrain = box(dropG, 360, 228, 98 * 1.6, 28, C_OK, "none", 5);
  txt(dropG, 360 + 98 * 1.6 + 8, 248, "lbl", "98% training", "start");
  var bVal = box(dropG, 360, 270, 84 * 1.6, 28, C_BAD, "none", 5);
  txt(dropG, 360 + 84 * 1.6 + 8, 290, "lbl", "84% validation", "start");
  txt(dropG, 480, 322, "lbl lbl-y", "gap: 14 points", "middle");

  // 10x10 grid for the imbalanced mailbox.
  var gridG = el("g", {}, svg);
  var GD = dotGrid(gridG, 70, 70, 24, 8, 100, 10, function (i) { return i < 95 ? C_HAM : C_SPAM; });
  txt(gridG, 190, 330, "note", "100 emails: 95 legitimate (blue), 5 spam (pink)", "middle");
  var rings = GD.map(function (c) { return el("circle", { cx: c.getAttribute("cx"), cy: c.getAttribute("cy"), r: 11, fill: "none", stroke: C_HAM, "stroke-width": 2 }, gridG); });
  var marks = GD.map(function (c, i) { var t = txt(gridG, +c.getAttribute("cx"), +c.getAttribute("cy") + 5, "big", "", "middle"); t.setAttribute("font-size", "12"); return t; });
  var sideG = el("g", {}, svg);
  card(sideG, 340, 60, 290, 120, "fillG");
  var sideTop = txt(sideG, 485, 94, "lbl lbl-y", "", "middle");
  var sideBig = txt(sideG, 485, 136, "big", "", "middle"); sideBig.setAttribute("font-size", "26");
  var sideSub = txt(sideG, 485, 164, "note", "", "middle");
  var missG = el("g", {}, svg);
  card(missG, 340, 200, 290, 100, "fillB");
  txt(missG, 485, 234, "lbl lbl-r", "spam caught: 0 of 5", "middle");
  txt(missG, 485, 262, "note", "all 5 spam emails slip through", "middle");
  txt(missG, 485, 284, "note", "accuracy never noticed", "middle");
  var needG = el("g", {}, svg);
  [["Accuracy alone", "hides which class fails", "fillB"], ["Next: four outcomes", "confusion matrix", "fillA"], ["Then", "precision · recall · F1", "fillG"]].forEach(function (c, k) {
    var x = 24 + k * 204;
    card(needG, x, 100, 188, 120, c[2]);
    txt(needG, x + 94, 150, "lbl lbl-y", c[0], "middle");
    txt(needG, x + 94, 182, "note", c[1], "middle");
    if (k < 2) { var ar = arrow(needG, "w", 3); setLine(ar, x + 190, 160, x + 202, 160); }
  });

  function render(index, id) {
    var i = index;
    show(trainG, i <= 3); show(modelBox, i <= 3);
    show(gaugeG, i === 1);
    show(newG, i >= 2 && i <= 3);
    show(dropG, i === 3);
    show(gridG, i >= 4 && i <= 7); show(sideG, i >= 4 && i <= 7);
    show(missG, i === 7); show(needG, i === 8);
    rings.forEach(function (r, k) { show(r, i >= 5); });
    marks.forEach(function (m, k) {
      var correct = k < 95;
      m.textContent = i >= 6 ? (correct ? "✓" : "✕") : "";
      m.style.fill = "#071510"; m.style.stroke = "none";
    });
    if (i === 4) { sideTop.textContent = "the mailbox"; sideBig.textContent = "95 : 5"; sideSub.textContent = "legitimate : spam"; }
    if (i === 5) { sideTop.textContent = "model: always legitimate"; sideBig.textContent = "never flags"; sideSub.textContent = "every ring says legitimate"; }
    if (i === 6) { sideTop.textContent = "accuracy"; sideBig.textContent = "95 / 100 = 95%"; sideSub.textContent = "✓ = correct prediction"; }
    if (i === 7) { sideTop.textContent = "accuracy"; sideBig.textContent = "95%"; sideSub.textContent = "✕ = the 5 spam emails, all missed"; }
  }
