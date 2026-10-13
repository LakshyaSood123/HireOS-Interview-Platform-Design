  var steps = [
    { id: "unknown-p", label: "An unknown p, many candidates", caption: "We still do not know the coin's p. A Bayesian keeps a belief about it: for each of nine candidate values, how plausible is it? Before looking at any data, we have to start somewhere." },
    { id: "prior", label: "The prior: belief before data", caption: "We suspect the coin is probably close to fair. The prior puts the most weight on 0.5 and less on extreme values: 1, 2, 3, 4, 5, 4, 3, 2, 1 out of 25. This is what we believe before seeing any flips." },
    { id: "observe-data", label: "Observe the data", caption: "Now we flip the coin 5 times and see H H T H H: 4 heads and 1 tail. This is the evidence." },
    { id: "likelihood", label: "The likelihood: what the data say", caption: "For each candidate p, the likelihood is p⁴ (1 − p): how well that p explains the flips. Ignoring our prior, the data point to values near 0.8." },
    { id: "combine", label: "Combine: prior × likelihood", caption: "Multiply the prior and the likelihood candidate by candidate. A candidate must be plausible in BOTH to stay tall. This is Bayes' rule for a parameter: posterior ∝ likelihood × prior." },
    { id: "posterior", label: "The posterior: updated belief", caption: "Rescale the products so they add up to 1 and we get the posterior, the updated belief. Its largest weights are 0.7 (0.24) and 0.6 (0.23)." },
    { id: "shift-belief", label: "How the belief shifted", caption: "The belief moved from the prior's peak at 0.5 toward the data's 0.8, and settled at 0.7. The data pulled it toward heads, while the prior kept it from jumping all the way." },
    { id: "ml-connection", label: "Why Bayesian thinking helps ML", caption: "Bayesian models keep a whole belief about their parameters instead of one number. That lets them use prior knowledge, and report how uncertain they remain." }
  ];

  var K = 4, N = 5;
  var prior = normalized(WEIGHTS);
  var like = THETAS.map(function (t) { return lik(t, K, N); });
  var prod = prior.map(function (p, i) { return p * like[i]; });
  var post = normalized(prod);
  var X0 = 150, DX = 48, H = 72;
  var rowY = [118, 218, 318];

  function rowLabel(parent, y, title, color) {
    var t = txt(parent, 12, y - 30, "lbl", title, "start");
    t.setAttribute("fill", color);
  }
  var axisG = el("g", {}, svg);
  THETAS.forEach(function (t, i) { txt(axisG, X0 + i * DX, 342, "tick", String(t), "middle"); });
  txt(axisG, X0 + 4 * DX, 356, "note", "candidate value of p", "middle");

  var ghostG = el("g", {}, svg);
  THETAS.forEach(function (t, i) {
    box(ghostG, X0 + i * DX - 15, 218 - 36, 30, 36, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 3);
    txt(ghostG, X0 + i * DX, 218 - 12, "big", "?", "middle");
  });
  txt(ghostG, 320, 150, "lbl lbl-y", "which value of p is the coin's? nine candidates", "middle");

  var priorG = el("g", {}, svg);
  rowLabel(priorG, rowY[0], "PRIOR  (before data)", "#38bdf8");
  var priorRow = barRow(priorG, X0, DX, rowY[0], 30, H, "rgba(56,189,248,0.85)");
  var priorTxt = txt(priorG, 598, rowY[0] - 36, "lbl lbl-b", "peak: 0.5", "middle");

  var likeG = el("g", {}, svg);
  rowLabel(likeG, rowY[1], "LIKELIHOOD  (what the data say)", "#1db584");
  var likeRow = barRow(likeG, X0, DX, rowY[1], 30, H, "rgba(29,181,132,0.85)");
  var likeTxt = txt(likeG, 598, rowY[1] - 36, "lbl lbl-g", "peak: 0.8", "middle");

  var postG = el("g", {}, svg);
  var postTitle = txt(postG, 12, rowY[2] - 30, "lbl", "", "start");
  postTitle.setAttribute("fill", "#f472b6");
  var postRow = barRow(postG, X0, DX, rowY[2], 30, H, "rgba(244,114,182,0.9)");
  var postTxt = txt(postG, 598, rowY[2] - 36, "lbl lbl-p", "", "middle");
  var postVals = THETAS.map(function (t, i) { return txt(postG, X0 + i * DX, rowY[2] - 4, "lbl", "", "middle"); });

  var opsG = el("g", {}, svg);
  txt(opsG, 600, 168, "big", "×", "middle").setAttribute("font-size", "26");
  txt(opsG, 600, 268, "big", "=", "middle").setAttribute("font-size", "26");

  var ghostPrior = el("g", {}, svg);
  var gp = barRow(ghostPrior, X0, DX, rowY[2], 30, H, "none", "#38bdf8");
  gp.set(prior, Math.max.apply(null, prior));
  gp.bars.forEach(function (b) { b.setAttribute("stroke-dasharray", "4 3"); b.setAttribute("fill", "none"); });
  var shiftArrow = arrow(svg, "w", 4);
  setLine(shiftArrow, X0 + 4 * DX + 6, rowY[2] + 10, X0 + 6 * DX - 8, rowY[2] + 10);
  var shiftLbl = txt(svg, 598, rowY[2] - 20, "lbl lbl-y", "prior was 0.5", "middle");

  var coinsG = el("g", {}, svg);
  var FLIPS_ROW = ["H", "H", "T", "H", "H"];
  FLIPS_ROW.forEach(function (c, i) { coin(coinsG, 450 + i * 34, 28, 13, c); });
  txt(coinsG, 395, 33, "lbl lbl-y", "data:", "end");

  var mlG = el("g", {}, svg);
  [["One number", "MLE or MAP: a single best guess", "fillA"], ["A whole belief", "Bayesian: plausibility of every candidate", "fillB"]].forEach(function (b, i) {
    var x = 40 + i * 290;
    card(mlG, x, 90, 260, 130, b[2]);
    txt(mlG, x + 130, 128, "big", b[0], "middle");
    var w = b[1].split(": ");
    txt(mlG, x + 130, 160, "lbl", w[0] + ":", "middle");
    txt(mlG, x + 130, 182, "note", w[1], "middle");
  });
  txt(mlG, 320, 262, "lbl lbl-y", "keep prior knowledge and honest uncertainty about parameters", "middle");

  function render(index, id) {
    var i = index;
    show(axisG, i <= 6);
    show(ghostG, i === 0);
    show(priorG, i >= 1 && i <= 6);
    show(likeG, i >= 3 && i <= 6);
    show(postG, i >= 4 && i <= 6);
    show(opsG, i === 4);
    show(coinsG, i >= 2 && i <= 6);
    show(ghostPrior, i === 6);
    show(shiftArrow, false); show(shiftLbl, i === 6);
    show(mlG, i === 7);
    show(priorTxt, i === 1 || i === 6 || i === 5);
    show(likeTxt, i === 3 || i === 6 || i === 5);
    show(postTxt, i >= 4 && i <= 6);
    priorRow.set(prior, Math.max.apply(null, prior));
    likeRow.set(like, Math.max.apply(null, like));
    postVals.forEach(function (n, k) { n.textContent = ""; });
    if (i === 4) {
      postTitle.textContent = "PRIOR × LIKELIHOOD  (before rescaling)";
      postRow.set(prod, Math.max.apply(null, prod));
      postTxt.textContent = "";
      anim("grow", 1200, function (e) { postRow.set(prod.map(function (v) { return v * e; }), Math.max.apply(null, prod)); });
    }
    if (i >= 5 && i <= 6) {
      postTitle.textContent = "POSTERIOR  (updated)";
      postRow.set(post, Math.max.apply(null, post));
      postTxt.textContent = "peak: 0.7";
      postVals.forEach(function (n, k) { n.textContent = fmt(post[k], 2); n.setAttribute("y", rowY[2] - (post[k] / Math.max.apply(null, post)) * H - 6); });
    }
    if (i === 1) anim("prior", 900, function (e) { priorRow.set(prior.map(function (v) { return v * e; }), Math.max.apply(null, prior)); });
    if (i === 3) anim("like", 900, function (e) { likeRow.set(like.map(function (v) { return v * e; }), Math.max.apply(null, like)); });
  }
