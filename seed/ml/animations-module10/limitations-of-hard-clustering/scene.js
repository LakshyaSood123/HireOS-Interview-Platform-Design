  var steps = [
    { id: "clean-kmeans", label: "K-Means at its best", caption: "On compact, well-separated groups like our customers, K-Means works very well: three clean clusters with their centers." },
    { id: "hard-assignment", label: "Hard assignment", caption: "K-Means is a hard clustering method: every point belongs to exactly one cluster. This customer is in cluster 1, completely." },
    { id: "ambiguous-point", label: "An ambiguous point", caption: "A new customer Z = (5, 7) lies between two groups. Its distance to the middle center is 1.80 and to the top-left center 1.84: almost a tie." },
    { id: "forced-choice", label: "A forced choice", caption: "K-Means must pick one cluster, and a tiny move flips the choice. Z at (5, 7) goes to the middle cluster; at (4.7, 7.1) it goes to the top-left one. The hard label hides how uncertain it is." },
    { id: "non-spherical-data", label: "Elongated groups", caption: "Distance to centers favors round, compact clusters. Two long parallel strips are the natural groups, but K-Means with K = 2 cuts across them into a left half and a right half." },
    { id: "unequal-density", label: "Unequal sizes", caption: "A large spread-out group beside a small tight one: K-Means gives the small group (and a third of the big one) to the same cluster, an unintuitive split." },
    { id: "initialization-change", label: "Initialization matters", caption: "With different starting centers on our customers, K-Means converges to a worse solution (WCSS 29.48 instead of 4.18). The result depends on where you start." },
    { id: "choose-k", label: "You must choose K", caption: "K is supplied in advance. K = 2 merges two real groups, K = 3 matches the data, K = 4 splits a group. The WCSS always falls as K grows, so it cannot choose K by itself." },
    { id: "soft-membership-preview", label: "Soft membership", caption: "Sometimes we want membership degrees instead of one label, for example 0.02, 0.52 and 0.46 for the ambiguous customer. That is soft clustering, and how to compute such memberships is the next module. Illustration only." }
  ];

  var H = runKMeans(CPTS, C0, 6);
  var FIN = H[1].newCenters, FLAB = H[1].labels;
  var Zs = [5, 7], Ze = [4.7, 7.1];
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 36, 30, 10, 10);
  var dots = ptDots(svg, G, CPTS, 8);
  var marks = [0, 1, 2].map(function (k) { var m = centerMark(svg, KC[k]); setCenter(m, G, FIN[k]); return m; });
  var pt1 = el("circle", { cx: G.x(CPTS[5][0]), cy: G.y(CPTS[5][1]), r: 15, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  var zDot = el("circle", { r: 9, fill: C_GRAY, stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  var zLbl = txt(svg, 0, 0, "lbl", "Z", "middle");
  var zl = [1, 2].map(function (k) { return el("line", { stroke: KC[k], "stroke-width": 3, "stroke-dasharray": "6 4" }, svg); });
  var zt = [1, 2].map(function (k) { var t = txt(svg, 0, 0, "lbl", "", "middle"); t.style.fill = KC[k]; return t; });

  // Elongated strips with K = 2.
  var STRIP = [];
  for (var s = 0; s < 10; s++) { STRIP.push([s + 0.5, 2.2 + 0.1 * (((s * 7) % 3) - 1)]); }
  for (var s2 = 0; s2 < 10; s2++) { STRIP.push([s2 + 0.5, 3.4 + 0.1 * (((s2 * 5) % 3) - 1)]); }
  var HS = runKMeans(STRIP, [[2, 2.2], [8, 3.4]], 12);
  var stripG = el("g", {}, svg);
  var stripDots = ptDots(stripG, G, STRIP, 7);
  var stripBox = el("rect", { x: G.x(0.1), y: G.y(2.6), width: G.sx * 9.8, height: G.sy * 0.6, rx: 8, fill: "none", stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "6 4" }, stripG);
  var stripBox2 = el("rect", { x: G.x(0.1), y: G.y(3.8), width: G.sx * 9.8, height: G.sy * 0.6, rx: 8, fill: "none", stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "6 4" }, stripG);
  txt(stripG, G.x(5), G.y(4.4), "lbl lbl-y", "two natural strips", "middle");
  var stripMarks = [0, 1].map(function (k) { var m = centerMark(stripG, KC[k]); setCenter(m, G, HS[HS.length - 1].newCenters[k]); return m; });

  // Unequal sizes with K = 2.
  var BLOB = [];
  for (var b = 0; b < 24; b++) BLOB.push([0.8 + (b % 6) * 1.0, 2.65 + Math.floor(b / 6) * 1.1]);
  [[-0.2, -0.2], [0.2, -0.2], [0, 0], [-0.2, 0.2], [0.2, 0.2]].forEach(function (o) { BLOB.push([8.0 + o[0], 4.4 + o[1]]); });
  var HB = runKMeans(BLOB, [[2, 4.5], [7, 4.5]], 12);
  var blobG = el("g", {}, svg);
  var blobDots = ptDots(blobG, G, BLOB, 6);
  var blobMarks = [0, 1].map(function (k) { var m = centerMark(blobG, KC[k]); setCenter(m, G, HB[HB.length - 1].newCenters[k]); return m; });
  txt(blobG, G.x(8), G.y(5.4), "lbl lbl-y", "small tight group", "middle");
  txt(blobG, G.x(3.2), G.y(7.2), "lbl lbl-y", "large spread-out group", "middle");

  // Choose K: three small panels.
  var kG = el("g", {}, svg);
  var KR = [
    { k: 2, init: [[1, 2], [6, 6]] },
    { k: 3, init: C0 },
    { k: 4, init: [[2, 2], [6, 6], [3.5, 8.5], [7, 6.5]] }
  ];
  KR.forEach(function (r, n) {
    var hist = runKMeans(CPTS, r.init, 12), last = hist[hist.length - 1];
    var ox = 24 + n * 204, g4 = makeGraph(ox + 14, 270, 17, 17);
    card(kG, ox, 56, 190, 250, "fillA");
    txt(kG, ox + 95, 80, "lbl lbl-y", "K = " + r.k, "middle");
    el("line", { x1: g4.x(0), y1: g4.y(0), x2: g4.x(10), y2: g4.y(0), class: "axis" }, kG);
    el("line", { x1: g4.x(0), y1: g4.y(0), x2: g4.x(0), y2: g4.y(10), class: "axis" }, kG);
    CPTS.forEach(function (p, i) { el("circle", { cx: g4.x(p[0]), cy: g4.y(p[1]), r: 4.5, fill: KC[last.labels[i]], stroke: "#071510", "stroke-width": 1.5 }, kG); });
    last.newCenters.forEach(function (c, i) { var m = centerMark(kG, KC[i]); m.setAttribute("transform", "translate(" + g4.x(c[0]).toFixed(1) + "," + g4.y(c[1]).toFixed(1) + ") scale(0.6)"); });
    txt(kG, ox + 95, 298, "mono", "WCSS " + f2(last.wcssUpdate), "middle");
  });
  txt(kG, 124, 40, "note", "merges two groups", "middle");
  txt(kG, 328, 40, "note", "matches the data", "middle");
  txt(kG, 532, 40, "note", "splits a group", "middle");

  var panel = el("g", {}, svg);
  card(panel, 424, 50, 206, 220, "fillG");
  var t1 = txt(panel, 527, 78, "lbl lbl-y", "", "middle");
  var t2 = txt(panel, 527, 116, "big", "", "middle");
  var t3 = txt(panel, 527, 150, "big", "", "middle");
  var t4 = txt(panel, 527, 190, "note", "", "middle");
  var t5 = txt(panel, 527, 214, "note", "", "middle");
  var t6 = txt(panel, 527, 242, "lbl lbl-g", "", "middle");
  function setPanel(a, b, c, d, e, f) { t1.textContent = a; t2.textContent = b; t3.textContent = c; t4.textContent = d || ""; t5.textContent = e || ""; t6.textContent = f || ""; }
  var softG = el("g", {}, svg);
  card(softG, 424, 40, 206, 250, "fillB");
  txt(softG, 527, 66, "lbl lbl-y", "soft membership of Z", "middle");
  [["A", 0.02, 0], ["B", 0.52, 1], ["C", 0.46, 2]].forEach(function (r, k) {
    var y = 92 + k * 52;
    txt(softG, 440, y + 22, "lbl", "cluster " + r[0], "start");
    box(softG, 440, y + 30, 170 * r[1] + 3, 14, KC[r[2]], "none", 4);
    txt(softG, 440 + 170 * r[1] + 8, y + 42, "mono", f2(r[1]), "start");
  });
  txt(softG, 527, 258, "note", "illustration only", "middle");
  txt(softG, 527, 276, "note", "computed in the next module", "middle");
  var hardTxt = txt(svg, 527, 316, "lbl", "", "middle");

  function placeZ(x, y) {
    var zc = [x, y];
    zDot.setAttribute("cx", G.x(x)); zDot.setAttribute("cy", G.y(y));
    zLbl.setAttribute("x", G.x(x) + 16); zLbl.setAttribute("y", G.y(y) - 12);
    var k = nearestIdx(zc, FIN);
    zDot.setAttribute("fill", KC[k]);
    [1, 2].forEach(function (c, n) {
      setLine(zl[n], G.x(x), G.y(y), G.x(FIN[c][0]), G.y(FIN[c][1]));
      zt[n].setAttribute("x", G.x(x) + 0.35 * (G.x(FIN[c][0]) - G.x(x)) + (n ? -10 : 16));
      zt[n].setAttribute("y", G.y(y) + 0.35 * (G.y(FIN[c][1]) - G.y(y)) + (n ? -10 : 18));
      zt[n].textContent = f2(dist2d(zc, FIN[c]));
    });
    return k;
  }

  function render(index, id) {
    var i = index;
    var custMode = i <= 3 || i === 6 || i === 8;
    show(plotG, i !== 7);
    dots.forEach(function (d) { show(d, custMode); });
    marks.forEach(function (m) { show(m, custMode); });
    show(stripG, i === 4); show(blobG, i === 5); show(kG, i === 7);
    show(panel, i <= 6); show(softG, i === 8);
    show(pt1, i === 1);
    var zOn = i >= 2 && i <= 3 || i === 8;
    show(zDot, zOn); show(zLbl, zOn);
    zl.forEach(function (l) { show(l, i === 2 || i === 3); }); zt.forEach(function (t) { show(t, i === 2 || i === 3); });
    show(hardTxt, i === 8);
    if (custMode) {
      var lab = i === 6 ? runKMeans(CPTS, [[1, 2], [2, 2], [5, 7]], 10) : null;
      var useL = i === 6 ? lab[lab.length - 1].labels : FLAB, useC = i === 6 ? lab[lab.length - 1].newCenters : FIN;
      dots.forEach(function (d, k) { d.setAttribute("fill", KC[useL[k]]); d.setAttribute("opacity", i === 8 ? "0.5" : "1"); });
      marks.forEach(function (m, k) { setCenter(m, G, useC[k]); });
    }
    if (i === 0) setPanel("compact groups", "K-Means works", "well here", "clearly separated,", "roughly round", "");
    if (i === 1) setPanel("hard clustering", "one point →", "one cluster", "no 60% / 40%", "", "");
    if (i === 2) { placeZ(Zs[0], Zs[1]); setPanel("Z at (5, 7)", "1.80 vs 1.84", "almost a tie", "", "", ""); }
    if (i === 3) {
      setPanel("Z moves", "nearest flips", "", "tiny move,", "different cluster", "hard label hides doubt");
      anim("z", 2200, function (e) { var k = placeZ(lerp(Zs[0], Ze[0], e), lerp(Zs[1], Ze[1], e)); t2.textContent = "cluster " + (k === 1 ? "B (middle)" : "C (top left)"); });
    }
    if (i === 4) setPanel("two strips", "K = 2 cuts", "across them", "natural groups are", "long and thin", "left | right split");
    if (i === 5) setPanel("unequal sizes", "small group", "merged with a", "third of the", "big group", "unintuitive");
    if (i === 6) setPanel("another start", "WCSS 29.48", "vs 4.18", "converged, but", "to a worse solution", "");
    if (i === 8) { placeZ(Zs[0], Zs[1]); zDot.setAttribute("fill", "#e6f5ec"); hardTxt.textContent = "K-Means says: cluster B, nothing else"; }
    if (i === 4) stripDots.forEach(function (d, k) { d.setAttribute("fill", KC[HS[HS.length - 1].labels[k]]); });
    if (i === 5) blobDots.forEach(function (d, k) { d.setAttribute("fill", KC[HB[HB.length - 1].labels[k]]); });
  }
