  var steps = [
    { id: "distribution-idea", label: "What a distribution is", caption: "A distribution says which values a random variable can take and how likely each one is. The taller the bar, the more likely the value. Named distributions are ready-made shapes for common situations." },
    { id: "bernoulli", label: "Bernoulli: one yes-or-no", caption: "A Bernoulli variable is 0 or 1. With p = 0.3, 'spam' (1) has probability 0.3 and 'not spam' (0) has 0.7. Every binary label in classification is a Bernoulli outcome." },
    { id: "binomial", label: "Binomial: count the successes", caption: "Count the spam emails among 10, each spam with probability 0.3. The count is Binomial. Three is the most likely (about 0.27); zero is rare (about 0.03)." },
    { id: "uniform", label: "Uniform: no favorite", caption: "A Uniform variable on [0, 1] treats every part of the range alike: equal-width slices are equally likely. It models 'no preference'." },
    { id: "gaussian", label: "Gaussian: the bell curve", caption: "The Gaussian is a symmetric bell around its mean μ. Its width is the standard deviation σ, and about 68% of the values fall within one σ of the mean. It fits quantities built from many small effects, like measurement noise." },
    { id: "compare", label: "The four side by side", caption: "Bernoulli and Binomial are for counts of yes/no events. Uniform and Gaussian are for continuous values. The shape of each tells what kind of data it describes." },
    { id: "choose-model", label: "Choosing a distribution", caption: "Start from the question. A yes/no label: Bernoulli. How many yeses in n tries: Binomial. No preference over a range: Uniform. A continuous value clustered around a typical one: Gaussian." },
    { id: "ml-connection", label: "Distributions inside ML models", caption: "Models quietly assume distributions. Classification treats a label as Bernoulli; linear regression treats the noise as Gaussian. Choosing the right one is choosing the right model of the data." }
  ];

  function pmf(k, n, p) {
    var c = 1;
    for (var i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
    return c * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  function drawIdea(g, bx, by, bw, bh) {
    var base = by + bh - 24, hMax = bh - 56;
    el("line", { x1: bx, y1: base, x2: bx + bw, y2: base, class: "axis" }, g);
    var hs = [0.08, 0.2, 0.45, 0.7, 0.45, 0.2, 0.08];
    hs.forEach(function (h, i) {
      var x = bx + bw * (0.1 + i * 0.12);
      box(g, x - bw * 0.04, base - h * hMax, bw * 0.08, h * hMax, "rgba(56,189,248,0.7)", "none", 3);
    });
    txt(g, bx + bw / 2, base + 18, "note", "possible values", "middle");
    txt(g, bx + 4, by + 14, "note", "how likely", "start");
  }
  function drawBern(g, bx, by, bw, bh) {
    var base = by + bh - 34, hMax = bh - 66;
    el("line", { x1: bx, y1: base, x2: bx + bw, y2: base, class: "axis" }, g);
    [[0, 0.7, "0: not spam", "rgba(56,189,248,0.8)"], [1, 0.3, "1: spam", "rgba(244,114,182,0.85)"]].forEach(function (d) {
      var cx = bx + bw * (0.32 + 0.36 * d[0]);
      box(g, cx - bw * 0.08, base - (d[1] / 0.75) * hMax, bw * 0.16, (d[1] / 0.75) * hMax, d[3], "none", 4);
      txt(g, cx, base - (d[1] / 0.75) * hMax - 8, "big", String(d[1]), "middle");
      txt(g, cx, base + 18, "lbl", d[2], "middle");
    });
  }
  function drawBinom(g, bx, by, bw, bh) {
    var base = by + bh - 28, hMax = bh - 62;
    el("line", { x1: bx, y1: base, x2: bx + bw, y2: base, class: "axis" }, g);
    for (var k = 0; k <= 10; k++) {
      var p = pmf(k, 10, 0.3);
      var h = (p / 0.3) * hMax;
      var cx = bx + bw * (0.07 + 0.086 * k);
      box(g, cx - bw * 0.03, base - h, bw * 0.06, Math.max(h, 1), k === 3 ? "rgba(244,114,182,0.9)" : "rgba(56,189,248,0.75)", "none", 2);
      txt(g, cx, base + 14, "tick", String(k), "middle");
    }
    txt(g, bx + bw * (0.07 + 0.086 * 3), base - (pmf(3, 10, 0.3) / 0.3) * hMax - 8, "lbl lbl-p", "0.27", "middle");
    txt(g, bx + bw / 2, base + 30, "note", "number of spam emails among 10", "middle");
  }
  function drawUnif(g, bx, by, bw, bh) {
    var base = by + bh - 34, hMax = bh - 70;
    el("line", { x1: bx, y1: base, x2: bx + bw, y2: base, class: "axis" }, g);
    box(g, bx + bw * 0.2, base - hMax * 0.75, bw * 0.6, hMax * 0.75, "rgba(226,180,74,0.5)", "#e2b44a", 2);
    txt(g, bx + bw * 0.2, base + 16, "lbl", "0", "middle");
    txt(g, bx + bw * 0.8, base + 16, "lbl", "1", "middle");
    txt(g, bx + bw * 0.5, base - hMax * 0.75 - 8, "lbl lbl-y", "same height everywhere", "middle");
  }
  function drawGauss(g, bx, by, bw, bh, withLabels) {
    var base = by + bh - 34, hMax = bh - 70;
    el("line", { x1: bx, y1: base, x2: bx + bw, y2: base, class: "axis" }, g);
    var X = function (t) { return bx + bw * (0.5 + t * 0.11); };
    var Y = function (t) { return base - hMax * Math.exp(-t * t / 2); };
    var shade = [[X(-1), base]];
    for (var t = -1; t <= 1.001; t += 0.1) shade.push([X(t), Y(t)]);
    shade.push([X(1), base]);
    var poly = el("polygon", { points: shade.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), fill: "rgba(29,181,132,0.35)", stroke: "none" }, g);
    var d = "";
    for (var u = -3.6; u <= 3.61; u += 0.2) d += (d ? " L " : "M ") + X(u).toFixed(1) + " " + Y(u).toFixed(1);
    el("path", { d: d, class: "curve" }, g);
    el("line", { x1: X(0), y1: base, x2: X(0), y2: Y(0), stroke: "#e2b44a", "stroke-width": 2, "stroke-dasharray": "5 4" }, g);
    txt(g, X(0), base + 16, "lbl lbl-y", "μ", "middle");
    if (withLabels) {
      txt(g, X(0), base - hMax * 0.45, "lbl lbl-g", "about 68%", "middle");
      txt(g, X(1), base + 16, "lbl", "μ + σ", "middle");
      txt(g, X(-1), base + 16, "lbl", "μ − σ", "middle");
    }
  }

  function layer(drawFn, title, sub, big) {
    var g = el("g", {}, svg);
    if (big) {
      drawFn(g, 60, 50, 520, 260, true);
      txt(g, 320, 36, "lbl lbl-y", title, "middle");
      txt(g, 320, 338, "note", sub, "middle");
    }
    return g;
  }
  var gIdea = layer(drawIdea, "a distribution: how likely is each value?", "tall bar = likely value, short bar = unlikely value", true);
  var gBern = layer(drawBern, "Bernoulli  (p = 0.3)", "one trial: success (1) with probability p, failure (0) otherwise", true);
  var gBinom = layer(drawBinom, "Binomial  (n = 10, p = 0.3)", "the number of successes in n independent trials", true);
  var gUnif = layer(drawUnif, "Uniform on [0, 1]", "no value in the range is favored over another", true);
  var gGauss = layer(drawGauss, "Gaussian  (mean μ, standard deviation σ)", "symmetric bell: values near the mean are most likely", true);

  var gCmp = el("g", {}, svg);
  [[drawBern, 14, 8, "Bernoulli"], [drawBinom, 330, 8, "Binomial"], [drawUnif, 14, 184, "Uniform"], [drawGauss, 330, 184, "Gaussian"]].forEach(function (c) {
    card(gCmp, c[1], c[2], 296, 166, "fillA").setAttribute("fill", "rgba(56,189,248,0.05)");
    c[0](gCmp, c[1] + 12, c[2] + 24, 272, 136, false);
    txt(gCmp, c[1] + 148, c[2] + 18, "lbl lbl-y", c[3], "middle");
  });

  var gChoose = el("g", {}, svg);
  [
    ["Is this email spam? (yes / no)", "Bernoulli", "fillB"],
    ["How many of 10 emails are spam?", "Binomial", "fillA"],
    ["A random number, no preference", "Uniform", "fillG"],
    ["Measurement noise around a typical value", "Gaussian", "fillB"]
  ].forEach(function (r, i) {
    var y = 24 + i * 80;
    card(gChoose, 20, y, 330, 56, r[2]);
    txt(gChoose, 185, y + 34, "lbl", r[0], "middle");
    var a = arrow(gChoose, "w", 3); setLine(a, 356, y + 28, 424, y + 28);
    card(gChoose, 430, y, 190, 56, r[2]);
    txt(gChoose, 525, y + 35, "big", r[1], "middle");
  });

  var gML = el("g", {}, svg);
  [
    ["Classification label", "assumed Bernoulli", "fillB"],
    ["Linear regression noise", "assumed Gaussian", "fillA"],
    ["Random starting weights", "may be drawn Uniform", "fillG"]
  ].forEach(function (r, i) {
    var y = 56 + i * 92;
    card(gML, 40, y, 250, 64, r[2]);
    txt(gML, 165, y + 39, "big", r[0], "middle");
    var a = arrow(gML, "w", 3); setLine(a, 296, y + 32, 346, y + 32);
    card(gML, 352, y, 250, 64, r[2]);
    txt(gML, 477, y + 39, "lbl", r[1], "middle");
  });

  function render(index, id) {
    var i = index;
    show(gIdea, i === 0);
    show(gBern, i === 1);
    show(gBinom, i === 2);
    show(gUnif, i === 3);
    show(gGauss, i === 4);
    show(gCmp, i === 5);
    show(gChoose, i === 6);
    show(gML, i === 7);
  }
