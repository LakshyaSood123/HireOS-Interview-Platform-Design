(function () {
  var NS = "http://www.w3.org/2000/svg";
  var N = 24;
  var TRAIN_COUNT = 17;
  var VALIDATION_COUNT = 4;

  var steps = [
    { id: "full-dataset", label: "Full dataset", caption: "Start with one collection of 24 labelled examples. Nothing has been separated yet." },
    { id: "shuffle", label: "Shuffle", caption: "Shuffle first, so the split does not depend on the order the data was collected in." },
    { id: "train-split", label: "Train split", caption: "About 70% go to TRAIN. This ratio is an illustration, not a required rule." },
    { id: "validation-split", label: "Validation split", caption: "About 15% go to VALIDATION. They are held out from training and used to compare choices." },
    { id: "test-split", label: "Test split", caption: "The rest, about 15%, go to TEST. They stay locked away until the very end." },
    { id: "training", label: "Training", caption: "Only TRAIN examples fit the model's parameters." },
    { id: "validation", label: "Validation", caption: "VALIDATION scores compare candidate models and settings. The best one is chosen here." },
    { id: "final-test", label: "Final test", caption: "TEST is used once, for an unbiased estimate. It was never used to train or to choose." }
  ];

  // Deterministic shuffle so every run looks identical.
  var seed = 7;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  var order = [];
  for (var i = 0; i < N; i++) order.push(i);
  for (var j = N - 1; j > 0; j--) {
    var k = Math.floor(rnd() * (j + 1));
    var tmp = order[j];
    order[j] = order[k];
    order[k] = tmp;
  }
  var groupOf = [];
  for (var p = 0; p < N; p++) {
    var sample = order[p];
    groupOf[sample] = p < TRAIN_COUNT ? "train" : p < TRAIN_COUNT + VALIDATION_COUNT ? "validation" : "test";
  }

  var COLOR = { none: "#8FA89C", train: "#1DB584", validation: "#E2B44A", test: "#F472B6" };
  var DIM = "rgba(143,168,156,0.3)";
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");
  var explainHeadEl = document.getElementById("explain-h");
  // Per-step explanations (mirrors explain.json in this package folder). **bold** markers become <strong>.
  var EXPLAIN = {"full-dataset": {"h": "WHAT YOU ARE LOOKING AT", "t": "We start with one collection of **24 labelled examples**. Nothing has been separated yet, so any score measured now would not be a fair test."}, "shuffle": {"h": "SHUFFLE", "t": "**Shuffle first**, so the split does not depend on the order the data happened to be collected in."}, "train-split": {"h": "TRAIN SPLIT", "t": "About **70%** go to **TRAIN**. This ratio is an illustration, not a required rule. This is the data the model **learns from**."}, "validation-split": {"h": "VALIDATION SPLIT", "t": "About **15%** go to **VALIDATION**. They are **held out from training** and used to compare choices, such as which model or setting works best."}, "test-split": {"h": "TEST SPLIT", "t": "The rest, about **15%**, go to **TEST**. They stay **locked away until the very end**, so they can give an honest final score."}, "training": {"h": "TRAINING", "t": "Only the **TRAIN** examples fit the model's parameters. The validation and test examples play no part in learning."}, "validation": {"h": "VALIDATION", "t": "**VALIDATION** scores compare candidate models and settings. The best one is chosen here, using data the model did not train on."}, "final-test": {"h": "TAKEAWAY", "t": "**TEST** is used **once**, for an unbiased estimate. It was **never used to train or to choose**, which is why its score can be trusted."}};

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
  var countsEl = document.getElementById("counts");
  var frameLayer = document.getElementById("frame");
  var zonesLayer = document.getElementById("zones");
  var flowLayer = document.getElementById("flow");
  var boxesLayer = document.getElementById("boxes");
  var dotsLayer = document.getElementById("dots");

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function text(parent, x, y, cls, content, anchor) {
    var t = el("text", { x: x, y: y, class: cls }, parent);
    if (anchor) t.setAttribute("text-anchor", anchor);
    t.textContent = content;
    return t;
  }

  // Layout (viewBox 640 x 400). Row 1: three regions. Row 2: Model and
  // Compare/Tune. Row 3: Final Evaluation. Every row has its own band, so
  // nothing overlaps.
  var ZONE = {
    train: { x: 10, y: 28, w: 280, h: 160 },
    validation: { x: 305, y: 28, w: 160, h: 160 },
    test: { x: 480, y: 28, w: 150, h: 160 }
  };
  var BOX = {
    model: { x: 30, y: 232, w: 220, h: 60 },
    compare: { x: 300, y: 232, w: 160, h: 60 },
    final: { x: 400, y: 322, w: 230, h: 64 }
  };

  // One arrowhead shared by every flow line.
  var defs = el("defs", {}, flowLayer);
  var marker = el("marker", { id: "arrowhead", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, defs);
  el("path", { d: "M0 0 L10 5 L0 10 Z", class: "arrow-head" }, marker);

  // One frame for the unsplit dataset (steps 1 and 2). Nothing is assigned yet.
  var frameGroup = el("g", { class: "frame-group" }, frameLayer);
  el("rect", { x: 10, y: 28, width: 620, height: 160, rx: 12, class: "frame" }, frameGroup);
  text(frameGroup, 22, 48, "frame-title", "DATASET");

  // Examples that are not assigned yet wait in a dashed REMAINING frame. It is
  // never one of the three regions, so nothing looks assigned before its step.
  var poolGroup = el("g", { class: "frame-group" }, frameLayer);
  var poolRect = el("rect", { x: 305, y: 28, width: 325, height: 160, rx: 12, class: "frame" }, poolGroup);
  var poolTitle = text(poolGroup, 317, 48, "frame-title", "REMAINING");

  var ZONE_LABEL = { train: "TRAIN", validation: "VALIDATION", test: "TEST" };
  var zoneGroups = {};
  ["train", "validation", "test"].forEach(function (name) {
    var z = ZONE[name];
    var g = el("g", { class: "zone-group" }, zonesLayer);
    el("rect", { x: z.x, y: z.y, width: z.w, height: z.h, rx: 12, class: "zone zone-" + name }, g);
    text(g, z.x + 12, z.y + 20, "zone-title zone-title-" + name, ZONE_LABEL[name]);
    if (name === "test") {
      text(g, z.x + z.w / 2, z.y + z.h - 30, "zone-note", "Held out until the end", "middle");
      text(g, z.x + z.w / 2, z.y + z.h - 14, "zone-note", "Do not train on this", "middle");
    }
    zoneGroups[name] = g;
  });

  function box(name, title) {
    var b = BOX[name];
    var g = el("g", { class: "box box-" + name }, boxesLayer);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10 }, g);
    text(g, b.x + b.w / 2, b.y + (name === "final" ? 18 : 20), "box-title", title, "middle");
  }
  box("model", "MODEL");
  box("compare", "COMPARE / TUNE");
  box("final", "FINAL EVALUATION");
  var finalSub = text(boxesLayer, BOX.final.x + BOX.final.w / 2, BOX.final.y + BOX.final.h - 8, "box-sub", "Once, after all choices are fixed", "middle");

  function arrow(x1, y1, x2, y2) {
    return el("line", { x1: x1, y1: y1, x2: x2, y2: y2, class: "flow-line", "marker-end": "url(#arrowhead)" }, flowLayer);
  }
  var compareCenter = BOX.compare.x + BOX.compare.w / 2;
  var finalMid = BOX.final.y + BOX.final.h / 2;
  var arrows = {
    trainModel: arrow(130, ZONE.train.y + ZONE.train.h + 2, 130, BOX.model.y - 4),
    valCompare: arrow(compareCenter, ZONE.validation.y + ZONE.validation.h + 2, compareCenter, BOX.compare.y - 4),
    modelCompare: arrow(BOX.model.x + BOX.model.w + 2, 262, BOX.compare.x - 4, 262),
    // Elbow: down from Compare/Tune, then right into Final Evaluation.
    compareFinal: el("path", { d: "M" + compareCenter + " " + (BOX.compare.y + BOX.compare.h + 2) + " V" + finalMid + " H" + (BOX.final.x - 4), class: "flow-line", fill: "none", "marker-end": "url(#arrowhead)" }, flowLayer),
    testFinal: arrow(555, ZONE.test.y + ZONE.test.h + 2, 555, BOX.final.y - 4)
  };

  var dots = [];
  for (var s = 0; s < N; s++) {
    dots.push(el("circle", { r: 8, class: "dot", fill: COLOR.none }, dotsLayer));
  }

  function place(node, x, y, r) {
    node.style.cx = x + "px";
    node.style.cy = y + "px";
    node.style.r = r + "px";
  }

  var slotInGroup = [];
  var rankOf = [];
  var counters = { train: 0, validation: 0, test: 0 };
  for (var q = 0; q < N; q++) {
    var sampleIdx = order[q];
    var gname = groupOf[sampleIdx];
    slotInGroup[sampleIdx] = counters[gname]++;
    rankOf[sampleIdx] = q;
  }

  function gridPosition(index) {
    return { x: 80 + (index % 8) * 70, y: 70 + Math.floor(index / 8) * 50 };
  }
  function scatterPosition(index) {
    return { x: 50 + (((index * 97) % 23) / 23) * 540, y: 56 + (((index * 53) % 17) / 17) * 110 };
  }
  // Examples not yet assigned wait here as neutral gray dots, in a stable spot
  // by shuffled rank, so they do not jump when the others leave.
  function poolPosition(rank, stepId) {
    var idx = rank - TRAIN_COUNT;
    if (stepId === "validation-split") {
      // Only the TEST examples remain: three in a row, right-hand frame.
      return { x: 510 + (idx - VALIDATION_COUNT) * 45, y: 96 };
    }
    return { x: 345 + (idx % 4) * 70, y: 86 + Math.floor(idx / 4) * 44 };
  }
  // Slot inside its region (row 1).
  function zoneSlot(name, slot) {
    var z = ZONE[name];
    if (name === "train") return { x: z.x + 30 + (slot % 6) * 44, y: z.y + 54 + Math.floor(slot / 6) * 38 };
    if (name === "validation") return { x: z.x + 50 + (slot % 2) * 60, y: z.y + 62 + Math.floor(slot / 2) * 40 };
    return { x: z.x + 30 + (slot % 3) * 45, y: z.y + 62 };
  }
  // Small slot inside a downstream box (rows 2 and 3).
  function boxSlot(name, slot, count) {
    var b = BOX[name];
    if (name === "final") return { x: b.x + b.w / 2 - 14 + slot * 14, y: b.y + 36 };
    var spacing = 12;
    var rowWidth = (count - 1) * spacing;
    return { x: b.x + b.w / 2 - rowWidth / 2 + slot * spacing, y: b.y + 44 };
  }

  var current = 0;
  function setClass(node, cls, on) {
    if (on) node.classList.add(cls);
    else node.classList.remove(cls);
  }

  function render(index) {
    var step = steps[index];
    labelEl.textContent = step.label;
    showExplanation(index);
    var id = step.id;
    var testCount = N - TRAIN_COUNT - VALIDATION_COUNT;
    // The counter only reports what has actually been assigned by this step.
    countsEl.textContent =
      index < 2 ? N + " examples"
      : index === 2 ? "Train " + TRAIN_COUNT
      : index === 3 ? "Train " + TRAIN_COUNT + " · Validation " + VALIDATION_COUNT
      : "Train " + TRAIN_COUNT + " · Validation " + VALIDATION_COUNT + " · Test " + testCount;

    // Steps 1-2: one unsplit dataset frame, no regions. Then regions appear one by one.
    frameGroup.setAttribute("opacity", index < 2 ? "1" : "0");
    // Each region appears only at its own split step.
    zoneGroups.train.setAttribute("opacity", index >= 2 ? "1" : "0");
    zoneGroups.validation.setAttribute("opacity", index >= 3 ? "1" : "0");
    zoneGroups.test.setAttribute("opacity", index >= 4 ? "1" : "0");
    // The REMAINING frame covers whatever has not been assigned yet.
    poolGroup.setAttribute("opacity", index === 2 || index === 3 ? "1" : "0");
    if (index === 2) { poolRect.setAttribute("x", 305); poolRect.setAttribute("width", 325); poolTitle.setAttribute("x", 317); }
    if (index === 3) { poolRect.setAttribute("x", 480); poolRect.setAttribute("width", 150); poolTitle.setAttribute("x", 492); }
    zonesLayer.querySelectorAll(".zone").forEach(function (node) { node.classList.remove("on"); });
    var zoneOn = { "train-split": "train", "validation-split": "validation", "test-split": "test", training: "train", validation: "validation", "final-test": "test" }[id];
    if (zoneOn) zonesLayer.querySelector(".zone-" + zoneOn).classList.add("on");

    dots.forEach(function (node, i) {
      var group = groupOf[i];
      var slot = slotInGroup[i];
      var pos;
      var fill = COLOR.none;
      var r = 8;
      if (id === "full-dataset") {
        pos = gridPosition(i);
      } else if (id === "shuffle") {
        pos = scatterPosition(i);
      } else if (id === "train-split") {
        if (group === "train") { pos = zoneSlot("train", slot); fill = COLOR.train; }
        else pos = poolPosition(rankOf[i], id);
      } else if (id === "validation-split") {
        if (group === "test") pos = poolPosition(rankOf[i], id);
        else { pos = zoneSlot(group, slot); fill = COLOR[group]; }
      } else if (id === "test-split") {
        pos = zoneSlot(group, slot);
        fill = COLOR[group];
      } else if (id === "training") {
        if (group === "train") { pos = boxSlot("model", slot, TRAIN_COUNT); fill = COLOR.train; r = 4.5; }
        else { pos = zoneSlot(group, slot); fill = DIM; }
      } else if (id === "validation") {
        if (group === "validation") { pos = boxSlot("compare", slot, VALIDATION_COUNT); fill = COLOR.validation; r = 4.5; }
        else if (group === "train") { pos = boxSlot("model", slot, TRAIN_COUNT); fill = DIM; r = 4.5; }
        else { pos = zoneSlot(group, slot); fill = DIM; }
      } else {
        // final-test
        if (group === "test") { pos = boxSlot("final", slot, 3); fill = COLOR.test; r = 5; }
        else if (group === "train") { pos = boxSlot("model", slot, TRAIN_COUNT); fill = DIM; r = 4.5; }
        else { pos = boxSlot("compare", slot, VALIDATION_COUNT); fill = DIM; r = 4.5; }
      }
      node.setAttribute("fill", fill);
      place(node, pos.x, pos.y, r);
    });

    // Downstream boxes: active now, done earlier, or idle.
    var state = {
      model: id === "training" ? "active" : index > 5 ? "done" : "",
      compare: id === "validation" ? "active" : index > 6 ? "done" : "",
      final: id === "final-test" ? "active" : ""
    };
    ["model", "compare", "final"].forEach(function (name) {
      var node = boxesLayer.querySelector(".box-" + name);
      setClass(node, "active", state[name] === "active");
      setClass(node, "done", state[name] === "done");
    });
    finalSub.setAttribute("class", "box-sub" + (id === "final-test" ? " on" : ""));

    // Arrows stay subtle; one is highlighted only while its own step is active.
    var live = { trainModel: id === "training", valCompare: id === "validation", modelCompare: id === "validation", compareFinal: id === "final-test", testFinal: id === "final-test" };
    Object.keys(arrows).forEach(function (key) {
      arrows[key].setAttribute("class", "flow-line" + (live[key] ? " live" : ""));
    });
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
