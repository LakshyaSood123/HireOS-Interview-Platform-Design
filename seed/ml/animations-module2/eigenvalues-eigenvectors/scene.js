  var steps = [
    { id: "original-space", label: "Vectors in every direction", caption: "Start with vectors pointing in many directions, all the same length." },
    { id: "transform", label: "Apply a matrix A", caption: "A matrix A transforms every vector: it can change both its direction and its length." },
    { id: "most-vectors-turn", label: "Most vectors change direction", caption: "Compare each arrow before and after. For almost every vector, the direction has turned." },
    { id: "special-direction", label: "A few directions stay put", caption: "But along two special lines, the transformed vector lands on the same line it started on." },
    { id: "eigenvector", label: "These are the eigenvectors", caption: "A vector that keeps its direction under A is an eigenvector. It is only stretched, shrunk or flipped." },
    { id: "eigenvalue", label: "The scaling factor is the eigenvalue", caption: "A v = λ v. Along [1, 1] the stretch is λ = 3, and along [1, −1] it is λ = 1." },
    { id: "ml-connection", label: "Eigenvectors are the main directions", caption: "For a data covariance matrix, the eigenvectors point along the main directions of the data. PCA uses exactly these." }
  ];

  var P = makePlane(320, 190, 44);
  var M = [[2, 1], [1, 2]];
  function applyM(v) { return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]]; }
  var R = 1.4;

  axes(svg, P, 6.5, 4.1);
  var cloud = el("ellipse", { cx: P.x(0), cy: P.y(0), rx: 4.2 * 44 * 0.8, ry: 1.2 * 44 * 0.8, class: "fillG", opacity: 0, transform: "rotate(-45 " + P.x(0) + " " + P.y(0) + ")" }, svg);

  // Two special lines (the eigen-directions).
  var lineA = el("line", { x1: P.x(-4.2), y1: P.y(-4.2), x2: P.x(4.2), y2: P.y(4.2), stroke: "#e2b44a", "stroke-width": 1.5, class: "dash", opacity: 0 }, svg);
  var lineB = el("line", { x1: P.x(-3.2), y1: P.y(3.2), x2: P.x(3.2), y2: P.y(-3.2), stroke: "#f472b6", "stroke-width": 1.5, class: "dash", opacity: 0 }, svg);

  var vecs = [];
  for (var k = 0; k < 12; k++) {
    var ang = ((45 + 30 * k) * Math.PI) / 180;
    var v = [R * Math.cos(ang), R * Math.sin(ang)];
    var special = k % 3 === 0; // 45°, 135°, 225°, 315°
    var orig = el("line", { stroke: "#8fa89c", "stroke-width": 2, "stroke-linecap": "round" }, svg);
    var out = arrow(svg, special ? (k === 0 || k === 6 ? "y" : "p") : "b", special ? 4 : 2.5);
    vecs.push({ v: v, Av: applyM(v), orig: orig, out: out, special: special, k: k });
  }

  function drawVectors(t) {
    vecs.forEach(function (o) {
      var tip = [lerp(o.v[0], o.Av[0], t), lerp(o.v[1], o.Av[1], t)];
      setLine(o.out, P.x(0), P.y(0), P.x(tip[0]), P.y(tip[1]));
      setLine(o.orig, P.x(0), P.y(0), P.x(o.v[0]), P.y(o.v[1]));
    });
  }

  var tagA = txt(svg, P.x(3.1), P.y(2.2), "lbl lbl-y", "", "start");
  var tagB = txt(svg, P.x(1.5), P.y(-3.7), "lbl lbl-p", "", "start");
  var turnNote = txt(svg, 40, 44, "lbl lbl-b", "", "start");
  var cloudNote = txt(svg, 40, 44, "lbl lbl-g", "", "start");
  var cloudNote2 = txt(svg, 40, 64, "note", "", "start");

  var tState = 0;
  function moveTo(target, ms) {
    var from = tState;
    anim("t", ms, function (e) { tState = lerp(from, target, e); drawVectors(tState); });
  }

  function render(index, id) {
    tagA.textContent = ""; tagB.textContent = ""; turnNote.textContent = ""; cloudNote.textContent = ""; cloudNote2.textContent = "";
    show(lineA, false); show(lineB, false); show(cloud, false);
    vecs.forEach(function (o) { show(o.out, true); show(o.orig, true); });

    if (id === "original-space") {
      moveTo(0, 300);
      vecs.forEach(function (o) { show(o.out, false); });
    } else if (id === "transform") {
      moveTo(1, 1000);
      vecs.forEach(function (o) { show(o.orig, true); o.orig.setAttribute("opacity", 0.35); });
    } else if (id === "most-vectors-turn") {
      moveTo(1, 200);
      vecs.forEach(function (o) { o.orig.setAttribute("opacity", 0.55); });
      turnNote.textContent = "gray = before A, colour = after A: most arrows turn";
    } else if (id === "special-direction") {
      moveTo(1, 200);
      show(lineA, true); show(lineB, true);
      vecs.forEach(function (o) { if (!o.special) { show(o.out, false); show(o.orig, false); } });
    } else if (id === "eigenvector") {
      moveTo(1, 200);
      show(lineA, true); show(lineB, true);
      vecs.forEach(function (o) { if (!o.special) { show(o.out, false); show(o.orig, false); } });
      tagA.textContent = "eigenvector [1, 1]";
      tagB.textContent = "eigenvector [1, −1]";
    } else if (id === "eigenvalue") {
      moveTo(1, 200);
      show(lineA, true); show(lineB, true);
      vecs.forEach(function (o) { if (!o.special) { show(o.out, false); show(o.orig, false); } });
      tagA.textContent = "A v = 3 v   (λ = 3)";
      tagB.textContent = "A w = 1 w   (λ = 1)";
    } else {
      moveTo(1, 200);
      show(cloud, true); show(lineA, true); show(lineB, true);
      vecs.forEach(function (o) { if (!o.special) { show(o.out, false); show(o.orig, false); } else show(o.orig, false); });
      cloudNote.textContent = "data cloud";
      cloudNote2.textContent = "its eigenvectors mark the main directions of spread";
    }
  }
