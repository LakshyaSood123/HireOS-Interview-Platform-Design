  var steps = [
    { id: "two-points", label: "Two customers", caption: "To group similar customers we must compare them. Take two customers: P = (1, 2) and Q = (2, 2.5)." },
    { id: "coordinate-differences", label: "Coordinate differences", caption: "They differ by 1.0 in purchases per month (horizontal leg) and by 0.5 in average spend (vertical leg)." },
    { id: "distance-line", label: "The straight-line distance", caption: "The straight line from P to Q is the Euclidean distance: d = sqrt(1.0² + 0.5²) = 1.118." },
    { id: "near-point", label: "A near point", caption: "Q is close to P: a small distance means the customers are alike." },
    { id: "far-point", label: "A far point", caption: "R = (6, 6) is far from P: d = sqrt(5² + 4²) = 6.403. A large distance means the customers are different." },
    { id: "nearest-neighbor", label: "The nearest neighbor", caption: "Comparing P with all eleven others, the nearest is (1.5, 1.8) at distance 0.539. Nearest-point comparisons are the basis of K-Means." },
    { id: "two-features", label: "Features with different scales", caption: "Now suppose the features are income (dollars) and purchases per month. A = (50000, 2), B = (50100, 10) and C = (58000, 2.5)." },
    { id: "scale-problem", label: "The scale problem", caption: "Raw distance says A is far closer to B (100.3) than to C (8000), although B buys five times as often. Income's big numbers dominate. After scaling each feature to a comparable spread, A is closer to C (0.81) than to B (2.0)." },
    { id: "distance-meaning", label: "Distance is a modeling choice", caption: "Distance turns similarity into a number, but it is a choice. Euclidean distance is common, not required, and different scalings or measures can produce different groups." }
  ];

  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 40, 30, 10, 10);
  var P = [1, 2], Q = [2, 2.5], R = [6, 6], NN = [1.5, 1.8];
  var dots = ptDots(plotG, G, CPTS, 7);
  var legG = el("g", {}, svg);
  function pointLabel(pt, str, dx, dy) { return txt(legG, G.x(pt[0]) + dx, G.y(pt[1]) + dy, "lbl lbl-y", str, "middle"); }
  var lP = pointLabel(P, "P", -14, 4), lQ = pointLabel(Q, "Q", 14, -8), lR = pointLabel(R, "R", 14, -8);
  var leg1 = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  var leg2 = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  var lblDx = txt(svg, G.x(1.5), G.y(2) + 18, "lbl lbl-y", "Δx = 1.0", "middle");
  var lblDy = txt(svg, G.x(2) + 12, G.y(2.25), "lbl lbl-y", "Δy = 0.5", "start");
  var hyp = el("line", { stroke: "#1db584", "stroke-width": 4, "stroke-linecap": "round" }, svg);
  var farLine = el("line", { stroke: C_BAD, "stroke-width": 3, "stroke-linecap": "round" }, svg);
  var nnRing = el("circle", { cx: G.x(NN[0]), cy: G.y(NN[1]), r: 14, fill: "none", stroke: "#1db584", "stroke-width": 3 }, svg);
  var nnLine = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-dasharray": "5 3" }, svg);
  var otherLines = CPTS.map(function () { return el("line", { stroke: "rgba(201,220,207,0.35)", "stroke-width": 1.5 }, svg); });
  setLine(leg1, G.x(P[0]), G.y(P[1]), G.x(Q[0]), G.y(P[1]));
  setLine(leg2, G.x(Q[0]), G.y(P[1]), G.x(Q[0]), G.y(Q[1]));
  setLine(hyp, G.x(P[0]), G.y(P[1]), G.x(Q[0]), G.y(Q[1]));
  setLine(farLine, G.x(P[0]), G.y(P[1]), G.x(R[0]), G.y(R[1]));
  setLine(nnLine, G.x(P[0]), G.y(P[1]), G.x(NN[0]), G.y(NN[1]));
  CPTS.forEach(function (c, k) { setLine(otherLines[k], G.x(P[0]), G.y(P[1]), G.x(c[0]), G.y(c[1])); });

  var panel = el("g", {}, svg);
  card(panel, 424, 60, 206, 170, "fillG");
  var pa = txt(panel, 527, 92, "lbl lbl-y", "", "middle");
  var pb = txt(panel, 527, 128, "mono", "", "middle");
  var pc = txt(panel, 527, 160, "mono", "", "middle");
  var pd = txt(panel, 527, 196, "big", "", "middle");
  var formula = txt(svg, 527, 260, "mono", "d = √((a₁−b₁)² + (a₂−b₂)²)", "middle");

  var custG = el("g", {}, svg);
  card(custG, 30, 40, 580, 170, "fillA");
  ["customer", "income", "purchases / month"].forEach(function (h, c) { txt(custG, [110, 270, 470][c], 70, "lbl lbl-y", h, "middle"); });
  [["A", "50000", "2"], ["B", "50100", "10"], ["C", "58000", "2.5"]].forEach(function (r, k) {
    box(custG, 50, 88 + k * 38, 540, 30, "rgba(255,255,255,0.05)", "none", 6);
    [r[0], r[1], r[2]].forEach(function (s, c) { txt(custG, [110, 270, 470][c], 110 + k * 38, "big", s, "middle"); });
  });
  var scaleG = el("g", {}, svg);
  card(scaleG, 30, 214, 580, 130, "fillB");
  txt(scaleG, 170, 240, "lbl lbl-y", "raw distance", "middle");
  txt(scaleG, 470, 240, "lbl lbl-g", "after scaling both features", "middle");
  txt(scaleG, 170, 272, "mono", "A to B   100.3", "middle");
  txt(scaleG, 170, 300, "mono", "A to C  8000.0", "middle");
  txt(scaleG, 170, 328, "note", "income dominates: B looks closest", "middle");
  txt(scaleG, 470, 272, "mono", "A to B   2.00", "middle");
  txt(scaleG, 470, 300, "mono", "A to C   0.81", "middle");
  txt(scaleG, 470, 328, "note", "behavior counts: C is closest", "middle");
  var meanG = el("g", {}, svg);
  [["Similarity → number", "distance turns 'alike' into a value", "fillA"], ["Scale matters", "rescale features before comparing", "fillG"], ["A modeling choice", "other measures give other groups", "fillB"]].forEach(function (c, k) {
    var x = 16 + k * 208;
    card(meanG, x, 90, 192, 140, c[2]);
    txt(meanG, x + 96, 136, "lbl lbl-y", c[0], "middle");
    txt(meanG, x + 96, 176, "note", c[1], "middle");
  });

  function setPanel(a, b, c, d) { pa.textContent = a; pb.textContent = b; pc.textContent = c; pd.textContent = d || ""; }
  function render(index, id) {
    var i = index;
    show(plotG, i <= 5); show(legG, i <= 5);
    show(panel, i >= 1 && i <= 5); show(formula, i === 2);
    show(custG, i === 6 || i === 7); show(scaleG, i === 7); show(meanG, i === 8);
    dots.forEach(function (d, k) {
      var c = CPTS[k];
      var keep = i === 0 || i === 1 || i === 2 ? (c[0] === P[0] && c[1] === P[1]) || (c[0] === Q[0] && c[1] === Q[1]) : true;
      d.setAttribute("opacity", keep ? "1" : "0.2");
      var isP = c[0] === P[0] && c[1] === P[1], isQ = c[0] === Q[0] && c[1] === Q[1], isR = c[0] === R[0] && c[1] === R[1];
      d.setAttribute("fill", isP ? "#e2b44a" : (isQ && i <= 3) ? "#38bdf8" : (isR && i === 4) ? C_BAD : C_GRAY);
    });
    show(lQ, i <= 3); show(lR, i === 4); show(lP, true);
    show(leg1, i === 1); show(leg2, i === 1); show(lblDx, i === 1); show(lblDy, i === 1);
    show(hyp, i >= 2 && i <= 3);
    show(farLine, i === 4);
    show(nnRing, i === 5); show(nnLine, i === 5);
    otherLines.forEach(function (l, k) { show(l, i === 5 && !(CPTS[k][0] === P[0] && CPTS[k][1] === P[1])); });
    if (i === 1) setPanel("differences", "Δx = 2 − 1 = 1.0", "Δy = 2.5 − 2 = 0.5", "");
    if (i === 2) setPanel("distance PQ", "√(1.0² + 0.5²)", "= √1.25", "1.118");
    if (i === 3) setPanel("P and Q", "small distance", "→ similar", "1.118");
    if (i === 4) setPanel("P and R", "large distance", "→ different", "6.403");
    if (i === 5) setPanel("nearest to P", "(1.5, 1.8)", "distance", "0.539");
  }
