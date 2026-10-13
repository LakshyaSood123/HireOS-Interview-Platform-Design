  var steps = [
    { id: "matrix", label: "Our confusion matrix", caption: "The same evaluation set: 100 emails, rows are actual, columns are predicted, positive class is spam. TP = 16, FN = 4, FP = 8, TN = 72." },
    { id: "actual-positive-row", label: "The actual-spam row", caption: "Recall starts from the emails that really are spam. That is the actual-spam ROW of the matrix: 16 + 4 = 20 emails." },
    { id: "select-tp", label: "Spam that was caught", caption: "Of the 20 actual spam emails, 16 were caught: the true positives." },
    { id: "select-fn", label: "Spam that was missed", caption: "The other 4 spam emails were missed: false negatives that reached the inbox." },
    { id: "recall-question", label: "The recall question", caption: "Of all the actual spam, how much did the model catch?" },
    { id: "numerator", label: "The numerator", caption: "Numerator: the spam emails the model caught, TP = 16." },
    { id: "denominator", label: "The denominator", caption: "Denominator: ALL actual positives, the whole actual-spam row, TP + FN = 20." },
    { id: "calculate", label: "Calculate recall", caption: "Recall = TP / (TP + FN) = 16 / 20 = 0.80." },
    { id: "interpret", label: "Interpret it", caption: "The filter finds 80 percent of the spam and lets 20 percent through. High recall means few positives are missed; in screening problems that can matter greatly. Recall ignores false alarms: that is precision." }
  ];
  var ORANGE = "#fb923c";
  var CM = cmGrid(svg, 120, 104, 130, 88, { tp: 16, fn: 4, fp: 8, tn: 72 }, false);
  var band = box(svg, 114, 98, 272, 100, "rgba(251,146,60,0)", ORANGE, 10);
  band.setAttribute("stroke-width", "4");
  var bandLbl = txt(svg, 250, 312, "lbl", "actual-spam row: 16 + 4 = 20", "middle"); bandLbl.style.fill = ORANGE;
  var panel = el("g", {}, svg);
  card(panel, 396, 50, 236, 230, "fillA");
  var pTitle = txt(panel, 514, 82, "lbl lbl-y", "", "middle");
  var pLine1 = txt(panel, 514, 124, "big", "", "middle");
  var pLine2 = txt(panel, 514, 162, "big", "", "middle");
  var pLine3 = txt(panel, 514, 200, "big", "", "middle");
  var pNote = txt(panel, 514, 244, "note", "", "middle");
  var formula = txt(svg, 514, 316, "mono", "recall = TP / (TP + FN)", "middle");

  function setPanel(title, l1, l2, l3, note) {
    pTitle.textContent = title; pLine1.textContent = l1; pLine2.textContent = l2; pLine3.textContent = l3; pNote.textContent = note || "";
  }
  function render(index, id) {
    var i = index;
    show(band, i >= 1 && i <= 8); show(bandLbl, i >= 1 && i <= 8);
    show(panel, i >= 4);
    show(formula, i >= 5);
    if (i === 0) CM.light([]);
    if (i === 1) CM.light(["tp", "fn"], ORANGE);
    if (i === 2) CM.light(["tp"]);
    if (i === 3) CM.light(["fn"]);
    if (i >= 4) CM.light(["tp", "fn"], ORANGE);
    if (i === 4) setPanel("recall asks", "of all the", "actual SPAM,", "how much was caught?", "");
    if (i === 5) setPanel("numerator", "TP = 16", "spam that", "was caught", "");
    if (i === 6) setPanel("denominator", "TP + FN = 20", "ALL actual", "positives", "the whole actual-spam row");
    if (i === 7) setPanel("recall", "16 / 20", "= 0.80", "", "");
    if (i === 8) setPanel("interpret", "80% of spam", "is caught", "20% gets through", "high recall = few missed positives");
  }
