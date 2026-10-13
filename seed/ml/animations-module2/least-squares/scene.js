  var steps = [
    { id: "data", label: "Data that no line fits perfectly", caption: "Four data points. No single straight line passes through all of them." },
    { id: "candidate-line", label: "Try a candidate line", caption: "Pick a line, here y = 0.5x + 2, and see how well it predicts each point." },
    { id: "residuals", label: "Measure each residual", caption: "A residual is the vertical gap between a point and the line: actual minus predicted." },
    { id: "square-errors", label: "Square the residuals", caption: "Squaring makes every error positive and punishes big misses. Add the squares: here the total is 2.5." },
    { id: "compare-lines", label: "Compare other lines", caption: "Try other lines. Each one has its own total of squared errors." },
    { id: "minimum", label: "The best line has the smallest total", caption: "Least squares picks the line with the smallest total squared error. Here that is y = 0.8x + 1.5, with 1.8." },
    { id: "projection-view", label: "The same answer, as a projection", caption: "Geometrically, the data vector b is projected onto the space of predictions A x. The residual is perpendicular to that space." },
    { id: "ml-connection", label: "This is linear regression", caption: "Fitting a regression line is exactly this problem. The best x solves AᵀA x = Aᵀb, the normal equations." }
  ];

  var PTS = [[1, 2], [2, 3], [3, 5], [4, 4]];
  var LINES = [
    { m: 0.5, b: 2, color: "#e2b44a", key: "y", name: "y = 0.5x + 2" },
    { m: 1, b: 1, color: "#38bdf8", key: "b", name: "y = x + 1" },
    { m: 0.8, b: 1.5, color: "#f472b6", key: "p", name: "y = 0.8x + 1.5" }
  ];
  function sse(l) {
    return PTS.reduce(function (s, p) { var r = p[1] - (l.m * p[0] + l.b); return s + r * r; }, 0);
  }
  function PX(x) { return 70 + 100 * x; }
  function PY(y) { return 300 - 48 * y; }

  var plot = el("g", {}, svg);
  el("line", { x1: PX(0), y1: PY(0), x2: PX(5.3), y2: PY(0), class: "axis" }, plot);
  el("line", { x1: PX(0), y1: PY(0), x2: PX(0), y2: PY(5.6), class: "axis" }, plot);
  txt(plot, PX(5.3), PY(0) + 16, "tick", "x", "end");
  txt(plot, PX(0) - 8, PY(5.6) + 4, "tick", "y", "end");

  var lineEls = LINES.map(function (l) {
    return el("line", { x1: PX(0.3), y1: PY(l.m * 0.3 + l.b), x2: PX(5), y2: PY(l.m * 5 + l.b), stroke: l.color, "stroke-width": 3, "stroke-linecap": "round", opacity: 0 }, plot);
  });
  var resEls = PTS.map(function (p) { return el("line", { stroke: "#f87171", "stroke-width": 2, opacity: 0 }, plot); });
  var sqEls = PTS.map(function () { return el("rect", { fill: "rgba(248,113,113,0.25)", stroke: "#f87171", "stroke-width": 1.2, opacity: 0 }, plot); });
  PTS.forEach(function (p) { el("circle", { cx: PX(p[0]), cy: PY(p[1]), r: 7, fill: "#1db584", stroke: "#071510", "stroke-width": 1.5 }, plot); });
  var sseLab = txt(plot, 610, 284, "big", "", "end");

  // Legend of candidate lines.
  var legend = el("g", { opacity: 0 }, plot);
  var legendRows = LINES.map(function (l, i) {
    var g = el("g", {}, legend);
    el("rect", { x: 360, y: 168 + i * 26, width: 14, height: 14, rx: 3, fill: l.color }, g);
    txt(g, 382, 180 + i * 26, "lbl", l.name + "   total " + round1(sse(l)), "start");
    return g;
  });

  // Projection schematic (step 7).
  var proj = el("g", { opacity: 0 }, svg);
  var O = [240, 262], Bt = [360, 80], Pp = [360, 226];
  el("polygon", { points: "130,300 400,300 520,214 250,214", class: "fillA" }, proj);
  txt(proj, 140, 322, "lbl lbl-b", "space of predictions  A x  (column space of A)", "start");
  var bArrow = arrow(proj, "g", 4);
  setLine(bArrow, O[0], O[1], Bt[0], Bt[1]);
  txt(proj, Bt[0] + 10, Bt[1] + 4, "lbl lbl-g", "b  (the data)", "start");
  var pArrow = arrow(proj, "y", 5);
  setLine(pArrow, O[0], O[1], Pp[0], Pp[1]);
  txt(proj, Pp[0] + 12, Pp[1] + 20, "lbl lbl-y", "p = A x̂  (best prediction)", "start");
  var perp = el("line", { class: "dash", stroke: "#f472b6", "stroke-width": 2.2 }, proj);
  setLine(perp, Bt[0], Bt[1], Pp[0], Pp[1]);
  txt(proj, Bt[0] - 12, 150, "lbl lbl-p", "residual ⟂ space", "end");
  el("polyline", { points: (Pp[0] - 14) + "," + Pp[1] + " " + (Pp[0] - 14) + "," + (Pp[1] - 14) + " " + Pp[0] + "," + (Pp[1] - 14), fill: "none", stroke: "#e2b44a", "stroke-width": 2 }, proj);

  var mlPanel = el("g", { opacity: 0 }, svg);
  el("rect", { x: 380, y: 176, width: 240, height: 90, rx: 12, class: "fillG" }, mlPanel);
  txt(mlPanel, 394, 202, "lbl", "linear regression = least squares", "start");
  txt(mlPanel, 394, 232, "mono", "AᵀA x = Aᵀ b", "start");
  txt(mlPanel, 394, 254, "note", "the normal equations", "start");

  function drawLineResiduals(l) {
    PTS.forEach(function (p, i) {
      var yl = l.m * p[0] + l.b;
      setLine(resEls[i], PX(p[0]), PY(p[1]), PX(p[0]), PY(yl));
      var side = Math.abs(p[1] - yl) * 48;
      var top = Math.min(PY(p[1]), PY(yl));
      sqEls[i].setAttribute("x", PX(p[0]));
      sqEls[i].setAttribute("y", top);
      sqEls[i].setAttribute("width", side);
      sqEls[i].setAttribute("height", side);
    });
  }

  function render(index, id) {
    show(plot, id !== "projection-view");
    show(proj, id === "projection-view");
    show(mlPanel, id === "ml-connection");
    lineEls.forEach(function (n) { show(n, false); n.setAttribute("stroke-width", 3); });
    resEls.forEach(function (n) { show(n, false); });
    sqEls.forEach(function (n) { show(n, false); });
    show(legend, false);
    sseLab.textContent = "";
    legendRows.forEach(function (g) { g.setAttribute("opacity", 1); });

    if (id === "candidate-line" || id === "residuals" || id === "square-errors") {
      show(lineEls[0], true);
      drawLineResiduals(LINES[0]);
      if (id !== "candidate-line") resEls.forEach(function (n) { show(n, true); });
      if (id === "square-errors") {
        sqEls.forEach(function (n) { show(n, true); });
        sseLab.textContent = "total squared error = " + round1(sse(LINES[0]));
      }
    } else if (id === "compare-lines") {
      lineEls.forEach(function (n) { show(n, true); });
      show(legend, true);
    } else if (id === "minimum") {
      lineEls.forEach(function (n, i) { show(n, true); if (i !== 2) n.setAttribute("opacity", 0.25); });
      lineEls[2].setAttribute("stroke-width", 5);
      show(legend, true);
      legendRows.forEach(function (g, i) { g.setAttribute("opacity", i === 2 ? 1 : 0.35); });
      sseLab.textContent = "smallest total = " + round1(sse(LINES[2]));
    } else if (id === "ml-connection") {
      show(lineEls[2], true);
      lineEls[2].setAttribute("stroke-width", 5);
    }
  }
