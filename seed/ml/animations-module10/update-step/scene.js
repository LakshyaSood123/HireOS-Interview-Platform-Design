  var steps = [
    { id: "assigned-groups", label: "Assignments are frozen", caption: "Update step: the memberships from the assignment step are frozen. The old centers (diamonds) are still at their starting positions." },
    { id: "select-cluster", label: "Pick one cluster", caption: "Take the middle cluster (gold): the customers (6, 6), (6.5, 5.5) and (7, 6.2). The other clusters are dimmed for now." },
    { id: "collect-x", label: "Collect the x values", caption: "Read off the purchases per month of the three members: 6, 6.5 and 7." },
    { id: "collect-y", label: "Collect the y values", caption: "Read off their average spend: 6, 5.5 and 6.2." },
    { id: "average-x", label: "Average the x values", caption: "Mean x = (6 + 6.5 + 7) / 3 = 6.5. The vertical line marks it." },
    { id: "average-y", label: "Average the y values", caption: "Mean y = (6 + 5.5 + 6.2) / 3 = 5.9. The horizontal line marks it." },
    { id: "new-centroid", label: "The new centroid", caption: "The new centroid is (6.5, 5.9), the coordinate-wise mean. It need not be one of the data points." },
    { id: "move-centroid", label: "Move the center", caption: "The center moves from (5, 3) to (6.5, 5.9). The three customers do not move; only the center does." },
    { id: "update-all", label: "Update all the centers", caption: "Every cluster does the same. The centers move to (1.68, 2.0), (6.5, 5.9) and (4.3, 7.98). Memberships are still the old ones, so the next assignment may change them." }
  ];

  var A1 = assignAll(CPTS, C0);
  var N1 = updateAll(CPTS, A1, C0);
  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 36, 30, 10, 10);
  var memberIdx = [4, 5, 6];
  var guideG = el("g", {}, svg);
  var vguides = memberIdx.map(function (k) { return el("line", { x1: G.x(CPTS[k][0]), y1: G.y(CPTS[k][1]), x2: G.x(CPTS[k][0]), y2: G.y(0), stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "4 4" }, guideG); });
  var hguides = memberIdx.map(function (k) { return el("line", { x1: G.x(CPTS[k][0]), y1: G.y(CPTS[k][1]), x2: G.x(0), y2: G.y(CPTS[k][1]), stroke: "#a78bfa", "stroke-width": 2, "stroke-dasharray": "4 4" }, guideG); });
  var avgV = el("line", { x1: G.x(N1[1][0]), y1: G.y(0), x2: G.x(N1[1][0]), y2: G.y(10), stroke: "#e2b44a", "stroke-width": 3 }, svg);
  var avgH = el("line", { x1: G.x(0), y1: G.y(N1[1][1]), x2: G.x(10), y2: G.y(N1[1][1]), stroke: "#a78bfa", "stroke-width": 3 }, svg);
  var dots = ptDots(svg, G, CPTS, 8);
  var newMark = el("circle", { r: 11, fill: "none", stroke: "#e6f5ec", "stroke-width": 4, "stroke-dasharray": "4 3" }, svg);
  newMark.setAttribute("transform", "translate(" + G.x(N1[1][0]) + "," + G.y(N1[1][1]) + ")");
  var arrowMove = arrow(svg, "w", 4);
  var marks = [0, 1, 2].map(function (k) { var m = centerMark(svg, KC[k]); setCenter(m, G, C0[k]); return m; });
  var panel = el("g", {}, svg);
  card(panel, 424, 50, 206, 230, "fillG");
  var t1 = txt(panel, 527, 78, "lbl lbl-y", "", "middle");
  var t2 = txt(panel, 527, 118, "mono", "", "middle");
  var t3 = txt(panel, 527, 152, "mono", "", "middle");
  var t4 = txt(panel, 527, 196, "big", "", "middle");
  var t5 = txt(panel, 527, 246, "note", "", "middle");
  function setPanel(a, b, c, d, e) { t1.textContent = a; t2.textContent = b; t3.textContent = c; t4.textContent = d || ""; t5.textContent = e || ""; }

  function render(index, id) {
    var i = index;
    dots.forEach(function (d, k) {
      var focus = i >= 1 && i <= 7;
      d.setAttribute("fill", KC[A1[k]]);
      d.setAttribute("opacity", focus && A1[k] !== 1 ? "0.25" : "1");
    });
    show(vguides[0], i === 2); vguides.forEach(function (g2) { show(g2, i === 2); });
    hguides.forEach(function (g2) { show(g2, i === 3); });
    show(avgV, i >= 4 && i <= 6); show(avgH, i >= 5 && i <= 6);
    show(newMark, i >= 6 && i <= 7);
    show(arrowMove, i === 7);
    show(panel, i >= 2);
    marks.forEach(function (m, k) { setCenter(m, G, C0[k]); m.setAttribute("opacity", i >= 1 && i <= 6 && k !== 1 ? "0.3" : "1"); });
    if (i === 2) setPanel("x values", "6   6.5   7", "", "", "purchases per month");
    if (i === 3) setPanel("y values", "6   5.5   6.2", "", "", "average spend");
    if (i === 4) setPanel("mean x", "(6 + 6.5 + 7) / 3", "= 19.5 / 3", "6.5", "");
    if (i === 5) setPanel("mean y", "(6 + 5.5 + 6.2) / 3", "= 17.7 / 3", "5.9", "");
    if (i === 6) setPanel("new centroid", "(mean x, mean y)", "", "(6.5, 5.9)", "the mean of its members");
    if (i === 7) setPanel("move the center", "old (5, 3)", "new (6.5, 5.9)", "", "points do not move");
    if (i === 8) setPanel("all centers", "(1.68, 2.0)", "(6.5, 5.9)  (4.3, 7.98)", "", "memberships still frozen");
    if (i === 7) {
      setLine(arrowMove, G.x(C0[1][0]), G.y(C0[1][1]), G.x(N1[1][0]), G.y(N1[1][1]));
      anim("mv", 1300, function (e) { setCenter(marks[1], G, [lerp(C0[1][0], N1[1][0], e), lerp(C0[1][1], N1[1][1], e)]); });
    }
    if (i === 8) anim("mv", 1500, function (e) { marks.forEach(function (m, k) { setCenter(m, G, [lerp(C0[k][0], N1[k][0], e), lerp(C0[k][1], N1[k][1], e)]); }); });
  }
