  var steps = [
    { id: "data-points", label: "Ten emails on a line", caption: "Each email has one feature, its spam score from 0 to 10. Here the ten emails are placed on a score axis." },
    { id: "class-colors", label: "Colour by true class", caption: "Colour them by the true class: blue is not spam, pink is spam. The classes overlap a little around scores 3 to 5." },
    { id: "model-score", label: "The model's score", caption: "A classifier turns each email into a score: larger means more spam-like. A score is not automatically a probability: a score of 8 does not mean 80 percent." },
    { id: "boundary", label: "A decision boundary", caption: "Put a boundary at score 4. The rule: score below 4 means class 0, score at or above 4 means class 1. The boundary is where the predicted class changes." },
    { id: "left-region", label: "The class 0 region", caption: "Everything left of the boundary is the not-spam region: any email that lands here is predicted not spam." },
    { id: "right-region", label: "The class 1 region", caption: "Everything at or right of the boundary is the spam region: any email that lands here is predicted spam." },
    { id: "classify-points", label: "Classify the points", caption: "Each ring shows the predicted class. Eight predictions are right. Two are wrong (red crosses): the spam at 3.5 and the real mail at 4.5." },
    { id: "near-boundary", label: "Near the boundary", caption: "The mistakes sit right next to the boundary. A tiny change in score flips the class there, so the model is least certain close to the boundary. Far-away emails, like 0.5 and 9, are easy." },
    { id: "two-features", label: "With two features", caption: "With two features, such as suspicious words and number of links, each email is a point in a plane and the boundary becomes a line. One side is class 0, the other class 1." },
    { id: "move-boundary", label: "Move the boundary", caption: "Moving the boundary changes predictions. Boundary 3: 2 mistakes. Boundary 4: 2 mistakes. Boundary 5: only 1. The right boundary should be chosen by training and checked on held-out data, not by eyeballing." }
  ];

  var axisG = el("g", {}, svg);
  var AX = scoreAxis(axisG, 40, 560, 300, 10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "spam score");
  var regionG = el("g", {}, svg);
  var leftRect = box(regionG, 40, 110, 0, 180, "rgba(56,189,248,0.14)", "none", 0);
  var rightRect = box(regionG, 0, 110, 0, 180, "rgba(244,114,182,0.14)", "none", 0);
  var leftLbl = txt(regionG, 0, 134, "lbl lbl-b", "predict NOT SPAM", "middle");
  var rightLbl = txt(regionG, 0, 134, "lbl lbl-p", "predict SPAM", "middle");
  var bLine = el("line", { stroke: "#e2b44a", "stroke-width": 4, "stroke-dasharray": "8 5" }, svg);
  var bLbl = txt(svg, 0, 100, "lbl lbl-y", "", "middle");

  var ROW = { 0: 170, 1: 240 };
  var dots = EMAILS.map(function (e) {
    return el("circle", { cx: AX.x(e[0]), cy: 205, r: 11, fill: "#8fa89c", stroke: "#071510", "stroke-width": 2 }, svg);
  });
  var rings = EMAILS.map(function () { return el("circle", { r: 17, fill: "none", "stroke-width": 3 }, svg); });
  var crosses = EMAILS.map(function () { return txt(svg, 0, 0, "big", "✕", "middle"); });
  crosses.forEach(function (c) { c.style.fill = C_BAD; });
  var scoreLbl = txt(svg, 320, 66, "lbl lbl-g", "model score = spam score  (higher: more spam-like)", "middle");
  var hardBand = box(svg, AX.x(3.25), 130, AX.x(4.75) - AX.x(3.25), 150, "rgba(226,180,74,0.14)", "#e2b44a", 8);
  var hardLbl = txt(svg, AX.x(4), 268, "lbl lbl-y", "hard cases", "middle");
  var errTxt = txt(svg, 320, 342, "mono", "", "middle");

  // Two-feature plane.
  var planeG = el("g", {}, svg);
  var PL = makeGraph(150, 318, 44, 40);
  planeG.appendChild(el("polygon", { points: [[0, 0], [6, 0], [0, 6]].map(function (p) { return PL.x(p[0]).toFixed(1) + "," + PL.y(p[1]).toFixed(1); }).join(" "), fill: "rgba(56,189,248,0.16)" }));
  planeG.appendChild(el("polygon", { points: [[6, 0], [8, 0], [8, 6.6], [0, 6.6], [0, 6]].map(function (p) { return PL.x(p[0]).toFixed(1) + "," + PL.y(p[1]).toFixed(1); }).join(" "), fill: "rgba(244,114,182,0.16)" }));
  el("line", { x1: PL.x(0), y1: PL.y(0), x2: PL.x(8), y2: PL.y(0), class: "axis" }, planeG);
  el("line", { x1: PL.x(0), y1: PL.y(0), x2: PL.x(0), y2: PL.y(6.6), class: "axis" }, planeG);
  txt(planeG, PL.x(8), PL.y(0) + 16, "note", "suspicious words", "end");
  txt(planeG, PL.x(0) + 6, PL.y(6.6) + 12, "note", "links", "start");
  var PTS = [[1, 1, 0], [2, 1, 0], [1, 3, 0], [3, 2, 0], [2, 3.5, 0], [4, 3, 1], [5, 2, 1], [3.5, 4, 1], [6, 4, 1], [4, 5, 1], [2.5, 3.9, 1]];
  PTS.forEach(function (p) { el("circle", { cx: PL.x(p[0]), cy: PL.y(p[1]), r: 8, fill: colorOf(p[2]), stroke: "#071510", "stroke-width": 2 }, planeG); });
  el("line", { x1: PL.x(0), y1: PL.y(6), x2: PL.x(6), y2: PL.y(0), stroke: "#e2b44a", "stroke-width": 4, "stroke-dasharray": "8 5" }, planeG);
  txt(planeG, PL.x(5.2), PL.y(5.4), "lbl lbl-p", "class 1 side", "middle");
  txt(planeG, PL.x(1.3), PL.y(0.4), "lbl lbl-b", "class 0 side", "middle");
  txt(planeG, PL.x(5.3), PL.y(1.2) , "lbl lbl-y", "boundary: a line", "start");

  function predictedAt(b, s) { return s >= b ? 1 : 0; }
  function setBoundary(b, showRings) {
    var bx = AX.x(b);
    setLine(bLine, bx, 104, bx, 296);
    bLbl.setAttribute("x", bx); bLbl.textContent = "boundary " + b.toFixed(1);
    setBox(leftRect, 40, 110, bx - 40, 180);
    setBox(rightRect, bx, 110, 600 - bx, 180);
    leftLbl.setAttribute("x", (40 + bx) / 2); rightLbl.setAttribute("x", (bx + 600) / 2);
    var wrong = 0;
    EMAILS.forEach(function (e, i) {
      var p = predictedAt(b, e[0]), bad = p !== e[1];
      if (bad) wrong++;
      var cy = parseFloat(dots[i].getAttribute("cy"));
      rings[i].setAttribute("cx", AX.x(e[0])); rings[i].setAttribute("cy", cy);
      rings[i].setAttribute("stroke", colorOf(p));
      show(rings[i], showRings);
      crosses[i].setAttribute("x", AX.x(e[0])); crosses[i].setAttribute("y", cy - 22);
      show(crosses[i], showRings && bad);
    });
    return wrong;
  }
  function setRows(e) {
    EMAILS.forEach(function (em, i) {
      var cy = lerp(205, ROW[em[1]], e);
      dots[i].setAttribute("cy", cy);
      dots[i].setAttribute("fill", e > 0.5 ? colorOf(em[1]) : "#8fa89c");
    });
  }

  function render(index, id) {
    var i = index;
    show(regionG, i >= 4 && i <= 7 || i === 9);
    show(leftRect, i >= 4); show(leftLbl, i >= 4 && i <= 6 || i === 9);
    show(rightRect, i >= 5 || i === 9); show(rightLbl, i >= 5 && i <= 6 || i === 9);
    if (i === 4) show(rightRect, false);
    show(bLine, i >= 3 && i <= 7 || i === 9); show(bLbl, i >= 3 && i <= 7 || i === 9);
    show(scoreLbl, i === 2);
    show(hardBand, i === 7); show(hardLbl, i === 7);
    show(planeG, i === 8);
    var hide1d = i === 8;
    show(axisG, !hide1d);
    dots.forEach(function (d) { show(d, !hide1d); });
    show(errTxt, i === 9);
    if (i <= 2) setRows(i === 0 ? 0 : 1); else setRows(1);
    var wrong = setBoundary(4, i >= 6 && i <= 7);
    if (i === 9) {
      anim("bound", 2400, function (e) {
        var b = e < 0.5 ? lerp(4, 3, e * 2) : lerp(3, 5, (e - 0.5) * 2);
        var w = setBoundary(b, true);
        errTxt.textContent = "boundary " + b.toFixed(1) + "   mistakes " + w;
      });
    }
  }
