  var steps = [
    {"id": "centered-cloud", "label": "Centered cloud", "caption": "The six centered customers. Which axis through the center captures the most spread?"},
    {"id": "candidate-axis", "label": "A candidate axis", "caption": "Start with a poor guess: an axis at 135 degrees, running against the trend."},
    {"id": "project-points", "label": "Project the points", "caption": "Drop each point perpendicularly onto the axis. The positions along it are the projections."},
    {"id": "small-spread", "label": "Small spread", "caption": "Along this axis the projections bunch up: variance 0.20. Most of the cloud's spread is lost."},
    {"id": "rotate-axis", "label": "Rotate the axis", "caption": "Turn the axis: the spread changes. At 90 degrees, the spend axis, it is 2.70."},
    {"id": "larger-spread", "label": "Larger spread", "caption": "Turning toward the trend raises the spread: at 60 degrees the variance is 5.41."},
    {"id": "maximum-spread", "label": "Maximum spread", "caption": "The variance peaks near 41 degrees at about 6.03, and falls again past it."},
    {"id": "first-direction", "label": "First principal direction", "caption": "The direction of maximum variance is PC1 = (0.754, 0.657) with variance 6.03."},
    {"id": "orthogonal-second", "label": "Orthogonal second direction", "caption": "The second direction is perpendicular to the first: PC2 = (-0.657, 0.754) with variance 0.17. In 2-D it is fixed up to sign."},
    {"id": "principal-directions", "label": "Principal directions", "caption": "Two perpendicular axes, ordered by variance: 6.03 and 0.17. Their variances add up to the total 6.20."}
  ];

  frameAxes(svg, CP, 4.4, 3.4);
  var axisL = dirLine(svg, CP, C_PC1, 3);
  var spanL = dirLine(svg, CP, C_KEEP, 8);
  var drops = dropSet(svg, C_PRJ, DN);
  var dots = dotsAt(svg, CP, DC, 7);
  var a1 = arrow(svg, "y", 4), a2 = arrow(svg, "b", 4);
  setArrow(a1, CP, DV1, 3.6); setArrow(a2, CP, DV2, 2.2);
  var ra = rightAngle(svg);
  setRightAngle(ra, CP, DV1, DV2, 0.28);
  var l1 = txt(svg, CP.x(3.7 * DV1[0]) - 8, CP.y(3.7 * DV1[1]) - 12, "lbl lbl-y", "PC1 direction", "end");
  var l2 = txt(svg, CP.x(2.3 * DV2[0]) - 6, CP.y(2.3 * DV2[1]) - 6, "lbl lbl-b", "PC2 direction", "end");
  // variance-versus-angle graph
  var G = makeGraph(430, 196, 1.05, 18);
  var gp = el("g", {}, svg);
  card(gp, 410, 56, 222, 168, "fillA");
  txt(gp, 521, 72, "lbl lbl-y", "variance along the axis", "middle");
  el("line", { x1: G.x(0), y1: G.y(0), x2: G.x(180), y2: G.y(0), class: "axis" }, gp);
  [0, 90, 180].forEach(function (t) { txt(gp, G.x(t), G.y(0) + 14, "tick", t + "°", "middle"); });
  el("path", { class: "curve-y", d: curveD(G, varAlong, 0, 180, 90) }, gp);
  var mark = el("circle", { cx: 0, cy: 0, r: 6, fill: "#f472b6", stroke: "#071510", "stroke-width": 2 }, gp);
  var rd1 = txt(svg, 521, 252, "mono", "", "middle");
  var rd2 = txt(svg, 521, 276, "mono", "", "middle");
  var rd3 = txt(svg, 521, 304, "note", "", "middle");
  var shown = 135;
  function setAxis(theta) {
    shown = theta;
    var v = dirOf(theta);
    setDir(axisL, CP, v, 4.4);
    setDrops(drops, CP, DC, v);
    var lo = 1e9, hi = -1e9;
    DC.forEach(function (c) { var t = dot2(c, v); if (t < lo) lo = t; if (t > hi) hi = t; });
    setLine(spanL, CP.x(lo * v[0]), CP.y(lo * v[1]), CP.x(hi * v[0]), CP.y(hi * v[1]));
    var th = ((theta % 180) + 180) % 180;
    mark.setAttribute("cx", G.x(th)); mark.setAttribute("cy", G.y(varAlong(th)));
    rd1.textContent = "angle " + th.toFixed(1) + "°";
    rd2.textContent = "variance " + varAlong(th).toFixed(2);
  }
  function rotateTo(target, ms) {
    var from = shown;
    anim("rot", ms, function (e) { setAxis(lerp(from, target, e)); });
  }
  var TARGET = [135, 135, 135, 135, 90, 60, DANG1, DANG1, DANG1, DANG1];
  function render(i) {
    var axisOn = i >= 1 && i <= 6;
    show(axisL, axisOn); show(spanL, i >= 3 && i <= 6); spanL.setAttribute("opacity", i >= 3 && i <= 6 ? "0.45" : "0");
    drops.lines.forEach(function (l, k) { show(l, i >= 2 && i <= 6); show(drops.feet[k], i >= 2 && i <= 6); });
    show(a1, i >= 7); show(a2, i >= 8); show(l1, i >= 7); show(l2, i >= 8); show(ra, i >= 8);
    show(gp, i >= 1 && i <= 7); show(mark, i >= 1 && i <= 7);
    show(rd1, i >= 1 && i <= 7); show(rd2, i >= 1 && i <= 7); show(rd3, i >= 0);
    if (i >= 1 && i <= 6) rotateTo(TARGET[i], (i >= 4 && i <= 6) ? 900 : 0);
    else setAxis(TARGET[i]);
    rd3.textContent = ["", "a candidate axis through the center", "project each point onto it", "small spread: the points bunch up", "rotating the axis changes the spread", "larger spread", "maximum spread", "PC1 = (" + f3(DV1[0]) + ", " + f3(DV1[1]) + ") variance " + f2(DL1), "PC2 = (" + s3(DV2[0]) + ", " + f3(DV2[1]) + ") variance " + f2(DL2), "perpendicular · " + f2(DL1) + " + " + f2(DL2) + " = " + f2(DTOT)][i];
    if (i >= 8) { rd1.textContent = ""; rd2.textContent = ""; show(rd1, true); show(rd2, true); rd1.textContent = "PC1 variance " + f2(DL1); rd2.textContent = "PC2 variance " + f2(DL2); }
  }

  flatCards();
