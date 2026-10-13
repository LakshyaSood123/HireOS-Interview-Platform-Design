  var steps = [
    { id: "two-parameters", label: "A model with two parameters", caption: "Real models have many parameters. Here there are two, w1 and w2, so a setting of the model is a point on a plane. Each point has a score from the objective." },
    { id: "loss-surface", label: "The objective is a surface", caption: "The loss L(w1, w2) = (w1 − 3)² + 2(w2 − 1)² gives every point a height: a bowl-shaped surface. We look at it from above; the lighter the shading, the lower the loss." },
    { id: "contours", label: "Contours show equal loss", caption: "The rings are contours, like lines on a hiking map: every point on one ring has the same loss (2, 6, 12). The lowest point of the bowl, the minimum, is the middle at (3, 1)." },
    { id: "current-point", label: "Where the model is now", caption: "The model starts at (w1, w2) = (1, 3), on the ring where the loss is 12. We want to move toward the middle." },
    { id: "gradient", label: "The gradient vector", caption: "The gradient has one partial derivative per parameter: ∇L = [2(w1 − 3), 4(w2 − 1)] = [−4, 8] here. It points steeply uphill: left in w1 and up in w2." },
    { id: "negative-gradient", label: "Downhill is the negative gradient", caption: "−∇L = [4, −8] points downhill: right in w1, down in w2. It is the steepest way down from this point." },
    { id: "update-both", label: "Update both parameters at once", caption: "θ_new = θ_old − η ∇L(θ) with η = 0.1: w1 moves by +0.4 and w2 by −0.8 in the same step, from (1, 3) to (1.4, 2.2). The loss falls from 12 to 5.44." },
    { id: "optimization-path", label: "Repeat: the path to the minimum", caption: "Recompute the gradient at each new point and step again. The path curves: w2 is the steeper direction, so it gets close to 1 sooner while w1 is still catching up." },
    { id: "minimum", label: "Reaching the minimum", caption: "After enough steps the path arrives near the middle at (3, 1), where the gradient is [0, 0] and the loss is about 0. With thousands of parameters the idea is identical, but we can no longer draw it." }
  ];

  var P = makeGraph(50, 325, 60, 70);
  clipTo("planeclip", 30, 40, 410, 296);
  var ETA = 0.1;
  var pts = [[1, 3]];
  for (var s = 0; s < 14; s++) {
    var q = pts[pts.length - 1], gg = G2(q[0], q[1]);
    pts.push([q[0] - ETA * gg[0], q[1] - ETA * gg[1]]);
  }

  var planeG = el("g", {}, svg);
  card(planeG, 30, 40, 410, 296, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var fillsG = el("g", { "clip-path": "url(#planeclip)" }, planeG);
  [[18, 0.05], [12, 0.08], [6, 0.12], [2, 0.2]].forEach(function (c) {
    var e = levelEllipse(fillsG, P, c[0], "contour"); e.setAttribute("fill", "rgba(56,189,248," + c[1] + ")");
  });
  drawAxes(planeG, P, 6.5, 4.2, [0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4]);
  txt(planeG, P.x(6.5), P.y(0) + 28, "note", "w1", "end");
  txt(planeG, P.x(0) + 8, P.y(4.2) + 10, "note", "w2", "start");
  var ringLbls = el("g", {}, svg);
  [2, 6, 12].forEach(function (c) { txt(ringLbls, P.x(3), P.y(1 + Math.sqrt(c / 2)) - 6, "lbl", "L = " + c, "middle"); });
  var minDot = el("g", {}, svg);
  el("circle", { cx: P.x(3), cy: P.y(1), r: 6, fill: "#1db584", stroke: "#071510", "stroke-width": 2 }, minDot);
  txt(minDot, P.x(3) + 10, P.y(1) + 18, "lbl lbl-g", "minimum (3, 1)", "start");

  var S = 0.1;
  var x0 = P.x(1), y0 = P.y(3);
  var gradA = arrow(svg, "b", 6);
  setLine(gradA, x0, y0, x0 + (-4) * S * P.sx, y0 - 8 * S * P.sy);
  var gradLbl = txt(svg, x0 + 8, y0 - 62, "lbl lbl-b", "∇L = [−4, 8]", "start");
  var negA = arrow(svg, "g", 6);
  setLine(negA, x0, y0, x0 + 4 * S * P.sx, y0 + 8 * S * P.sy);
  var negLbl = txt(svg, x0 + 4, y0 + 72, "lbl lbl-g", "−∇L = [4, −8]", "start");
  var stepG = el("g", {}, svg);
  var sx1 = P.x(pts[1][0]), sy1 = P.y(pts[1][1]);
  el("line", { x1: x0, y1: y0, x2: sx1, y2: y0, stroke: "#f472b6", "stroke-width": 3, "stroke-dasharray": "5 3" }, stepG);
  el("line", { x1: sx1, y1: y0, x2: sx1, y2: sy1, stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "5 3" }, stepG);
  arrowLine(stepG, "w", 4, x0, y0, sx1 - 2, sy1 - 2);
  txt(stepG, (x0 + sx1) / 2, y0 - 8, "lbl lbl-p", "w1 + 0.4", "middle");
  txt(stepG, sx1 + 8, (y0 + sy1) / 2 + 4, "lbl lbl-y", "w2 − 0.8", "start");

  var trailG = el("g", {}, svg);
  var tLine = el("polyline", { fill: "none", stroke: "#1db584", "stroke-width": 2.5 }, trailG);
  var tDots = pts.map(function (p) { return el("circle", { cx: P.x(p[0]), cy: P.y(p[1]), r: 4, fill: "#1db584", stroke: "#071510", "stroke-width": 1.5 }, trailG); });
  var me = el("circle", { cx: x0, cy: y0, r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var meLbl = txt(svg, x0 + 12, y0 - 10, "lbl", "(1, 3)  L = 12", "start");

  var panel = el("g", {}, svg);
  card(panel, 452, 40, 176, 190, "fillG");
  var p1 = txt(panel, 540, 66, "note", "", "middle");
  var p2 = txt(panel, 540, 96, "mono", "", "middle");
  var p3 = txt(panel, 540, 122, "mono", "", "middle");
  var p4 = txt(panel, 540, 154, "big", "", "middle");
  var p5 = txt(panel, 540, 180, "note", "", "middle");
  var p6 = txt(panel, 540, 200, "note", "", "middle");

  function drawTrail(n) {
    tLine.setAttribute("points", pts.slice(0, n + 1).map(function (p) { return P.x(p[0]).toFixed(1) + "," + P.y(p[1]).toFixed(1); }).join(" "));
    tDots.forEach(function (d, k) { d.setAttribute("opacity", k <= n ? "1" : "0"); });
    me.setAttribute("cx", P.x(pts[n][0])); me.setAttribute("cy", P.y(pts[n][1]));
    meLbl.setAttribute("x", P.x(pts[n][0]) + 12); meLbl.setAttribute("y", P.y(pts[n][1]) - 10);
    meLbl.textContent = "(" + fmt(pts[n][0], 2) + ", " + fmt(pts[n][1], 2) + ")  L = " + fmt(L2(pts[n][0], pts[n][1]), 2);
  }

  function render(index, id) {
    var i = index;
    show(ringLbls, i >= 2);
    show(fillsG, i >= 1);
    show(minDot, i === 8 || i === 2);
    show(me, true); show(meLbl, i >= 3);
    show(gradA, i === 4); show(gradLbl, i === 4);
    show(negA, i === 5); show(negLbl, i === 5);
    show(stepG, i === 6);
    show(trailG, i >= 6);
    show(panel, true);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = ""; p6.textContent = "";
    drawTrail(0);
    show(meLbl, i >= 3 && i <= 5);
    if (i === 0) { p1.textContent = "two parameters"; p2.textContent = "θ = (w1, w2)"; p4.textContent = "a point on a plane"; p5.textContent = "each point has a loss"; }
    if (i === 1) { p1.textContent = "the loss surface"; p2.textContent = "height = loss"; p4.textContent = "a bowl from above"; p5.textContent = "lighter = lower loss"; }
    if (i === 2) { p1.textContent = "contours"; p2.textContent = "rings of equal loss"; p3.textContent = "minimum at (3, 1)"; p4.textContent = "L = 0 there"; }
    if (i === 3) { p1.textContent = "current point"; p2.textContent = "θ = (1, 3)"; p3.textContent = "L = 12"; p4.textContent = "on the L = 12 ring"; }
    if (i === 4) { p1.textContent = "gradient (uphill)"; p2.textContent = "∂L/∂w1 = −4"; p3.textContent = "∂L/∂w2 = +8"; p4.textContent = "∇L = [−4, 8]"; p5.textContent = "one entry per parameter"; }
    if (i === 5) { p1.textContent = "negative gradient"; p2.textContent = "−∇L = [4, −8]"; p4.textContent = "steepest way down"; p5.textContent = "right in w1, down in w2"; }
    if (i === 6) { p1.textContent = "θ_new = θ_old − η ∇L"; p2.textContent = "η = 0.1"; p3.textContent = "(1,3) → (1.4, 2.2)"; p4.textContent = "loss 12 → 5.44"; p5.textContent = "both parameters move"; p6.textContent = "in the same step"; drawTrail(1); }
    if (i === 7) {
      anim("path", 3200, function (e) {
        var n = Math.max(1, Math.round(e * 9));
        drawTrail(n);
        p1.textContent = "after " + n + " steps"; p2.textContent = "θ = (" + fmt(pts[n][0], 2) + ", " + fmt(pts[n][1], 2) + ")"; p3.textContent = "loss " + fmt(L2(pts[n][0], pts[n][1]), 2); p4.textContent = "the path curves"; p5.textContent = "w2 is steeper, so it";
        p6.textContent = "closes in first";
      });
    }
    if (i === 8) {
      drawTrail(14);
      p1.textContent = "after 14 steps"; p2.textContent = "θ = (" + fmt(pts[14][0], 2) + ", " + fmt(pts[14][1], 2) + ")"; p3.textContent = "loss " + fmt(L2(pts[14][0], pts[14][1]), 2); p4.textContent = "near the minimum"; p5.textContent = "gradient ≈ [0, 0]";
    }
  }
