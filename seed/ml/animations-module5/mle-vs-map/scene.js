  var steps = [
    { id: "small-dataset", label: "A small dataset", caption: "Start with just 5 flips of the coin: H H T H H, 4 heads. With so little data, how much should we trust it?" },
    { id: "mle", label: "MLE: listen to the data only", caption: "The likelihood (green) is highest at 0.8, so MLE = 0.8. MLE uses only the data: it knows nothing about what we believed beforehand." },
    { id: "prior", label: "Our prior belief", caption: "Before the flips, we believed the coin was probably close to fair: the prior (blue) peaks at 0.5." },
    { id: "map", label: "MAP: data plus prior", caption: "Multiplying the likelihood by the prior and rescaling gives the posterior (pink), which peaks at 0.7. So MAP = 0.7." },
    { id: "compare-small-data", label: "Small data: they disagree", caption: "With only 5 flips MLE = 0.8 and MAP = 0.7. The prior still has a say, which keeps the estimate more cautious. Neither is simply 'better': they answer slightly different questions." },
    { id: "more-data", label: "Now collect more data", caption: "Keep the same share of heads but gather 10, 20 and then 50 flips. The likelihood gets sharper and sharper while the prior stays the same." },
    { id: "estimates-converge", label: "With enough data they agree", caption: "By 20 flips MAP has moved onto 0.8, the MLE, and it stays there. With plenty of informative data the likelihood outweighs the prior, so the two estimates converge." },
    { id: "ml-connection", label: "Why ML cares", caption: "Little data: a prior (a gentle brake on extreme parameters) matters. Lots of data: the data dominate. In several models MAP estimation looks like regularized training." }
  ];

  var NLIST = [5, 10, 20, 50];
  var prior = normalized(WEIGHTS);
  var STATE = NLIST.map(function (n) {
    var k = Math.round(0.8 * n);
    var like = THETAS.map(function (t) { return lik(t, k, n); });
    var post = normalized(like.map(function (l, i) { return l * prior[i]; }));
    return { n: n, k: k, like: like, post: post, iMLE: argmaxIndex(like), iMAP: argmaxIndex(post) };
  });
  var X0 = 150, DX = 48, H = 80;
  var yTop = 150, yBot = 290;

  var axisG = el("g", {}, svg);
  THETAS.forEach(function (t, i) { txt(axisG, X0 + i * DX, 312, "tick", String(t), "middle"); });
  txt(axisG, X0 + 4 * DX, 330, "note", "candidate value of p", "middle");

  var dataG = el("g", {}, svg);
  var coinsG = el("g", {}, dataG);
  ["H", "H", "T", "H", "H"].forEach(function (c, i) { coin(coinsG, 220 + i * 50, 50, 19, c); });
  var dataLbl = txt(dataG, 500, 56, "lbl lbl-y", "", "start");

  var bigCoins = el("g", {}, svg);
  ["H", "H", "T", "H", "H"].forEach(function (c, i) { coin(bigCoins, 160 + i * 80, 150, 32, c); });
  txt(bigCoins, 320, 232, "lbl lbl-y", "5 flips: 4 heads, 1 tail", "middle");
  txt(bigCoins, 320, 258, "note", "very little data", "middle");

  var likeG = el("g", {}, svg);
  var likeTitle = txt(likeG, 12, yTop - 56, "lbl lbl-g", "LIKELIHOOD  (data only)", "start");
  var likeRow = barRow(likeG, X0, DX, yTop, 30, H, "rgba(29,181,132,0.85)");
  var priorG = el("g", {}, svg);
  txt(priorG, 12, yBot - 56, "lbl lbl-b", "PRIOR  (belief before data)", "start");
  var priorRow = barRow(priorG, X0, DX, yBot, 30, H, "rgba(56,189,248,0.85)");
  var postG = el("g", {}, svg);
  txt(postG, 12, yBot - 56, "lbl lbl-p", "POSTERIOR  (data + prior)", "start");
  var postRow = barRow(postG, X0, DX, yBot, 30, H, "rgba(244,114,182,0.9)");

  function pin(parent, color, label) {
    var g = el("g", {}, parent);
    el("polygon", { points: "-10,-18 10,-18 0,0", fill: color, stroke: "#071510", "stroke-width": 2 }, g);
    var t = txt(g, 0, -26, "lbl", label, "middle");
    t.setAttribute("fill", color);
    return { g: g, t: t };
  }
  var mlePin = pin(svg, "#1db584", "MLE 0.8");
  var mapPin = pin(svg, "#f472b6", "MAP 0.7");
  var linkG = el("g", {}, svg);
  var linkLine = el("line", { stroke: "#e2b44a", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, linkG);
  var linkLbl = txt(linkG, 0, 0, "lbl lbl-y", "prior pulled it", "middle");

  var tableG = el("g", {}, svg);
  card(tableG, 130, 40, 380, 270, "fillG");
  txt(tableG, 190, 76, "lbl", "flips n", "middle");
  txt(tableG, 300, 76, "lbl lbl-g", "MLE", "middle");
  txt(tableG, 410, 76, "lbl lbl-p", "MAP", "middle");
  STATE.forEach(function (s, i) {
    var y = 114 + i * 46;
    txt(tableG, 190, y, "big", String(s.n), "middle");
    txt(tableG, 300, y, "big", String(THETAS[s.iMLE]), "middle");
    var same = s.iMAP === s.iMLE;
    var m = txt(tableG, 410, y, "big", String(THETAS[s.iMAP]), "middle");
    if (same) { m.setAttribute("fill", "#1db584"); txt(tableG, 470, y, "lbl lbl-g", "= MLE", "middle"); }
    else { m.setAttribute("fill", "#f472b6"); txt(tableG, 474, y, "note", "differs", "middle"); }
  });
  txt(tableG, 320, 296, "note", "same share of heads each time (80%); nine-candidate grid", "middle");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 70, 270, 150, "fillA");
  txt(mlG, 175, 104, "lbl lbl-b", "LITTLE DATA", "middle");
  txt(mlG, 175, 136, "big", "the prior matters", "middle");
  txt(mlG, 175, 166, "note", "a gentle brake on extreme estimates", "middle");
  card(mlG, 330, 70, 270, 150, "fillB");
  txt(mlG, 465, 104, "lbl lbl-p", "LOTS OF DATA", "middle");
  txt(mlG, 465, 136, "big", "the data dominate", "middle");
  txt(mlG, 465, 166, "note", "MAP ≈ MLE", "middle");
  txt(mlG, 320, 270, "lbl lbl-y", "MAP often looks like regularized training", "middle");

  function setState(idx) {
    var s = STATE[idx];
    likeRow.set(s.like, Math.max.apply(null, s.like));
    postRow.set(s.post, Math.max.apply(null, s.post));
    place(mlePin.g, X0 + s.iMLE * DX, yTop - H - 6);
    place(mapPin.g, X0 + s.iMAP * DX, yBot - H - 6);
    mlePin.t.textContent = "MLE " + THETAS[s.iMLE];
    mapPin.t.textContent = "MAP " + THETAS[s.iMAP];
    linkLine.setAttribute("opacity", s.iMLE === s.iMAP ? "0" : "1");
    setLine(linkLine, X0 + s.iMLE * DX, yTop + 16, X0 + s.iMAP * DX, yBot - H - 52);
    linkLbl.setAttribute("x", X0 + 4.2 * DX); linkLbl.setAttribute("y", (yTop + yBot - H) / 2 + 8);
    linkLbl.textContent = s.iMLE === s.iMAP ? "" : "prior pulled it";
    dataLbl.textContent = "n = " + s.n + " flips: " + s.k + " heads";
  }

  function render(index, id) {
    var i = index;
    show(axisG, i >= 1 && i <= 5);
    show(bigCoins, i === 0);
    show(dataG, i >= 1 && i <= 5);
    show(coinsG, i >= 1 && i <= 4);
    show(likeG, i >= 1 && i <= 5);
    show(priorG, i === 2);
    show(postG, i >= 3 && i <= 5);
    show(mlePin.g, i >= 1 && i <= 5);
    show(mapPin.g, i >= 3 && i <= 5);
    show(linkG, i === 4 || (i === 5));
    show(tableG, i === 6);
    show(mlG, i === 7);
    if (i >= 1 && i <= 4) {
      setState(0);
      priorRow.set(prior, Math.max.apply(null, prior));
    }
    if (i === 5) {
      anim("n", 3600, function (e) {
        var idx = Math.min(3, Math.floor(e * 4));
        setState(idx);
      });
    }
    if (i === 1) { likeTitle.textContent = "LIKELIHOOD  (data only)"; }
  }
