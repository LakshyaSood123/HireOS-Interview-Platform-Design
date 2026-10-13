  var steps = [
    { id: "full-data", label: "All the houses", caption: "We have ten houses with known prices. If we judged a model on the same houses it learned from, it would always look good, so we split them into separate roles." },
    { id: "split", label: "Split into three roles", caption: "Five houses to train on, three to validate, two for the test set. The test houses go into a locked drawer; nobody looks at them yet." },
    { id: "train-models", label: "Fit candidate models on training only", caption: "Two candidates: a flat model (always the average price) and a straight line. Their parameters are learned from the five training houses only." },
    { id: "training-results", label: "Training results", caption: "On the training houses: the flat model has MSE 1.2024 and the line 0.0166. Training error alone would rank models by how flexible they are, so it cannot choose." },
    { id: "validation-results", label: "Validation results", caption: "Now score each model on the three validation houses it has never seen: flat 2.5629, line 0.0111. The residuals on these houses are the honest signal." },
    { id: "compare", label: "Compare on validation", caption: "Lower validation MSE is better. The line is far better than the flat model. Choosing among models, and tuning hyperparameters like the polynomial degree or λ, is the validation set's job." },
    { id: "choose-model", label: "Choose the line", caption: "We pick the straight line. Its parameters came from the training set; our choice came from the validation set. (The overfit curve of Lesson 6, with validation 3.0073, would have lost too.)" },
    { id: "test-stays-locked", label: "The test set stays locked", caption: "The test houses were never used to fit or to choose. They are scored once, at the very end. Using validation for many choices makes its score slightly optimistic, which is why the test set must stay untouched." }
  ];

  // Ten house tokens: five train, three validation, two test.
  var TOK = [];
  HOUSES.forEach(function (d) { TOK.push({ d: d, role: "train" }); });
  VALID.forEach(function (d) { TOK.push({ d: d, role: "valid" }); });
  TESTH.forEach(function (d) { TOK.push({ d: d, role: "test" }); });
  var SLOT = [2, 0, 6, 3, 8, 5, 1, 7, 4, 9];
  var ROLE_COL = { train: C_TRAIN, valid: C_VALID, test: C_TEST };
  var ROLE_START = { train: 36, valid: 236, test: 436 };
  var roleCount = { train: 0, valid: 0, test: 0 };
  TOK.forEach(function (t, i) {
    t.idx = roleCount[t.role]++;
    t.splitX = ROLE_START[t.role] + t.idx * 40;
    t.fullX = 38 + SLOT[i] * 62;
    t.node = el("g", {}, svg);
    t.node.style.transform = "translate(0px,0px)";
    t.circle = el("circle", { cx: 0, cy: 0, r: 16, fill: "#8fa89c", stroke: "#071510", "stroke-width": 2 }, t.node);
    txt(t.node, 0, 4, "tick", t.d[0].toFixed(2).replace(/0$/, ""), "middle").style.fill = "#071510";
  });
  function placeTokens(split) {
    TOK.forEach(function (t) {
      place(t.node, split ? t.splitX : t.fullX, 54);
      t.circle.setAttribute("fill", split ? ROLE_COL[t.role] : "#8fa89c");
    });
  }
  var rolesG = el("g", {}, svg);
  txt(rolesG, 36 + 2 * 40, 92, "lbl lbl-y", "TRAIN (5)  fit parameters", "middle");
  txt(rolesG, 236 + 40, 92, "lbl lbl-b", "VALIDATION (3)  choose", "middle");
  txt(rolesG, 436 + 20, 92, "lbl lbl-p", "TEST (2)  locked", "middle");
  var drawer = el("g", {}, svg);
  box(drawer, 412, 30, 100, 46, "rgba(244,114,182,0.12)", "#f472b6", 8);
  lockIcon(drawer, 560, 52, 1.1);
  var fullNote = txt(svg, 320, 92, "lbl", "10 houses", "middle");

  // Scatter of all ten houses, shown while the data is split.
  var scatG = el("g", {}, svg);
  var sg = housePlot(scatG, 150, 318, 100, 30, 3.8, 6.4, [0, 2, 4, 6]);
  var scatDots = TOK.map(function (t) {
    return el("circle", { cx: sg.x(t.d[0]), cy: sg.y(t.d[1]), r: 7, fill: "#8fa89c", stroke: "#071510", "stroke-width": 2 }, scatG);
  });

  // Model cards.
  var MODELS = [
    { name: "flat model", sub: "always the average price", x: 30 },
    { name: "straight line", sub: "ŷ = w·x + b", x: 330 }
  ];
  var lf = lineFit(HOUSES);
  var fns = [function () { return 3.56; }, function (x) { return lf[0] * x + lf[1]; }];
  var ST = fns.map(function (f) { return { tr: mseOf(f, HOUSES), va: mseOf(f, VALID) }; });
  var cardsG = el("g", {}, svg);
  var cardParts = MODELS.map(function (m, k) {
    var cg = el("g", {}, cardsG);
    var cd = card(cg, m.x, 112, 280, 196, k === 1 ? "fillG" : "fillA");
    txt(cg, m.x + 140, 132, "lbl", m.name, "middle");
    txt(cg, m.x + 140, 146, "note", m.sub, "middle");
    var gp = makeGraph(m.x + 26, 252, 56, 14);
    el("line", { x1: gp.x(0), y1: gp.y(0), x2: gp.x(4.1), y2: gp.y(0), class: "axis" }, cg);
    el("line", { x1: gp.x(0), y1: gp.y(0), x2: gp.x(0), y2: gp.y(6.5), class: "axis" }, cg);
    var fitP = el("path", { class: "curve-g", d: wbPath(gp, k === 0 ? 0 : lf[0], k === 0 ? 3.56 : lf[1], 0, 4.0) }, cg);
    var vg = el("g", {}, cg);
    VALID.forEach(function (d) {
      var f = fns[k];
      el("line", { x1: gp.x(d[0]), y1: gp.y(f(d[0])), x2: gp.x(d[0]), y2: gp.y(d[1]), stroke: C_RES, "stroke-width": 3 }, vg);
    });
    dotSet(vg, gp, VALID, C_VALID, 4);
    var tg = el("g", {}, cg);
    dotSet(tg, gp, HOUSES, C_TRAIN, 4);
    var trTxt = txt(cg, m.x + 140, 276, "mono", "train MSE " + ST[k].tr.toFixed(4), "middle");
    var vaTxt = txt(cg, m.x + 140, 298, "mono", "valid MSE " + ST[k].va.toFixed(4), "middle");
    return { g: cg, card: cd, fit: fitP, valid: vg, trainDots: tg, trTxt: trTxt, vaTxt: vaTxt };
  });
  var feed = arrow(svg, "y", 3); setLine(feed, 120, 100, 120, 110);
  var banner = el("g", {}, svg);
  card(banner, 130, 318, 380, 32, "fillG");
  var bannerTxt = txt(banner, 320, 339, "lbl lbl-g", "", "middle");
  var lockBig = lockIcon(svg, 320, 160, 3);

  function render(index, id) {
    var i = index;
    placeTokens(i >= 1);
    show(fullNote, i === 0);
    show(scatG, i <= 1);
    scatDots.forEach(function (d, k) { d.setAttribute("fill", i >= 1 ? ROLE_COL[TOK[k].role] : "#8fa89c"); });
    show(rolesG, i >= 1);
    show(drawer, i >= 1);
    show(cardsG, i >= 2 && i <= 6);
    show(feed, false);
    cardParts.forEach(function (c, k) {
      show(c.valid, i >= 4);
      show(c.trTxt, i >= 3);
      show(c.vaTxt, i >= 4);
      c.g.setAttribute("opacity", i >= 2 && i <= 6 ? (i === 6 && k === 0 ? "0.35" : "1") : "0");
      c.card.setAttribute("stroke-width", i >= 6 && k === 1 ? "4" : "2");
    });
    show(banner, i === 5 || i === 6 || i === 7);
    if (i === 5) bannerTxt.textContent = "validation MSE: flat 2.5629   line 0.0111";
    if (i === 6) bannerTxt.textContent = "choose the line: lowest validation MSE";
    if (i === 7) bannerTxt.textContent = "the test set is scored once, at the very end";
    show(lockBig, i === 7);
    TOK.forEach(function (t) { t.node.setAttribute("opacity", i === 7 && t.role !== "test" ? "0.35" : "1"); });
    if (i === 7) { rolesG.setAttribute("opacity", "0.6"); }
  }
