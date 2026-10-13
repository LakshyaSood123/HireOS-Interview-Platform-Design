  var steps = [
    { id: "matrix", label: "Our confusion matrix", caption: "The evaluation set again: 100 emails, rows are actual, columns are predicted, positive class is spam. TP = 16, FN = 4, FP = 8, TN = 72." },
    { id: "predicted-positive-column", label: "The predicted-spam column", caption: "Precision looks only at the emails the filter flagged as spam. That is the predicted-spam COLUMN of the matrix: 16 + 8 = 24 emails." },
    { id: "select-tp", label: "Flagged and really spam", caption: "Of the 24 flagged emails, 16 really are spam: the true positives." },
    { id: "select-fp", label: "Flagged but legitimate", caption: "The other 8 flagged emails are legitimate: false positives, legitimate mail blocked by mistake." },
    { id: "precision-question", label: "The precision question", caption: "When the model says spam, how often is it right?" },
    { id: "numerator", label: "The numerator", caption: "Numerator: the flagged emails that really are spam, TP = 16." },
    { id: "denominator", label: "The denominator", caption: "Denominator: ALL predicted positives, the whole predicted-spam column, TP + FP = 24." },
    { id: "calculate", label: "Calculate precision", caption: "Precision = TP / (TP + FP) = 16 / 24, about 0.667." },
    { id: "interpret", label: "Interpret it", caption: "Two out of every three emails the filter blocks really are spam; one in three is legitimate. Precision says nothing about spam that was never flagged: that is recall." }
  ];
  var VIOLET = "#a78bfa";
  var CM = cmGrid(svg, 120, 104, 130, 88, { tp: 16, fn: 4, fp: 8, tn: 72 }, false);
  var band = box(svg, 114, 98, 142, 188, "rgba(167,139,250,0)", VIOLET, 10);
  band.setAttribute("stroke-width", "4");
  var bandLbl = txt(svg, 185, 312, "lbl", "predicted-spam column: 16 + 8 = 24", "middle"); bandLbl.style.fill = VIOLET;
  var panel = el("g", {}, svg);
  card(panel, 396, 50, 236, 230, "fillA");
  var pTitle = txt(panel, 514, 82, "lbl lbl-y", "", "middle");
  var pLine1 = txt(panel, 514, 124, "big", "", "middle");
  var pLine2 = txt(panel, 514, 162, "big", "", "middle");
  var pLine3 = txt(panel, 514, 200, "big", "", "middle");
  var pNote = txt(panel, 514, 244, "note", "", "middle");
  var formula = txt(svg, 514, 316, "mono", "precision = TP / (TP + FP)", "middle");

  function setPanel(title, l1, l2, l3, note) {
    pTitle.textContent = title; pLine1.textContent = l1; pLine2.textContent = l2; pLine3.textContent = l3; pNote.textContent = note || "";
  }
  function render(index, id) {
    var i = index;
    show(band, i >= 1 && i <= 8); show(bandLbl, i >= 1 && i <= 8);
    show(panel, i >= 4);
    show(formula, i >= 5);
    if (i === 0) CM.light([]);
    if (i === 1) CM.light(["tp", "fp"], VIOLET);
    if (i === 2) CM.light(["tp"]);
    if (i === 3) CM.light(["fp"]);
    if (i >= 4) CM.light(["tp", "fp"], VIOLET);
    if (i === 4) setPanel("precision asks", "when the model", "says SPAM,", "how often is it right?", "");
    if (i === 5) setPanel("numerator", "TP = 16", "flagged and", "really spam", "");
    if (i === 6) setPanel("denominator", "TP + FP = 24", "ALL predicted", "positives", "the whole predicted-spam column");
    if (i === 7) setPanel("precision", "16 / 24", "≈ 0.667", "", "");
    if (i === 8) setPanel("interpret", "2 of 3 blocked", "emails were spam", "1 of 3 was legit", "high precision = few false alarms");
  }
