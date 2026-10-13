(function () {
  var NS = "http://www.w3.org/2000/svg";

  var steps = [
    { id: "problem", label: "Problem", title: "Define the goal", detail: "Goal: predict the sale price of a house before it is sold." },
    { id: "data", label: "Data", title: "Collect past sales", detail: "Records of past house sales: area, bedrooms, age and the price each house sold for." },
    { id: "features-target", label: "Features / target", title: "Choose X and y", detail: "Features X: area, bedrooms, age. Target y: sale price." },
    { id: "split", label: "Split", title: "Separate the houses", detail: "Train, validation and test houses. A 70/15/15 split is only an example, not a rule." },
    { id: "model", label: "Model", title: "Choose a simple model", detail: "Simple linear regression: price = w · (area, bedrooms, age) + b." },
    { id: "train", label: "Train", title: "Fit the parameters", detail: "Adjust w and b using training houses only." },
    { id: "validate", label: "Validate", title: "Check on unseen houses", detail: "Measure the error on validation houses and compare settings." },
    { id: "improve", label: "Improve", title: "Adjust and re-check", detail: "Change features or model settings, then check validation error again." },
    { id: "test", label: "Test", title: "One final evaluation", detail: "Measure the error once on test houses. These houses were never used to train or choose." },
    { id: "inference", label: "Inference", title: "Predict a new house", detail: "A new house goes in, the trained model runs, and an estimated sale price comes out." }
  ];

  // Ten nodes in two rows of five (viewBox 640 x 330).
  var POS = [
    { x: 80, y: 84 }, { x: 200, y: 84 }, { x: 320, y: 84 }, { x: 440, y: 84 }, { x: 560, y: 84 },
    { x: 560, y: 196 }, { x: 440, y: 196 }, { x: 320, y: 196 }, { x: 200, y: 196 }, { x: 80, y: 196 },
  ];

  var svg = document.getElementById("scene");
  var linksLayer = document.getElementById("links");
  var nodesLayer = document.getElementById("nodes");
  var tokenLayer = document.getElementById("token");
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"problem": {"h": "STEP 1: DEFINE THE GOAL", "t": "Every project begins with a **clear goal**: **predict the sale price of a house before it is sold**. The goal decides what data we need and how we will judge success."}, "data": {"h": "STEP 2: COLLECT DATA", "t": "We gather **records of past house sales**: area, bedrooms, age and the price each house sold for. Past examples with known answers are the raw material for learning."}, "features-target": {"h": "STEP 3: CHOOSE X AND y", "t": "**Features X** are area, bedrooms and age. The **target y** is the sale price. Features are the inputs; the target is the answer the model should predict."}, "split": {"h": "STEP 4: SPLIT THE HOUSES", "t": "Houses are separated into **train, validation and test** groups. A 70/15/15 split is only an example, not a rule. The test houses are set aside and **not touched**."}, "model": {"h": "STEP 5: CHOOSE A SIMPLE MODEL", "t": "We start simple: **linear regression**, price = w · (area, bedrooms, age) + b. A simple model is easy to understand and a good baseline to beat."}, "train": {"h": "STEP 6: TRAIN", "t": "**Adjust w and b using the training houses only.** This is where the model learns from data."}, "validate": {"h": "STEP 7: VALIDATE", "t": "Measure the error on the **validation houses** and compare settings. Validation shows how the model behaves on houses it did not train on."}, "improve": {"h": "STEP 8: IMPROVE", "t": "Change features or model settings, then **check the validation error again**. Improvement is a loop: change one thing, measure, repeat."}, "test": {"h": "STEP 9: ONE FINAL TEST", "t": "Measure the error **once** on the test houses. These houses were **never used to train or choose**, so the result is an honest estimate."}, "inference": {"h": "TAKEAWAY", "t": "A **new house goes in, the trained model runs, and an estimated sale price comes out**. This is **inference**: using the finished model on new data."}};

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
    return Math.max(4500, Math.min(10500, Math.round(3800 + words * 165)));
  }

  function showExplanation(index) {
    var ex = explanationFor(index);
    if (explainHeadEl) explainHeadEl.textContent = ex.h;
    setRich(captionEl, ex.t);
  }
  var houseTitleEl = document.getElementById("house-title");
  var houseDetailEl = document.getElementById("house-detail");

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Links between consecutive stages.
  var links = [];
  for (var i = 0; i < POS.length - 1; i++) {
    links.push(el("line", {
      x1: POS[i].x, y1: POS[i].y, x2: POS[i + 1].x, y2: POS[i + 1].y,
      class: "link",
    }, linksLayer));
  }

  var nodes = [];
  steps.forEach(function (step, idx) {
    var g = el("g", { class: "node", "data-id": step.id }, nodesLayer);
    el("circle", { cx: POS[idx].x, cy: POS[idx].y, r: 26, class: "node-disc" }, g);
    el("text", { x: POS[idx].x, y: POS[idx].y + 4, class: "node-index", "text-anchor": "middle" }, g).textContent = String(idx + 1);
    el("text", { x: POS[idx].x, y: POS[idx].y + 46, class: "node-label", "text-anchor": "middle" }, g).textContent = step.label;
    nodes.push(g);
  });

  // A small house token that travels to the active stage.
  var token = el("g", { class: "token" }, tokenLayer);
  el("rect", { x: -9, y: -2, width: 18, height: 12, rx: 2, class: "token-body" }, token);
  el("path", { d: "M-12 -1 L0 -11 L12 -1 Z", class: "token-roof" }, token);

  var current = 0;

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.title;
    showExplanation(index);
    houseTitleEl.textContent = "House under study";
    houseDetailEl.textContent = index >= 6 && index <= 8
      ? "Area 1500 sq ft · 3 bedrooms · 6 years old"
      : index === 9
        ? "Area 1500 sq ft · 3 bedrooms · 6 years old → model → estimated price"
        : "Area, bedrooms, age and sale price for each past house";

    nodes.forEach(function (node, i) {
      var cls = "node";
      if (i < index) cls += " done";
      if (i === index) cls += " active";
      node.setAttribute("class", cls);
    });
    links.forEach(function (link, i) {
      link.setAttribute("class", i < index ? "link lit" : "link");
    });
    token.style.transform = "translate(" + POS[index].x + "px," + (POS[index].y - 46) + "px)";
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
