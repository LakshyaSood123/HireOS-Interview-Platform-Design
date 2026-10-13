  var steps = [
    { id: "fixed-responsibilities", label: "The responsibilities are fixed", caption: "M-step: the responsibilities from the E-step are now fixed. Ten customers, each with a share of responsibility for component A and for B. The parameters will change." },
    { id: "select-component", label: "Refit component A", caption: "Start with component A. Which customers should shape its new mean, and by how much?" },
    { id: "point-weights", label: "Responsibility = weight", caption: "Every customer contributes to A, weighted by its responsibility for A: customers at 1.5 and 2.0 weigh about 0.97 and 0.96, the customer at 4.5 weighs 0.35, and customers above 6 weigh almost nothing." },
    { id: "weighted-points", label: "Weighted points", caption: "The circle sizes show the weights: heavy points pull the new mean, light points hardly matter." },
    { id: "weighted-sum", label: "The weighted sum", caption: "Total responsibility N_A = 4.083. The weighted mean is the sum of r_iA × x_i divided by N_A." },
    { id: "update-mean", label: "Update the mean", caption: "New mean of A: 2.631 (it was 3). It moved toward the customers that A explains best." },
    { id: "update-spread", label: "Update the spread", caption: "The spread uses the same weights: σ_A = 0.998. The component stays about as wide as before." },
    { id: "update-mixture-weight", label: "Update the mixing weight", caption: "The mixing weight is the share of total responsibility: π_A = 4.083 / 10 = 0.408." },
    { id: "all-components-updated", label: "Both components updated", caption: "Component B is refitted the same way: weight 0.592, mean 6.314, spread 1.501. A: weight 0.408, mean 2.631, spread 0.998." },
    { id: "m-step-summary", label: "What changed and what did not", caption: "In the M-step the responsibilities stayed fixed while the means, spreads and weights moved. K-Means averages only assigned points; the GMM weights every point by its responsibility." }
  ];

  var RA = P10.map(function (x) { return resp1(x, TWO).r; });
  var NEW = mstep1(P10, RA);
  var g1 = makeGraph(40, 250, 32, 900);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.2, [0.05, 0.10, 0.15]);
  var fOld = [0, 1].map(function (k) { return function (x) { return TWO[k].w * gpdf(x, TWO[k].m, TWO[k].s); }; });
  var fNew = [0, 1].map(function (k) { return function (x) { return NEW[k].w * gpdf(x, NEW[k].m, NEW[k].s); }; });
  var oldG = el("g", {}, svg);
  [0, 1].forEach(function (k) { curvePath(oldG, g1, fOld[k], GCOL[k], 2, "6 4"); });
  var newG = el("g", {}, svg);
  [0, 1].forEach(function (k) { areaPath(newG, g1, fNew[k], GCOL[k], 0.3); curvePath(newG, g1, fNew[k], GCOL[k], 3); });
  var lock = el("g", {}, svg);
  chip(lock, 60, 36, 290, 30, "responsibilities FIXED in the M-step", "rgba(167,139,250,0.25)", "#a78bfa", "lbl");
  var dots = P10.map(function (x) { return el("circle", { cx: g1.x(x), cy: g1.y(0) - 12, r: 8, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 2 }, svg); });
  var wlab = P10.map(function (x, i) { return txt(svg, g1.x(x), g1.y(0) + 40 + (i % 2) * 12, "tick", f2(RA[i][0]), "middle"); });
  var meanOld = el("line", { x1: g1.x(3), y1: g1.y(0), x2: g1.x(3), y2: 90, stroke: GCOL[0], "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
  var meanNew = el("line", { x1: g1.x(NEW[0].m), y1: g1.y(0), x2: g1.x(NEW[0].m), y2: 90, stroke: GCOL[0], "stroke-width": 4 }, svg);
  var arrowM = arrow(svg, "b", 4); setLine(arrowM, g1.x(3), 96, g1.x(NEW[0].m) + 6, 96);
  var panel = el("g", {}, svg);
  card(panel, 410, 50, 222, 190, "fillG");
  var t1 = txt(panel, 521, 76, "lbl lbl-y", "", "middle");
  var t2 = txt(panel, 521, 118, "mono", "", "middle");
  var t3 = txt(panel, 521, 150, "mono", "", "middle");
  var t4 = txt(panel, 521, 190, "big", "", "middle");
  var t5 = txt(panel, 521, 224, "note", "", "middle");
  var tblG = el("g", {}, svg);
  card(tblG, 30, 288, 580, 62, "fillA");
  ["", "weight", "mean", "spread"].forEach(function (h, c) { txt(tblG, [80, 220, 360, 500][c], 308, "lbl lbl-y", h, "middle"); });
  [["A", 0], ["B", 1]].forEach(function (r) {
    var k = r[1], y = 326 + k * 16;
    txt(tblG, 80, y, "lbl", r[0], "middle").style.fill = GCOL[k];
    [TWO[k].w.toFixed(2) + " → " + NEW[k].w.toFixed(2), TWO[k].m.toFixed(2) + " → " + NEW[k].m.toFixed(2), TWO[k].s.toFixed(2) + " → " + NEW[k].s.toFixed(2)].forEach(function (s, c) {
      txt(tblG, [220, 360, 500][c], y, "mono", s, "middle").setAttribute("font-size", "11");
    });
  });

  function setPanel(a, b, c, d, e) { t1.textContent = a; t2.textContent = b; t3.textContent = c; t4.textContent = d || ""; t5.textContent = e || ""; }
  function render(index, id) {
    var i = index;
    show(oldG, i <= 8); show(newG, i >= 8 && i <= 9);
    show(lock, i <= 9);
    dots.forEach(function (d, k) {
      show(d, i <= 8);
      d.setAttribute("r", i >= 2 ? 4 + RA[k][0] * 11 : 8);
      d.setAttribute("fill", i >= 1 && i <= 8 ? GCOL[0] : "#e6f5ec");
      d.setAttribute("fill-opacity", i >= 2 ? String(0.25 + 0.75 * RA[k][0]) : "1");
    });
    wlab.forEach(function (t) { show(t, i >= 2 && i <= 4); });
    show(meanOld, i >= 5 && i <= 7); show(meanNew, i >= 5 && i <= 7); show(arrowM, i >= 5 && i <= 7);
    show(panel, i >= 4 && i <= 9);
    show(tblG, i >= 8);
    if (i === 4) setPanel("weighted sum", "N_A = Σ r_iA = 4.083", "Σ r_iA·x_i / N_A", "", "every point counts by its weight");
    if (i === 5) setPanel("new mean of A", "old  3.000", "new  " + NEW[0].m.toFixed(3), "μ_A = 2.631", "");
    if (i === 6) setPanel("new spread of A", "Σ r_iA (x_i − μ_A)² / N_A", "", "σ_A = " + NEW[0].s.toFixed(3), "same weights");
    if (i === 7) setPanel("new weight of A", "π_A = N_A / N", "= 4.083 / 10", "0.408", "share of total responsibility");
    if (i === 8) setPanel("both refitted", "A: π .408  μ 2.631  σ .998", "B: π .592  μ 6.314  σ 1.501", "", "dashed = before, solid = after");
    if (i === 9) setPanel("M-step summary", "responsibilities: FIXED", "parameters: UPDATED", "", "weights every point by r");
  }
