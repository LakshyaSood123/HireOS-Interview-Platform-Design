
  var DX_ = function (k) { return 80 + k * 80; }, DY_ = function (f) { return 290 - f * 210; };
  var ch = el("g", {}, svg);
  el("line", { x1: 50, y1: 290, x2: 340, y2: 290, class: "axis" }, ch); el("line", { x1: 50, y1: 290, x2: 50, y2: 70, class: "axis" }, ch);
  DEPTHS.forEach(function (d, k) { txt(ch, DX_(k), 306, "tick", "depth " + d[0], "middle"); });
  [0, 0.5, 1].forEach(function (v) { txt(ch, 44, DY_(v) + 4, "tick", String(v), "end"); });
  txt(ch, 56, 66, "note", "F1 score", "start");
  function path(idx, color) { var d = ""; DEPTHS.forEach(function (r, k) { d += (k ? " L " : "M ") + DX_(k) + " " + DY_(r[idx]); }); return el("path", { d: d, fill: "none", stroke: color, "stroke-width": 3 }, svg); }
  var trL = path(1, K_TR), vaL = path(2, K_VA);
  var trD = DEPTHS.map(function (r, k) { return el("circle", { cx: DX_(k), cy: DY_(r[1]), r: 6, fill: K_TR, stroke: "#071510", "stroke-width": 2 }, svg); });
  var vaD = DEPTHS.map(function (r, k) { return el("circle", { cx: DX_(k), cy: DY_(r[2]), r: 6, fill: K_VA, stroke: "#071510", "stroke-width": 2 }, svg); });
  txt(svg, 190, 66, "lbl lbl-y", "o validation", "start"); txt(svg, 120, 66, "lbl", "o train", "start").style.fill = K_TR;
  var gap = el("g", {}, svg);
  el("line", { x1: DX_(3) + 18, y1: DY_(0.97), x2: DX_(3) + 18, y2: DY_(0.59), stroke: K_BAD, "stroke-width": 3 }, gap);
  el("line", { x1: DX_(3) + 12, y1: DY_(0.97), x2: DX_(3) + 24, y2: DY_(0.97), stroke: K_BAD, "stroke-width": 3 }, gap);
  el("line", { x1: DX_(3) + 12, y1: DY_(0.59), x2: DX_(3) + 24, y2: DY_(0.59), stroke: K_BAD, "stroke-width": 3 }, gap);
  txt(gap, DX_(3) + 18, DY_(0.97) - 28, "lbl lbl-r", "gap 0.38", "middle");
  var sel4 = el("circle", { cx: DX_(2), cy: DY_(0.676), r: 12, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  var gap4 = txt(svg, DX_(2), DY_(0.76) - 12, "note", "gap 0.08", "middle");
  var ringBig = el("circle", { cx: DX_(3), cy: DY_(0.97), r: 12, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  var pn = mkPanel(svg, 380, 60, 252, 160, "fillG");
  var chk = el("g", {}, svg);
  card(chk, 380, 232, 252, 108, "fillB");
  txt(chk, 506, 254, "lbl lbl-y", "check for these causes", "middle");
  ["leakage in a feature?", "model too complex for 700 customers?", "validation over-used for tuning?"].forEach(function (s, k) { txt(chk, 398, 280 + k * 22, "note", "• " + s, "start"); });
  var rem = el("g", {}, svg);
  card(rem, 380, 232, 252, 108, "fillA");
  txt(rem, 506, 254, "lbl lbl-y", "remedies", "middle");
  ["regularization (cf. ridge)", "a simpler model, smaller depth", "cleaner features, better validation"].forEach(function (s, k) { txt(rem, 398, 280 + k * 22, "note", "• " + s, "start"); });
  function render(i) {
    var showTr = i >= 0, showVa = i >= 1;
    show(trL, showTr); trD.forEach(function (c) { show(c, showTr); });
    show(vaL, showVa); vaD.forEach(function (c) { show(c, showVa); });
    show(gap, i >= 2 && i <= 5); show(ringBig, i === 0 || i === 3);
    show(sel4, i >= 6); show(gap4, i >= 6);
    show(chk, i === 4); show(rem, i === 5 || i === 6);
    var rows = [
      ["training F1 is high", "0.97 at depth 8", "the model fits the training customers", "", ""],
      ["validation is lower", "0.59", "on unseen validation customers", "lower than depth 4 (0.676)", ""],
      ["a large gap", "0.97 vs 0.59", "gap = 0.38", "evidence of overfitting, not proof of one cause", ""],
      ["too complex?", "depth 8", "700 customers can be memorized", "details that do not carry over", ""],
      ["a possible cause", "leakage?", "a leaky feature also gives a strong", "training score that collapses elsewhere", ""],
      ["regularization", "penalize complexity", "like ridge penalizes large weights", "or simply use a smaller depth", ""],
      ["a simpler model", "depth 4", "train 0.76 · validation 0.676", "gap shrinks from 0.38 to 0.08", ""],
      ["new validation", "measure again", "re-evaluate on validation data", "never use the test set to decide", ""],
      ["overfitting", "high train, lower validation", "form a hypothesis, change one thing", "then measure on validation", ""],
    ][i];
    pn.set(rows[0], rows[1], rows[2], rows[3], rows[4]);
  }
  flatCards();
