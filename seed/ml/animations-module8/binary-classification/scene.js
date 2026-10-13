  var steps = [
    { id: "examples", label: "Ten emails", caption: "Ten emails, each with a spam score (suspicious words, 0 to 10). Someone has checked every email and recorded whether it really is spam." },
    { id: "two-classes", label: "Exactly two classes", caption: "Each email belongs to one of two classes: not spam (label 0) or spam (label 1). That is binary classification. The 0 and 1 are names, not amounts." },
    { id: "feature-input", label: "The feature goes in", caption: "A new email arrives. Its feature is the spam score, 7.5. The classifier will look at it and choose a class." },
    { id: "classifier", label: "The classifier decides", caption: "Our simple classifier applies a rule: score at least 4 means spam, otherwise not spam. Later lessons show how such rules are built." },
    { id: "prediction", label: "A predicted class", caption: "Score 7.5 is at least 4, so the predicted class is spam (1)." },
    { id: "compare-label", label: "Compare with the true class", caption: "We also know the true class of this email: spam (1). A prediction is correct when the predicted class equals the true class." },
    { id: "correct-example", label: "A correct prediction", caption: "Predicted spam, actually spam: correct." },
    { id: "wrong-example", label: "An incorrect prediction", caption: "Another email has score 4.5. The rule says spam, but it is real mail (0). Predicted class and true class differ: incorrect." },
    { id: "binary-task", label: "The binary task", caption: "Features go in, a predicted class comes out, and we compare it with the true class. On our ten emails this rule is right 8 times and wrong twice." }
  ];

  // Ten email tokens in two rows.
  var tokG = el("g", {}, svg);
  var tokCircles = EMAILS.map(function (e, i) {
    var cx = 90 + (i % 5) * 115, cy = 90 + Math.floor(i / 5) * 90;
    var c = el("circle", { cx: cx, cy: cy, r: 28, fill: "#8fa89c", stroke: "#071510", "stroke-width": 3 }, tokG);
    var t = txt(tokG, cx, cy + 5, "big", e[0].toFixed(1), "middle"); t.style.fill = "#071510"; t.style.stroke = "none";
    return c;
  });
  var tokNote = txt(svg, 320, 280, "note", "each circle: one email and its spam score", "middle");

  // Two class bins (step 1).
  var binG = el("g", {}, svg);
  card(binG, 24, 40, 290, 230, "fillA");
  card(binG, 326, 40, 290, 230, "fillB");
  txt(binG, 169, 68, "lbl lbl-b", "NOT SPAM  (label 0)", "middle");
  txt(binG, 471, 68, "lbl lbl-p", "SPAM  (label 1)", "middle");
  var binDots = EMAILS.map(function (e, i) {
    var k = e[1] === 1 ? i - 5 : i;
    var cx = (e[1] === 1 ? 356 : 54) + (k % 3) * 92 + 24;
    var cy = 110 + Math.floor(k / 3) * 74;
    var c = el("circle", { cx: cx + 20, cy: cy + 20, r: 26, fill: colorOf(e[1]), stroke: "#071510", "stroke-width": 3 }, binG);
    var t = txt(binG, cx + 20, cy + 25, "big", e[0].toFixed(1), "middle"); t.style.fill = "#071510"; t.style.stroke = "none";
    return c;
  });
  txt(binG, 320, 292, "note", "labels are names: spam is not 'twice' not spam", "middle");

  // One decision: email -> classifier -> prediction, then compare with the true class.
  var flowG = el("g", {}, svg);
  var emailCard = card(flowG, 20, 60, 150, 100, "fillB");
  txt(flowG, 95, 90, "note", "email feature", "middle");
  var inTxt = txt(flowG, 95, 128, "big", "score 7.5", "middle");
  var fa = arrow(flowG, "w", 3); setLine(fa, 174, 110, 214, 110);
  var clfG = el("g", {}, flowG);
  card(clfG, 218, 66, 200, 88, "fillG");
  txt(clfG, 318, 94, "lbl lbl-g", "classifier", "middle");
  txt(clfG, 318, 126, "mono", "score ≥ 4  →  spam", "middle");
  var predG = el("g", {}, flowG);
  var fb = arrow(predG, "w", 3); setLine(fb, 422, 110, 462, 110);
  card(predG, 466, 60, 156, 100, "fillB");
  txt(predG, 544, 90, "note", "predicted class", "middle");
  var predTxt = txt(predG, 544, 128, "big", "spam (1)", "middle");
  var trueG = el("g", {}, flowG);
  card(trueG, 466, 190, 156, 70, "fillA");
  txt(trueG, 544, 214, "note", "true class", "middle");
  var trueTxt = txt(trueG, 544, 244, "big", "spam (1)", "middle");
  var verdictG = el("g", {}, flowG);
  var verdictBox = box(verdictG, 130, 196, 300, 60, "rgba(29,181,132,0.25)", C_OK, 10);
  var verdictTxt = txt(verdictG, 280, 233, "big", "", "middle");
  var taskG = el("g", {}, svg);
  [["Two classes", "not spam (0) or spam (1)", "fillA"], ["Labels are names", "not amounts or distances", "fillG"], ["Predicted vs true", "equal means correct", "fillB"]].forEach(function (b, k) {
    var x = 24 + k * 204;
    card(taskG, x, 60, 188, 110, b[2]);
    txt(taskG, x + 94, 96, "lbl lbl-y", b[0], "middle");
    txt(taskG, x + 94, 130, "note", b[1], "middle");
  });
  txt(taskG, 320, 226, "big", "8 of 10 emails classified correctly", "middle");
  txt(taskG, 320, 256, "note", "mistakes: scores 3.5 and 4.5, right next to the rule's cut", "middle");

  function setCase(score, pred, actual, wrong) {
    inTxt.textContent = "score " + score.toFixed(1);
    predTxt.textContent = nameOf(pred) + " (" + pred + ")";
    trueTxt.textContent = nameOf(actual) + " (" + actual + ")";
    verdictBox.setAttribute("fill", wrong ? "rgba(248,113,113,0.25)" : "rgba(29,181,132,0.25)");
    verdictBox.setAttribute("stroke", wrong ? C_BAD : C_OK);
    verdictTxt.textContent = wrong ? "✗ different: incorrect" : "✓ same: correct";
  }

  function render(index, id) {
    var i = index;
    show(tokG, i === 0); show(tokNote, i === 0);
    show(binG, i === 1);
    show(flowG, i >= 2 && i <= 7);
    show(clfG, i >= 3); show(fa, i >= 3); show(predG, i >= 4);
    show(trueG, i >= 5); show(verdictG, i === 6 || i === 7);
    show(taskG, i === 8);
    if (i === 7) setCase(4.5, 1, 0, true); else setCase(7.5, 1, 1, false);
  }
