
  // ── Module 9 helpers: confusion matrix drawing and metric maths ─────────────
  // Orientation used in every scene: rows = ACTUAL class, columns = PREDICTED class. Positive = spam.
  var C_TP = "#1db584", C_TN = "#38bdf8", C_FP = "#e2b44a", C_FN = "#f87171";
  var CELLS = [["tp", "TP", "true positive", 0, 0, C_TP], ["fn", "FN", "false negative", 1, 0, C_FN], ["fp", "FP", "false positive", 0, 1, C_FP], ["tn", "TN", "true negative", 1, 1, C_TN]];

  function precisionOf(tp, fp) { return tp + fp > 0 ? tp / (tp + fp) : null; }
  function recallOf(tp, fn) { return tp + fn > 0 ? tp / (tp + fn) : null; }
  function f1Of(p, r) { return p && r ? 2 * p * r / (p + r) : 0; }
  function pct(v) { return v === null ? "n/a" : v.toFixed(2); }

  // A 2x2 confusion matrix with headers. vals = {tp, fn, fp, tn}. Returns node handles.
  function cmGrid(parent, ox, oy, cw, ch, vals, small) {
    var g2 = el("g", {}, parent), cells = {}, nums = {}, tags = {};
    txt(g2, ox + cw, oy - 30, "lbl", "predicted", "middle").setAttribute("font-size", small ? "11" : "13");
    txt(g2, ox + cw / 2, oy - 10, "lbl lbl-p", "spam", "middle");
    txt(g2, ox + cw * 1.5, oy - 10, "lbl lbl-b", "legitimate", "middle");
    txt(g2, ox - 10, oy + ch - 6, "lbl", "actual", "end").setAttribute("font-size", small ? "11" : "13");
    txt(g2, ox - 10, oy + ch / 2 + 4, "lbl lbl-p", "spam", "end");
    txt(g2, ox - 10, oy + ch * 1.5 + 4, "lbl lbl-b", "legit", "end");
    CELLS.forEach(function (c) {
      var x = ox + c[3] * cw, y = oy + c[4] * ch;
      cells[c[0]] = box(g2, x + 2, y + 2, cw - 4, ch - 4, "rgba(255,255,255,0.05)", c[5], 8);
      tags[c[0]] = txt(g2, x + cw / 2, y + (small ? 16 : 22), "lbl", c[1], "middle");
      tags[c[0]].style.fill = c[5];
      nums[c[0]] = txt(g2, x + cw / 2, y + ch - (small ? 12 : 18), "big", String(vals[c[0]]), "middle");
      if (!small) nums[c[0]].setAttribute("font-size", "24");
    });
    return {
      g: g2, cells: cells, nums: nums, tags: tags,
      set: function (v) { CELLS.forEach(function (c) { nums[c[0]].textContent = String(v[c[0]]); }); },
      light: function (keys, fillBy) {
        CELLS.forEach(function (c) {
          var on = keys.indexOf(c[0]) >= 0;
          cells[c[0]].setAttribute("fill", on ? (fillBy || c[5]) : "rgba(255,255,255,0.05)");
          cells[c[0]].setAttribute("fill-opacity", on ? "0.35" : "1");
          cells[c[0]].setAttribute("stroke-width", on ? "4" : "2");
          tags[c[0]].setAttribute("opacity", on || !keys.length ? "1" : "0.4");
          nums[c[0]].setAttribute("opacity", on || !keys.length ? "1" : "0.4");
        });
      },
      x: function (col) { return ox + col * cw; },
      y: function (row) { return oy + row * ch; }
    };
  }
  // 10x10 grid of dots: first nA dots class A colour, remaining class B. Returns the circles.
  function dotGrid(parent, ox, oy, step, r, n, cols, colourOf) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(el("circle", { cx: ox + (i % cols) * step, cy: oy + Math.floor(i / cols) * step, r: r, fill: colourOf(i), stroke: "#071510", "stroke-width": 1.5 }, parent));
    }
    return out;
  }
