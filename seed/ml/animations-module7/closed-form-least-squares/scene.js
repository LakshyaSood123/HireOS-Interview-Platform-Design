  var steps = [
    { id: "data", label: "The five houses again", caption: "Same data as before. Instead of walking toward the best line step by step, can we compute it directly?" },
    { id: "feature-matrix", label: "Build the feature matrix X", caption: "Write each house as a row [x, 1]. The column of ones lets the bias b act like any other weight. X has 5 rows and 2 columns." },
    { id: "target-vector", label: "The target vector y", caption: "Stack the prices into a column y = [2.0, 2.8, 3.7, 4.1, 5.2]. We want weights [w, b] with X·[w, b] as close to y as possible." },
    { id: "least-squares-view", label: "Zero gradient gives equations", caption: "At the minimum of the MSE both gradients are zero. That turns into the normal equations (XᵀX)·[w, b] = Xᵀy, a small 2×2 system with plain numbers." },
    { id: "projection", label: "Projection picture", caption: "The columns of X span a flat surface of every prediction a line can make. The best fit is the point of that surface closest to y: its projection. The leftover gap is perpendicular to the surface." },
    { id: "best-coefficients", label: "Solve the 2×2 system", caption: "The determinant is 5 × 22.5 − 10 × 10 = 12.5. Solving gives w = 19.25 ÷ 12.5 = 1.54 and b = 6.0 ÷ 12.5 = 0.48, with no learning rate and no loop." },
    { id: "fitted-line", label: "The fitted line", caption: "The line ŷ = 1.54x + 0.48 has MSE 0.0166, exactly where gradient descent ended up." },
    { id: "gradient-vs-closed-form", label: "Gradient descent vs closed form", caption: "They minimize the same MSE, so they agree here. Closed form is exact and has no learning rate; gradient descent scales to huge data and models with no closed form. Neither is universally better." }
  ];

  var plotG = el("g", {}, svg);
  var g = housePlot(plotG, 46, 318, 84, 44, 3.8, 6.4);
  clipTo("plotclip", 46, 30, 330, 292);
  var fitLine = el("path", { class: "curve-g", d: wbPath(g, 1.54, 0.48, 0, 3.8), "clip-path": "url(#plotclip)" }, plotG);
  var resBars = HOUSES.map(function (d) {
    var yh = 1.54 * d[0] + 0.48;
    return el("line", { x1: g.x(d[0]), y1: g.y(yh), x2: g.x(d[0]), y2: g.y(d[1]), stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, plotG);
  });
  var dotsA = dotSet(plotG, g, HOUSES, C_TRAIN, 6);
  var plotParts = [fitLine].concat(resBars);

  // Matrix display helper: cells laid out in a grid.
  function matrix(parent, x0, y0, rows, cw, ch, hdr) {
    var gm = el("g", {}, parent), cells = [];
    rows.forEach(function (row, r) {
      row.forEach(function (v, c) {
        var cg = el("g", { class: "cell" }, gm);
        el("rect", { x: x0 + c * cw, y: y0 + r * ch, width: cw - 4, height: ch - 4, rx: 4 }, cg);
        txt(cg, x0 + c * cw + (cw - 4) / 2, y0 + r * ch + (ch - 4) / 2 + 5, "", String(v), "middle");
        cells.push(cg);
      });
    });
    if (hdr) hdr.forEach(function (h, c) { txt(gm, x0 + c * cw + (cw - 4) / 2, y0 - 8, "lbl-s", h, "middle"); });
    return gm;
  }
  var matG = el("g", {}, svg);
  card(matG, 400, 30, 232, 214, "fillG");
  txt(matG, 516, 52, "lbl", "X  (n × 2)", "middle");
  matrix(matG, 424, 76, HOUSES.map(function (d) { return [d[0].toFixed(1), "1"]; }), 54, 30, ["x", "1"]);
  var yvecG = el("g", {}, svg);
  txt(yvecG, 576, 52, "lbl lbl-y", "y", "middle");
  matrix(yvecG, 548, 76, HOUSES.map(function (d) { return [d[1].toFixed(1)]; }), 56, 30, null);
  var eqG = el("g", {}, svg);
  card(eqG, 400, 30, 232, 214, "fillB");
  txt(eqG, 516, 54, "lbl lbl-p", "normal equations", "middle");
  txt(eqG, 516, 84, "mono", "XᵀX · [w, b] = Xᵀy", "middle");
  matrix(eqG, 408, 112, [["22.5", "10"], ["10", "5"]], 50, 32, null);
  txt(eqG, 512, 141, "note", "· [w, b] =", "start");
  matrix(eqG, 574, 112, [["39.45"], ["17.8"]], 54, 32, null);
  txt(eqG, 516, 206, "note", "Σx² = 22.5, Σx = 10, n = 5", "middle");
  txt(eqG, 516, 224, "note", "Σxy = 39.45, Σy = 17.8", "middle");
  var solveG = el("g", {}, svg);
  card(solveG, 400, 30, 232, 214, "fillG");
  txt(solveG, 516, 54, "lbl", "solve the 2×2 system", "middle");
  txt(solveG, 416, 88, "mono", "det = 5·22.5 − 10·10", "start");
  txt(solveG, 416, 108, "mono", "    = 12.5", "start");
  txt(solveG, 416, 142, "mono", "w = 19.25 / 12.5 = 1.54", "start");
  txt(solveG, 416, 172, "mono", "b = 6.00 / 12.5 = 0.48", "start");
  txt(solveG, 516, 214, "lbl lbl-g", "one calculation, no loop", "middle");
  var mseG = el("g", {}, svg);
  card(mseG, 400, 30, 232, 80, "fillG");
  txt(mseG, 516, 58, "big", "ŷ = 1.54 x + 0.48", "middle");
  txt(mseG, 516, 88, "lbl lbl-g", "MSE = 0.0166", "middle");

  // Projection schematic.
  var projG = el("g", {}, svg);
  var plane = polygon(projG, "fillA");
  setPoly(plane, [[70, 250], [250, 190], [420, 230], [240, 300]]);
  txt(projG, 60, 322, "lbl lbl-b", "the flat surface: all possible predictions X·[w, b]", "start");
  el("line", { x1: 240, y1: 252, x2: 240, y2: 108, stroke: C_TRAIN, "stroke-width": 4, "stroke-dasharray": "6 4" }, projG);
  var ya = arrow(projG, "y", 4); setLine(ya, 150, 262, 240, 108);
  txt(projG, 236, 98, "lbl lbl-y", "y (the prices)", "end");
  var pa = arrow(projG, "g", 4); setLine(pa, 150, 262, 240, 252);
  txt(projG, 256, 270, "lbl lbl-g", "best fit = projection", "start");
  el("path", { d: "M 228 250 L 228 238 L 240 238", fill: "none", stroke: "#e6f5ec", "stroke-width": 1.5 }, projG);
  txt(projG, 252, 160, "lbl lbl-r", "residual ⟂ surface", "start");

  var cmpG = el("g", {}, svg);
  card(cmpG, 30, 40, 280, 190, "fillA");
  card(cmpG, 330, 40, 280, 190, "fillG");
  txt(cmpG, 170, 66, "lbl lbl-b", "GRADIENT DESCENT", "middle");
  txt(cmpG, 170, 100, "mono", "500 small steps", "middle");
  txt(cmpG, 170, 126, "mono", "w = 1.54  b = 0.48", "middle");
  txt(cmpG, 170, 156, "note", "needs a learning rate η", "middle");
  txt(cmpG, 170, 176, "note", "scales to huge data", "middle");
  txt(cmpG, 170, 196, "note", "works without a closed form", "middle");
  txt(cmpG, 470, 66, "lbl lbl-g", "CLOSED FORM", "middle");
  txt(cmpG, 470, 100, "mono", "one 2×2 solve", "middle");
  txt(cmpG, 470, 126, "mono", "w = 1.54  b = 0.48", "middle");
  txt(cmpG, 470, 156, "note", "exact, no learning rate", "middle");
  txt(cmpG, 470, 176, "note", "costly for very many features", "middle");
  txt(cmpG, 470, 196, "note", "libraries avoid explicit inverses", "middle");
  txt(cmpG, 320, 264, "lbl lbl-y", "same MSE, same line: neither is universally better", "middle");
  txt(cmpG, 320, 288, "mono", "MSE = 0.0166 for both", "middle");

  function render(index, id) {
    var i = index;
    show(fitLine, i === 6);
    resBars.forEach(function (b) { show(b, i === 6); });
    show(matG, i === 1 || i === 2);
    show(yvecG, i === 2);
    show(eqG, i === 3);
    show(projG, i === 4);
    show(solveG, i === 5);
    show(mseG, i === 6);
    show(cmpG, i === 7);
    show(plotG, i !== 4 && i !== 7);
  }
