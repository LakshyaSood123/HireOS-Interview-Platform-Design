  var steps = [
    { id: "loss-surface", label: "The loss landscape from above", caption: "Look down on the loss of two weights like a hiking map. Each ring joins points with the same loss. The lowest point, the minimum, is in the middle at (3, 1)." },
    { id: "current-point", label: "Where the model is now", caption: "The model's weights are currently (w1, w2) = (1, 3), on a high ring where the loss is 12. Which way should we move to go down?" },
    { id: "slope-x", label: "The slope along w1", caption: "Along w1 the slope is ∂L/∂w1 = −4. The uphill direction along w1 is to the left, so this arrow points left. It has length 4." },
    { id: "slope-y", label: "The slope along w2", caption: "Along w2 the slope is ∂L/∂w2 = +8. Uphill along w2 is up, so this arrow points up, and it is twice as long: w2 is the steeper direction." },
    { id: "gradient-vector", label: "Combine them into the gradient", caption: "Put the two partial derivatives together: ∇L = [−4, 8]. The gradient is one arrow whose parts are the two slopes. It starts at the current point." },
    { id: "steepest-up", label: "The gradient points steepest uphill", caption: "Of all the directions we could step, the gradient points the way the loss grows fastest. Its length, about 8.9, tells how steep that climb is." },
    { id: "negative-gradient", label: "Flip it to go downhill", caption: "To lower the loss fastest, go the opposite way: −∇L = [4, −8]. The weights should move right in w1 and down in w2." },
    { id: "ml-connection", label: "Repeat from the new point", caption: "Take a small step against the gradient, recompute the gradient at the new point, and step again. The path curves in toward the minimum. This is gradient descent." }
  ];

  var P = makeGraph(50, 325, 60, 70);
  clipTo("planeclip", 30, 40, 410, 296);
  var G = [-4, 8];
  var S = 0.12; // arrow length per unit of slope, in weight units
  var px0 = P.x(1), py0 = P.y(3);

  var plane = el("g", {}, svg);
  card(plane, 30, 40, 410, 296, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var rings = el("g", { "clip-path": "url(#planeclip)" }, plane);
  [1, 4, 8, 12, 18].forEach(function (c) { ring(rings, P.x(3), P.y(1), Math.sqrt(c) * P.sx, Math.sqrt(c / 2) * P.sy); });
  drawAxes(plane, P, 6.5, 4.2, [0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4]);
  txt(plane, P.x(6.5), P.y(0) + 28, "note", "w1", "end");
  txt(plane, P.x(0) + 8, P.y(4.2) + 10, "note", "w2", "start");
  el("circle", { cx: P.x(3), cy: P.y(1), r: 5, fill: "#1db584", stroke: "#071510", "stroke-width": 2 }, plane);
  txt(plane, P.x(3) + 9, P.y(1) + 18, "lbl lbl-g", "minimum", "start");
  txt(plane, P.x(4.9), P.y(2.4), "note", "higher loss", "middle");
  txt(plane, P.x(2.1), P.y(1.5), "note", "lower", "middle");

  // Fan of test directions (steepest-up step).
  var fan = el("g", {}, svg);
  for (var k = 0; k < 8; k++) {
    var ang = (k * Math.PI) / 4;
    var dx = Math.cos(ang), dy = -Math.sin(ang);
    var val = G[0] * (dx / P.sx) + G[1] * (-dy / P.sy);
    var fa = arrow(fan, val > 0 ? "r" : "g", 2);
    fa.setAttribute("opacity", "0.6");
    setLine(fa, px0 + dx * 12, py0 + dy * 12, px0 + dx * 40, py0 + dy * 40);
  }

  var dashX = el("line", { class: "dash", stroke: "#f472b6", "stroke-width": 2 }, svg);
  var dashY = el("line", { class: "dash", stroke: "#e2b44a", "stroke-width": 2 }, svg);
  var arrX = arrow(svg, "p", 4);
  var arrY = arrow(svg, "y", 4);
  var arrG = arrow(svg, "b", 6);
  var arrN = arrow(svg, "g", 6);
  var gx = px0 + G[0] * S * P.sx, gy = py0 - G[1] * S * P.sy;
  var nx = px0 - G[0] * S * P.sx, ny = py0 + G[1] * S * P.sy;
  setLine(arrX, px0, py0, gx, py0);
  setLine(arrY, px0, py0, px0, gy);
  setLine(dashX, gx, py0, gx, gy);
  setLine(dashY, px0, gy, gx, gy);
  setLine(arrG, px0, py0, gx, gy);
  setLine(arrN, px0, py0, nx, ny);
  var lblX = txt(svg, gx + 4, py0 + 20, "lbl lbl-p", "−4 (left)", "middle");
  var lblY = txt(svg, px0 + 8, py0 - 24, "lbl lbl-y", "+8 (up)", "start");
  var lblG = txt(svg, px0 + 18, gy + 4, "lbl lbl-b", "gradient [−4, 8]", "start");
  var lblN = txt(svg, nx + 12, ny + 4, "lbl lbl-g", "−gradient [4, −8]", "start");
  var ghost = el("circle", { r: 6, fill: "#1db584", stroke: "#071510", "stroke-width": 2 }, svg);

  // Descent trail.
  var trail = el("g", {}, svg);
  var tpts = [[1, 3]];
  for (var s = 0; s < 6; s++) {
    var q = tpts[tpts.length - 1];
    tpts.push([q[0] - 0.1 * 2 * (q[0] - 3), q[1] - 0.1 * 4 * (q[1] - 1)]);
  }
  var trailLine = el("polyline", { fill: "none", stroke: "#1db584", "stroke-width": 2.5 }, trail);
  trailLine.setAttribute("points", tpts.map(function (q) { return P.x(q[0]) + "," + P.y(q[1]); }).join(" "));
  var trailDots = tpts.map(function (q) { return el("circle", { cx: P.x(q[0]), cy: P.y(q[1]), r: 4.5, fill: "#1db584", stroke: "#071510", "stroke-width": 1.5 }, trail); });

  var me = el("circle", { cx: px0, cy: py0, r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, svg);
  var meLbl = txt(svg, px0 + 12, py0 + 22, "lbl", "now (1, 3)", "start");

  var panel = el("g", {}, svg);
  card(panel, 452, 40, 176, 150, "fillG");
  var p1 = txt(panel, 540, 66, "note", "", "middle");
  var p2 = txt(panel, 540, 94, "mono", "", "middle");
  var p3 = txt(panel, 540, 120, "mono", "", "middle");
  var p4 = txt(panel, 540, 150, "big", "", "middle");
  var p5 = txt(panel, 540, 174, "note", "", "middle");

  function render(index, id) {
    var i = index;
    show(me, i >= 1);
    show(meLbl, i === 1);
    show(arrX, i >= 2 && i <= 4); show(lblX, i >= 2 && i <= 4);
    show(arrY, i >= 3 && i <= 4); show(lblY, i >= 3 && i <= 4);
    show(dashX, i === 4); show(dashY, i === 4);
    show(arrG, i >= 4 && i <= 5); show(lblG, i >= 4 && i <= 5);
    show(fan, i === 5);
    show(arrN, i === 6); show(lblN, i === 6);
    show(trail, i === 7);
    show(ghost, false);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = "";
    me.setAttribute("cx", px0); me.setAttribute("cy", py0);
    if (i === 0) { p1.textContent = "rings = equal loss"; p2.textContent = "minimum at (3, 1)"; }
    else if (i === 1) { p1.textContent = "current weights"; p2.textContent = "(w1, w2) = (1, 3)"; p3.textContent = "L = 12"; }
    else if (i === 2) { p1.textContent = "slope along w1"; p2.textContent = "∂L/∂w1 = −4"; p3.textContent = "uphill: left"; }
    else if (i === 3) { p1.textContent = "slope along w2"; p2.textContent = "∂L/∂w2 = +8"; p3.textContent = "uphill: up"; }
    else if (i === 4) { p1.textContent = "the gradient"; p2.textContent = "∇L = [−4, 8]"; p3.textContent = "one entry per weight"; }
    else if (i === 5) { p1.textContent = "steepest UPHILL"; p2.textContent = "length ≈ 8.9"; p3.textContent = "red: uphill moves"; p4.textContent = ""; p5.textContent = "green: downhill moves"; }
    else if (i === 6) {
      p1.textContent = "go DOWNHILL";
      p2.textContent = "−∇L = [4, −8]";
      p3.textContent = "w1 up, w2 down";
      show(ghost, true);
      anim("ghost", 1600, function (e) {
        ghost.setAttribute("cx", lerp(px0, nx, e)); ghost.setAttribute("cy", lerp(py0, ny, e));
        if (e >= 1) show(ghost, false);
      });
    } else {
      p1.textContent = "step, recompute, step";
      p2.textContent = "(1, 3) → (1.4, 2.2)";
      p3.textContent = "→ (1.72, 1.72) …";
      p4.textContent = "toward (3, 1)";
      anim("me", 2600, function (e) {
        var t = e * (tpts.length - 1), j = Math.min(tpts.length - 2, Math.floor(t)), f = t - j;
        me.setAttribute("cx", lerp(P.x(tpts[j][0]), P.x(tpts[j + 1][0]), f));
        me.setAttribute("cy", lerp(P.y(tpts[j][1]), P.y(tpts[j + 1][1]), f));
      });
    }
  }
