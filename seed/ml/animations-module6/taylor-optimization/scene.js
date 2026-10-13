  var steps = [
    { id: "objective", label: "The objective, seen from one point", caption: "Our objective is still L(w) = (w − 3)². An optimizer cannot see the whole curve. It sees one point and what it can measure there. Taylor approximations turn that local information into a simple model." },
    { id: "current-point", label: "The current point", caption: "We stand at w = 0, where the loss is L = 9. Everything we build is a model of the objective near this point." },
    { id: "first-order-view", label: "First-order model: the tangent line", caption: "Using only the slope: L(0 + Δ) ≈ 9 − 6Δ, the tangent line. It says the loss keeps falling the further we go. Gradient descent trusts this picture for small steps." },
    { id: "gradient", label: "The gradient is the slope", caption: "The slope L'(0) = −6 is the gradient. Move Δ = 1 to the right and the first-order model says the loss falls by 6. It is exactly the information gradient descent uses." },
    { id: "curvature", label: "Curvature: how the slope changes", caption: "The slope itself changes as we move: −6 at w = 0, −4 at 1, −2 at 2, 0 at 3. It rises by 2 per unit. That rate of change of the slope is the curvature, L'' = 2." },
    { id: "second-order-view", label: "Second-order model: add the bend", caption: "Add the curvature term: L(0 + Δ) ≈ 9 − 6Δ + ½ · 2 · Δ² = 9 − 6Δ + Δ². Unlike the line, this model bends back up and has a bottom at Δ = 3, where it predicts a loss of 0." },
    { id: "compare-local-models", label: "Compare the two local models", caption: "Step Δ = 0.6: first order says 5.4, second order 5.76 (true 5.76). Giant step Δ = 6: first order says −27, impossible; second order says 9 (true 9). Curvature tells how far a step can be trusted." },
    { id: "optimization-connection", label: "What optimizers do with it", caption: "First-order methods use the slope and rely on small steps. Second-order information can suggest better steps: here Δ = −L'/L'' = 3 jumps straight to the minimum. It costs more to compute, especially with many parameters." }
  ];

  function Lw(w) { return (w - 3) * (w - 3); }
  var g = makeGraph(50, 250, 58, 24);
  var graphG = el("g", {}, svg);
  drawAxes(graphG, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(graphG, g.x(6.3), g.y(0) + 28, "note", "w   (Δ = distance from the current point w = 0)", "end");
  
  el("path", { class: "curve", d: curveD(g, Lw, 0, 6, 70) }, graphG);

  var tanG = el("g", {}, svg);
  var tl = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-linecap": "round" }, tanG);
  setLine(tl, g.x(0), g.y(9), g.x(2.1), g.y(9 - 6 * 2.1));
  var tlLbl = txt(tanG, g.x(1.2), g.y(9 - 6 * 1.2) - 14, "lbl lbl-y", "first order: 9 − 6Δ", "start");
  var trig = el("g", {}, svg);
  el("line", { x1: g.x(0), y1: g.y(9), x2: g.x(1), y2: g.y(9), stroke: "#c9dccf", "stroke-width": 2, "stroke-dasharray": "5 3" }, trig);
  el("line", { x1: g.x(1), y1: g.y(9), x2: g.x(1), y2: g.y(3), stroke: "#f472b6", "stroke-width": 3, "stroke-dasharray": "5 3" }, trig);
  txt(trig, g.x(0.5), g.y(9) - 8, "lbl", "Δ = 1", "middle");
  txt(trig, g.x(1) + 8, g.y(6) + 4, "lbl lbl-p", "falls by 6", "start");
  var slopesG = el("g", {}, svg);
  [0, 1, 2, 3].forEach(function (w) {
    var m = 2 * (w - 3);
    var ln = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, slopesG);
    setLine(ln, g.x(w - 0.35), g.y(Lw(w) - m * 0.35), g.x(w + 0.35), g.y(Lw(w) + m * 0.35));
    el("circle", { cx: g.x(w), cy: g.y(Lw(w)), r: 4.5, fill: "#1db584" }, slopesG);
    txt(slopesG, g.x(w) + 10, g.y(Lw(w)) - 10, "lbl lbl-g", "slope " + m, "start");
  });
  var parG = el("g", {}, svg);
  el("path", { d: curveD(g, function (d) { return 9 - 6 * d + d * d; }, 0, 6, 70), fill: "none", stroke: "#f472b6", "stroke-width": 3, "stroke-dasharray": "7 4" }, parG);
  el("circle", { cx: g.x(3), cy: g.y(0), r: 8, fill: "none", stroke: "#f472b6", "stroke-width": 3 }, parG);
  txt(parG, g.x(3) + 12, g.y(0) - 14, "lbl lbl-p", "bottom at Δ = 3", "start");
  var parLbl = txt(svg, g.x(4.4), g.y(5), "lbl lbl-p", "second order: 9 − 6Δ + Δ²", "start");
  var me = el("circle", { cx: g.x(0), cy: g.y(9), r: 9, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var meLbl = txt(svg, g.x(0) + 14, g.y(9) - 10, "lbl", "w = 0, L = 9", "start");

  var panel = el("g", {}, svg);
  card(panel, 424, 36, 204, 200, "fillG");
  txt(panel, 526, 62, "lbl", "predicted loss after step Δ", "middle");
  txt(panel, 446, 90, "note", "Δ", "middle");
  txt(panel, 486, 90, "lbl lbl-y", "1st", "middle");
  txt(panel, 530, 90, "lbl lbl-p", "2nd", "middle");
  txt(panel, 580, 90, "lbl lbl-g", "actual", "middle");
  var TAB = [[0.6, "5.4", "5.76", "5.76"], [3, "−9", "0", "0"], [6, "−27", "9", "9"]];
  TAB.forEach(function (r, i) {
    var y = 122 + i * 34;
    txt(panel, 446, y, "mono", String(r[0]), "middle");
    txt(panel, 486, y, "mono", r[1], "middle");
    txt(panel, 530, y, "mono", r[2], "middle");
    txt(panel, 580, y, "mono", r[3], "middle");
  });
  txt(panel, 526, 214, "note", "first order can go below 0 (impossible)", "middle");
  var mlG = el("g", {}, svg);
  card(mlG, 40, 60, 260, 150, "fillA");
  txt(mlG, 170, 94, "lbl lbl-y", "FIRST ORDER", "middle");
  txt(mlG, 170, 124, "big", "slope only", "middle");
  txt(mlG, 170, 152, "note", "gradient descent: small steps", "middle");
  txt(mlG, 170, 172, "note", "cheap per step", "middle");
  card(mlG, 340, 60, 260, 150, "fillB");
  txt(mlG, 470, 94, "lbl lbl-p", "SECOND ORDER", "middle");
  txt(mlG, 470, 124, "big", "slope + curvature", "middle");
  txt(mlG, 470, 152, "note", "better step: Δ = −L'/L'' = 3", "middle");
  txt(mlG, 470, 172, "note", "costly with many parameters", "middle");
  txt(mlG, 320, 250, "lbl lbl-y", "local approximations guide every update", "middle");

  function render(index, id) {
    var i = index;
    show(graphG, i <= 6);
    show(me, i >= 1 && i <= 6); show(meLbl, i === 1);
    tanG.setAttribute("opacity", (i >= 2 && i <= 6) ? (i >= 5 ? "0.4" : "1") : "0"); show(tlLbl, i === 2);
    show(trig, i === 3);
    show(slopesG, i === 4);
    show(parG, i >= 5 && i <= 6); show(parLbl, i === 5);
    show(panel, i === 6);
    show(mlG, i === 7);
  }
