  var steps = [
    { id: "original", label: "Start with a circle of vectors", caption: "Take every unit-length vector: together they form a circle. The two arrows mark special perpendicular directions." },
    { id: "rotate-input", label: "Step 1: rotate the input (Vᵀ)", caption: "First, rotate so those special directions line up with the axes. Rotating a circle changes nothing about its shape." },
    { id: "scale", label: "Step 2: stretch along the axes (Σ)", caption: "Next, stretch along the axes by different amounts: ×3 horizontally and ×1 vertically. The circle becomes an ellipse." },
    { id: "rotate-output", label: "Step 3: rotate the output (U)", caption: "Finally, rotate the ellipse into its final position. Rotate, stretch, rotate: that is every matrix, A = U Σ Vᵀ." },
    { id: "singular-values", label: "The stretch amounts are the singular values", caption: "The ellipse's two radii are the singular values: σ₁ = 3 for the long direction and σ₂ = 1 for the short one." },
    { id: "rank-approximation", label: "Keep only the biggest singular value", caption: "Drop σ₂ and the ellipse flattens to a line. This rank-1 approximation keeps 9 of every 10 units of 'energy': 3² / (3² + 1²) = 90%." },
    { id: "ml-connection", label: "Why this matters for ML", caption: "Keeping the large singular values gives a smaller, cleaner version of the data. That powers compression, denoising and dimensionality reduction." }
  ];

  var P = makePlane(220, 190, 46);
  var N = 48;
  var circle = [];
  for (var i = 0; i < N; i++) circle.push([Math.cos((2 * Math.PI * i) / N), Math.sin((2 * Math.PI * i) / N)]);
  var D = Math.SQRT1_2;
  var M1 = [D, D];
  var M2 = [-D, D];

  var st = { a: 0, sx: 1, sy: 1, c: 0 };
  function rot(p, deg) {
    var r = (deg * Math.PI) / 180;
    return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
  }
  function xf(p) {
    var q = rot(p, -45 * st.a);
    q = [q[0] * st.sx, q[1] * st.sy];
    return rot(q, 45 * st.c);
  }

  axes(svg, P, 4.2, 3.9);
  var shape = polygon(svg, "fillA");
  var arr1 = arrow(svg, "y", 4);
  var arr2 = arrow(svg, "p", 4);
  var lab1 = txt(svg, 0, 0, "lbl lbl-y", "", "start");
  var lab2 = txt(svg, 0, 0, "lbl lbl-p", "", "start");
  var stage = txt(svg, 30, 40, "big", "", "start");

  function draw() {
    setPoly(shape, circle.map(function (p) { return P.pt(xf(p)); }));
    var t1 = P.pt(xf(M1)), t2 = P.pt(xf(M2));
    setLine(arr1, P.x(0), P.y(0), t1[0], t1[1]);
    setLine(arr2, P.x(0), P.y(0), t2[0], t2[1]);
    lab1.setAttribute("x", t1[0] + 8); lab1.setAttribute("y", t1[1] - 6);
    lab2.setAttribute("x", t2[0] - 8); lab2.setAttribute("y", t2[1] - 8);
    lab2.setAttribute("text-anchor", "end");
  }
  draw();

  // Singular value bars.
  var bars = el("g", { opacity: 0 }, svg);
  el("rect", { x: 436, y: 70, width: 190, height: 110, rx: 12, class: "fillG" }, bars);
  txt(bars, 450, 94, "lbl", "singular values", "start");
  el("rect", { x: 450, y: 106, width: 3 * 40, height: 16, rx: 4, fill: "#e2b44a" }, bars);
  txt(bars, 450 + 3 * 40 + 6, 119, "lbl lbl-y", "", "start");
  el("rect", { x: 450, y: 134, width: 1 * 40, height: 16, rx: 4, fill: "#f472b6" }, bars);
  var bar2 = bars.lastChild;
  txt(bars, 450 + 40 + 6, 147, "lbl lbl-p", "", "start");
  var barTxt = bars.querySelectorAll("text");

  var chips = el("g", { opacity: 0 }, svg);
  ["compression", "denoising", "dimensionality reduction"].forEach(function (c, i) {
    el("rect", { x: 420, y: 100 + i * 44, width: 204, height: 34, rx: 10, class: "fillG" }, chips);
    txt(chips, 434, 122 + i * 44, "lbl", c, "start");
  });

  function goState(target, ms) {
    var from = { a: st.a, sx: st.sx, sy: st.sy, c: st.c };
    anim("svd", ms, function (e) {
      st.a = lerp(from.a, target.a, e);
      st.sx = lerp(from.sx, target.sx, e);
      st.sy = lerp(from.sy, target.sy, e);
      st.c = lerp(from.c, target.c, e);
      draw();
    });
  }

  function render(index, id) {
    lab1.textContent = ""; lab2.textContent = "";
    show(bars, id === "singular-values" || id === "rank-approximation");
    show(chips, id === "ml-connection");
    show(arr2, true);
    stage.textContent = "";
    barTxt[1].textContent = "σ₁ = 3";
    barTxt[2].textContent = id === "rank-approximation" ? "σ₂ → 0 (dropped)" : "σ₂ = 1";
    bar2.setAttribute("width", id === "rank-approximation" ? 2 : 40);

    if (id === "original") goState({ a: 0, sx: 1, sy: 1, c: 0 }, 300);
    else if (id === "rotate-input") { goState({ a: 1, sx: 1, sy: 1, c: 0 }, 1000); stage.textContent = "Vᵀ  rotate"; }
    else if (id === "scale") { goState({ a: 1, sx: 3, sy: 1, c: 0 }, 1000); stage.textContent = "Σ  stretch"; }
    else if (id === "rotate-output") { goState({ a: 1, sx: 3, sy: 1, c: 1 }, 1000); stage.textContent = "U  rotate"; }
    else if (id === "singular-values") {
      goState({ a: 1, sx: 3, sy: 1, c: 1 }, 200);
      lab1.textContent = "σ₁ = 3"; lab2.textContent = "σ₂ = 1";
    } else if (id === "rank-approximation") {
      goState({ a: 1, sx: 3, sy: 0.02, c: 1 }, 1000);
      lab1.textContent = "keep σ₁";
      show(arr2, false);
    } else {
      goState({ a: 1, sx: 3, sy: 0.02, c: 1 }, 200);
      show(arr2, false);
    }
  }
