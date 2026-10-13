  var steps = [
    { id: "objective-contours", label: "The objective and its contours", caption: "Same objective, L = f(w1, w2) = (w1 − 3)² + 2(w2 − 1)². The rings join points of equal loss; the middle (3, 1) is the lowest." },
    { id: "constraint-curve", label: "An equality constraint", caption: "Now only points ON the yellow line g(w1, w2) = w1 + w2 = 2 are allowed. We want the lowest contour that still touches that line." },
    { id: "candidate-point", label: "A candidate on the line", caption: "Take (2, 0) on the line. Its loss is 3, and the contour L = 3 (yellow) passes through it. Notice that this contour CROSSES the line: part of the line lies inside the ring, where the loss is lower than 3." },
    { id: "move-along-constraint", label: "Slide along the constraint", caption: "Move along the line toward the inside of the ring. The contour through the moving point shrinks as the loss falls: 3.0, 2.8, 2.7 ..." },
    { id: "better-point", label: "A better point", caption: "At (5/3, 1/3) the loss is 8/3 ≈ 2.67, lower than 3. Can we do better by sliding further? Let us see what the contour does here." },
    { id: "tangent-point", label: "The contour just touches the line", caption: "At (5/3, 1/3) the contour L = 8/3 touches the line at exactly one point: they are tangent. Slide either way and the loss goes up. This is the best point on the constraint." },
    { id: "gradient-objective", label: "The objective's gradient", caption: "The gradient of the objective, ∇f = [−8/3, −8/3] here, points uphill and is perpendicular to the contour." },
    { id: "gradient-constraint", label: "The constraint's gradient", caption: "The constraint g = w1 + w2 has gradient ∇g = [1, 1], perpendicular to the constraint line." },
    { id: "parallel-gradients", label: "The gradients are parallel", caption: "Tangent curves share a direction, so their perpendiculars do too: ∇f = λ∇g. Here [−8/3, −8/3] = λ[1, 1] gives λ = −8/3. The number λ is the Lagrange multiplier." },
    { id: "lagrange-form", label: "The Lagrangian", caption: "Pack it into one function: L(w1, w2, λ) = f − λ(g − c). Setting its derivatives to zero gives ∇f = λ∇g and g = c. (Many books write + λ(g − c); that only flips the sign of λ.)" }
  ];

  var P = makeGraph(70, 250, 50, 55);
  clipTo("lgclip", 10, 40, 370, 300);
  var plane = el("g", {}, svg);
  card(plane, 10, 40, 370, 300, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var clipped = el("g", { "clip-path": "url(#lgclip)" }, plane);
  [1, 6, 12, 20].forEach(function (c) { levelEllipse(clipped, P, c, "contour"); });
  var dyn = levelEllipse(clipped, P, 3, "contour-hi");
  var tan = levelEllipse(clipped, P, 8 / 3, "contour-hi");
  tan.style.stroke = "#1db584";
  drawAxes(plane, P, 6.2, 3.3, [0, 1, 2, 3, 4, 5, 6], [1, 2, 3]);
  txt(plane, P.x(6.2), P.y(0) + 28, "note", "w1", "end");
  txt(plane, P.x(0) + 8, P.y(3.3) + 12, "note", "w2", "start");
  var minDot = el("circle", { cx: P.x(3), cy: P.y(1), r: 5, fill: "#8fa89c" }, svg);

  var conG = el("g", {}, svg);
  var conLine = el("line", { stroke: "#e2b44a", "stroke-width": 5, "stroke-linecap": "round" }, conG);
  setLine(conLine, P.x(-1), P.y(3), P.x(3.5), P.y(-1.5));
  txt(conG, P.x(-0.5), P.y(2.5) - 12, "lbl lbl-y", "constraint: w1 + w2 = 2", "start");

  var pt = el("circle", { r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var ptLbl = txt(svg, 0, 0, "lbl", "", "start");
  var tgG = el("g", {}, svg);
  el("circle", { cx: P.x(5 / 3), cy: P.y(1 / 3), r: 13, fill: "none", stroke: "#1db584", "stroke-width": 4 }, tgG);
  var tgLbl = txt(tgG, P.x(5 / 3) + 18, P.y(1 / 3) + 40, "lbl lbl-g", "touch at one point", "start");

  var T = [P.x(5 / 3), P.y(1 / 3)];
  var SC = 0.3;
  var gfG = el("g", {}, svg);
  arrowLine(gfG, "b", 5, T[0], T[1], T[0] + (-8 / 3) * SC * P.sx, T[1] + (8 / 3) * SC * P.sy);
  var gfLbl = txt(gfG, T[0] - 90, T[1] + 84, "lbl lbl-b", "∇f = [−8/3, −8/3]", "start");
  var ggG = el("g", {}, svg);
  arrowLine(ggG, "p", 5, T[0], T[1], T[0] + 0.8 * P.sx, T[1] - 0.8 * P.sy);
  txt(ggG, T[0] + 46, T[1] - 52, "lbl lbl-p", "∇g = [1, 1]", "start");
  var parG = el("g", { "clip-path": "url(#lgclip)" }, svg);
  el("line", { x1: T[0] - 150, y1: T[1] + 150, x2: T[0] + 120, y2: T[1] - 120, stroke: "#c9dccf", "stroke-width": 2, "stroke-dasharray": "6 4" }, parG);
  txt(parG, T[0] + 74, T[1] - 112, "lbl", "same line:", "start");
  txt(parG, T[0] + 74, T[1] - 98, "lbl", "parallel", "start");

  var panel = el("g", {}, svg);
  card(panel, 392, 40, 236, 300, "fillG");
  var q = [66, 96, 124, 152, 184, 214, 244, 274].map(function (y, k) { return txt(panel, 510, y, k % 3 === 0 ? "note" : "mono", "", "middle"); });
  function setPanel(lines) { q.forEach(function (n, k) { n.textContent = lines[k] || ""; }); }

  function loss(p) { return L2(p[0], p[1]); }
  function setDyn(c) { dyn.setAttribute("rx", Math.sqrt(c) * P.sx); dyn.setAttribute("ry", Math.sqrt(c / 2) * P.sy); }
  function putPt(w1) {
    var w2 = 2 - w1;
    pt.setAttribute("cx", P.x(w1)); pt.setAttribute("cy", P.y(w2));
    ptLbl.setAttribute("x", P.x(w1) + 12); ptLbl.setAttribute("y", P.y(w2) + 24);
    return L2(w1, w2);
  }

  function render(index, id) {
    var i = index;
    show(conG, i >= 1);
    show(minDot, i <= 4);
    show(dyn, i >= 2 && i <= 4);
    show(tan, i >= 5);
    show(pt, i >= 2 && i <= 5);
    show(ptLbl, i >= 2 && i <= 4);
    show(tgG, i >= 5 && i <= 8); show(tgLbl, i === 5);
    show(gfG, i >= 6 && i <= 8);
    show(ggG, i >= 7 && i <= 8);
    show(parG, i === 8);
    setPanel([]);
    if (i === 0) setPanel(["objective f", "(w1−3)² + 2(w2−1)²", "", "contours: equal loss", "minimum at (3, 1)"]);
    if (i === 1) setPanel(["constraint g = c", "w1 + w2 = 2", "", "only points ON the line", "are allowed"]);
    if (i === 2) { var l0 = putPt(2); setDyn(l0); ptLbl.textContent = "(2, 0)  L = 3"; setPanel(["candidate on the line", "(2, 0)", "loss = 3", "contour L = 3 CROSSES", "the line"]); }
    if (i === 3) {
      setPanel(["sliding along the line"]);
      anim("slide", 2600, function (e) {
        var w1 = lerp(2, 5 / 3, e), l = putPt(w1);
        setDyn(l);
        ptLbl.textContent = "L = " + fmt(l, 2);
        setPanel(["sliding along the line", "(" + fmt(w1, 2) + ", " + fmt(2 - w1, 2) + ")", "loss = " + fmt(l, 3), "the contour shrinks"]);
      });
    }
    if (i === 4) { var l1 = putPt(5 / 3); setDyn(l1); ptLbl.textContent = "L = 8/3 ≈ 2.67"; setPanel(["better point", "(5/3, 1/3)", "loss = 8/3 ≈ 2.67", "smaller than 3"]); }
    if (i === 5) { putPt(5 / 3); setPanel(["tangent", "contour L = 8/3 touches", "the line at one point", "slide either way:", "the loss rises"]); }
    if (i === 6) setPanel(["gradient of f", "∇f = [2(w1−3), 4(w2−1)]", "= [−8/3, −8/3]", "uphill,", "⊥ to the contour"]);
    if (i === 7) setPanel(["gradient of g", "g = w1 + w2", "∇g = [1, 1]", "⊥ to the constraint line"]);
    if (i === 8) setPanel(["parallel gradients", "∇f = λ ∇g", "[−8/3, −8/3] = λ [1, 1]", "λ = −8/3", "(the multiplier)"]);
    if (i === 9) {
      show(pt, false); show(tgG, false); show(gfG, false); show(ggG, false); show(parG, false);
      setPanel(["Lagrangian", "L(w1,w2,λ) = f − λ(g − c)", "∂L/∂w = 0  →  ∇f = λ∇g", "∂L/∂λ = 0  →  g = c", "(+λ(g − c): sign flips λ)", "ties objective + constraint"]);
    }
  }
