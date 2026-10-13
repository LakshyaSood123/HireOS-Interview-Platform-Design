  var steps = [
    { id: "joint-grid", label: "Start from the joint table", caption: "Here is the joint table of bedrooms (X, rows) and price band (Y, columns). From this one table we can answer two different kinds of questions." },
    { id: "marginalize-y", label: "Marginal: add across the other variable", caption: "To study bedrooms alone, ignore the price: add each row across the Low and High columns. We are collapsing the Y axis." },
    { id: "x-marginal", label: "The marginal distribution of X", caption: "The row totals are the marginal distribution: P(X = 1) = 0.30, P(X = 2) = 0.40, P(X = 3) = 0.30. They add up to 1. This is bedrooms over ALL houses." },
    { id: "select-y", label: "Conditional: we learn that Y = High", caption: "Now suppose we are told the house is High priced. Low priced houses are no longer possible, so we keep only the High column and drop the rest." },
    { id: "conditional-slice", label: "Slice out the High column", caption: "The slice holds 0.05, 0.20 and 0.25. These are probabilities out of ALL houses, and they add up to 0.50, not 1. It is not yet a distribution." },
    { id: "normalize", label: "Renormalize so it adds to 1", caption: "Divide each entry by the slice total 0.50: 0.10, 0.40, 0.50. Now they add up to 1. This is the conditional distribution P(X | Y = High)." },
    { id: "compare", label: "Marginal versus conditional", caption: "Marginal: 0.30, 0.40, 0.30 (all houses). Conditional on High: 0.10, 0.40, 0.50. Knowing the price shifted the probability toward bigger houses." },
    { id: "ml-connection", label: "Why ML cares", caption: "A marginal describes one feature on its own. Prediction is conditioning: observe some variables, then ask about the others, always re-normalizing. The multivariate normal later does exactly this." }
  ];

  var ROWS = [1, 2, 3], COLS = ["Low", "High"];
  var P = { "1,Low": 0.25, "1,High": 0.05, "2,Low": 0.20, "2,High": 0.20, "3,Low": 0.05, "3,High": 0.25 };
  var MARG = [0.30, 0.40, 0.30], SLICE = [0.05, 0.20, 0.25], COND = [0.10, 0.40, 0.50];
  var GX = 130, GY = 92, CW = 96, CH = 56;
  var RY = function (r) { return GY + r * CH; };

  var gridG = el("g", {}, svg);
  var cells = {};
  ROWS.forEach(function (r, ri) {
    COLS.forEach(function (c, ci) {
      var key = r + "," + c;
      cells[key] = box(gridG, GX + ci * CW + 3, RY(ri) + 3, CW - 6, CH - 6, "rgba(56,189,248,0.2)", "rgba(56,189,248,0.6)", 8);
      txt(gridG, GX + ci * CW + CW / 2, RY(ri) + CH / 2 + 7, "big", P[key].toFixed(2), "middle");
    });
    txt(gridG, GX - 12, RY(ri) + CH / 2 + 6, "lbl", r + (r === 1 ? " bedroom" : " bedrooms"), "end");
  });
  COLS.forEach(function (c, ci) { txt(gridG, GX + ci * CW + CW / 2, GY - 10, "big", c, "middle").setAttribute("font-size", "16"); });
  txt(gridG, GX + CW, GY - 32, "lbl lbl-p", "Y = price band", "middle");
  txt(gridG, 20, 66, "lbl lbl-y", "X = bedrooms", "start");

  // Row totals (the marginal), as a margin column.
  var MX = GX + 2 * CW + 12;
  var marginG = el("g", {}, svg);
  txt(marginG, MX + 40, GY - 10, "lbl lbl-g", "row total", "middle");
  MARG.forEach(function (m, ri) {
    box(marginG, MX, RY(ri) + 3, 80, CH - 6, "rgba(29,181,132,0.35)", "#1db584", 8);
    txt(marginG, MX + 40, RY(ri) + CH / 2 + 7, "big", m.toFixed(2), "middle");
  });
  // Arrows showing the collapse across Y.
  var collapseG = el("g", {}, svg);
  ROWS.forEach(function (r, ri) {
    var a = arrow(collapseG, "g", 3);
    setLine(a, GX + 2 * CW + 2, RY(ri) + CH / 2, MX - 2, RY(ri) + CH / 2);
  });
  txt(collapseG, MX + 40, GY + 3 * CH + 18, "lbl lbl-g", "add across Y", "middle");

  // Marginal bars.
  var RX = 450;
  var margBars = el("g", {}, svg);
  txt(margBars, RX, GY - 10, "lbl lbl-g", "marginal P(X)", "start");
  MARG.forEach(function (m, ri) {
    box(margBars, RX, RY(ri) + 10, m * 300, 36, "rgba(29,181,132,0.85)", "none", 4);
    txt(margBars, RX + m * 300 + 6, RY(ri) + 34, "lbl", m.toFixed(2), "start");
  });

  // Column total under the table, and column highlight.
  var colTot = el("g", {}, svg);
  COLS.forEach(function (c, ci) {
    box(colTot, GX + ci * CW + 3, GY + 3 * CH + 6, CW - 6, 30, "rgba(226,180,74,0.3)", "#e2b44a", 6);
    txt(colTot, GX + ci * CW + CW / 2, GY + 3 * CH + 27, "lbl", "total 0.50", "middle");
  });
  var hiBox = el("rect", { x: GX + CW + 1, y: GY - 2, width: CW - 2, height: 3 * CH + 4, rx: 10, fill: "none", stroke: "#f472b6", "stroke-width": 4 }, svg);

  // The slice, then the renormalized version.
  var sliceG = el("g", {}, svg);
  var sliceTitle = txt(sliceG, RX, GY - 10, "lbl lbl-p", "High column only", "start");
  SLICE.forEach(function (v, ri) {
    box(sliceG, RX, RY(ri) + 6, 60, CH - 12, "rgba(244,114,182,0.35)", "#f472b6", 8);
    txt(sliceG, RX + 30, RY(ri) + CH / 2 + 6, "big", v.toFixed(2), "middle");
  });
  txt(sliceG, RX + 30, GY + 3 * CH + 26, "lbl", "sum = 0.50", "middle");
  var condG = el("g", {}, svg);
  txt(condG, RX + 52, GY - 10, "lbl lbl-p", "÷ 0.50 → P(X | High)", "start");
  COND.forEach(function (v, ri) {
    box(condG, RX + 75, RY(ri) + 10, v * 110, 36, "rgba(244,114,182,0.9)", "none", 4);
    txt(condG, RX + 75 + v * 110 + 6, RY(ri) + 34, "lbl", v.toFixed(2), "start");
  });
  txt(condG, RX + 110, GY + 3 * CH + 26, "lbl lbl-g", "sum = 1.00", "middle");
  ROWS.forEach(function (r, ri) {
    var da = arrow(condG, "p", 3);
    setLine(da, RX + 64, RY(ri) + CH / 2, RX + 73, RY(ri) + CH / 2);
  });

  var cmpG = el("g", {}, svg);
  txt(cmpG, RX, GY - 10, "lbl", "bedrooms 1, 2, 3", "start");
  MARG.forEach(function (m, ri) {
    box(cmpG, RX, RY(ri) + 6, m * 220, 20, "rgba(29,181,132,0.85)", "none", 3);
    txt(cmpG, RX + m * 220 + 6, RY(ri) + 21, "note", m.toFixed(2), "start");
    box(cmpG, RX, RY(ri) + 30, COND[ri] * 220, 20, "rgba(244,114,182,0.9)", "none", 3);
    txt(cmpG, RX + COND[ri] * 220 + 6, RY(ri) + 45, "note", COND[ri].toFixed(2), "start");
  });
  el("rect", { x: RX, y: GY + 3 * CH + 14, width: 12, height: 12, fill: "rgba(29,181,132,0.85)" }, cmpG);
  txt(cmpG, RX + 18, GY + 3 * CH + 25, "note", "marginal P(X)", "start");
  el("rect", { x: RX + 100, y: GY + 3 * CH + 14, width: 12, height: 12, fill: "rgba(244,114,182,0.9)" }, cmpG);
  txt(cmpG, RX + 118, GY + 3 * CH + 25, "note", "P(X | Y = High)", "start");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 40, 270, 130, "fillG");
  txt(mlG, 175, 70, "lbl lbl-g", "MARGINAL", "middle");
  txt(mlG, 175, 98, "lbl", "ignore the other variables", "middle");
  txt(mlG, 175, 120, "lbl", "(sum / collapse)", "middle");
  txt(mlG, 175, 150, "note", "a feature's overall behavior", "middle");
  card(mlG, 330, 40, 270, 130, "fillB");
  txt(mlG, 465, 70, "lbl lbl-p", "CONDITIONAL", "middle");
  txt(mlG, 465, 98, "lbl", "use what we observed", "middle");
  txt(mlG, 465, 120, "lbl", "(slice, then renormalize)", "middle");
  txt(mlG, 465, 150, "note", "prediction given the evidence", "middle");
  txt(mlG, 320, 230, "big", "Observe some variables, ask about the rest.", "middle");
  txt(mlG, 320, 258, "note", "Every probabilistic model does this, including the Gaussian ahead.", "middle");

  function render(index, id) {
    var i = index;
    show(gridG, i <= 6);
    show(collapseG, i === 1);
    show(marginG, i >= 2 && i <= 2 || i === 1);
    show(margBars, i === 2);
    show(colTot, i === 3);
    show(hiBox, i === 3 || i === 4 || i === 5);
    show(sliceG, i === 4 || i === 5);
    show(condG, i === 5);
    show(sliceTitle, i === 4);
    show(cmpG, i === 6);
    show(mlG, i === 7);
    gridG.setAttribute("opacity", i === 7 ? "0" : i === 6 ? "0.45" : "1");
    ROWS.forEach(function (r) {
      COLS.forEach(function (c) {
        var key = r + "," + c;
        var dimLow = (i >= 3 && i <= 5 && c === "Low");
        cells[key].setAttribute("opacity", dimLow ? "0.2" : "1");
        cells[key].setAttribute("fill", (i >= 3 && i <= 5 && c === "High") ? "rgba(244,114,182,0.35)" : "rgba(56,189,248,0.2)");
      });
    });
    if (i === 1) {
      anim("collapse", 1200, function (e) { collapseG.setAttribute("opacity", String(Math.min(1, e * 2))); marginG.setAttribute("opacity", String(Math.max(0, e * 2 - 1))); });
    }
  }
