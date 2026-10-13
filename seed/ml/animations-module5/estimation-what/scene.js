  var steps = [
    { id: "unknown-parameter", label: "An unknown parameter", caption: "This coin has some true probability p of landing heads, but nobody printed it on the coin. p is a parameter: a fixed number that describes the coin, and it is unknown." },
    { id: "collect-data", label: "Collect data", caption: "What we can do is observe data. Flip the coin 5 times: H H T H H, which is 4 heads and 1 tail. Data is visible; p is not." },
    { id: "sample", label: "A sample from a larger population", caption: "These 5 flips are a sample, a small piece of the population of every flip this coin could ever make. We will use the sample to learn about the population." },
    { id: "candidate-values", label: "Candidate values of p", caption: "Which values of p are plausible? If p were 0.2 we would expect about 1 head in 5 flips, if p were 0.5 about 2.5, if p were 0.8 about 4." },
    { id: "compare-candidates", label: "Compare candidates with the data", caption: "We saw 4 heads. p = 0.2 expects 1 (off by 3), p = 0.5 expects 2.5 (off by 1.5), p = 0.8 expects 4 (off by 0). The data match 0.8 best." },
    { id: "estimate", label: "The estimate", caption: "The rule 'heads divided by flips' is an estimator. Applied to this sample it gives the estimate 4 / 5 = 0.8. The rule stays; the number depends on the data." },
    { id: "uncertainty", label: "Estimates vary", caption: "Flip the same coin another 5 times and you may get H T T H T: estimate 0.4. Another sample, H T H H T, gives 0.6. The coin did not change; the samples did. So an estimate always carries uncertainty." },
    { id: "ml-connection", label: "Parameters are what models learn", caption: "A model's parameters are estimated from data, and then they determine its predictions: with p estimated as 0.8, we predict heads on the next flip with probability 0.8." }
  ];

  var FLIPS = ["H", "H", "T", "H", "H"];
  var bigG = el("g", {}, svg);
  el("circle", { cx: 320, cy: 150, r: 66, fill: "rgba(226,180,74,0.18)", stroke: "#e2b44a", "stroke-width": 4 }, bigG);
  txt(bigG, 320, 166, "big", "p = ?", "middle").setAttribute("font-size", "32");
  var bigLbl = txt(bigG, 320, 248, "lbl lbl-y", "unknown probability of heads", "middle");
  var bigLbl2 = txt(bigG, 320, 268, "note", "a parameter: fixed, but we cannot see it", "middle");

  var cloudG = el("g", {}, svg);
  var cr = mulberry(5);
  for (var q = 0; q < 110; q++) {
    var ang = cr() * Math.PI * 2, rad = Math.sqrt(cr());
    el("circle", { cx: 440 + Math.cos(ang) * rad * 175, cy: 200 + Math.sin(ang) * rad * 88, r: 4.5, fill: cr() < 0.7 ? "rgba(244,114,182,0.5)" : "rgba(56,189,248,0.5)" }, cloudG);
  }
  el("ellipse", { cx: 440, cy: 200, rx: 190, ry: 100, fill: "none", stroke: "#c9dccf", "stroke-width": 2, "stroke-dasharray": "7 5" }, cloudG);
  txt(cloudG, 440, 322, "lbl", "population: every flip this coin could ever make", "middle");

  var rowG = el("g", {}, svg);
  var flipCoins = FLIPS.map(function (L, i) {
    var g = coin(rowG, 262 + i * 66, 120, 25, L);
    return g;
  });
  var rowLbl = txt(rowG, 395, 78, "lbl", "5 flips: 4 heads, 1 tail", "middle");
  var sampBox = el("rect", { x: 226, y: 88, width: 340, height: 64, rx: 14, fill: "none", stroke: "#e2b44a", "stroke-width": 3 }, svg);
  var sampLbl = txt(svg, 396, 180, "lbl lbl-y", "sample: our 5 flips", "middle");

  var candG = el("g", {}, svg);
  var cands = [[0.2, 1, "p = 0.2"], [0.5, 2.5, "p = 0.5"], [0.8, 4, "p = 0.8"]];
  var candBoxes = [], diffLbls = [];
  cands.forEach(function (c, i) {
    var x = 20 + i * 205;
    candBoxes.push(box(candG, x, 190, 190, 140, "rgba(56,189,248,0.08)", "rgba(56,189,248,0.5)", 12));
    txt(candG, x + 95, 216, "big", c[2], "middle");
    for (var s = 0; s < 5; s++) {
      var fillAmt = Math.max(0, Math.min(1, c[1] - s));
      box(candG, x + 20 + s * 30, 232, 26, 26, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.3)", 3);
      if (fillAmt > 0) box(candG, x + 20 + s * 30, 232, 26 * fillAmt, 26, "rgba(244,114,182,0.85)", "none", 3);
    }
    txt(candG, x + 95, 282, "note", "expects " + c[1] + " heads in 5", "middle");
    diffLbls.push(txt(candG, x + 95, 312, "lbl", "", "middle"));
  });
  var seenG = el("g", {}, svg);
  [0, 1, 2].forEach(function (i) {
    var x = 20 + i * 205;
    el("line", { x1: x + 20 + 4 * 30 - 2, y1: 226, x2: x + 20 + 4 * 30 - 2, y2: 264, stroke: "#e2b44a", "stroke-width": 3 }, seenG);
  });
  txt(seenG, 320, 182, "lbl lbl-y", "seen: 4 heads (yellow mark)", "middle");

  var estG = el("g", {}, svg);
  card(estG, 130, 200, 380, 120, "fillG");
  txt(estG, 320, 232, "lbl", "estimator (the rule):  heads ÷ flips", "middle");
  txt(estG, 320, 270, "big", "estimate:  4 / 5 = 0.8", "middle").setAttribute("font-size", "22");
  txt(estG, 320, 300, "note", "the rule is fixed; the number depends on the data", "middle");

  var varG = el("g", {}, svg);
  [["H H T H H", "0.8"], ["H T T H T", "0.4"], ["H T H H T", "0.6"]].forEach(function (r, i) {
    var y = 40 + i * 78;
    card(varG, 40, y, 250, 56, "fillA");
    var seq = r[0].split(" ");
    seq.forEach(function (L, j) { coin(varG, 70 + j * 44, y + 28, 15, L); });
    var a = arrow(varG, "w", 3); setLine(a, 298, y + 28, 340, y + 28);
    card(varG, 346, y, 150, 56, "fillG");
    txt(varG, 421, y + 36, "big", "estimate " + r[1], "middle");
  });
  txt(varG, 320, 296, "lbl lbl-y", "same coin, same p: three samples, three estimates", "middle");
  txt(varG, 320, 322, "note", "so we also ask how much to trust an estimate", "middle");

  var mlG = el("g", {}, svg);
  [["data", "flips H H T H H", "fillA"], ["estimator", "heads ÷ flips", "fillG"], ["parameter", "p̂ = 0.8", "fillB"], ["prediction", "next flip: heads with probability 0.8", "fillG"]].forEach(function (b, i) {
    var x = 14 + i * 158, w = 138;
    card(mlG, x, 120, w, 100, b[2]);
    txt(mlG, x + w / 2, 148, "note", b[0], "middle");
    var parts = b[1].length > 18 ? [b[1].slice(0, 14), b[1].slice(14)] : [b[1]];
    if (i === 3) parts = ["next flip:", "heads with", "probability 0.8"];
    parts.forEach(function (ptxt, k) { txt(mlG, x + w / 2, 176 + k * 18, "lbl", ptxt, "middle"); });
    if (i < 3) { var a = arrow(mlG, "w", 3); setLine(a, x + w + 2, 170, x + w + 18, 170); }
  });
  txt(mlG, 320, 262, "lbl lbl-y", "learning a model = estimating its parameters from data", "middle");

  function render(index, id) {
    var i = index;
    show(bigG, i <= 1 || i === 2);
    show(bigLbl, i === 0); show(bigLbl2, i === 0);
    var shiftBig = i === 0 ? 0 : -210;
    place(bigG, shiftBig, i >= 3 ? -80 : 0);
    show(rowG, i >= 1 && i <= 5);
    show(rowLbl, i >= 1 && i <= 2);
    show(cloudG, i === 2);
    show(sampBox, i === 2); show(sampLbl, i === 2);
    show(candG, i >= 3 && i <= 4);
    show(seenG, i === 4);
    show(estG, i === 5);
    show(varG, i === 6);
    show(mlG, i === 7);
    show(bigG, i <= 2);
    place(rowG, 0, i >= 3 ? -50 : 0);
    for (var c = 0; c < 3; c++) {
      var d = Math.abs(cands[c][1] - 4);
      diffLbls[c].textContent = i === 4 ? (d === 0 ? "off by 0: best match" : "off by " + d) : "";
      candBoxes[c].setAttribute("stroke", i === 4 && d === 0 ? "#1db584" : "rgba(56,189,248,0.5)");
      candBoxes[c].setAttribute("stroke-width", i === 4 && d === 0 ? 4 : 2);
    }
    if (i === 1) {
      anim("flips", 1200, function (e) { flipCoins.forEach(function (g, k) { g.setAttribute("opacity", Math.max(0, Math.min(1, e * 6 - k)).toFixed(2)); }); });
    } else {
      flipCoins.forEach(function (g) { g.setAttribute("opacity", "1"); });
    }
  }
