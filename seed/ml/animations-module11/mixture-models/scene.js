  var steps = [
    { id: "multipeak-data", label: "Data with several peaks", caption: "Our 16 customers' spend again. The values clump into three groups, so a good density should have three peaks." },
    { id: "single-distribution-problem", label: "One bell curve is not enough", caption: "A single bell curve fitted to this data sits at the mean, 4.92, with standard deviation 2.34. Its peak lands between the groups and it misses the clumps near 2 and 8." },
    { id: "component-a", label: "Component A", caption: "Describe the left clump with its own bell curve, component A (mean 2, spread 0.8), scaled by its weight 0.30." },
    { id: "component-b", label: "Component B", caption: "Component B (mean 5, spread 1.0) covers the middle clump with weight 0.45." },
    { id: "component-c", label: "Component C", caption: "Component C (mean 8, spread 0.9) covers the right clump with weight 0.25." },
    { id: "mixing-weights", label: "The mixing weights", caption: "The mixing weights π are 0.30, 0.45 and 0.25. They are positive and add up to 1: each is roughly the share of the data its component accounts for." },
    { id: "combine-components", label: "Add the components", caption: "At every spend value, add up the three weighted component curves: π_A p_A(x) + π_B p_B(x) + π_C p_C(x)." },
    { id: "overall-density", label: "The overall density", caption: "The sum is the mixture density: it rises at each clump and dips between them, like the data. At spend 3.5, in the valley, it is 0.084." },
    { id: "mixture-idea", label: "The mixture idea", caption: "A mixture builds a complicated distribution from simple parts. A, B and C are mathematical components, not named customer types." }
  ];

  var g1 = makeGraph(60, 290, 52, 1100);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.2, [0.05, 0.10, 0.15]);
  txt(axG, g1.x(0) + 4, 40, "note", "density", "start");
  var n = SPEND.length, mean = 0, sd = 0;
  SPEND.forEach(function (x) { mean += x / n; });
  SPEND.forEach(function (x) { sd += (x - mean) * (x - mean) / n; });
  sd = Math.sqrt(sd);
  var singleF = function (x) { return gpdf(x, mean, sd); };
  var singleCurve = curvePath(svg, g1, singleF, "#c9dccf", 4, "8 5");
  var singleLbl = txt(svg, g1.x(7.2), g1.y(singleF(7.2)) - 12, "lbl", "single bell curve", "middle");
  var valley = box(svg, g1.x(3.1), 60, g1.sx * 0.8, g1.y(0) - 60, "rgba(248,113,113,0.14)", C_BAD, 6);
  var valLbl = txt(svg, g1.x(3.5), 74, "lbl lbl-r", "few customers, yet", "middle");
  var valLbl2 = txt(svg, g1.x(3.5), 90, "lbl lbl-r", "high density here", "middle");
  var compFs = MIX3.map(function (c) { return function (x) { return c.w * gpdf(x, c.m, c.s); }; });
  var compAreas = compFs.map(function (f, k) { return areaPath(svg, g1, f, GCOL[k], 0.3); });
  var compCurves = compFs.map(function (f, k) { return curvePath(svg, g1, f, GCOL[k], 3); });
  var compLbls = MIX3.map(function (c, k) { return txt(svg, g1.x(c.m), g1.y(compFs[k](c.m)) - 10, "lbl", GNAME[k] + "  (π = " + c.w.toFixed(2) + ")", "middle"); });
  compLbls.forEach(function (t, k) { t.style.fill = GCOL[k]; });
  var sumF = function (x) { return mixPdf(x, MIX3); };
  var sumCurve = curvePath(svg, g1, sumF, "#e6f5ec", 5);
  var sumArea = areaPath(svg, g1, sumF, "#e6f5ec", 0.1);
  var dots = SPEND.map(function (x, i) { return el("circle", { cx: g1.x(x), cy: g1.y(0) - 6 - (i % 2) * 14, r: 6, fill: C_HAM, stroke: "#071510", "stroke-width": 2 }, svg); });
  var wG = el("g", {}, svg);
  card(wG, 400, 28, 230, 108, "fillA"); // compact, so it stays clear of the C curve label
  txt(wG, 515, 46, "lbl lbl-y", "mixing weights", "middle");
  MIX3.forEach(function (c, k) {
    var y = 54 + k * 23;
    txt(wG, 414, y + 13, "lbl", GNAME[k], "start").style.fill = GCOL[k];
    box(wG, 436, y, c.w * 300, 18, GCOL[k], "none", 4);
    txt(wG, 436 + c.w * 300 + 8, y + 14, "mono", c.w.toFixed(2), "start");
  });
  txt(wG, 515, 128, "note", "0.30 + 0.45 + 0.25 = 1", "middle");
  var plusG = el("g", {}, svg);
  txt(plusG, 320, 346, "mono", "overall = π_A·A + π_B·B + π_C·C", "middle");
  var ideaG = el("g", {}, svg);
  [["Several components", "each explains one clump", "fillA"], ["Weighted sum", "weights add up to 1", "fillG"], ["Several peaks", "like the real data", "fillB"]].forEach(function (c, k) {
    var x = 16 + k * 208;
    card(ideaG, x, 80, 192, 120, c[2]);
    txt(ideaG, x + 96, 128, "lbl lbl-y", c[0], "middle");
    txt(ideaG, x + 96, 158, "note", c[1], "middle");
  });
  txt(ideaG, 320, 240, "lbl lbl-y", "components are math, not named customer types", "middle");

  function render(index, id) {
    var i = index;
    show(axG, i <= 7);
    dots.forEach(function (d) { show(d, i <= 7); });
    show(singleCurve, i === 1); show(singleLbl, i === 1); show(valley, i === 1); show(valLbl, i === 1); show(valLbl2, i === 1);
    compAreas.forEach(function (a, k) { var vis = (i >= 2 + k && i <= 7); a.setAttribute("opacity", vis ? "1" : "0"); compCurves[k].setAttribute("opacity", vis ? (i === 7 ? "0.45" : "1") : "0"); compLbls[k].setAttribute("opacity", (i >= 2 + k && i <= 6) ? "1" : "0"); });
    show(wG, i === 5); show(plusG, i === 6 || i === 7);
    show(sumCurve, i >= 6 && i <= 7); show(sumArea, i === 7);
    show(ideaG, i === 8);
  }
