  var steps = [
    { id: "complex-transform", label: "A transformation that looks complicated", caption: "Apply A to the blue square. It becomes the pink slanted shape: stretched and sheared in a hard-to-read way." },
    { id: "eigen-directions", label: "Find its special directions", caption: "A has two eigen-directions, [1, 1] and [1, −1]. They are the natural axes of this transformation." },
    { id: "change-basis", label: "Change coordinates to those directions", caption: "Rotate the view so the eigen-directions line up with the screen axes. This is the P⁻¹ step." },
    { id: "diagonal-space", label: "Here A only stretches each axis", caption: "In these coordinates A does something simple: it stretches the first axis by 3 and the second by 1. That is a diagonal matrix D." },
    { id: "scale", label: "Scale each axis independently", caption: "Apply D: stretch by 3 along the first axis and leave the second alone. The axes do not affect each other." },
    { id: "change-back", label: "Change back to the original coordinates", caption: "Rotate back (the P step). The result is exactly the pink shape that A produced directly." },
    { id: "decomposition", label: "A = P D P⁻¹", caption: "Change coordinates, scale each axis, change back. A hard transformation becomes three simple moves." }
  ];

  var P = makePlane(200, 190, 38);
  var K = 1.2;
  var S = [[0, 0], [K, 0], [K, K], [0, K]];
  var Am = [[2, 1], [1, 2]];
  var AS = S.map(function (p) { return [Am[0][0] * p[0] + Am[0][1] * p[1], Am[1][0] * p[0] + Am[1][1] * p[1]]; });
  var C45 = Math.cos(Math.PI / 4);

  function rot(p, deg) {
    var r = (deg * Math.PI) / 180;
    return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
  }
  // change basis (rotate by -45° · a), scale (sx, 1), change back (rotate by +45° · b)
  var st = { a: 0, b: 0, sx: 1 };
  function xf(p) {
    var q = rot(p, -45 * st.a);
    q = [q[0] * st.sx, q[1]];
    return rot(q, 45 * st.b);
  }
  // Axis lines and tags follow the rotations but are NOT stretched.
  function xfAxis(p) {
    return rot(rot(p, -45 * st.a), 45 * st.b);
  }

  axes(svg, P, 5, 4.9);
  var ghost = polygon(svg, "fillB");
  setPoly(ghost, AS.map(P.pt));
  var ghostLab = txt(svg, P.x(AS[2][0]) + 8, P.y(AS[2][1]) - 6, "lbl lbl-p", "A applied directly", "start");
  var shape = polygon(svg, "fillA");
  var lineA = el("line", { stroke: "#e2b44a", "stroke-width": 2, class: "dash" }, svg);
  var lineB = el("line", { stroke: "#f472b6", "stroke-width": 2, class: "dash" }, svg);
  var tagX = txt(svg, 0, 0, "lbl lbl-y", "", "start");
  var tagY = txt(svg, 0, 0, "lbl lbl-p", "", "start");

  function draw() {
    setPoly(shape, S.map(function (p) { return P.pt(xf(p)); }));
    var a1 = P.pt(xfAxis([-4.2, -4.2])), a2 = P.pt(xfAxis([4.2, 4.2]));
    var b1 = P.pt(xfAxis([-3.2, 3.2])), b2 = P.pt(xfAxis([3.2, -3.2]));
    setLine(lineA, a1[0], a1[1], a2[0], a2[1]);
    setLine(lineB, b1[0], b1[1], b2[0], b2[1]);
    var ta = P.pt(xfAxis([3.4, 3.4]));
    var tb = P.pt(xfAxis([-2.2, 2.2]));
    tagX.setAttribute("x", ta[0] + 6); tagX.setAttribute("y", ta[1] - 4);
    tagY.setAttribute("x", tb[0] + 6); tagY.setAttribute("y", tb[1] - 4);
  }
  draw();

  // Decomposition panel.
  var panel = el("g", { opacity: 0 }, svg);
  var rows = [["1", "change coordinates", "P⁻¹"], ["2", "scale each axis", "D"], ["3", "change back", "P"]];
  rows.forEach(function (r, i) {
    el("rect", { x: 420, y: 64 + i * 78, width: 204, height: 56, rx: 12, class: "fillG" }, panel);
    txt(panel, 436, 88 + i * 78, "lbl", r[0] + "  " + r[1], "start");
    txt(panel, 436, 108 + i * 78, "mono", r[2], "start");
    if (i < 2) el("line", { x1: 522, y1: 122 + i * 78, x2: 522, y2: 140 + i * 78, stroke: "#a7ce65", "stroke-width": 2.5, "marker-end": "url(#ah-g)" }, panel);
  });
  var formula = txt(svg, 520, 322, "big", "A = P D P⁻¹", "middle");
  show(formula, false);

  function goState(target, ms) {
    var from = { a: st.a, b: st.b, sx: st.sx };
    anim("diag", ms, function (e) {
      st.a = lerp(from.a, target.a, e);
      st.b = lerp(from.b, target.b, e);
      st.sx = lerp(from.sx, target.sx, e);
      draw();
    });
  }

  function render(index, id) {
    show(ghost, id === "complex-transform" || id === "change-back" || id === "decomposition");
    show(ghostLab, id === "change-back" || id === "complex-transform");
    show(lineA, index >= 1); show(lineB, index >= 1);
    show(panel, id === "decomposition");
    show(formula, id === "decomposition");
    tagX.textContent = ""; tagY.textContent = "";

    if (id === "complex-transform") goState({ a: 0, b: 0, sx: 1 }, 300);
    else if (id === "eigen-directions") goState({ a: 0, b: 0, sx: 1 }, 300);
    else if (id === "change-basis") goState({ a: 1, b: 0, sx: 1 }, 1100);
    else if (id === "diagonal-space") {
      goState({ a: 1, b: 0, sx: 1 }, 200);
      tagX.textContent = "×3";
      tagY.textContent = "×1";
    } else if (id === "scale") {
      goState({ a: 1, b: 0, sx: 3 }, 1100);
      tagX.textContent = "×3";
      tagY.textContent = "×1";
    } else if (id === "change-back") goState({ a: 1, b: 1, sx: 3 }, 1100);
    else goState({ a: 1, b: 1, sx: 3 }, 200);
  }
