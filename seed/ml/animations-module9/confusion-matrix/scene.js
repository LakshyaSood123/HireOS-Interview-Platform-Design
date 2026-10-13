  var steps = [
    { id: "email-predictions", label: "A filter makes predictions", caption: "A spam filter has classified some emails. Here are ten of them; later we use all 100 emails of the evaluation set." },
    { id: "actual-labels", label: "The actual labels", caption: "Each email has an actual class: spam or legitimate. Spam is our positive class." },
    { id: "predicted-labels", label: "The predicted labels", caption: "The filter also gave each email a predicted class. Comparing actual and predicted tells us where it was right and wrong." },
    { id: "correct-spam", label: "True positives", caption: "Actual spam, predicted spam: true positive (TP). Three of these ten emails are TP." },
    { id: "missed-spam", label: "False negatives", caption: "Actual spam, predicted legitimate: false negative (FN). The filter missed this spam." },
    { id: "false-alarm", label: "False positives", caption: "Actual legitimate, predicted spam: false positive (FP). A legitimate email was blocked by mistake." },
    { id: "correct-legitimate", label: "True negatives", caption: "Actual legitimate, predicted legitimate: true negative (TN). The email was correctly allowed." },
    { id: "build-matrix", label: "Build the confusion matrix", caption: "Arrange the four outcomes in a 2 by 2 table. Rows are the ACTUAL class, columns are the PREDICTED class. We use this orientation everywhere." },
    { id: "fill-counts", label: "Fill in the counts", caption: "Over all 100 emails: TP = 16, FN = 4, FP = 8, TN = 72. The four counts add up to 100." },
    { id: "read-matrix", label: "Read the matrix", caption: "Rows give the actual totals: 20 spam and 80 legitimate. The diagonal (16 + 72 = 88) is correct, so accuracy is 0.88. The off-diagonal cells show WHICH mistakes were made." }
  ];

  var ROWS = [["spam", "spam", "tp"], ["spam", "spam", "tp"], ["spam", "legit", "fn"], ["legit", "spam", "fp"], ["legit", "legit", "tn"], ["legit", "legit", "tn"], ["spam", "spam", "tp"], ["legit", "legit", "tn"], ["legit", "spam", "fp"], ["legit", "legit", "tn"]];
  var KC = { tp: C_TP, fn: C_FN, fp: C_FP, tn: C_TN };
  var tbl = el("g", {}, svg);
  card(tbl, 14, 36, 300, 308, "fillA");
  txt(tbl, 60, 60, "lbl-s", "email", "middle");
  var hAct = txt(tbl, 140, 60, "lbl lbl-p", "actual", "middle");
  var hPred = txt(tbl, 232, 60, "lbl lbl-y", "predicted", "middle");
  var rowNodes = ROWS.map(function (r, i) {
    var y = 86 + i * 25;
    var band = box(tbl, 22, y - 14, 284, 22, "rgba(255,255,255,0)", "none", 4);
    txt(tbl, 60, y + 2, "note", "#" + (i + 1), "middle");
    var a = txt(tbl, 140, y + 2, "lbl", r[0], "middle");
    var p = txt(tbl, 232, y + 2, "lbl", r[1], "middle");
    var k = txt(tbl, 290, y + 2, "lbl", r[2].toUpperCase(), "end");
    return { band: band, a: a, p: p, k: k, kind: r[2] };
  });

  var CM = cmGrid(svg, 200, 104, 120, 84, { tp: 0, fn: 0, fp: 0, tn: 0 }, false);
  var totals = el("g", {}, svg);
  txt(totals, 450, 104 + 50, "big", "= 20", "start").style.fill = "#f472b6";
  txt(totals, 450, 104 + 134, "big", "= 80", "start").style.fill = "#38bdf8";
  txt(totals, 450, 104 + 28, "note", "actual spam", "start");
  txt(totals, 450, 104 + 112, "note", "actual legitimate", "start");
  var acc = txt(svg, 320, 300, "mono", "accuracy = 88 / 100 = 0.88", "middle");
  var diagNote = txt(svg, 320, 322, "note", "diagonal = correct predictions", "middle");

  function render(index, id) {
    var i = index;
    show(tbl, i <= 6);
    rowNodes.forEach(function (r) {
      show(r.a, i >= 1); show(r.p, i >= 2);
      var hl = (i === 3 && r.kind === "tp") || (i === 4 && r.kind === "fn") || (i === 5 && r.kind === "fp") || (i === 6 && r.kind === "tn");
      var show4 = i >= 3 && i <= 6;
      show(r.k, show4 && hl);
      r.band.setAttribute("fill", hl ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0)");
      r.k.style.fill = KC[r.kind];
      r.a.setAttribute("opacity", i >= 1 ? (show4 && !hl ? "0.3" : "1") : "0");
      r.p.setAttribute("opacity", i >= 2 ? (show4 && !hl ? "0.3" : "1") : "0");
    });
    show(hAct, i >= 1); show(hPred, i >= 2);
    show(CM.g, i >= 7);
    if (i >= 7) CM.set(i >= 8 ? { tp: 16, fn: 4, fp: 8, tn: 72 } : { tp: "·", fn: "·", fp: "·", tn: "·" });
    CM.light(i === 9 ? ["tp", "tn"] : [], null);
    show(totals, i === 9);
    show(acc, i === 9); show(diagNote, i === 9);
  }
