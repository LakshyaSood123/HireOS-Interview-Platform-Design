  var steps = [
    { id: "same-mean", label: "Two distributions, same mean", caption: "A takes the values 4, 5, 6 with probabilities 0.25, 0.5, 0.25. B takes 0, 5, 10 with the same probabilities. Both balance at 5: their mean (expected value) is 5." },
    { id: "different-spread", label: "But they are spread differently", caption: "A stays within 1 of the mean. B stretches 5 away on each side. The mean cannot tell them apart, so we need a second number: the spread." },
    { id: "mean", label: "Start from the mean", caption: "Focus on A. Its mean is 5. To measure spread we will ask, for each value, how far it is from this mean." },
    { id: "deviations", label: "Deviations from the mean", caption: "The deviation of a value is its distance from the mean with a sign: 4 is −1 away, 5 is 0 away, 6 is +1 away. Averaging these just gives 0, because the minus and plus cancel." },
    { id: "square-deviations", label: "Square the deviations", caption: "Squaring removes the signs and punishes bigger misses more: (−1)² = 1, 0² = 0, (+1)² = 1. Each square is drawn with that area (tiny here)." },
    { id: "average", label: "Average the squares", caption: "Take the probability-weighted average of the squares: 0.25 × 1 + 0.5 × 0 + 0.25 × 1 = 0.5. That is the variance: Var(A) = 0.5." },
    { id: "compare-variance", label: "Compare with B", caption: "For B the deviations are −5, 0, +5, so the squares are 25, 0, 25 (big squares). Var(B) = 0.25 × 25 + 0 + 0.25 × 25 = 12.5, which is 25 times larger than Var(A)." },
    { id: "ml-connection", label: "Why variance matters in ML", caption: "Variance tells how uncertain a prediction is or how much a feature varies. Standard deviation (the square root) is in the original units: about 0.71 for A and 3.54 for B." }
  ];

  var XS = function (v) { return 70 + 50 * v; };
  var yA = 130, yB = 244, HS = 140;

  function chart(parent, base, vals, color, title) {
    var g = el("g", {}, parent);
    el("line", { x1: 40, y1: base, x2: 600, y2: base, class: "axis" }, g);
    [0, 5, 10].forEach(function (v) { txt(g, XS(v), base + 16, "tick", String(v), "middle"); });
    vals.forEach(function (vp) {
      box(g, XS(vp[0]) - 14, base - vp[1] * HS, 28, vp[1] * HS, color, "none", 3);
    });
    txt(g, 20, base - 70, "big", title, "start").setAttribute("font-size", "22");
    var m = el("line", { x1: XS(5), y1: base - 88, x2: XS(5), y2: base, stroke: "#e2b44a", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, g);
    // Probability labels are drawn after the mean line, with a dark outline, so the dashed line never strikes through them.
    vals.forEach(function (vp) {
      var label = txt(g, XS(vp[0]), base - vp[1] * HS - 6, "lbl", String(vp[1]), "middle");
      label.setAttribute("stroke", "#071510");
      label.setAttribute("stroke-width", "4");
      label.setAttribute("paint-order", "stroke");
    });
    txt(g, XS(5) + 8, base - 94, "lbl lbl-y", "mean 5", "start");
    return g;
  }
  var gA = chart(svg, yA, [[4, 0.25], [5, 0.5], [6, 0.25]], "rgba(56,189,248,0.8)", "A");
  var gB = chart(svg, yB, [[0, 0.25], [5, 0.5], [10, 0.25]], "rgba(244,114,182,0.8)", "B");

  var spreadG = el("g", {}, svg);
  var sa = arrow(spreadG, "g", 3); setLine(sa, XS(5) - 6, yA + 36, XS(4) - 14, yA + 36);
  var sb = arrow(spreadG, "g", 3); setLine(sb, XS(5) + 6, yA + 36, XS(6) + 14, yA + 36);
  txt(spreadG, XS(5), yA + 52, "lbl lbl-g", "narrow", "middle");
  var sc = arrow(spreadG, "r", 3); setLine(sc, XS(5) - 6, yB + 36, XS(0), yB + 36);
  var sd = arrow(spreadG, "r", 3); setLine(sd, XS(5) + 6, yB + 36, XS(10), yB + 36);
  txt(spreadG, XS(5), yB + 52, "lbl lbl-r", "wide", "middle");

  function devs(parent, base, pairs, color) {
    var g = el("g", {}, parent);
    pairs.forEach(function (p) {
      var d = p[1];
      if (d !== 0) {
        var a = arrow(g, color, 3);
        setLine(a, XS(5), base + 30, XS(p[0]) + (d > 0 ? -16 : 16), base + 30);
      } else {
        el("circle", { cx: XS(5), cy: base + 30, r: 4, fill: "#c9dccf" }, g);
      }
      txt(g, XS(p[0]), base + 50, "lbl", (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d), "middle");
    });
    return g;
  }
  var devA = devs(svg, yA, [[4, -1], [5, 0], [6, 1]], "y");
  var devB = devs(svg, yB, [[0, -5], [5, 0], [10, 5]], "y");

  function squares(parent, base, pairs, color) {
    var g = el("g", {}, parent);
    pairs.forEach(function (p) {
      var side = Math.abs(p[1]) * 6;
      if (side > 0) box(g, XS(p[0]) - side / 2, base + 56, side, side, color, "none", 1);
      txt(g, XS(p[0]), base + 56 + Math.max(side, 6) + 14, "lbl", String(p[1] * p[1]), "middle");
    });
    return g;
  }
  var sqA = squares(svg, yA, [[4, -1], [5, 0], [6, 1]], "rgba(56,189,248,0.9)");
  var sqB = squares(svg, yB, [[0, -5], [5, 0], [10, 5]], "rgba(244,114,182,0.9)");

  var avgG = el("g", {}, svg);
  card(avgG, 60, 196, 520, 120, "fillG");
  txt(avgG, 320, 224, "lbl lbl-g", "variance = the probability-weighted average of the squares", "middle");
  txt(avgG, 320, 258, "mono", "0.25 × 1  +  0.5 × 0  +  0.25 × 1", "middle");
  txt(avgG, 320, 296, "big", "Var(A) = 0.5", "middle").setAttribute("font-size", "20");

  var cmpG = el("g", {}, svg);
  card(cmpG, 430, 8, 190, 46, "fillA");
  txt(cmpG, 450, 36, "note", "Var(A) =", "start");
  txt(cmpG, 540, 40, "big", "0.5", "start").setAttribute("font-size", "22");
  card(cmpG, 430, 62, 190, 46, "fillB");
  txt(cmpG, 450, 90, "note", "Var(B) =", "start");
  txt(cmpG, 540, 94, "big", "12.5", "start").setAttribute("font-size", "22");

  var mlG = el("g", {}, svg);
  txt(mlG, 320, 40, "lbl", "standard deviation = √variance, in the original units", "middle");
  var SD = 40;
  card(mlG, 60, 70, 150, 56, "fillA");
  txt(mlG, 135, 104, "big", "Model A", "middle");
  box(mlG, 230, 82, 0.71 * SD * 2, 32, "rgba(56,189,248,0.85)", "none", 4);
  txt(mlG, 230 + 0.71 * SD * 2 + 8, 104, "lbl", "spread ≈ 0.71", "start");
  card(mlG, 60, 150, 150, 56, "fillB");
  txt(mlG, 135, 184, "big", "Model B", "middle");
  box(mlG, 230, 162, 3.54 * SD * 2, 32, "rgba(244,114,182,0.85)", "none", 4);
  txt(mlG, 230 + 3.54 * SD * 2 + 8, 184, "lbl", "≈ 3.54", "start");
  card(mlG, 60, 240, 520, 84, "fillG");
  txt(mlG, 320, 270, "lbl", "same average error, very different reliability", "middle");
  txt(mlG, 320, 300, "note", "larger variance = less predictable predictions, or a more spread-out feature", "middle");

  function render(index, id) {
    var i = index;
    show(gA, i <= 7 && i !== 7);
    show(gB, i <= 1 || i === 6);
    show(spreadG, i === 1);
    show(devA, i === 3 || i === 4);
    show(sqA, i === 4);
    show(devB, i === 6);
    show(sqB, i === 6);
    show(avgG, i === 5);
    show(cmpG, i === 6);
    show(mlG, i === 7);
    // In the final comparison, shift chart A upward area is the same; cards sit on the right.
  }
