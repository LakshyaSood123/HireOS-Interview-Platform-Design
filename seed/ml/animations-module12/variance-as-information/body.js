
  var S45 = dirOf(45), SM45 = dirOf(-45), VX = [1, 0], VY = [0, 1];
  frameAxes(svg, CP, 4.4, 3.4);
  txt(svg, CP.x(4.4), CP.y(0) + 16, "note", "usage (centered)", "end");
  txt(svg, CP.x(0) + 6, CP.y(3.4) + 4, "note", "spend (centered)", "start");
  var dirL = dirLine(svg, CP, C_PC1, 2.5, true);
  var spanL = dirLine(svg, CP, C_KEEP, 8);
  spanL.setAttribute("opacity", "0");
  var dx = dropSet(svg, C_PC2, DN), dy = dropSet(svg, C_PC2, DN), dd = dropSet(svg, C_PRJ, DN), da = dropSet(svg, C_PRJ, DN);
  setDrops(dx, CP, DC, VX); setDrops(dy, CP, DC, VY); setDrops(dd, CP, DC, S45); setDrops(da, CP, DC, SM45);
  var dots = dotsAt(svg, CP, DC, 7);
  function span(v, color) {
    var lo = 1e9, hi = -1e9;
    DC.forEach(function (c) { var t = dot2(c, v); if (t < lo) lo = t; if (t > hi) hi = t; });
    setLine(spanL, CP.x(lo * v[0]), CP.y(lo * v[1]), CP.x(hi * v[0]), CP.y(hi * v[1]));
    spanL.setAttribute("stroke", color); spanL.setAttribute("opacity", "0.55");
  }
  var panel = el("g", {}, svg);
  card(panel, 410, 62, 222, 150, "fillG");
  var q1 = txt(panel, 521, 92, "lbl lbl-y", "", "middle");
  var q2 = txt(panel, 521, 130, "big", "", "middle");
  var q3 = txt(panel, 521, 162, "note", "", "middle");
  var q4 = txt(panel, 521, 184, "note", "", "middle");
  var bars = el("g", {}, svg);
  card(bars, 410, 62, 222, 252, "fillA");
  txt(bars, 521, 88, "lbl lbl-y", "variance by direction", "middle");
  [["usage axis", varAlong(0), "#38bdf8"], ["spend axis", varAlong(90), "#38bdf8"], ["direction (1, 1)", varAlong(45), "#e2b44a"], ["direction (1, −1)", varAlong(-45), "#f472b6"]].forEach(function (r, k) {
    var y = 106 + k * 44;
    txt(bars, 424, y + 10, "note", r[0], "start");
    box(bars, 424, y + 16, Math.max(3, r[1] * 28), 14, r[2], "none", 4);
    txt(bars, 424 + Math.max(3, r[1] * 28) + 8, y + 28, "mono", f2(r[1]), "start");
  });
  txt(bars, 521, 284, "note", "axes: 3.50 + 2.70 = 6.20", "middle");
  txt(bars, 521, 302, "note", "tilted pair: 6.00 + 0.20 = 6.20", "middle");
  function setPanel(a, b, c, d) { q1.textContent = a; q2.textContent = b; q3.textContent = c || ""; q4.textContent = d || ""; }
  function render(i) {
    show(dirL, i === 3 || i === 4 || i === 5 || i === 6 || i === 7);
    if (i === 3 || i === 4 || i === 5 || i === 6) setDir(dirL, CP, S45, 4.4);
    if (i === 7) setDir(dirL, CP, SM45, 4.4);
    if (i === 3 || i === 4 || i === 5 || i === 6) dirL.setAttribute("stroke", C_PC1);
    if (i === 7) dirL.setAttribute("stroke", C_PRJ);
    dx.lines.forEach(function (l, k) { show(l, i === 1); show(dx.feet[k], i === 1); });
    dy.lines.forEach(function (l, k) { show(l, i === 2); show(dy.feet[k], i === 2); });
    dd.lines.forEach(function (l, k) { show(l, i >= 4 && i <= 6); show(dd.feet[k], i >= 4 && i <= 6); });
    da.lines.forEach(function (l, k) { show(l, i === 7); show(da.feet[k], i === 7); });
    if (i === 1) span(VX, "#38bdf8");
    else if (i === 2) span(VY, "#38bdf8");
    else if (i === 5 || i === 6) span(S45, "#e2b44a");
    else if (i === 7) span(SM45, "#f472b6");
    else spanL.setAttribute("opacity", "0");
    show(panel, i >= 1 && i <= 7); show(bars, i === 8);
    if (i === 1) setPanel("spread along usage", "variance " + f2(varAlong(0)), "average squared distance", "from the mean, divided by n − 1");
    if (i === 2) setPanel("spread along spend", "variance " + f2(varAlong(90)), "smaller than usage here,", "but both columns separate customers");
    if (i === 3) setPanel("a tilted direction", "(1, 1)", "not an original axis:", "a mix of usage and spend");
    if (i === 4) setPanel("project the points", "onto (1, 1)", "each point lands at one", "position along the line");
    if (i === 5) setPanel("spread of the projections", "variance " + f2(varAlong(45)), "measured along the tilted line", "");
    if (i === 6) setPanel("high variance", f2(varAlong(45)) + " ≫ axes", "points differ a lot along it:", "a direction worth keeping");
    if (i === 7) setPanel("low variance", f2(varAlong(-45)), "(1, −1) barely separates them:", "little is lost by dropping it");
  }
