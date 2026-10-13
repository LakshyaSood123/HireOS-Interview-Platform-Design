  var steps = [
    { id: "linear-score", label: "A linear score", caption: "Like linear regression, a logistic classifier starts with a linear score z = w·x + b. With w = 1 and b = −4 the score is z = spam score − 4." },
    { id: "unbounded-score", label: "An unbounded score", caption: "z can be any number, from minus infinity to plus infinity. Email 0.5 has z = −3.5 and email 9 has z = 5. But a probability must stay between 0 and 1." },
    { id: "sigmoid", label: "The sigmoid squashes", caption: "The sigmoid σ(z) = 1 / (1 + e^(−z)) squeezes any z into the range from 0 to 1 and keeps the order. Plotted, it is an S-shaped curve." },
    { id: "map-negative", label: "Negative score: probability near 0", caption: "A negative score maps to a low probability. z = −3 gives σ(−3) = 0.047: very unlikely to be spam." },
    { id: "map-zero", label: "Zero score: probability 0.5", caption: "A score of exactly 0 maps to probability 0.5: the model is undecided. This is the decision boundary." },
    { id: "map-positive", label: "Positive score: probability near 1", caption: "A positive score maps to a high probability. z = 3 gives σ(3) = 0.953: very likely spam. The curve is steep in the middle and flat at the ends." },
    { id: "probability", label: "Probabilities for our emails", caption: "Each email gets z = score − 4 and then a probability: 0.5 gives 0.03, 4.5 gives 0.62, 9 gives 0.99. Order is preserved, nothing leaves the range from 0 to 1." },
    { id: "threshold", label: "Apply a threshold", caption: "A threshold of 0.5 on the probability is the same as z ≥ 0, which is a spam score of at least 4. So the decision boundary sits where z = 0." },
    { id: "classification", label: "The whole chain", caption: "Features → linear score → sigmoid → probability → threshold → class. For the email with score 7.5: z = 3.5, probability 0.971, at least 0.5, so spam. The sigmoid is a function; logistic regression is the model that learns w and b." }
  ];

  // Plot A: linear score z against spam score.
  var A = makeGraph(80, 190, 48, 30);
  var plotA = el("g", {}, svg);
  clipTo("clipA", 60, 36, 540, 310);
  el("line", { x1: A.x(0), y1: A.y(0), x2: A.x(10), y2: A.y(0), class: "axis" }, plotA);
  el("line", { x1: A.x(0), y1: A.y(-5.5), x2: A.x(0), y2: A.y(5.5), class: "axis" }, plotA);
  [0, 2, 4, 6, 8, 10].forEach(function (t) { txt(plotA, A.x(t), A.y(0) + 16, "tick", String(t), "middle"); });
  [-4, -2, 2, 4].forEach(function (t) { txt(plotA, A.x(0) - 8, A.y(t) + 4, "tick", String(t), "end"); });
  txt(plotA, A.x(10), A.y(0) - 8, "note", "spam score x", "end");
  txt(plotA, A.x(0) + 8, 44, "note", "linear score z", "start");
  el("path", { class: "curve-y", d: wbPath(A, 1, -4, 0, 10), "clip-path": "url(#clipA)" }, plotA);
  txt(plotA, A.x(6.2), A.y(2.2) - 12, "lbl lbl-y", "z = 1·x − 4", "start");
  var emailPtsA = EMAILS.map(function (e) { return el("circle", { cx: A.x(e[0]), cy: A.y(e[0] - 4), r: 6, fill: colorOf(e[1]), stroke: "#071510", "stroke-width": 2 }, plotA); });
  var infG = el("g", {}, svg);
  var u1 = arrow(infG, "y", 4); setLine(u1, 590, 150, 590, 52);
  txt(infG, 580, 66, "lbl lbl-y", "+∞", "end");
  var u2 = arrow(infG, "y", 4); setLine(u2, 38, 230, 38, 336);
  txt(infG, 48, 330, "lbl lbl-y", "−∞", "start");
  card(infG, 330, 250, 250, 60, "fillB");
  txt(infG, 455, 276, "lbl lbl-p", "z can be any number", "middle");
  txt(infG, 455, 296, "note", "a probability must stay in [0, 1]", "middle");

  // Plot B: the sigmoid.
  var Bz = makeGraph(320, 300, 44, 230);
  var plotB = el("g", {}, svg);
  el("line", { x1: Bz.x(-6.3), y1: Bz.y(0), x2: Bz.x(6.3), y2: Bz.y(0), class: "axis" }, plotB);
  el("line", { x1: Bz.x(0), y1: Bz.y(0), x2: Bz.x(0), y2: Bz.y(1.05), class: "axis" }, plotB);
  [-6, -4, -2, 0, 2, 4, 6].forEach(function (t) { txt(plotB, Bz.x(t), Bz.y(0) + 16, "tick", String(t), "middle"); });
  [0, 0.5, 1].forEach(function (t) { txt(plotB, Bz.x(-6.3) - 4, Bz.y(t) + 4, "tick", String(t), "end"); });
  txt(plotB, Bz.x(6.3), Bz.y(0) + 32, "note", "linear score z", "end");
  txt(plotB, Bz.x(0) + 8, 62, "note", "probability σ(z)", "start");
  el("line", { x1: Bz.x(-6.3), y1: Bz.y(1), x2: Bz.x(6.3), y2: Bz.y(1), stroke: "rgba(201,220,207,0.35)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, plotB);
  var sig = el("path", { class: "curve", d: curveD(Bz, sigm, -6.2, 6.2, 80) }, plotB);
  txt(plotB, Bz.x(-6.1), Bz.y(0.1) - 6, "lbl lbl-y", "σ(z) = 1 / (1 + e^(−z))", "start");

  var markG = el("g", {}, svg);
  var mDrop = el("line", { stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "5 4" }, markG);
  var mDrop2 = el("line", { stroke: "#e6f5ec", "stroke-width": 2, "stroke-dasharray": "5 4" }, markG);
  var mDot = el("circle", { r: 8, fill: "#e2b44a", stroke: "#071510", "stroke-width": 3 }, markG);
  var mTxt = txt(markG, 0, 0, "lbl lbl-y", "", "middle");
  var mailG = el("g", {}, svg);
  var mailDots = EMAILS.map(function (e) { return el("circle", { cx: Bz.x(e[0] - 4), cy: Bz.y(probOf(e[0])), r: 7, fill: colorOf(e[1]), stroke: "#071510", "stroke-width": 2 }, mailG); });
  var thrG = el("g", {}, svg);
  el("rect", { x: Bz.x(0), y: Bz.y(1), width: Bz.x(6.3) - Bz.x(0), height: Bz.y(0) - Bz.y(1), fill: "rgba(244,114,182,0.12)" }, thrG);
  el("rect", { x: Bz.x(-6.3), y: Bz.y(1), width: Bz.x(0) - Bz.x(-6.3), height: Bz.y(0) - Bz.y(1), fill: "rgba(56,189,248,0.12)" }, thrG);
  el("line", { x1: Bz.x(-6.3), y1: Bz.y(0.5), x2: Bz.x(6.3), y2: Bz.y(0.5), stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "7 5" }, thrG);
  el("line", { x1: Bz.x(0), y1: Bz.y(0), x2: Bz.x(0), y2: Bz.y(1.0), stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "7 5" }, thrG);
  txt(thrG, Bz.x(-3.2), Bz.y(0.5) - 8, "lbl lbl-y", "threshold 0.5", "middle");
  txt(thrG, Bz.x(3.3), Bz.y(0.2), "lbl lbl-p", "z ≥ 0: spam", "middle");
  txt(thrG, Bz.x(-3.3), Bz.y(0.8), "lbl lbl-b", "z < 0: not spam", "middle");
  txt(thrG, Bz.x(0) + 8, Bz.y(0.06), "note", "boundary: score 4", "start");

  var chainG = el("g", {}, svg);
  var CH = [["features", "score 7.5", "fillB"], ["linear score", "z = 3.5", "fillA"], ["sigmoid", "σ(3.5)", "fillG"], ["probability", "0.971", "fillA"], ["threshold", "≥ 0.5 ?", "fillG"], ["class", "spam", "fillB"]];
  CH.forEach(function (c, k) {
    var x = 12 + k * 104;
    card(chainG, x, 110, 92, 96, c[2]);
    txt(chainG, x + 46, 140, "note", c[0], "middle");
    txt(chainG, x + 46, 176, "lbl", c[1], "middle");
    if (k < 5) { var ar = arrow(chainG, "w", 3); setLine(ar, x + 94, 158, x + 102, 158); }
  });
  txt(chainG, 320, 250, "lbl lbl-y", "sigmoid = a function     logistic regression = a model that learns w and b", "middle");

  function mark(zv, label) {
    var p = sigm(zv);
    mDot.setAttribute("cx", Bz.x(zv)); mDot.setAttribute("cy", Bz.y(p));
    setLine(mDrop, Bz.x(zv), Bz.y(p), Bz.x(zv), Bz.y(0));
    setLine(mDrop2, Bz.x(zv), Bz.y(p), Bz.x(-6.3), Bz.y(p));
    mTxt.setAttribute("x", Bz.x(zv) + (zv < 0 ? 12 : -12)); mTxt.setAttribute("y", Bz.y(p) + (zv < 0 ? -14 : 24));
    mTxt.setAttribute("text-anchor", zv < 0 ? "start" : "end");
    mTxt.textContent = label || ("z = " + zv + "  →  " + p.toFixed(3));
  }

  function render(index, id) {
    var i = index;
    show(plotA, i <= 1); show(infG, i === 1);
    emailPtsA.forEach(function (d) { show(d, i === 1); });
    show(plotB, i >= 2 && i <= 7);
    show(sig, i >= 2 && i <= 7);
    show(markG, i >= 3 && i <= 5);
    show(mailG, i === 6 || i === 7);
    show(thrG, i === 7);
    show(chainG, i === 8);
    if (i === 3) mark(-3);
    if (i === 4) mark(0);
    if (i === 5) mark(3);
    if (i === 2) anim("sig", 1200, function (e) { sig.setAttribute("d", curveD(Bz, sigm, -6.2, lerp(-6.2, 6.2, e), 80)); });
    else sig.setAttribute("d", curveD(Bz, sigm, -6.2, 6.2, 80));
  }
