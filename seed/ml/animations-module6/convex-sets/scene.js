  var steps = [
    { id: "region", label: "A region of allowed choices", caption: "Sometimes we may choose only from a set of allowed solutions, like the shaded region. Whether the set is well behaved depends on its shape. This lesson is about shapes of sets." },
    { id: "two-points", label: "Pick any two points", caption: "Choose two points inside the region, x and y. Any two. The test will work for every possible pair, not just this one." },
    { id: "connect", label: "Connect them with a straight line", caption: "Draw the straight segment from x to y. Its points are λx + (1 − λ)y for λ between 0 and 1: λ = 1 is x, λ = 0 is y, λ = 0.5 is the midpoint." },
    { id: "segment-inside", label: "The segment stays inside", caption: "For this region the whole segment stays inside, and it would for any other pair of points. A set with this property is convex. A disk is convex." },
    { id: "convex-example", label: "More convex shapes", caption: "A solid square and a half-plane are convex too: join any two of their points and the segment never leaves. Convex shapes have no dents and no holes." },
    { id: "nonconvex-region", label: "A shape that is not convex", caption: "Now a ring: a disk with a hole. Pick two points on opposite sides of the ring, both inside the set, x = (−2.5, 0) and y = (2.5, 0)." },
    { id: "segment-leaves", label: "The segment leaves the set", caption: "The straight segment between them crosses the hole. The midpoint (0, 0) is not in the ring. One failing pair is enough: the ring is NOT convex. (Convex sets are about shapes; a convex function is a different idea, next.)" },
    { id: "optimization-connection", label: "Why optimization cares", caption: "Constraints define the feasible set. If it is convex, moving between two feasible points stays feasible, and with a convex objective every local best is the global best. A non-convex set can trap a search in separate pieces." }
  ];

  var CX = 320, CY = 178, U = 36.7;
  var PX = function (x) { return CX + U * x; };
  var PY = function (y) { return CY - U * y; };

  var diskG = el("g", {}, svg);
  el("circle", { cx: CX, cy: CY, r: 3 * U, fill: "rgba(29,181,132,0.2)", stroke: "#1db584", "stroke-width": 3 }, diskG);
  txt(diskG, CX, CY - 3 * U - 10, "lbl lbl-g", "a disk", "middle");

  var ringG = el("g", {}, svg);
  var ro = 3 * U, ri = 2 * U;
  el("path", { d: "M " + (CX - ro) + " " + CY + " A " + ro + " " + ro + " 0 1 0 " + (CX + ro) + " " + CY + " A " + ro + " " + ro + " 0 1 0 " + (CX - ro) + " " + CY + " Z M " + (CX - ri) + " " + CY + " A " + ri + " " + ri + " 0 1 1 " + (CX + ri) + " " + CY + " A " + ri + " " + ri + " 0 1 1 " + (CX - ri) + " " + CY + " Z", "fill-rule": "evenodd", fill: "rgba(244,114,182,0.22)", stroke: "#f472b6", "stroke-width": 3 }, ringG);
  txt(ringG, CX, CY - 3 * U - 10, "lbl lbl-p", "a ring (disk with a hole)", "middle");
  txt(ringG, CX, CY + 5, "note", "hole", "middle");

  // Points and segment.
  var A = [-1.5, 1.5], B = [2, -1];
  var AR = [-2.5, 0], BR = [2.5, 0];
  var segG = el("g", {}, svg);
  var seg = el("line", { stroke: "#e2b44a", "stroke-width": 4, "stroke-linecap": "round" }, segG);
  var segBad = el("line", { stroke: "#f87171", "stroke-width": 6, "stroke-linecap": "round" }, segG);
  var ptA = el("circle", { r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var ptB = el("circle", { r: 8, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var lblA = txt(svg, 0, 0, "lbl", "x", "end");
  var lblB = txt(svg, 0, 0, "lbl", "y", "start");
  var mover = el("circle", { r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);
  var moverLbl = txt(svg, 0, 0, "lbl lbl-y", "", "middle");
  var verdict = txt(svg, CX, 330, "big", "", "middle");
  var formula = txt(svg, CX, 352, "mono", "λx + (1 − λ)y,   0 ≤ λ ≤ 1", "middle");

  // Other convex shapes.
  var exG = el("g", {}, svg);
  box(exG, 70, 110, 120, 120, "rgba(29,181,132,0.2)", "#1db584", 6);
  el("circle", { cx: 320, cy: 170, r: 62, fill: "rgba(29,181,132,0.2)", stroke: "#1db584", "stroke-width": 3 }, exG);
  el("polygon", { points: "450,230 600,230 600,110 450,110", fill: "rgba(29,181,132,0.2)", stroke: "none" }, exG);
  el("line", { x1: 450, y1: 230, x2: 450, y2: 110, stroke: "#1db584", "stroke-width": 3 }, exG);
  [[[90, 130], [170, 210]], [[280, 150], [356, 200]], [[480, 200], [570, 130]]].forEach(function (p) {
    el("line", { x1: p[0][0], y1: p[0][1], x2: p[1][0], y2: p[1][1], stroke: "#e2b44a", "stroke-width": 3 }, exG);
    el("circle", { cx: p[0][0], cy: p[0][1], r: 6, fill: "#fff" }, exG);
    el("circle", { cx: p[1][0], cy: p[1][1], r: 6, fill: "#fff" }, exG);
  });
  txt(exG, 130, 252, "lbl lbl-g", "solid square", "middle");
  txt(exG, 320, 252, "lbl lbl-g", "disk", "middle");
  txt(exG, 525, 252, "lbl lbl-g", "half-plane", "middle");
  txt(exG, 320, 70, "lbl", "convex: every segment stays inside", "middle");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 60, 270, 150, "fillG");
  txt(mlG, 175, 94, "lbl lbl-g", "CONVEX FEASIBLE SET", "middle");
  txt(mlG, 175, 126, "big", "no dents, no holes", "middle");
  txt(mlG, 175, 156, "note", "moving between feasible points", "middle");
  txt(mlG, 175, 174, "note", "stays feasible", "middle");
  card(mlG, 330, 60, 270, 150, "fillB");
  txt(mlG, 465, 94, "lbl lbl-p", "NON-CONVEX SET", "middle");
  txt(mlG, 465, 126, "big", "separate pieces, dents", "middle");
  txt(mlG, 465, 156, "note", "a search can get stuck in", "middle");
  txt(mlG, 465, 174, "note", "one piece", "middle");
  txt(mlG, 320, 250, "lbl lbl-y", "constraints define the feasible set; its shape matters", "middle");

  function place2(p, ring) { return [PX(p[0]), PY(p[1])]; }
  function setPts(a, b) {
    var pa = [PX(a[0]), PY(a[1])], pb = [PX(b[0]), PY(b[1])];
    ptA.setAttribute("cx", pa[0]); ptA.setAttribute("cy", pa[1]);
    ptB.setAttribute("cx", pb[0]); ptB.setAttribute("cy", pb[1]);
    lblA.setAttribute("x", pa[0] - 12); lblA.setAttribute("y", pa[1] - 8);
    lblB.setAttribute("x", pb[0] + 12); lblB.setAttribute("y", pb[1] - 8);
    return [pa, pb];
  }
  function drawSeg(a, b, e) {
    var pa = [PX(a[0]), PY(a[1])], pb = [PX(b[0]), PY(b[1])];
    setLine(seg, pa[0], pa[1], lerp(pa[0], pb[0], e), lerp(pa[1], pb[1], e));
  }

  function render(index, id) {
    var i = index;
    var ring = i >= 5 && i <= 6;
    show(diskG, i <= 3);
    show(ringG, ring);
    show(exG, i === 4);
    show(segG, i >= 2 && i <= 3 || i === 6 || i === 5 && false);
    show(ptA, (i >= 1 && i <= 3) || ring); show(ptB, (i >= 1 && i <= 3) || ring);
    show(lblA, (i >= 1 && i <= 3) || ring); show(lblB, (i >= 1 && i <= 3) || ring);
    show(mover, i === 3 || i === 6); show(moverLbl, i === 3 || i === 6);
    show(verdict, i === 3 || i === 6); show(formula, i === 2 || i === 3 || i === 6);
    show(seg, i >= 2 && i <= 3 || i === 6);
    show(segBad, i === 6);
    show(mlG, i === 7);
    verdict.textContent = i === 3 ? "✓ segment stays inside: convex" : i === 6 ? "✗ midpoint (0, 0) is NOT in the set: not convex" : "";
    verdict.setAttribute("fill", i === 6 ? "#f87171" : "#1db584");
    if (i >= 1 && i <= 3) { setPts(A, B); }
    if (ring) { setPts(AR, BR); }
    if (i === 2) { drawSeg(A, B, 0); anim("seg", 1100, function (e) { drawSeg(A, B, e); }); }
    if (i === 3) {
      drawSeg(A, B, 1);
      anim("lam", 2600, function (e) {
        var lam = 0.5 + 0.5 * Math.sin(e * Math.PI * 2);
        var px = lam * A[0] + (1 - lam) * B[0], py = lam * A[1] + (1 - lam) * B[1];
        mover.setAttribute("cx", PX(px)); mover.setAttribute("cy", PY(py));
        moverLbl.setAttribute("x", PX(px)); moverLbl.setAttribute("y", PY(py) - 14);
        moverLbl.textContent = "λ = " + fmt(lam, 2);
      });
    }
    if (i === 6) {
      drawSeg(AR, BR, 1);
      setLine(segBad, PX(-2), PY(0), PX(2), PY(0));
      mover.setAttribute("cx", PX(0)); mover.setAttribute("cy", PY(0));
      moverLbl.setAttribute("x", PX(0)); moverLbl.setAttribute("y", PY(0) - 14);
      moverLbl.textContent = "λ = 0.5";
    }
  }
