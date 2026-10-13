  var steps = [
    { id: "two-points", label: "Two points on the curve", caption: "Take the loss curve L(w) = (w − 3)². Pick two points on it: A at w = 1 and B at w = 2. We want to know how steep the curve is." },
    { id: "secant-slope", label: "The slope between them", caption: "Draw a straight line through A and B. Its slope is rise over run: the loss falls by 3 while w moves right by 1, so the slope is −3." },
    { id: "points-move-closer", label: "Slide B closer to A", caption: "Keep A fixed and slide B toward it. The gap h shrinks, and the slope settles toward one number: −3.5, −3.9, −3.99 … it heads to −4." },
    { id: "tangent", label: "The line that just touches the curve", caption: "When B sits almost on top of A, the line only touches the curve at that one point. This is the tangent line, and its slope is the steepness of the curve right there." },
    { id: "derivative", label: "That slope is the derivative", caption: "The slope of the tangent is the derivative of the loss, written dL/dw. For this loss dL/dw = 2(w − 3), which is −4 at w = 1." },
    { id: "positive-negative-zero", label: "Negative, zero, positive", caption: "At w = 1 the slope is −4 (the curve goes down as w grows). At w = 3 it is 0 (flat bottom). At w = 5 it is +4 (the curve goes up)." },
    { id: "ml-sensitivity", label: "What a model learns from it", caption: "The derivative says which way to move a weight and how strongly the loss reacts. Slope −4: raise w to lower the loss. Nudge w by +0.1 and the loss drops by about 0.4." }
  ];

  function L(w) { return (w - 3) * (w - 3); }
  var g = makeGraph(50, 318, 58, 30);
  drawAxes(svg, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(svg, g.x(6.3), g.y(0) + 28, "note", "weight w", "end");
  txt(svg, g.x(0) + 8, g.y(9.8) - 2, "note", "loss L(w)", "start");
  el("path", { class: "curve", d: curveD(g, L, 0, 6, 60) }, svg);

  var A = 1;
  var run = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 2 }, svg);
  var rise = el("line", { class: "dash", stroke: "#f472b6", "stroke-width": 2 }, svg);
  var runLbl = txt(svg, 0, 0, "lbl", "", "middle");
  var riseLbl = txt(svg, 0, 0, "lbl lbl-p", "", "start");
  var sec = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  var trio = el("g", {}, svg);
  var trioLines = [];
  [[1, "#f472b6", "−4: going down"], [3, "#1db584", "0: flat"], [5, "#e2b44a", "+4: going up"]].forEach(function (t) {
    var a = t[0];
    var m = 2 * (a - 3);
    var ln = el("line", { stroke: t[1], "stroke-width": 3, "stroke-linecap": "round" }, trio);
    setLine(ln, g.x(a - 0.9), g.y(L(a) - m * 0.9), g.x(a + 0.9), g.y(L(a) + m * 0.9));
    el("circle", { cx: g.x(a), cy: g.y(L(a)), r: 5, fill: t[1] }, trio);
    var tx = txt(trio, g.x(a), g.y(L(a)) - 26, "lbl", t[2], "middle");
    tx.setAttribute("fill", t[1]);
  });
  var ptA = el("circle", { cx: g.x(A), cy: g.y(L(A)), r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);
  var ptB = el("circle", { r: 7, fill: "#38bdf8", stroke: "#071510", "stroke-width": 2 }, svg);
  var lblA = txt(svg, g.x(A) - 10, g.y(L(A)) - 12, "lbl lbl-y", "A", "end");
  var lblB = txt(svg, 0, 0, "lbl lbl-b", "B", "start");
  var arrRaise = arrow(svg, "g", 4);
  var raiseLbl = txt(svg, 0, 0, "lbl lbl-g", "raise w", "middle");

  var panel = el("g", {}, svg);
  card(panel, 410, 40, 215, 120, "fillG");
  var p1 = txt(panel, 517, 66, "note", "", "middle");
  var p2 = txt(panel, 517, 94, "mono", "", "middle");
  var p3 = txt(panel, 517, 122, "big", "", "middle");
  var p4 = txt(panel, 517, 146, "note", "", "middle");

  function draw(h, withTriangle) {
    var bx = A + h;
    var m = (L(bx) - L(A)) / h;
    setLine(sec, g.x(0.3), g.y(L(A) + m * (0.3 - A)), g.x(2.2), g.y(L(A) + m * (2.2 - A)));
    ptB.setAttribute("cx", g.x(bx));
    ptB.setAttribute("cy", g.y(L(bx)));
    lblB.setAttribute("x", g.x(bx) + 12);
    lblB.setAttribute("y", g.y(L(bx)) - 10);
    setLine(run, g.x(A), g.y(L(A)), g.x(bx), g.y(L(A)));
    setLine(rise, g.x(bx), g.y(L(A)), g.x(bx), g.y(L(bx)));
    runLbl.setAttribute("x", g.x(A + h / 2));
    runLbl.setAttribute("y", g.y(L(A)) - 8);
    riseLbl.setAttribute("x", g.x(bx) + 8);
    riseLbl.setAttribute("y", g.y((L(A) + L(bx)) / 2) + 4);
    return m;
  }

  function render(index, id) {
    var tri = id === "secant-slope" || id === "derivative";
    show(run, tri); show(rise, tri); show(runLbl, tri); show(riseLbl, tri);
    show(sec, id !== "two-points" && id !== "positive-negative-zero");
    show(ptA, id !== "positive-negative-zero");
    show(ptB, id === "two-points" || id === "secant-slope" || id === "points-move-closer");
    show(lblA, id === "two-points" || id === "secant-slope");
    show(lblB, id === "two-points" || id === "secant-slope");
    show(trio, id === "positive-negative-zero");
    show(arrRaise, id === "ml-sensitivity");
    show(raiseLbl, id === "ml-sensitivity");
    show(panel, id !== "two-points" && id !== "positive-negative-zero");
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";
    sec.setAttribute("stroke", id === "tangent" || id === "derivative" || id === "ml-sensitivity" ? "#1db584" : "#e2b44a");

    if (id === "two-points") {
      draw(1, false);
    } else if (id === "secant-slope") {
      draw(1, true);
      runLbl.textContent = "run = 1";
      riseLbl.textContent = "rise = −3";
      p1.textContent = "slope of the line A to B";
      p2.textContent = "(1 − 4) / (2 − 1)";
      p3.textContent = "= −3";
    } else if (id === "points-move-closer") {
      p1.textContent = "B slides toward A";
      anim("h", 2200, function (e) {
        var h = Math.max(0.001, 1 - 0.999 * e);
        var m = draw(h, false);
        p2.textContent = "gap h = " + fmt(h, h < 0.01 ? 3 : 2);
        p3.textContent = "slope " + fmt(m, 3);
        p4.textContent = "heading toward −4";
      });
    } else if (id === "tangent") {
      var mt = draw(0.001, false);
      p1.textContent = "the tangent line";
      p2.textContent = "touches at one point";
      p3.textContent = "slope ≈ " + fmt(mt, 2);
    } else if (id === "derivative") {
      draw(1, false);
      setLine(sec, g.x(0.3), g.y(4 - 4 * (0.3 - 1)), g.x(2.2), g.y(4 - 4 * (2.2 - 1)));
      setLine(run, g.x(1), g.y(4), g.x(2), g.y(4));
      setLine(rise, g.x(2), g.y(4), g.x(2), g.y(0));
      runLbl.setAttribute("x", g.x(1.5)); runLbl.setAttribute("y", g.y(4) - 8);
      riseLbl.setAttribute("x", g.x(2) + 8); riseLbl.setAttribute("y", g.y(2) + 4);
      runLbl.textContent = "run = 1";
      riseLbl.textContent = "rise = −4";
      show(ptB, false);
      p1.textContent = "derivative at w = 1";
      p2.textContent = "dL/dw = 2(w − 3)";
      p3.textContent = "= −4";
    } else if (id === "positive-negative-zero") {
      p1.textContent = "";
    } else {
      draw(0.001, false);
      setLine(sec, g.x(0.3), g.y(4 - 4 * (0.3 - 1)), g.x(2.2), g.y(4 - 4 * (2.2 - 1)));
      setLine(arrRaise, g.x(1) + 14, g.y(4), g.x(2.3), g.y(4));
      raiseLbl.setAttribute("x", g.x(1.7)); raiseLbl.setAttribute("y", g.y(4) - 10);
      p1.textContent = "slope −4 → raise w";
      p2.textContent = "Δw = +0.1";
      p3.textContent = "ΔL ≈ −0.4";
      p4.textContent = "(−4 × 0.1)";
    }
  }
