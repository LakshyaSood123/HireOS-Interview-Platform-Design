(function () {
  // Data: hours studied -> exam score. States are precomputed so the browser
  // never iterates: (w, b) and the mean squared error of that line.
  var DATA_X = [1, 2, 3, 4, 5];
  var DATA_Y = [42, 51, 61, 68, 78];
  var FLAT = { w: 0, b: 0, mse: 3758.8 };
  var ADJUSTED = { w: 5, b: 20, mse: 655.8 };
  var BETTER = { w: 9, b: 33, mse: 0.4 };

  var steps = [
    { id: "plot-data", label: "Plot the data points", state: null, caption: "Each dot is one student: hours studied on the x-axis, exam score on the y-axis.", showLine: false },
    { id: "initialize", label: "Start with a flat line", state: FLAT, caption: "Our model is a line: prediction = w * hours + b. Start with w = 0 and b = 0, a flat line that predicts 0 for everyone.", showLine: true },
    { id: "predict", label: "Predict with the line", state: FLAT, caption: "For each student, the prediction is the point where their hours meet the line.", showLine: true, showPredictions: true },
    { id: "error", label: "Measure each error", state: FLAT, caption: "The error (residual) is actual score minus predicted score: the vertical gap between a dot and the line.", showLine: true, showPredictions: true, showResiduals: true },
    { id: "loss", label: "Average the squared errors (MSE)", state: FLAT, caption: "Square each error, then average them. This number is the MSE. A big MSE means a poor fit.", showLine: true, showResiduals: true, showMse: true },
    { id: "adjust", label: "Adjust w and b", state: ADJUSTED, caption: "Training changes w and b. This line is closer to the dots, so the errors and the MSE are smaller.", showLine: true, showResiduals: true, showMse: true },
    { id: "better-fit", label: "A better-fitting line", state: BETTER, caption: "With w = 9 and b = 33 the line passes almost through every dot, and the MSE is only 0.4.", showLine: true, showResiduals: true, showMse: true },
  ];

  var current = 0;
  var canvas = document.getElementById("plot");
  var ctx = canvas.getContext("2d");
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"plot-data": {"h": "WHAT YOU ARE LOOKING AT", "t": "Each dot is **one student**: **hours studied** on the x-axis and **exam score** on the y-axis. More hours tend to mean higher scores, so a line might describe the trend."}, "initialize": {"h": "START WITH A FLAT LINE", "t": "Our model is a line: **prediction = w × hours + b**. We start with **w = 0 and b = 0**, a flat line that predicts **0 for everyone**. This is only a starting guess."}, "predict": {"h": "PREDICT WITH THE LINE", "t": "For each student the **prediction is the point where their hours meet the line**. Every prediction here is 0, far below the real scores."}, "error": {"h": "MEASURE EACH ERROR", "t": "The **error (residual)** is **actual score minus predicted score**: the vertical gap between a dot and the line. Big gaps mean the line fits that student badly."}, "loss": {"h": "AVERAGE THE SQUARED ERRORS (MSE)", "t": "Squaring each error makes it positive and punishes big misses, and averaging gives one number: the **MSE**. **A big MSE means a poor fit**, and training tries to shrink it."}, "adjust": {"h": "ADJUST w AND b", "t": "**Training changes w and b.** This new line is closer to the dots, so the errors and the **MSE are smaller**. The model learned by reducing its own error."}, "better-fit": {"h": "TAKEAWAY", "t": "With **w = 9 and b = 33** the line passes almost through every dot and the **MSE is only 0.4**. Learning a linear model means **adjusting w and b until the errors are as small as possible**."}};

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
  var statW = document.getElementById("stat-w");
  var statB = document.getElementById("stat-b");
  var statMse = document.getElementById("stat-mse");

  var X_MIN = 0, X_MAX = 6, Y_MIN = 0, Y_MAX = 100;
  function px(x) { return 40 + ((x - X_MIN) / (X_MAX - X_MIN)) * (canvas.width - 60); }
  function py(y) { return canvas.height - 30 - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (canvas.height - 50); }

  function draw(step) {
    var st = step.state;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(29,181,132,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 30); ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.moveTo(40, 20); ctx.lineTo(40, canvas.height - 30);
    ctx.stroke();
    ctx.fillStyle = "#8FA89C";
    ctx.font = "11px system-ui";
    ctx.fillText("hours studied", canvas.width - 100, canvas.height - 10);
    ctx.fillText("score", 6, 16);

    if (st && step.showLine) {
      ctx.strokeStyle = "#e2b44a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px(X_MIN), py(st.w * X_MIN + st.b));
      ctx.lineTo(px(X_MAX), py(st.w * X_MAX + st.b));
      ctx.stroke();
    }

    if (st && step.showResiduals) {
      ctx.strokeStyle = "rgba(255,120,120,0.85)";
      ctx.lineWidth = 1.5;
      for (var i = 0; i < DATA_X.length; i++) {
        var pred = st.w * DATA_X[i] + st.b;
        ctx.beginPath();
        ctx.moveTo(px(DATA_X[i]), py(pred));
        ctx.lineTo(px(DATA_X[i]), py(DATA_Y[i]));
        ctx.stroke();
      }
    }

    if (st && step.showPredictions) {
      ctx.fillStyle = "#e2b44a";
      for (var j = 0; j < DATA_X.length; j++) {
        ctx.beginPath();
        ctx.arc(px(DATA_X[j]), py(st.w * DATA_X[j] + st.b), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "#7ee8bd";
    for (var k = 0; k < DATA_X.length; k++) {
      ctx.beginPath();
      ctx.arc(px(DATA_X[k]), py(DATA_Y[k]), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render(index) {
    var step = steps[index];
    var st = step.state;
    labelEl.textContent = step.label;
    showExplanation(index);
    statW.textContent = st ? String(st.w) : "-";
    statB.textContent = st ? String(st.b) : "-";
    statMse.textContent = step.showMse && st ? String(st.mse) : "-";
    draw(step);
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
