  var steps = [
    { id: "same-point", label: "The same ambiguous point", caption: "Two components for simple numbers: A (weight 0.4, mean 3, spread 1) and B (weight 0.6, mean 6, spread 1.5). The customer is at spend x = 4.5." },
    { id: "kmeans-hard-choice", label: "A hard choice", caption: "K-Means with centers 3 and 6 finds 4.5 exactly in between: 1.5 from each. It must still pick one label, and the doubt is lost." },
    { id: "gmm-components", label: "The GMM components", caption: "A GMM keeps both components. The curves show how each component spreads its customers along the spend axis." },
    { id: "density-under-a", label: "How well does A explain x?", caption: "The density of component A at 4.5 is 0.1295." },
    { id: "density-under-b", label: "How well does B explain x?", caption: "The density of component B at 4.5 is 0.1613. B is wider, so it reaches further." },
    { id: "combine-with-weights", label: "Include the mixing weights", caption: "Scale by the weights: 0.4 × 0.1295 = 0.0518 for A and 0.6 × 0.1613 = 0.0968 for B. These are the weighted scores." },
    { id: "normalize", label: "Normalize", caption: "The scores are not yet shares. Divide each by their total, 0.0518 + 0.0968 = 0.1486, so that they add up to 1." },
    { id: "responsibilities", label: "The responsibilities", caption: "Responsibilities for this customer: A 0.3486 and B 0.6514. They add up to 1." },
    { id: "soft-membership", label: "Soft membership", caption: "Responsibilities are point-specific. They differ from the global mixing weights (0.4 and 0.6). Soft membership keeps the doubt that a hard label discards." }
  ];

  var X = 4.5;
  var RS = resp1(X, TWO);
  var g1 = makeGraph(40, 280, 32, 560);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.4, [0.1, 0.2, 0.3, 0.4]);
  var uA = function (x) { return gpdf(x, TWO[0].m, TWO[0].s); }, uB = function (x) { return gpdf(x, TWO[1].m, TWO[1].s); };
  var wA = function (x) { return TWO[0].w * uA(x); }, wB = function (x) { return TWO[1].w * uB(x); };
  var unwG = el("g", {}, svg);
  curvePath(unwG, g1, uA, GCOL[0], 3); curvePath(unwG, g1, uB, GCOL[1], 3);
  var wtG = el("g", {}, svg);
  areaPath(wtG, g1, wA, GCOL[0], 0.3); curvePath(wtG, g1, wA, GCOL[0], 3);
  areaPath(wtG, g1, wB, GCOL[1], 0.3); curvePath(wtG, g1, wB, GCOL[1], 3);
  var aTxt = txt(svg, g1.x(3), g1.y(uA(3)) - 10, "lbl", "A", "middle"); aTxt.style.fill = GCOL[0];
  var bTxt = txt(svg, g1.x(6.5), g1.y(uB(6)) - 10, "lbl", "B", "middle"); bTxt.style.fill = GCOL[1];
  var vline = el("line", { x1: g1.x(X), y1: g1.y(0), x2: g1.x(X), y2: 56, stroke: "#e6f5ec", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  var pdot = el("circle", { cx: g1.x(X), cy: g1.y(0) - 8, r: 9, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, svg);
  txt(svg, g1.x(X), g1.y(0) + 46, "lbl", "x = 4.5", "middle");
  var markA = el("circle", { r: 7, fill: GCOL[0], stroke: "#071510", "stroke-width": 2 }, svg);
  var markB = el("circle", { r: 7, fill: GCOL[1], stroke: "#071510", "stroke-width": 2 }, svg);

  var panel = el("g", {}, svg);
  card(panel, 400, 50, 232, 230, "fillG");
  var pt = txt(panel, 516, 76, "lbl lbl-y", "", "middle");
  var barsG = el("g", {}, panel);
  var bars = [0, 1].map(function (k) {
    var y = 100 + k * 56;
    txt(barsG, 414, y + 20, "lbl", GNAME[k], "start").style.fill = GCOL[k];
    var b = box(barsG, 436, y, 10, 28, GCOL[k], "none", 5);
    var v = txt(barsG, 446, y + 20, "mono", "", "start");
    return { bar: b, val: v, y: y };
  });
  var pn = txt(panel, 516, 232, "lbl lbl-g", "", "middle");
  var pn2 = txt(panel, 516, 256, "note", "", "middle");
  var stack = el("g", {}, svg);
  box(stack, 400, 300, 232, 26, "rgba(255,255,255,0.06)", "none", 6);
  var sA = box(stack, 400, 300, 232 * RS.r[0], 26, GCOL[0], "none", 6);
  var sB = box(stack, 400 + 232 * RS.r[0], 300, 232 * RS.r[1], 26, GCOL[1], "none", 6);
  var sa = txt(stack, 400 + 116 * RS.r[0], 314, "mono", "A 0.3486", "middle"); sa.style.fill = "#071510"; sa.style.stroke = "none";
  var sb = txt(stack, 400 + 232 * RS.r[0] + 116 * RS.r[1], 314, "mono", "B 0.6514", "middle"); sb.style.fill = "#071510"; sb.style.stroke = "none";
  txt(stack, 516, 340, "note", "sum = 1", "middle");
  var hardG = el("g", {}, svg);
  card(hardG, 400, 50, 232, 130, "fillB");
  txt(hardG, 516, 76, "lbl lbl-p", "K-Means", "middle");
  txt(hardG, 516, 106, "mono", "distance to 3:  1.5", "middle");
  txt(hardG, 516, 130, "mono", "distance to 6:  1.5", "middle");
  txt(hardG, 516, 160, "lbl lbl-r", "a tie, but one label forced", "middle");
  var contrastG = el("g", {}, svg);
  card(contrastG, 400, 190, 232, 90, "fillA");
  txt(contrastG, 516, 214, "lbl lbl-y", "weights 0.4 / 0.6", "middle");
  txt(contrastG, 516, 236, "note", "global: the same for every point", "middle");
  txt(contrastG, 516, 262, "lbl lbl-g", "responsibilities 0.35 / 0.65", "middle");

  function setBars(vals, scale, fmt, n) {
    bars.forEach(function (b, k) { show(b.bar, k < n); show(b.val, k < n); setBox(b.bar, 436, b.y, Math.max(3, vals[k] * scale), 28); b.val.textContent = fmt(vals[k]); b.val.setAttribute("x", 436 + Math.max(3, vals[k] * scale) + 8); });
  }
  function render(index, id) {
    var i = index;
    show(axG, i !== 1 || true);
    show(unwG, i >= 3 && i <= 4); show(wtG, i === 2 || i >= 5);
    show(aTxt, i >= 2); show(bTxt, i >= 2);
    show(vline, i >= 0 && i !== 1); show(pdot, true);
    show(markA, i === 3 || i === 4 && false); show(markB, i === 4);
    markA.setAttribute("cx", g1.x(X)); markA.setAttribute("cy", g1.y(uA(X)));
    markB.setAttribute("cx", g1.x(X)); markB.setAttribute("cy", g1.y(uB(X)));
    if (i === 4) { show(markA, true); }
    show(panel, i >= 3 && i <= 7); show(hardG, i === 1);
    show(stack, i === 7 || i === 8); show(contrastG, i === 8);
    show(barsG, i >= 3 && i <= 7);
    pt.textContent = ""; pn.textContent = ""; pn2.textContent = "";
    if (i === 3) { pt.textContent = "density at x = 4.5"; setBars(RS.dens, 600, function (v) { return f2(v * 100) / 100 + ""; }, 1); bars[0].val.textContent = RS.dens[0].toFixed(4); }
    if (i === 4) { pt.textContent = "density at x = 4.5"; setBars(RS.dens, 600, function (v) { return v.toFixed(4); }, 2); }
    if (i === 5) { pt.textContent = "weighted scores"; setBars(RS.scores, 1250, function (v) { return v.toFixed(4); }, 2); pn.textContent = "0.4 × 0.1295   0.6 × 0.1613"; }
    if (i === 6) { pt.textContent = "normalize"; setBars(RS.scores, 1250, function (v) { return v.toFixed(4); }, 2); pn.textContent = "total 0.1486"; pn2.textContent = "divide each score by the total"; }
    if (i === 7) { pt.textContent = "responsibilities"; setBars(RS.r, 160, function (v) { return v.toFixed(4); }, 2); pn.textContent = "0.3486 + 0.6514 = 1"; }
  }
