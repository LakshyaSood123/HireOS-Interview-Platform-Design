  var steps = [
    { id: "experiment", label: "A random experiment", caption: "Toss a fair coin twice. Before the tosses, the result is uncertain. We will turn the result into a number we can compute with." },
    { id: "outcomes", label: "The four outcomes", caption: "The possible outcomes are HH, HT, TH and TT, each with probability 1/4. These are descriptions, not numbers: we cannot average them or put them in a formula." },
    { id: "define-variable", label: "Define a random variable", caption: "Choose a rule: X = the number of heads. A random variable is exactly this, a rule that gives a number to every outcome. The rule is fixed; only which outcome occurs is random." },
    { id: "map-outcomes", label: "Map each outcome to a number", caption: "Apply the rule: HH has 2 heads, HT has 1, TH has 1, TT has 0. Two different outcomes (HT and TH) can map to the same value." },
    { id: "possible-values", label: "The possible values", caption: "X can take the values 0, 1 or 2. These numbers, not the coin pictures, are what a formula can work with." },
    { id: "probabilities", label: "Probabilities of the values", caption: "Add up the outcomes that map to each value: P(X = 0) = 1/4, P(X = 1) = 1/4 + 1/4 = 1/2, P(X = 2) = 1/4. Values with their probabilities are the distribution of X." },
    { id: "ml-connection", label: "Random variables in ML", caption: "Features, labels and noise are random variables: a rule from 'what happened' to a number. Once they are numbers we can talk about averages, spread and relationships." }
  ];

  var OUT = ["HH", "HT", "TH", "TT"];
  var VAL = [2, 1, 1, 0];
  var oy = function (i) { return 86 + i * 62; };
  var vy = function (v) { return 254 - v * 84; };
  var VX = 480;

  var coins = el("g", {}, svg);
  [250, 390].forEach(function (cx, i) {
    el("circle", { cx: cx, cy: 160, r: 52, fill: "rgba(226,180,74,0.2)", stroke: "#e2b44a", "stroke-width": 3 }, coins);
    txt(coins, cx, 172, "big", "?", "middle").setAttribute("font-size", "34");
    txt(coins, cx, 244, "note", "toss " + (i + 1), "middle");
  });
  txt(coins, 320, 70, "lbl", "two tosses of a fair coin", "middle");

  var cardsG = el("g", {}, svg);
  var cards = [];
  OUT.forEach(function (name, i) {
    var g = el("g", {}, cardsG);
    box(g, 40, oy(i) - 24, 130, 48, "rgba(226,180,74,0.16)", "#e2b44a", 10);
    txt(g, 105, oy(i) + 7, "big", name.split("").join(" "), "middle").setAttribute("font-size", "20");
    cards.push(g);
  });
  txt(cardsG, 105, 44, "lbl", "outcomes", "middle");

  var rule = el("g", {}, svg);
  box(rule, 215, 26, 210, 40, "rgba(29,181,132,0.2)", "#1db584", 10);
  txt(rule, 320, 51, "lbl lbl-g", "X = number of heads", "middle");

  var arrows = [];
  var mapG = el("g", {}, svg);
  OUT.forEach(function (name, i) {
    var a = arrow(mapG, "g", 3);
    setLine(a, 176, oy(i), VX - 34, vy(VAL[i]));
    arrows.push(a);
  });

  var valsG = el("g", {}, svg);
  txt(valsG, VX, 44, "lbl", "values of X", "middle");
  [0, 1, 2].forEach(function (v) {
    el("circle", { cx: VX, cy: vy(v), r: 26, fill: "rgba(56,189,248,0.2)", stroke: "#38bdf8", "stroke-width": 3 }, valsG);
    txt(valsG, VX, vy(v) + 8, "big", String(v), "middle").setAttribute("font-size", "22");
  });
  var bracket = el("path", { d: "M 534 " + (vy(2) - 28) + " L 546 " + (vy(2) - 28) + " L 546 " + (vy(0) + 28) + " L 534 " + (vy(0) + 28), fill: "none", stroke: "#e2b44a", "stroke-width": 2.5 }, svg);
  var bracketLbl = txt(svg, 556, vy(1) + 4, "lbl lbl-y", "0, 1 or 2", "start");

  var probG = el("g", {}, svg);
  var PR = [0.25, 0.5, 0.25];
  var PL = ["1/4", "1/2", "1/4"];
  [2, 1, 0].forEach(function (v) {
    var p = PR[v];
    box(probG, 524, vy(v) - 14, p * 130, 28, "rgba(244,114,182,0.8)", "none", 4);
    txt(probG, 524 + p * 130 + 6, vy(v) + 5, "lbl", PL[v], "start");
  });
  var sumNote = txt(probG, 570, vy(1) + 34, "note", "HT + TH: 1/4 + 1/4", "middle");

  var mlG = el("g", {}, svg);
  [["label y", "spam = 1, not spam = 0", "fillB"], ["feature x", "a house's size", "fillA"], ["noise", "measurement error", "fillG"]].forEach(function (r, i) {
    var y = 84 + i * 76;
    card(mlG, 60, y, 190, 56, r[2]);
    txt(mlG, 155, y + 34, "big", r[0], "middle");
    var ar = arrow(mlG, "w", 3); setLine(ar, 254, y + 28, 304, y + 28);
    card(mlG, 308, y, 270, 56, r[2]);
    txt(mlG, 443, y + 34, "lbl", r[1], "middle");
  });
  txt(mlG, 320, 56, "lbl lbl-y", "each of these is a random variable: a number we can compute with", "middle");

  function render(index, id) {
    var i = index;
    show(coins, i === 0);
    show(cardsG, i >= 1 && i <= 5);
    show(rule, i >= 2 && i <= 5);
    show(mapG, i >= 3 && i <= 5);
    show(valsG, i >= 3 && i <= 5);
    show(bracket, i === 4); show(bracketLbl, i === 4);
    show(probG, i === 5);
    show(mlG, i === 6);
    if (i === 1) {
      anim("cards", 1100, function (e) {
        for (var q = 0; q < 4; q++) cards[q].setAttribute("opacity", Math.max(0, Math.min(1, e * 5 - q)).toFixed(2));
      });
    } else {
      cards.forEach(function (c) { c.setAttribute("opacity", "1"); });
    }
    if (i === 3) {
      anim("arrows", 1400, function (e) {
        for (var q = 0; q < 4; q++) arrows[q].setAttribute("opacity", Math.max(0, Math.min(1, e * 5 - q)).toFixed(2));
      });
    } else {
      arrows.forEach(function (a) { a.setAttribute("opacity", "1"); });
    }
  }
