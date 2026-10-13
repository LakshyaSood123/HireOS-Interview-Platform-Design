  var steps = [
    { id: "predictions", label: "Predictions from the line", caption: "Line A: ŷ = 1.5x + 0.5. For the five houses it predicts 2.0, 2.75, 3.5, 4.25 and 5.0." },
    { id: "residuals", label: "Residuals: prediction minus target", caption: "The residual of each house is ŷ − y: 0, −0.05, −0.20, +0.15, −0.20. The red bars show how far the line is from each true price." },
    { id: "signed-errors", label: "Signs would cancel", caption: "Some residuals are positive and some negative. Adding them directly gives −0.30, which hides the misses: a line could be wrong everywhere and still sum to zero." },
    { id: "square-errors", label: "Square each residual", caption: "Squaring makes every miss positive and punishes big misses more. Each square's area is r²: 0, 0.0025, 0.04, 0.0225, 0.04." },
    { id: "sum", label: "Add up the squares", caption: "The squares add up to 0.105." },
    { id: "average", label: "Average over the houses", caption: "Divide by the 5 houses: MSE = 0.105 ÷ 5 = 0.021. That one number scores the whole line." },
    { id: "compare-two-lines", label: "Score a second line", caption: "Line B: ŷ = 1.0x + 1.0 misses far more. Its squares are much bigger: the squares add up to 2.38, so MSE = 0.476." },
    { id: "lower-mse", label: "Lower MSE is the better fit", caption: "Line A scores 0.021 and Line B scores 0.476. A lower MSE means a better fit. MSE is a useful choice, not the only one: it is sensitive to outliers." }
  ];

  var g = housePlot(svg, 46, 318, 84, 56, 3.8, 5.6, [0, 1, 2, 3, 4, 5]);
  clipTo("plotclip", 46, 8, 330, 314);
  var lineA = el("path", { class: "curve-g", d: wbPath(g, 1.5, 0.5, 0, 3.8), "clip-path": "url(#plotclip)" }, svg);
  var lineB = el("path", { class: "curve-p", d: wbPath(g, 1.0, 1.0, 0, 3.8), "clip-path": "url(#plotclip)" }, svg);

  function resOf(w, b) { return HOUSES.map(function (d) { return (w * d[0] + b) - d[1]; }); }
  var RA = resOf(1.5, 0.5), RB = resOf(1.0, 1.0);

  // Residual bars and squares for one line.
  function makeResidualSet(parent, w, b, col) {
    var out = { bars: [], sq: [] };
    HOUSES.forEach(function (d, i) {
      var yh = w * d[0] + b, r = yh - d[1];
      var side = Math.abs(r) * g.sy;
      out.bars.push(el("line", { x1: g.x(d[0]), y1: g.y(yh), x2: g.x(d[0]), y2: g.y(d[1]), stroke: col, "stroke-width": 4, "stroke-linecap": "round" }, parent));
      var top = Math.min(g.y(yh), g.y(d[1]));
      var sq = box(parent, g.x(d[0]) + 3, top, side, side, col === C_RES ? "rgba(248,113,113,0.28)" : "rgba(244,114,182,0.28)", col, 0);
      out.sq.push(sq);
    });
    return out;
  }
  var gA = el("g", {}, svg), gB = el("g", {}, svg);
  var setA = makeResidualSet(gA, 1.5, 0.5, C_RES);
  var setB = makeResidualSet(gB, 1.0, 1.0, "#f472b6");
  var dotsA = dotSet(svg, g, HOUSES, C_TRAIN, 6);

  // Table of the five houses.
  var table = el("g", {}, svg);
  var colX = { house: 428, yhat: 476, r: 530, sq: 592 };
  card(table, 408, 30, 224, 214, "fillG");
  txt(table, colX.house, 54, "lbl-s", "x", "middle");
  var hYhat = txt(table, colX.yhat, 54, "lbl lbl-g", "ŷ", "middle");
  var hR = txt(table, colX.r, 54, "lbl lbl-r", "r = ŷ − y", "middle");
  var hSq = txt(table, colX.sq, 54, "lbl lbl-y", "r²", "middle");
  var cells = HOUSES.map(function (d, i) {
    var y = 82 + i * 26, yh = 1.5 * d[0] + 0.5, r = yh - d[1];
    return {
      yhat: txt(table, colX.yhat, y, "mono", yh.toFixed(2), "middle"),
      r: txt(table, colX.r, y, "mono", sgn(r), "middle"),
      sq: txt(table, colX.sq, y, "mono", (r * r).toFixed(4), "middle"),
      x: txt(table, colX.house, y, "note", d[0].toFixed(1), "middle")
    };
  });
  var totalRow = txt(table, 520, 228, "mono", "", "middle");
  var sumNote = txt(table, 520, 264, "lbl lbl-r", "", "middle");

  var bigG = el("g", {}, svg);
  card(bigG, 408, 262, 224, 76, "fillB");
  var bigTxt = txt(bigG, 520, 296, "big", "", "middle");
  var bigNote = txt(bigG, 520, 320, "note", "", "middle");

  var cmpG = el("g", {}, svg);
  card(cmpG, 408, 30, 224, 214, "fillB");
  txt(cmpG, 520, 56, "lbl", "MSE of each line", "middle");
  txt(cmpG, 440, 100, "lbl lbl-g", "Line A", "start");
  txt(cmpG, 440, 160, "lbl lbl-p", "Line B", "start");
  var barA = box(cmpG, 440, 108, 4, 22, "rgba(29,181,132,0.9)", "none", 4);
  var barB = box(cmpG, 440, 168, 4, 22, "rgba(244,114,182,0.85)", "none", 4);
  var valA = txt(cmpG, 448, 144, "mono", "", "start");
  var valB = txt(cmpG, 448, 204, "mono", "", "start");
  txt(cmpG, 520, 232, "note", "lower is better", "middle");

  function render(index, id) {
    var i = index;
    show(lineB, i >= 6);
    show(gA, i >= 1 && i <= 5);
    show(gB, i === 6 || i === 7);
    setA.sq.forEach(function (n) { show(n, i >= 3 && i <= 5); });
    setB.sq.forEach(function (n) { show(n, i >= 6); });
    if (i >= 6) { show(gA, true); setA.sq.forEach(function (n) { show(n, true); }); }
    show(table, i <= 5);
    cells.forEach(function (c) {
      show(c.yhat, i >= 0); show(c.r, i >= 1); show(c.sq, i >= 3);
    });
    show(hR, i >= 1); show(hSq, i >= 3);
    show(totalRow, i >= 2 && i <= 5); show(sumNote, i === 2);
    show(bigG, i === 4 || i === 5);
    show(cmpG, i >= 6);
    if (i === 2) { totalRow.textContent = "Σ r = −0.30"; sumNote.textContent = "signs cancel: misleading"; sumNote.setAttribute("y", "264"); }
    if (i === 3) totalRow.textContent = "squares are never negative";
    if (i === 4) { totalRow.textContent = "Σ r² = 0.105"; bigTxt.textContent = "Σ r² = 0.105"; bigNote.textContent = "sum of the five squares"; }
    if (i === 5) { totalRow.textContent = "Σ r² = 0.105"; bigTxt.textContent = "MSE = 0.105 ÷ 5 = 0.021"; bigNote.textContent = "mean of the squared residuals"; }
    if (i >= 6) {
      setBox(barA, 440, 108, (0.021 / 0.476) * 170 + 4, 22);
      setBox(barB, 440, 168, 174, 22);
      valA.textContent = "0.021"; valB.textContent = "0.476";
      if (i === 7) { valA.textContent = "0.021  better"; valB.textContent = "0.476  worse"; }
    }
  }
