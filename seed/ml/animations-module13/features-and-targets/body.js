
  var COLS = ["tenure", "usage h", "tickets", "price", "days idle", "closed date", "churned"];
  var ROWS = [[24, 18.5, 0, 20, 2, "—", 0], [3, 4.0, 3, 20, 28, "Mar 02", 1], [14, 11.0, 1, 30, 6, "—", 0], [8, 6.5, 2, 30, 21, "Mar 10", 1], [36, 22.0, 0, 20, 1, "—", 0], [5, 5.0, 4, 20, 35, "Mar 18", 1]];
  var CW = 80, GX = 28, GY = 92;
  COLS.forEach(function (c, j) { txt(svg, GX + j * CW + 38, GY - 10, "tick", c, "middle"); });
  var grid = matGrid(svg, GX, GY, 6, 7, CW, 28, ROWS.map(function (r) { return r.map(function (v, j) { return j === 1 ? v.toFixed(1) : String(v); }); }));
  var bar = el("g", {}, svg);
  card(bar, 28, 270, 584, 74, "fillG");
  var b1 = txt(bar, 320, 298, "lbl lbl-y", "", "middle");
  var b2 = txt(bar, 320, 322, "note", "", "middle");
  function colCells(j, fill, stroke) { for (var r = 0; r < 6; r++) { tint(grid.cells[r][j], fill, stroke); grid.cells[r][j].setAttribute("opacity", "1"); } }
  var NEUTRAL = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.28)"], GREEN = ["rgba(29,181,132,0.28)", K_OK], BLUE = ["rgba(56,189,248,0.3)", K_TR], RED = ["rgba(248,113,113,0.32)", K_BAD];
  function paint(map) {
    for (var j = 0; j < 7; j++) { var c = map[j] || NEUTRAL; colCells(j, c[0], c[1]); }
  }
  function render(i) {
    var map = {};
    if (i >= 1) [0, 1, 2, 3, 4].forEach(function (j) { map[j] = GREEN; });
    if (i >= 2) map[6] = BLUE;
    if (i === 3) { [0, 1, 2, 3].forEach(function (j) { map[j] = NEUTRAL; }); }
    if (i === 4) { [0, 1, 3, 4].forEach(function (j) { map[j] = NEUTRAL; }); }
    if (i >= 5 && i <= 6) { [0, 1, 2, 3, 4].forEach(function (j) { map[j] = NEUTRAL; }); map[5] = RED; }
    if (i === 7) { map[5] = NEUTRAL; }
    paint(map);
    if (i === 7) for (var r = 0; r < 6; r++) grid.cells[r][5].setAttribute("opacity", "0.2");
    if (i === 8) for (var r2 = 0; r2 < 6; r2++) grid.cells[r2][5].setAttribute("opacity", "0.2");
    show(bar, i >= 1);
    var t1 = ["", "candidate features: columns known to the business", "target: what we want to predict", "days idle: known on the prediction day", "support tickets: known on the prediction day", "closed date: filled in only for churners", "prediction-time check: would this exist on day 0?", "leakage removed: closed date is dropped", "final feature set"][i];
    var t2 = ["", "five columns describe the customer before the decision", "churned_30d = 1 if the customer cancels within 30 days", "valid: the value exists before the outcome", "valid: the value exists before the outcome", "present for every churner, empty for every stayer: it predicts 6 of 6 perfectly", "on day 0 the closed date does not exist yet, so it cannot be a feature", "a perfect score from this column would be leakage, not skill", "X: tenure, usage, tickets, price, days idle · y: churned_30d"][i];
    b1.textContent = t1; b2.textContent = t2;
  }
  flatCards();
