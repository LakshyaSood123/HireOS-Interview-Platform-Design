  var steps = [
    { id: "vector", label: "A vector is an arrow from the origin", caption: "Here is one vector v. Think of it as a direction and a length." },
    { id: "scale-vector", label: "Scaling stretches or flips it", caption: "Multiplying by a number scales the arrow: 2v is twice as long, and a negative number flips it." },
    { id: "combine-vectors", label: "Combine two vectors", caption: "With a second vector w, we can build a·v + b·w: scale each one, then add them." },
    { id: "span-line", label: "One vector spans a line", caption: "All the scaled copies of a single vector lie on one line through the origin. That line is its span." },
    { id: "span-plane", label: "Two independent vectors span the plane", caption: "If v and w do not point along the same line, their combinations reach every point in the plane." },
    { id: "subspace", label: "A subspace is a flat space through the origin", caption: "The line is a subspace of the plane: it contains the origin, and adding or scaling its vectors never leaves it." },
    { id: "ml-connection", label: "Data often lives near a subspace", caption: "Real data often sits close to a line or plane inside a bigger space. Finding it lets us describe the data with fewer numbers." }
  ];

  var P = makePlane(320, 190, 34);
  var V = [2, 1];
  var W = [-1, 2];

  var tint = el("rect", { x: 14, y: 14, width: 612, height: 332, rx: 10, class: "fillA", opacity: 0 }, svg);
  axes(svg, P, 9, 5.2);

  var spanLine = el("line", { x1: P.x(-7), y1: P.y(-3.5), x2: P.x(7), y2: P.y(3.5), stroke: "#1db584", "stroke-width": 3, opacity: 0 }, svg);

  var gridDots = el("g", { opacity: 0 }, svg);
  [-1.5, -0.75, 0, 0.75, 1.5].forEach(function (a) {
    [-1.5, -0.75, 0, 0.75, 1.5].forEach(function (b) {
      el("circle", { cx: P.x(a * V[0] + b * W[0]), cy: P.y(a * V[1] + b * W[1]), r: 3.5, fill: "#c9dccf" }, gridDots);
    });
  });

  var ghost2 = arrow(svg, "y", 2.5);
  ghost2.setAttribute("stroke-dasharray", "5 4");
  setLine(ghost2, P.x(0), P.y(0), P.x(2 * V[0]), P.y(2 * V[1]));
  var ghostNeg = arrow(svg, "r", 2.5);
  ghostNeg.setAttribute("stroke-dasharray", "5 4");
  setLine(ghostNeg, P.x(0), P.y(0), P.x(-V[0]), P.y(-V[1]));
  var lab2 = txt(svg, P.x(2 * V[0]) + 8, P.y(2 * V[1]) - 6, "lbl lbl-y", "2v");
  var labNeg = txt(svg, P.x(-V[0]) - 24, P.y(-V[1]) + 16, "lbl lbl-r", "−v");

  var arrV = arrow(svg, "b", 3.5);
  setLine(arrV, P.x(0), P.y(0), P.x(V[0]), P.y(V[1]));
  var labV = txt(svg, P.x(V[0]) + 8, P.y(V[1]) + 14, "lbl lbl-b", "v");
  var arrW = arrow(svg, "p", 3.5);
  setLine(arrW, P.x(0), P.y(0), P.x(W[0]), P.y(W[1]));
  var labW = txt(svg, P.x(W[0]) - 16, P.y(W[1]) - 6, "lbl lbl-p", "w");

  // a·v + b·w with a = 1.5, b = 1
  var A1 = 1.5, B1 = 1;
  var comb = [A1 * V[0] + B1 * W[0], A1 * V[1] + B1 * W[1]];
  var scaledV = arrow(svg, "b", 2.5);
  scaledV.setAttribute("stroke-dasharray", "5 4");
  setLine(scaledV, P.x(0), P.y(0), P.x(1.5 * V[0]), P.y(1.5 * V[1]));
  var scaledVLab = txt(svg, P.x(1.5 * V[0]) + 8, P.y(1.5 * V[1]) + 16, "lbl lbl-b", "1.5·v");
  var par1 = el("line", { class: "dash", stroke: "#38bdf8", "stroke-width": 1.5 }, svg);
  setLine(par1, P.x(A1 * V[0]), P.y(A1 * V[1]), P.x(comb[0]), P.y(comb[1]));
  var par2 = el("line", { class: "dash", stroke: "#f472b6", "stroke-width": 1.5 }, svg);
  setLine(par2, P.x(B1 * W[0]), P.y(B1 * W[1]), P.x(comb[0]), P.y(comb[1]));
  var combDot = el("circle", { cx: P.x(comb[0]), cy: P.y(comb[1]), r: 6, fill: "#e2b44a" }, svg);
  var combLab = txt(svg, P.x(comb[0]) + 12, P.y(comb[1]) + 4, "lbl lbl-y", "1.5·v + 1·w");

  var origin = el("circle", { cx: P.x(0), cy: P.y(0), r: 5, fill: "#e6f5ec" }, svg);
  var originLab = txt(svg, P.x(0) + 8, P.y(0) + 18, "note", "origin (0)");
  var subLab = txt(svg, 40, 40, "lbl lbl-g", "", "start");
  var subNote = txt(svg, 40, 58, "note", "", "start");

  // Data points near the line (last step).
  var cloud = el("g", { opacity: 0 }, svg);
  for (var t = -3; t <= 3.01; t += 0.5) {
    var off = 0.35 * Math.sin(t * 5.3 + 1);
    var nx = -V[1], ny = V[0];
    var norm = Math.sqrt(nx * nx + ny * ny);
    el("circle", { cx: P.x(2 * t + (nx / norm) * off), cy: P.y(t + (ny / norm) * off), r: 5, fill: "#f472b6" }, cloud);
  }

  function render(index, id) {
    var all = [tint, spanLine, gridDots, ghost2, ghostNeg, lab2, labNeg, arrV, labV, arrW, labW, par1, par2, combDot, combLab, origin, originLab, cloud, scaledV, scaledVLab];
    all.forEach(function (n) { show(n, false); });
    subLab.textContent = "";
    subNote.textContent = "";
    show(origin, true);
    show(originLab, true);

    if (id === "vector") {
      show(arrV, true); show(labV, true);
    } else if (id === "scale-vector") {
      show(arrV, true); show(labV, true); show(ghost2, true); show(lab2, true); show(ghostNeg, true); show(labNeg, true);
    } else if (id === "combine-vectors") {
      show(arrV, true); show(labV, true); show(arrW, true); show(labW, true);
      show(par1, true); show(par2, true); show(combDot, true); show(combLab, true); show(scaledV, true); show(scaledVLab, true);
    } else if (id === "span-line") {
      show(spanLine, true); show(arrV, true); show(labV, true);
      subLab.textContent = "span of v = a line";
    } else if (id === "span-plane") {
      show(gridDots, true); show(arrV, true); show(labV, true); show(arrW, true); show(labW, true);
      subLab.textContent = "span of v and w = the whole plane";
    } else if (id === "subspace") {
      show(tint, true); show(spanLine, true); show(arrV, true); show(labV, true);
      subLab.textContent = "subspace: a line through the origin";
      subNote.textContent = "inside the plane; it always contains 0";
    } else {
      show(spanLine, true); show(cloud, true);
      subLab.textContent = "data close to a line";
      subNote.textContent = "describe each point by one number instead of two";
    }
  }
