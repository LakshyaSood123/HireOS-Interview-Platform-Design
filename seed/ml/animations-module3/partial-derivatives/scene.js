  var steps = [
    { id: "two-input-function", label: "A loss with two knobs", caption: "Now the loss depends on two weights: L(w1, w2) = (w1 − 3)² + 2(w2 − 1)². The map shows w1 across and w2 up; rings join points with equal loss. We stand at (1, 3), where L = 12." },
    { id: "vary-x", label: "Vary w1 alone", caption: "Slide only w1 left and right along the yellow line. The loss changes as we go, and the right-hand curve records it." },
    { id: "hold-y", label: "Hold w2 still", caption: "While w1 moves, w2 stays frozen at 3. The loss then depends on one variable only: L = (w1 − 3)² + 8, an ordinary curve we already know how to handle." },
    { id: "partial-x", label: "The slope in the w1 direction", caption: "The slope of that curve at w1 = 1 is the partial derivative with respect to w1: ∂L/∂w1 = 2(w1 − 3) = −4. Raising w1 lowers the loss." },
    { id: "vary-y", label: "Now vary w2 alone", caption: "Switch knobs. Freeze w1 at 1 and slide only w2 up and down the pink line. The loss now follows a different curve: L = 4 + 2(w2 − 1)²." },
    { id: "partial-y", label: "The slope in the w2 direction", caption: "At w2 = 3 the slope of this curve is ∂L/∂w2 = 4(w2 − 1) = +8. Raising w2 raises the loss, so w2 should go down." },
    { id: "ml-parameters", label: "One partial derivative per parameter", caption: "Each weight gets its own partial derivative, and each says how to nudge that weight. −4 says raise w1; +8 says lower w2." }
  ];

  function L2(w1, w2) { return (w1 - 3) * (w1 - 3) + 2 * (w2 - 1) * (w2 - 1); }
  function f1(w1) { return L2(w1, 3); }
  function f2(w2) { return L2(1, w2); }

  var P = makeGraph(60, 320, 40, 60);
  clipTo("planeclip", 28, 40, 276, 308);
  var plane = el("g", {}, svg);
  card(plane, 28, 40, 276, 308, "fillA").setAttribute("fill", "rgba(56,189,248,0.04)");
  var rings = el("g", { "clip-path": "url(#planeclip)" }, plane);
  [2, 6, 12].forEach(function (c) { ring(rings, P.x(3), P.y(1), Math.sqrt(c) * P.sx, Math.sqrt(c / 2) * P.sy); });
  drawAxes(plane, P, 6.3, 4.4, [0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4]);
  txt(plane, P.x(6.2), P.y(0) - 8, "note", "w1", "end");
  txt(plane, P.x(0) + 8, P.y(4.4) + 4, "note", "w2", "start");
  el("circle", { cx: P.x(3), cy: P.y(1), r: 4, fill: "#1db584" }, plane);
  txt(plane, P.x(3) + 8, P.y(1) + 16, "lbl lbl-g", "minimum (3, 1)", "start");

  var hLine = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  setLine(hLine, P.x(0), P.y(3), P.x(6.2), P.y(3));
  var vLine = el("line", { stroke: "#f472b6", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  setLine(vLine, P.x(1), P.y(0), P.x(1), P.y(4.2));
  var heldLbl = txt(svg, P.x(3.2), P.y(3) - 8, "lbl lbl-y", "w2 held at 3", "start");
  var heldLbl2 = txt(svg, P.x(1) + 8, P.y(3.9), "lbl lbl-p", "w1 held at 1", "start");
  var me = el("circle", { r: 7, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, svg);
  var meLbl = txt(svg, 0, 0, "lbl", "(1, 3)", "start");

  // Right-hand slices.
  var gA = makeGraph(350, 340, 40, 9);
  var gB = makeGraph(350, 340, 60, 9);
  var sliceA = el("g", {}, svg);
  drawAxes(sliceA, gA, 6.3, 19, [0, 1, 2, 3, 4, 5, 6], []);
  txt(sliceA, gA.x(6.3), gA.y(0) + 28, "note", "w1", "end");
  el("path", { class: "curve-y", d: curveD(gA, f1, 0, 6, 60) }, sliceA);
  var tanA = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, sliceA);
  setLine(tanA, gA.x(0.1), gA.y(12 - 4 * (0.1 - 1)), gA.x(2.2), gA.y(12 - 4 * (2.2 - 1)));
  var mA = el("circle", { r: 6, fill: "#fff", stroke: "#071510", "stroke-width": 2 }, sliceA);
  txt(sliceA, gA.x(3), 140, "lbl lbl-y", "loss as w1 varies (w2 = 3)", "middle");
  var sliceB = el("g", {}, svg);
  drawAxes(sliceB, gB, 4.3, 23, [0, 1, 2, 3, 4], []);
  txt(sliceB, gB.x(4.3), gB.y(0) + 28, "note", "w2", "end");
  el("path", { class: "curve-p", d: curveD(gB, f2, 0, 4, 60) }, sliceB);
  var tanB = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, sliceB);
  setLine(tanB, gB.x(2.2), gB.y(12 + 8 * (2.2 - 3)), gB.x(3.5), gB.y(12 + 8 * (3.5 - 3)));
  var mB = el("circle", { r: 6, fill: "#fff", stroke: "#071510", "stroke-width": 2 }, sliceB);
  txt(sliceB, gB.x(2.1), 140, "lbl lbl-p", "loss as w2 varies (w1 = 1)", "middle");

  var arrW1 = arrow(svg, "g", 4);
  var arrW2 = arrow(svg, "r", 4);
  var arrW1Lbl = txt(svg, 0, 0, "lbl lbl-g", "raise w1", "middle");
  var arrW2Lbl = txt(svg, 0, 0, "lbl lbl-r", "lower w2", "start");

  var panel = el("g", {}, svg);
  card(panel, 340, 20, 285, 100, "fillG");
  var p1 = txt(panel, 482, 40, "note", "", "middle");
  var p2 = txt(panel, 482, 64, "mono", "", "middle");
  var p3 = txt(panel, 482, 90, "big", "", "middle");
  var p4 = txt(panel, 482, 110, "note", "", "middle");

  function moveW1(w1) {
    me.setAttribute("cx", P.x(w1)); me.setAttribute("cy", P.y(3));
    meLbl.setAttribute("x", P.x(w1) + 10); meLbl.setAttribute("y", P.y(3) + 18);
    meLbl.textContent = "(" + fmt(w1, 1) + ", 3)";
    mA.setAttribute("cx", gA.x(w1)); mA.setAttribute("cy", gA.y(f1(w1)));
    p3.textContent = "w1 = " + fmt(w1, 2) + "   L = " + fmt(f1(w1), 1);
  }
  function moveW2(w2) {
    me.setAttribute("cx", P.x(1)); me.setAttribute("cy", P.y(w2));
    meLbl.setAttribute("x", P.x(1) + 10); meLbl.setAttribute("y", P.y(w2) + 18);
    meLbl.textContent = "(1, " + fmt(w2, 1) + ")";
    mB.setAttribute("cx", gB.x(w2)); mB.setAttribute("cy", gB.y(f2(w2)));
    p3.textContent = "w2 = " + fmt(w2, 2) + "   L = " + fmt(f2(w2), 1);
  }

  function render(index, id) {
    var xSide = id === "vary-x" || id === "hold-y" || id === "partial-x";
    var ySide = id === "vary-y" || id === "partial-y";
    show(hLine, xSide || id === "ml-parameters");
    show(vLine, ySide || id === "ml-parameters");
    show(heldLbl, id === "hold-y" || id === "partial-x");
    show(heldLbl2, ySide);
    show(sliceA, xSide);
    show(sliceB, ySide);
    show(tanA, id === "partial-x");
    show(tanB, id === "partial-y");
    show(me, id !== "two-input-function" || true);
    show(arrW1, id === "ml-parameters"); show(arrW1Lbl, id === "ml-parameters");
    show(arrW2, id === "ml-parameters"); show(arrW2Lbl, id === "ml-parameters");
    show(panel, true);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";
    moveW1(1);
    moveW2(3);
    me.setAttribute("cx", P.x(1)); me.setAttribute("cy", P.y(3));
    meLbl.setAttribute("x", P.x(1) + 10); meLbl.setAttribute("y", P.y(3) + 18);
    meLbl.textContent = "(1, 3)";
    p3.textContent = "";

    if (id === "two-input-function") {
      p1.textContent = "the loss for two weights";
      p2.textContent = "(w1 − 3)² + 2(w2 − 1)²";
      p3.textContent = "at (1, 3): L = 12";
    } else if (id === "vary-x") {
      p1.textContent = "only w1 changes";
      anim("v", 2400, function (e) { moveW1(1 + 1.8 * Math.sin(Math.PI * e)); });
    } else if (id === "hold-y") {
      p1.textContent = "w2 is frozen at 3";
      p2.textContent = "L = (w1 − 3)² + 8";
    } else if (id === "partial-x") {
      p1.textContent = "partial derivative for w1";
      p2.textContent = "∂L/∂w1 = 2(w1 − 3)";
      p3.textContent = "= −4 at w1 = 1";
      p4.textContent = "raising w1 lowers the loss";
    } else if (id === "vary-y") {
      p1.textContent = "only w2 changes";
      anim("v", 2400, function (e) { moveW2(3 - 1.6 * Math.sin(Math.PI * e)); });
    } else if (id === "partial-y") {
      p1.textContent = "partial derivative for w2";
      p2.textContent = "∂L/∂w2 = 4(w2 − 1)";
      p3.textContent = "= +8 at w2 = 3";
      p4.textContent = "raising w2 raises the loss";
    } else {
      p1.textContent = "∂L/∂w1 = −4  →  raise w1";
      p2.textContent = "∂L/∂w2 = +8  →  lower w2";
      p3.textContent = "one answer per weight";
      setLine(arrW1, P.x(1) + 10, P.y(3), P.x(2.6), P.y(3));
      setLine(arrW2, P.x(1), P.y(3) + 10, P.x(1), P.y(1.7));
      arrW1Lbl.setAttribute("x", P.x(2)); arrW1Lbl.setAttribute("y", P.y(3) - 12);
      arrW2Lbl.setAttribute("x", P.x(1) + 10); arrW2Lbl.setAttribute("y", P.y(2.2));
    }
  }
