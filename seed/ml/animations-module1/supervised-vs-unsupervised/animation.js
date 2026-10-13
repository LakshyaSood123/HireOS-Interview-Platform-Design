(function () {
  var NS = "http://www.w3.org/2000/svg";

  var steps = [
    { id: "dataset", label: "The same points", caption: "Each dot is one example described by two features, X. Nothing says what the groups are yet." },
    { id: "labels", label: "Labels reveal the answer", caption: "Now every dot carries a known label y. This is the answer the model is allowed to learn from." },
    { id: "supervised", label: "Supervised: learn y from X", caption: "The model learns a boundary from labelled examples, then predicts the label of a new point." },
    { id: "remove-labels", label: "Remove the labels", caption: "Hide y. Only the features X remain, exactly as an unsupervised learner sees the data." },
    { id: "unsupervised", label: "Unsupervised: find structure", caption: "Group points that are similar to each other. The groups are discovered from X alone." },
    { id: "compare", label: "Compare the two settings", caption: "SUPERVISED learns to predict a known target. UNSUPERVISED discovers structure in X." }
  ];

  var CENTERS = [
    { x: 150, y: 120 },
    { x: 490, y: 120 },
    { x: 320, y: 236 },
  ];
  var LABEL_COLOR = ["#38BDF8", "#1DB584", "#F472B6"];
  var FOUND_COLOR = ["#FBBF24", "#34D399", "#A78BFA"];

  // 24 points, 8 per cluster, placed deterministically around each centre.
  var pts = [];
  for (var c = 0; c < 3; c++) {
    for (var j = 0; j < 8; j++) {
      var angle = (j + c * 3) * 2.399;
      var radius = 16 + (j % 4) * 11;
      pts.push({
        x: CENTERS[c].x + Math.cos(angle) * radius,
        y: CENTERS[c].y + Math.sin(angle) * radius * 0.8,
        label: c,
      });
    }
  }

  var svg = document.getElementById("scene");
  var main = document.getElementById("main");
  var boundaries = document.getElementById("boundaries");
  var compare = document.getElementById("compare");
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"dataset": {"h": "WHAT YOU ARE LOOKING AT", "t": "Each dot is **one example described by two features, X**. Nothing says what the groups are yet, so all we see are positions."}, "labels": {"h": "LABELS REVEAL THE ANSWER", "t": "Now every dot carries a **known label y**. This is the answer the model is allowed to learn from, which is what makes the problem **supervised**."}, "supervised": {"h": "SUPERVISED: LEARN y FROM X", "t": "The model learns a **boundary from labelled examples**, then predicts the label of a **new point** by seeing which side it falls on."}, "remove-labels": {"h": "REMOVE THE LABELS", "t": "Hide y. **Only the features X remain**, exactly as an unsupervised learner sees the data. There is no answer key any more."}, "unsupervised": {"h": "UNSUPERVISED: FIND STRUCTURE", "t": "Group points that are **similar to each other**. The groups are **discovered from X alone**; nobody tells the algorithm what they mean."}, "compare": {"h": "TAKEAWAY", "t": "**Supervised** learning learns to **predict a known target**. **Unsupervised** learning **discovers structure in X**. The difference is whether labels are available."}};

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

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  var nodes = pts.map(function (p, i) {
    var node = el("circle", { r: 7.5, class: "pt", "data-i": i }, main);
    node.style.cx = p.x + "px";
    node.style.cy = p.y + "px";
    return node;
  });

  // Decision boundaries between the labelled classes (perpendicular bisectors).
  function bisector(a, b) {
    var mx = (a.x + b.x) / 2;
    var my = (a.y + b.y) / 2;
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var px = -dy / len;
    var py = dx / len;
    return el("line", {
      x1: mx - px * 420, y1: my - py * 420,
      x2: mx + px * 420, y2: my + py * 420,
      class: "boundary",
    }, boundaries);
  }
  var boundaryLines = [bisector(CENTERS[0], CENTERS[2]), bisector(CENTERS[1], CENTERS[2])];

  // The new point the supervised model predicts.
  var newPoint = { x: 400, y: 150 };
  var newNode = el("path", { d: "M0 -11 L11 0 L0 11 L-11 0 Z", class: "new-point" }, main);
  newNode.style.transform = "translate(" + newPoint.x + "px," + newPoint.y + "px)";
  var newLabel = el("text", { x: 0, y: 0, class: "new-label" }, main);
  newLabel.style.transform = "translate(" + newPoint.x + "px," + (newPoint.y + 28) + "px)";

  // Nearest labelled-class centre, used for the supervised prediction.
  function predictClass(p) {
    var best = 0;
    var bestDistance = Infinity;
    for (var k = 0; k < CENTERS.length; k++) {
      var dx = p.x - CENTERS[k].x;
      var dy = p.y - CENTERS[k].y;
      var d = dx * dx + dy * dy;
      if (d < bestDistance) { bestDistance = d; best = k; }
    }
    return best;
  }
  var predicted = predictClass(newPoint);

  // K-means on X only: three iterations from fixed starting points.
  var means = [pts[0], pts[8], pts[16]].map(function (p) { return { x: p.x, y: p.y }; });
  var assign = [];
  for (var it = 0; it < 3; it++) {
    assign = pts.map(function (p) {
      var best = 0;
      var bestD = Infinity;
      for (var k = 0; k < 3; k++) {
        var d = (p.x - means[k].x) * (p.x - means[k].x) + (p.y - means[k].y) * (p.y - means[k].y);
        if (d < bestD) { bestD = d; best = k; }
      }
      return best;
    });
    means = [0, 1, 2].map(function (k) {
      var members = pts.filter(function (_, i) { return assign[i] === k; });
      if (members.length === 0) return means[k];
      return {
        x: members.reduce(function (s, p) { return s + p.x; }, 0) / members.length,
        y: members.reduce(function (s, p) { return s + p.y; }, 0) / members.length,
      };
    });
  }

  // Split-screen comparison: a smaller copy of the scene on each side.
  var compareLeft = el("g", { transform: "translate(0,60) scale(0.5,0.5)", class: "half" }, compare);
  var compareRight = el("g", { transform: "translate(320,60) scale(0.5,0.5)", class: "half" }, compare);
  pts.forEach(function (p) {
    el("circle", { cx: p.x, cy: p.y, r: 7, class: "pt", fill: LABEL_COLOR[p.label] }, compareLeft);
    el("circle", { cx: p.x, cy: p.y, r: 7, class: "pt", fill: FOUND_COLOR[0] }, compareRight);
  });
  // Recolour the right half by the discovered groups.
  var rightDots = compareRight.querySelectorAll("circle");
  rightDots.forEach(function (node, i) { node.setAttribute("fill", FOUND_COLOR[assign[i]]); });
  el("line", { x1: 320, y1: 30, x2: 320, y2: 300, class: "divider" }, compare);
  el("text", { x: 20, y: 296, class: "panel-title panel-supervised" }, compare).textContent = "SUPERVISED · X + y · Learn to predict a known target";
  el("text", { x: 340, y: 296, class: "panel-title panel-unsupervised" }, compare).textContent = "UNSUPERVISED · X only · Discover structure";

  var current = 0;

  function colorFor(index, mode) {
    var p = pts[index];
    if (mode === "label") return LABEL_COLOR[p.label];
    if (mode === "found") return FOUND_COLOR[assign[index]];
    return "#8FA89C";
  }

  function setMode(mode, showBoundary) {
    nodes.forEach(function (node, i) {
      node.setAttribute("fill", colorFor(i, mode));
      node.setAttribute("class", "pt" + (mode === "none" ? " pt-quiet" : ""));
    });
    boundaryLines.forEach(function (line) { line.setAttribute("class", showBoundary ? "boundary on" : "boundary"); });
  }

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.label;
    showExplanation(index);
    var id = step.id;
    main.setAttribute("opacity", id === "compare" ? "0" : "1");
    boundaries.setAttribute("opacity", id === "compare" ? "0" : "1");
    compare.setAttribute("opacity", id === "compare" ? "1" : "0");
    newNode.setAttribute("class", "new-point");
    newLabel.textContent = "";

    if (id === "dataset") {
      setMode("none", false);
      newNode.setAttribute("class", "new-point hidden");
    } else if (id === "labels") {
      setMode("label", false);
      newNode.setAttribute("class", "new-point hidden");
    } else if (id === "supervised") {
      setMode("label", true);
      newNode.setAttribute("class", "new-point on");
      newNode.setAttribute("fill", LABEL_COLOR[predicted]);
      newLabel.textContent = "predicted: class " + (predicted + 1);
    } else if (id === "remove-labels") {
      setMode("none", false);
      newNode.setAttribute("class", "new-point hidden");
    } else if (id === "unsupervised") {
      setMode("found", false);
      newNode.setAttribute("class", "new-point hidden");
    } else if (id === "compare") {
      // Right-hand panel already coloured by discovered groups; left by labels.
      newNode.setAttribute("class", "new-point hidden");
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
