  var steps = [
    { id: "one-dimensional-normal", label: "Start from the one-dimensional bell", caption: "The Gaussian you know: a bell over one variable, centered at the mean μ with width given by the standard deviation σ. Values near μ are the most likely." },
    { id: "two-variables", label: "Two variables: a bell over a plane", caption: "Now describe two variables at once, say a house's size x1 and price x2. Each pair is a point on a plane, and the bell becomes a hill rising over that plane. Where the hill is high, pairs are likely." },
    { id: "mean-point", label: "The mean vector", caption: "The hill peaks at the mean vector μ = [3, 2]: one mean per variable. It is the two-variable version of the center of the bell." },
    { id: "circular-contours", label: "Contours: lines of equal height", caption: "Slice the hill at constant heights and look from above to get contours. When the covariance matrix is Σ = [[1, 0], [0, 1]] (variance 1 each, covariance 0) the contours are circles: no relationship between x1 and x2." },
    { id: "covariance", label: "Add covariance", caption: "Now let the off-diagonal entry, the covariance, grow from 0 to 0.8. The circles stretch and tilt: when x1 is high, x2 tends to be high too." },
    { id: "tilted-ellipse", label: "A tilted ellipse", caption: "With Σ = [[1, 0.8], [0.8, 1]] the contours are tilted ellipses. The long axis points along [1, 1], the direction in which the variables vary together most. The short axis is across it." },
    { id: "samples", label: "Samples from the distribution", caption: "Draw random pairs from this distribution. They cluster near the mean and thin out along ellipses, stretched along the long axis. The ellipses are the shape of the data cloud." },
    { id: "ml-connection", label: "Why ML cares: Gaussian models", caption: "A multivariate Gaussian is described by just μ and Σ. A Gaussian Mixture Model, coming later, describes data with several such clouds, each with its own mean and covariance, for example two clusters tilted in different directions." }
  ];

  var OX = 60, OY = 322, S = 50;
  var PX = function (v) { return OX + S * v; };
  var PY = function (v) { return OY - S * v; };
  var MU = [3, 2];
  var mx = PX(MU[0]), my = PY(MU[1]);

  // 1D normal.
  var g1 = makeGraph(235, 296, 48, 190);
  var oneG = el("g", {}, svg);
  el("line", { x1: 50, y1: 296, x2: 420, y2: 296, class: "axis" }, oneG);
  var d1 = "";
  for (var t = -3.5; t <= 3.51; t += 0.1) d1 += (d1 ? " L " : "M ") + g1.x(t).toFixed(1) + " " + g1.y(Math.exp(-t * t / 2)).toFixed(1);
  el("path", { d: d1, class: "curve" }, oneG);
  el("line", { x1: g1.x(0), y1: 296, x2: g1.x(0), y2: g1.y(1), stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "5 4" }, oneG);
  txt(oneG, g1.x(0), 316, "lbl lbl-y", "mean μ", "middle");
  var sg = arrow(oneG, "g", 3); setLine(sg, g1.x(0) + 4, g1.y(0.62), g1.x(1) - 2, g1.y(0.62));
  txt(oneG, g1.x(0.5), g1.y(0.62) - 8, "lbl lbl-g", "σ", "middle");
  txt(oneG, 235, 52, "lbl", "one variable", "middle");

  // Plane.
  var planeG = el("g", {}, svg);
  el("line", { x1: OX, y1: OY, x2: PX(6.6), y2: OY, class: "axis" }, planeG);
  el("line", { x1: OX, y1: OY, x2: OX, y2: PY(5.8), class: "axis" }, planeG);
  [0, 1, 2, 3, 4, 5, 6].forEach(function (v) { txt(planeG, PX(v), OY + 14, "tick", String(v), "middle"); });
  [1, 2, 3, 4, 5].forEach(function (v) { txt(planeG, OX - 8, PY(v) + 4, "tick", String(v), "end"); });
  txt(planeG, PX(6.6), OY + 28, "note", "x1 (size)", "end");
  txt(planeG, OX + 6, PY(5.8) - 4, "note", "x2 (price)", "start");
  var examp = el("g", {}, svg);
  el("line", { x1: PX(1.6), y1: PY(3.4), x2: PX(1.6), y2: OY, class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, examp);
  el("line", { x1: PX(1.6), y1: PY(3.4), x2: OX, y2: PY(3.4), class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, examp);
  el("circle", { cx: PX(1.6), cy: PY(3.4), r: 7, fill: "#ffffff", stroke: "#071510", "stroke-width": 2 }, examp);
  txt(examp, PX(1.6) + 12, PY(3.4) - 8, "lbl", "a pair (x1, x2)", "start");

  // Contours.
  var contourG = el("g", {}, svg);
  var rings = [1, 2].map(function (k) { return el("ellipse", { cx: mx, cy: my, rx: 50 * k, ry: 50 * k, fill: k === 1 ? "rgba(56,189,248,0.12)" : "none", stroke: "#38bdf8", "stroke-width": 2.5, opacity: 0.9 }, contourG); });
  function setShape(c) {
    var l1 = Math.sqrt(1 + c), l2 = Math.sqrt(1 - c);
    rings.forEach(function (r, i) {
      var k = i + 1;
      r.setAttribute("rx", (S * k * l1).toFixed(1));
      r.setAttribute("ry", (S * k * l2).toFixed(1));
      r.setAttribute("transform", "rotate(-45 " + mx + " " + my + ")");
    });
  }
  var axesG = el("g", {}, svg);
  var longA = arrow(axesG, "y", 4), shortA = arrow(axesG, "p", 4);
  var r1 = S * Math.sqrt(1.8) * 1.0, r2 = S * Math.sqrt(0.2) * 1.0;
  var u = Math.SQRT1_2;
  setLine(longA, mx - r1 * u * 0.15, my + r1 * u * 0.15, mx + r1 * u * 1.9, my - r1 * u * 1.9);
  setLine(shortA, mx, my, mx + r2 * u * 2.4, my + r2 * u * 2.4);
  var longLbl = txt(axesG, mx + r1 * u * 1.9 + 8, my - r1 * u * 1.9 + 4, "lbl lbl-y", "long axis [1, 1]", "start");
  var shortLbl = txt(axesG, mx + r2 * u * 2.4 + 8, my + r2 * u * 2.4 + 14, "lbl lbl-p", "short axis [1, −1]", "start");

  var meanG = el("g", {}, svg);
  el("circle", { cx: mx, cy: my, r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, meanG);
  var meanLbl = txt(meanG, mx + 12, my + 22, "lbl lbl-y", "μ = [3, 2]", "start");

  // Samples.
  var rand = mulberry(7);
  var gauss = gaussSource(rand);
  var sampG = el("g", {}, svg);
  var S1 = [];
  for (var s = 0; s < 150; s++) {
    var z1 = gauss(), z2 = gauss();
    var x1 = MU[0] + z1, x2 = MU[1] + 0.8 * z1 + 0.6 * z2;
    S1.push(el("circle", { cx: PX(x1), cy: PY(x2), r: 3.4, fill: "#f472b6", opacity: 0.85 }, sampG));
  }
  // ML: two tilted clusters.
  var mlG = el("g", {}, svg);
  var rand2 = mulberry(21);
  var gauss2 = gaussSource(rand2);
  function cluster(m1, m2, rho, color, label, rotDeg) {
    var sc = 0.62;
    for (var q = 0; q < 70; q++) {
      var a = gauss2(), b = gauss2();
      var cx = m1 + sc * a, cy = m2 + sc * (rho * a + Math.sqrt(1 - rho * rho) * b);
      el("circle", { cx: PX(cx), cy: PY(cy), r: 3.2, fill: color, opacity: 0.85 }, mlG);
    }
    [1, 2].forEach(function (k) {
      var e = el("ellipse", { cx: PX(m1), cy: PY(m2), rx: S * sc * k * Math.sqrt(1 + Math.abs(rho)), ry: S * sc * k * Math.sqrt(1 - Math.abs(rho)), fill: "none", stroke: color, "stroke-width": 2.5 }, mlG);
      e.setAttribute("transform", "rotate(" + rotDeg + " " + PX(m1) + " " + PY(m2) + ")");
    });
    txt(mlG, PX(m1), PY(m2) - S * sc * 2.5 - 6, "lbl", label, "middle").setAttribute("fill", color);
  }
  cluster(1.9, 1.5, 0.75, "#38bdf8", "cluster 1: its own μ, Σ", -45);
  cluster(4.6, 3.6, -0.75, "#1db584", "cluster 2: its own μ, Σ", 45);

  var panel = el("g", {}, svg);
  card(panel, 436, 40, 190, 200, "fillG");
  var p1 = txt(panel, 531, 68, "note", "", "middle");
  var p2 = txt(panel, 531, 100, "mono", "", "middle");
  var p3 = txt(panel, 531, 128, "mono", "", "middle");
  var p4 = txt(panel, 531, 164, "big", "", "middle");
  var p5 = txt(panel, 531, 196, "note", "", "middle");
  var p6 = txt(panel, 531, 220, "note", "", "middle");

  function render(index, id) {
    var i = index;
    show(oneG, i === 0);
    show(planeG, i >= 1);
    show(examp, i === 1);
    show(meanG, i >= 2 && i <= 6);
    show(contourG, i >= 3 && i <= 6);
    show(axesG, i === 5);
    show(sampG, i === 6);
    show(mlG, i === 7);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = ""; p5.textContent = ""; p6.textContent = "";
    if (i === 3) setShape(0);
    if (i === 5 || i === 6) setShape(0.8);
    if (i === 4) {
      anim("shape", 2200, function (e) {
        var c = 0.8 * e;
        setShape(c);
        p2.textContent = "Σ = [[1, " + fmt(c, 2) + "],";
        p3.textContent = "     [" + fmt(c, 2) + ", 1]]";
      });
    }
    if (i === 0) { p1.textContent = "one variable"; p2.textContent = "mean μ"; p3.textContent = "spread σ"; p4.textContent = "a bell on a line"; }
    if (i === 1) { p1.textContent = "two variables"; p2.textContent = "a point = (x1, x2)"; p4.textContent = "a hill over a plane"; p5.textContent = "high hill = likely pair"; }
    if (i === 2) { p1.textContent = "mean vector"; p2.textContent = "μ = [3, 2]"; p4.textContent = "the peak of the hill"; p5.textContent = "one mean per variable"; }
    if (i === 3) { p1.textContent = "covariance matrix"; p2.textContent = "Σ = [[1, 0],"; p3.textContent = "     [0, 1]]"; p4.textContent = "circles"; p5.textContent = "covariance 0:"; p6.textContent = "no relationship"; }
    if (i === 4) { p1.textContent = "covariance grows to 0.8"; p4.textContent = "circles stretch"; p5.textContent = "x1 high → x2 tends high"; }
    if (i === 5) { p1.textContent = "Σ = [[1, 0.8], [0.8, 1]]"; p2.textContent = "long axis: [1, 1]"; p3.textContent = "short axis: [1, −1]"; p4.textContent = "tilted ellipse"; p5.textContent = "axis lengths ∝ √1.8, √0.2"; }
    if (i === 6) { p1.textContent = "150 random pairs"; p2.textContent = "dense near μ"; p3.textContent = "thin out outward"; p4.textContent = "cloud = ellipse"; p5.textContent = "stretched along [1, 1]"; }
    if (i === 7) { p1.textContent = ""; }
    show(panel, i !== 7);
  }
