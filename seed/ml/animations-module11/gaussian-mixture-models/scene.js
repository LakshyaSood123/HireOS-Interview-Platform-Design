  var steps = [
    { id: "dataset", label: "The overlapping customers", caption: "Customers described by purchases per month and average spend. The groups overlap, so some customers sit between groups." },
    { id: "component-center", label: "A component's mean", caption: "A Gaussian mixture is built from Gaussian components. Each has a mean: the center of its cloud of customers (the cross)." },
    { id: "component-spread", label: "A component's spread", caption: "Each component also has a spread. In two dimensions the covariance gives the cloud its size, shape and orientation: here a wide, flat ellipse." },
    { id: "component-weight", label: "A component's weight", caption: "And a mixing weight: the share of customers the component accounts for. Together the weights add up to 1." },
    { id: "three-gaussians", label: "Three Gaussian components", caption: "Three components A, B and C, each with its own mean, spread and weight. Points are colored by blending the components that explain them." },
    { id: "overlap", label: "Where components overlap", caption: "Between B and C the clouds overlap. A customer in the overlap is plausible under both components, which a hard method cannot express." },
    { id: "combine-density", label: "Combine into one density", caption: "Now one feature only: spend. The weighted components (A at 2, B at 5, C at 8) add up to a single mixture density with three peaks." },
    { id: "new-point", label: "A new customer", caption: "A new customer at spend 3.5. A contributes 0.0258, B contributes 0.0583 and C almost nothing: the mixture density is 0.0841." },
    { id: "gmm-view", label: "The GMM view", caption: "A GMM describes the data by components with a mean, a spread and a weight. Unlike a K-Means centroid, each component also says how wide it is and how large." }
  ];

  var HIST = runEM2(GP, GINIT, 14);
  var FC = HIST[HIST.length - 1].comps, FR = HIST[HIST.length - 1].R;
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 44, 330, 34, 29, 10, 10);
  var dots = ptDots(svg, G, GP, 6);
  var ells = FC.map(function (c, k) { var e = compEllipse(svg, GCOL[k]); setCompEllipse(e, G, c, 1.5); return e; });
  var ells2 = FC.map(function (c, k) { var e = el("ellipse", { fill: "none", stroke: GCOL[k], "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg); setCompEllipse(e, G, c, 2.5); return e; });
  var cross = FC.map(function (c, k) {
    var g2 = el("g", {}, svg);
    el("line", { x1: -9, y1: -9, x2: 9, y2: 9, stroke: GCOL[k], "stroke-width": 5 }, g2);
    el("line", { x1: -9, y1: 9, x2: 9, y2: -9, stroke: GCOL[k], "stroke-width": 5 }, g2);
    g2.setAttribute("transform", "translate(" + G.x(c.mx) + "," + G.y(c.my) + ")");
    return g2;
  });
  var cLbl = txt(svg, G.x(FC[1].mx) + 14, G.y(FC[1].my) - 14, "lbl lbl-y", "mean (center)", "start");
  var sLbl = txt(svg, G.x(FC[1].mx), G.y(FC[1].my) - FC[1].sy * 2.2 * G.sy - 14, "lbl lbl-y", "spread (covariance)", "middle");
  var overlapRing = el("circle", { cx: G.x(6.3), cy: G.y(5.6), r: 48, fill: "none", stroke: "#e6f5ec", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  var overlapLbl = txt(svg, G.x(6.3), G.y(5.6) + 66, "lbl", "overlap: plausible under B and C", "middle");
  var wG = el("g", {}, svg);
  card(wG, 410, 50, 220, 150, "fillA");
  txt(wG, 520, 84, "lbl lbl-y", "mixing weights", "middle");
  FC.forEach(function (c, k) {
    var y = 98 + k * 28;
    txt(wG, 424, y + 14, "lbl", GNAME[k], "start").style.fill = GCOL[k];
    box(wG, 446, y, c.w * 250, 20, GCOL[k], "none", 4);
    txt(wG, 446 + c.w * 250 + 8, y + 15, "mono", f2(c.w), "start");
  });
  txt(wG, 520, 190, "note", "weights add up to 1", "middle");

  // 1D view (steps 6-7).
  var oneG = el("g", {}, svg);
  var g1 = makeGraph(50, 290, 54, 1100);
  densAxes(oneG, g1, 0.2, [0.05, 0.10, 0.15]);
  MIX3.forEach(function (c, k) {
    areaPath(oneG, g1, function (x) { return c.w * gpdf(x, c.m, c.s); }, GCOL[k], 0.28);
    curvePath(oneG, g1, function (x) { return c.w * gpdf(x, c.m, c.s); }, GCOL[k], 3);
  });
  curvePath(oneG, g1, function (x) { return mixPdf(x, MIX3); }, "#e6f5ec", 5);
  txt(oneG, g1.x(0) + 4, 40, "note", "density (spend only)", "start");
  txt(oneG, 320, 346, "mono", "mixture = π_A·A + π_B·B + π_C·C", "middle");
  var newG = el("g", {}, svg);
  el("line", { x1: g1.x(3.5), y1: g1.y(0), x2: g1.x(3.5), y2: 60, stroke: "#e6f5ec", "stroke-width": 3, "stroke-dasharray": "6 4" }, newG);
  txt(newG, g1.x(3.5), 54, "lbl", "new customer: spend 3.5", "middle");
  var cv = MIX3.map(function (c) { return c.w * gpdf(3.5, c.m, c.s); });
  card(newG, 420, 36, 210, 112, "fillB");
  [["A", cv[0]], ["B", cv[1]], ["C", cv[2]]].forEach(function (r, k) {
    var y = 46 + k * 24;
    txt(newG, 434, y + 14, "lbl", r[0], "start").style.fill = GCOL[k];
    box(newG, 456, y, Math.max(2, r[1] * 1800), 18, GCOL[k], "none", 4);
    txt(newG, 456 + Math.max(2, r[1] * 1800) + 8, y + 14, "mono", r[1].toFixed(4), "start");
  });
  txt(newG, 525, 138, "mono", "total  " + (cv[0] + cv[1] + cv[2]).toFixed(4), "middle");
  var viewG = el("g", {}, svg);
  [["mean", "the center", "fillA"], ["spread", "size and shape", "fillG"], ["weight", "share of the data", "fillB"]].forEach(function (c, k) {
    card(viewG, 410, 56 + k * 60, 220, 50, c[2]);
    txt(viewG, 520, 78 + k * 60, "lbl lbl-y", c[0], "middle");
    txt(viewG, 520, 96 + k * 60, "note", c[1], "middle");
  });

  function render(index, id) {
    var i = index;
    var twoD = i <= 5 || i === 8;
    show(plotG, twoD); dots.forEach(function (d) { show(d, twoD); });
    ells.forEach(function (e, k) { show(e, (i === 2 && k === 1) || i === 4 || i === 5 || i === 8); });
    ells2.forEach(function (e, k) { show(e, i === 4 || i === 5 || i === 8); });
    cross.forEach(function (c, k) { show(c, (i === 1 && k === 1) || (i >= 3 && i <= 5) || i === 8); });
    show(cLbl, i === 1); show(sLbl, i === 2);
    show(overlapRing, i === 5); show(overlapLbl, i === 5);
    show(wG, i === 3);
    show(oneG, i === 6 || i === 7); show(newG, i === 7);
    show(viewG, i === 8);
    dots.forEach(function (d, k) { d.setAttribute("fill", i >= 4 && twoD ? blendColor(FR[k]) : C_GRAY); });
    if (i === 1) { var c1 = FC[1]; dots.forEach(function (d) { d.setAttribute("opacity", "1"); }); }
  }
