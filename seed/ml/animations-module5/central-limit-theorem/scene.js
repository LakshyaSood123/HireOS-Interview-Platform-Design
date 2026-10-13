  var steps = [
    { id: "source-distribution", label: "The population: a fair die", caption: "Start with a population that is clearly NOT bell-shaped: one roll of a fair die. Each face from 1 to 6 has probability 1/6, so the shape is flat. Its mean is 3.5 and its standard deviation is about 1.71." },
    { id: "sample", label: "Take one sample", caption: "Take a sample: roll the die 5 times. Say we get 2, 6, 6, 1 and 4." },
    { id: "sample-mean", label: "Compute the sample mean", caption: "The sample mean is the average of the sample: (2 + 6 + 6 + 1 + 4) / 5 = 3.8. This ONE number, not the five rolls, is what we now record on the axis." },
    { id: "repeat", label: "Repeat many times", caption: "Do it again with a fresh sample of 5 rolls, and again, and again. Each repetition drops one more sample mean onto the axis. The pile of recorded means starts to take a shape." },
    { id: "means-histogram", label: "Histogram of the sample means", caption: "After 2000 repetitions: the histogram of the SAMPLE MEANS (n = 5) is already hump-shaped around 3.5, even though a single roll is flat. The rolls did not become bell-shaped; their averages did." },
    { id: "larger-n", label: "Use bigger samples", caption: "Now let each sample have n = 30 rolls instead of 5, and again record 2000 sample means. The histogram is more bell-shaped and much narrower." },
    { id: "normal-shape", label: "A normal curve fits", caption: "A normal curve with mean 3.5 and spread σ / √30 ≈ 0.31 hugs the histogram of means. This is the central limit theorem: sample means are approximately normally distributed, whatever the shape of the population." },
    { id: "narrower-spread", label: "Bigger n, narrower spread", caption: "Compare the two: with n = 5 the means spread about 0.76 (σ/√5), with n = 30 only 0.31 (σ/√30). This spread is the standard error. Four times the data halves it." },
    { id: "lln-vs-clt", label: "LLN versus CLT", caption: "LLN asks where ONE sample mean goes as n grows (toward the true mean). CLT asks how MANY sample means are distributed across repeated samples (approximately normal, spread σ/√n). Different questions." },
    { id: "ml-connection", label: "Why ML cares", caption: "This is why averages behave predictably: estimates can carry error bars, uncertainty shrinks like 1/√n, and Gaussian noise is a common assumption. It holds for averages, not for raw data." }
  ];

  var MU = 3.5, SIGMA = Math.sqrt(35 / 12);
  var rr = mulberry(11);
  function dieRoll() { return 1 + Math.floor(rr() * 6); }
  function means(n, count) {
    var out = [];
    for (var c = 0; c < count; c++) { var s = 0; for (var k = 0; k < n; k++) s += dieRoll(); out.push(s / n); }
    return out;
  }
  var M5 = means(5, 2000), M30 = means(30, 2000);
  function mean(a) { var s = 0; a.forEach(function (v) { s += v; }); return s / a.length; }
  function sd(a) { var m = mean(a), s = 0; a.forEach(function (v) { s += (v - m) * (v - m); }); return Math.sqrt(s / a.length); }

  var PXh = function (v) { return 64 + (v - 1) * 108; };
  var BASE = 306, SY = 128, BW = 0.2, NB = 26;
  function binsOf(arr, count) {
    var bins = [];
    for (var b = 0; b < NB; b++) bins.push(0);
    for (var i = 0; i < count; i++) {
      var idx = Math.min(NB - 1, Math.max(0, Math.round((arr[i] - 1) / BW)));
      bins[idx]++;
    }
    return bins;
  }
  function makeBars(parent, fill, stroke) {
    var out = [];
    for (var b = 0; b < NB; b++) out.push(box(parent, PXh(1 + b * BW) - (PXh(1 + BW) - PXh(1)) / 2 + 1, BASE, PXh(1 + BW) - PXh(1) - 2, 0, fill, stroke || "none", 2));
    return out;
  }
  function setBars(bars, arr, count) {
    var bins = binsOf(arr, count);
    bins.forEach(function (c, b) {
      var h = (c / (count * BW)) * SY;
      setBox(bars[b], PXh(1 + b * BW) - (PXh(1 + BW) - PXh(1)) / 2 + 1, BASE - h, PXh(1 + BW) - PXh(1) - 2, h);
    });
  }

  // Axis for the sample means.
  var axG = el("g", {}, svg);
  el("line", { x1: 50, y1: BASE, x2: 620, y2: BASE, class: "axis" }, axG);
  [1, 2, 3, 4, 5, 6].forEach(function (v) { txt(axG, PXh(v), BASE + 16, "tick", String(v), "middle"); });
  txt(axG, 620, BASE + 34, "note", "value of a sample mean", "end");
  var meanLine = el("line", { x1: PXh(3.5), y1: 146, x2: PXh(3.5), y2: BASE, stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
  var meanLbl = txt(svg, PXh(3.5) + 8, 150, "lbl lbl-y", "μ = 3.5", "start");

  // Population inset (the die).
  var popG = el("g", {}, svg);
  for (var f = 1; f <= 6; f++) {
    box(popG, 40 + (f - 1) * 38, 82, 28, 44, "rgba(56,189,248,0.7)", "none", 3);
    txt(popG, 54 + (f - 1) * 38, 142, "tick", String(f), "middle");
  }
  txt(popG, 40, 66, "lbl lbl-b", "population: one die roll", "start");
  txt(popG, 40 + 6 * 38 + 6, 108, "note", "flat, not a bell", "start");

  // Big flat population for step 0.
  var bigPop = el("g", {}, svg);
  for (var g = 1; g <= 6; g++) {
    box(bigPop, 90 + (g - 1) * 80, 150, 60, 110, "rgba(56,189,248,0.7)", "none", 4);
    txt(bigPop, 120 + (g - 1) * 80, 282, "big", String(g), "middle");
    txt(bigPop, 120 + (g - 1) * 80, 142, "lbl", "1/6", "middle");
  }
  txt(bigPop, 320, 54, "lbl lbl-b", "one roll of a fair die: the population", "middle");
  txt(bigPop, 320, 82, "note", "mean μ = 3.5     standard deviation σ ≈ 1.71", "middle");

  // The sample of five rolls and its mean.
  var sampG = el("g", {}, svg);
  var ROLLS = [2, 6, 6, 1, 4];
  ROLLS.forEach(function (v, i) {
    box(sampG, 100 + i * 80, 176, 60, 60, "rgba(226,180,74,0.2)", "#e2b44a", 10);
    txt(sampG, 130 + i * 80, 218, "big", String(v), "middle").setAttribute("font-size", "26");
  });
  txt(sampG, 320, 166, "lbl lbl-y", "one sample: 5 rolls", "middle");
  var meanG = el("g", {}, svg);
  txt(meanG, 320, 262, "mono", "(2 + 6 + 6 + 1 + 4) / 5 = 3.8", "middle");
  var dropA = arrow(meanG, "g", 4); setLine(dropA, PXh(3.8), 270, PXh(3.8), BASE - 10);
  el("circle", { cx: PXh(3.8), cy: BASE - 5, r: 7, fill: "#1db584", stroke: "#071510", "stroke-width": 2 }, meanG);
  txt(meanG, PXh(3.8) + 12, 292, "lbl lbl-g", "sample mean 3.8", "start");

  // Histograms.
  var histG5 = el("g", {}, svg);
  var bars5 = makeBars(histG5, "rgba(56,189,248,0.85)");
  var histG30 = el("g", {}, svg);
  var bars30 = makeBars(histG30, "rgba(244,114,182,0.85)");
  var ghost5 = el("g", {}, svg);
  var ghostBars = makeBars(ghost5, "none", "#38bdf8");
  ghostBars.forEach(function (b) { b.setAttribute("stroke-width", 2); });

  var curveG = el("g", {}, svg);
  var cd = "", sd30 = SIGMA / Math.sqrt(30);
  for (var x = 1.8; x <= 5.2; x += 0.04) cd += (cd ? " L " : "M ") + PXh(x).toFixed(1) + " " + (BASE - (Math.exp(-((x - MU) * (x - MU)) / (2 * sd30 * sd30)) / (sd30 * Math.sqrt(2 * Math.PI))) * SY).toFixed(1);
  el("path", { d: cd, fill: "none", stroke: "#e2b44a", "stroke-width": 3 }, curveG);
  txt(curveG, PXh(4.7), 150, "lbl lbl-y", "normal curve", "start");
  txt(curveG, PXh(4.7), 166, "note", "mean 3.5, spread σ/√30", "start");

  var stat = txt(svg, 612, 58, "mono", "", "end");
  var stat2 = txt(svg, 612, 80, "note", "", "end");
  var spreadG = el("g", {}, svg);
  var s5 = SIGMA / Math.sqrt(5);
  var a5 = arrow(spreadG, "b", 3); setLine(a5, PXh(3.5), 118, PXh(3.5 + s5), 118);
  txt(spreadG, PXh(3.5 + s5) + 8, 122, "lbl lbl-b", "n = 5: spread 0.76", "start");
  var a30 = arrow(spreadG, "p", 3); setLine(a30, PXh(3.5), 138, PXh(3.5 + sd30), 138);
  txt(spreadG, PXh(3.5 + sd30) + 8, 142, "lbl lbl-p", "n = 30: spread 0.31", "start");

  var cmpG = el("g", {}, svg);
  card(cmpG, 30, 70, 280, 230, "fillA");
  txt(cmpG, 170, 102, "lbl lbl-b", "LAW OF LARGE NUMBERS", "middle");
  txt(cmpG, 170, 130, "note", "where does ONE sample mean go", "middle");
  txt(cmpG, 170, 146, "note", "as the sample size n grows?", "middle");
  var lp = "";
  for (var q = 1; q <= 40; q++) lp += (lp ? " L " : "M ") + (60 + q * 5).toFixed(1) + " " + (230 - (0.5 + 0.35 * Math.sin(q * 1.3) / Math.sqrt(q)) * 70 + 20).toFixed(1);
  el("path", { d: lp, fill: "none", stroke: "#38bdf8", "stroke-width": 3 }, cmpG);
  el("line", { x1: 60, y1: 230 - 0.5 * 70 + 20, x2: 270, y2: 230 - 0.5 * 70 + 20, stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "5 4" }, cmpG);
  txt(cmpG, 170, 282, "lbl lbl-y", "→ settles toward μ", "middle");
  card(cmpG, 330, 70, 280, 230, "fillB");
  txt(cmpG, 470, 102, "lbl lbl-p", "CENTRAL LIMIT THEOREM", "middle");
  txt(cmpG, 470, 130, "note", "how are MANY sample means", "middle");
  txt(cmpG, 470, 146, "note", "spread over repeated samples?", "middle");
  var bp = "";
  for (var z = -3; z <= 3.01; z += 0.2) bp += (bp ? " L " : "M ") + (470 + z * 36).toFixed(1) + " " + (262 - Math.exp(-z * z / 2) * 80).toFixed(1);
  el("path", { d: bp, fill: "none", stroke: "#f472b6", "stroke-width": 3 }, cmpG);
  txt(cmpG, 470, 282, "lbl lbl-y", "→ approximately normal, spread σ/√n", "middle");

  var mlG = el("g", {}, svg);
  [["Error bars", "uncertainty of an average shrinks like 1/√n", "fillA"], ["Predictable averages", "means of many samples behave in a known way", "fillB"], ["Gaussian noise", "a common assumption, often justified by averaging many small effects", "fillG"]].forEach(function (b, i) {
    var y = 50 + i * 90;
    card(mlG, 70, y, 500, 74, b[2]);
    txt(mlG, 320, y + 30, "big", b[0], "middle");
    txt(mlG, 320, y + 54, "note", b[1], "middle");
  });
  txt(mlG, 320, 326, "lbl lbl-y", "true for averages, not for raw data", "middle");

  function showStats(arr, label, theory) {
    stat.textContent = label + "  mean of means " + fmt(mean(arr), 2) + "   spread " + fmt(sd(arr), 2);
    stat2.textContent = "theory: σ/√n = " + fmt(theory, 2);
  }

  function render(index, id) {
    var i = index;
    show(bigPop, i === 0);
    show(popG, i >= 1 && i <= 7);
    show(sampG, i === 1 || i === 2);
    show(meanG, i === 2);
    show(axG, i >= 2 && i <= 7);
    show(meanLine, i >= 4 && i <= 7); show(meanLbl, i >= 4 && i <= 6); // step 7 draws two spread arrows right where this label sits
    show(histG5, i === 3 || i === 4);
    show(histG30, i === 5 || i === 6 || i === 7);
    show(ghost5, i === 7);
    show(curveG, i === 6 || i === 7);
    show(spreadG, i === 7);
    show(cmpG, i === 8);
    show(mlG, i === 9);
    show(stat, i >= 4 && i <= 7); show(stat2, i >= 4 && i <= 7);
    if (i === 3) {
      anim("rep", 2600, function (e) {
        var k = Math.max(1, Math.round(e * 150));
        setBars(bars5, M5, k);
        stat.textContent = ""; stat2.textContent = "";
      });
    }
    if (i === 4) { setBars(bars5, M5, 2000); showStats(M5, "n = 5:", SIGMA / Math.sqrt(5)); }
    if (i === 5) {
      setBars(bars30, M30, 2000); showStats(M30, "n = 30:", sd30);
      anim("grow", 1100, function (e) {
        var cur = binsOf(M30, 2000), old = binsOf(M5, 2000);
        cur.forEach(function (c, b) {
          var h = (lerp(old[b], c, e) / (2000 * BW)) * SY;
          setBox(bars30[b], PXh(1 + b * BW) - (PXh(1 + BW) - PXh(1)) / 2 + 1, BASE - h, PXh(1 + BW) - PXh(1) - 2, h);
        });
      });
    }
    if (i === 6) { setBars(bars30, M30, 2000); showStats(M30, "n = 30:", sd30); }
    if (i === 7) { setBars(bars30, M30, 2000); setBars(ghostBars, M5, 2000); stat.textContent = "n = 5 (outline) vs n = 30 (filled)"; stat2.textContent = "same population, same mean 3.5"; }
  }
