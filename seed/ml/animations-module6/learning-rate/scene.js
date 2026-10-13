  var steps = [
    { id: "same-start", label: "Same objective, same start", caption: "Same bowl L(w) = (w − 3)², same start w = 0, same rule w_new = w_old − η × gradient. The only thing we change is the learning rate η, which sets the step size. Direction stays the same." },
    { id: "small-rate", label: "A small learning rate (0.02)", caption: "With η = 0.02 each step is tiny: w goes 0, 0.12, 0.24, 0.35, 0.45 ... The path crawls along the bowl." },
    { id: "small-progress", label: "Small rate: safe but slow", caption: "After 10 steps w is only about 1.0 and the loss is still about 4. It will get there, but it needs hundreds of steps." },
    { id: "good-rate", label: "A good learning rate (0.3)", caption: "With η = 0.3 the steps are 1.8, 2.52, 2.81, 2.92 ... Big steps at first, then smaller as the ground flattens." },
    { id: "good-progress", label: "Good rate: fast and steady", caption: "After 5 steps w ≈ 2.97 and the loss is about 0.001. Efficient progress with no drama." },
    { id: "large-rate", label: "A large learning rate (0.9)", caption: "With η = 0.9 the first step jumps from 0 to 5.4, right over the minimum at 3." },
    { id: "overshoot", label: "Overshoot and oscillation", caption: "The next steps go back and forth: 1.08, 4.54, 1.77 ... It bounces from side to side. Here each bounce is smaller so it still converges, slowly, but it wastes steps." },
    { id: "diverge", label: "Too large: divergence", caption: "With η = 1.1 the steps are 6.6, −1.32, 8.18, −3.22 ... Each bounce is bigger than the last. The loss grows: the search diverges. For this objective any η above 1 diverges." },
    { id: "compare", label: "Compare the four", caption: "Loss versus step. Small η: slow but steady. Good η: fast. η = 0.9: bouncing but shrinking. η = 1.1: growing. The learning rate controls step SIZE, not direction." }
  ];

  function Lw(w) { return (w - 3) * (w - 3); }
  var X = function (w) { return 40 + 41 * (w + 4); };
  var Y = function (l) { return 320 - 6.2 * l; };
  var RATES = [
    { lr: 0.02, color: "#38bdf8", name: "η = 0.02  (small)" },
    { lr: 0.3, color: "#1db584", name: "η = 0.3  (good)" },
    { lr: 0.9, color: "#e2b44a", name: "η = 0.9  (large)" },
    { lr: 1.1, color: "#f87171", name: "η = 1.1  (too large)" }
  ];
  RATES.forEach(function (r) {
    var w = 0, path = [0];
    for (var k = 0; k < 10; k++) { w = w - r.lr * 2 * (w - 3); path.push(w); }
    r.path = path;
  });

  clipTo("lrclip", 30, 60, 570, 270);
  var graphG = el("g", {}, svg);
  el("line", { x1: 30, y1: Y(0), x2: 600, y2: Y(0), class: "axis" }, graphG);
  for (var t = -4; t <= 9; t += 1) txt(graphG, X(t), Y(0) + 16, "tick", String(t), "middle");
  txt(graphG, 600, Y(0) + 32, "note", "weight w", "end");
  var cd = "";
  for (var w = -4; w <= 9.01; w += 0.1) cd += (cd ? " L " : "M ") + X(w).toFixed(1) + " " + Y(Lw(w)).toFixed(1);
  var clipG = el("g", { "clip-path": "url(#lrclip)" }, graphG);
  el("path", { d: cd, class: "curve" }, clipG);
  el("line", { x1: X(3), y1: Y(0), x2: X(3), y2: Y(11), stroke: "#1db584", "stroke-width": 2, "stroke-dasharray": "5 4" }, graphG);
  txt(graphG, X(3), 66, "lbl lbl-g", "minimum w = 3", "middle");

  var pathsG = el("g", { "clip-path": "url(#lrclip)" }, svg);
  RATES.forEach(function (r) {
    r.g = el("g", {}, pathsG);
    r.line = el("polyline", { fill: "none", stroke: r.color, "stroke-width": 2, "stroke-dasharray": "5 3", opacity: 0.8 }, r.g);
    r.dots = r.path.map(function (wv) { return el("circle", { cx: X(wv), cy: Y(Lw(wv)), r: 5.5, fill: r.color, stroke: "#071510", "stroke-width": 1.5 }, r.g); });
  });
  var startDot = el("circle", { cx: X(0), cy: Y(9), r: 9, fill: "#ffffff", stroke: "#071510", "stroke-width": 3 }, svg);
  var startLbl = txt(svg, X(0) + 14, Y(9) - 8, "lbl", "start w = 0", "start");
  var readout = txt(svg, 40, 34, "mono", "", "start");
  var readout2 = txt(svg, 40, 52, "note", "", "start");

  var chipsG = el("g", {}, svg);
  RATES.forEach(function (r, i) {
    var x = 40 + i * 144;
    box(chipsG, x, 70, 134, 28, "rgba(255,255,255,0.06)", r.color, 14);
    txt(chipsG, x + 67, 89, "lbl", r.name, "middle").setAttribute("fill", r.color);
  });

  var jumpG = el("g", {}, svg);
  var ja = arrow(jumpG, "y", 4); setLine(ja, X(0) + 6, 126, X(5.4) - 6, 126);
  el("line", { x1: X(0), y1: 126, x2: X(0), y2: Y(9) - 12, stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "4 3" }, jumpG);
  el("line", { x1: X(5.4), y1: 126, x2: X(5.4), y2: Y(Lw(5.4)) - 8, stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "4 3" }, jumpG);
  txt(jumpG, X(2.7), 116, "lbl lbl-y", "first step: 0 → 5.4, past the minimum at 3", "middle");

  // Loss-versus-step comparison.
  var cmpG = el("g", {}, svg);
  var CX = function (k) { return 80 + k * 48; };
  var CY = function (l) { return 310 - l * 12; };
  clipTo("cmpclip", 70, 50, 440, 262);
  el("line", { x1: 70, y1: CY(0), x2: 570, y2: CY(0), class: "axis" }, cmpG);
  el("line", { x1: 70, y1: CY(0), x2: 70, y2: 50, class: "axis" }, cmpG);
  for (var q = 0; q <= 10; q += 2) txt(cmpG, CX(q), CY(0) + 16, "tick", String(q), "middle");
  [0, 5, 10, 15, 20].forEach(function (v) { txt(cmpG, 62, CY(v) + 4, "tick", String(v), "end"); });
  txt(cmpG, 570, CY(0) + 32, "note", "step number", "end");
  txt(cmpG, 76, 44, "note", "loss", "start");
  var cclip = el("g", { "clip-path": "url(#cmpclip)" }, cmpG);
  RATES.forEach(function (r) {
    var pts = r.path.map(function (wv, k) { return CX(k).toFixed(1) + "," + CY(Lw(wv)).toFixed(1); }).join(" ");
    el("polyline", { points: pts, fill: "none", stroke: r.color, "stroke-width": 3 }, cclip);
    r.path.forEach(function (wv, k) { el("circle", { cx: CX(k), cy: CY(Lw(wv)), r: 3.5, fill: r.color }, cclip); });
  });
  RATES.forEach(function (r, i) {
    box(cmpG, 400, 70 + i * 22, 14, 14, r.color, "none", 3);
    txt(cmpG, 420, 82 + i * 22, "lbl", r.name, "start");
  });
  txt(cmpG, 320, 346, "note", "η = 1.1 leaves the chart: its loss is above 300 at step 10", "middle");

  function drawRate(idx, n) {
    var r = RATES[idx];
    r.line.setAttribute("points", r.path.slice(0, n + 1).map(function (wv) { return X(wv).toFixed(1) + "," + Y(Lw(wv)).toFixed(1); }).join(" "));
    r.dots.forEach(function (d, k) { d.setAttribute("opacity", k <= n ? "1" : "0"); });
    readout.textContent = r.name + "     step " + n + ":  w = " + fmt(r.path[n], 2) + ",  loss = " + (Lw(r.path[n]) > 1000 ? "> 1000" : fmt(Lw(r.path[n]), Lw(r.path[n]) < 0.1 ? 4 : 2));
  }
  function only(idx) {
    RATES.forEach(function (r, k) { show(r.g, k === idx); });
  }

  function render(index, id) {
    var i = index;
    show(graphG, i <= 7); show(pathsG, i >= 1 && i <= 7);
    show(startDot, i <= 7); show(startLbl, i === 0);
    show(readout, i >= 1 && i <= 7); show(readout2, i >= 1 && i <= 7);
    show(chipsG, i === 0);
    show(jumpG, i === 6);
    show(cmpG, i === 8);
    readout.textContent = ""; readout2.textContent = "";
    if (i === 1) { only(0); anim("p", 2600, function (e) { drawRate(0, Math.round(e * 10)); readout2.textContent = "tiny steps"; }); }
    if (i === 2) { only(0); drawRate(0, 10); readout2.textContent = "after 10 steps: far from 3, loss still ≈ 4"; }
    if (i === 3) { only(1); anim("p", 2200, function (e) { drawRate(1, Math.round(e * 10)); readout2.textContent = "big steps first, smaller later"; }); }
    if (i === 4) { only(1); drawRate(1, 5); readout2.textContent = "after 5 steps: w ≈ 2.97, loss ≈ 0.001"; }
    if (i === 5) { only(2); anim("p", 800, function (e) { drawRate(2, Math.round(e * 1)); readout2.textContent = "the first step overshoots the minimum"; }); }
    if (i === 6) { only(2); drawRate(2, 6); readout2.textContent = "bounces from side to side, shrinking slowly"; }
    if (i === 7) { only(3); anim("p", 2400, function (e) { drawRate(3, Math.round(e * 10)); readout2.textContent = "each bounce is bigger: the loss grows"; }); }
  }
