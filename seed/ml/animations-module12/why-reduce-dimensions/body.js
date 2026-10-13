
  var GRAY = "#8fa89c";
  // table of examples
  var tbl = el("g", {}, svg);
  ["usage", "spend", "feature 3", "…"].forEach(function (h, j) { txt(tbl, 30 + j * 92 + 44, 70, "lbl lbl-y", h, "middle"); });
  matGrid(tbl, 30, 82, 6, 4, 92, 30, DX.map(function (p) { return [String(p[0]), p[1].toFixed(1), "…", "…"]; }));
  var tCard = el("g", {}, svg);
  card(tCard, 410, 82, 222, 188, "fillG");
  txt(tCard, 521, 112, "lbl lbl-y", "each column = one dimension", "middle");
  txt(tCard, 521, 142, "note", "here: 6 customers × 2 features", "middle");
  txt(tCard, 521, 166, "note", "real tables: 40, 400, 4000 columns", "middle");
  txt(tCard, 521, 206, "big", "d columns", "middle");
  txt(tCard, 521, 230, "note", "= a point in d-dimensional space", "middle");
  // two-feature plot
  var plot = el("g", {}, svg);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(8), y2: OP.y(0), class: "axis" }, plot);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(0), y2: OP.y(7), class: "axis" }, plot);
  [0, 2, 4, 6, 8].forEach(function (t) { txt(plot, OP.x(t), OP.y(0) + 15, "tick", String(t), "middle"); });
  [2, 4, 6].forEach(function (t) { txt(plot, OP.x(0) - 7, OP.y(t) + 4, "tick", String(t), "end"); });
  txt(plot, OP.x(8), OP.y(0) - 8, "note", "usage frequency", "end");
  txt(plot, OP.x(0) + 6, OP.y(7) + 4, "note", "monthly spend", "start");
  var trend = dirLine(svg, CP, C_PC1, 3, true);
  setDir(trend, CP, DV1, 4.6);
  var drops = dropSet(svg, C_PRJ, DN);
  setDrops(drops, CP, DC, DV1);
  var dots = dotsAt(svg, OP, DX, 7);
  var corrCard = el("g", {}, svg);
  card(corrCard, 410, 82, 222, 150, "fillG");
  txt(corrCard, 521, 112, "lbl lbl-y", "correlation", "middle");
  txt(corrCard, 521, 150, "big", "0.94", "middle");
  var cc1 = txt(corrCard, 521, 182, "note", "", "middle");
  var cc2 = txt(corrCard, 521, 204, "note", "", "middle");
  var keepCard = el("g", {}, svg);
  card(keepCard, 410, 82, 222, 190, "fillB");
  txt(keepCard, 521, 110, "lbl lbl-y", "kept", "middle");
  txt(keepCard, 521, 132, "note", "order along the trend", "middle");
  txt(keepCard, 521, 150, "note", "spacing along the trend", "middle");
  txt(keepCard, 521, 184, "lbl lbl-r", "lost", "middle");
  txt(keepCard, 521, 206, "note", "small departures", "middle");
  txt(keepCard, 521, 224, "note", "from the trend line", "middle");
  txt(keepCard, 521, 256, "note", "6 numbers instead of 12", "middle");
  // three features (illustration)
  var iso = el("g", {}, svg);
  arrowLine(iso, "w", 2, 160, 290, 380, 290);
  arrowLine(iso, "w", 2, 160, 290, 160, 70);
  arrowLine(iso, "w", 2, 160, 290, 300, 190);
  txt(iso, 384, 306, "note", "usage", "end");
  txt(iso, 150, 78, "note", "spend", "end");
  txt(iso, 306, 184, "note", "sessions", "start");
  DX.forEach(function (p, i) {
    var t = (i + 0.7) / 6.6, jx = (i % 2 ? 6 : -6);
    el("circle", { cx: 190 + t * 150 + jx, cy: 265 - t * 160 + (i % 3 - 1) * 6, r: 7, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, iso);
  });
  txt(iso, 470, 120, "lbl lbl-y", "a third feature that", "middle");
  txt(iso, 470, 140, "lbl lbl-y", "also tracks engagement", "middle");
  txt(iso, 470, 190, "note", "(illustration, no real values)", "middle");
  // many dimensions
  var many = el("g", {}, svg);
  for (var gi = 0; gi < 15; gi++) {
    var gx = 40 + (gi % 5) * 112, gy = 62 + Math.floor(gi / 5) * 78;
    el("line", { x1: gx, y1: gy + 50, x2: gx + 70, y2: gy + 50, class: "axis" }, many);
    el("line", { x1: gx, y1: gy + 50, x2: gx, y2: gy, class: "axis" }, many);
    el("circle", { cx: gx + 18 + (gi * 13) % 40, cy: gy + 38 - (gi * 7) % 30, r: 4, fill: CUST[gi % 6] }, many);
  }
  var manyBig = txt(svg, 320, 318, "big", "40 features = 40 axes: we cannot picture this", "middle");
  // one-dimensional view
  var one = el("g", {}, svg);
  var NL = numLine(one, 60, 600, 200, -4, 4, 1);
  var oneDots = DZ1.map(function (z, i) { return el("circle", { cx: NL.x(z), cy: 200, r: 9, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, one); });
  txt(one, 330, 150, "lbl lbl-y", "one combined number per customer", "middle");
  txt(one, 330, 252, "note", "position along the trend line", "middle");
  txt(one, 330, 296, "big", "6 numbers instead of 12", "middle");

  function render(i) {
    show(tbl, i === 0); show(tCard, i === 0);
    var plotOn = (i >= 1 && i <= 3) || i === 6 || i === 8;
    show(plot, plotOn);
    dots.forEach(function (d) { show(d, plotOn); d.setAttribute("fill", i === 1 ? GRAY : CUST[dots.indexOf(d)]); });
    show(trend, i >= 2 && i <= 3 || i === 6 || i === 8);
    drops.lines.forEach(function (l) { show(l, i === 3 || i === 6 || i === 8); });
    drops.feet.forEach(function (f) { show(f, i === 6 || i === 8); });
    show(corrCard, i === 2 || i === 3); show(keepCard, i === 8);
    cc1.textContent = i === 2 ? "usage and spend rise together" : "one underlying story:";
    cc2.textContent = i === 2 ? "" : "how engaged the customer is";
    show(iso, i === 4); show(many, i === 5); show(manyBig, i === 5); show(one, i === 7);
  }
