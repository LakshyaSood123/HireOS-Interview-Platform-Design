  var steps = [
    { id: "objective", label: "The objective again", caption: "Same objective L = f(w1, w2) = (w1 − 3)² + 2(w2 − 1)², lowest at (3, 1). This time we meet constraints that are LIMITS rather than exact lines." },
    { id: "inequality-constraint", label: "An inequality constraint", caption: "The budget is a limit, not an exact value: g(w) = w1 + w2 − 2 ≤ 0. The line is the edge; the green ticks point toward the allowed side." },
    { id: "feasible-region", label: "The feasible region is an area", caption: "Everything with g ≤ 0 is allowed: an area, not just a line. The solution may sit on the edge or strictly inside. That choice needs extra logic: the KKT conditions." },
    { id: "inactive-constraint", label: "Case B: an inactive constraint", caption: "Raise the budget to 6 (g = w1 + w2 − 6 ≤ 0). The best unconstrained point (3, 1) is now INSIDE the region: g = −2 < 0. The constraint is inactive; delete it and nothing changes. Its multiplier is μ = 0." },
    { id: "active-constraint", label: "Case A: an active constraint", caption: "With budget 2 the unconstrained optimum is outside, so the answer is pushed to the edge: (5/3, 1/3), where g = 0. The constraint is active: it is really holding the answer back." },
    { id: "multiplier", label: "The multiplier is non-negative", caption: "At the active solution the objective wants to go outward (cyan), and the constraint pushes back inward with strength μ (pink). Here μ = 8/3. A limit can only push inward, so μ can never be negative." },
    { id: "complementary-slackness", label: "Complementary slackness", caption: "Either the constraint is inactive (g < 0) and its multiplier is zero, or it is active (g = 0) and its multiplier may be positive. In both cases μ × g = 0." },
    { id: "stationarity", label: "Stationarity: the pushes balance", caption: "At the solution the objective's gradient and the active constraint's pull cancel: ∇f + μ∇g = [−8/3, −8/3] + [8/3, 8/3] = [0, 0]. No direction inside the region improves the loss." },
    { id: "kkt-summary", label: "The four KKT conditions", caption: "Primal feasibility: g ≤ 0. Dual feasibility: μ ≥ 0. Complementary slackness: μ g = 0. Stationarity: ∇f + μ∇g = 0. Case A (μ = 8/3) and case B (μ = 0) satisfy all four." },
    { id: "ml-connection", label: "Why ML cares", caption: "KKT conditions underlie support vector machines and many regularized models. For convex problems a point satisfying them is a global minimum; for non-convex problems they only point to candidates." }
  ];

  var P = makeGraph(70, 250, 50, 55);
  clipTo("kkclip", 10, 40, 370, 300);
  var plane = el("g", {}, svg);
  card(plane, 10, 40, 370, 300, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var clipped = el("g", { "clip-path": "url(#kkclip)" }, plane);
  var fea = el("polygon", { class: "feasible" }, clipped);
  [1, 4, 9, 16].forEach(function (c) { levelEllipse(clipped, P, c, "contour"); });
  drawAxes(plane, P, 6.2, 3.3, [0, 1, 2, 3, 4, 5, 6], [1, 2, 3]);
  txt(plane, P.x(6.2), P.y(0) + 28, "note", "w1", "end");
  txt(plane, P.x(0) + 8, P.y(3.3) + 12, "note", "w2", "start");

  var conG = el("g", { "clip-path": "url(#kkclip)" }, svg);
  var conLine = el("line", { stroke: "#e2b44a", "stroke-width": 5, "stroke-linecap": "round" }, conG);
  var conLbl = txt(svg, 0, 0, "lbl lbl-y", "", "start");
  var ticks = [];
  for (var k = 0; k < 6; k++) ticks.push(arrow(svg, "g", 3));
  function setBudget(b) {
    var p1 = [b - 3.5, 3.5], p2 = [b + 1.5, -1.5];
    setLine(conLine, P.x(p1[0]), P.y(p1[1]), P.x(p2[0]), P.y(p2[1]));
    fea.setAttribute("points", [[b - 3.5, 3.5], [b + 1.5, -1.5], [-1, -1.5], [-1, 3.5]].map(function (p) { return P.x(p[0]) + "," + P.y(p[1]); }).join(" "));
    ticks.forEach(function (t, j) {
      var w1 = (b - 3) + (j * 0.75), w2 = b - w1;
      if (w2 > 3.3 || w2 < -1.3 || w1 < -0.9 || w1 > 6.0) { t.setAttribute("data-hide", "1"); return; }
      t.setAttribute("data-hide", "0");
      var x = P.x(w1), y = P.y(w2);
      setLine(t, x, y, x - 22, y + 22);
    });
  }
  var solG = el("g", {}, svg);
  var solDot = el("circle", { r: 9, fill: "#1db584", stroke: "#071510", "stroke-width": 3 }, solG);
  var solLbl = txt(solG, 0, 0, "lbl lbl-g", "", "start");
  var minDot = el("circle", { cx: P.x(3), cy: P.y(1), r: 6, fill: "#8fa89c" }, svg);

  var S = 0.3;
  var T = [P.x(5 / 3), P.y(1 / 3)];
  var forcesG = el("g", {}, svg);
  arrowLine(forcesG, "b", 5, T[0] + 2, T[1] - 2, T[0] + 8 / 3 * S * P.sx, T[1] - 8 / 3 * S * P.sy);
  txt(forcesG, T[0] + 52, T[1] - 52, "lbl lbl-b", "objective wants this way", "start");
  arrowLine(forcesG, "p", 5, T[0] - 2, T[1] + 4, T[0] - 8 / 3 * S * P.sx, T[1] + 8 / 3 * S * P.sy);
  txt(forcesG, 24, T[1] + 70, "lbl lbl-p", "constraint pushes back (μ = 8/3)", "start");
  var balG = el("g", {}, svg);
  // Both arrows start at the solution and point in opposite directions, so they never overlap:
  // grad f points uphill for f (down-left), mu * grad g points the other way (up-right).
  var BX = 8 / 3 * S * P.sx, BY = 8 / 3 * S * P.sy;
  arrowLine(balG, "b", 5, T[0] - 2, T[1] + 2, T[0] - BX, T[1] + BY);
  arrowLine(balG, "p", 5, T[0] + 2, T[1] - 2, T[0] + BX, T[1] - BY);
  txt(balG, T[0] - BX - 8, T[1] + BY + 14, "lbl lbl-b", "∇f", "end");
  txt(balG, T[0] + BX + 8, T[1] - BY - 6, "lbl lbl-p", "μ∇g", "start");

  var panel = el("g", {}, svg);
  card(panel, 392, 40, 236, 300, "fillG");
  var q = [66, 96, 126, 156, 188, 218, 248, 278].map(function (y, k) { return txt(panel, 510, y, k % 3 === 0 ? "note" : "mono", "", "middle"); });
  function setPanel(lines) { q.forEach(function (n, k) { n.textContent = lines[k] || ""; }); }

  var compG = el("g", {}, svg);
  card(compG, 30, 50, 280, 190, "fillA");
  txt(compG, 170, 82, "lbl lbl-b", "CASE B: INACTIVE", "middle");
  txt(compG, 170, 116, "mono", "g < 0   (g = −2)", "middle");
  txt(compG, 170, 148, "big", "μ = 0", "middle");
  txt(compG, 170, 180, "note", "the constraint is not touching", "middle");
  txt(compG, 170, 198, "note", "the answer; it does nothing", "middle");
  card(compG, 330, 50, 280, 190, "fillB");
  txt(compG, 470, 82, "lbl lbl-p", "CASE A: ACTIVE", "middle");
  txt(compG, 470, 116, "mono", "g = 0   (on the edge)", "middle");
  txt(compG, 470, 148, "big", "μ = 8/3 > 0", "middle");
  txt(compG, 470, 180, "note", "the constraint is holding", "middle");
  txt(compG, 470, 198, "note", "the answer back", "middle");
  txt(compG, 320, 282, "big", "μ × g = 0  in both cases", "middle");
  txt(compG, 320, 310, "note", "complementary slackness: one of the two factors is always zero", "middle");

  var sumG = el("g", {}, svg);
  [["1  Primal feasibility", "g(w) ≤ 0", "the point obeys the constraint"], ["2  Dual feasibility", "μ ≥ 0", "a limit can only push inward"], ["3  Complementary slackness", "μ · g(w) = 0", "inactive → μ = 0; active → g = 0"], ["4  Stationarity", "∇f + μ∇g = 0", "objective and constraint pushes balance"]].forEach(function (b, i) {
    var x = 30 + (i % 2) * 300, y = 50 + Math.floor(i / 2) * 130;
    card(sumG, x, y, 280, 112, i === 3 ? "fillB" : "fillG");
    txt(sumG, x + 140, y + 28, "lbl lbl-y", b[0], "middle");
    txt(sumG, x + 140, y + 62, "big", b[1], "middle");
    txt(sumG, x + 140, y + 90, "note", b[2], "middle");
  });
  txt(sumG, 320, 330, "lbl lbl-g", "case A (μ = 8/3) and case B (μ = 0) satisfy all four  ✓", "middle");

  var mlG = el("g", {}, svg);
  [["Support vector machines", "the training problem is a constrained optimization"], ["Regularized models", "a limit on weight size, solved with the same ideas"], ["Convex problems", "a point satisfying KKT is a global minimum"]].forEach(function (b, i) {
    var y = 40 + i * 86;
    card(mlG, 80, y, 480, 70, i === 2 ? "fillB" : "fillG");
    txt(mlG, 320, y + 30, "big", b[0], "middle");
    txt(mlG, 320, y + 54, "note", b[1], "middle");
  });
  txt(mlG, 320, 316, "lbl lbl-y", "non-convex problems: KKT points are candidates, not guaranteed optima", "middle");

  function render(index, id) {
    var i = index;
    var onPlane = i <= 5 || i === 7;
    show(plane, onPlane);
    var budget = i === 3 ? 6 : 2;
    setBudget(budget);
    show(fea, i >= 2 && onPlane);
    show(conG, i >= 1 && onPlane);
    conLbl.textContent = budget === 6 ? "g = w1 + w2 − 6 ≤ 0" : "g = w1 + w2 − 2 ≤ 0";
    conLbl.setAttribute("x", 22); conLbl.setAttribute("y", 326);
    show(conLbl, i >= 1 && onPlane);
    ticks.forEach(function (t) { var hide = t.getAttribute("data-hide") === "1"; t.setAttribute("opacity", (i >= 1 && i <= 4 && onPlane && !hide) ? "1" : "0"); });
    show(minDot, i <= 3);
    show(solG, (i === 3 || i === 4 || i === 5 || i === 7) && onPlane);
    show(forcesG, i === 5); show(balG, i === 7);
    show(panel, onPlane);
    show(compG, i === 6); show(sumG, i === 8); show(mlG, i === 9);
    if (i === 3) { solDot.setAttribute("cx", P.x(3)); solDot.setAttribute("cy", P.y(1)); solLbl.setAttribute("x", P.x(3) - 14); solLbl.setAttribute("y", P.y(1) + 40); solLbl.textContent = "(3, 1) inside: g = −2"; }
    if (i === 4 || i === 5 || i === 7) { solDot.setAttribute("cx", T[0]); solDot.setAttribute("cy", T[1]); solLbl.setAttribute("x", 22); solLbl.setAttribute("y", 306); solLbl.setAttribute("text-anchor", "start"); solLbl.textContent = i === 4 ? "(5/3, 1/3) on the edge: g = 0" : ""; }
    if (i === 3) solLbl.setAttribute("text-anchor", "end");
    setPanel([]);
    if (i === 0) setPanel(["objective", "(w1−3)² + 2(w2−1)²", "", "unconstrained best:", "(3, 1)"]);
    if (i === 1) setPanel(["inequality constraint", "g(w) = w1 + w2 − 2", "g(w) ≤ 0", "", "allowed side: ticks"]);
    if (i === 2) setPanel(["feasible region", "g ≤ 0: an AREA", "", "the answer may be", "on the edge or inside"]);
    if (i === 3) setPanel(["case B: budget 6", "(3, 1): 3 + 1 = 4 ≤ 6", "g = −2 < 0", "INACTIVE", "multiplier μ = 0"]);
    if (i === 4) setPanel(["case A: budget 2", "best allowed point:", "(5/3, 1/3)", "g = 0   ACTIVE", "multiplier μ = 8/3"]);
    if (i === 5) setPanel(["multiplier μ ≥ 0", "objective pulls outward", "constraint holds it back", "strength μ = 8/3", "a limit never pulls inward"]);
    if (i === 7) setPanel(["stationarity", "∇f = [−8/3, −8/3]", "μ∇g = [8/3, 8/3]", "sum = [0, 0]", "the pushes balance"]);
  }
