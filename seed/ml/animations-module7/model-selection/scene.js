  var steps = [
    { id: "candidate-models", label: "The candidate models", caption: "Five candidates for the eight development houses: a straight line, and a degree-4 curve with ridge strength λ = 0, 0.1, 0.3 and 1. Which one will predict new houses best?" },
    { id: "train", label: "Train every candidate", caption: "Each candidate is fitted to the development data. The flexible curve with λ = 0 hugs the points tightly; stronger λ smooths it out." },
    { id: "validation", label: "Score on validation data", caption: "Four-fold cross-validation scores each candidate on houses it was not trained on: line 0.0359, curve λ = 0 0.3169, λ = 0.1 0.2769, λ = 0.3 0.1662, λ = 1 0.4682." },
    { id: "compare-metrics", label: "Compare the metrics", caption: "Training error and validation error tell different stories. The λ = 0 curve has the smallest training error but a validation error almost nine times the line's." },
    { id: "reject-overfit", label: "Reject the overfitting model", caption: "A tiny training error with a large validation error is the signature of overfitting. Ridge helps the curve (λ = 0.3 is its best) but not enough." },
    { id: "select", label: "Select the best model", caption: "The straight line has the lowest validation error, so it wins. A simpler model beats a fancier one when the data are close to a line." },
    { id: "lock-choice", label: "Lock the choice", caption: "Refit the winner on all development houses and freeze every decision: the model, its hyperparameters, everything. From now on nothing may be changed in response to the test set." },
    { id: "final-test", label: "Score the test set once", caption: "Only now do we score the two locked test houses: test MSE 0.0046, in the same small range as the validation scores. If it were disappointing we would report it, not go back and tune." },
    { id: "workflow-summary", label: "The whole workflow", caption: "Train to learn parameters, validate or cross-validate to choose the model and hyperparameters, lock the choice, test once to report. This is how we avoid fooling ourselves." }
  ];

  var CANDS = [
    { l1: "straight", l2: "line", deg: 1, lam: 0 },
    { l1: "curve", l2: "λ = 0", deg: 4, lam: 0 },
    { l1: "curve", l2: "λ = 0.1", deg: 4, lam: 0.1 },
    { l1: "curve", l2: "λ = 0.3", deg: 4, lam: 0.3 },
    { l1: "curve", l2: "λ = 1", deg: 4, lam: 1 }
  ];
  CANDS.forEach(function (c) {
    var beta = ridgeFit(DEV, c.deg, c.lam);
    c.f = function (x) { return polyAt(beta, x); };
    c.tr = mseOf(c.f, DEV);
    c.cv = cvScore(polyFitFn(c.deg, c.lam), DEV, 4).mean;
  });
  var LF = lineFit(DEV);
  var TEST_MSE = mseOf(function (x) { return LF[0] * x + LF[1]; }, TESTH);

  var cardsG = el("g", {}, svg);
  var CP = CANDS.map(function (c, k) {
    var x0 = 8 + k * 126, cg = el("g", {}, cardsG);
    var cd = card(cg, x0, 40, 118, 252, "fillA");
    txt(cg, x0 + 59, 60, "lbl", c.l1, "middle");
    txt(cg, x0 + 59, 76, "lbl lbl-y", c.l2, "middle");
    var gp = makeGraph(x0 + 12, 182, 24, 10);
    clipTo("mc" + k, x0 + 4, 84, 110, 100);
    el("line", { x1: gp.x(0), y1: gp.y(0), x2: gp.x(4), y2: gp.y(0), class: "axis" }, cg);
    var fit = el("path", { class: "curve-g", d: fnPath(gp, c.f, 0.35, 3.8, 60), "clip-path": "url(#mc" + k + ")" }, cg);
    dotSet(cg, gp, DEV, C_TRAIN, 3.5);
    var tr = txt(cg, x0 + 59, 212, "tick", "train MSE " + c.tr.toFixed(4), "middle");
    var cv = txt(cg, x0 + 59, 230, "lbl", "valid " + c.cv.toFixed(4), "middle");
    var tag = txt(cg, x0 + 59, 252, "lbl", "", "middle");
    var barT = box(cg, x0 + 10, 262, Math.max(2, c.tr / 0.5 * 98), 8, C_TRAIN, "none", 2);
    var barV = box(cg, x0 + 10, 274, Math.min(98, Math.max(2, c.cv / 0.5 * 98)), 8, C_VALID, "none", 2);
    return { g: cg, card: cd, fit: fit, tr: tr, cv: cv, tag: tag, barT: barT, barV: barV, x0: x0 };
  });

  // Final test view for the chosen line.
  var finalG = el("g", {}, svg);
  var gp2 = housePlot(finalG, 60, 300, 100, 38, 3.8, 7.2, [0, 2, 4, 6]);
  el("path", { class: "curve-g", d: wbPath(gp2, LF[0], LF[1], 0, 3.8) }, finalG);
  dotSet(finalG, gp2, DEV, C_TRAIN, 5);
  TESTH.forEach(function (d) {
    var yh = LF[0] * d[0] + LF[1];
    el("line", { x1: gp2.x(d[0]), y1: gp2.y(yh), x2: gp2.x(d[0]), y2: gp2.y(d[1]), stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, finalG);
  });
  dotSet(finalG, gp2, TESTH, C_TEST, 7);
  card(finalG, 456, 60, 170, 150, "fillB");
  txt(finalG, 541, 90, "lbl lbl-p", "test set, scored once", "middle");
  txt(finalG, 541, 132, "big", "test MSE", "middle");
  txt(finalG, 541, 168, "big", TEST_MSE.toFixed(4), "middle").setAttribute("font-size", "28");
  txt(finalG, 541, 196, "note", "chosen line refit on 8 houses", "middle");

  var lockG = el("g", {}, svg);
  card(lockG, 90, 300, 460, 44, "fillB");
  lockIcon(lockG, 124, 314, 1.2);
  txt(lockG, 340, 327, "lbl lbl-p", "choice locked: line, refit on all development data", "middle");

  // Workflow strip.
  var flowG = el("g", {}, svg);
  var FLOW = [["Train", "learn parameters", "fillA"], ["Validate", "compare, tune", "fillB"], ["Select", "lowest validation", "fillG"], ["Lock", "freeze the choice", "fillB"], ["Test once", "honest final score", "fillA"]];
  FLOW.forEach(function (f, k) {
    var x = 10 + k * 126;
    card(flowG, x, 100, 112, 100, f[2]);
    txt(flowG, x + 56, 140, "big", f[0], "middle");
    txt(flowG, x + 56, 168, "note", f[1], "middle");
    if (k < 4) { var ar = arrow(flowG, "w", 3); setLine(ar, x + 114, 150, x + 124, 150); }
  });
  txt(flowG, 320, 250, "lbl lbl-y", "parameters come from train · hyperparameters from validation · the report from test", "middle");
  txt(flowG, 320, 276, "note", "the test set is used exactly once", "middle");

  function render(index, id) {
    var i = index;
    show(cardsG, i <= 6);
    CP.forEach(function (c, k) {
      show(c.fit, i >= 1);
      show(c.tr, i >= 1);
      show(c.cv, i >= 2);
      show(c.barT, i === 3 || i === 4); show(c.barV, i === 3 || i === 4);
      c.tag.textContent = ""; c.tag.setAttribute("class", "lbl"); c.tag.removeAttribute("font-size");
      c.card.setAttribute("class", "fillA");
      c.g.setAttribute("opacity", "1");
      if (i === 4) {
        if (k === 1) { c.tag.textContent = "overfit"; c.tag.setAttribute("class", "lbl lbl-r"); c.card.setAttribute("class", "fillB"); }
        else if (k >= 2) { c.tag.textContent = "helped, still behind"; c.tag.setAttribute("class", "lbl lbl-y"); c.tag.setAttribute("font-size", "10"); }
      }
      if (i >= 5) {
        if (k === 0) { c.card.setAttribute("class", "fillG"); c.tag.textContent = i === 5 ? "selected" : "chosen"; c.tag.setAttribute("class", "lbl lbl-g"); }
        else c.g.setAttribute("opacity", "0.3");
      }
    });
    show(lockG, i === 6);
    show(finalG, i === 7);
    show(flowG, i === 8);
  }
