  var steps = [
    { id: "prediction", label: "The model makes a prediction", caption: "Our model predicts a house price from its size: ŷ = w × x with w = 2. For the house of size x = 3 it predicts ŷ = 6." },
    { id: "target", label: "The true answer", caption: "The real price of that house is y = 9. This is the target the model should have predicted." },
    { id: "error", label: "The error", caption: "The error is the gap between prediction and truth: ŷ − y = 6 − 9 = −3. It has a sign (too low) and a size (3)." },
    { id: "square-error", label: "Square it to get the loss", caption: "The loss turns the error into one non-negative number by a rule. Squared error: (ŷ − y)² = (−3)² = 9. The square drawn here has area 9." },
    { id: "multiple-examples", label: "Many examples", caption: "Do the same for all three houses. Errors: −1, −1, −3. Losses: 1, 1, 9. Squaring makes the house that is off by 3 cost nine times as much as one off by 1." },
    { id: "aggregate-loss", label: "One score for the dataset", caption: "Training needs a single number, so average the losses: (1 + 1 + 9) / 3 ≈ 3.67. This is the mean squared error of the whole dataset for w = 2." },
    { id: "objective-connection", label: "Loss versus objective", caption: "The loss is how wrong the predictions are: 3.67. The objective is what optimization minimizes. It may add a penalty, for example 0.1 × w² = 0.4, giving 4.07. In the simplest case objective = average loss, but they are not the same idea." },
    { id: "ml-training", label: "Training lowers the objective", caption: "Change the model to w = 3 and the predictions are 3, 6, 9: average loss 0.33 and objective 1.23. Training searches for the parameters that make the objective as small as possible." }
  ];

  var XD = [1, 2, 3], YD = [3, 5, 9];
  var PXl = function (x) { return 60 + 62 * x; };
  var PYl = function (y) { return 300 - 24 * y; };
  var U = 24;

  var axG = el("g", {}, svg);
  el("line", { x1: 60, y1: PYl(0), x2: 330, y2: PYl(0), class: "axis" }, axG);
  el("line", { x1: 60, y1: PYl(0), x2: 60, y2: PYl(10.2), class: "axis" }, axG);
  [1, 2, 3].forEach(function (x) { txt(axG, PXl(x), PYl(0) + 16, "tick", String(x), "middle"); });
  [0, 3, 6, 9].forEach(function (y) { txt(axG, 52, PYl(y) + 4, "tick", String(y), "end"); });
  txt(axG, 330, PYl(0) + 32, "note", "house size x", "end");
  txt(axG, 66, PYl(10.2) - 2, "note", "price", "start");
  var lineG = el("g", {}, svg);
  var mline = el("line", { stroke: "#38bdf8", "stroke-width": 3 }, lineG);
  setLine(mline, PXl(0), PYl(0), PXl(3.4), PYl(6.8));
  txt(lineG, PXl(1.5), PYl(1.2), "lbl lbl-b", "ŷ = 2x", "start"); // below the line, clear of the error labels

  var preds = [], tgts = [], bars = [], sqs = [], errLbls = [], lossLbls = [];
  XD.forEach(function (x, i) {
    var yh = 2 * x, y = YD[i], err = yh - y;
    preds.push(el("circle", { cx: PXl(x), cy: PYl(yh), r: 7, fill: "#071510", stroke: "#38bdf8", "stroke-width": 3 }, svg));
    tgts.push(el("circle", { cx: PXl(x), cy: PYl(y), r: 7, fill: "#e2b44a", stroke: "#071510", "stroke-width": 2 }, svg));
    bars.push(el("line", { x1: PXl(x), y1: PYl(yh), x2: PXl(x), y2: PYl(y), stroke: "#f87171", "stroke-width": 4, "stroke-linecap": "round" }, svg));
    var s = Math.abs(err) * U;
    sqs.push(box(svg, PXl(x) + 8, PYl(y), s, s, "rgba(248,113,113,0.35)", "#f87171", 2));
    errLbls.push(txt(svg, PXl(x) - 10, (PYl(yh) + PYl(y)) / 2 + 4, "lbl lbl-r", "error " + err, "end"));
    lossLbls.push(txt(svg, PXl(x) + 8 + s / 2, PYl(y) + s / 2 + 5, "lbl", "loss " + err * err, "middle"));
  });
  var predLbl = txt(svg, PXl(3) + 12, PYl(6) + 18, "lbl lbl-b", "prediction ŷ = 6", "start");
  var tgtLbl = txt(svg, PXl(3) + 12, PYl(9) - 12, "lbl lbl-y", "target y = 9", "start");

  var panelG = el("g", {}, svg);
  card(panelG, 372, 44, 250, 250, "fillG");
  var pt = txt(panelG, 497, 76, "lbl", "", "middle");
  var pl1 = txt(panelG, 497, 110, "mono", "", "middle");
  var pl2 = txt(panelG, 497, 140, "mono", "", "middle");
  var pl3 = txt(panelG, 497, 172, "mono", "", "middle");
  var pl4 = txt(panelG, 497, 208, "big", "", "middle");
  var pl5 = txt(panelG, 497, 236, "note", "", "middle");
  var pl6 = txt(panelG, 497, 258, "note", "", "middle");

  var stackG = el("g", {}, svg);
  [[1, "rgba(244,114,182,0.8)"], [1, "rgba(244,114,182,0.6)"], [9, "rgba(248,113,113,0.8)"]].forEach(function (b, i) {
    box(stackG, 392 + i * 70, 288 - b[0] * 8, 56, b[0] * 8, b[1], "none", 3);
    txt(stackG, 420 + i * 70, 288 - b[0] * 8 - 6, "lbl", String(b[0]), "middle");
  });

  function render(index, id) {
    var i = index;
    var oneHouse = i <= 3;
    show(axG, i <= 5); show(lineG, i <= 5);
    XD.forEach(function (x, k) {
      var on = oneHouse ? k === 2 : true;
      show(preds[k], on && i <= 5);
      show(tgts[k], on && i >= 1 && i <= 5);
      show(bars[k], on && i >= 2 && i <= 5);
      show(sqs[k], on && i >= 3 && i <= 5);
      show(errLbls[k], on && i >= 2 && i <= 4);
      show(lossLbls[k], on && i >= 3 && i <= 5);
    });
    show(predLbl, i <= 3); show(tgtLbl, i >= 1 && i <= 3);
    show(panelG, i >= 5);
    show(stackG, i === 5);
    pt.textContent = ""; pl1.textContent = ""; pl2.textContent = ""; pl3.textContent = ""; pl4.textContent = ""; pl5.textContent = ""; pl6.textContent = "";
    if (i === 5) {
      pt.textContent = "mean squared error";
      pl1.textContent = "(1 + 1 + 9) / 3";
      pl4.textContent = "≈ 3.67";
      pl5.textContent = "one number for all the data";
    }
    if (i === 6) {
      pt.textContent = "LOSS vs OBJECTIVE";
      pl1.textContent = "average loss  3.67";
      pl2.textContent = "+ penalty 0.1·w²  0.40";
      pl4.textContent = "objective ≈ 4.07";
      pl5.textContent = "the loss measures error;";
      pl6.textContent = "the objective is what we minimize";
    }
    if (i === 7) {
      pt.textContent = "w = 2   →   w = 3";
      pl1.textContent = "loss:      3.67 → 0.33";
      pl2.textContent = "objective: 4.07 → 1.23";
      pl4.textContent = "training picks w = 3";
      pl5.textContent = "lower objective = better model";
    }
    place(panelG, i >= 6 ? -177 : 0, 0);
    pl4.setAttribute("y", i === 5 ? 160 : 208); pl5.setAttribute("y", i === 5 ? 184 : 236);
  }
