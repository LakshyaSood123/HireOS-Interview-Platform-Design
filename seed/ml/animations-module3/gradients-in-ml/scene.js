  var steps = [
    { id: "model-parameters", label: "A tiny model with one weight", caption: "The model is prediction = w × x. The input is x = 2, and the true answer is y = 6, so the best weight is 3. We start at w = 0." },
    { id: "make-prediction", label: "Make a prediction", caption: "With w = 0 the model predicts 0 × 2 = 0. The true answer is 6, so the prediction is far off." },
    { id: "compute-loss", label: "Measure the miss with the loss", caption: "Loss = (prediction − y)² = (0 − 6)² = 36. The graph shows the loss for every possible weight. We are standing high on the left of the bowl." },
    { id: "parameter-change", label: "Change the weight, watch the loss", caption: "Nudge w and the prediction changes, and so does the loss. The loss is a function of the weight. We want to find the weight with the smallest loss." },
    { id: "gradient", label: "The gradient says how the loss reacts", caption: "The slope of the loss with respect to w is 2 × (prediction − y) × x = 2 × (−6) × 2 = −24. Negative: raising w lowers the loss. Large: the ground is steep here." },
    { id: "downhill-direction", label: "Go the opposite way of the slope's sign", caption: "A negative gradient means downhill is to the right. So w should go up. Rule: step against the gradient." },
    { id: "update", label: "Update the weight", caption: "w ← w − η × gradient, with learning rate η = 0.05. New w = 0 − 0.05 × (−24) = 1.2. The prediction is now 2.4 and the loss has fallen from 36 to 12.96." },
    { id: "repeat", label: "Repeat with the new gradient", caption: "Recompute the gradient at the new weight (−14.4) and step again. w goes 1.2 → 1.92 → 2.35 … The gradients shrink as the ground flattens, so the steps shrink too." },
    { id: "learning-connection", label: "This loop is how models learn", caption: "Predict, measure the loss, compute the gradient, update the weights, and repeat. Training a large model is this same loop with millions of weights." }
  ];

  var X = 2, Y = 6, ETA = 0.05;
  function L(w) { return (w * X - Y) * (w * X - Y); }
  function grad(w) { return 2 * (w * X - Y) * X; }
  var ws = [0];
  for (var s = 0; s < 6; s++) ws.push(ws[ws.length - 1] - ETA * grad(ws[ws.length - 1]));

  // Pipeline across the top.
  var pipe = el("g", {}, svg);
  card(pipe, 14, 14, 100, 70, "fillA");
  txt(pipe, 64, 36, "note", "input x", "middle");
  txt(pipe, 64, 68, "big", "2", "middle");
  txt(pipe, 136, 56, "big", "×", "middle");
  var wBox = card(pipe, 158, 14, 110, 70, "fillG");
  txt(pipe, 213, 36, "note", "weight w", "middle");
  var wTxt = txt(pipe, 213, 68, "big", "0.0", "middle");
  var a1 = arrow(pipe, "w", 3); setLine(a1, 270, 49, 306, 49);
  card(pipe, 308, 14, 130, 70, "fillB");
  txt(pipe, 373, 36, "note", "prediction = w × x", "middle");
  var predTxt = txt(pipe, 373, 68, "big", "?", "middle");
  var a2 = arrow(pipe, "w", 3); setLine(a2, 440, 49, 476, 49);
  card(pipe, 478, 14, 148, 70, "fillA");
  txt(pipe, 552, 36, "note", "loss = (prediction − 6)²", "middle");
  var lossTxt = txt(pipe, 552, 68, "big", "?", "middle");
  var target = txt(pipe, 552, 100, "lbl lbl-y", "true answer y = 6", "middle");

  var goal = el("g", {}, svg);
  card(goal, 60, 170, 520, 120, "fillG");
  txt(goal, 320, 204, "lbl", "The goal of training", "middle");
  txt(goal, 320, 232, "note", "find the weight w that makes the loss as small as possible.", "middle");
  txt(goal, 320, 258, "note", "Here we can see the answer is w = 3, but a real model has to FIND it.", "middle");

  // Loss graph (bottom left).
  var g = makeGraph(52, 336, 75, 5.2);
  var gr = el("g", {}, svg);
  drawAxes(gr, g, 4.2, 38, [0, 1, 2, 3, 4], [0, 12, 24, 36]);
  txt(gr, g.x(4.2) + 8, g.y(0) + 4, "note", "weight w", "start");
  txt(gr, g.x(0) + 8, g.y(38) + 4, "note", "loss", "start");
  el("path", { class: "curve", d: curveD(g, L, 0, 4, 60) }, gr);
  var tan = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  setLine(tan, g.x(-0.1), g.y(36 + 24 * 0.1), g.x(0.7), g.y(36 - 24 * 0.7));
  var tanLbl = txt(svg, g.x(0.75), g.y(36 - 24 * 0.7) + 2, "lbl lbl-g", "slope −24", "start");
  var dirArrow = arrow(svg, "g", 5);
  setLine(dirArrow, g.x(0) + 14, g.y(36) - 22, g.x(1.1), g.y(36) - 22);
  var dirLbl = txt(svg, g.x(0.6), g.y(36) - 32, "lbl lbl-g", "w should go UP", "middle");
  var trail = el("g", {}, svg);
  var trailDots = ws.map(function (w, i) { return el("circle", { cx: g.x(w), cy: g.y(L(w)), r: 4.5, fill: "#38bdf8", stroke: "#071510", "stroke-width": 1.5 }, trail); });
  var trailLine = el("polyline", { fill: "none", stroke: "#38bdf8", "stroke-width": 2, "stroke-dasharray": "4 3" }, trail);
  trailLine.setAttribute("points", ws.map(function (w) { return g.x(w) + "," + g.y(L(w)); }).join(" "));
  var marker = el("circle", { r: 8, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);

  // Readout panel (bottom right).
  var panel = el("g", {}, svg);
  card(panel, 372, 120, 254, 120, "fillG");
  var p1 = txt(panel, 499, 146, "note", "", "middle");
  var p2 = txt(panel, 499, 174, "mono", "", "middle");
  var p3 = txt(panel, 499, 200, "mono", "", "middle");
  var p4 = txt(panel, 499, 228, "big", "", "middle");

  // Learning loop diagram (final step).
  var loop = el("g", {}, svg);
  ["1  predict", "2  measure the loss", "3  compute the gradient", "4  update the weights"].forEach(function (name, i) {
    var y = 122 + i * 52;
    card(loop, 392, y, 190, 36, i === 3 ? "fillB" : "fillG");
    txt(loop, 487, y + 23, "lbl", name, "middle");
    if (i < 3) { var a = arrow(loop, "w", 3); setLine(a, 487, y + 38, 487, y + 50); }
  });
  var back = el("path", { d: "M 584 296 L 606 296 L 606 140 L 586 140", fill: "none", stroke: "#c9dccf", "stroke-width": 3, "marker-end": "url(#ah-w)" }, loop);
  txt(loop, 624, 220, "note", "repeat", "middle").setAttribute("transform", "rotate(90 624 220)");

  function setW(w, loss) {
    marker.setAttribute("cx", g.x(w)); marker.setAttribute("cy", g.y(L(w)));
    wTxt.textContent = fmt(w, w === Math.round(w) ? 1 : 2);
    predTxt.textContent = fmt(w * X, 2).replace(/\.?0+$/, "") || "0";
    lossTxt.textContent = fmt(L(w), 2).replace(/\.?0+$/, "") || "0";
  }

  function render(index, id) {
    var i = index;
    show(target, i >= 1);
    show(goal, i <= 1);
    show(gr, i >= 2 && i !== 8 || i === 8);
    show(marker, i >= 2);
    show(tan, i === 4); show(tanLbl, i === 4);
    show(dirArrow, i === 5); show(dirLbl, i === 5);
    show(trail, i >= 7);
    show(panel, i >= 3 && i <= 7);
    show(loop, i === 8);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";
    if (i <= 1) { predTxt.textContent = i === 0 ? "?" : "0"; lossTxt.textContent = "?"; wTxt.textContent = "0.0"; }
    if (i >= 2) setW(0);

    if (i === 3) {
      p1.textContent = "loss depends on the weight";
      anim("w", 2400, function (e) { var w = 0.9 * Math.sin(Math.PI * e); setW(w); p3.textContent = "w = " + fmt(w, 2) + "   loss = " + fmt(L(w), 1); });
    } else if (i === 4) {
      p1.textContent = "gradient at w = 0";
      p2.textContent = "2 × (0 − 6) × 2";
      p4.textContent = "= −24";
      p3.textContent = "negative: raise w";
    } else if (i === 5) {
      p1.textContent = "gradient = −24";
      p2.textContent = "against it = +24";
      p3.textContent = "so w moves UP";
    } else if (i === 6) {
      p1.textContent = "w ← w − η × gradient";
      p2.textContent = "= 0 − 0.05 × (−24)";
      p4.textContent = "w = 1.2, loss 12.96";
      anim("w", 1400, function (e) { setW(lerp(0, ws[1], e)); });
    } else if (i === 7) {
      p1.textContent = "w:    0 → 1.2 → 1.92 → 2.35";
      p2.textContent = "loss: 36 → 12.96 → 4.67 → 1.68";
      p3.textContent = "gradient: −24, −14.4, −8.6 …";
      p4.textContent = "w heads to 3";
      anim("w", 3200, function (e) {
        var t = e * (ws.length - 1), j = Math.min(ws.length - 2, Math.floor(t)), f = t - j;
        setW(lerp(ws[j], ws[j + 1], f));
        trailDots.forEach(function (d, k) { d.setAttribute("opacity", k <= t + 0.01 ? "1" : "0"); });
      });
    } else if (i === 8) {
      setW(ws[ws.length - 1]);
    }
  }
