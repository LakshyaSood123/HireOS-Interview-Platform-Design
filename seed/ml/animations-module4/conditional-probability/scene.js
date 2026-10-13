  var steps = [
    { id: "full-population", label: "All 100 emails", caption: "Here are 100 emails. Pick one at random. Every email is equally likely to be the one you get, so all 100 are in play." },
    { id: "event-a", label: "Event A: the email is spam", caption: "40 of the 100 emails are spam (pink). So P(spam) = 40 / 100 = 0.4. This is the probability before we know anything else." },
    { id: "observe-b", label: "New information: B = contains 'free'", caption: "Now you learn the email contains the word 'free'. 30 of the 100 emails contain it. We are being told the email is one of these 30." },
    { id: "restrict-to-b", label: "Restrict attention to B", caption: "Everything outside the dashed box is ruled out. The 'universe' we pick from shrank from 100 emails to 30. That is the heart of conditioning." },
    { id: "overlap", label: "The overlap: spam AND free", caption: "Inside the 30 'free' emails, 24 are spam (bright pink) and 6 are not. The overlap of A and B is 24 emails." },
    { id: "conditional-ratio", label: "The ratio: overlap / B", caption: "P(spam | free) = P(spam and free) / P(free) = 24/100 ÷ 30/100 = 24 / 30 = 0.8. The denominator changed from 100 to 30." },
    { id: "ml-connection", label: "Evidence changes the prediction", caption: "Before seeing the word, spam had probability 0.4. Given 'free', it is 0.8. A classifier makes every prediction this way: conditioned on the evidence it can see." }
  ];

  function isFree(k) { return k < 30; }
  function isSpam(k) { return k < 24 || (k >= 30 && k < 46); }
  var dots = [];
  var gridG = el("g", {}, svg);
  for (var k = 0; k < 100; k++) {
    var c = Math.floor(k / 10), r = k % 10;
    dots.push(el("circle", { cx: 52 + c * 26, cy: 66 + r * 26, r: 9, fill: "#8fa89c", stroke: "none" }, gridG));
  }
  var freeBox = el("rect", { x: 36, y: 50, width: 3 * 26 + 2, height: 10 * 26 - 2, rx: 10, fill: "none", stroke: "#e2b44a", "stroke-width": 3, "stroke-dasharray": "7 5" }, svg);
  var freeLbl = txt(svg, 36 + 40, 44, "lbl lbl-y", "contains 'free'", "middle");
  var legend = el("g", {}, svg);
  el("circle", { cx: 130, cy: 338, r: 7, fill: "#f472b6" }, legend);
  txt(legend, 142, 342, "note", "spam", "start");
  el("circle", { cx: 190, cy: 338, r: 7, fill: "#38bdf8" }, legend);
  txt(legend, 202, 342, "note", "not spam", "start");

  var panel = el("g", {}, svg);
  card(panel, 336, 50, 290, 130, "fillG");
  var p1 = txt(panel, 481, 78, "note", "", "middle");
  var p2 = txt(panel, 481, 108, "mono", "", "middle");
  var p3 = txt(panel, 481, 140, "big", "", "middle");
  var p4 = txt(panel, 481, 166, "note", "", "middle");

  var ratioG = el("g", {}, svg);
  txt(ratioG, 336, 218, "lbl", "inside the 30 'free' emails:", "start");
  var rSpam = box(ratioG, 336, 230, 0.8 * 290, 34, "rgba(244,114,182,0.85)", "none", 4);
  var rHam = box(ratioG, 336 + 0.8 * 290, 230, 0.2 * 290, 34, "rgba(56,189,248,0.85)", "none", 4);
  txt(ratioG, 336 + 0.4 * 290, 252, "lbl", "24 spam", "middle");
  txt(ratioG, 336 + 0.9 * 290, 252, "lbl", "6", "middle");
  txt(ratioG, 336, 290, "note", "the denominator changed: 100 → 30", "start");

  var compareG = el("g", {}, svg);
  txt(compareG, 336, 214, "lbl", "before the word 'free':", "start");
  box(compareG, 336, 222, 0.4 * 290, 28, "rgba(244,114,182,0.6)", "none", 4);
  txt(compareG, 336 + 0.4 * 290 + 8, 242, "mono", "P(spam) = 0.4", "start");
  txt(compareG, 336, 276, "lbl", "after seeing 'free':", "start");
  box(compareG, 336, 284, 0.8 * 290, 28, "rgba(244,114,182,0.9)", "none", 4);
  txt(compareG, 336 + 8, 304, "mono", "P(spam | free) = 0.8", "start");

  function render(index, id) {
    var i = index;
    show(freeBox, i >= 2 && i <= 5);
    show(freeLbl, i >= 2 && i <= 5);
    show(legend, i >= 1);
    show(ratioG, i === 5);
    show(compareG, i === 6);
    p1.textContent = ""; p2.textContent = ""; p3.textContent = ""; p4.textContent = "";
    for (var q = 0; q < 100; q++) {
      var d = dots[q], spam = isSpam(q), free = isFree(q);
      var fill = i === 0 ? "#8fa89c" : (spam ? "#f472b6" : "#38bdf8");
      var op = 1, rad = 9, stroke = "none";
      if (i === 1) { op = spam ? 1 : 0.35; }
      if (i === 2) { op = free ? 1 : 0.55; }
      if (i === 3) { op = free ? 1 : 0.1; }
      if (i === 4) { op = free ? (spam ? 1 : 0.5) : 0.1; if (free && spam) { rad = 10.5; stroke = "#ffffff"; } }
      if (i === 5) { op = free ? 1 : 0.1; }
      if (i === 6) { op = 1; }
      d.setAttribute("fill", fill);
      d.setAttribute("opacity", String(op));
      d.setAttribute("r", rad);
      d.setAttribute("stroke", stroke);
      d.setAttribute("stroke-width", stroke === "none" ? 0 : 2);
    }
    if (i === 0) { p1.textContent = "random email"; p2.textContent = "100 equally likely emails"; p3.textContent = "100"; }
    if (i === 1) { p1.textContent = "A = spam"; p2.textContent = "40 of 100"; p3.textContent = "P(spam) = 0.4"; }
    if (i === 2) { p1.textContent = "B = contains 'free'"; p2.textContent = "30 of 100"; p3.textContent = "P(free) = 0.3"; p4.textContent = "we learn: it is one of these 30"; }
    if (i === 3) { p1.textContent = "new universe"; p2.textContent = "30 emails (was 100)"; p3.textContent = "only B counts now"; }
    if (i === 4) { p1.textContent = "A and B"; p2.textContent = "24 spam emails with 'free'"; p3.textContent = "overlap = 24"; p4.textContent = "6 'free' emails are not spam"; }
    if (i === 5) { p1.textContent = "P(spam | free)"; p2.textContent = "= 24 / 30"; p3.textContent = "= 0.8"; p4.textContent = "overlap ÷ size of B"; }
    if (i === 6) { p1.textContent = "conditioning on evidence"; p2.textContent = "0.4  →  0.8"; p3.textContent = "belief moved up"; p4.textContent = "same data, new information"; }
  }
