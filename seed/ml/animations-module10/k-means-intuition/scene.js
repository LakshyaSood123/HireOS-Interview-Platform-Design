  var steps = [
    { id: "dataset", label: "The customer data", caption: "Our twelve customers again, with no labels. We want to group them by similarity." },
    { id: "choose-k", label: "Choose K", caption: "K-Means needs the number of clusters in advance. We choose K = 3." },
    { id: "initial-centers", label: "Place K initial centers", caption: "Start with three centers (diamonds), here at (3, 4), (5, 3) and (5, 9.5). They live in the same space as the data." },
    { id: "nearest-center", label: "Find each point's nearest center", caption: "Every customer finds the center nearest to it. The thin lines show these choices." },
    { id: "assign-groups", label: "Assign to groups", caption: "Each customer joins the group of its nearest center. The grouping is rough: one customer, at (6.8, 6.8), joined the wrong clump." },
    { id: "compute-means", label: "Compute the group means", caption: "For each group, find the mean position of its members (the crosses). This is where its center would be if it sat in the middle of its points." },
    { id: "move-centers", label: "Move the centers", caption: "Each center moves to the mean of its group. The centers now fit their groups better." },
    { id: "repeat", label: "Repeat", caption: "With the centers moved, assign again: the stray customer switches groups. Then move the centers once more." },
    { id: "final-clusters", label: "The final clusters", caption: "Now nothing changes: three clusters and three centers near (1.68, 2.0), (6.58, 6.12) and (3.67, 8.28). K-Means alternates assign and move until the groups are stable." }
  ];

  var H = runKMeans(CPTS, C0, 6);
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 36, 30, 10, 10);
  var lineG = el("g", {}, svg);
  var lines = CPTS.map(function () { return el("line", { stroke: "rgba(201,220,207,0.55)", "stroke-width": 1.5 }, lineG); });
  var dots = ptDots(svg, G, CPTS, 8);
  var meanG = el("g", {}, svg);
  var crosses = [0, 1, 2].map(function (k) {
    var c = el("g", {}, meanG);
    el("line", { x1: -9, y1: -9, x2: 9, y2: 9, stroke: KC[k], "stroke-width": 4 }, c);
    el("line", { x1: -9, y1: 9, x2: 9, y2: -9, stroke: KC[k], "stroke-width": 4 }, c);
    c.setAttribute("transform", "translate(" + G.x(H[0].newCenters[k][0]) + "," + G.y(H[0].newCenters[k][1]) + ")");
    return c;
  });
  var marks = [0, 1, 2].map(function (k) { return centerMark(svg, KC[k]); });
  var kBadge = el("g", {}, svg);
  chip(kBadge, 330, 40, 80, 30, "K = 3", "rgba(226,180,74,0.25)", "#e2b44a", "lbl");

  var loopG = el("g", {}, svg);
  var STEPS_LOOP = [["1", "start with K centers"], ["2", "assign each point to its nearest center"], ["3", "move each center to the mean of its points"], ["4", "repeat until nothing changes"]];
  var loopBoxes = STEPS_LOOP.map(function (s, k) {
    var y = 70 + k * 62;
    var b = box(loopG, 424, y, 206, 50, "rgba(255,255,255,0.06)", "rgba(255,255,255,0.3)", 8);
    txt(loopG, 440, y + 30, "big", s[0], "middle");
    txt(loopG, 540, y + 24, "note", s[1].split(" ").slice(0, 4).join(" "), "middle");
    txt(loopG, 540, y + 40, "note", s[1].split(" ").slice(4).join(" "), "middle");
    return b;
  });
  txt(loopG, 527, 46, "lbl lbl-y", "the K-Means loop", "middle");
  var status = txt(svg, 527, 332, "mono", "", "middle");

  function colourBy(labels, on) {
    dots.forEach(function (d, k) { d.setAttribute("fill", on ? KC[labels[k]] : C_GRAY); });
  }
  function drawLines(centers, labels) {
    CPTS.forEach(function (c, k) {
      var ct = centers[labels[k]];
      setLine(lines[k], G.x(c[0]), G.y(c[1]), G.x(ct[0]), G.y(ct[1]));
      lines[k].setAttribute("stroke", "rgba(201,220,207,0.55)");
    });
  }
  function highlightLoop(n) {
    loopBoxes.forEach(function (b, k) {
      b.setAttribute("fill", k === n ? "rgba(29,181,132,0.3)" : "rgba(255,255,255,0.06)");
      b.setAttribute("stroke", k === n ? C_OK : "rgba(255,255,255,0.3)");
    });
  }

  function render(index, id) {
    var i = index;
    show(kBadge, i === 1);
    marks.forEach(function (m) { show(m, i >= 2); });
    show(lineG, i === 3 || i === 4);
    crosses.forEach(function (c) { show(c, i === 5); });
    show(loopG, i >= 1);
    status.textContent = i === 8 ? "converged: stable" : "";
    highlightLoop(i <= 1 ? -1 : i === 2 ? 0 : i <= 4 ? 1 : i <= 6 ? 2 : 3);
    if (i <= 3) { colourBy(H[0].labels, false); }
    if (i === 4 || i === 5 || i === 6) colourBy(H[0].labels, true);
    if (i >= 2 && i <= 5) marks.forEach(function (m, k) { setCenter(m, G, H[0].centers[k]); });
    if (i === 3 || i === 4) drawLines(H[0].centers, H[0].labels);
    if (i === 6) anim("mv", 1200, function (e) { marks.forEach(function (m, k) { setCenter(m, G, [lerp(H[0].centers[k][0], H[0].newCenters[k][0], e), lerp(H[0].centers[k][1], H[0].newCenters[k][1], e)]); }); });
    if (i === 7) {
      colourBy(H[1].labels, true);
      anim("mv", 1400, function (e) { marks.forEach(function (m, k) { setCenter(m, G, [lerp(H[0].newCenters[k][0], H[1].newCenters[k][0], e), lerp(H[0].newCenters[k][1], H[1].newCenters[k][1], e)]); }); });
    }
    if (i === 8) { colourBy(H[1].labels, true); marks.forEach(function (m, k) { setCenter(m, G, H[1].newCenters[k]); }); }
  }
