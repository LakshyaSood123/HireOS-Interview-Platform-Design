  var steps = [
    { id: "input-data", label: "Two prediction problems", caption: "Two problems with the same shape: given some features, predict something. A house with size 2.0, and an email with spam score 7.5." },
    { id: "regression-task", label: "Regression: predict a number", caption: "For the house we want a price. The model reads the size and produces an output on a scale." },
    { id: "continuous-output", label: "A continuous output", caption: "The regression output is a number such as 3.7 (that is $370k). Any value on the scale is possible, and being close counts: 3.6 is nearly right." },
    { id: "classification-task", label: "Classification: predict a category", caption: "For the email we want a category. The model reads the spam score and must choose one of a few labels." },
    { id: "class-output", label: "A class label", caption: "The classification output is a label: spam. The choices are not on a scale: spam is not 'a bit more' than not spam." },
    { id: "compare", label: "Compare the two outputs", caption: "Regression outputs a quantity, classification outputs a category. The pipeline looks alike, but the output, and how we judge it, are different." },
    { id: "score-preview", label: "A score comes first", caption: "Classifiers often compute a score first (here 7.5), then a decision rule turns it into a class: score at least 4.0 means spam. The next lessons open this box." },
    { id: "ml-choice", label: "Which task is it?", caption: "Ask what the answer looks like. A quantity on a scale means regression. One of a fixed set of categories means classification." }
  ];

  // Reusable "input -> model -> output" row. Returns {g, out} so the output text can change.
  function pipeline(parent, y, inLabel, inVal, outLabel, outVal, inFill, outFill) {
    var g2 = el("g", {}, parent);
    card(g2, 30, y, 170, 80, inFill);
    txt(g2, 115, y + 30, "note", inLabel, "middle");
    txt(g2, 115, y + 58, "big", inVal, "middle");
    var a1 = arrow(g2, "w", 3); setLine(a1, 204, y + 40, 246, y + 40);
    card(g2, 250, y + 6, 140, 68, "fillG");
    txt(g2, 320, y + 36, "lbl lbl-g", "model", "middle");
    txt(g2, 320, y + 56, "note", "learned from data", "middle");
    var a2 = arrow(g2, "w", 3); setLine(a2, 394, y + 40, 436, y + 40);
    card(g2, 440, y, 170, 80, outFill);
    txt(g2, 525, y + 30, "note", outLabel, "middle");
    var o = txt(g2, 525, y + 58, "big", outVal, "middle");
    g2.out = o;
    return g2;
  }

  var inputG = el("g", {}, svg);
  card(inputG, 40, 60, 250, 170, "fillA");
  txt(inputG, 165, 86, "lbl lbl-b", "HOUSE", "middle");
  box(inputG, 120, 132, 90, 48, "rgba(56,189,248,0.25)", C_HAM, 6);
  el("path", { d: "M 112 134 L 165 100 L 218 134 Z", fill: "rgba(56,189,248,0.4)", stroke: C_HAM, "stroke-width": 2 }, inputG);
  txt(inputG, 165, 204, "big", "size = 2.0", "middle");
  card(inputG, 350, 60, 250, 170, "fillB");
  txt(inputG, 475, 92, "lbl lbl-p", "EMAIL", "middle");
  box(inputG, 410, 112, 130, 70, "rgba(244,114,182,0.2)", C_SPAM, 6);
  el("path", { d: "M 410 114 L 475 154 L 540 114", fill: "none", stroke: C_SPAM, "stroke-width": 2 }, inputG);
  txt(inputG, 475, 204, "big", "spam score = 7.5", "middle");
  txt(inputG, 320, 262, "lbl lbl-y", "features go in; a prediction comes out", "middle");

  var regG = pipeline(svg, 70, "house size", "2.0", "predicted price", "?", "fillA", "fillA");
  var regLabel = txt(svg, 320, 50, "lbl lbl-b", "REGRESSION", "middle");
  var numG = el("g", {}, svg);
  var nl = scoreAxis(numG, 60, 520, 230, 6, [0, 1, 2, 3, 4, 5, 6], "price ($100k)");
  el("circle", { cx: nl.x(3.7), cy: 230, r: 11, fill: C_HAM, stroke: "#071510", "stroke-width": 3 }, numG);
  txt(numG, nl.x(3.7), 200, "big", "3.7", "middle");
  txt(numG, 320, 280, "note", "any value on the scale is possible; close is nearly right", "middle");

  var clsG = pipeline(svg, 70, "spam score", "7.5", "predicted class", "?", "fillB", "fillB");
  var clsLabel = txt(svg, 320, 50, "lbl lbl-p", "CLASSIFICATION", "middle");
  var chipsG = el("g", {}, svg);
  chip(chipsG, 120, 200, 180, 54, "not spam", "rgba(56,189,248,0.15)", "rgba(56,189,248,0.4)", "lbl lbl-s");
  chip(chipsG, 340, 200, 180, 54, "spam", "rgba(244,114,182,0.45)", C_SPAM, "big");
  txt(chipsG, 320, 290, "note", "a fixed set of choices, with no scale between them", "middle");

  var cmpG = el("g", {}, svg);
  card(cmpG, 30, 40, 280, 230, "fillA");
  card(cmpG, 330, 40, 280, 230, "fillB");
  txt(cmpG, 170, 70, "lbl lbl-b", "REGRESSION", "middle");
  txt(cmpG, 170, 128, "big", "3.7", "middle").setAttribute("font-size", "36");
  txt(cmpG, 170, 168, "note", "a number on a scale", "middle");
  txt(cmpG, 170, 200, "note", "judged by distance: 3.6 is close", "middle");
  txt(cmpG, 170, 232, "lbl lbl-g", "house price, temperature", "middle");
  txt(cmpG, 470, 70, "lbl lbl-p", "CLASSIFICATION", "middle");
  txt(cmpG, 470, 128, "big", "spam", "middle").setAttribute("font-size", "36");
  txt(cmpG, 470, 168, "note", "one of a fixed set of labels", "middle");
  txt(cmpG, 470, 200, "note", "right or wrong; no 'nearly spam'", "middle");
  txt(cmpG, 470, 232, "lbl lbl-g", "spam, species, fraud", "middle");

  var prevG = el("g", {}, svg);
  card(prevG, 20, 90, 120, 90, "fillB");
  txt(prevG, 80, 124, "note", "email", "middle");
  txt(prevG, 80, 152, "big", "x = 7.5", "middle");
  var p1 = arrow(prevG, "w", 3); setLine(p1, 144, 135, 168, 135);
  card(prevG, 172, 90, 130, 90, "fillA");
  txt(prevG, 237, 124, "note", "model score", "middle");
  txt(prevG, 237, 152, "big", "7.5", "middle");
  var p2 = arrow(prevG, "w", 3); setLine(p2, 306, 135, 330, 135);
  card(prevG, 334, 90, 150, 90, "fillG");
  txt(prevG, 409, 124, "note", "decision rule", "middle");
  txt(prevG, 409, 152, "mono", "score ≥ 4.0", "middle");
  var p3 = arrow(prevG, "w", 3); setLine(p3, 488, 135, 512, 135);
  card(prevG, 516, 90, 106, 90, "fillB");
  txt(prevG, 569, 124, "note", "class", "middle");
  txt(prevG, 569, 152, "big", "spam", "middle");
  txt(prevG, 320, 240, "lbl lbl-y", "a score first, then a decision", "middle");

  var choiceG = el("g", {}, svg);
  card(choiceG, 190, 36, 260, 56, "fillG");
  txt(choiceG, 320, 70, "big", "What does the answer look like?", "middle").setAttribute("font-size", "14");
  var c1 = arrow(choiceG, "w", 3); setLine(c1, 270, 96, 170, 130);
  var c2 = arrow(choiceG, "w", 3); setLine(c2, 370, 96, 470, 130);
  card(choiceG, 40, 134, 260, 120, "fillA");
  txt(choiceG, 170, 166, "lbl lbl-b", "a quantity on a scale", "middle");
  txt(choiceG, 170, 200, "big", "REGRESSION", "middle");
  txt(choiceG, 170, 232, "note", "price, temperature, minutes", "middle");
  card(choiceG, 340, 134, 260, 120, "fillB");
  txt(choiceG, 470, 166, "lbl lbl-p", "one of a set of categories", "middle");
  txt(choiceG, 470, 200, "big", "CLASSIFICATION", "middle");
  txt(choiceG, 470, 232, "note", "spam, species, fraud", "middle");

  function render(index, id) {
    var i = index;
    show(inputG, i === 0);
    show(regG, i === 1 || i === 2); show(regLabel, i === 1 || i === 2);
    show(numG, i === 2);
    show(clsG, i === 3 || i === 4); show(clsLabel, i === 3 || i === 4);
    show(chipsG, i === 4);
    show(cmpG, i === 5);
    show(prevG, i === 6);
    show(choiceG, i === 7);
    regG.out.textContent = i === 2 ? "3.7" : "?";
    clsG.out.textContent = i === 4 ? "spam" : "?";
    if (i === 2) { regG.setAttribute("transform", "translate(0,-30)"); regLabel.setAttribute("y", 24); }
    else { regG.setAttribute("transform", "translate(0,0)"); regLabel.setAttribute("y", 50); }
    if (i === 4) { clsG.setAttribute("transform", "translate(0,-30)"); clsLabel.setAttribute("y", 24); }
    else { clsG.setAttribute("transform", "translate(0,0)"); clsLabel.setAttribute("y", 50); }
  }
