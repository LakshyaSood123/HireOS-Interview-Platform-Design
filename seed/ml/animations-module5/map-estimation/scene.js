  var steps = [
    { id: "likelihood", label: "Start from the likelihood", caption: "Same coin, same data H H T H H. For each of nine candidate values of p, the likelihood p⁴ (1 − p) says how well that p explains the flips." },
    { id: "mle-peak", label: "The MLE: the likelihood's peak", caption: "The likelihood is highest at 0.8, so the maximum likelihood estimate is 0.8. This uses the data only." },
    { id: "prior", label: "Add the prior", caption: "Before the data, we believed the coin was probably close to fair: the prior peaks at 0.5. MAP estimation lets this belief count too." },
    { id: "combine", label: "Combine: likelihood × prior", caption: "Multiply likelihood and prior candidate by candidate. The score of a candidate is high only if the data like it AND the prior does not object." },
    { id: "posterior", label: "The posterior", caption: "After rescaling to add up to 1, the scores are the posterior probabilities. Dropping the rescaling would not change where the peak is, which is why MAP can skip the normalizer." },
    { id: "map-peak", label: "The MAP: the posterior's peak", caption: "The posterior is highest at 0.7. The MAP estimate is θ_MAP = argmax of P(data | θ) × P(θ) = 0.7." },
    { id: "compare", label: "MLE vs MAP on the same data", caption: "MLE = 0.8 and MAP = 0.7. With only 5 flips, the prior pulled the best estimate from 0.8 toward 0.5. With a flat prior, nothing would be pulled and the two would be equal." },
    { id: "ml-connection", label: "Why ML cares", caption: "Many training methods maximize data fit plus a preference about parameters. MAP is the probabilistic version of that idea; we meet its relatives, such as regularization, later." }
  ];

  var prior = normalized(WEIGHTS);
  var like = THETAS.map(function (t) { return lik(t, 4, 5); });
  var prod = prior.map(function (p, i) { return p * like[i]; });
  var post = normalized(prod);
  var X0 = 150, DX = 48, H = 72;
  var rowY = [118, 218, 318];
  var MAXL = Math.max.apply(null, like), MAXP = Math.max.apply(null, prior), MAXPR = Math.max.apply(null, prod), MAXPO = Math.max.apply(null, post);
  var iMLE = argmaxIndex(like), iMAP = argmaxIndex(post);

  var axisG = el("g", {}, svg);
  THETAS.forEach(function (t, i) { txt(axisG, X0 + i * DX, 342, "tick", String(t), "middle"); });
  txt(axisG, X0 + 4 * DX, 356, "note", "candidate value of p", "middle");

  function label(parent, y, title, color) {
    var t = txt(parent, 12, y - 30, "lbl", title, "start");
    t.setAttribute("fill", color);
    return t;
  }
  var likeG = el("g", {}, svg);
  label(likeG, rowY[0], "LIKELIHOOD  (data only)", "#1db584");
  var likeRow = barRow(likeG, X0, DX, rowY[0], 30, H, "rgba(29,181,132,0.85)");
  var priorG = el("g", {}, svg);
  label(priorG, rowY[1], "PRIOR  (belief before data)", "#38bdf8");
  var priorRow = barRow(priorG, X0, DX, rowY[1], 30, H, "rgba(56,189,248,0.85)");
  var postG = el("g", {}, svg);
  var postTitle = label(postG, rowY[2], "", "#f472b6");
  var postRow = barRow(postG, X0, DX, rowY[2], 30, H, "rgba(244,114,182,0.9)");
  var postVals = THETAS.map(function (t, i) { return txt(postG, X0 + i * DX, rowY[2] - 4, "lbl", "", "middle"); });
  var opsG = el("g", {}, svg);
  txt(opsG, 600, 168, "big", "×", "middle").setAttribute("font-size", "26");
  txt(opsG, 600, 268, "big", "=", "middle").setAttribute("font-size", "26");

  var mleMark = el("g", {}, svg);
  el("rect", { x: X0 + iMLE * DX - 20, y: rowY[0] - H - 8, width: 40, height: H + 12, rx: 6, fill: "none", stroke: "#ffffff", "stroke-width": 3 }, mleMark);
  txt(mleMark, X0 + iMLE * DX, rowY[0] - H - 14, "lbl lbl-g", "MLE = 0.8", "middle");
  var mapMark = el("g", {}, svg);
  el("rect", { x: X0 + iMAP * DX - 20, y: rowY[2] - H - 26, width: 40, height: H + 30, rx: 6, fill: "none", stroke: "#ffffff", "stroke-width": 3 }, mapMark);
  txt(mapMark, 598, rowY[2] - 40, "lbl lbl-p", "MAP = 0.7", "middle");
  var priorPeak = txt(priorG, X0 + 4 * DX, rowY[1] - H - 8, "lbl lbl-b", "prior peak 0.5", "middle");

  var guideG = el("g", {}, svg);
  el("line", { x1: X0 + iMLE * DX, y1: 36, x2: X0 + iMLE * DX, y2: 336, stroke: "#1db584", "stroke-width": 2.5, "stroke-dasharray": "7 5" }, guideG);
  el("line", { x1: X0 + iMAP * DX, y1: 36, x2: X0 + iMAP * DX, y2: 336, stroke: "#f472b6", "stroke-width": 2.5, "stroke-dasharray": "7 5" }, guideG);
  var pull = arrow(guideG, "y", 4); setLine(pull, X0 + iMLE * DX - 6, 196, X0 + iMAP * DX + 8, 196);
  txt(guideG, 586, 188, "lbl lbl-y", "pulled by the prior", "middle");

  var mlG = el("g", {}, svg);
  card(mlG, 60, 70, 520, 56, "fillG");
  txt(mlG, 320, 104, "lbl", "score = how well the data fit  ×  how plausible the prior finds it", "middle");
  card(mlG, 60, 150, 250, 100, "fillA");
  txt(mlG, 185, 184, "big", "MLE", "middle");
  txt(mlG, 185, 210, "note", "data fit only", "middle");
  card(mlG, 330, 150, 250, 100, "fillB");
  txt(mlG, 455, 184, "big", "MAP", "middle");
  txt(mlG, 455, 210, "note", "data fit + a preference", "middle");
  txt(mlG, 320, 290, "lbl lbl-y", "a probabilistic cousin of regularized training", "middle");

  function render(index, id) {
    var i = index;
    show(axisG, i <= 6);
    show(likeG, i <= 6);
    show(priorG, i >= 2 && i <= 6);
    show(postG, i >= 3 && i <= 6);
    show(opsG, i === 3);
    show(mleMark, i === 1 || i === 6);
    show(mapMark, i === 5 || i === 6);
    show(priorPeak, i === 2);
    show(guideG, i === 6);
    show(mlG, i === 7);
    likeRow.set(like, MAXL);
    priorRow.set(prior, MAXP);
    postVals.forEach(function (n) { n.textContent = ""; });
    if (i === 3) {
      postTitle.textContent = "LIKELIHOOD × PRIOR  (before rescaling)";
      postRow.set(prod, MAXPR);
      anim("grow", 1200, function (e) { postRow.set(prod.map(function (v) { return v * e; }), MAXPR); });
    }
    if (i >= 4 && i <= 6) {
      postTitle.textContent = "POSTERIOR  (adds up to 1)";
      postRow.set(post, MAXPO);
      postVals.forEach(function (n, k) { n.textContent = fmt(post[k], 2); n.setAttribute("y", rowY[2] - (post[k] / MAXPO) * H - 6); });
    }
    if (i === 0) anim("like", 900, function (e) { likeRow.set(like.map(function (v) { return v * e; }), MAXL); });
    if (i === 2) anim("prior", 900, function (e) { priorRow.set(prior.map(function (v) { return v * e; }), MAXP); });
  }
