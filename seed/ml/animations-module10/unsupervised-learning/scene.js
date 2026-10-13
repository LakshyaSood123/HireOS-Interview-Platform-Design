  var steps = [
    { id: "labeled-data", label: "Labeled data", caption: "Twelve customers: purchases per month against average spend. Here every customer comes with a known label: budget, heavy buyer or big spender." },
    { id: "supervised-view", label: "Supervised learning", caption: "Supervised learning uses features plus known labels to learn a rule that predicts the label of a new customer." },
    { id: "remove-labels", label: "Remove the labels", caption: "Now take the labels away. Nobody has told us what kind of customer each point is." },
    { id: "unlabeled-data", label: "Unlabeled data", caption: "This is the unsupervised setting: only the features remain. There is no answer key to learn from." },
    { id: "look-for-structure", label: "Look for structure", caption: "The goal changes: discover structure already in the data. Do some points sit together more than others?" },
    { id: "possible-groups", label: "Possible groups", caption: "The points seem to form three clumps. Clustering is the task of finding such groups of similar points automatically." },
    { id: "cluster-colors", label: "Clusters, not classes", caption: "A clustering algorithm returns groups, here colored 0, 1 and 2. The numbers are arbitrary names, not categories someone defined." },
    { id: "interpret-carefully", label: "Interpret carefully", caption: "Clustering is not classification without labels. Groups found by an algorithm need not match real-world categories, so a person has to judge what, if anything, they mean." }
  ];

  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 34, 30, 10, 10);
  var LBL = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2];
  var NAMES_L = ["budget", "heavy buyer", "big spender"];
  var hulls = [[2.1, 2.1, 1.8, 1.6], [6.6, 6.1, 1.6, 1.4], [3.7, 8.3, 1.9, 1.3]].map(function (h) {
    return el("ellipse", { cx: G.x(h[0]), cy: G.y(h[1]), rx: h[2] * G.sx, ry: h[3] * G.sy, fill: "none", stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "7 5" }, svg);
  });
  var dots = ptDots(svg, G, CPTS, 8);
  var legendG = el("g", {}, svg);
  NAMES_L.forEach(function (n, k) {
    el("circle", { cx: 440, cy: 52 + k * 24, r: 7, fill: KC[k], stroke: "#071510", "stroke-width": 2 }, legendG);
    txt(legendG, 454, 57 + k * 24, "lbl", n, "start");
  });
  txt(legendG, 432, 36, "lbl lbl-y", "known labels", "start");
  var panel = el("g", {}, svg);
  card(panel, 424, 140, 206, 150, "fillG");
  var p1 = txt(panel, 527, 172, "lbl lbl-y", "", "middle");
  var p2 = txt(panel, 527, 204, "big", "", "middle");
  var p3 = txt(panel, 527, 232, "big", "", "middle");
  var p4 = txt(panel, 527, 266, "note", "", "middle");
  var cluLegend = el("g", {}, svg);
  txt(cluLegend, 432, 36, "lbl lbl-y", "clusters found", "start");
  [0, 1, 2].forEach(function (k) {
    el("circle", { cx: 440, cy: 52 + k * 24, r: 7, fill: KC[k], stroke: "#071510", "stroke-width": 2 }, cluLegend);
    txt(cluLegend, 454, 57 + k * 24, "lbl", "cluster " + k, "start");
  });
  var cautionG = el("g", {}, svg);
  [["Not classification", "no labels were given", "fillA"], ["Ids are arbitrary", "cluster 0, 1, 2 are just names", "fillB"], ["You interpret", "a group may mean nothing real", "fillG"]].forEach(function (c, k) {
    card(cautionG, 424, 130 + k * 66, 206, 58, c[2]);
    txt(cautionG, 527, 154 + k * 66, "lbl lbl-y", c[0], "middle");
    txt(cautionG, 527, 174 + k * 66, "note", c[1], "middle");
  });

  function setPanel(a, b, c, d) { p1.textContent = a; p2.textContent = b; p3.textContent = c; p4.textContent = d || ""; }
  function render(index, id) {
    var i = index;
    var coloredByLabel = i <= 1;
    var coloredByCluster = i >= 6;
    dots.forEach(function (d, k) {
      d.setAttribute("fill", coloredByLabel ? KC[LBL[k]] : coloredByCluster ? KC[[1, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0][k]] : C_GRAY);
    });
    show(legendG, i <= 1); show(cluLegend, i >= 6);
    hulls.forEach(function (h) { show(h, i === 4 || i === 5); });
    hulls.forEach(function (h) { h.setAttribute("opacity", i === 4 ? "0.35" : i === 5 ? "1" : "0"); });
    show(panel, i === 1 || i === 3 || i === 4 || i === 5 || i === 6);
    show(cautionG, i === 7);
    if (i === 1) setPanel("supervised", "features + labels", "↓", "learn a rule that predicts the label");
    if (i === 3) setPanel("unsupervised", "features only", "no labels", "nothing to predict");
    if (i === 4) setPanel("the task", "find structure", "in the features", "which points belong together?");
    if (i === 5) setPanel("clustering", "group similar", "points together", "three groups appear");
    if (i === 6) setPanel("the output", "cluster ids", "0 · 1 · 2", "just names, not meanings");
  }
