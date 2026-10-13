  var steps = [
    {"id": "original-point", "label": "One customer", "caption": "Customer 5 has usage 6 and spend 4.0: two numbers describe it."},
    {"id": "center-point", "label": "Center it", "caption": "Subtract the training means (4.5, 3.5): the point becomes (1.5, 0.5)."},
    {"id": "principal-axis", "label": "Principal axis", "caption": "The PC1 axis runs through the center along the trend."},
    {"id": "drop-perpendicular", "label": "Drop a perpendicular", "caption": "The shortest path from the point to the axis meets the axis at a right angle."},
    {"id": "projected-point", "label": "Projected point", "caption": "z = (1.5)(0.754) + (0.5)(0.657) = 1.46: the position along the axis."},
    {"id": "repeat-points", "label": "Repeat for all points", "caption": "Every customer gets one coordinate along PC1."},
    {"id": "one-dimensional-axis", "label": "The one-dimensional axis", "caption": "Laid out on a line, the six coordinates keep the order and spacing along the trend."},
    {"id": "new-coordinates", "label": "A new customer", "caption": "A new customer (5, 3.0) is centered with the training means to (0.5, -0.5) and projected with the same direction: z = 0.048. No refit."},
    {"id": "matrix-view", "label": "Matrix view", "caption": "Z = Xc V1: a 6 x 2 matrix times a 2 x 1 matrix gives a 6 x 1 matrix of new coordinates."},
    {"id": "reduced-dataset", "label": "Reduced dataset", "caption": "Twelve numbers became six, keeping 97.2% of the variance; the 2 means and the direction are stored once for the model."}
  ];

  var K = 4;
  var NEWP = [5, 3.0], NEWC = [NEWP[0] - DMEAN[0], NEWP[1] - DMEAN[1]], NEWZ = dot2(NEWC, DV1);
  var origAx = el("g", {}, svg);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(8), y2: OP.y(0), class: "axis" }, origAx);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(0), y2: OP.y(7), class: "axis" }, origAx);
  txt(origAx, OP.x(8), OP.y(0) + 16, "note", "usage", "end");
  txt(origAx, OP.x(0) + 6, OP.y(7) + 4, "note", "spend", "start");
  var cenAx = frameAxes(svg, CP, 4.5, 3.5);
  var pc1 = dirLine(svg, CP, C_PC1, 3.5);
  setDir(pc1, CP, DV1, 4.5);
  var t1 = txt(svg, CP.x(3.3 * DV1[0]) - 8, CP.y(3.3 * DV1[1]) - 14, "lbl lbl-y", "PC1 axis", "end");
  var drops = dropSet(svg, C_PRJ, DN);
  setDrops(drops, CP, DC, DV1);
  var ra = rightAngle(svg);
  var c0 = CP.pt(DC[K]);
  var Fv = [DZ1[K] * DV1[0], DZ1[K] * DV1[1]], Pv = [DC[K][0] - Fv[0], DC[K][1] - Fv[1]], pl = Math.hypot(Pv[0], Pv[1]);
  var ua = [-Math.sign(DZ1[K]) * DV1[0], -Math.sign(DZ1[K]) * DV1[1]], ub = [Pv[0] / pl, Pv[1] / pl];
  function atF(a, b) { return CP.pt([Fv[0] + 0.22 * a[0] + 0.22 * b[0], Fv[1] + 0.22 * a[1] + 0.22 * b[1]]); }
  var q1 = atF(ua, [0, 0]), q2 = atF(ua, ub), q3 = atF([0, 0], ub);
  ra.setAttribute("d", "M " + q1[0].toFixed(1) + " " + q1[1].toFixed(1) + " L " + q2[0].toFixed(1) + " " + q2[1].toFixed(1) + " L " + q3[0].toFixed(1) + " " + q3[1].toFixed(1));
  var dots = dotsAt(svg, CP, DC, 7);
  var ring = el("circle", { cx: c0[0], cy: c0[1], r: 11, fill: "none", stroke: "#e6f5ec", "stroke-width": 2.5 }, svg);
  var tag = txt(svg, c0[0] - 14, c0[1] - 16, "lbl", "", "start");
  var fp = CP.pt([DZ1[K] * DV1[0], DZ1[K] * DV1[1]]);
  var zlab = txt(svg, fp[0] + 12, fp[1] + 22, "lbl lbl-p", "z = " + s2(DZ1[K]), "start");
  var newG = el("g", {}, svg);
  var np = CP.pt(NEWC), nf = CP.pt([NEWZ * DV1[0], NEWZ * DV1[1]]);
  el("line", { x1: np[0], y1: np[1], x2: nf[0], y2: nf[1], stroke: "#e6f5ec", "stroke-width": 1.8, "stroke-dasharray": "4 3" }, newG);
  el("circle", { cx: nf[0], cy: nf[1], r: 5, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 1.5 }, newG);
  el("circle", { cx: np[0], cy: np[1], r: 8, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, newG);
  txt(newG, np[0] + 12, np[1] + 20, "lbl", "new customer (5, 3.0)", "start");
  var panel = el("g", {}, svg);
  card(panel, 410, 62, 222, 190, "fillG");
  var q1 = txt(panel, 521, 92, "lbl lbl-y", "", "middle");
  var q2 = txt(panel, 521, 126, "mono", "", "middle");
  var q3 = txt(panel, 521, 158, "note", "", "middle");
  var q4 = txt(panel, 521, 180, "note", "", "middle");
  var q5 = txt(panel, 521, 202, "note", "", "middle");
  var q6 = txt(panel, 521, 224, "note", "", "middle");
  var one = el("g", {}, svg);
  var NL = numLine(one, 50, 610, 190, -4, 4, 1);
  DZ1.forEach(function (z, i) { el("circle", { cx: NL.x(z), cy: 190, r: 9, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, one); });
  txt(one, 330, 140, "lbl lbl-y", "the 1-D axis: coordinate z along PC1", "middle");
  txt(one, 330, 240, "note", "same order and spacing as along the trend line", "middle");
  var mv = el("g", {}, svg);
  txt(mv, 70, 48, "lbl lbl-y", "Xc  (6 × 2)", "middle");
  matGrid(mv, 24, 58, 6, 2, 52, 26, DC.map(function (c) { return [s2(c[0]), s2(c[1])]; }));
  txt(mv, 150, 150, "big", "×", "middle");
  txt(mv, 218, 48, "lbl lbl-y", "v1  (2 × 1)", "middle");
  matGrid(mv, 180, 100, 2, 1, 76, 30, [[f3(DV1[0])], [f3(DV1[1])]]);
  txt(mv, 304, 150, "big", "=", "middle");
  txt(mv, 372, 48, "lbl lbl-y", "Z  (6 × 1)", "middle");
  matGrid(mv, 330, 58, 6, 1, 84, 26, DZ1.map(function (z) { return [s2(z)]; }));
  txt(mv, 520, 110, "note", "each row of Z: one customer's", "middle");
  txt(mv, 520, 128, "note", "coordinate along PC1", "middle");
  txt(mv, 520, 170, "note", "with k = 2 columns nothing is", "middle");
  txt(mv, 520, 188, "note", "dropped: only the axes rotate", "middle");
  var red = el("g", {}, svg);
  txt(red, 130, 56, "lbl lbl-y", "reduced dataset Z", "middle");
  matGrid(red, 70, 68, 6, 1, 120, 30, DZ1.map(function (z) { return [s2(z)]; }));
  DZ1.forEach(function (z, i) { el("circle", { cx: 54, cy: 83 + i * 30, r: 7, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, red); });
  card(red, 250, 70, 360, 170, "fillG");
  txt(red, 430, 104, "big", "12 numbers → 6 numbers", "middle");
  txt(red, 430, 140, "note", "stored once for the whole model:", "middle");
  txt(red, 430, 160, "note", "the 2 means and the direction v1", "middle");
  txt(red, 430, 196, "lbl lbl-y", "we keep " + (DEV1 * 100).toFixed(1) + "% of the variance", "middle");
  txt(red, 430, 220, "note", "we dropped the PC2 coordinate", "middle");
  function setPanel(a, b, c, d, e, f) { q1.textContent = a; q2.textContent = b; q3.textContent = c || ""; q4.textContent = d || ""; q5.textContent = e || ""; q6.textContent = f || ""; }
  function render(i) {
    var plotOn = i <= 5 || i === 7;
    show(origAx, i === 0); show(cenAx, i >= 1 && i <= 5 || i === 7);
    dots.forEach(function (d) { show(d, plotOn); });
    show(pc1, i >= 2 && i <= 5 || i === 7); show(t1, i >= 2 && i <= 5 || i === 7);
    drops.lines.forEach(function (l, k) { var on = (i === 3 || i === 4) ? k === K : (i === 5); l.setAttribute("stroke-width", "3"); show(l, on); show(drops.feet[k], (i === 4 || i === 5) && (i === 5 || k === K)); });
    show(ra, i === 3 || i === 4);
    show(ring, i <= 4); show(tag, i <= 4); show(zlab, i === 4 || i === 5);
    zlab.textContent = i === 5 ? "" : "z = " + s2(DZ1[K]);
    show(newG, i === 7);
    show(panel, i <= 5 || i === 7); show(one, i === 6); show(mv, i === 8); show(red, i === 9);
    tag.textContent = i === 0 ? "customer 5 (6, 4.0)" : "centered (" + s2(DC[K][0]) + ", " + s2(DC[K][1]) + ")";
    if (i === 0) setPanel("one customer", "(6, 4.0)", "usage 6, spend 4.0", "2 numbers describe it", "");
    if (i === 1) setPanel("center it", "Xc = X − means", "subtract (" + f2(DMEAN[0]) + ", " + f2(DMEAN[1]) + ")", "the point becomes", "(" + s2(DC[K][0]) + ", " + s2(DC[K][1]) + ")");
    if (i === 2) setPanel("the principal axis", "PC1 = (" + f3(DV1[0]) + ", " + f3(DV1[1]) + ")", "a unit direction through", "the center, fitted to the", "whole cloud");
    if (i === 3) setPanel("drop a perpendicular", "right angle", "the shortest path from the", "point to the axis meets", "the axis at a right angle");
    if (i === 4) setPanel("the projected point", "z = " + s2(DZ1[K]), "z = (" + s2(DC[K][0]) + ")(" + f3(DV1[0]) + ") + (" + s2(DC[K][1]) + ")(" + f3(DV1[1]) + ")", "z is the position along the axis", "(a number, not a direction)");
    if (i === 5) setPanel("repeat for every point", "z values", DZ1.map(s2).join("  "), "", "each customer gets", "one coordinate");
    if (i === 7) setPanel("a NEW customer", "(5, 3.0)", "use the TRAINING means:", "centered (" + s2(NEWC[0]) + ", " + s2(NEWC[1]) + ")", "z = " + s3(NEWZ), "same direction v1, no refit");
  }

  flatCards();
