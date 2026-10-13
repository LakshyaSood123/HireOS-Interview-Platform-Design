  var steps = [
    { id: "loss-curve", label: "The objective is a bowl", caption: "Our objective is L(w) = (w − 3)². Training wants the lowest point of this bowl, but a real model cannot see the whole curve: it only knows where it is standing." },
    { id: "start-point", label: "Start somewhere", caption: "Start at w = 0. The loss there is L(0) = 9. That is all we know for sure: our current position and its score." },
    { id: "compute-gradient", label: "Compute the gradient", caption: "The slope under our feet is the gradient: dL/dw = 2(w − 3) = −6 at w = 0. The tangent line shows it. The gradient points uphill: the curve climbs toward the left." },
    { id: "downhill-direction", label: "Downhill is the negative gradient", caption: "To go down we go the opposite way: −gradient = +6, which says move right, toward larger w. The sign of the gradient tells the direction; its size tells how steep the ground is." },
    { id: "take-step", label: "Take a step", caption: "w_new = w_old − η × gradient. With learning rate η = 0.1: w_new = 0 − 0.1 × (−6) = 0.6. The step length is η × 6 = 0.6." },
    { id: "new-point", label: "We are at a new point", caption: "Now w = 0.6 and the loss has fallen from 9 to 5.76. We are lower on the bowl. The gradient here is −4.8, a bit gentler." },
    { id: "repeat", label: "Repeat", caption: "Recompute the gradient at the new point and step again: w = 1.08, then 1.464, 1.771, 2.017. Each step is a little smaller because the ground flattens." },
    { id: "approach-minimum", label: "Approach the minimum", caption: "After 10 steps w ≈ 2.68 and the loss is about 0.10. The point creeps toward w = 3, where the gradient is 0 and the steps shrink to nothing." },
    { id: "ml-connection", label: "This loop trains a model", caption: "Training a model is this loop: compute the loss, compute the gradient of the objective, update the parameters against the gradient, repeat. Gradient descent is an iterative search, not magic." }
  ];

  function Lw(w) { return (w - 3) * (w - 3); }
  function Gw(w) { return 2 * (w - 3); }
  var ETA = 0.1;
  var ws = [0];
  for (var k = 0; k < 10; k++) ws.push(ws[ws.length - 1] - ETA * Gw(ws[ws.length - 1]));

  var g = makeGraph(50, 318, 58, 30);
  var graphG = el("g", {}, svg);
  drawAxes(graphG, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(graphG, g.x(6.3), g.y(0) + 28, "note", "weight w", "end");
  txt(graphG, g.x(0) + 8, g.y(9.8) + 6, "note", "loss L(w)", "start");
  el("path", { class: "curve", d: curveD(g, Lw, 0, 6, 70) }, graphG);

  var trail = ws.map(function (w, i) {
    return el("circle", { cx: g.x(w), cy: g.y(Lw(w)), r: 5, fill: "rgba(226,180,74,0.55)", stroke: "#071510", "stroke-width": 1.5 }, svg);
  });
  var tangent = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  var tanLbl = txt(svg, 0, 0, "lbl lbl-g", "", "start");
  var dirArrow = arrow(svg, "g", 5);
  var dirLbl = txt(svg, 0, 0, "lbl lbl-g", "", "middle");
  var stepArrow = arrow(svg, "y", 5);
  var stepLbl = txt(svg, 0, 0, "lbl lbl-y", "", "middle");
  var dropLine = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, svg);
  var marker = el("circle", { r: 9, fill: "#e2b44a", stroke: "#071510", "stroke-width": 3 }, svg);
  var youLbl = txt(svg, 0, 0, "lbl lbl-y", "you are here", "start");

  var panel = el("g", {}, svg);
  card(panel, 404, 36, 224, 150, "fillG");
  var p1 = txt(panel, 516, 60, "note", "", "middle");
  var p2 = txt(panel, 516, 90, "mono", "", "middle");
  var p3 = txt(panel, 516, 118, "mono", "", "middle");
  var p4 = txt(panel, 516, 150, "big", "", "middle");
  var p5 = txt(panel, 516, 174, "note", "", "middle");

  var mlG = el("g", {}, svg);
  var LOOP = [["1  compute the loss", "L(w) for the data"], ["2  compute the gradient", "which way is uphill?"], ["3  update the parameters", "w ← w − η × gradient"], ["4  repeat", "until the loss stops improving"]];
  LOOP.forEach(function (b, i) {
    var x = 40 + (i % 2) * 290, y = 70 + Math.floor(i / 2) * 110;
    card(mlG, x, y, 260, 80, i === 2 ? "fillB" : "fillG");
    txt(mlG, x + 130, y + 34, "big", b[0], "middle").setAttribute("font-size", "14");
    txt(mlG, x + 130, y + 58, "note", b[1], "middle");
  });
  var l1 = arrow(mlG, "w", 3); setLine(l1, 304, 110, 326, 110);
  var l2 = arrow(mlG, "w", 3); setLine(l2, 170, 154, 170, 176);
  var l3 = arrow(mlG, "w", 3); setLine(l3, 326, 220, 304, 220);
  txt(mlG, 320, 290, "lbl lbl-y", "gradient descent: an iterative search that follows the negative gradient", "middle");

  function put(w, withTangent) {
    var cx = g.x(w), cy = g.y(Lw(w));
    marker.setAttribute("cx", cx); marker.setAttribute("cy", cy);
    youLbl.setAttribute("x", cx + 16); youLbl.setAttribute("y", cy + 24);
    setLine(dropLine, cx, cy, cx, g.y(0));
    var s = Gw(w);
    setLine(tangent, g.x(w - 0.75), g.y(Lw(w) - s * 0.75), g.x(w + 0.75), g.y(Lw(w) + s * 0.75));
    tanLbl.setAttribute("x", g.x(w + 0.8)); tanLbl.setAttribute("y", g.y(Lw(w) + s * 0.8) + 4);
  }
  function trailUpTo(n) { trail.forEach(function (d, i) { d.setAttribute("opacity", i < n ? "1" : "0"); }); }

  function render(index, id) {
    var i = index;
    show(graphG, i <= 7);
    show(marker, i >= 1 && i <= 7);
    show(youLbl, i === 1);
    show(tangent, i >= 2 && i <= 4); show(tanLbl, i === 2);
    show(dirArrow, i === 3); show(dirLbl, i === 3);
    show(stepArrow, i === 4); show(stepLbl, i === 4);
    show(dropLine, i >= 1 && i <= 7);
    show(panel, i >= 2 && i <= 7);
    show(mlG, i === 8);
    trailUpTo(0);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = "";
    if (i >= 1 && i <= 4) put(0, i >= 2);
    if (i === 2) {
      tanLbl.textContent = "slope = −6";
      p1.textContent = "at w = 0"; p2.textContent = "L(0) = 9"; p3.textContent = "gradient = 2(w − 3)"; p4.textContent = "= −6"; p5.textContent = "uphill is to the left";
    }
    if (i === 3) {
      setLine(dirArrow, g.x(0) + 16, g.y(0) - 26, g.x(1.6), g.y(0) - 26);
      dirLbl.setAttribute("x", g.x(0.9)); dirLbl.setAttribute("y", g.y(0) - 36); dirLbl.textContent = "downhill: w should go UP";
      p1.textContent = "negative gradient"; p2.textContent = "−(−6) = +6"; p3.textContent = "so move right"; p4.textContent = "w increases";
    }
    if (i === 4) {
      setLine(stepArrow, g.x(0), g.y(0) - 20, g.x(0.6), g.y(0) - 20);
      stepLbl.setAttribute("x", g.x(0.3)); stepLbl.setAttribute("y", g.y(0) - 32); stepLbl.textContent = "step 0.6";
      p1.textContent = "w_new = w_old − η × gradient"; p2.textContent = "= 0 − 0.1 × (−6)"; p3.textContent = "η = 0.1"; p4.textContent = "w_new = 0.6";
    }
    if (i === 5) {
      trailUpTo(2); put(ws[1], false); show(tangent, false);
      p1.textContent = "after 1 step"; p2.textContent = "w = 0.6"; p3.textContent = "loss 9 → 5.76"; p4.textContent = "lower on the bowl"; p5.textContent = "gradient here: −4.8";
    }
    if (i === 6) {
      anim("trail", 2400, function (e) {
        var n = 1 + Math.round(e * 5);
        trailUpTo(n + 1);
        put(ws[n], false);
        p1.textContent = "after " + n + " steps"; p2.textContent = "w = " + fmt(ws[n], 3); p3.textContent = "loss " + fmt(Lw(ws[n]), 2); p4.textContent = "steps get smaller"; p5.textContent = "gradient " + fmt(Gw(ws[n]), 2);
      });
    }
    if (i === 7) {
      anim("trail2", 2400, function (e) {
        var n = 5 + Math.round(e * 5);
        trailUpTo(n + 1);
        put(ws[n], false);
        p1.textContent = "after " + n + " steps"; p2.textContent = "w = " + fmt(ws[n], 3); p3.textContent = "loss " + fmt(Lw(ws[n]), 3); p4.textContent = "→ approaching 3"; p5.textContent = "gradient " + fmt(Gw(ws[n]), 2);
      });
    }
  }
