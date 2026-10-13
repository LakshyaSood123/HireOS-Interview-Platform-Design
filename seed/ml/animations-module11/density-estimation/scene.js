  var steps = [
    { id: "observed-points", label: "Observed customers", caption: "Density estimation asks: where does the data tend to occur? Here are 16 customers, each with an average monthly spend." },
    { id: "number-line", label: "Put them on a number line", caption: "On a number line the values are not spread evenly. They crowd together around 2, around 5 and around 8, with thin stretches in between." },
    { id: "histogram-view", label: "A histogram", caption: "A histogram counts customers in bins of width 1: 2, 3, 1, 2, 3, 1, 2, 2, 0 for the bins 1 to 2 up to 9 to 10. The bar heights show where the data is concentrated, but the edges are arbitrary." },
    { id: "smooth-curve", label: "A smooth density curve", caption: "Put a small bump on every observation and add the bumps up. The result is a smooth density curve with no bin edges." },
    { id: "high-density-region", label: "A high-density region", caption: "Near spend 5 the bumps overlap and the curve is high: observations here are common." },
    { id: "low-density-region", label: "A low-density region", caption: "Near spend 10 the curve is almost flat: observations here are rare." },
    { id: "new-point", label: "A new customer", caption: "A new customer arrives at spend 5. We can ask how typical that is under the density." },
    { id: "relative-plausibility", label: "Relative plausibility", caption: "The density is 0.159 at spend 5 and 0.013 at spend 10. A customer at 5 is far more typical than one at 10. This compares places; it is not the probability of an exact value." },
    { id: "density-takeaway", label: "What density means", caption: "Higher density means observations near that region are more plausible under the model. For continuous data, density at one value is not the probability of that exact value." }
  ];

  var g1 = makeGraph(60, 290, 52, 1100);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.2, [0.05, 0.10, 0.15]);
  txt(axG, g1.x(0) + 4, 40, "note", "density", "start");
  var KB = 0.7;
  function kdeF(x) { var t = 0; SPEND.forEach(function (xi) { t += gpdf(x, xi, KB); }); return t / SPEND.length; }
  var histG = el("g", {}, svg);
  var HC = [2, 3, 1, 2, 3, 1, 2, 2, 0];
  HC.forEach(function (c, i) {
    var h = c / SPEND.length * 1100;
    box(histG, g1.x(i + 1) + 2, g1.y(0) - h, g1.sx - 4, h, "rgba(56,189,248,0.35)", "#38bdf8", 2);
    if (c > 0) txt(histG, g1.x(i + 1) + g1.sx / 2, g1.y(0) - h - 4, "tick", String(c), "middle");
  });
  var bumpG = el("g", {}, svg);
  SPEND.forEach(function (xi) { curvePath(bumpG, g1, function (x) { return gpdf(x, xi, KB) / SPEND.length; }, "rgba(226,180,74,0.5)", 1.5); });
  var kdeCurve = curvePath(svg, g1, kdeF, "#e2b44a", 4);
  var kdeArea = areaPath(svg, g1, kdeF, "#e2b44a", 0.12);
  var dots = SPEND.map(function (x, i) { return el("circle", { cx: g1.x(x), cy: g1.y(0) - 6 - (i % 2) * 14, r: 6, fill: C_HAM, stroke: "#071510", "stroke-width": 2 }, svg); });
  var hiBand = box(svg, g1.x(4.2), 60, g1.sx * 1.6, g1.y(0) - 60, "rgba(29,181,132,0.16)", C_OK, 6);
  var hiLbl = txt(svg, g1.x(5), 70, "lbl lbl-g", "high density", "middle");
  var loBand = box(svg, g1.x(9.2), 60, g1.sx * 0.8, g1.y(0) - 60, "rgba(248,113,113,0.14)", C_BAD, 6);
  var loLbl = txt(svg, g1.x(9.6), 70, "lbl lbl-r", "low density", "middle");
  var m5 = el("circle", { cx: g1.x(5), cy: g1.y(kdeF(5)), r: 9, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, svg);
  var m5l = txt(svg, g1.x(5) + 14, g1.y(kdeF(5)) - 10, "lbl", "new customer: 0.159", "start");
  var m10 = el("circle", { cx: g1.x(10), cy: g1.y(kdeF(10)), r: 9, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, svg);
  var m10l = txt(svg, g1.x(10) - 12, g1.y(kdeF(10)) - 14, "lbl", "spend 10: 0.013", "end");
  var takeG = el("g", {}, svg);
  [["Density", "where data tends to occur", "fillA"], ["Higher = more typical", "relative plausibility", "fillG"], ["Not a probability", "of one exact value", "fillB"]].forEach(function (c, k) {
    var x = 16 + k * 208;
    card(takeG, x, 70, 192, 120, c[2]);
    txt(takeG, x + 96, 118, "lbl lbl-y", c[0], "middle");
    txt(takeG, x + 96, 150, "note", c[1], "middle");
  });

  function render(index, id) {
    var i = index;
    show(axG, i >= 1 && i <= 7);
    dots.forEach(function (d) { show(d, i <= 7); });
    show(histG, i === 2);
    show(bumpG, i === 3); show(kdeCurve, i >= 3 && i <= 7); show(kdeArea, i >= 3 && i <= 7);
    show(hiBand, i === 4); show(hiLbl, i === 4); show(loBand, i === 5); show(loLbl, i === 5);
    show(m5, i >= 6 && i <= 7); show(m5l, i >= 6 && i <= 7);
    show(m10, i === 7); show(m10l, i === 7);
    show(takeG, i === 8);
    dots.forEach(function (d, k) { d.setAttribute("cy", (i === 0 ? 150 + (k % 4) * 30 : g1.y(0) - 6 - (k % 2) * 14)); d.setAttribute("cx", i === 0 ? 80 + (k % 8) * 70 : g1.x(SPEND[k])); });
    if (i === 0) dots.forEach(function (d, k) { d.setAttribute("cy", 110 + Math.floor(k / 8) * 50); });
  }
