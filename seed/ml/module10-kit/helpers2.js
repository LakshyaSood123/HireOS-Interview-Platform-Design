
  // ── Module 8 helpers: the email dataset, sigmoid, chips, a horizontal score axis ──
  // [spam score, label]: 0 = not spam, 1 = spam. Order: five real emails, then five spam.
  var EMAILS = [[0.5, 0], [1.0, 0], [2.0, 0], [3.0, 0], [4.5, 0], [3.5, 1], [5.0, 1], [6.0, 1], [7.5, 1], [9.0, 1]];
  var C_HAM = "#38bdf8", C_SPAM = "#f472b6", C_OK = "#1db584", C_BAD = "#f87171";
  function sigm(z) { return 1 / (1 + Math.exp(-z)); }
  function probOf(x) { return sigm(x - 4); }
  function colorOf(label) { return label === 1 ? C_SPAM : C_HAM; }
  function nameOf(label) { return label === 1 ? "spam" : "not spam"; }

  // Rounded label box with centred text.
  function chip(parent, x, y, w, h, str, fill, stroke, textCls) {
    var g2 = el("g", {}, parent);
    box(g2, x, y, w, h, fill, stroke || "none", 8);
    var t2 = txt(g2, x + w / 2, y + h / 2 + 5, textCls || "lbl", str, "middle");
    g2.label = t2;
    return g2;
  }
  // A dot for one email, filled by class colour.
  function mailDot(parent, cx, cy, r, label) {
    return el("circle", { cx: cx, cy: cy, r: r, fill: colorOf(label), stroke: "#071510", "stroke-width": 2 }, parent);
  }
  // Horizontal axis from value 0 to vmax drawn at pixel y, starting at pixel ox, `width` pixels long.
  function scoreAxis(parent, ox, width, y, vmax, ticks, label) {
    var m = { x: function (v) { return ox + (v / vmax) * width; } };
    el("line", { x1: ox, y1: y, x2: ox + width, y2: y, stroke: "#c9dccf", "stroke-width": 3, "stroke-linecap": "round" }, parent);
    ticks.forEach(function (t) {
      el("line", { x1: m.x(t), y1: y - 5, x2: m.x(t), y2: y + 5, stroke: "#c9dccf", "stroke-width": 2 }, parent);
      txt(parent, m.x(t), y + 20, "tick", String(t), "middle");
    });
    if (label) txt(parent, ox + width, y + 38, "note", label, "end");
    return m;
  }
