
  var SX = 30, SW = 27, SG = 29;
  function setting(w) { return w <= 14 ? K_TR : (w <= 17 ? K_VA : K_TE); }
  var rowA = [], rowB = [];
  txt(svg, 320, 60, "lbl lbl-y", "", "middle");
  var head = txt(svg, 320, 56, "lbl lbl-y", "", "middle");
  var labA = txt(svg, SX, 100, "note", "chronological: weeks in order", "start");
  var labB = txt(svg, SX, 220, "note", "random: weeks mixed together", "start");
  for (var wi = 0; wi < 20; wi++) {
    var wkB = ((wi * 7) % 20) + 1;
    var ra = el("rect", { x: SX + wi * SG, y: 108, width: SW, height: 46, rx: 4, fill: "rgba(143,168,156,0.35)", stroke: "none" }, svg);
    var rb = el("rect", { x: SX + wi * SG, y: 228, width: SW, height: 46, rx: 4, fill: "rgba(143,168,156,0.35)", stroke: "none" }, svg);
    var ta = txt(svg, SX + wi * SG + SW / 2, 136, "tick", String(wi + 1), "middle");
    var tb = txt(svg, SX + wi * SG + SW / 2, 256, "tick", String(wkB), "middle");
    rowA.push({ r: ra, t: ta, w: wi + 1 }); rowB.push({ r: rb, t: tb, w: wkB, k: wi });
  }
  var braces = el("g", {}, svg);
  function brace(x0, x1, y, color, label, n) {
    el("path", { d: "M " + x0 + " " + y + " L " + x0 + " " + (y + 8) + " L " + x1 + " " + (y + 8) + " L " + x1 + " " + y, fill: "none", stroke: color, "stroke-width": 2.5 }, braces);
    txt(braces, (x0 + x1) / 2, y + 26, "lbl", label, "middle").style.fill = color;
    txt(braces, (x0 + x1) / 2, y + 42, "note", n, "middle");
  }
  brace(SX, SX + 13 * SG + SW, 160, K_TR, "training", "wk 1-14, 700");
  brace(SX + 14 * SG, SX + 16 * SG + SW, 160, K_VA, "validation", "wk 15-17, 150");
  brace(SX + 17 * SG, SX + 19 * SG + SW, 160, K_TE, "test", "wk 18-20, 150");
  var bTr = braces.childNodes, lockG = el("g", {}, svg);
  lockIcon(lockG, SX + 18 * SG + SW / 2, 80, 1.6);
  var panel = mkPanel(svg, 30, 290, 580, 60, "fillG");
  var warn = el("g", {}, svg);
  card(warn, 30, 290, 580, 60, "fillB");
  txt(warn, 320, 314, "lbl lbl-y", "validation customers observed before the newest training customer", "middle");
  txt(warn, 320, 338, "mono", "chronological split: 0 of 150     random split: 144 of 150", "middle");
  var info = el("g", {}, svg);
  card(info, 30, 290, 580, 60, "fillG");
  var in1 = txt(info, 320, 314, "lbl lbl-y", "", "middle"), in2 = txt(info, 320, 338, "note", "", "middle");
  show(panel.g, false);
  var VIS = { 2: [1, 0, 0], 3: [1, 1, 0], 4: [1, 1, 1], 5: [1, 0, 0], 6: [1, 1, 0], 7: [1, 1, 1], 8: [0, 0, 0], 9: [1, 1, 1] };
  function render(i) {
    var showTr = i >= 2, showVa = i >= 3, showTe = i >= 4;
    rowA.forEach(function (c) {
      var on = (c.w <= 14 && showTr) || (c.w >= 15 && c.w <= 17 && showVa) || (c.w >= 18 && showTe);
      c.r.setAttribute("fill", on ? setting(c.w) : "rgba(143,168,156,0.35)"); c.t.style.fill = on ? "#071510" : "";
    });
    var mixed = i === 1 || i === 8;
    rowB.forEach(function (c) {
      c.r.setAttribute("fill", i === 8 ? (c.k < 14 ? K_TR : (c.k < 17 ? K_VA : K_TE)) : "rgba(143,168,156,0.35)");
      c.r.setAttribute("opacity", mixed ? "1" : "0"); c.t.setAttribute("opacity", mixed ? "1" : "0"); c.t.style.fill = i === 8 ? "#071510" : "";
    });
    labB.setAttribute("opacity", mixed ? "1" : "0");
    labA.setAttribute("opacity", i <= 1 || i === 8 ? "1" : "0");
    show(braces, true);
    var v = VIS[i] || [0, 0, 0];
    for (var g = 0; g < 3; g++) for (var q = 0; q < 3; q++) braces.childNodes[g * 3 + q].setAttribute("opacity", v[g] ? "1" : "0");
    show(lockG, i === 7 || i === 9);
    show(warn, i === 8); show(info, i !== 8);
    head.textContent = i === 0 ? "1,000 customers · 50 new observations per week · weeks 1–20" : "";
    var t1 = ["all 1,000 observations", "choose how to split: by time or at random", "training set: fits the parameters", "validation set: chooses models and settings", "test set: one final estimate", "train is open: the model learns from it", "validation is open: we compare and choose with it", "test is locked: nobody looks until the end", "a random split lets the model see the future", "700 / 150 / 150, test locked"][i];
    var t2 = ["20 weeks of customers, positive class = churn", "this model predicts forward in time, so keep the weeks in order", "700 customers (weeks 1–14)", "150 customers (weeks 15–17)", "150 customers (weeks 18–20), kept untouched", "parameters change only because of training data", "scores here guide every choice we make", "opening it early would make the final number optimistic", "chronological split: every validation week is after every training week", "no overlap between the sets; the test set is opened once"][i];
    in1.textContent = t1; in2.textContent = t2;
  }
  flatCards();
