
  // ── Module 13 helpers: the churn capstone (one project, one set of numbers; positive class = churn) ──
  var K_TR = "#38bdf8", K_VA = "#e2b44a", K_TE = "#f472b6", K_OK = "#1db584", K_BAD = "#f87171", K_GRAY = "#8fa89c";
  var CM_VAL = { baseline: [12, 10, 18, 110], logistic: [21, 12, 9, 108], tree: [24, 17, 6, 103] };   // [TP, FP, FN, TN], 150 validation customers
  var CM_TEST = [22, 19, 6, 103];                                                                      // 150 test customers, evaluated once
  var DEPTHS = [[1, 0.48, 0.46], [2, 0.62, 0.58], [4, 0.76, 0.676], [8, 0.97, 0.59]];                  // [max depth, train F1, validation F1]
  function cmMetrics(c) {
    var tp = c[0], fp = c[1], fn = c[2], tn = c[3];
    var p = tp / (tp + fp), r = tp / (tp + fn);
    return { acc: (tp + tn) / (tp + fp + fn + tn), p: p, r: r, f1: 2 * p * r / (p + r) };
  }
  var M_BASE = cmMetrics(CM_VAL.baseline), M_LOGI = cmMetrics(CM_VAL.logistic), M_TREE = cmMetrics(CM_VAL.tree), M_TEST = cmMetrics(CM_TEST);
  function meetsGoal(m) { return m.r >= 0.75 && m.p >= 0.5; }
  function n2(v) { return v.toFixed(2); }
  function n3(v) { return v.toFixed(3); }

  // A rounded card with centred text. Returns the group; .t is the (first) text node.
  function chip(parent, x, y, w, h, label, cls, tcls) {
    var g = el("g", {}, parent);
    card(g, x, y, w, h, cls || "fillA");
    g.t = txt(g, x + w / 2, y + h / 2 + 4, tcls || "lbl", label, "middle");
    return g;
  }
  // A card with a title line, a big line and up to four note lines that can be rewritten with set(...).
  function mkPanel(parent, x, y, w, h, cls) {
    var g = el("g", {}, parent), cx = x + w / 2, t = [];
    card(g, x, y, w, h, cls || "fillG");
    t.push(txt(g, cx, y + 28, "lbl lbl-y", "", "middle"));
    t.push(txt(g, cx, y + 62, "big", "", "middle"));
    for (var i = 0; i < 4; i++) t.push(txt(g, cx, y + 92 + i * 22, "note", "", "middle"));
    return { g: g, set: function () { for (var k = 0; k < t.length; k++) t[k].textContent = arguments[k] === undefined ? "" : arguments[k]; } };
  }
  function tint(cell, fill, stroke) {
    var r = cell.firstChild;
    r.style.fill = fill; r.style.stroke = stroke;
  }
  // 2 x 2 confusion matrix with headers; rows = actual (churned / stayed), columns = flagged (churn / stay).
  function cmGrid(parent, x, y, cw, ch, c) {
    var g = el("g", {}, parent);
    txt(g, x + cw * 0.5, y - 8, "tick", "flagged churn", "middle");
    txt(g, x + cw * 1.5, y - 8, "tick", "flagged stay", "middle");
    txt(g, x - 6, y + ch * 0.5 + 4, "tick", "churned", "end");
    txt(g, x - 6, y + ch * 1.5 + 4, "tick", "stayed", "end");
    var m = matGrid(g, x, y, 2, 2, cw, ch, [["TP " + c[0], "FN " + c[2]], ["FP " + c[1], "TN " + c[3]]]);
    m.group = g;
    return m;
  }
  function hbar(parent, x, y, w, h, frac, color, goal) {
    var g = el("g", {}, parent);
    box(g, x, y, w, h, "rgba(255,255,255,0.08)", "none", 4);
    var b = box(g, x, y, Math.max(2, w * frac), h, color, "none", 4);
    if (goal !== undefined) el("line", { x1: x + w * goal, y1: y - 4, x2: x + w * goal, y2: y + h + 4, stroke: "#e6f5ec", "stroke-width": 2 }, g);
    g.bar = b;
    return g;
  }
  function setBar(g, x, w, frac) { g.bar.setAttribute("width", Math.max(2, w * frac)); }
  function cross(parent, x, y, s, color) {
    var g = el("g", {}, parent);
    el("line", { x1: x - s, y1: y - s, x2: x + s, y2: y + s, stroke: color || K_BAD, "stroke-width": 3, "stroke-linecap": "round" }, g);
    el("line", { x1: x - s, y1: y + s, x2: x + s, y2: y - s, stroke: color || K_BAD, "stroke-width": 3, "stroke-linecap": "round" }, g);
    return g;
  }
  function tick(parent, x, y, s, color) {
    return el("path", { d: "M " + (x - s) + " " + y + " L " + (x - s / 3) + " " + (y + s * 0.8) + " L " + (x + s) + " " + (y - s * 0.7), fill: "none", stroke: color || K_OK, "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
  }
