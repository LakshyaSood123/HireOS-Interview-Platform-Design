  var steps = [
    { id: "quadratic-form", label: "A number from a vector and a matrix", caption: "For a matrix A and a vector x, the quadratic form xᵀ A x is one number. For A = [[2, 0], [0, 1]] it equals 2x₁² + x₂²." },
    { id: "directions", label: "Try many directions", caption: "Evaluate xᵀ A x for vectors pointing in many directions. Each arrow shows its value." },
    { id: "positive-values", label: "Every direction gives a positive value", caption: "No matter which non-zero direction we pick, the value is above zero. That is what positive definite means." },
    { id: "bowl", label: "Positive values make a bowl", caption: "Plot the value as height and you get an upward-curving bowl with a single lowest point: a stable minimum." },
    { id: "eigenvalues", label: "Equivalent test: all eigenvalues are positive", caption: "A symmetric matrix is positive definite exactly when all its eigenvalues are positive. Here they are 2 and 1." },
    { id: "non-pd-contrast", label: "Compare with an indefinite matrix", caption: "Take B = [[1, 0], [0, −1]]. Its value is positive along one axis but negative along the other, so the surface is a saddle." },
    { id: "ml-connection", label: "Why this matters for ML", caption: "Positive curvature means a loss has a stable minimum, and covariance matrices have this property. Saddles are where optimization gets stuck." }
  ];

  var PL = makePlane(165, 190, 32); // left: positive definite
  var PR = makePlane(485, 190, 32); // right: saddle
  function qfA(x, y) { return 2 * x * x + y * y; }
  function qfB(x, y) { return x * x - y * y; }

  // Left panel axes + title.
  var left = el("g", {}, svg);
  axes(left, PL, 4.5, 4.5);
  txt(left, PL.cx, 34, "lbl lbl-g", "A = [[2, 0], [0, 1]]", "middle");
  var right = el("g", { opacity: 0 }, svg);
  axes(right, PR, 4.5, 4.5);
  txt(right, PR.cx, 34, "lbl lbl-r", "B = [[1, 0], [0, −1]]", "middle");

  // Contours: ellipses for A (bowl), hyperbolas for B (saddle).
  var contourA = el("g", { opacity: 0 }, left);
  [1, 2, 3.4].forEach(function (c) {
    el("ellipse", { cx: PL.cx, cy: PL.cy, rx: Math.sqrt(c / 2) * PL.s * 1.9, ry: Math.sqrt(c) * PL.s * 1.9, fill: "none", stroke: "#1db584", "stroke-width": 2 }, contourA);
  });
  var ball = el("circle", { cx: PL.cx, cy: PL.cy, r: 7, fill: "#e2b44a", opacity: 0 }, left);
  var ballLab = txt(left, PL.cx + 12, PL.cy + 30, "lbl lbl-y", "minimum", "start");
  show(ballLab, false);

  var contourB = el("g", { opacity: 0 }, right);
  [-1.2, 1.2].forEach(function (c) {
    // x² − y² = c, drawn as four branches
    var pts1 = [], pts2 = [];
    for (var t = -1.6; t <= 1.601; t += 0.1) {
      if (c > 0) {
        var x = Math.sqrt(c) * ((Math.exp(t) + Math.exp(-t)) / 2);
        var y = Math.sqrt(c) * ((Math.exp(t) - Math.exp(-t)) / 2);
        pts1.push(PR.x(x) + "," + PR.y(y));
        pts2.push(PR.x(-x) + "," + PR.y(y));
      } else {
        var y2 = Math.sqrt(-c) * ((Math.exp(t) + Math.exp(-t)) / 2);
        var x2 = Math.sqrt(-c) * ((Math.exp(t) - Math.exp(-t)) / 2);
        pts1.push(PR.x(x2) + "," + PR.y(y2));
        pts2.push(PR.x(x2) + "," + PR.y(-y2));
      }
    }
    var color = c > 0 ? "#1db584" : "#f87171";
    el("polyline", { points: pts1.join(" "), fill: "none", stroke: color, "stroke-width": 2 }, contourB);
    el("polyline", { points: pts2.join(" "), fill: "none", stroke: color, "stroke-width": 2 }, contourB);
  });
  var saddlePt = el("circle", { cx: PR.cx, cy: PR.cy, r: 7, fill: "#f87171", opacity: 0 }, right);
  var saddleLab = txt(right, PR.cx + 12, PR.cy + 30, "lbl lbl-r", "saddle", "start");
  show(saddleLab, false);

  // Direction arrows with values (left panel).
  var dirGroup = el("g", { opacity: 0 }, left);
  var dirTexts = [];
  [0, 45, 90, 135, 180, 225, 270, 315].forEach(function (deg) {
    var r = (deg * Math.PI) / 180;
    var ux = Math.cos(r), uy = Math.sin(r);
    var a = arrow(dirGroup, "g", 2.5);
    setLine(a, PL.x(0), PL.y(0), PL.x(ux * 2.3), PL.y(uy * 2.3));
    var t = txt(dirGroup, PL.x(ux * 3.15), PL.y(uy * 3.15) + 4, "lbl lbl-g", round1(qfA(ux, uy)), "middle");
    dirTexts.push(t);
  });
  // Negative directions (right panel).
  var dirGroupB = el("g", { opacity: 0 }, right);
  [0, 90, 180, 270].forEach(function (deg) {
    var r = (deg * Math.PI) / 180;
    var ux = Math.cos(r), uy = Math.sin(r);
    var v = qfB(ux, uy);
    var a = arrow(dirGroupB, v >= -0.01 ? "g" : "r", 2.5);
    setLine(a, PR.x(0), PR.y(0), PR.x(ux * 2.3), PR.y(uy * 2.3));
    txt(dirGroupB, PR.x(ux * 3.15), PR.y(uy * 3.15) + 4, v >= -0.01 ? "lbl lbl-g" : "lbl lbl-r", round1(v), "middle");
  });

  // Eigenvalue bars (left).
  var eig = el("g", { opacity: 0 }, left);
  var ex = el("line", { x1: PL.x(0), y1: PL.y(0), x2: PL.x(3.6), y2: PL.y(0), stroke: "#e2b44a", "stroke-width": 4, "marker-end": "url(#ah-y)" }, eig);
  var ey = el("line", { x1: PL.x(0), y1: PL.y(0), x2: PL.x(0), y2: PL.y(3.6 * 0.5), stroke: "#38bdf8", "stroke-width": 4, "marker-end": "url(#ah-b)" }, eig);
  txt(eig, PL.x(3.6) - 4, PL.y(0) - 12, "lbl lbl-y", "λ₁ = 2 > 0", "end");
  txt(eig, PL.x(0) + 10, PL.y(1.8) + 4, "lbl lbl-b", "λ₂ = 1 > 0", "start");
  var eigB = el("g", { opacity: 0 }, right);
  txt(eigB, PR.x(0) + 10, PR.y(-2.4), "lbl lbl-r", "λ₂ = −1 < 0", "start");
  txt(eigB, PR.x(3.6) - 4, PR.y(0) - 12, "lbl lbl-g", "λ₁ = 1 > 0", "end");

  var xArrow = arrow(left, "y", 3.5);
  setLine(xArrow, PL.x(0), PL.y(0), PL.x(1.5), PL.y(1.5));
  var xLab = txt(left, PL.x(1.5) + 8, PL.y(1.5) - 6, "lbl lbl-y", "x = [1, 1]", "start");
  show(xArrow, false);
  show(xLab, false);
  var note = txt(svg, 320, 338, "note", "", "middle");

  function render(index, id) {
    show(left, true);
    show(right, index >= 5);
    show(contourA, id === "bowl" || id === "eigenvalues" || id === "ml-connection" || id === "non-pd-contrast");
    show(xArrow, id === "quadratic-form");
    show(xLab, id === "quadratic-form");
    show(ball, id === "bowl" || id === "ml-connection");
    show(ballLab, id === "bowl" || id === "ml-connection");
    show(dirGroup, id === "directions" || id === "positive-values");
    show(contourB, index >= 5);
    show(dirGroupB, id === "non-pd-contrast");
    show(saddlePt, index >= 5);
    show(saddleLab, index >= 5);
    show(eig, id === "eigenvalues");
    show(eigB, id === "non-pd-contrast");
    dirTexts.forEach(function (t) { show(t, true); });
    note.textContent = "";
    if (id === "quadratic-form") note.textContent = "x = [1, 1]   →   xᵀ A x = 2·1 + 1·1 = 3";
    else if (id === "positive-values") note.textContent = "all values > 0  →  positive definite";
    else if (id === "bowl") note.textContent = "positive curvature in every direction: one stable minimum";
    else if (id === "non-pd-contrast") note.textContent = "x = [0, 1]   →   xᵀ B x = −1 (negative): not positive definite";
    else if (id === "ml-connection") note.textContent = "bowl: gradient descent settles   |   saddle: no stable minimum";
  }
