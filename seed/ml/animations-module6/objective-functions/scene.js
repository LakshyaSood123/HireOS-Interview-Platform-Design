  var steps = [
    { id: "model-parameter", label: "A model has a parameter", caption: "A model has a knob we can turn: a parameter w. Different settings of w make the model behave differently. Training means choosing a good setting." },
    { id: "objective-rule", label: "The objective scores a setting", caption: "An objective function is a rule that takes a setting of the knob and returns one number: how good or bad that setting is. Ours is L(w) = (w − 3)². Lower is better, so we want to minimize it." },
    { id: "candidate-one", label: "Try w = 0", caption: "Candidate w = 0: L(0) = (0 − 3)² = 9. That is a high (bad) score." },
    { id: "candidate-two", label: "Try w = 2", caption: "Candidate w = 2: L(2) = (2 − 3)² = 1. Much better than 9." },
    { id: "candidate-three", label: "Try w = 3 and w = 5", caption: "Candidate w = 3: L(3) = 0, the lowest possible score. Candidate w = 5: L(5) = 4, worse again. The score falls and then rises." },
    { id: "plot-objective", label: "Plot the objective", caption: "Plot the score for every w, not just four. The objective is a bowl. The four candidates are points on it." },
    { id: "find-minimum", label: "Find the minimum", caption: "The bottom of the bowl is at w = 3, where the score is 0. The best parameter is the minimizer; its score is the minimum value. Training must find it without being shown the whole bowl." },
    { id: "ml-training", label: "Training searches parameter space", caption: "Training a model is this search: try parameters, score them with the objective, and move toward parameters with a better score. The next lessons say what goes into the objective and how the search moves." }
  ];

  function Lw(w) { return (w - 3) * (w - 3); }
  var TX = function (w) { return 60 + w * 83; };

  var trackG = el("g", {}, svg);
  el("line", { x1: TX(0), y1: 52, x2: TX(6), y2: 52, stroke: "#c9dccf", "stroke-width": 3, "stroke-linecap": "round" }, trackG);
  for (var t = 0; t <= 6; t++) {
    el("line", { x1: TX(t), y1: 46, x2: TX(t), y2: 58, stroke: "#c9dccf", "stroke-width": 2 }, trackG);
    txt(trackG, TX(t), 76, "tick", String(t), "middle");
  }
  txt(trackG, 320, 16, "lbl lbl-y", "model parameter w (the knob)", "middle");
  var knob = el("circle", { r: 11, cy: 52, fill: "#e2b44a", stroke: "#071510", "stroke-width": 3 }, svg);
  var knobLbl = txt(svg, 0, 34, "lbl lbl-y", "", "middle");

  // Flow: input -> objective -> score.
  var flowG = el("g", {}, svg);
  card(flowG, 60, 104, 120, 66, "fillA");
  txt(flowG, 120, 128, "note", "input", "middle");
  var inTxt = txt(flowG, 120, 154, "big", "w = 0", "middle");
  var a1 = arrow(flowG, "w", 3); setLine(a1, 184, 137, 226, 137);
  card(flowG, 230, 98, 200, 78, "fillG");
  txt(flowG, 330, 122, "note", "objective (the rule)", "middle");
  txt(flowG, 330, 154, "big", "L(w) = (w − 3)²", "middle");
  var a2 = arrow(flowG, "w", 3); setLine(a2, 434, 137, 476, 137);
  card(flowG, 480, 104, 120, 66, "fillB");
  txt(flowG, 540, 128, "note", "score", "middle");
  var outTxt = txt(flowG, 540, 154, "big", "9", "middle");
  var calcTxt = txt(flowG, 330, 198, "mono", "", "middle");

  // Scoreboard.
  var boardG = el("g", {}, svg);
  var CANDS = [0, 2, 3, 5];
  var rows = CANDS.map(function (w, i) {
    var y = 222 + i * 30;
    var g = el("g", {}, boardG);
    txt(g, 70, y + 17, "lbl", "w = " + w, "start");
    box(g, 140, y, 400, 22, "rgba(255,255,255,0.06)", "rgba(255,255,255,0.18)", 4);
    box(g, 140, y, Math.max(2, (Lw(w) / 9) * 400), 22, w === 3 ? "rgba(29,181,132,0.9)" : "rgba(244,114,182,0.8)", "none", 4);
    txt(g, 546, y + 17, "mono", "score " + Lw(w), "start");
    return g;
  });

  // Plot of the whole objective.
  var g = makeGraph(60, 322, 85, 22);
  var plotG = el("g", {}, svg);
  drawAxes(plotG, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(plotG, g.x(6.3), g.y(0) + 28, "note", "parameter w", "end");
  txt(plotG, g.x(6.3), g.y(9.8) + 4, "note", "objective L(w)", "end");
  el("path", { class: "curve", d: curveD(g, Lw, 0, 6, 70) }, plotG);
  var dots = CANDS.map(function (w) {
    var d = el("circle", { cx: g.x(w), cy: g.y(Lw(w)), r: 7, fill: w === 3 ? "#1db584" : "#e2b44a", stroke: "#071510", "stroke-width": 2 }, plotG);
    txt(plotG, g.x(w) + (w === 0 ? 14 : w === 5 ? 12 : 0), g.y(Lw(w)) - 12, "lbl", "w = " + w + ": " + Lw(w), w === 0 || w === 5 ? "start" : "middle");
    return d;
  });
  var minG = el("g", {}, svg);
  el("circle", { cx: g.x(3), cy: g.y(0), r: 13, fill: "none", stroke: "#1db584", "stroke-width": 4 }, minG);
  el("line", { x1: g.x(3), y1: g.y(0) - 16, x2: g.x(3), y2: g.y(6), stroke: "#1db584", "stroke-width": 3, "stroke-dasharray": "6 4" }, minG);
  txt(minG, g.x(3), g.y(6) - 8, "lbl lbl-g", "minimum: w = 3, score 0", "middle");

  var mlG = el("g", {}, svg);
  [["parameters", "w", "fillA"], ["objective", "scores them", "fillG"], ["better parameters", "move toward lower scores", "fillB"]].forEach(function (b, i) {
    var x = 30 + i * 205;
    card(mlG, x, 110, 180, 90, b[2]);
    txt(mlG, x + 90, 146, "big", b[0], "middle").setAttribute("font-size", "14");
    txt(mlG, x + 90, 172, "note", b[1], "middle");
    if (i < 2) { var ar = arrow(mlG, "w", 3); setLine(ar, x + 184, 155, x + 201, 155); }
  });
  var loopBack = el("path", { d: "M 520 204 L 520 232 L 120 232 L 120 206", fill: "none", stroke: "#c9dccf", "stroke-width": 3, "marker-end": "url(#ah-w)" }, mlG);
  txt(mlG, 320, 256, "lbl lbl-y", "repeat: training is a search through parameter space", "middle");

  function setCand(w, nRows) {
    knob.setAttribute("cx", TX(w));
    knobLbl.setAttribute("x", TX(w)); knobLbl.textContent = "w = " + w;
    inTxt.textContent = "w = " + w;
    outTxt.textContent = String(Lw(w));
    calcTxt.textContent = "(" + w + " − 3)² = " + Lw(w);
    rows.forEach(function (r, i) { show(r, i < nRows); });
  }

  function render(index, id) {
    var i = index;
    show(trackG, i <= 4);
    show(knob, i <= 4); show(knobLbl, i >= 2 && i <= 4);
    show(flowG, i >= 1 && i <= 4);
    show(calcTxt, i >= 2 && i <= 4);
    show(boardG, i >= 2 && i <= 4);
    show(plotG, i === 5 || i === 6);
    show(minG, i === 6);
    show(mlG, i === 7);
    inTxt.textContent = "w = 0"; outTxt.textContent = i === 1 ? "?" : "9";
    knob.setAttribute("cx", TX(0));
    if (i === 2) setCand(0, 1);
    if (i === 3) setCand(2, 2);
    if (i === 4) { setCand(3, 4); }
    if (i === 1) { rows.forEach(function (r) { show(r, false); }); }
  }
