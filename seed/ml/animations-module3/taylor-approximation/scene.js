  var steps = [
    { id: "original-function", label: "A curved function to approximate", caption: "Take f(x) = x³, a curve that bends upward. We want a simple formula that predicts f near one chosen point without computing the whole function." },
    { id: "expansion-point", label: "Choose the expansion point", caption: "Pick the point a = 1, where f(1) = 1. Everything we build will be centred on this point and is most accurate close to it." },
    { id: "first-order", label: "First order: the tangent line", caption: "Use the value and the slope there. The slope is f'(1) = 3, so f(x) ≈ 1 + 3(x − 1). This is the straight-line approximation." },
    { id: "first-order-error", label: "Where the straight line falls short", caption: "At x = 1.5 the true value is 3.375 but the line says 2.5, off by 0.875. The curve is bending upward and the line cannot follow." },
    { id: "curvature", label: "Curvature: the slope keeps changing", caption: "Look at the slope along the curve: about 1.1 at x = 0.6, 3 at x = 1, about 5.9 at x = 1.4. The slope itself grows. How fast it changes is the curvature, f'' = 6x, which is 6 at x = 1." },
    { id: "second-order", label: "Second order: add the bend", caption: "Add a term for the bend: ½ × f''(1) × (x − 1)² = 3(x − 1)². Now f(x) ≈ 1 + 3(x − 1) + 3(x − 1)², and the pink curve follows the bend." },
    { id: "improved-approximation", label: "The second-order version is closer", caption: "At x = 2 the truth is 8. First order says 4, second order says 7. At x = 1.5 the truth is 3.375, first order gives 2.5 and second order 3.25." },
    { id: "ml-connection", label: "Why a model cares", caption: "A gradient alone is a first-order picture: it knows the slope, not how the slope changes. Curvature tells how far a gradient step can be trusted, which is why second-order information matters in training." }
  ];

  function f(x) { return x * x * x; }
  function first(x) { return 1 + 3 * (x - 1); }
  function second(x) { return 1 + 3 * (x - 1) + 3 * (x - 1) * (x - 1); }
  var g = makeGraph(44, 318, 130, 30);
  drawAxes(svg, g, 2.3, 9.8, [0, 0.5, 1, 1.5, 2], [0, 2, 4, 6, 8]);
  txt(svg, g.x(2.3), g.y(0) + 28, "note", "x", "end");
  txt(svg, g.x(0) + 8, g.y(9.8) - 2, "note", "f(x) = x³", "start");

  var band = el("rect", { x: g.x(0.8), y: g.y(9.5), width: g.x(1.2) - g.x(0.8), height: g.y(0) - g.y(9.5), fill: "rgba(29,181,132,0.16)" }, svg);
  var bandLbl = txt(svg, g.x(1), g.y(9.5) - 4, "lbl lbl-g", "both agree here", "middle");
  el("path", { class: "curve", d: curveD(g, f, 0, 2.1, 60) }, svg);
  var firstLine = el("line", { stroke: "#e2b44a", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  setLine(firstLine, g.x(0.45), g.y(first(0.45)), g.x(2.1), g.y(first(2.1)));
  var secondPath = el("path", { class: "curve-p", d: curveD(g, second, 0.35, 2.1, 40) }, svg);
  var firstLbl = txt(svg, g.x(2.1) + 8, g.y(first(2.1)) + 4, "lbl lbl-y", "1 + 3(x − 1)", "start");
  var secondLbl = txt(svg, g.x(1.75), g.y(2.0), "lbl lbl-p", "+ 3(x − 1)²", "start");

  var slopes = el("g", {}, svg);
  [0.6, 1.0, 1.4].forEach(function (x) {
    var m = 3 * x * x;
    var ln = el("line", { stroke: "#1db584", "stroke-width": 3, "stroke-linecap": "round" }, slopes);
    setLine(ln, g.x(x - 0.17), g.y(f(x) - m * 0.17), g.x(x + 0.17), g.y(f(x) + m * 0.17));
    el("circle", { cx: g.x(x), cy: g.y(f(x)), r: 4.5, fill: "#1db584" }, slopes);
    txt(slopes, x < 0.8 ? g.x(x) - 10 : g.x(x) + 8, g.y(f(x)) + (x < 0.8 ? -10 : x < 1.2 ? 22 : 4), "lbl lbl-g", "slope " + fmt(m, 1), x < 0.8 ? "end" : "start");
  });

  var pt = el("circle", { cx: g.x(1), cy: g.y(1), r: 7, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, svg);
  var ptLbl = txt(svg, g.x(1) + 12, g.y(1) + 20, "lbl", "a = 1, f(a) = 1", "start");

  // Comparison dots at x = 1.5 (error) and x = 2 (improved).
  var cmp = el("g", {}, svg);
  var cmpGap = el("line", { stroke: "#f87171", "stroke-width": 4, "stroke-linecap": "round" }, cmp);
  var cmpTrue = el("circle", { r: 6, fill: "#38bdf8", stroke: "#071510", "stroke-width": 2 }, cmp);
  var cmpFirst = el("circle", { r: 6, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, cmp);
  var cmpSecond = el("circle", { r: 6, fill: "#f472b6", stroke: "#071510", "stroke-width": 2 }, cmp);
  var cmpL1 = txt(cmp, 0, 0, "lbl lbl-b", "", "end");
  var cmpL2 = txt(cmp, 0, 0, "lbl lbl-y", "", "end");
  var cmpL3 = txt(cmp, 0, 0, "lbl lbl-p", "", "end");
  var cmpL4 = txt(cmp, 0, 0, "lbl lbl-r", "", "start");

  var panel = el("g", {}, svg);
  card(panel, 360, 30, 265, 132, "fillG");
  var p1 = txt(panel, 492, 56, "note", "", "middle");
  var p2 = txt(panel, 492, 84, "mono", "", "middle");
  var p3 = txt(panel, 492, 108, "mono", "", "middle");
  var p4 = txt(panel, 492, 134, "big", "", "middle");
  var p5 = txt(panel, 492, 154, "note", "", "middle");

  function placeCmp(x, withSecond) {
    var yT = g.y(f(x)), y1 = g.y(first(x)), y2 = g.y(second(x));
    cmpTrue.setAttribute("cx", g.x(x)); cmpTrue.setAttribute("cy", yT);
    cmpFirst.setAttribute("cx", g.x(x)); cmpFirst.setAttribute("cy", y1);
    cmpSecond.setAttribute("cx", g.x(x)); cmpSecond.setAttribute("cy", y2);
    setLine(cmpGap, g.x(x), yT, g.x(x), y1);
    show(cmpSecond, withSecond); show(cmpL3, withSecond);
    var right = withSecond;
    var lx = right ? g.x(x) + 12 : g.x(x) - 12;
    [cmpL1, cmpL2, cmpL3].forEach(function (n) { n.setAttribute("text-anchor", right ? "start" : "end"); n.setAttribute("x", lx); });
    cmpL1.setAttribute("y", yT + 4);
    cmpL1.textContent = right ? "true " + fmt(f(x), 0) : "true " + fmt(f(x), 3);
    cmpL2.setAttribute("y", y1 + 4);
    cmpL2.textContent = right ? "1st " + fmt(first(x), 0) : "first order " + fmt(first(x), 1);
    cmpL3.setAttribute("y", y2 + 4);
    cmpL3.textContent = "2nd " + fmt(second(x), 0);
    cmpL4.setAttribute("x", g.x(x) + 10); cmpL4.setAttribute("y", (yT + y1) / 2 + 4);
    cmpL4.textContent = "off by " + fmt(f(x) - first(x), 3);
  }

  function render(index, id) {
    var i = index;
    show(pt, i >= 1); show(ptLbl, i === 1);
    show(firstLine, i >= 2); show(firstLbl, i === 2);
    firstLine.setAttribute("opacity", i === 4 ? "0.35" : i >= 2 ? "1" : "0");
    show(slopes, i === 4);
    show(secondPath, i >= 5); show(secondLbl, i === 5);
    show(cmp, i === 3 || i === 6);
    show(band, i === 7); show(bandLbl, i === 7);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = "";
    if (i === 3) {
      placeCmp(1.5, false);
      p1.textContent = "at x = 1.5";
      p2.textContent = "true:  3.375";
      p3.textContent = "line:  2.5";
      p4.textContent = "off by 0.875";
    } else if (i === 6) {
      placeCmp(2, true);
      show(cmpL4, false);
      show(cmpGap, false);
      p1.textContent = "x = 1.5  (true 3.375)";
      p2.textContent = "1st 2.5  ·  2nd 3.25";
      p3.textContent = "x = 2  (true 8)";
      p4.textContent = "1st 4  ·  2nd 7";
      p5.textContent = "second order is much closer";
    }
    if (i === 2) { p1.textContent = "value + slope × distance"; p2.textContent = "f(1) = 1, f'(1) = 3"; p3.textContent = "1 + 3(x − 1)"; }
    if (i === 4) { p1.textContent = "the slope keeps growing"; p2.textContent = "f'(x) = 3x²"; p3.textContent = "f''(x) = 6x, so f''(1) = 6"; }
    if (i === 5) { p1.textContent = "second order"; p2.textContent = "1 + 3(x − 1)"; p3.textContent = "+ ½·6·(x − 1)²"; p4.textContent = "= + 3(x − 1)²"; }
    if (i === 7) { p1.textContent = "gradient = first order"; p2.textContent = "knows the slope only"; p3.textContent = "curvature = how far to trust it"; }
    if (i === 3) { show(cmpL4, true); show(cmpGap, true); }
    show(panel, i >= 2);
  }
