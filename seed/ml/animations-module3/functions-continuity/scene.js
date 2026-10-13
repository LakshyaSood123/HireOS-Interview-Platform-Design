  var steps = [
    { id: "input-output", label: "A function: input in, output out", caption: "A function is a rule. You give it an input and it gives back exactly one output. For a model, the input is a setting such as the weight w, and the output says how wrong the model is." },
    { id: "function-rule", label: "The rule is a formula", caption: "Our loss rule is L(w) = (w − 3)². Put in w = 2 and the rule gives (2 − 3)² = 1. Different inputs give different outputs." },
    { id: "plot-function", label: "Plot every input and its output", caption: "Plot each input along the bottom and its output as the height. The result is a smooth bowl with its lowest point at w = 3." },
    { id: "change-input", label: "Change the input a little", caption: "Nudge w from 2.0 to 2.5. The loss moves from 1.00 to 0.25. A small change in, a small change out." },
    { id: "continuous-change", label: "Continuous: no jumps", caption: "Slide w along the curve. The loss changes smoothly at every point. You could draw the whole curve without lifting your pen. That is what continuous means." },
    { id: "discontinuity-contrast", label: "Contrast: a rule with a jump", caption: "Now a rule that outputs 0 below w = 2 and 1 at or above it. Right at w = 2 the output jumps by 1 although w barely moved. This rule is not continuous." },
    { id: "ml-connection", label: "Why training wants a smooth loss", caption: "Training follows the slope downhill, which only works when small changes give small changes. That is why models are trained on a smooth loss, not a jumpy one." }
  ];

  function L(w) { return (w - 3) * (w - 3); }
  var g = makeGraph(50, 318, 58, 30);
  var gs = makeGraph(50, 318, 58, 150);

  // Machine view (steps 1-2): input -> rule -> output.
  var machine = el("g", {}, svg);
  card(machine, 40, 110, 130, 80, "fillA");
  txt(machine, 105, 138, "note", "input", "middle");
  var inTxt = txt(machine, 105, 168, "big", "w = 2", "middle");
  card(machine, 235, 95, 170, 110, "fillG");
  txt(machine, 320, 122, "note", "the function (a rule)", "middle");
  var ruleTxt = txt(machine, 320, 160, "big", "L", "middle");
  var ruleSub = txt(machine, 320, 186, "note", "", "middle");
  card(machine, 470, 110, 130, 80, "fillB");
  txt(machine, 535, 138, "note", "output", "middle");
  var outTxt = txt(machine, 535, 168, "big", "1", "middle");
  var a1 = arrow(machine, "w", 3); setLine(a1, 172, 150, 232, 150);
  var a2 = arrow(machine, "w", 3); setLine(a2, 407, 150, 467, 150);
  var table = el("g", {}, svg);
  [[0, 9], [2, 1], [3, 0], [5, 4]].forEach(function (p, i) {
    var gx = 50 + i * 145;
    card(table, gx, 252, 130, 44, "fillA");
    txt(table, gx + 65, 279, "mono", "w = " + p[0] + "  →  " + p[1], "middle");
  });
  txt(table, 320, 236, "note", "a few inputs and the outputs the rule gives", "middle");

  // Graph view (steps 3-7).
  var graph = el("g", {}, svg);
  drawAxes(graph, g, 6.3, 9.8, [0, 1, 2, 3, 4, 5, 6], [0, 3, 6, 9]);
  txt(graph, g.x(6.3), g.y(0) + 28, "note", "weight w", "end");
  txt(graph, g.x(0) + 8, g.y(9.8) - 2, "note", "loss L(w)", "start");
  var bowl = el("path", { class: "curve" }, graph);
  setD(bowl, curveD(g, L, 0, 6, 60));
  var stepGraph = el("g", {}, svg);
  drawAxes(stepGraph, gs, 6.3, 1.5, [0, 1, 2, 3, 4, 5, 6], [0, 1]);
  txt(stepGraph, gs.x(6.3), gs.y(0) + 28, "note", "weight w", "end");
  txt(stepGraph, gs.x(0) + 8, gs.y(1.5) - 2, "note", "output of the jumpy rule", "start");
  el("line", { x1: gs.x(0), y1: gs.y(0), x2: gs.x(2), y2: gs.y(0), stroke: "#f87171", "stroke-width": 3 }, stepGraph);
  el("line", { x1: gs.x(2), y1: gs.y(1), x2: gs.x(6), y2: gs.y(1), stroke: "#f87171", "stroke-width": 3 }, stepGraph);
  el("line", { x1: gs.x(2), y1: gs.y(0), x2: gs.x(2), y2: gs.y(1), stroke: "#f87171", "stroke-width": 2 }, stepGraph).setAttribute("class", "dash");
  el("circle", { cx: gs.x(2), cy: gs.y(0), r: 5, fill: "#071510", stroke: "#f87171", "stroke-width": 2 }, stepGraph);
  el("circle", { cx: gs.x(2), cy: gs.y(1), r: 5, fill: "#f87171" }, stepGraph);

  // Moving marker with guide lines.
  var guides = el("g", {}, svg);
  var gv = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, guides);
  var gh = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, guides);
  var oldDot = el("circle", { r: 5, fill: "#8fa89c" }, svg);
  var marker = el("circle", { r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg);
  var mLabel = txt(svg, 0, 0, "lbl lbl-y", "", "start");

  // Readout panel.
  var panel = el("g", {}, svg);
  card(panel, 420, 44, 200, 96, "fillG");
  var rd1 = txt(panel, 520, 74, "mono", "", "middle");
  var rd2 = txt(panel, 520, 100, "mono", "", "middle");
  var rd3 = txt(panel, 520, 126, "note", "", "middle");

  var mw = 2;
  function putMarker(w, onStep) {
    mw = w;
    var cx, cy;
    if (onStep) { cx = gs.x(w); cy = gs.y(w >= 2 ? 1 : 0); }
    else { cx = g.x(w); cy = g.y(L(w)); }
    marker.setAttribute("cx", cx); marker.setAttribute("cy", cy);
    setLine(gv, cx, cy, cx, (onStep ? gs : g).y(0));
    setLine(gh, cx, cy, (onStep ? gs : g).x(0), cy);
    mLabel.setAttribute("x", cx - 70); mLabel.setAttribute("y", cy - 64); // inside the bowl, clear of the curve
    if (onStep) {
      rd1.textContent = "w = " + fmt(w, 2);
      rd2.textContent = "output = " + (w >= 2 ? 1 : 0);
    } else {
      rd1.textContent = "w = " + fmt(w, 2);
      rd2.textContent = "L(w) = " + fmt(L(w), 2);
    }
  }

  function render(index, id) {
    var onMachine = id === "input-output" || id === "function-rule";
    show(machine, onMachine);
    show(table, id === "function-rule");
    show(graph, !onMachine && id !== "discontinuity-contrast");
    show(bowl, !onMachine && id !== "discontinuity-contrast");
    show(stepGraph, id === "discontinuity-contrast");
    var showMarker = id === "plot-function" || id === "change-input" || id === "continuous-change" || id === "discontinuity-contrast" || id === "ml-connection";
    show(marker, showMarker && id !== "plot-function");
    show(guides, id === "change-input" || id === "continuous-change" || id === "discontinuity-contrast");
    show(oldDot, id === "change-input");
    show(panel, id === "change-input" || id === "continuous-change" || id === "discontinuity-contrast" || id === "ml-connection");
    mLabel.textContent = "";
    ruleTxt.textContent = id === "input-output" ? "?" : "L(w) = (w − 3)²";
    ruleSub.textContent = id === "input-output" ? "a rule turns input into output" : "";
    outTxt.textContent = id === "input-output" ? "?" : "1";
    inTxt.textContent = "w = 2";
    rd3.textContent = "";

    if (id === "change-input") {
      oldDot.setAttribute("cx", g.x(2)); oldDot.setAttribute("cy", g.y(L(2)));
      putMarker(2, false);
      anim("m", 1100, function (e) { putMarker(lerp(2, 2.5, e), false); });
      rd3.textContent = "small change in, small change out";
    } else if (id === "continuous-change") {
      anim("m", 2600, function (e) { putMarker(1.2 + 2.6 * (0.5 - 0.5 * Math.cos(Math.PI * e)), false); });
      rd3.textContent = "smooth, no jumps";
    } else if (id === "discontinuity-contrast") {
      anim("m", 2200, function (e) {
        var w = 1.5 + 1.0 * e;
        putMarker(w, true);
        rd3.textContent = w >= 2 ? "it jumped by 1!" : "output stays 0 …";
      });
    } else if (id === "ml-connection") {
      putMarker(1, false);
      mLabel.textContent = "follow the slope down";
      rd3.textContent = "smooth loss = usable slope";
      anim("m", 1800, function (e) { putMarker(lerp(1, 2.6, e), false); mLabel.textContent = "follow the slope down"; });
    } else {
      putMarker(2, false);
    }
  }
