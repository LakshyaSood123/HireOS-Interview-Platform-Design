  var steps = [
    { id: "same-dataset", label: "The same data", caption: "One dataset for both methods: 34 customers (purchases per month, average spend) from overlapping groups." },
    { id: "kmeans-centroids", label: "K-Means: centroids", caption: "K-Means with K = 3 gives each customer exactly one cluster and summarizes each cluster by a centroid." },
    { id: "hard-boundaries", label: "K-Means: hard boundaries", caption: "Every location belongs to its nearest centroid. The tinted regions have sharp boundaries: crossing one flips the label." },
    { id: "ambiguous-point", label: "A point in the overlap", caption: "This customer sits where two groups overlap. K-Means must still give it one label." },
    { id: "gmm-components", label: "GMM: components", caption: "A GMM with three components describes the same data with ellipses (1 and 2 standard deviations). Each has a mean, a spread and a weight." },
    { id: "soft-responsibility", label: "GMM: soft responsibility", caption: "The same customer gets responsibilities for all three components instead of one label: here about 0.43 and 0.57 for the two overlapping ones." },
    { id: "shape-flexibility", label: "Shape flexibility", caption: "The dashed circles are what K-Means assumes around its centroids. The GMM ellipses can be wide, narrow or differently sized, so they follow the groups more closely." },
    { id: "side-by-side", label: "Side by side", caption: "Left: K-Means, one hard color per customer. Right: GMM, colors blended by responsibility, so overlap shows as mixed colors. Both find the three groups." },
    { id: "when-kmeans", label: "When K-Means is enough", caption: "Use K-Means for compact, similar-looking groups when speed and simplicity matter and one label per point is acceptable." },
    { id: "when-gmm", label: "When a GMM helps", caption: "Use a GMM when overlap matters, when you want soft membership, or when groups differ in spread or orientation. It has more parameters and can also stop at a local optimum." },
    { id: "final-summary", label: "Summary", caption: "K-Means: hard membership, centroids, distance. GMM: soft membership, mean + spread + weight, responsibilities. Neither is always better, and both need the number of groups chosen." }
  ];

  var KM = kmeans2(GP, [[2, 5], [5, 3], [8, 3.5]], 20);
  var HH = runEM2(GP, GINIT, 14), FC = HH[HH.length - 1].comps, FR = HH[HH.length - 1].R;
  var amb = 0;
  FR.forEach(function (r, k) { if (Math.max.apply(null, r) < Math.max.apply(null, FR[amb])) amb = k; });
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 44, 330, 34, 29, 10, 10);
  var tintG = el("g", {}, svg);
  for (var iu = 0; iu < 25; iu++) for (var iv = 0; iv < 25; iv++) {
    var cu = (iu + 0.5) * 0.4, cv2 = (iv + 0.5) * 0.4, kk = nearestIdx([cu, cv2], KM.centers);
    el("rect", { x: G.x(iu * 0.4), y: G.y((iv + 1) * 0.4), width: G.sx * 0.4 + 0.6, height: G.sy * 0.4 + 0.6, fill: KC[kk], opacity: 0.2 }, tintG);
  }
  var ells = FC.map(function (c, k) { var e = compEllipse(svg, GCOL[k]); setCompEllipse(e, G, c, 1.5); return e; });
  var ells2 = FC.map(function (c, k) { var e = el("ellipse", { fill: "none", stroke: GCOL[k], "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg); setCompEllipse(e, G, c, 2.5); return e; });
  var circles = KM.centers.map(function (c, k) {
    var rad = 0, n = 0;
    GP.forEach(function (p, i) { if (KM.labels[i] === k) { rad += dist2d(p, c); n++; } });
    return el("circle", { cx: G.x(c[0]), cy: G.y(c[1]), r: 1.6 * (rad / n) * G.sx, fill: "none", stroke: KC[k], "stroke-width": 2.5, "stroke-dasharray": "8 5" }, svg);
  });
  var dots = ptDots(svg, G, GP, 6);
  var cents = KM.centers.map(function (c, k) { var m = centerMark(svg, KC[k]); setCenter(m, G, c); return m; });
  var ambRing = el("circle", { cx: G.x(GP[amb][0]), cy: G.y(GP[amb][1]), r: 13, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  var ambLbl = txt(svg, G.x(GP[amb][0]) + 16, G.y(GP[amb][1]) - 14, "lbl", "customer P", "start");
  var panel = el("g", {}, svg);
  card(panel, 404, 50, 228, 200, "fillG");
  var p1 = txt(panel, 518, 76, "lbl lbl-y", "", "middle");
  var p2 = txt(panel, 518, 112, "mono", "", "middle");
  var p3 = txt(panel, 518, 140, "mono", "", "middle");
  var p4 = txt(panel, 518, 168, "mono", "", "middle");
  var p5 = txt(panel, 518, 208, "note", "", "middle");
  var respG = el("g", {}, svg);
  card(respG, 404, 50, 228, 200, "fillB");
  txt(respG, 518, 76, "lbl lbl-y", "responsibilities of P", "middle");
  FR[amb].forEach(function (v, k) {
    var y = 96 + k * 44;
    txt(respG, 418, y + 20, "lbl", GNAME[k], "start").style.fill = GCOL[k];
    box(respG, 440, y, Math.max(3, v * 150), 26, GCOL[k], "none", 5);
    txt(respG, 440 + Math.max(3, v * 150) + 8, y + 19, "mono", f2(v), "start");
  });
  txt(respG, 518, 238, "note", "sum = 1", "middle");
  // side by side
  var sbs = el("g", {}, svg);
  var gl = makeGraph(34, 300, 28, 24), gr = makeGraph(346, 300, 28, 24);
  [[gl, "K-Means: hard labels"], [gr, "GMM: soft responsibilities"]].forEach(function (a) {
    var g4 = a[0];
    card(sbs, g4.ox - 14, 40, 280, 280, "fillA");
    el("line", { x1: g4.x(0), y1: g4.y(0), x2: g4.x(10), y2: g4.y(0), class: "axis" }, sbs);
    el("line", { x1: g4.x(0), y1: g4.y(0), x2: g4.x(0), y2: g4.y(10), class: "axis" }, sbs);
    txt(sbs, g4.ox + 126, 62, "lbl lbl-y", a[1], "middle");
  });
  GP.forEach(function (p, i) {
    el("circle", { cx: gl.x(p[0]), cy: gl.y(p[1]), r: 5, fill: KC[KM.labels[i]], stroke: "#071510", "stroke-width": 1.5 }, sbs);
    el("circle", { cx: gr.x(p[0]), cy: gr.y(p[1]), r: 5, fill: blendColor(FR[i]), stroke: "#071510", "stroke-width": 1.5 }, sbs);
  });
  KM.centers.forEach(function (c, k) { var m = centerMark(sbs, KC[k]); m.setAttribute("transform", "translate(" + gl.x(c[0]).toFixed(1) + "," + gl.y(c[1]).toFixed(1) + ") scale(0.6)"); });
  FC.forEach(function (c, k) { var e = compEllipse(sbs, GCOL[k]); e.setAttribute("cx", gr.x(c.mx)); e.setAttribute("cy", gr.y(c.my)); e.setAttribute("rx", 1.5 * c.sx * gr.sx); e.setAttribute("ry", 1.5 * c.sy * gr.sy); e.setAttribute("stroke-width", 2); });
  var useG = el("g", {}, svg);
  var useCards = [];
  [["K-Means", ["compact, similar-sized groups", "fast and simple", "one label per point is fine"], "fillA"], ["GMM", ["overlap matters", "soft membership wanted", "different spreads or orientations"], "fillG"]].forEach(function (c, k) {
    var cg = el("g", {}, useG);
    card(cg, 20 + k * 308, 50, 292, 220, c[2]);
    txt(cg, 166 + k * 308, 84, "big", c[0], "middle");
    c[1].forEach(function (s, n) { txt(cg, 166 + k * 308, 124 + n * 40, "lbl", s, "middle"); });
    useCards.push(cg);
  });
  var sumG = el("g", {}, svg);
  [["K-Means", ["hard membership", "centroid", "Euclidean distance"], "fillA"], ["GMM", ["soft membership", "mean + spread + weight", "responsibilities"], "fillG"]].forEach(function (c, k) {
    card(sumG, 20 + k * 308, 50, 292, 200, c[2]);
    txt(sumG, 166 + k * 308, 84, "big", c[0], "middle");
    c[1].forEach(function (s, n) { txt(sumG, 166 + k * 308, 124 + n * 36, "lbl", s, "middle"); });
  });
  txt(sumG, 320, 290, "lbl lbl-y", "neither is always better · both need the number of groups chosen", "middle");

  function setPanel(a, b, c, d, e) { p1.textContent = a; p2.textContent = b; p3.textContent = c; p4.textContent = d || ""; p5.textContent = e || ""; }
  function render(index, id) {
    var i = index;
    var main = i <= 6;
    show(plotG, main); dots.forEach(function (d) { show(d, main); });
    show(tintG, i === 2);
    show(sbs, i === 7); show(useG, i === 8 || i === 9); show(sumG, i === 10);
    useCards[0].setAttribute("opacity", i === 9 ? "0.3" : "1"); useCards[1].setAttribute("opacity", i === 8 ? "0.3" : "1");
    cents.forEach(function (m) { show(m, i >= 1 && i <= 3 || i === 6); });
    ells.forEach(function (e) { show(e, i >= 4 && i <= 6); }); ells2.forEach(function (e) { show(e, i === 4); });
    circles.forEach(function (c) { show(c, i === 6); });
    show(ambRing, i >= 3 && i <= 5); show(ambLbl, i >= 3 && i <= 5);
    show(panel, i >= 1 && i <= 4 || i === 6); show(respG, i === 5);
    dots.forEach(function (d, k) { d.setAttribute("fill", i === 0 ? C_GRAY : (i <= 3 ? KC[KM.labels[k]] : blendColor(FR[k]))); });
    if (i === 1) setPanel("K-Means", "hard membership", "one centroid each", "Euclidean distance", "one label per point");
    if (i === 2) setPanel("hard boundaries", "each region has", "exactly one owner", "", "labels flip at the edge");
    if (i === 3) setPanel("point P", "K-Means label: " + (KM.labels[amb] + 1), "no sign of the doubt", "", "forced to one cluster");
    if (i === 4) setPanel("GMM", "soft membership", "mean + spread + weight", "", "ellipses: 1σ and 2σ");
    if (i === 6) setPanel("circles vs ellipses", "dashed: K-Means", "solid: GMM", "", "ellipses can differ in size");
  }
