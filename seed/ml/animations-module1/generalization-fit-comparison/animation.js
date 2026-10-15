(function () {
  var NS = "http://www.w3.org/2000/svg";

  var steps = [
    { id: "dataset", label: "One dataset", caption: "30 examples follow a gentle curve with some noise. Half are used for training, half are held out for validation." },
    { id: "underfit", label: "Underfit: too simple", caption: "A flat line ignores the curve. It is wrong on the training points AND on the validation points." },
    { id: "good-fit", label: "Good fit: captures the trend", caption: "This curve follows the main pattern. Its training and validation errors are both small." },
    { id: "overfit", label: "Overfit: memorizes the noise", caption: "This curve passes through every training point, so its training error is zero. It wiggles between them and misses the validation points." },
    { id: "train-vs-validation", label: "Training error vs validation error", caption: "Compare the two bars for each model. Training error can keep falling while validation error gets worse." },
    { id: "generalize", label: "Generalization", caption: "The goal is not the lowest training error. The goal is performance on unseen data." }
  ];

  // One dataset: 30 points on a curve plus deterministic noise.
  var points = [];
  for (var i = 0; i < 30; i++) {
    var x = (i * 10) / 29;
    var f = Math.sin(i * 12.9898) * 43758.5453;
    var noise = ((f - Math.floor(f)) - 0.5) * 1.8;
    var y = 1 + 0.16 * (x - 5) * (x - 5) + noise;
    points.push({ x: x, y: y, set: i % 2 === 0 ? "train" : "validation" });
  }
  var trainPts = points.filter(function (p) { return p.set === "train"; });
  var valPts = points.filter(function (p) { return p.set === "validation"; });

  // The three models, each a function of x.
  var meanTrain = trainPts.reduce(function (s, p) { return s + p.y; }, 0) / trainPts.length;
  var sortedTrain = trainPts.slice().sort(function (a, b) { return a.x - b.x; });
  var models = {
    underfit: function () { return meanTrain; },
    "good-fit": function (x) { return 1 + 0.16 * (x - 5) * (x - 5); },
    overfit: function (x) {
      // Piecewise-linear curve through every training point.
      if (x <= sortedTrain[0].x) return sortedTrain[0].y;
      for (var k = 0; k < sortedTrain.length - 1; k++) {
        var a = sortedTrain[k], b = sortedTrain[k + 1];
        if (x >= a.x && x <= b.x) {
          var t = (x - a.x) / (b.x - a.x);
          return a.y + t * (b.y - a.y);
        }
      }
      return sortedTrain[sortedTrain.length - 1].y;
    },
  };

  function mse(fn, set) {
    var total = 0;
    for (var j = 0; j < set.length; j++) {
      var d = fn(set[j].x) - set[j].y;
      total += d * d;
    }
    return total / set.length;
  }
  var errors = {};
  ["underfit", "good-fit", "overfit"].forEach(function (name) {
    errors[name] = { train: mse(models[name], trainPts), validation: mse(models[name], valPts) };
  });

  // Plot geometry (viewBox 640 x 320).
  function px(x) { return 50 + (x / 10) * 560; }
  function py(y) { return 286 - (y / 7) * 252; }

  var svg = document.getElementById("scene");
  var plot = document.getElementById("plot");
  var bars = document.getElementById("bars");
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"dataset": {"h": "WHAT YOU ARE LOOKING AT", "t": "**30 examples** follow a gentle curve with some noise. **Half (green) are used for training**, which is what the model learns from, and **half (amber) are held out for validation**: new data to check it on."}, "underfit": {"h": "UNDERFIT: TOO SIMPLE", "t": "A **flat line ignores the curve**. It is wrong on the training points **and** on the validation points, because the model is too simple to capture the pattern."}, "good-fit": {"h": "GOOD FIT: CAPTURES THE TREND", "t": "This curve follows the **main pattern** without chasing every dot. Its training and validation errors are **both small**, so it should work on new data too."}, "overfit": {"h": "OVERFIT: MEMORIZES THE NOISE", "t": "This curve passes through **every training point**, so its training error is **zero**. But it wiggles between them and **misses the validation points**: it learned the noise, not the pattern."}, "train-vs-validation": {"h": "TRAINING VS VALIDATION ERROR", "t": "Compare the two bars for each model. **Training error can keep falling while validation error gets worse.** A big gap between them is the warning sign of overfitting."}, "generalize": {"h": "TAKEAWAY", "t": "The goal is **not the lowest training error**. The goal is **performance on unseen data**: that is what generalization means."}};

  function setRich(node, str) {
    node.textContent = "";
    var parts = String(str).split("**");
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === "") continue;
      var seg = document.createElement(i % 2 ? "strong" : "span");
      seg.textContent = parts[i];
      node.appendChild(seg);
    }
  }

  function explanationFor(index) {
    var ex = EXPLAIN[steps[index].id];
    return ex || { h: "WHAT IS HAPPENING", t: steps[index].caption || steps[index].detail || "" };
  }

  function stepMs(index) {
    var words = String(explanationFor(index).t).replace(/\*\*/g, "").split(/\s+/).length;
    var base = Math.max(4500, Math.min(10500, Math.round(3800 + words * 165)));
    // Narrated steps wait for their audio: never shorter than the text-based pace, never shorter than narration + 600 ms.
    // The host (parent page) supplies { stepId: durationMs } via a NARRATION_TIMING message, only while narration is ON.
    var narrationTimes = window.__REAGVIS_NARRATION__;
    var narrationMs = narrationTimes && narrationTimes[steps[index].id];
    return narrationMs > 0 ? Math.max(base, Math.round(narrationMs) + 600) : base;
  }

  function showExplanation(index) {
    var ex = explanationFor(index);
    if (explainHeadEl) explainHeadEl.textContent = ex.h;
    setRich(captionEl, ex.t);
  }
  var statsEl = document.getElementById("stats");

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Axes.
  el("line", { x1: 50, y1: 286, x2: 610, y2: 286, class: "axis" }, plot);
  el("line", { x1: 50, y1: 34, x2: 50, y2: 286, class: "axis" }, plot);
  var axisLabels = [
    el("text", { x: 330, y: 312, class: "axis-label", "text-anchor": "middle" }, plot),
    el("text", { x: 18, y: 160, class: "axis-label", transform: "rotate(-90 18 160)", "text-anchor": "middle" }, plot),
  ];
  axisLabels[0].textContent = "input x";
  axisLabels[1].textContent = "target y";

  var pointEls = points.map(function (p) {
    return el("circle", {
      cx: px(p.x), cy: py(p.y), r: 5.5,
      class: "pt " + (p.set === "train" ? "pt-train" : "pt-val"),
    }, plot);
  });

  var curve = el("path", { d: "", class: "curve", fill: "none" }, plot);

  function curvePath(fn) {
    var d = "";
    for (var s = 0; s <= 60; s++) {
      var x = (s / 60) * 10;
      d += (s === 0 ? "M" : "L") + px(x).toFixed(1) + " " + py(fn(x)).toFixed(1) + " ";
    }
    return d;
  }

  // Bar chart for the comparison step.
  var BAR_X = { underfit: 150, "good-fit": 320, overfit: 490 };
  var maxErr = 0;
  ["underfit", "good-fit", "overfit"].forEach(function (name) {
    maxErr = Math.max(maxErr, errors[name].train, errors[name].validation);
  });
  var barScale = 200 / maxErr;
  var barEls = {};
  ["underfit", "good-fit", "overfit"].forEach(function (name) {
    var g = el("g", { class: "bar-group", "data-model": name }, bars);
    var tH = errors[name].train * barScale;
    var vH = errors[name].validation * barScale;
    barEls[name + "-train"] = el("rect", { x: BAR_X[name] - 48, y: 286 - tH, width: 40, height: tH, rx: 4, class: "bar bar-train" }, g);
    barEls[name + "-val"] = el("rect", { x: BAR_X[name] + 8, y: 286 - vH, width: 40, height: vH, rx: 4, class: "bar bar-val" }, g);
    el("text", { x: BAR_X[name], y: 304, class: "bar-name", "text-anchor": "middle" }, g).textContent =
      name === "good-fit" ? "GOOD FIT" : name.toUpperCase();
    el("text", { x: BAR_X[name] - 28, y: 286 - tH - 6, class: "bar-value", "text-anchor": "middle" }, g).textContent = errors[name].train.toFixed(2);
    el("text", { x: BAR_X[name] + 28, y: 286 - vH - 6, class: "bar-value", "text-anchor": "middle" }, g).textContent = errors[name].validation.toFixed(2);
  });

  var current = 0;

  function setPlotMode(mode) {
    pointEls.forEach(function (node) { node.style.opacity = mode === "bars" ? "0.25" : "1"; });
    plot.setAttribute("opacity", mode === "bars" ? "0.35" : "1");
    // The bar chart reuses the same area; the plot axis labels would collide with the bar names.
    axisLabels.forEach(function (node) { node.setAttribute("opacity", mode === "bars" ? "0" : "1"); });
    bars.setAttribute("opacity", mode === "bars" ? "1" : "0");
  }

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.label;
    showExplanation(index);
    statsEl.textContent = "";
    curve.setAttribute("class", "curve");
    var id = step.id;

    if (id === "dataset") {
      setPlotMode("dots");
      curve.setAttribute("d", "");
    } else if (id === "underfit") {
      setPlotMode("dots");
      curve.setAttribute("class", "curve curve-underfit");
      curve.setAttribute("d", curvePath(models.underfit));
      statsEl.textContent = "Train MSE " + errors.underfit.train.toFixed(2) + " · Validation MSE " + errors.underfit.validation.toFixed(2);
    } else if (id === "good-fit") {
      setPlotMode("dots");
      curve.setAttribute("class", "curve curve-good");
      curve.setAttribute("d", curvePath(models["good-fit"]));
      statsEl.textContent = "Train MSE " + errors["good-fit"].train.toFixed(2) + " · Validation MSE " + errors["good-fit"].validation.toFixed(2);
    } else if (id === "overfit") {
      setPlotMode("dots");
      curve.setAttribute("class", "curve curve-overfit");
      curve.setAttribute("d", curvePath(models.overfit));
      statsEl.textContent = "Train MSE " + errors.overfit.train.toFixed(2) + " · Validation MSE " + errors.overfit.validation.toFixed(2);
    } else if (id === "train-vs-validation" || id === "generalize") {
      setPlotMode("bars");
      curve.setAttribute("d", "");
      var highlightValidation = id === "generalize";
      Object.keys(barEls).forEach(function (key) {
        var isVal = key.slice(-3) === "val";
        barEls[key].setAttribute("class", "bar " + (isVal ? "bar-val" : "bar-train") + (highlightValidation && isVal ? " bar-focus" : ""));
      });
      statsEl.textContent = "Left bar: training error · Right bar: validation error";
    }
  }

  function emit() {
    if (window.ReagvisBridge) window.ReagvisBridge.stepChanged(steps[current].id);
  }

  function go(index) {
    if (index < 0 || index >= steps.length) return false;
    current = index;
    render(current);
    emit();
    return true;
  }

  // Autoplay pace: 4.5 to 10.5 seconds per step (longer for longer explanations), exactly one timer.
  // PLAY on the final step restarts from the first step and plays again.
  var timer = null;

  function stopAuto() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleNext() {
    timer = setTimeout(function () {
      timer = null;
      if (current >= steps.length - 1) return;
      go(current + 1);
      if (current < steps.length - 1) scheduleNext();
    }, stepMs(current));
  }

  function startAuto() {
    if (timer !== null) return;
    if (current >= steps.length - 1) go(0);
    scheduleNext();
  }

  window.addEventListener("pagehide", stopAuto);

  window.ReagvisAnimation = {
    stepDuration: stepMs,
    onCommand: function (type, stepId) {
      if (type === "PLAY") startAuto();
      else if (type === "PAUSE") stopAuto();
      else if (type === "NEXT") { stopAuto(); go(current + 1); }
      else if (type === "PREVIOUS") { stopAuto(); go(current - 1); }
      else if (type === "RESET") { stopAuto(); go(0); }
      else if (type === "GOTO_STEP") {
        stopAuto();
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].id === stepId) { go(i); break; }
        }
      }
    },
  };

  render(current);
  if (window.ReagvisBridge) {
    window.ReagvisBridge.ready();
    window.ReagvisBridge.stepChanged(steps[current].id);
  }
})();
