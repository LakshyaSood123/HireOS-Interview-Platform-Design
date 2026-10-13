  var steps = [
    { id: "initial-components", label: "Initialize the components", caption: "EM starts from a guess: three rough components (ellipses) on the customer data. The picture is the two-dimensional customer data, so its numbers differ from the one-dimensional examples." },
    { id: "e-step-1", label: "E-step 1", caption: "E-step: with the components fixed, compute each customer's responsibilities for the three components." },
    { id: "responsibilities-1", label: "Responsibilities 1", caption: "Each customer now has soft memberships, shown by the blended color. Most are muddled because the first guess is poor." },
    { id: "m-step-1", label: "M-step 1", caption: "M-step: with the responsibilities fixed, refit every component: means, spreads and weights." },
    { id: "components-move", label: "The components move", caption: "The ellipses have moved toward the customers they explain. The dashed ellipses show where they were." },
    { id: "e-step-2", label: "E-step 2", caption: "E-step again with the new components: the responsibilities sharpen." },
    { id: "m-step-2", label: "M-step 2", caption: "M-step again: the components move further toward the visible groups." },
    { id: "likelihood-improves", label: "The likelihood improves", caption: "The log-likelihood of the data rises with every round: −162.9, −137.3, −134.8, −131.7 and so on. Each E-and-M round does not make the fit worse." },
    { id: "stabilize", label: "Stabilize", caption: "After many rounds the changes become tiny: the components fit the three groups, with ambiguous customers in the overlaps keeping split responsibilities." },
    { id: "em-summary", label: "The EM loop", caption: "EM alternates E and M until the parameters or the likelihood stop changing. It can converge to a local optimum, so initialization matters." }
  ];

  var H = runEM2(GP, GINIT, 14);
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 44, 330, 34, 29, 10, 10);
  var ghost = [0, 1, 2].map(function (k) { var e = el("ellipse", { fill: "none", stroke: GCOL[k], "stroke-width": 2, "stroke-dasharray": "5 4" }, svg); return e; });
  var ells = [0, 1, 2].map(function (k) { return compEllipse(svg, GCOL[k]); });
  var dots = ptDots(svg, G, GP, 6);
  var arrows = [0, 1, 2].map(function (k) { return arrow(svg, ["b", "y", "p"][k], 3); });
  var badge = el("g", {}, svg);
  var badgeBox = box(badge, 400, 40, 232, 54, "rgba(29,181,132,0.2)", C_OK, 10);
  var badgeA = txt(badge, 516, 62, "big", "", "middle");
  var badgeB = txt(badge, 516, 84, "note", "", "middle");
  var chartG = el("g", {}, svg);
  card(chartG, 400, 106, 232, 232, "fillA");
  txt(chartG, 516, 128, "lbl lbl-y", "log-likelihood per round", "middle");
  var LLMIN = H[0].ll - 6, LLMAX = H[H.length - 1].ll + 6;
  function cx(i) { return 420 + i * (190 / (H.length - 1)); }
  function cy(v) { return 316 - (v - LLMIN) / (LLMAX - LLMIN) * 164; }
  el("line", { x1: 416, y1: 316, x2: 618, y2: 316, class: "axis" }, chartG);
  var chartPts = H.map(function (h, i) { return el("circle", { cx: cx(i), cy: cy(h.ll), r: 4.5, fill: "#e2b44a", stroke: "#071510", "stroke-width": 1.5 }, chartG); });
  var chartLine = el("path", { d: H.map(function (h, i) { return (i ? "L " : "M ") + cx(i).toFixed(1) + " " + cy(h.ll).toFixed(1); }).join(" "), fill: "none", stroke: "#e2b44a", "stroke-width": 2 }, chartG);
  var llTxt = txt(chartG, 516, 332, "mono", "", "middle");
  var cycleG = el("g", {}, svg);
  [["initialize", "rough components", "fillA"], ["E-step", "responsibilities", "fillB"], ["M-step", "update parameters", "fillG"], ["repeat", "until stable", "fillA"]].forEach(function (c, k) {
    var x = 14 + k * 156;
    card(cycleG, x, 100, 144, 100, c[2]);
    txt(cycleG, x + 72, 142, "big", c[0], "middle");
    txt(cycleG, x + 72, 172, "note", c[1], "middle");
    if (k < 3) { var ar = arrow(cycleG, "w", 3); setLine(ar, x + 146, 150, x + 156, 150); }
  });
  txt(cycleG, 320, 250, "lbl lbl-y", "can converge to a local optimum: initialization matters", "middle");

  function showComps(cs, mult) { cs.forEach(function (c, k) { setCompEllipse(ells[k], G, c, mult || 1.5); }); }
  function colourBy(R) { dots.forEach(function (d, k) { d.setAttribute("fill", R ? blendColor(R[k]) : C_GRAY); }); }
  function setBadge(a, b, kind) {
    badgeA.textContent = a; badgeB.textContent = b;
    badgeBox.setAttribute("fill", kind === "E" ? "rgba(244,114,182,0.2)" : "rgba(29,181,132,0.2)");
    badgeBox.setAttribute("stroke", kind === "E" ? C_SPAM : C_OK);
  }
  function chartUpTo(n) {
    chartPts.forEach(function (p, i) { show(p, i < n); });
    chartLine.setAttribute("d", H.slice(0, n).map(function (h, i) { return (i ? "L " : "M ") + cx(i).toFixed(1) + " " + cy(h.ll).toFixed(1); }).join(" "));
    llTxt.textContent = n > 0 ? "round " + n + ": " + H[n - 1].ll.toFixed(1) : "";
  }
  function tween(a, b) {
    anim("em", 1300, function (e) { a.forEach(function (c, k) { setCompEllipse(ells[k], G, { mx: lerp(c.mx, b[k].mx, e), my: lerp(c.my, b[k].my, e), sx: lerp(c.sx, b[k].sx, e), sy: lerp(c.sy, b[k].sy, e) }, 1.5); }); });
  }

  function render(index, id) {
    var i = index;
    show(plotG, i <= 8); dots.forEach(function (d) { show(d, i <= 8); });
    ells.forEach(function (e) { show(e, i <= 8); });
    show(cycleG, i === 9);
    show(badge, i >= 1 && i <= 6); show(chartG, i >= 1 && i <= 8);
    ghost.forEach(function (g2, k) { show(g2, i === 4 || i === 6); });
    arrows.forEach(function (a, k) { show(a, i === 4); });
    if (i === 0) { showComps(H[0].comps); colourBy(null); }
    if (i === 1) { showComps(H[0].comps); colourBy(null); setBadge("E-step", "components FIXED · compute responsibilities", "E"); chartUpTo(1); }
    if (i === 2) { showComps(H[0].comps); colourBy(H[0].R); setBadge("E-step", "responsibilities computed", "E"); chartUpTo(1); }
    if (i === 3) { colourBy(H[0].R); setBadge("M-step", "responsibilities FIXED · update components", "M"); chartUpTo(1); tween(H[0].comps, H[0].next); }
    if (i === 4) {
      colourBy(H[0].R); showComps(H[0].next); setBadge("M-step", "components moved", "M"); chartUpTo(2);
      H[0].comps.forEach(function (c, k) { setCompEllipse(ghost[k], G, c, 1.5); setLine(arrows[k], G.x(c.mx), G.y(c.my), G.x(H[0].next[k].mx), G.y(H[0].next[k].my)); });
    }
    if (i === 5) { showComps(H[1].comps); colourBy(H[1].R); setBadge("E-step", "components FIXED · responsibilities sharpen", "E"); chartUpTo(2); }
    if (i === 6) {
      colourBy(H[1].R); setBadge("M-step", "responsibilities FIXED · components move", "M"); chartUpTo(3);
      H[1].comps.forEach(function (c, k) { setCompEllipse(ghost[k], G, c, 1.5); });
      tween(H[1].comps, H[1].next);
    }
    if (i === 7) { showComps(H[2].comps); colourBy(H[2].R); chartUpTo(H.length > 8 ? 8 : H.length); llTxt.textContent = "round " + 8 + ": " + H[7].ll.toFixed(1); }
    if (i === 8) { showComps(H[H.length - 1].comps); colourBy(H[H.length - 1].R); chartUpTo(H.length); llTxt.textContent = "round " + H.length + ": " + H[H.length - 1].ll.toFixed(1); }
  }
