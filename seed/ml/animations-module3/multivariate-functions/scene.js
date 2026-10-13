  var steps = [
    { id: "one-variable", label: "One weight: a curve", caption: "With a single weight, the loss is a curve: the weight runs along the bottom and the loss is the height. This is the picture from the earlier checkpoints." },
    { id: "two-variables", label: "Two weights: a floor of choices", caption: "With two weights, every choice of (w1, w2) is a point on a flat floor. Two numbers are needed to say where you are standing." },
    { id: "surface", label: "The loss lifts into a surface", caption: "At each point of the floor, raise the loss as a height. The flat floor becomes a surface, here a bowl with its lowest point above (3, 1)." },
    { id: "point-on-surface", label: "A point on the surface", caption: "Each position of the model is a point on the surface: the floor point (1, 3) holds the weights, and the height above it is the loss, 12." },
    { id: "many-variables", label: "Many weights: same ideas", caption: "Real models have thousands or millions of weights. We cannot draw that landscape, but nothing in the rules changes." },
    { id: "parameter-vector", label: "A weight vector and its gradient", caption: "The weights form a vector w. The gradient has one entry per weight: one partial derivative for each. Same count, same order." },
    { id: "ml-loss", label: "One loss number, many partials", caption: "A tiny model with 3 weights: the weights make a prediction, the prediction gives ONE loss number, and from it we get one slope for each weight." }
  ];

  function L1(w) { return (w - 3) * (w - 3); }
  function L2(w1, w2) { return (w1 - 3) * (w1 - 3) + 2 * (w2 - 1) * (w2 - 1); }

  // ── A. one-variable curve ──
  var g = makeGraph(50, 318, 58, 30);
  var gCurve = el("g", {}, svg);
  drawAxes(gCurve, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(gCurve, g.x(6.3), g.y(0) + 28, "note", "weight w", "end");
  txt(gCurve, g.x(0) + 8, g.y(9.8) - 2, "note", "loss L(w)", "start");
  el("path", { class: "curve", d: curveD(g, L1, 0, 6, 60) }, gCurve);
  el("circle", { cx: g.x(1), cy: g.y(L1(1)), r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, gCurve);
  txt(gCurve, g.x(1) + 12, g.y(L1(1)) - 10, "lbl lbl-y", "one weight, one number", "start");
  var cardCurve = el("g", {}, gCurve);
  card(cardCurve, 420, 60, 200, 70, "fillG");
  txt(cardCurve, 520, 88, "note", "1 weight", "middle");
  txt(cardCurve, 520, 114, "mono", "→ a curve", "middle");

  // ── B. floor and surface (pseudo-3D) ──
  var meshT = 0;
  function Pr(w1, w2, h) { return [90 + 62 * w1 + 30 * w2, 316 - 32 * w2 - h * 9 * meshT]; }
  var gMesh = el("g", {}, svg);
  var meshLines = [];
  function addLine(fixed, value) {
    var node = el("path", { fill: "none", stroke: fixed === "w2" ? "rgba(56,189,248,0.8)" : "rgba(244,114,182,0.7)", "stroke-width": 1.6 }, gMesh);
    meshLines.push({ node: node, fixed: fixed, value: value });
  }
  [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(function (v) { addLine("w2", v); });
  [0, 1, 2, 3, 4, 5, 6].forEach(function (v) { addLine("w1", v); });
  function setMesh(t) {
    meshT = t;
    meshLines.forEach(function (ln) {
      var d = "";
      var n = 24;
      for (var i = 0; i <= n; i++) {
        var a = ln.fixed === "w2" ? (6 * i) / n : (3 * i) / n;
        var w1 = ln.fixed === "w2" ? a : ln.value;
        var w2 = ln.fixed === "w2" ? ln.value : a;
        var p = Pr(w1, w2, L2(w1, w2));
        d += (i ? " L " : "M ") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      }
      ln.node.setAttribute("d", d);
    });
    var m = Pr(3, 1, 0);
    minDot.setAttribute("cx", m[0]); minDot.setAttribute("cy", m[1]);
    var top = Pr(0, 0, 17);
    setLine(lossAxis, Pr(0, 0, 0)[0], Pr(0, 0, 0)[1], top[0], top[1]);
    lossLbl.setAttribute("x", top[0] - 8); lossLbl.setAttribute("y", top[1] - 6);
  }
  var lossAxis = el("line", { stroke: "#e2b44a", "stroke-width": 2 }, gMesh);
  var lossLbl = txt(gMesh, 0, 0, "lbl lbl-y", "loss (height)", "start");
  var minDot = el("circle", { r: 5, fill: "#1db584", stroke: "#071510", "stroke-width": 2 }, gMesh);
  var floorLbls = el("g", {}, gMesh);
  [0, 2, 4, 6].forEach(function (v) { var p = Pr(v, 0, 0); txt(floorLbls, p[0], 316 + 16, "tick", String(v), "middle"); });
  txt(floorLbls, Pr(6.3, 0, 0)[0], 320, "lbl", "w1", "start");
  [0, 1, 2, 3].forEach(function (v) { var p = Pr(0, v, 0); txt(floorLbls, p[0] - 8, 316 - 32 * v + 4, "tick", String(v), "end"); });
  txt(floorLbls, Pr(0, 3.35, 0)[0] - 4, Pr(0, 3.35, 0)[1], "lbl", "w2", "end");
  var pointG = el("g", {}, svg);
  var dropLine = el("line", { class: "dash", stroke: "#e2b44a", "stroke-width": 2 }, pointG);
  var floorPt = el("circle", { r: 6, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, pointG);
  var surfPt = el("circle", { r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, pointG);
  var fpLbl = txt(pointG, 0, 0, "lbl", "floor point (1, 3): the weights", "start");
  var spLbl = txt(pointG, 0, 0, "lbl lbl-y", "height = loss = 12", "end");

  // ── C. many weights ──
  var gMany = el("g", {}, svg);
  ["w1", "w2", "w3", "w4", "…", "w1000"].forEach(function (name, i) {
    var x = 44 + i * 95;
    card(gMany, x, 120, 80, 56, i === 4 ? "fillA" : "fillG");
    txt(gMany, x + 40, 154, "big", name, "middle");
  });
  txt(gMany, 320, 100, "lbl", "a real model: thousands of weights", "middle");
  txt(gMany, 320, 218, "note", "we cannot draw a landscape with 1000 directions", "middle");
  card(gMany, 120, 246, 400, 70, "fillB");
  txt(gMany, 320, 274, "mono", "the rules stay the same:", "middle");
  txt(gMany, 320, 298, "note", "one loss number, and one partial derivative for each weight", "middle");

  // ── D. weight vector and gradient vector ──
  var gVec = el("g", {}, svg);
  txt(gVec, 16, 100, "lbl", "weights", "start");
  txt(gVec, 16, 114, "lbl", "w", "start");
  txt(gVec, 16, 256, "lbl lbl-y", "gradient", "start");
  txt(gVec, 16, 270, "lbl lbl-y", "of the loss", "start");
  [["w1", "0"], ["w2", "0"], ["w3", "0"]].forEach(function (p, i) {
    var x = 120 + i * 170;
    card(gVec, x, 76, 130, 54, "fillA");
    txt(gVec, x + 65, 96, "note", p[0], "middle");
    txt(gVec, x + 65, 120, "big", p[1], "middle");
  });
  [["∂L/∂w1", "−12"], ["∂L/∂w2", "−24"], ["∂L/∂w3", "−36"]].forEach(function (p, i) {
    var x = 120 + i * 170;
    card(gVec, x, 236, 130, 54, "fillB");
    txt(gVec, x + 65, 256, "note", p[0], "middle");
    txt(gVec, x + 65, 280, "big", p[1], "middle");
    var a = arrow(gVec, "y", 3);
    setLine(a, x + 65, 134, x + 65, 232);
  });
  txt(gVec, 320, 310, "note", "one slope for each weight, same order", "middle"); // below the cards: the arrows pass through the gap between them
  txt(gVec, 320, 330, "note", "3 weights → 3 partial derivatives. 1000 weights → 1000.", "middle");

  // ── E. pipeline ──
  var gPipe = el("g", {}, svg);
  var boxes = [
    ["weights", "[0, 0, 0]", "fillA"],
    ["prediction", "w·x = 0", "fillG"],
    ["loss", "(0 − 6)² = 36", "fillB"],
    ["gradient", "[−12, −24, −36]", "fillG"]
  ];
  boxes.forEach(function (b, i) {
    var x = 18 + i * 156;
    card(gPipe, x, 120, 130, 80, b[2]);
    txt(gPipe, x + 65, 146, "note", b[0], "middle");
    txt(gPipe, x + 65, 178, "mono", b[1], "middle");
    if (i < boxes.length - 1) {
      var a = arrow(gPipe, "w", 3);
      setLine(a, x + 132, 160, x + 154, 160);
    }
  });
  txt(gPipe, 320, 96, "lbl", "inputs x = [1, 2, 3], target y = 6", "middle");
  txt(gPipe, 320, 250, "note", "ONE number (the loss) …", "middle");
  txt(gPipe, 320, 272, "note", "… gives ONE slope per weight", "middle");

  function render(index, id) {
    show(gCurve, id === "one-variable");
    var meshOn = id === "two-variables" || id === "surface" || id === "point-on-surface";
    show(gMesh, meshOn);
    show(pointG, id === "point-on-surface");
    show(lossAxis, id !== "two-variables");
    show(lossLbl, id !== "two-variables");
    show(minDot, id !== "two-variables");
    show(gMany, id === "many-variables");
    show(gVec, id === "parameter-vector");
    show(gPipe, id === "ml-loss");
    if (id === "two-variables") setMesh(0);
    else if (id === "surface") anim("mesh", 1800, function (e) { setMesh(e); });
    else if (id === "point-on-surface") {
      setMesh(1);
      var f = Pr(1, 3, 0), s = Pr(1, 3, 12);
      setLine(dropLine, f[0], f[1], s[0], s[1]);
      floorPt.setAttribute("cx", f[0]); floorPt.setAttribute("cy", f[1]);
      surfPt.setAttribute("cx", s[0]); surfPt.setAttribute("cy", s[1]);
      fpLbl.setAttribute("x", f[0] + 12); fpLbl.setAttribute("y", f[1] + 16);
      spLbl.setAttribute("x", s[0] - 12); spLbl.setAttribute("y", s[1] - 8);
    }
  }
