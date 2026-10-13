  var steps = [
    {"id": "covariance-matrix", "label": "Covariance matrix", "caption": "Start from the symmetric covariance matrix S = [[3.50, 2.90], [2.90, 2.70]]. The dashed circle holds unit directions."},
    {"id": "candidate-directions", "label": "Candidate directions", "caption": "For most directions v (blue), S v (pink) points somewhere else. The pink curve is the shape S turns the circle into."},
    {"id": "eigenvector-one", "label": "Eigenvector one", "caption": "For one special direction, S v stays on the same line as v: only the length changes. That is eigenvector 1."},
    {"id": "eigenvalue-one", "label": "Eigenvalue one", "caption": "S v1 = 6.03 v1. The stretch factor, the eigenvalue, is also the variance along v1."},
    {"id": "eigenvector-two", "label": "Eigenvector two", "caption": "A second special direction, perpendicular to the first, is eigenvector 2: S v2 stays on the same line as v2."},
    {"id": "eigenvalue-two", "label": "Eigenvalue two", "caption": "S v2 = 0.17 v2: a much smaller stretch, and a much smaller variance."},
    {"id": "sort-eigenvalues", "label": "Sort", "caption": "Sort the eigenvalues from largest to smallest and keep the eigenvectors in the same order."},
    {"id": "pc1", "label": "PC1", "caption": "The eigenvector with the largest eigenvalue is the first principal component. It carries 97.2% of the variance."},
    {"id": "pc2", "label": "PC2", "caption": "The eigenvector with the next eigenvalue is PC2. It carries the remaining 2.8%."},
    {"id": "eigen-interpretation", "label": "Meaning", "caption": "An eigenvector is a direction; its eigenvalue is the variance along it. The eigenvalues add up to the total variance, and -v1 is the same axis as v1."}
  ];

  var EP = makePlane(215, 200, 30);
  function Sv(v) { return [DSXX * v[0] + DSXY * v[1], DSXY * v[0] + DSYY * v[1]]; }
  frameAxes(svg, EP, 6.2, 4.2);
  var circ = el("circle", { cx: EP.x(0), cy: EP.y(0), r: 30, fill: "none", stroke: "rgba(201,220,207,0.8)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
  var ellPts = [];
  for (var th = 0; th <= 360; th += 5) { var sv = Sv(dirOf(th)); ellPts.push(EP.pt(sv)); }
  var ell = el("polyline", { points: ellPts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), fill: "rgba(244,114,182,0.08)", stroke: "#f472b6", "stroke-width": 1.5 }, svg);
  var cand = [20, 75, 130].map(function (t) {
    var v = dirOf(t), w = Sv(v), g = el("g", {}, svg);
    var a = arrow(g, "b", 3), b = arrow(g, "p", 3);
    setArrow(a, EP, v, 1); setArrow(b, EP, w, 1);
    return g;
  });
  var gE1 = el("g", {}, svg), gE2 = el("g", {}, svg);
  var sa1 = arrow(gE1, "p", 3), va1 = arrow(gE1, "y", 4);
  setArrow(sa1, EP, DV1, DL1); setArrow(va1, EP, DV1, 1);
  var sa2 = arrow(gE2, "p", 3), va2 = arrow(gE2, "b", 4);
  setArrow(sa2, EP, DV2, DL2); setArrow(va2, EP, DV2, 1);
  var neg = dirLine(svg, EP, "#c9dccf", 1.5, true);
  setDir(neg, EP, DV1, 5.6);
  var lab = el("g", {}, svg);
  var lSv1 = txt(lab, EP.x(DL1 * DV1[0]) - 6, EP.y(DL1 * DV1[1]) - 10, "lbl lbl-p", "S v1", "end");
  var lv1 = txt(lab, EP.x(DV1[0]) + 8, EP.y(DV1[1]) + 22, "lbl lbl-y", "v1", "start");
  var lSv2 = txt(lab, EP.x(DL2 * DV2[0]) - 8, EP.y(DL2 * DV2[1]) - 6, "lbl lbl-p", "S v2", "end");
  var lv2 = txt(lab, EP.x(DV2[0]) - 8, EP.y(DV2[1]) - 8, "lbl lbl-b", "v2", "end");
  var mg = el("g", {}, svg);
  card(mg, 410, 56, 222, 150, "fillA");
  txt(mg, 521, 80, "lbl lbl-y", "covariance matrix S", "middle");
  matGrid(mg, 440, 94, 2, 2, 88, 50, [[f2(DSXX), f2(DSXY)], [f2(DSXY), f2(DSYY)]]);
  var panel = el("g", {}, svg);
  card(panel, 410, 56, 222, 170, "fillG");
  var q1 = txt(panel, 521, 84, "lbl lbl-y", "", "middle");
  var q2 = txt(panel, 521, 118, "big", "", "middle");
  var q3 = txt(panel, 521, 148, "note", "", "middle");
  var q4 = txt(panel, 521, 170, "note", "", "middle");
  var q5 = txt(panel, 521, 192, "note", "", "middle");
  var bars = el("g", {}, svg);
  card(bars, 410, 56, 222, 170, "fillB");
  txt(bars, 521, 80, "lbl lbl-y", "eigenvalues, sorted", "middle");
  box(bars, 424, 100, DL1 * 22, 20, C_PC1, "none", 4); txt(bars, 424 + DL1 * 22 + 8, 116, "mono", f2(DL1), "start"); txt(bars, 424, 138, "note", "λ1 → PC1", "start");
  box(bars, 424, 156, Math.max(4, DL2 * 22), 20, C_PC2, "none", 4); txt(bars, 424 + Math.max(4, DL2 * 22) + 8, 172, "mono", f2(DL2), "start"); txt(bars, 424, 194, "note", "λ2 → PC2", "start");
  txt(bars, 521, 216, "note", "sum = " + f2(DL1 + DL2) + " = total variance", "middle");
  function setPanel(a, b, c, d, e) { q1.textContent = a; q2.textContent = b; q3.textContent = c || ""; q4.textContent = d || ""; q5.textContent = e || ""; }
  function render(i) {
    show(circ, true); show(ell, i >= 0);
    cand.forEach(function (g) { show(g, i === 1); });
    show(gE1, i >= 2 && i <= 3 || i === 6 || i === 7 || i === 9); show(gE2, i >= 4 && i <= 6 || i === 8 || i === 9);
    show(neg, i === 9);
    show(lSv1, i === 3 || i === 2); show(lv1, i >= 2 && i <= 3 || i === 7 || i === 9);
    show(lSv2, i === 4 || i === 5); show(lv2, i >= 4 && i <= 5 || i === 8 || i === 9);
    show(mg, i === 0); show(panel, i === 1 || (i >= 2 && i <= 5) || i === 7 || i === 8 || i === 9); show(bars, i === 6);
    ell.setAttribute("opacity", i === 0 || i === 1 ? "0.5" : "1");
    if (i === 1) setPanel("most directions turn", "S v ≠ λ v", "blue: unit direction v", "pink: S v, pointing elsewhere", "");
    if (i === 2) setPanel("eigenvector 1", "S v1 ∥ v1", "S only stretches v1:", "pink and yellow share a line", "v1 = (" + f3(DV1[0]) + ", " + f3(DV1[1]) + ")");
    if (i === 3) setPanel("eigenvalue 1", "λ1 = " + f2(DL1), "S v1 = " + f2(DL1) + " × v1", "stretch factor = variance", "along v1");
    if (i === 4) setPanel("eigenvector 2", "S v2 ∥ v2", "v2 = (" + s3(DV2[0]) + ", " + f3(DV2[1]) + ")", "perpendicular to v1", "");
    if (i === 5) setPanel("eigenvalue 2", "λ2 = " + f2(DL2), "S v2 = " + f2(DL2) + " × v2", "a much smaller stretch", "");
    if (i === 7) setPanel("PC1", "v1, λ1 = " + f2(DL1), "largest eigenvalue:", "first principal component", (DEV1 * 100).toFixed(1) + "% of the variance");
    if (i === 8) setPanel("PC2", "v2, λ2 = " + f2(DL2), "second-largest eigenvalue:", "second principal component", ((1 - DEV1) * 100).toFixed(1) + "% of the variance");
    if (i === 9) setPanel("what to remember", "vector = direction", "eigenvalue = variance there", "−v1 is the same axis (dashed):", "the sign is arbitrary");
  }

  flatCards();
