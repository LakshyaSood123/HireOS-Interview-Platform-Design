  var steps = [
    { id: "observed-points", label: "Observed customers", caption: "A few customers, shown by their average monthly spend: 1.9, 2.3, 3.4, 5.1, 6.4 and 7.8." },
    { id: "visible-features", label: "What we can see", caption: "The feature, the spend, is observed: we can read it off for every customer." },
    { id: "hidden-labels", label: "What we cannot see", caption: "But we do not observe which mixture component generated each customer. That identity is hidden, a latent variable z. The question marks stand for it." },
    { id: "component-a", label: "Component A", caption: "Behind the data there was a story. Component A (weight 0.4, mean 3, spread 1) generated some customers: here 1.9, 2.3 and 3.4." },
    { id: "component-b", label: "Component B", caption: "Component B (weight 0.6, mean 6, spread 1.5) generated the others: 5.1, 6.4 and 7.8. Normally nobody records this; the colors are not in the data." },
    { id: "ambiguous-point", label: "An ambiguous customer", caption: "Now a customer with spend 4.5 lies between the components. Under A the density at 4.5 is 0.1295; under B it is 0.1613." },
    { id: "possible-origins", label: "Possible origins", caption: "Both components could plausibly have produced this customer. From the spend alone we cannot say with certainty that it came from A or from B." },
    { id: "latent-membership", label: "Membership is latent", caption: "Observed: the features. Hidden: which component generated them. Membership is therefore uncertain, so we describe it with degrees rather than one label. That is the next lesson." }
  ];

  var g1 = makeGraph(60, 290, 54, 700);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.3, [0.1, 0.2, 0.3]);
  txt(axG, g1.x(0) + 4, 40, "note", "density", "start");
  var GEN = [["A", 1.9], ["A", 2.3], ["A", 3.4], ["B", 5.1], ["B", 6.4], ["B", 7.8]];
  var fA = function (x) { return TWO[0].w * gpdf(x, TWO[0].m, TWO[0].s); };
  var fB = function (x) { return TWO[1].w * gpdf(x, TWO[1].m, TWO[1].s); };
  var aArea = areaPath(svg, g1, fA, GCOL[0], 0.3), aCurve = curvePath(svg, g1, fA, GCOL[0], 3);
  var bArea = areaPath(svg, g1, fB, GCOL[1], 0.3), bCurve = curvePath(svg, g1, fB, GCOL[1], 3);
  var aLbl = txt(svg, g1.x(3), g1.y(fA(3)) - 10, "lbl", "A (0.4, mean 3)", "middle"); aLbl.style.fill = GCOL[0];
  var bLbl = txt(svg, g1.x(6), g1.y(fB(6)) - 10, "lbl", "B (0.6, mean 6)", "middle"); bLbl.style.fill = GCOL[1];
  var dots = GEN.map(function (g2) { return el("circle", { cx: g1.x(g2[1]), cy: g1.y(0) - 12, r: 8, fill: C_GRAY, stroke: "#071510", "stroke-width": 2 }, svg); });
  var vals = GEN.map(function (g2, k) { return txt(svg, g1.x(g2[1]), g1.y(0) + 46 + (k % 2) * 14, "mono", g2[1].toFixed(1), "middle"); });
  var qs = GEN.map(function (g2, k) { return txt(svg, g1.x(g2[1]), g1.y(0) - 34 - (k % 2) * 16, "big", "?", "middle"); });
  var tags = GEN.map(function (g2, k) { var t = txt(svg, g1.x(g2[1]), g1.y(0) - 34 - (k % 2) * 16, "lbl", "z = " + g2[0], "middle"); t.style.fill = GCOL[g2[0] === "A" ? 0 : 1]; return t; });
  var amb = el("circle", { cx: g1.x(4.5), cy: g1.y(0) - 12, r: 10, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, svg);
  var ambLbl = txt(svg, g1.x(4.5), g1.y(0) + 46, "mono", "4.5", "middle");
  var ambQ = txt(svg, g1.x(4.5), g1.y(0) - 34, "big", "z = ?", "middle");
  var lnA = el("line", { x1: g1.x(4.5), y1: g1.y(0) - 12, x2: g1.x(4.5), y2: g1.y(0.1295 * 0.4), stroke: GCOL[0], "stroke-width": 3 }, svg);
  var lnB = el("line", { x1: g1.x(4.5) + 6, y1: g1.y(0) - 12, x2: g1.x(4.5) + 6, y2: g1.y(0.1613 * 0.6), stroke: GCOL[1], "stroke-width": 3 }, svg);
  var originG = el("g", {}, svg);
  chip(originG, 150, 84, 140, 34, "from A?  0.1295", "rgba(56,189,248,0.25)", GCOL[0], "lbl");
  chip(originG, 340, 84, 140, 34, "from B?  0.1613", "rgba(226,180,74,0.25)", GCOL[1], "lbl");
  var cardsG = el("g", {}, svg);
  [["Observed", "the features x (spend)", "fillA"], ["Hidden", "which component made x: z", "fillB"], ["So", "membership is uncertain", "fillG"]].forEach(function (c, k) {
    var x = 16 + k * 208;
    card(cardsG, x, 60, 192, 110, c[2]);
    txt(cardsG, x + 96, 106, "lbl lbl-y", c[0], "middle");
    txt(cardsG, x + 96, 138, "note", c[1], "middle");
  });

  function render(index, id) {
    var i = index;
    show(axG, i <= 6);
    dots.forEach(function (d, k) {
      show(d, i <= 4);
      var revealed = (i >= 3 && GEN[k][0] === "A") || (i >= 4 && GEN[k][0] === "B");
      d.setAttribute("fill", revealed ? GCOL[GEN[k][0] === "A" ? 0 : 1] : C_GRAY);
    });
    vals.forEach(function (v) { show(v, i >= 1 && i <= 4); });
    qs.forEach(function (q, k) { show(q, i === 2 || (i === 3 && GEN[k][0] === "B") || (i === 4 && false)); });
    tags.forEach(function (t, k) { show(t, (i === 3 && GEN[k][0] === "A") || (i === 4)); });
    show(aArea, i >= 3 && i <= 6); show(aCurve, i >= 3 && i <= 6); show(aLbl, i >= 3 && i <= 6);
    show(bArea, i >= 4 && i <= 6); show(bCurve, i >= 4 && i <= 6); show(bLbl, i >= 4 && i <= 6);
    show(amb, i >= 5 && i <= 6); show(ambLbl, i >= 5 && i <= 6); show(ambQ, i >= 5 && i <= 6);
    show(lnA, i >= 5 && i <= 6); show(lnB, i >= 5 && i <= 6);
    show(originG, i === 6);
    show(cardsG, i === 7);
  }
