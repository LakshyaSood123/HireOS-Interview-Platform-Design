  var steps = [
    { id: "prior", label: "The prior: belief before evidence", caption: "Before reading an email, 40 of every 100 are spam. So our starting belief, the prior, is P(spam) = 0.4. It is a belief held BEFORE looking at this email's words." },
    { id: "evidence", label: "The evidence arrives", caption: "Now the email arrives and it contains the word 'free'. That is the evidence. 30 of the 100 emails contain it (outlined)." },
    { id: "likelihood", label: "The likelihood: evidence given the cause", caption: "We can measure how often spam contains 'free': 24 of the 40 spam emails, so P(free | spam) = 0.6. This is the likelihood. Only 6 of 60 normal emails contain it: 0.1." },
    { id: "reverse-condition", label: "We need the condition reversed", caption: "We know P(free | spam): from the cause to the evidence. But what we want is P(spam | free): from the evidence back to the cause. Bayes' rule is the tool that turns one arrow around." },
    { id: "normalize", label: "Normalize by the total evidence", caption: "How often does 'free' show up at all? From spam: 0.6 × 0.4 = 0.24. From normal mail: 0.1 × 0.6 = 0.06. Together P(free) = 0.30. Dividing by it makes the two explanations share the evidence fairly." },
    { id: "posterior", label: "The posterior: the updated belief", caption: "P(spam | free) = likelihood × prior / evidence = 0.6 × 0.4 / 0.30 = 0.24 / 0.30 = 0.8. This is the posterior, the belief after seeing the evidence." },
    { id: "compare-before-after", label: "Before and after", caption: "The belief moved from 0.4 (prior) to 0.8 (posterior). The evidence was stronger for spam than for normal mail, so it pushed the belief up." },
    { id: "ml-connection", label: "How a classifier uses it", caption: "A naive Bayes classifier does exactly this: it estimates priors and likelihoods from data, then computes the posterior for each new email and predicts the more probable class." }
  ];

  function isFree(k) { return k < 30; }
  function isSpam(k) { return k < 24 || (k >= 30 && k < 46); }
  var dots = [];
  var gridG = el("g", {}, svg);
  for (var k = 0; k < 100; k++) {
    var c = Math.floor(k / 10), r = k % 10;
    dots.push(el("circle", { cx: 46 + c * 20, cy: 80 + r * 20, r: 7, fill: "#38bdf8" }, gridG));
  }
  var freeBox = el("rect", { x: 34, y: 68, width: 3 * 20 + 2, height: 10 * 20 - 2, rx: 8, fill: "none", stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "6 4" }, svg);
  txt(svg, 136, 56, "lbl", "100 emails", "middle");
  el("circle", { cx: 60, cy: 300, r: 6, fill: "#f472b6" }, svg);
  txt(svg, 70, 304, "note", "spam", "start");
  el("circle", { cx: 118, cy: 300, r: 6, fill: "#38bdf8" }, svg);
  txt(svg, 128, 304, "note", "not spam", "start");

  var RX = 276, RW = 340;
  function beliefBar(parent, y, value, label, color) {
    box(parent, RX, y, RW, 30, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 5);
    box(parent, RX, y, RW * value, 30, color, "none", 5);
    txt(parent, RX + 10, y + 21, "lbl", label, "start");
    txt(parent, RX + RW, y - 6, "note", "0 ←  belief that it is spam  → 1", "end");
  }

  var gPrior = el("g", {}, svg);
  card(gPrior, RX - 10, 56, RW + 20, 130, "fillG");
  txt(gPrior, RX, 82, "lbl lbl-g", "PRIOR  P(spam)", "start");
  box(gPrior, RX, 110, RW, 30, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 5);
  box(gPrior, RX, 110, RW * 0.4, 30, "rgba(244,114,182,0.85)", "none", 5);
  txt(gPrior, RX + RW * 0.4 + 8, 131, "mono", "0.4", "start");
  txt(gPrior, RX, 168, "note", "what we believe before looking at the email", "start");

  var gEvid = el("g", {}, svg);
  card(gEvid, RX - 10, 56, RW + 20, 130, "fillB");
  txt(gEvid, RX, 82, "lbl lbl-y", "EVIDENCE", "start");
  txt(gEvid, RX, 118, "big", "the email contains 'free'", "start");
  txt(gEvid, RX, 150, "note", "30 of 100 emails contain it (outlined)", "start");

  var gLike = el("g", {}, svg);
  card(gLike, RX - 10, 56, RW + 20, 150, "fillG");
  box(gLike, RX, 80, 100, 44, "rgba(244,114,182,0.25)", "#f472b6", 8);
  txt(gLike, RX + 50, 108, "lbl", "spam", "middle");
  box(gLike, RX + 220, 80, 110, 44, "rgba(226,180,74,0.2)", "#e2b44a", 8);
  txt(gLike, RX + 275, 108, "lbl", "has 'free'", "middle");
  var likeArrow = arrow(gLike, "p", 4); setLine(likeArrow, RX + 104, 102, RX + 216, 102);
  txt(gLike, RX + 160, 92, "lbl lbl-p", "P(free | spam) = 0.6", "middle");
  txt(gLike, RX, 176, "note", "24 of the 40 spam emails contain 'free'", "start");
  txt(gLike, RX, 196, "note", "(normal mail: 6 of 60 → P(free | not spam) = 0.1)", "start");

  var gRev = el("g", {}, svg);
  var revDash = el("line", { stroke: "#1db584", "stroke-width": 4, "stroke-dasharray": "8 6", "stroke-linecap": "round", "marker-end": "url(#ah-g)" }, gRev);
  setLine(revDash, RX + 216, 128, RX + 104, 128);
  txt(gRev, RX + 160, 154, "lbl lbl-g", "wanted: P(spam | free)", "middle");
  txt(gRev, RX, 226, "big", "Bayes' rule reverses the arrow", "start");

  var gNorm = el("g", {}, svg);
  card(gNorm, RX - 10, 56, RW + 20, 200, "fillB");
  txt(gNorm, RX, 80, "lbl lbl-y", "EVIDENCE TERM  P(free)", "start");
  var nw = 320;
  box(gNorm, RX, 100, nw * 0.8, 34, "rgba(244,114,182,0.85)", "none", 5);
  box(gNorm, RX + nw * 0.8, 100, nw * 0.2, 34, "rgba(56,189,248,0.85)", "none", 5);
  txt(gNorm, RX + nw * 0.4, 122, "lbl", "0.6 × 0.4 = 0.24", "middle");
  txt(gNorm, RX + nw * 0.9, 154, "lbl lbl-b", "0.1 × 0.6", "middle");
  txt(gNorm, RX + nw * 0.9, 170, "lbl lbl-b", "= 0.06", "middle");
  txt(gNorm, RX, 160, "note", "from spam   +   from normal mail", "start");
  txt(gNorm, RX, 218, "big", "P(free) = 0.24 + 0.06 = 0.30", "start");
  txt(gNorm, RX, 244, "note", "the total chance of seeing 'free'", "start");

  var gPost = el("g", {}, svg);
  card(gPost, RX - 10, 56, RW + 20, 200, "fillG");
  txt(gPost, RX, 82, "lbl lbl-g", "POSTERIOR", "start");
  txt(gPost, RX, 116, "mono", "P(spam | free) =", "start");
  txt(gPost, RX, 148, "mono", "0.6  ×  0.4  /  0.30", "start");
  txt(gPost, RX, 168, "note", "likelihood × prior / evidence", "start");
  txt(gPost, RX, 214, "big", "= 0.24 / 0.30 = 0.8", "start").setAttribute("font-size", "20");

  var gCmp = el("g", {}, svg);
  card(gCmp, RX - 10, 56, RW + 20, 220, "fillG");
  txt(gCmp, RX, 82, "lbl", "before the evidence (prior)", "start");
  box(gCmp, RX, 92, RW, 30, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 5);
  box(gCmp, RX, 92, RW * 0.4, 30, "rgba(244,114,182,0.55)", "none", 5);
  txt(gCmp, RX + RW * 0.4 + 8, 113, "mono", "0.4", "start");
  var upArrow = arrow(gCmp, "g", 4); setLine(upArrow, RX + RW * 0.4, 128, RX + RW * 0.4, 168);
  txt(gCmp, RX + RW * 0.4 + 12, 154, "lbl lbl-g", "evidence 'free' pushes it up", "start");
  txt(gCmp, RX, 192, "lbl", "after the evidence (posterior)", "start");
  box(gCmp, RX, 202, RW, 30, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 5);
  box(gCmp, RX, 202, RW * 0.8, 30, "rgba(244,114,182,0.95)", "none", 5);
  txt(gCmp, RX + RW * 0.8 + 8, 223, "mono", "0.8", "start");

  var gML = el("g", {}, svg);
  box(gML, RX - 10, 70, 110, 52, "rgba(56,189,248,0.18)", "#38bdf8", 8);
  txt(gML, RX + 45, 92, "note", "email words", "middle");
  txt(gML, RX + 45, 110, "lbl", "(evidence)", "middle");
  var a1 = arrow(gML, "w", 3); setLine(a1, RX + 104, 96, RX + 134, 96);
  box(gML, RX + 138, 62, 150, 68, "rgba(29,181,132,0.18)", "#1db584", 8);
  txt(gML, RX + 213, 86, "lbl", "prior × likelihood", "middle");
  txt(gML, RX + 213, 104, "lbl", "/ evidence", "middle");
  txt(gML, RX + 213, 122, "note", "Bayes' rule", "middle");
  var a2 = arrow(gML, "w", 3); setLine(a2, RX + 213, 134, RX + 213, 156);
  box(gML, RX - 10, 164, RW + 20, 34, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.25)", 5);
  box(gML, RX - 10, 164, (RW + 20) * 0.8, 34, "rgba(244,114,182,0.9)", "none", 5);
  txt(gML, RX + 130, 186, "lbl", "spam 0.8", "middle");
  txt(gML, RX + RW - 28, 186, "lbl", "0.2", "middle");
  txt(gML, RX + RW + 10, 214, "note", "not spam 0.2", "end");
  txt(gML, RX, 244, "big", "predict the more probable class: spam", "start");
  txt(gML, RX, 270, "note", "naive Bayes classifier", "start");

  function render(index, id) {
    var i = index;
    vis([gPrior], i === 0);
    vis([gEvid], i === 1);
    vis([gLike], i === 2 || i === 3);
    vis([gRev], i === 3);
    vis([gNorm], i === 4);
    vis([gPost], i === 5);
    vis([gCmp], i === 6);
    vis([gML], i === 7);
    show(freeBox, i >= 1 && i <= 5);
    for (var q = 0; q < 100; q++) {
      var d = dots[q], spam = isSpam(q), free = isFree(q);
      var op = 1, rad = 7, stroke = "none";
      if (i === 1) { op = free ? 1 : 0.5; }
      if (i === 2 || i === 3) { op = spam ? 1 : 0.4; if (spam && free) { rad = 8.5; stroke = "#ffffff"; } }
      if (i === 4) { op = free ? 1 : 0.15; }
      if (i === 5) { op = free ? (spam ? 1 : 0.5) : 0.15; if (free && spam) { rad = 8.5; stroke = "#ffffff"; } }
      d.setAttribute("fill", spam ? "#f472b6" : "#38bdf8");
      d.setAttribute("opacity", String(op));
      d.setAttribute("r", rad);
      d.setAttribute("stroke", stroke);
      d.setAttribute("stroke-width", stroke === "none" ? 0 : 2);
    }
  }
