(function () {
  // Each step lists only the stage cards it needs (no empty boxes). Arrows are
  // drawn between consecutive cards, so every step reads left to right.
  // kind: "" normal, "pred" prediction, "actual" actual answer.
  var steps = [
    {
      id: "rules",
      label: "Rules",
      stages: [
        { title: "Rules + input", sub: "written by a person" },
        { title: "Program", sub: "follows the rules" },
        { title: "Output", sub: "e.g. spam" },
      ],
      caption: "Traditional software: a person writes every rule, and the program turns input into output.",
    },
    {
      id: "data",
      label: "Data",
      stages: [
        { title: "Examples", sub: "emails marked spam or not" },
        { title: "Learning algorithm", sub: "looks for patterns" },
        { title: "Model", sub: "the learned result" },
      ],
      caption: "Machine learning starts from examples instead of hand-written rules.",
    },
    {
      id: "train",
      label: "Train",
      stages: [
        { title: "Examples", sub: "emails marked spam or not" },
        { title: "Training", sub: "adjusts the model" },
        { title: "Learned pattern", sub: "what spam looks like" },
      ],
      caption: "Training adjusts the model so its pattern fits the examples it was shown.",
    },
    {
      id: "unseen-input",
      label: "Unseen input",
      stages: [
        { title: "New example", sub: "\"You won a free prize!\"" },
        { title: "Trained model", sub: "learned from earlier emails" },
        { title: "Prediction", sub: "spam or not spam?", kind: "pred" },
      ],
      caption: "A new example the model never saw during training is given to the trained model.",
    },
    {
      id: "generalize",
      label: "Generalize",
      stages: [
        { title: "New example", sub: "\"You won a free prize!\"" },
        { title: "Trained model", sub: "learned from earlier emails" },
        { title: "Prediction", sub: "Spam", kind: "pred" },
        { title: "Actual label", sub: "Spam ✓", kind: "actual" },
      ],
      match: true,
      caption: "A useful model predicts well on data it did not memorize.",
    },
  ];

  var current = 0;
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"rules": {"h": "TRADITIONAL SOFTWARE", "t": "In traditional software **a person writes every rule**. The program follows those rules to turn an input (say, an email) into an output (spam or not). It can only handle what its rules cover."}, "data": {"h": "MACHINE LEARNING STARTS FROM EXAMPLES", "t": "Instead of hand-written rules, we start with **examples**: emails already marked spam or not spam. A **learning algorithm** looks for patterns in them and produces a **model**."}, "train": {"h": "TRAINING", "t": "**Training** adjusts the model so its pattern fits the examples it was shown. What the model keeps is a **learned pattern** of what spam looks like, not a list of memorized emails."}, "unseen-input": {"h": "A NEW EXAMPLE ARRIVES", "t": "A **new email** that the model **never saw during training** is given to the trained model. The model must now decide, spam or not spam, using only what it learned."}, "generalize": {"h": "WHY THIS SHOWS GENERALIZATION", "t": "The model correctly labels a **new email it never saw during training**. Because its prediction matches the actual label, it has learned a pattern that **transfers to unseen data** rather than merely memorizing earlier examples."}};

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
  var flowEl = document.getElementById("flow");
  var matchEl = document.getElementById("match");

  function card(stage) {
    var el = document.createElement("div");
    el.className = "node on" + (stage.kind ? " " + stage.kind : "");
    var t = document.createElement("div");
    t.className = "node-title";
    t.textContent = stage.title;
    var s = document.createElement("div");
    s.className = "node-sub";
    s.textContent = stage.sub;
    el.appendChild(t);
    el.appendChild(s);
    return el;
  }

  function arrow() {
    var el = document.createElement("div");
    el.className = "arrow";
    el.textContent = "→";
    return el;
  }

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.label;
    showExplanation(index);
    flowEl.innerHTML = "";
    step.stages.forEach(function (stage, i) {
      if (i > 0) flowEl.appendChild(arrow());
      flowEl.appendChild(card(stage));
    });
    matchEl.className = step.match ? "match on" : "match";
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
