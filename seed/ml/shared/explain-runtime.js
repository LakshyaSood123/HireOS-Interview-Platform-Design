
  // ── shared runtime: stepping, explanation panel, educational autoplay pacing, bridge ──
  var current = 0;
  var explainHeadEl = document.getElementById("explain-h");

  // **bold** markers in an explanation become <strong> nodes (built with DOM calls, never innerHTML).
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
    var ex = (typeof EXPLAIN === "object" && EXPLAIN) ? EXPLAIN[steps[index].id] : null;
    return ex || { h: "WHAT IS HAPPENING", t: steps[index].caption };
  }

  // Autoplay pace: 4.5 to 10.5 seconds per step, longer for longer explanations, so a learner can read.
  function stepMs(index) {
    var words = String(explanationFor(index).t).replace(/\*\*/g, "").split(/\s+/).length;
    return Math.max(4500, Math.min(10500, Math.round(3800 + words * 165)));
  }

  function renderStep(index) {
    var ex = explanationFor(index);
    labelEl.textContent = steps[index].label;
    if (explainHeadEl) explainHeadEl.textContent = ex.h;
    setRich(captionEl, ex.t);
    render(index, steps[index].id);
  }

  function goTo(index) {
    if (index < 0 || index >= steps.length) return;
    current = index;
    renderStep(current);
    if (window.ReagvisBridge) window.ReagvisBridge.stepChanged(steps[current].id);
  }

  renderStep(current);

  // Autoplay: exactly one timer, one step per tick, stops on the final step.
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
