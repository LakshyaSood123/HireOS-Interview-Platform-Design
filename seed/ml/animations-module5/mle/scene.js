  var steps = [
    { id: "observed-data", label: "The observed data are fixed", caption: "We observed H H T H H. This data is now fixed. The question: which value of p would have made exactly this result the most likely?" },
    { id: "candidate-low", label: "Candidate p = 0.2", caption: "Score a candidate flip by flip. Each head contributes p, each tail 1 − p. For p = 0.2 the chips are 0.2, 0.2, 0.8, 0.2, 0.2 and their product, the likelihood, is only 0.0013." },
    { id: "candidate-middle", label: "Candidate p = 0.5", caption: "For p = 0.5 every flip contributes 0.5, so the likelihood is 0.5⁵ = 0.031. Much better than 0.0013." },
    { id: "candidate-high", label: "Candidate p = 0.8", caption: "For p = 0.8 the chips are 0.8, 0.8, 0.2, 0.8, 0.8 and the likelihood is 0.082, the best of the three. Under p = 0.8 the data we saw is 64 times more likely than under p = 0.2." },
    { id: "likelihood-curve", label: "The likelihood curve", caption: "Try every value of p from 0 to 1 and plot its likelihood: L(p) = p⁴ (1 − p). The three candidates are points on this curve, which rises, peaks, and falls." },
    { id: "maximum", label: "Find the maximum", caption: "The top of the curve is where the data are most likely. It sits at p = 0.8. The data stayed fixed; only the parameter was varied." },
    { id: "mle", label: "The maximum likelihood estimate", caption: "p_MLE = argmax L(p) = 0.8. 'Argmax' means: the value of p that gives the largest L. Here it equals 4/5, the observed fraction of heads." },
    { id: "ml-connection", label: "How models are fitted", caption: "Fitting a probabilistic model usually means maximum likelihood: choose the parameters that make the training data most likely. We usually maximize the log of the likelihood, which has the same peak." }
  ];

  var FL = ["H", "H", "T", "H", "H"];
  function L(p) { return Math.pow(p, 4) * (1 - p); }
  var CHIPX = function (i) { return 70 + i * 60; };

  var dataG = el("g", {}, svg);
  FL.forEach(function (c, i) { coin(dataG, CHIPX(i), 52, 22, c); });
  txt(dataG, CHIPX(2), 18, "lbl lbl-y", "observed data (fixed)", "middle");

  // Chips: the probability each flip gets under a candidate p.
  var chipG = el("g", {}, svg);
  var chipBoxes = [], chipTxt = [];
  FL.forEach(function (c, i) {
    chipBoxes.push(box(chipG, CHIPX(i) - 24, 92, 48, 28, "rgba(29,181,132,0.3)", "#1db584", 6));
    chipTxt.push(txt(chipG, CHIPX(i), 112, "mono", "", "middle"));
    var a = arrow(chipG, "w", 2); setLine(a, CHIPX(i), 76, CHIPX(i), 90);
  });
  var prodTxt = txt(chipG, CHIPX(2), 150, "mono", "", "middle");
  var prodLbl = txt(chipG, CHIPX(2), 172, "note", "each head contributes p, each tail 1 − p; multiply", "middle");

  // Scoreboard of likelihoods for the three candidates.
  var boardG = el("g", {}, svg);
  var CAND = [0.2, 0.5, 0.8];
  var boardRows = CAND.map(function (p, i) {
    var y = 198 + i * 44;
    var g = el("g", {}, boardG);
    txt(g, 24, y + 22, "lbl", "p = " + p, "start");
    box(g, 90, y, 480, 30, "rgba(255,255,255,0.06)", "rgba(255,255,255,0.18)", 5);
    var bar = box(g, 90, y, L(p) / 0.09 * 480, 30, i === 2 ? "rgba(29,181,132,0.9)" : "rgba(56,189,248,0.8)", "none", 5);
    txt(g, 90 + L(p) / 0.09 * 480 + 8, y + 21, "mono", "L = " + fmt(L(p), p === 0.2 ? 4 : 3), "start");
    return g;
  });

  // Likelihood curve.
  var g = makeGraph(70, 316, 500, 2200);
  var plotG = el("g", {}, svg);
  drawAxes(plotG, g, 1.04, 0.1, [0, 0.2, 0.4, 0.6, 0.8, 1], []);
  txt(plotG, g.x(1.04), g.y(0) + 30, "note", "candidate value of p", "end");
  txt(plotG, g.x(0) + 8, g.y(0.1) + 4, "note", "likelihood L(p)", "start");
  el("path", { class: "curve", d: curveD(g, L, 0, 1, 80) }, plotG);
  CAND.forEach(function (p, i) {
    el("circle", { cx: g.x(p), cy: g.y(L(p)), r: 7, fill: i === 2 ? "#1db584" : "#e2b44a", stroke: "#071510", "stroke-width": 2 }, plotG);
    txt(plotG, g.x(p), g.y(L(p)) - 24, "lbl", "p = " + p, "middle");
  });
  var peakG = el("g", {}, svg);
  el("line", { x1: g.x(0.8), y1: g.y(L(0.8)), x2: g.x(0.8), y2: g.y(0), stroke: "#1db584", "stroke-width": 3, "stroke-dasharray": "6 4" }, peakG);
  el("circle", { cx: g.x(0.8), cy: g.y(L(0.8)), r: 10, fill: "none", stroke: "#1db584", "stroke-width": 4 }, peakG);
  txt(peakG, g.x(0.8) - 16, g.y(L(0.8)) - 4, "lbl lbl-g", "highest likelihood", "end");
  txt(peakG, g.x(0.8), g.y(0) + 16, "lbl lbl-g", "0.8", "middle");

  var mleG = el("g", {}, svg);
  card(mleG, 150, 180, 340, 120, "fillG");
  txt(mleG, 320, 214, "mono", "p_MLE = argmax  L(p)", "middle");
  txt(mleG, 320, 252, "big", "= 0.8 = 4 / 5", "middle").setAttribute("font-size", "24");
  txt(mleG, 320, 282, "note", "the p that makes the observed data most likely", "middle");

  var mlG = el("g", {}, svg);
  [["training data", "fixed", "fillA"], ["model parameters", "varied until the data are most likely", "fillG"], ["fitted model", "maximum likelihood", "fillB"]].forEach(function (b, i) {
    var x = 20 + i * 210;
    card(mlG, x, 150, 190, 90, b[2]);
    txt(mlG, x + 95, 184, "big", b[0], "middle").setAttribute("font-size", "14");
    var words = b[1].split(" ");
    var half = Math.ceil(words.length / 2);
    txt(mlG, x + 95, 208, "note", words.slice(0, half).join(" "), "middle");
    if (words.length > half) txt(mlG, x + 95, 224, "note", words.slice(half).join(" "), "middle");
    if (i < 2) { var a = arrow(mlG, "w", 3); setLine(a, x + 194, 195, x + 206, 195); }
  });
  txt(mlG, 320, 290, "lbl lbl-y", "e.g. logistic regression is fitted by maximum likelihood", "middle");

  function setChips(p) {
    FL.forEach(function (c, i) {
      var v = c === "H" ? p : 1 - p;
      chipTxt[i].textContent = fmt(v, 1);
    });
    var parts = FL.map(function (c) { return fmt(c === "H" ? p : 1 - p, 1); });
    prodTxt.textContent = parts.join(" × ") + " = " + fmt(L(p), p === 0.2 ? 4 : 3);
  }

  function render(index, id) {
    var i = index;
    show(dataG, true);
    show(chipG, i >= 1 && i <= 3);
    show(boardG, i >= 1 && i <= 3);
    boardRows.forEach(function (r, k) { show(r, i >= 1 + k && i <= 3); });
    show(plotG, i >= 4 && i <= 5);
    show(peakG, i === 5);
    show(mleG, i === 6);
    show(mlG, i === 7);
    if (i >= 1 && i <= 3) setChips(CAND[i - 1]);
    place(dataG, 0, i >= 4 && i <= 6 ? -4 : 0);
    if (i === 4) anim("plot", 1500, function (e) { plotG.setAttribute("opacity", String(Math.min(1, e * 2))); });
  }
