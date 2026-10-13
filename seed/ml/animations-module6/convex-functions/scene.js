  var steps = [
    { id: "bowl", label: "The familiar bowl", caption: "Our objective L(w) = (w − 3)² is a bowl: one smooth valley. We call this shape convex. Let us see what that shape guarantees." },
    { id: "two-points", label: "Pick two points on the curve", caption: "Choose two points on the graph, at w = 1 and w = 5. Both have loss 4." },
    { id: "chord", label: "Draw the chord", caption: "The straight line joining them is the chord. Every point on the chord is a weighted mix of the two: height λ·f(x) + (1 − λ)·f(y)." },
    { id: "function-below-chord", label: "The function sits below the chord", caption: "Between the two points the curve is below the chord: at w = 3 the curve has height 0 and the chord has height 4. This is convexity: f(λx + (1 − λ)y) ≤ λ f(x) + (1 − λ) f(y)." },
    { id: "minimum", label: "One valley, one bottom", caption: "Because the curve never rises above its chords, it has just one valley. Its bottom, w = 3, is the minimum." },
    { id: "local-global", label: "Local minimum = global minimum", caption: "For a convex function, any point with no better point nearby (a local minimum) is automatically the best point overall (the global minimum). Gradient descent from either side ends at the same place." },
    { id: "nonconvex-contrast", label: "A non-convex contrast", caption: "Now f(w) = (w² − 1)² + 0.3w. It has two valleys, and the curve rises ABOVE the chord from w = −1 to 1 (at w = 0: 1 versus 0). Gradient descent from w = −2 ends in the left valley (−0.31); from w = 2, in the right valley (0.29). Different answers; only one is best overall." },
    { id: "ml-connection", label: "Why ML cares", caption: "Linear regression with squared loss has a convex objective, so gradient descent can reach the global minimum. Neural-network objectives generally are not convex. Never assume every loss landscape is a bowl." }
  ];

  function Lw(w) { return (w - 3) * (w - 3); }
  var g = makeGraph(50, 318, 58, 30);
  var bowlG = el("g", {}, svg);
  drawAxes(bowlG, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(bowlG, g.x(6.3), g.y(0) + 28, "note", "w", "end");
  txt(bowlG, g.x(0) + 8, g.y(9.8) + 6, "note", "L(w) = (w − 3)²", "start");
  el("path", { class: "curve", d: curveD(g, Lw, 0, 6, 70) }, bowlG);

  var ptsG = el("g", {}, svg);
  [1, 5].forEach(function (w) {
    el("circle", { cx: g.x(w), cy: g.y(Lw(w)), r: 8, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, ptsG);
    txt(ptsG, g.x(w) + (w === 1 ? -10 : 10), g.y(Lw(w)) - 12, "lbl lbl-y", "(" + w + ", 4)", w === 1 ? "end" : "start");
  });
  var chordG = el("g", {}, svg);
  var chord = el("line", { stroke: "#f472b6", "stroke-width": 4, "stroke-linecap": "round" }, chordG);
  setLine(chord, g.x(1), g.y(4), g.x(5), g.y(4));
  txt(chordG, g.x(4), g.y(4) - 10, "lbl lbl-p", "chord", "middle");
  var gapG = el("g", {}, svg);
  [0.25, 0.5, 0.75].forEach(function (lam) {
    var x = lam * 1 + (1 - lam) * 5, fx = Lw(x);
    el("line", { x1: g.x(x), y1: g.y(fx), x2: g.x(x), y2: g.y(4), stroke: "#1db584", "stroke-width": 3, "stroke-dasharray": "5 3" }, gapG);
    el("circle", { cx: g.x(x), cy: g.y(fx), r: 5, fill: "#1db584" }, gapG);
  });
  var gapLbl = txt(gapG, g.x(3) + 10, g.y(2), "lbl lbl-g", "curve 0 ≤ chord 4", "start");
  // Dark outline so the dashed gap markers do not strike through the text.
  gapLbl.setAttribute("stroke", "#071510"); gapLbl.setAttribute("stroke-width", "5"); gapLbl.setAttribute("paint-order", "stroke");
  var formula = txt(svg, g.x(3), g.y(8.3), "mono", "f(λx + (1 − λ)y)  ≤  λ f(x) + (1 − λ) f(y)", "middle");

  var minG = el("g", {}, svg);
  el("circle", { cx: g.x(3), cy: g.y(0), r: 12, fill: "none", stroke: "#1db584", "stroke-width": 4 }, minG);
  txt(minG, g.x(3), g.y(0) - 22, "lbl lbl-g", "minimum", "middle");

  // Local = global: two descent paths.
  var pathsG = el("g", {}, svg);
  [[0.4, "#38bdf8"], [5.6, "#f472b6"]].forEach(function (s) {
    var w = s[0];
    for (var k = 0; k < 9; k++) {
      el("circle", { cx: g.x(w), cy: g.y(Lw(w)), r: 5, fill: s[1], stroke: "#071510", "stroke-width": 1.5 }, pathsG);
      w = w - 0.3 * 2 * (w - 3);
    }
  });
  txt(pathsG, g.x(3), g.y(7.5), "lbl lbl-y", "both starts reach the same minimum", "middle");

  // Non-convex function.
  function gf(w) { return (w * w - 1) * (w * w - 1) + 0.3 * w; }
  function gg(w) { return 4 * w * (w * w - 1) + 0.3; }
  var h = makeGraph(320, 280, 125, 34);
  var ncG = el("g", {}, svg);
  el("line", { x1: h.x(-2.3), y1: h.y(0), x2: h.x(2.3), y2: h.y(0), class: "axis" }, ncG);
  [-2, -1, 0, 1, 2].forEach(function (t) { txt(ncG, h.x(t), h.y(0) + 16, "tick", String(t), "middle"); });
  txt(ncG, h.x(2.3), h.y(0) + 30, "note", "w", "end");
  txt(ncG, h.x(-2.3) + 6, 44, "note", "f(w) = (w² − 1)² + 0.3w", "start");
  clipTo("ncclip", 20, 50, 600, 260);
  el("path", { class: "curve-y", d: curveD(h, gf, -2.2, 2.2, 100), "clip-path": "url(#ncclip)" }, ncG);
  var ch2 = el("line", { stroke: "#f472b6", "stroke-width": 3, "stroke-linecap": "round" }, ncG);
  setLine(ch2, h.x(-1), h.y(gf(-1)), h.x(1), h.y(gf(1)));
  el("line", { x1: h.x(0), y1: h.y(gf(0)), x2: h.x(0), y2: h.y(0.0), stroke: "#f87171", "stroke-width": 4, "stroke-dasharray": "5 3" }, ncG);
  txt(ncG, h.x(0) + 12, h.y(0.55) - 14, "lbl lbl-r", "above the chord", "start");
  var starts = [[-2, "#38bdf8", -1.04], [2, "#1db584", 0.96]];
  var descent = starts.map(function (s) {
    var w = s[0], dots = [];
    for (var k = 0; k <= 200; k++) { if (k % 10 === 0) dots.push(w); w = w - 0.02 * gg(w); }
    s.dots = dots.map(function (wv) { return el("circle", { cx: h.x(wv), cy: h.y(gf(wv)), r: 4.5, fill: s[1], stroke: "#071510", "stroke-width": 1 }, ncG); });
    el("circle", { cx: h.x(s[2]), cy: h.y(gf(s[2])), r: 10, fill: "none", stroke: s[1], "stroke-width": 3 }, ncG);
    return s;
  });
  txt(ncG, h.x(-1.04), h.y(gf(-1.04)) + 28, "lbl lbl-b", "left valley −0.31 (global)", "middle");
  txt(ncG, h.x(0.96), h.y(gf(0.96)) + 28, "lbl lbl-g", "right valley 0.29 (local)", "middle");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 60, 270, 160, "fillG");
  txt(mlG, 175, 94, "lbl lbl-g", "CONVEX OBJECTIVE", "middle");
  txt(mlG, 175, 126, "big", "linear regression", "middle");
  txt(mlG, 175, 154, "note", "squared loss: a bowl", "middle");
  txt(mlG, 175, 174, "note", "gradient descent can reach the global minimum", "middle");
  card(mlG, 330, 60, 270, 160, "fillB");
  txt(mlG, 465, 94, "lbl lbl-p", "NON-CONVEX OBJECTIVE", "middle");
  txt(mlG, 465, 126, "big", "neural networks", "middle");
  txt(mlG, 465, 154, "note", "many local minima, flat regions", "middle");
  txt(mlG, 465, 174, "note", "trained anyway, with fewer guarantees", "middle");
  txt(mlG, 320, 262, "lbl lbl-y", "do not assume every loss landscape is convex", "middle");

  function render(index, id) {
    var i = index;
    show(bowlG, i <= 5);
    show(ptsG, i >= 1 && i <= 3);
    show(chordG, i >= 2 && i <= 3);
    show(gapG, i === 3); show(formula, i === 3);
    show(minG, i >= 4 && i <= 5);
    show(pathsG, i === 5);
    show(ncG, i === 6);
    show(mlG, i === 7);
    if (i === 2) anim("chord", 900, function (e) { setLine(chord, g.x(1), g.y(4), lerp(g.x(1), g.x(5), e), g.y(4)); });
    else setLine(chord, g.x(1), g.y(4), g.x(5), g.y(4));
    if (i === 6) {
      anim("desc", 2600, function (e) {
        descent.forEach(function (s) { s.dots.forEach(function (d, k) { d.setAttribute("opacity", k <= Math.round(e * (s.dots.length - 1)) ? "1" : "0"); }); });
      });
    }
  }
