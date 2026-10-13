  var steps = [
    { id: "experiment", label: "A random experiment", caption: "Roll a fair six-sided die. Before the roll, nobody can say which face will come up. An experiment whose result is uncertain is called a random experiment." },
    { id: "possible-outcomes", label: "The possible outcomes", caption: "Each possible result is an outcome. A die has six: 1, 2, 3, 4, 5 and 6. Exactly one of them happens on every roll." },
    { id: "sample-space", label: "The sample space", caption: "The set of all possible outcomes is the sample space: {1, 2, 3, 4, 5, 6}. Everything we will ask about lives inside it." },
    { id: "event", label: "An event is a group of outcomes", caption: "An event is any collection of outcomes we care about. 'The roll is even' is the event {2, 4, 6}. It happens whenever the roll lands on one of those faces." },
    { id: "assign-probability", label: "Give each outcome a probability", caption: "A fair die gives each face probability 1/6. The probability of an event is the sum over its outcomes: P(even) = 1/6 + 1/6 + 1/6 = 1/2." },
    { id: "valid-probabilities", label: "What makes probabilities valid", caption: "Every probability must be between 0 and 1, and all outcomes together must add to exactly 1. Six faces at 1/6 add to 1. Six faces at 0.2 would add to 1.2, which is not valid." },
    { id: "ml-connection", label: "The same rule inside a model", caption: "A classifier that outputs spam 0.9 and not spam 0.1 is assigning probabilities to its two possible outcomes. They must add to 1, or the output is not a coherent belief." }
  ];

  var FX = function (i) { return 40 + i * 96; };
  var faces = [], nums = [], bars = [], barLbls = [];
  var big = el("g", {}, svg);
  card(big, 245, 100, 150, 130, "fillA");
  txt(big, 320, 180, "big", "?", "middle").setAttribute("font-size", "48");
  txt(big, 320, 262, "note", "roll the die: which face?", "middle");

  var facesG = el("g", {}, svg);
  for (var i = 0; i < 6; i++) {
    faces.push(box(facesG, FX(i), 120, 80, 80, "rgba(56,189,248,0.16)", "#38bdf8", 12));
    nums.push(txt(facesG, FX(i) + 40, 172, "big", String(i + 1), "middle"));
    nums[i].setAttribute("font-size", "30");
  }
  var spaceBox = el("rect", { x: 28, y: 108, width: 584, height: 104, rx: 14, fill: "none", stroke: "#e2b44a", "stroke-width": 2.5, "stroke-dasharray": "7 5" }, svg);
  var spaceLbl = txt(svg, 320, 96, "lbl lbl-y", "sample space = {1, 2, 3, 4, 5, 6}", "middle");
  var evLbl = txt(svg, 320, 232, "lbl lbl-p", "event: the roll is even = {2, 4, 6}", "middle");
  var outLbl = txt(svg, 320, 96, "lbl", "six possible outcomes", "middle");

  var barsG = el("g", {}, svg);
  for (var j = 0; j < 6; j++) {
    bars.push(box(barsG, FX(j) + 20, 336 - 48, 40, 48, "rgba(56,189,248,0.5)", "#38bdf8", 4));
    barLbls.push(txt(barsG, FX(j) + 40, 336 - 54, "lbl", "1/6", "middle"));
  }
  el("line", { x1: 30, y1: 336, x2: 610, y2: 336, class: "axis" }, barsG);
  var sumLbl = txt(svg, 320, 258, "big", "P(even) = 1/6 + 1/6 + 1/6 = 1/2", "middle");

  // Validity bars.
  var validG = el("g", {}, svg);
  var W = 420, X0 = 90;
  txt(validG, X0, 122, "lbl lbl-g", "valid: six faces at 1/6", "start");
  for (var k = 0; k < 6; k++) box(validG, X0 + (W / 6) * k, 132, W / 6 - 2, 36, k % 2 ? "rgba(29,181,132,0.55)" : "rgba(29,181,132,0.8)", "none", 4);
  txt(validG, X0 + W + 14, 156, "big", "= 1", "start");
  el("line", { x1: X0 + W, y1: 124, x2: X0 + W, y2: 300, stroke: "#c9dccf", "stroke-width": 2, "stroke-dasharray": "5 4" }, validG);
  txt(validG, X0 + W, 316, "note", "total of 1", "middle");
  txt(validG, X0, 222, "lbl lbl-r", "not valid: six faces at 0.2", "start");
  for (var m = 0; m < 6; m++) box(validG, X0 + (W / 5) * m, 232, W / 5 - 2, 36, m % 2 ? "rgba(248,113,113,0.55)" : "rgba(248,113,113,0.8)", "none", 4);
  txt(validG, X0, 296, "big", "adds up to 1.2: too much", "start").setAttribute("fill", "#f87171");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 110, 150, 80, "fillB");
  txt(mlG, 115, 142, "note", "classifier output", "middle");
  txt(mlG, 115, 170, "lbl", "for one email", "middle");
  var a1 = arrow(mlG, "w", 3); setLine(a1, 194, 150, 250, 150);
  box(mlG, 260, 130, 0.9 * 330, 40, "rgba(244,114,182,0.8)", "none", 4);
  box(mlG, 260 + 0.9 * 330, 130, 0.1 * 330, 40, "rgba(56,189,248,0.8)", "none", 4);
  txt(mlG, 260 + 0.45 * 330, 156, "lbl", "spam 0.9", "middle");
  txt(mlG, 260 + 0.95 * 330, 198, "lbl lbl-b", "not spam 0.1", "middle");
  txt(mlG, 425, 244, "big", "0.9 + 0.1 = 1", "middle");
  txt(mlG, 425, 276, "note", "a valid probability assignment over two outcomes", "middle");

  function render(index, id) {
    var i = index;
    show(big, i === 0);
    show(facesG, i >= 1 && i <= 4);
    show(outLbl, i === 1);
    show(spaceBox, i >= 2 && i <= 4);
    show(spaceLbl, i >= 2 && i <= 4);
    show(evLbl, i === 3 || i === 4);
    show(barsG, i === 4);
    show(sumLbl, i === 4);
    show(validG, i === 5);
    show(mlG, i === 6);
    evLbl.setAttribute("y", 232);
    for (var f = 0; f < 6; f++) {
      var isEven = (f + 1) % 2 === 0;
      var hi = (i >= 3) && isEven;
      faces[f].setAttribute("fill", hi ? "rgba(244,114,182,0.4)" : "rgba(56,189,248,0.16)");
      faces[f].setAttribute("stroke", hi ? "#f472b6" : "#38bdf8");
      bars[f].setAttribute("fill", isEven ? "rgba(244,114,182,0.7)" : "rgba(56,189,248,0.35)");
      bars[f].setAttribute("stroke", isEven ? "#f472b6" : "#38bdf8");
      faces[f].setAttribute("opacity", "1");
      nums[f].setAttribute("opacity", "1");
    }
      if (i === 1) {
      anim("faces", 1100, function (e) {
        for (var q = 0; q < 6; q++) {
          var o = Math.max(0, Math.min(1, e * 7 - q)).toFixed(2);
          faces[q].setAttribute("opacity", o);
          nums[q].setAttribute("opacity", o);
        }
      });
    }
  }
