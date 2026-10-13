  var steps = [
    {"id": "centered-data-matrix", "label": "Centered data matrix", "caption": "Xc has one row per customer and one column per feature, with the means removed. Two routes lead from here to the principal directions."},
    {"id": "covariance-route", "label": "Covariance route", "caption": "Route 1: form S = XcT Xc / (n - 1), a small symmetric matrix."},
    {"id": "eigen-route", "label": "Eigen step", "caption": "Then take the eigen-decomposition of S: eigenvalues 6.03 and 0.17, eigenvectors v1 and v2."},
    {"id": "svd-route", "label": "SVD route", "caption": "Route 2: factor Xc directly as U Sigma Vt, without forming the covariance matrix."},
    {"id": "u-sigma-vt", "label": "U, Sigma, Vt", "caption": "U (6 x 2) holds normalized scores, Sigma (2 x 2) the singular values, Vt (2 x 2) the directions. Multiplying them rebuilds Xc."},
    {"id": "principal-directions", "label": "Rows of Vt", "caption": "The rows of Vt are the principal directions: PC1 = (0.754, 0.657). A whole row can flip sign without changing its axis: here PC2 comes out as (0.657, -0.754), the opposite of the eigenvector v2."},
    {"id": "singular-values", "label": "Singular values", "caption": "Sigma holds 5.49 and 0.93. Squared and divided by n - 1 they give the eigenvalues 6.03 and 0.17."},
    {"id": "same-pc1", "label": "Same PC1", "caption": "Both routes give the same first direction, up to sign, and the same variance."},
    {"id": "compare-methods", "label": "Compare methods", "caption": "PCA is the analysis; SVD is a tool that gets there, and the one libraries prefer because it avoids forming XcT Xc."}
  ];

  function r1(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }
  function flow(parent, x1, x2, y) { var a = arrow(parent, "w", 3); setLine(a, x1, y, x2, y); return a; }
  function pill(parent, x, y, w, h, title, sub, cls) {
    card(parent, x, y, w, h, cls || "fillA");
    txt(parent, x + w / 2, y + h / 2 - (sub ? 4 : -5), "lbl lbl-y", title, "middle");
    if (sub) txt(parent, x + w / 2, y + h / 2 + 14, "note", sub, "middle");
  }
  var XC = DC.map(function (c) { return [r1(c[0]), r1(c[1])]; });
  // Xc grid (shown in steps 0-3)
  var gX = el("g", {}, svg);
  txt(gX, 72, 52, "lbl lbl-y", "Xc  (6 × 2)", "middle");
  matGrid(gX, 24, 62, 6, 2, 48, 26, XC);
  txt(gX, 72, 240, "note", "rows = customers", "middle");
  txt(gX, 72, 256, "note", "columns = usage, spend", "middle");
  txt(gX, 72, 272, "note", "means already removed", "middle");
  var g0 = el("g", {}, svg);
  card(g0, 200, 70, 420, 190, "fillG");
  txt(g0, 410, 106, "big", "Start from the centered data matrix", "middle");
  txt(g0, 410, 140, "note", "Two routes lead to the same principal directions:", "middle");
  txt(g0, 410, 176, "lbl lbl-y", "1. covariance matrix, then eigenvectors", "middle");
  txt(g0, 410, 206, "lbl lbl-b", "2. SVD of Xc, directly", "middle");
  txt(g0, 410, 240, "note", "covariance uses n − 1 = 5 everywhere", "middle");
  var g1 = el("g", {}, svg);
  flow(g1, 150, 214, 150);
  pill(g1, 218, 112, 150, 76, "S = XcᵀXc / (n − 1)", "covariance matrix", "fillG");
  flow(g1, 372, 410, 150);
  matGrid(g1, 424, 108, 2, 2, 94, 40, [[f2(DSXX), f2(DSXY)], [f2(DSXY), f2(DSYY)]]);
  txt(g1, 518, 204, "note", "2 × 2, symmetric", "middle");
  var g2 = el("g", {}, svg);
  flow(g2, 150, 214, 150);
  pill(g2, 218, 112, 150, 76, "eigen-decomposition", "of S", "fillB");
  flow(g2, 372, 410, 150);
  card(g2, 414, 96, 210, 130, "fillA");
  txt(g2, 519, 122, "lbl lbl-y", "eigenvalues", "middle");
  txt(g2, 519, 144, "mono", f2(DL1) + "   " + f2(DL2), "middle");
  txt(g2, 519, 172, "lbl lbl-y", "eigenvectors", "middle");
  txt(g2, 519, 194, "mono", "v1 = (" + f3(DV1[0]) + ", " + f3(DV1[1]) + ")", "middle");
  txt(g2, 519, 214, "mono", "v2 = (" + s3(DV2[0]) + ", " + f3(DV2[1]) + ")", "middle");
  var g3 = el("g", {}, svg);
  flow(g3, 150, 214, 150);
  pill(g3, 218, 112, 150, 76, "SVD of Xc", "no covariance matrix needed", "fillB");
  flow(g3, 372, 410, 150);
  card(g3, 414, 110, 210, 80, "fillA");
  txt(g3, 519, 146, "big", "Xc = U Σ Vᵀ", "middle");
  txt(g3, 519, 172, "note", "a factorization of the data", "middle");
  var g4 = el("g", {}, svg);
  [["U", "6 × 2", "normalized scores", 40, 100], ["Σ", "2 × 2", "singular values", 232, 100], ["Vᵀ", "2 × 2", "rows = directions", 424, 100]].forEach(function (b) {
    card(g4, b[3], b[4], 170, 120, "fillA");
    txt(g4, b[3] + 85, b[4] + 52, "big", b[0], "middle");
    txt(g4, b[3] + 85, b[4] + 76, "mono", b[1], "middle");
    txt(g4, b[3] + 85, b[4] + 100, "note", b[2], "middle");
  });
  txt(g4, 216, 168, "big", "×", "middle"); txt(g4, 408, 168, "big", "×", "middle");
  txt(g4, 320, 262, "lbl lbl-y", "the rows of Vᵀ are the principal directions", "middle");
  var g5 = el("g", {}, svg);
  txt(g5, 320, 62, "lbl lbl-y", "Vᵀ  (2 × 2)", "middle");
  var VT = matGrid(g5, 170, 76, 2, 2, 150, 54, [[f3(DV1[0]), f3(DV1[1])], [s3(-DV2[0]), s3(-DV2[1])]]);
  VT.mark(0, 0, "hl-row"); VT.mark(0, 1, "hl-row"); VT.mark(1, 0, "hl-col"); VT.mark(1, 1, "hl-col");
  txt(g5, 140, 108, "lbl lbl-y", "PC1", "end"); txt(g5, 140, 162, "lbl lbl-b", "PC2", "end");
  txt(g5, 320, 224, "note", "each row is a unit vector: one principal direction", "middle");
  txt(g5, 320, 246, "note", "row 2 is the opposite of the eigenvector v2: the same axis", "middle");
  var g6 = el("g", {}, svg);
  txt(g6, 190, 62, "lbl lbl-y", "Σ  (2 × 2)", "middle");
  var SG = matGrid(g6, 60, 76, 2, 2, 120, 54, [[f2(DSIG1), "0"], ["0", f2(DSIG2)]]);
  SG.mark(0, 0, "hl-row"); SG.mark(1, 1, "hl-col");
  card(g6, 340, 76, 280, 150, "fillG");
  txt(g6, 480, 104, "lbl lbl-y", "variance = σ² / (n − 1)", "middle");
  txt(g6, 480, 142, "mono", f2(DSIG1) + "² / 5 = " + f2(DL1), "middle");
  txt(g6, 480, 172, "mono", f2(DSIG2) + "² / 5 = " + f2(DL2), "middle");
  txt(g6, 480, 206, "note", "the same eigenvalues as before", "middle");
  txt(g6, 190, 250, "note", "singular values, largest first", "middle");
  var g7 = el("g", {}, svg);
  card(g7, 30, 70, 280, 180, "fillB"); card(g7, 330, 70, 280, 180, "fillA");
  txt(g7, 170, 100, "lbl lbl-y", "covariance route", "middle");
  txt(g7, 170, 140, "note", "eigenvector for the largest", "middle");
  txt(g7, 170, 158, "note", "eigenvalue:", "middle");
  txt(g7, 170, 196, "mono", "(" + f3(DV1[0]) + ", " + f3(DV1[1]) + ")", "middle");
  txt(g7, 470, 100, "lbl lbl-y", "SVD route", "middle");
  txt(g7, 470, 140, "note", "first row of Vᵀ:", "middle");
  txt(g7, 470, 196, "mono", "(" + f3(DV1[0]) + ", " + f3(DV1[1]) + ")", "middle");
  txt(g7, 320, 280, "lbl lbl-g", "same direction (the sign may differ between programs)", "middle");
  var g8 = el("g", {}, svg);
  card(g8, 30, 56, 280, 200, "fillB"); card(g8, 330, 56, 280, 200, "fillA");
  txt(g8, 170, 84, "lbl lbl-y", "covariance + eigen", "middle");
  ["builds S = XcᵀXc / (n − 1)", "eigenvectors → directions", "eigenvalues → variances", "clear to explain by hand"].forEach(function (s, k) { txt(g8, 170, 120 + k * 30, "note", s, "middle"); });
  txt(g8, 470, 84, "lbl lbl-y", "SVD of Xc", "middle");
  ["factors Xc directly", "rows of Vᵀ → directions", "σ² / (n − 1) → variances", "numerically preferred"].forEach(function (s, k) { txt(g8, 470, 120 + k * 30, "note", s, "middle"); });
  txt(g8, 320, 290, "lbl lbl-y", "PCA is the analysis · SVD is a tool that gets you there", "middle");
  function render(i) {
    show(gX, i <= 3); show(g0, i === 0); show(g1, i === 1); show(g2, i === 2); show(g3, i === 3);
    show(g4, i === 4); show(g5, i === 5); show(g6, i === 6); show(g7, i === 7); show(g8, i === 8);
  }

  flatCards();
