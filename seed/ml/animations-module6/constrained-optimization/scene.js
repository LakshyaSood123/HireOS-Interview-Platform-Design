  var steps = [
    { id: "objective", label: "The objective we want to minimize", caption: "The same objective as before: L(w1, w2) = (w1 − 3)² + 2(w2 − 1)². The rings are contours of equal loss; lower loss is toward the middle." },
    { id: "unconstrained-minimum", label: "Best choice with no rules", caption: "With no restrictions the best point is the middle, (3, 1), where the loss is 0." },
    { id: "add-constraint", label: "Add a constraint (a rule)", caption: "Now there is a budget on the total weight: w1 + w2 ≤ 2. The yellow line is where w1 + w2 = 2 exactly." },
    { id: "feasible-region", label: "The feasible region", caption: "Points that satisfy the rule form the feasible region (green): everything on or below the line. Only these points are allowed." },
    { id: "infeasible-region", label: "The infeasible region", caption: "Points on the other side break the rule: they are infeasible (red). The best unconstrained point (3, 1) has w1 + w2 = 4, which is over budget, so it is not allowed." },
    { id: "search-feasible", label: "Search among feasible points", caption: "Try feasible candidates: (1, 1) has loss 4, (2, 0) has loss 3, (1.5, 0.5) has loss 2.75. The loss keeps improving as we approach the line from the left." },
    { id: "boundary", label: "Slide along the boundary", caption: "Move along the boundary line w1 + w2 = 2. The loss falls and then rises again; the chart shows loss along the line. It is lowest at w1 = 5/3." },
    { id: "best-feasible-point", label: "The best feasible point", caption: "The best allowed point is (5/3, 1/3) ≈ (1.67, 0.33), with loss 8/3 ≈ 2.67. It sits ON the boundary: the constraint is active, it is doing real work." },
    { id: "ml-connection", label: "Constraints in ML", caption: "Constraints appear as limits on weight size, budgets and resources, probabilities that must add to 1, and variances that must be non-negative. They are part of the model." }
  ];

  var P = makeGraph(70, 250, 50, 55);
  clipTo("cpclip", 10, 40, 370, 300);
  var plane = el("g", {}, svg);
  card(plane, 10, 40, 370, 300, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var clipped = el("g", { "clip-path": "url(#cpclip)" }, plane);
  var fea = el("polygon", { points: [[-1, 3], [-1, -1.5], [3.5, -1.5]].map(function (p) { return P.x(p[0]) + "," + P.y(p[1]); }).join(" "), class: "feasible" }, clipped);
  var inf = el("polygon", { points: [[-1, 3], [-1, 3.5], [6, 3.5], [6, -1.5], [3.5, -1.5]].map(function (p) { return P.x(p[0]) + "," + P.y(p[1]); }).join(" "), class: "infeasible", fill: "rgba(248,113,113,0.22)" }, clipped);
  var rings = el("g", {}, clipped);
  [1, 4, 9, 16].forEach(function (c) { levelEllipse(rings, P, c, "contour"); });
  drawAxes(plane, P, 6.2, 3.3, [0, 1, 2, 3, 4, 5, 6], [1, 2, 3]);
  txt(plane, P.x(6.2), P.y(0) + 28, "note", "w1", "end");
  txt(plane, P.x(0) + 8, P.y(3.3) + 12, "note", "w2", "start");

  var starG = el("g", {}, svg);
  el("circle", { cx: P.x(3), cy: P.y(1), r: 8, fill: "#1db584", stroke: "#071510", "stroke-width": 3 }, starG);
  var starLbl = txt(starG, P.x(3) + 12, P.y(1) - 10, "lbl lbl-g", "unconstrained minimum (3, 1)", "start");
  var cross = el("g", {}, svg);
  el("line", { x1: P.x(3) - 9, y1: P.y(1) - 9, x2: P.x(3) + 9, y2: P.y(1) + 9, stroke: "#f87171", "stroke-width": 4 }, cross);
  el("line", { x1: P.x(3) - 9, y1: P.y(1) + 9, x2: P.x(3) + 9, y2: P.y(1) - 9, stroke: "#f87171", "stroke-width": 4 }, cross);
  txt(cross, P.x(3) + 14, P.y(1) + 26, "lbl lbl-r", "infeasible: 3 + 1 = 4 > 2", "start");

  var conG = el("g", {}, svg);
  var conLine = el("line", { stroke: "#e2b44a", "stroke-width": 5, "stroke-linecap": "round" }, conG);
  setLine(conLine, P.x(-1), P.y(3), P.x(3.5), P.y(-1.5));
  txt(conG, P.x(0.2) - 6, P.y(1.8) - 14, "lbl lbl-y", "w1 + w2 = 2", "end");
  var feaLbl = txt(svg, P.x(-0.6), P.y(-0.9), "lbl lbl-g", "FEASIBLE  (w1 + w2 ≤ 2)", "start");
  var infLbl = txt(svg, P.x(3.3), P.y(2.8), "lbl lbl-r", "INFEASIBLE  (w1 + w2 > 2)", "start");

  var candG = el("g", {}, svg);
  var CANDS = [[1, 1, 4], [2, 0, 3], [1.5, 0.5, 2.75]];
  var candDots = CANDS.map(function (c) {
    var g = el("g", {}, candG);
    el("circle", { cx: P.x(c[0]), cy: P.y(c[1]), r: 7, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, g);
    txt(g, P.x(c[0]) - 12, P.y(c[1]) + 18, "lbl", "(" + c[0] + ", " + c[1] + ")  L = " + c[2], "end");
    return g;
  });
  var mover = el("circle", { r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var bestG = el("g", {}, svg);
  el("circle", { cx: P.x(5 / 3), cy: P.y(1 / 3), r: 11, fill: "none", stroke: "#1db584", "stroke-width": 4 }, bestG);
  el("circle", { cx: P.x(5 / 3), cy: P.y(1 / 3), r: 5, fill: "#1db584" }, bestG);
  txt(bestG, P.x(5 / 3) - 14, P.y(1 / 3) + 26, "lbl lbl-g", "best feasible (5/3, 1/3)", "end");

  var panel = el("g", {}, svg);
  card(panel, 392, 40, 236, 118, "fillG");
  var p1 = txt(panel, 510, 64, "note", "", "middle");
  var p2 = txt(panel, 510, 92, "mono", "", "middle");
  var p3 = txt(panel, 510, 118, "mono", "", "middle");
  var p4 = txt(panel, 510, 146, "big", "", "middle");

  var chartG = el("g", {}, svg);
  card(chartG, 392, 168, 236, 172, "fillB");
  var CXf = function (w1) { return 410 + (w1 + 1) * 44; };
  var CYf = function (l) { return 322 - l * 4.4; };
  txt(chartG, 510, 190, "lbl", "loss along the boundary", "middle");
  el("line", { x1: 404, y1: CYf(0), x2: 620, y2: CYf(0), class: "axis" }, chartG);
  var fb = function (w1) { return (w1 - 3) * (w1 - 3) + 2 * (2 - w1 - 1) * (2 - w1 - 1); };
  el("path", { class: "curve-p", d: curveD({ x: CXf, y: CYf }, fb, -1, 3.5, 60) }, chartG);
  txt(chartG, CXf(-1), CYf(0) + 14, "tick", "w1 = −1", "middle");
  txt(chartG, CXf(3.5), CYf(0) + 14, "tick", "3.5", "middle");
  var chartDot = el("circle", { r: 6, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, chartG);
  var chartMin = el("g", {}, chartG);
  el("circle", { cx: CXf(5 / 3), cy: CYf(fb(5 / 3)), r: 9, fill: "none", stroke: "#1db584", "stroke-width": 3 }, chartMin);
  txt(chartMin, CXf(5 / 3), CYf(fb(5 / 3)) - 14, "lbl lbl-g", "lowest: 2.67", "middle");

  var mlG = el("g", {}, svg);
  [["Weight-size limits", "e.g. keep weights small (a norm constraint)"], ["Budgets and resources", "total compute, money or time"], ["Valid probabilities", "values must add up to 1 and stay ≥ 0"]].forEach(function (b, i) {
    var y = 40 + i * 86;
    card(mlG, 80, y, 480, 70, i === 1 ? "fillB" : "fillG");
    txt(mlG, 320, y + 30, "big", b[0], "middle");
    txt(mlG, 320, y + 54, "note", b[1], "middle");
  });
  txt(mlG, 320, 318, "lbl lbl-y", "next: Lagrange multipliers, then KKT conditions", "middle");

  function moveTo(w1) {
    var w2 = 2 - w1;
    mover.setAttribute("cx", P.x(w1)); mover.setAttribute("cy", P.y(w2));
    chartDot.setAttribute("cx", CXf(w1)); chartDot.setAttribute("cy", CYf(fb(w1)));
    p2.textContent = "(" + fmt(w1, 2) + ", " + fmt(w2, 2) + ")";
    p3.textContent = "loss = " + fmt(fb(w1), 2);
  }

  function render(index, id) {
    var i = index;
    show(plane, i <= 7);
    show(fea, i >= 3 && i <= 7); show(inf, i >= 4 && i <= 7);
    show(starG, i >= 1 && i <= 4);
    show(cross, i === 4);
    show(conG, i >= 2 && i <= 7);
    show(feaLbl, i >= 3 && i <= 7); show(infLbl, i >= 4 && i <= 7);
    show(candG, i === 5);
    candDots.forEach(function (c, k) { show(c, i === 5); });
    show(mover, i === 6); show(chartG, i === 6); show(chartMin, i === 6);
    show(bestG, i === 7);
    show(panel, i >= 0 && i <= 7);
    show(mlG, i === 8);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";
    if (i === 0) { p1.textContent = "minimize"; p2.textContent = "(w1−3)² + 2(w2−1)²"; p4.textContent = "lower = better"; }
    if (i === 1) { p1.textContent = "no rules"; p2.textContent = "best point: (3, 1)"; p3.textContent = "loss 0"; p4.textContent = "the middle of the rings"; }
    if (i === 2) { p1.textContent = "a constraint (budget)"; p2.textContent = "w1 + w2 ≤ 2"; p3.textContent = "line: w1 + w2 = 2"; }
    if (i === 3) { p1.textContent = "feasible region"; p2.textContent = "w1 + w2 ≤ 2"; p4.textContent = "allowed points"; }
    if (i === 4) { p1.textContent = "infeasible region"; p2.textContent = "(3, 1): 3 + 1 = 4"; p3.textContent = "over budget"; p4.textContent = "not allowed"; }
    if (i === 5) {
      p1.textContent = "feasible candidates"; p2.textContent = "L(1,1) = 4"; p3.textContent = "L(2,0) = 3"; p4.textContent = "L(1.5, 0.5) = 2.75";
      anim("cand", 1500, function (e) { candDots.forEach(function (c, k) { c.setAttribute("opacity", Math.max(0, Math.min(1, e * 3.2 - k)).toFixed(2)); }); });
    }
    if (i === 6) {
      p1.textContent = "slide along w1 + w2 = 2";
      anim("slide", 3000, function (e) {
        var w1 = e < 0.75 ? lerp(3.4, 0, e / 0.75) : lerp(0, 5 / 3, (e - 0.75) / 0.25);
        moveTo(w1);
        p4.textContent = e > 0.99 ? "lowest at w1 = 5/3" : "loss falls, then rises";
      });
    }
    if (i === 7) { p1.textContent = "best feasible point"; p2.textContent = "(5/3, 1/3)"; p3.textContent = "loss = 8/3 ≈ 2.67"; p4.textContent = "constraint active"; }
  }
