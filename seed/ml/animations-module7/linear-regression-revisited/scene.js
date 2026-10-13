  var steps = [
    { id: "dataset", label: "The house dataset", caption: "Five training houses: size x (in 100 m²) against price y (in $100k). Bigger houses cost more, and the points lie close to a line, though not exactly on it." },
    { id: "initial-line", label: "A first guess at a line", caption: "A linear model is ŷ = w·x + b. Our first guess is w = 0.5, b = 2.0: a gentle line that clearly misses the cloud of houses." },
    { id: "change-slope", label: "Change the slope w", caption: "The weight w is the slope. Raising it from 0.5 to 1.5 tilts the line upward, and the right-hand houses are now close to it." },
    { id: "change-intercept", label: "Change the intercept b", caption: "The bias b is the intercept. Lowering it from 2.0 to 0.5 slides the whole line down, and now it runs through the middle of the houses." },
    { id: "predictions", label: "Predictions on the line", caption: "For each house the prediction ŷ is the height of the line at its size: 2.0, 2.75, 3.5, 4.25 and 5.0." },
    { id: "residuals", label: "Residuals: prediction minus target", caption: "Each residual is ŷ − y, the prediction minus the true price: 0, −0.05, −0.20, +0.15, −0.20. Positive means the line is too high, negative too low." },
    { id: "compare-fit", label: "Compare the two lines", caption: "The tuned line leaves much smaller residuals than the first guess. A good line is one whose residuals are small overall." },
    { id: "training-question", label: "The training question", caption: "Training means choosing w and b so the residuals are small overall. To compare lines we need one number that summarizes all five residuals: that is the next lesson." }
  ];

  var g = housePlot(svg, 52, 318, 96, 44, 3.8, 6.4);
  clipTo("plotclip", 52, 30, 380, 292);
  var P = { w: 0.5, b: 2.0 };

  var ghostLine = el("path", { class: "ghost", d: wbPath(g, 0.5, 2.0, 0, 3.8), "clip-path": "url(#plotclip)", "stroke-dasharray": "6 5" }, svg);
  var fitLine = el("path", { class: "curve-g", d: "M 0 0", "clip-path": "url(#plotclip)" }, svg);
  var oldG = el("g", {}, svg);
  HOUSES.forEach(function (d) {
    var yh = 0.5 * d[0] + 2.0;
    el("line", { x1: g.x(d[0]) - 6, y1: g.y(yh), x2: g.x(d[0]) - 6, y2: g.y(d[1]), stroke: "rgba(201,220,207,0.65)", "stroke-width": 4, "stroke-linecap": "round" }, oldG);
  });
  var resG = el("g", {}, svg);
  var predG = el("g", {}, svg);
  var resLines = [], resTxt = [], predRings = [], predTxt = [];
  HOUSES.forEach(function (d, i) {
    resLines.push(el("line", { stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, resG));
    resTxt.push(txt(resG, g.x(d[0]) + 10, g.y(d[1]) + 4, "lbl lbl-r", "", "start"));
    predRings.push(el("circle", { r: 6, fill: "none", stroke: C_FIT, "stroke-width": 3 }, predG));
    predTxt.push(txt(predG, g.x(d[0]) - 8, g.y(d[1]) + 20, "note", "", "end"));
  });
  var dotsA = dotSet(svg, g, HOUSES, C_TRAIN, 6);

  // Readout panel.
  var panel = el("g", {}, svg);
  card(panel, 452, 44, 176, 120, "fillG");
  txt(panel, 540, 70, "lbl", "ŷ = w·x + b", "middle");
  var wTxt = txt(panel, 540, 100, "big", "", "middle");
  var bTxt = txt(panel, 540, 126, "big", "", "middle");
  txt(panel, 540, 150, "note", "two parameters", "middle");

  var cmp = el("g", {}, svg);
  card(cmp, 452, 180, 176, 100, "fillB");
  txt(cmp, 540, 202, "lbl", "average miss", "middle");
  var cmpA = txt(cmp, 540, 228, "mono", "", "middle");
  var cmpB = txt(cmp, 540, 252, "mono", "", "middle");
  txt(cmp, 540, 272, "note", "(mean of squared residuals)", "middle");

  var qG = el("g", {}, svg);
  card(qG, 452, 180, 176, 120, "fillB");
  txt(qG, 540, 206, "lbl lbl-p", "next question", "middle");
  txt(qG, 540, 232, "note", "five residuals are", "middle");
  txt(qG, 540, 248, "note", "too many to compare:", "middle");
  txt(qG, 540, 274, "big", "one score?", "middle");

  function setLineWB(w, b) {
    P.w = w; P.b = b;
    fitLine.setAttribute("d", wbPath(g, w, b, 0, 3.8));
    wTxt.textContent = "w = " + w.toFixed(2);
    bTxt.textContent = "b = " + b.toFixed(2);
  }
  function msePair(w, b) { return mseOf(function (x) { return w * x + b; }, HOUSES); }
  function setResiduals(w, b, on) {
    HOUSES.forEach(function (d, i) {
      var yh = w * d[0] + b;
      setLine(resLines[i], g.x(d[0]), g.y(yh), g.x(d[0]), g.y(d[1]));
      predRings[i].setAttribute("cx", g.x(d[0])); predRings[i].setAttribute("cy", g.y(yh));
      predTxt[i].setAttribute("x", g.x(d[0]) - 9); predTxt[i].setAttribute("y", g.y(yh) + 18);
      predTxt[i].textContent = yh.toFixed(2);
      resTxt[i].textContent = sgn(yh - d[1]);
      resTxt[i].setAttribute("y", g.y((yh + d[1]) / 2) + 4);
    });
  }

  function render(index, id) {
    var i = index;
    show(fitLine, i >= 1);
    show(panel, i >= 1);
    show(ghostLine, i >= 6);
    show(predG, i === 4 || i === 5);
    show(resG, i === 5 || i === 6);
    show(oldG, i === 6);
    show(cmp, i === 6);
    show(qG, i === 7);
    if (i === 0) return;
    if (i === 1) setLineWB(0.5, 2.0);
    if (i === 2) anim("w", 1000, function (e) { setLineWB(lerp(0.5, 1.5, e), 2.0); });
    if (i === 3) anim("b", 1000, function (e) { setLineWB(1.5, lerp(2.0, 0.5, e)); });
    if (i >= 4) {
      setLineWB(1.5, 0.5);
      setResiduals(1.5, 0.5);
    }
    if (i === 6) {
      cmpA.textContent = "first guess  " + msePair(0.5, 2.0).toFixed(3);
      cmpB.textContent = "tuned line   " + msePair(1.5, 0.5).toFixed(3);
      resTxt.forEach(function (n) { n.textContent = ""; });
    }
  }
