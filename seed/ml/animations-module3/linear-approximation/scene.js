  var steps = [
    { id: "nonlinear-function", label: "A curved loss", caption: "Our loss L(w) = (w − 3)² is a curve, not a straight line. Curves are harder to work with than lines, so we look for an easy stand-in." },
    { id: "choose-point", label: "Choose the point we are standing at", caption: "Say the model is at w = 1, where the loss is L(1) = 4. We want to predict the loss for weights near this point." },
    { id: "tangent-line", label: "Draw the tangent line", caption: "At w = 1 the slope is −4. The tangent line through this point is 4 − 4h, where h is how far we step from w = 1. Close to the point, the curve and this line almost coincide." },
    { id: "nearby-point", label: "Look at a nearby point", caption: "Step to w = 1.5, so h = 0.5. The curve sits at 2.25, while the line sits at 2.0. They are close but not the same." },
    { id: "approximation", label: "The approximation and its error", caption: "Prediction from the line: 4 − 4 × 0.5 = 2.0. The true loss is 2.25. The gap, 0.25, is the approximation error." },
    { id: "error-grows", label: "The error grows with distance", caption: "Step further and the curve bends away from the line. The error is h × h: 0.25 at h = 0.5, 1 at h = 1, and 4 at h = 2, where the line even predicts a negative loss." },
    { id: "ml-connection", label: "Why training takes small steps", caption: "new loss ≈ old loss + slope × change in w. This prediction is reliable for small steps only, which is why training uses small steps." }
  ];

  function L(w) { return (w - 3) * (w - 3); }
  function line(w) { return 4 - 4 * (w - 1); }
  var g = makeGraph(50, 262, 58, 21);
  drawAxes(svg, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(svg, g.x(6.3), g.y(0) + 15, "note", "weight w", "end");
  txt(svg, g.x(0) + 8, g.y(9.8) - 2, "note", "loss", "start");

  var band = el("rect", { x: g.x(0.55), y: g.y(9.6), width: g.x(1.45) - g.x(0.55), height: g.y(0) - g.y(9.6), fill: "rgba(29,181,132,0.16)", stroke: "none" }, svg);
  var bandLbl = txt(svg, g.x(0.55), g.y(9.6) - 4, "lbl lbl-g", "small step: reliable", "start");
  var farLbl = txt(svg, g.x(4.0), g.y(6.2), "lbl lbl-r", "big step: the line is off", "middle");

  el("path", { class: "curve", d: curveD(g, L, 0, 6, 60) }, svg);
  var tan = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  setLine(tan, g.x(0.2), g.y(line(0.2)), g.x(2.9), g.y(line(2.9)));
  var tanLbl = txt(svg, g.x(0.25), g.y(line(0.25)) - 10, "lbl lbl-y", "tangent: 4 − 4h", "start");
  var guideV = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, svg);
  var guideH = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, svg);
  setLine(guideV, g.x(1), g.y(4), g.x(1), g.y(0));
  setLine(guideH, g.x(1), g.y(4), g.x(0), g.y(4));
  var pt = el("circle", { cx: g.x(1), cy: g.y(4), r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);
  var ptLbl = txt(svg, g.x(1) + 12, g.y(4) - 12, "lbl lbl-y", "a = 1, L = 4", "start");
  var curveP = el("circle", { r: 6, fill: "#38bdf8", stroke: "#071510", "stroke-width": 2 }, svg);
  var lineP = el("circle", { r: 6, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);
  var gap = el("line", { stroke: "#f87171", "stroke-width": 4, "stroke-linecap": "round" }, svg);
  var gapLbl = txt(svg, 0, 0, "lbl lbl-r", "", "start");
  var lblCurve = txt(svg, 0, 0, "lbl lbl-b", "", "start");
  var lblLine = txt(svg, 0, 0, "lbl lbl-y", "", "end");

  var panel = el("g", {}, svg);
  card(panel, 410, 30, 215, 128, "fillG");
  var p1 = txt(panel, 517, 56, "note", "", "middle");
  var p2 = txt(panel, 517, 84, "mono", "", "middle");
  var p3 = txt(panel, 517, 110, "mono", "", "middle");
  var p4 = txt(panel, 517, 142, "big", "", "middle");

  function setGap(h) {
    var w = 1 + h;
    var cy = g.y(L(w)), ly = g.y(line(w));
    curveP.setAttribute("cx", g.x(w)); curveP.setAttribute("cy", cy);
    lineP.setAttribute("cx", g.x(w)); lineP.setAttribute("cy", ly);
    setLine(gap, g.x(w), cy, g.x(w), ly);
    gapLbl.setAttribute("x", g.x(w) + 10); gapLbl.setAttribute("y", (cy + ly) / 2 + 4);
    gapLbl.textContent = "error " + fmt(h * h, 2);
    lblCurve.setAttribute("x", g.x(w) + 10); lblCurve.setAttribute("y", cy + (cy < ly ? -10 : 18));
    lblCurve.textContent = "truth " + fmt(L(w), 2);
    lblLine.setAttribute("x", g.x(w) - 10); lblLine.setAttribute("y", ly + 4);
    lblLine.textContent = "line " + fmt(line(w), 2);
    p1.textContent = "step h = " + fmt(h, 2);
    p2.textContent = "line:  4 − 4×" + fmt(h, 2) + " = " + fmt(line(w), 2);
    p3.textContent = "truth: L(" + fmt(w, 2) + ") = " + fmt(L(w), 2);
    p4.textContent = "error = " + fmt(h * h, 2);
  }

  function render(index, id) {
    var past = id !== "nonlinear-function" && id !== "choose-point";
    show(band, id === "ml-connection");
    show(bandLbl, id === "ml-connection");
    show(farLbl, id === "ml-connection");
    show(guideV, id === "choose-point");
    show(guideH, id === "choose-point");
    show(pt, id !== "nonlinear-function");
    show(ptLbl, id === "choose-point" || id === "tangent-line");
    show(tan, past);
    show(tanLbl, id === "tangent-line");
    var gapOn = id === "nearby-point" || id === "approximation" || id === "error-grows";
    show(curveP, gapOn); show(lineP, gapOn); show(gap, gapOn); show(gapLbl, gapOn);
    show(lblCurve, gapOn); show(lblLine, gapOn);
    show(panel, id !== "nonlinear-function" && id !== "choose-point");
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";

    if (id === "tangent-line") {
      p1.textContent = "at w = 1";
      p2.textContent = "L(1) = 4";
      p3.textContent = "slope = −4";
    } else if (id === "nearby-point" || id === "approximation") {
      setGap(0.5);
      if (id === "nearby-point") { p1.textContent = "nearby point"; p2.textContent = "w = 1.5"; p3.textContent = "h = 0.5"; p4.textContent = ""; }
    } else if (id === "error-grows") {
      anim("h", 2600, function (e) { setGap(0.5 + 1.5 * e); });
    } else if (id === "ml-connection") {
      p1.textContent = "a step of Δw changes the loss by about";
      p2.textContent = "slope × Δw";
      p3.textContent = "keep Δw small";
    }
  }
