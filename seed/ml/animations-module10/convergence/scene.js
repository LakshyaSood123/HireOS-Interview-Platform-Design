  var steps = [
    { id: "initial-state", label: "The starting state", caption: "K-Means alternates assignment and update. We track the objective: the sum of squared distances from every point to its assigned center (WCSS). Smaller means tighter clusters. Start from the three initial centers." },
    { id: "assignment-1", label: "Assignment 1", caption: "Assign each customer to its nearest center. With these starting centers the WCSS is 82.06." },
    { id: "update-1", label: "Update 1", caption: "Move each center to the mean of its group. With the same memberships, the WCSS falls to 13.06." },
    { id: "objective-drops", label: "The objective drops", caption: "From 82.06 to 13.06 just by moving the centers. The update step cannot make the objective larger." },
    { id: "assignment-2", label: "Assignment 2", caption: "With the moved centers, the stray customer at (6.8, 6.8) switches to the middle cluster. Reassigning to nearer centers cannot raise the objective: it is now 6.31." },
    { id: "update-2", label: "Update 2", caption: "Move the centers to the new group means: (1.68, 2.0), (6.58, 6.12) and (3.67, 8.28). The WCSS is 4.18." },
    { id: "objective-drops-again", label: "The objective drops again", caption: "6.31 to 4.18. Every step either lowers the objective or leaves it unchanged, so K-Means cannot wander." },
    { id: "stable-centers", label: "Nothing changes", caption: "A third assignment changes no memberships, so a third update would not move the centers. The WCSS stays at 4.18." },
    { id: "converged", label: "Converged", caption: "Memberships and centers are stable: K-Means has converged after two updates. Convergence is guaranteed to happen in a finite number of rounds." },
    { id: "different-initialization-preview", label: "A different start", caption: "Convergence is not the global best. From the starting centers (1, 2), (2, 2) and (5, 7) the loop also converges, but to a worse stable solution (WCSS 29.48): one natural group is split and two are merged." }
  ];

  var H = runKMeans(CPTS, C0, 6);
  var H2 = runKMeans(CPTS, [[1, 2], [2, 2], [5, 7]], 10);
  var F2 = H2[H2.length - 1];
  var OBJ = [H[0].wcssAssign, H[0].wcssUpdate, H[1].wcssAssign, H[1].wcssUpdate, H[2].wcssAssign];
  var OBJ_LAB = ["A1", "U1", "A2", "U2", "A3"];

  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 44, 330, 30, 30, 10, 10);
  var dots = ptDots(svg, G, CPTS, 7);
  var marks = [0, 1, 2].map(function (k) { return centerMark(svg, KC[k]); });
  var badge = el("g", {}, svg);
  chip(badge, 120, 252, 190, 30, "converged: stable", "rgba(29,181,132,0.3)", C_OK, "lbl");

  var chartG = el("g", {}, svg);
  card(chartG, 366, 40, 266, 296, "fillA");
  txt(chartG, 499, 64, "lbl lbl-y", "objective (WCSS) per step", "middle");
  var BASE = 300, SC = 170 / 82;
  el("line", { x1: 380, y1: BASE, x2: 620, y2: BASE, class: "axis" }, chartG);
  var obar = OBJ.map(function (v, k) {
    var x = 392 + k * 46;
    txt(chartG, x + 16, BASE + 16, "lbl", OBJ_LAB[k], "middle");
    var b = box(chartG, x, BASE, 32, 0, k % 2 === 0 ? "#38bdf8" : "#e2b44a", "none", 4);
    var t = txt(chartG, x + 16, BASE, "tick", f2(v), "middle");
    return { bar: b, val: t, x: x, v: v };
  });
  obar.forEach(function (o) {
    var h = Math.max(3, o.v * SC);
    setBox(o.bar, o.x, BASE - h, 32, h);
    o.val.setAttribute("y", BASE - h - 5);
  });
  var dropNote = txt(chartG, 499, 92, "lbl lbl-g", "", "middle");
  var cmpG = el("g", {}, svg);
  card(cmpG, 366, 40, 266, 296, "fillB");
  txt(cmpG, 499, 64, "lbl lbl-y", "same data, two starts", "middle");
  [["start 1", H[H.length - 1].wcssAssign, "#1db584"], ["start 2", F2.wcssAssign, C_BAD]].forEach(function (r, k) {
    var y = 100 + k * 90;
    txt(cmpG, 382, y + 22, "lbl", r[0], "start");
    box(cmpG, 440, y, Math.max(6, r[1] / 30 * 130), 34, r[2], "none", 5);
    txt(cmpG, 446 + Math.max(6, r[1] / 30 * 130), y + 24, "mono", f2(r[1]), "start");
  });
  txt(cmpG, 499, 282, "lbl lbl-y", "both converged", "middle");
  txt(cmpG, 499, 304, "note", "but start 2 is a worse local solution", "middle");

  function colour(labels) { dots.forEach(function (d, k) { d.setAttribute("fill", labels ? KC[labels[k]] : C_GRAY); }); }
  function place(cs) { marks.forEach(function (m, k) { setCenter(m, G, cs[k]); }); }
  function move(a, b) { anim("mv", 1200, function (e) { marks.forEach(function (m, k) { setCenter(m, G, [lerp(a[k][0], b[k][0], e), lerp(a[k][1], b[k][1], e)]); }); }); }

  function render(index, id) {
    var i = index;
    show(chartG, i <= 8); show(cmpG, i === 9); show(badge, i === 8);
    var nBars = i <= 0 ? 0 : i <= 1 ? 1 : i <= 3 ? 2 : i === 4 ? 3 : i <= 6 ? 4 : 5;
    obar.forEach(function (o, k) {
      var vis = k < nBars;
      var dim = (i === 3 && k > 1) || (i === 6 && (k < 2 || k === 4));
      o.bar.setAttribute("opacity", vis ? (dim ? "0.4" : "1") : "0");
      o.val.setAttribute("opacity", vis ? "1" : "0");
    });
    show(dropNote, i === 3 || i === 6);
    dropNote.textContent = i === 3 ? "82.06 → 13.06" : i === 6 ? "6.31 → 4.18" : "";
    if (i === 0) { colour(null); place(H[0].centers); }
    if (i === 1) { colour(H[0].labels); place(H[0].centers); }
    if (i === 2) { colour(H[0].labels); move(H[0].centers, H[0].newCenters); }
    if (i === 3) { colour(H[0].labels); place(H[0].newCenters); }
    if (i === 4) { colour(H[1].labels); place(H[0].newCenters); }
    if (i === 5) { colour(H[1].labels); move(H[1].centers, H[1].newCenters); }
    if (i === 6 || i === 7 || i === 8) { colour(H[1].labels); place(H[1].newCenters); }
    if (i === 9) { colour(F2.labels); place(F2.newCenters); }
  }
