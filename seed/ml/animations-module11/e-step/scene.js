  var steps = [
    { id: "fixed-components", label: "The components are fixed", caption: "E-step: the current parameters are fixed. A has weight 0.4, mean 3, spread 1; B has weight 0.6, mean 6, spread 1.5. They will not change in this step." },
    { id: "select-point", label: "Pick a point", caption: "Pick one customer, at spend x = 4.5. We want its responsibilities." },
    { id: "likelihood-a", label: "How well does A explain it?", caption: "Evaluate component A's density at x: 0.1295." },
    { id: "likelihood-b", label: "How well does B explain it?", caption: "Evaluate component B's density at x: 0.1613." },
    { id: "apply-weights", label: "Apply the mixing weights", caption: "Multiply each density by its component's mixing weight: 0.4 × 0.1295 and 0.6 × 0.1613." },
    { id: "unnormalized-scores", label: "Unnormalized scores", caption: "The weighted scores are 0.0518 for A and 0.0968 for B. They do not add up to 1 yet." },
    { id: "normalize", label: "Normalize across components", caption: "Divide each score by the total, 0.1486: r_ik = π_k N(x_i | μ_k, σ_k²) / Σ_j π_j N(x_i | μ_j, σ_j²)." },
    { id: "responsibilities", label: "The responsibilities", caption: "For this point: A 0.3486 and B 0.6514. Only the memberships were computed; the components are exactly as before." },
    { id: "e-step-summary", label: "Every point gets a row", caption: "Do the same for all ten customers. Low spends belong almost entirely to A, high spends to B, and 4.5 is split. The means, spreads and weights did not change." }
  ];

  var X = 4.5, RS = resp1(X, TWO);
  var g1 = makeGraph(40, 280, 32, 560);
  var axG = el("g", {}, svg);
  densAxes(axG, g1, 0.4, [0.1, 0.2, 0.3, 0.4]);
  var uA = function (x) { return gpdf(x, TWO[0].m, TWO[0].s); }, uB = function (x) { return gpdf(x, TWO[1].m, TWO[1].s); };
  var wA = function (x) { return TWO[0].w * uA(x); }, wB = function (x) { return TWO[1].w * uB(x); };
  var wtG = el("g", {}, svg);
  areaPath(wtG, g1, wA, GCOL[0], 0.3); curvePath(wtG, g1, wA, GCOL[0], 3);
  areaPath(wtG, g1, wB, GCOL[1], 0.3); curvePath(wtG, g1, wB, GCOL[1], 3);
  var unG = el("g", {}, svg);
  curvePath(unG, g1, uA, GCOL[0], 3, "7 4"); curvePath(unG, g1, uB, GCOL[1], 3, "7 4");
  var lockG = el("g", {}, svg);
  chip(lockG, 170, 28, 220, 30, "components FIXED in the E-step", "rgba(167,139,250,0.25)", "#a78bfa", "lbl");
  var vline = el("line", { x1: g1.x(X), y1: g1.y(0), x2: g1.x(X), y2: 80, stroke: "#e6f5ec", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  var pdot = el("circle", { cx: g1.x(X), cy: g1.y(0) - 8, r: 9, fill: "#e6f5ec", stroke: "#071510", "stroke-width": 3 }, svg);
  var markA = el("circle", { cx: g1.x(X), cy: g1.y(uA(X)), r: 7, fill: GCOL[0], stroke: "#071510", "stroke-width": 2 }, svg);
  var markB = el("circle", { cx: g1.x(X), cy: g1.y(uB(X)), r: 7, fill: GCOL[1], stroke: "#071510", "stroke-width": 2 }, svg);

  var panel = el("g", {}, svg);
  card(panel, 400, 80, 232, 210, "fillG");
  var pt = txt(panel, 516, 106, "lbl lbl-y", "", "middle");
  var bars = [0, 1].map(function (k) {
    var y = 126 + k * 50;
    txt(panel, 414, y + 20, "lbl", GNAME[k], "start").style.fill = GCOL[k];
    var b = box(panel, 436, y, 10, 28, GCOL[k], "none", 5);
    var v = txt(panel, 446, y + 20, "mono", "", "start");
    return { bar: b, val: v, y: y };
  });
  var pn = txt(panel, 516, 250, "lbl lbl-g", "", "middle");
  var pn2 = txt(panel, 516, 274, "note", "", "middle");
  var tblG = el("g", {}, svg);
  card(tblG, 20, 36, 380, 300, "fillA");
  ["x", "r_A", "r_B"].forEach(function (h, c) { txt(tblG, [60, 150, 330][c], 62, "lbl lbl-y", h, "middle"); });
  P10.forEach(function (x, k) {
    var r = resp1(x, TWO).r, y = 74 + k * 25;
    txt(tblG, 60, y + 14, "mono", x.toFixed(1), "middle");
    box(tblG, 100, y + 3, Math.max(2, r[0] * 100), 15, GCOL[0], "none", 3);
    txt(tblG, 104 + r[0] * 100, y + 15, "tick", f2(r[0]), "start");
    box(tblG, 240, y + 3, Math.max(2, r[1] * 100), 15, GCOL[1], "none", 3);
    txt(tblG, 244 + r[1] * 100, y + 15, "tick", f2(r[1]), "start");
  });
  var sumNote = el("g", {}, svg);
  card(sumNote, 410, 80, 222, 160, "fillB");
  txt(sumNote, 521, 112, "lbl lbl-y", "after the E-step", "middle");
  txt(sumNote, 521, 146, "note", "responsibilities: NEW", "middle");
  txt(sumNote, 521, 176, "note", "means, spreads, weights:", "middle");
  txt(sumNote, 521, 198, "lbl lbl-g", "UNCHANGED", "middle");

  function setBars(vals, scale, fmt, n) {
    bars.forEach(function (b, k) { show(b.bar, k < n); show(b.val, k < n); setBox(b.bar, 436, b.y, Math.max(3, vals[k] * scale), 28); b.val.textContent = fmt(vals[k]); b.val.setAttribute("x", 436 + Math.max(3, vals[k] * scale) + 8); });
  }
  function render(index, id) {
    var i = index;
    show(axG, i <= 7); show(wtG, i <= 1 || i >= 4 && i <= 7); show(unG, i >= 2 && i <= 3);
    show(lockG, i <= 7);
    show(vline, i >= 1 && i <= 7); show(pdot, i >= 1 && i <= 7);
    show(markA, i >= 2 && i <= 3); show(markB, i === 3);
    show(panel, i >= 2 && i <= 7); show(tblG, i === 8); show(sumNote, i === 8);
    pt.textContent = ""; pn.textContent = ""; pn2.textContent = "";
    bars.forEach(function (b) { show(b.bar, false); show(b.val, false); });
    if (i === 2) { pt.textContent = "density at x = 4.5"; setBars(RS.dens, 600, function (v) { return v.toFixed(4); }, 1); }
    if (i === 3) { pt.textContent = "density at x = 4.5"; setBars(RS.dens, 600, function (v) { return v.toFixed(4); }, 2); }
    if (i === 4) { pt.textContent = "density × weight"; setBars(RS.dens, 600, function (v) { return v.toFixed(4); }, 2); pn.textContent = "× 0.4        × 0.6"; }
    if (i === 5) { pt.textContent = "weighted scores"; setBars(RS.scores, 1250, function (v) { return v.toFixed(4); }, 2); pn.textContent = "total 0.1486"; }
    if (i === 6) { pt.textContent = "score / total"; setBars(RS.scores, 1250, function (v) { return v.toFixed(4); }, 2); pn.textContent = "÷ 0.1486"; pn2.textContent = "so the shares add up to 1"; }
    if (i === 7) { pt.textContent = "responsibilities"; setBars(RS.r, 160, function (v) { return v.toFixed(4); }, 2); pn.textContent = "0.3486 + 0.6514 = 1"; }
  }
