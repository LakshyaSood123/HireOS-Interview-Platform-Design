(function () {
  var steps = [
    { id: "raw-table", label: "Raw table", caption: "A dataset is a table: each row is one example, each column is one piece of information.", showFeatures: false, showLabel: false, showSplit: false, showSample: false },
    { id: "features", label: "Features", caption: "Area, Bedrooms and Age are the features: the information the model receives.", showFeatures: true, showLabel: false, showSplit: false, showSample: false },
    { id: "label", label: "Label", caption: "Sale Price is the label: the value the model is trained to predict.", showFeatures: false, showLabel: true, showSplit: false, showSample: false },
    { id: "split", label: "X and y", caption: "Split the table: X holds the features, y holds the label.", showFeatures: false, showLabel: false, showSplit: true, showSample: false },
    { id: "new-sample", label: "New sample", caption: "A new house with features [1500, 3, 6] goes into the trained model, which outputs an estimated price.", showFeatures: false, showLabel: false, showSplit: true, showSample: true },
  ];

  var current = 0;
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"raw-table": {"h": "WHAT YOU ARE LOOKING AT", "t": "A dataset is a **table**: each **row is one example** (here, a house) and each **column is one piece of information** about it."}, "features": {"h": "FEATURES", "t": "**Area, Bedrooms and Age** are the **features**: the information the model receives as input. Highlighting them separates what the model may use from what it must predict."}, "label": {"h": "THE LABEL", "t": "**Sale Price** is the **label**: the value the model is trained to **predict**. During training each house comes with its answer; for a new house the answer is unknown."}, "split": {"h": "X AND y", "t": "Splitting the table gives **X**, the features, and **y**, the label. Nearly every supervised learning algorithm takes this pair as input: **learn y from X**."}, "new-sample": {"h": "USING THE TRAINED MODEL", "t": "A **new house with features [1500, 3, 6]** goes into the trained model, which outputs an **estimated price**. For a new house there is no label yet: the model produces it."}};

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
  var splitEl = document.getElementById("split");
  var sampleEl = document.getElementById("sample");
  var table = document.getElementById("dataset");

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.label;
    showExplanation(index);
    var rows = table.querySelectorAll("tbody tr");
    var headers = table.querySelectorAll("thead th");
    for (var h = 0; h < headers.length; h++) headers[h].classList.remove("feature-hl", "label-hl");
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].querySelectorAll("td");
      for (var c = 0; c < cells.length; c++) cells[c].classList.remove("feature-hl", "label-hl");
    }
    if (step.showFeatures) {
      for (var f = 0; f < 3; f++) {
        headers[f].classList.add("feature-hl");
        for (var rr = 0; rr < rows.length; rr++) rows[rr].querySelectorAll("td")[f].classList.add("feature-hl");
      }
    }
    if (step.showLabel) {
      headers[3].classList.add("label-hl");
      for (var lr = 0; lr < rows.length; lr++) rows[lr].querySelectorAll("td")[3].classList.add("label-hl");
    }
    splitEl.className = step.showSplit ? "split on" : "split";
    sampleEl.className = step.showSample ? "sample on" : "sample";
  }

  function goTo(index) {
    if (index < 0 || index >= steps.length) return;
    current = index;
    render(current);
    if (window.ReagvisBridge) window.ReagvisBridge.stepChanged(steps[current].id);
  }

  render(current);

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
      goTo(current + 1);
      if (current < steps.length - 1) scheduleNext();
    }, stepMs(current));
  }

  function startAuto() {
    if (timer !== null) return;
    if (current >= steps.length - 1) goTo(0);
    scheduleNext();
  }

  window.addEventListener("pagehide", stopAuto);

  window.ReagvisAnimation = {
    stepDuration: stepMs,
    onCommand: function (type, stepId) {
      if (type === "PLAY") startAuto();
      else if (type === "PAUSE") stopAuto();
      else if (type === "NEXT") { stopAuto(); goTo(current + 1); }
      else if (type === "PREVIOUS") { stopAuto(); goTo(current - 1); }
      else if (type === "RESET") { stopAuto(); goTo(0); }
      else if (type === "GOTO_STEP") {
        stopAuto();
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].id === stepId) { goTo(i); break; }
        }
      }
    },
  };

  if (window.ReagvisBridge) {
    window.ReagvisBridge.ready();
    window.ReagvisBridge.stepChanged(steps[current].id);
  }
})();
