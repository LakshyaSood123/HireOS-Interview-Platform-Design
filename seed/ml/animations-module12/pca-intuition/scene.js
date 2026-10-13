  var steps = [
    {"id": "original-data", "label": "Original data", "caption": "The six customers as they are: usage across, monthly spend up."},
    {"id": "center", "label": "Center", "caption": "Subtract the feature means (4.5, 3.5). The center of the cloud moves to the origin."},
    {"id": "principal-axis", "label": "Principal axis", "caption": "PC1 follows the cloud (yellow). PC2 is perpendicular to it (blue)."},
    {"id": "project", "label": "Project", "caption": "Drop each point perpendicularly onto the PC1 axis."},
    {"id": "pc1-coordinate", "label": "PC1 coordinates", "caption": "Each customer's position along PC1 is its new coordinate z."},
    {"id": "drop-pc2", "label": "Drop PC2", "caption": "The perpendicular distances (red) are the PC2 coordinates. They are all small, so dropping them loses little."},
    {"id": "one-dimensional-data", "label": "One-dimensional data", "caption": "The data is now six numbers on a line: the PC1 coordinates."},
    {"id": "compare-representations", "label": "Compare", "caption": "Two numbers per customer keep everything. One number per customer keeps 97.2% of the variance."},
    {"id": "pca-summary", "label": "PCA in three moves", "caption": "Center, find the directions of greatest variance, keep the top coordinates. PC1 is a new feature that mixes both originals."}
  ];

  var origAx = el("g", {}, svg);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(8), y2: OP.y(0), class: "axis" }, origAx);
  el("line", { x1: OP.x(0), y1: OP.y(0), x2: OP.x(0), y2: OP.y(7), class: "axis" }, origAx);
  txt(origAx, OP.x(8), OP.y(0) + 16, "note", "usage", "end");
  txt(origAx, OP.x(0) + 6, OP.y(7) + 4, "note", "spend", "start");
  var cenAx = frameAxes(svg, CP, 4.5, 3.5);
  var meanDot = el("circle", { cx: CP.x(0), cy: CP.y(0), r: 5, fill: "none", stroke: "#e6f5ec", "stroke-width": 2 }, svg);
  var pc1 = dirLine(svg, CP, C_PC1, 3.5), pc2 = dirLine(svg, CP, C_PC2, 2.5, true);
  setDir(pc1, CP, DV1, 4.5); setDir(pc2, CP, DV2, 3.0);
  var t1 = txt(svg, CP.x(3.3 * DV1[0]) - 8, CP.y(3.3 * DV1[1]) - 14, "lbl lbl-y", "PC1", "end");
  var t2 = txt(svg, CP.x(-2.3 * DV2[0]) + 8, CP.y(-2.3 * DV2[1]) + 16, "lbl lbl-b", "PC2", "start");
  var drops = dropSet(svg, C_PRJ, DN);
  setDrops(drops, CP, DC, DV1);
  var zl = DC.map(function (c, k) {
    var sg = DZ2[k] >= 0 ? 1 : -1;
    var p = CP.pt([DZ1[k] * DV1[0] - 0.45 * sg * DV2[0], DZ1[k] * DV1[1] - 0.45 * sg * DV2[1]]);
    return txt(svg, p[0], p[1] + 4, "note", s2(DZ1[k]), "middle");
  });
  var dots = dotsAt(svg, CP, DC, 7);
  var one = el("g", {}, svg);
  var NL = numLine(one, 50, 610, 190, -4, 4, 1);
  DZ1.forEach(function (z, i) { el("circle", { cx: NL.x(z), cy: 190, r: 9, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, one); });
  txt(one, 330, 140, "lbl lbl-y", "PC1 coordinate z of each customer", "middle");
  txt(one, 330, 236, "note", "PC2 dropped: its values were all small", "middle");
  txt(one, 330, 290, "big", "6 numbers instead of 12", "middle");
  var cmp = el("g", {}, svg);
  card(cmp, 30, 70, 280, 150, "fillA"); card(cmp, 330, 70, 280, 150, "fillG");
  txt(cmp, 170, 104, "big", "two numbers each", "middle");
  txt(cmp, 170, 134, "note", "usage, spend: 12 numbers in all", "middle");
  txt(cmp, 170, 160, "note", "keeps 100% of the variance", "middle");
  txt(cmp, 470, 104, "big", "one number each", "middle");
  txt(cmp, 470, 134, "note", "PC1 coordinate z: 6 numbers", "middle");
  txt(cmp, 470, 160, "note", "keeps " + (DEV1 * 100).toFixed(1) + "% of the variance", "middle");
  txt(cmp, 320, 262, "lbl lbl-y", "smaller description, a little detail lost", "middle");
  var sum = el("g", {}, svg);
  card(sum, 30, 60, 580, 240, "fillG");
  txt(sum, 320, 92, "big", "PCA in three moves", "middle");
  txt(sum, 60, 128, "lbl", "1. Center the data: subtract each feature's mean.", "start");
  txt(sum, 60, 158, "lbl", "2. Find the directions of greatest variance (PC1, PC2).", "start");
  txt(sum, 60, 188, "lbl", "3. Keep the coordinates along the top directions.", "start");
  txt(sum, 320, 232, "mono", "z = " + f3(DV1[0]) + " (usage − " + f2(DMEAN[0]) + ") + " + f3(DV1[1]) + " (spend − " + f2(DMEAN[1]) + ")", "middle");
  txt(sum, 320, 262, "note", "PC1 is a new feature that mixes both original features", "middle");
  txt(sum, 320, 284, "note", "unsupervised and linear: no labels used", "middle");
  function render(i) {
    var plotOn = i <= 5;
    show(origAx, i === 0); show(cenAx, i >= 1 && i <= 5); show(meanDot, i >= 1 && i <= 5);
    dots.forEach(function (d) { show(d, plotOn); });
    show(pc1, i >= 2 && i <= 5); show(pc2, i >= 2 && i <= 5); show(t1, i >= 2 && i <= 5); show(t2, i >= 2 && i <= 5);
    drops.lines.forEach(function (l, k) {
      var on = i >= 3 && i <= 5;
      show(l, on); show(drops.feet[k], on);
      l.setAttribute("stroke", i === 5 ? C_LOSS : C_PRJ); l.setAttribute("stroke-width", i === 5 ? "3" : "1.8");
    });
    zl.forEach(function (t) { show(t, i === 4 || i === 5); });
    show(one, i === 6); show(cmp, i === 7); show(sum, i === 8);
    pc2.setAttribute("opacity", i === 5 ? "0.35" : (i >= 2 && i <= 4 ? "1" : "0"));
  }

  flatCards();
