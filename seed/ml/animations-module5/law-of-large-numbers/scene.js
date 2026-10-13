  var steps = [
    { id: "few-samples", label: "Only a few flips", caption: "Suppose the coin truly has p = 0.8, but we do not know it. After the first 5 flips, the fraction of heads (the sample mean) is a rough, jumpy guess." },
    { id: "running-average", label: "Track the running average", caption: "After every new flip, recompute the fraction of heads so far. This is the running average. Each point is the average of all flips up to that point." },
    { id: "fluctuation", label: "Early fluctuation", caption: "At the start a single flip is a big share of the sample, so the average jumps around a lot: 1.0, 0.5, 0.67, 0.5, 0.6 over the first five flips, then 0.67, 0.71, 0.63 ..." },
    { id: "more-samples", label: "More samples, a second run", caption: "Keep flipping. The horizontal axis is the number of flips, drawn on a log scale. A second run of the same coin (pink) wanders along a different path." },
    { id: "stabilize", label: "The averages settle", caption: "By 100 flips both runs sit near the same level and move much less. By 1000 flips they are both very close to it." },
    { id: "true-mean", label: "They settle near the true value", caption: "That level is the true p = 0.8, the expected value of one flip. The running average gets close without ever being guaranteed to hit it exactly." },
    { id: "lln-idea", label: "What the law says (and does not)", caption: "The law of large numbers: as n grows, the sample mean settles toward the expected value. It does NOT say every new flip helps: here the pink run was exactly 0.8 at n = 10, then drifted to 0.63 by n = 30 before coming back." },
    { id: "ml-connection", label: "Why ML cares", caption: "An average over more data is a steadier estimate of an expectation. That is why the average loss on a big dataset is close to the true expected loss, and why more data gives steadier estimates." }
  ];

  function seq(seed) {
    var r = mulberry(seed), s = 0, out = [];
    for (var i = 1; i <= 1000; i++) { s += r() < 0.8 ? 1 : 0; out.push(s / i); }
    return out;
  }
  var A = seq(9), B = seq(6);
  var PXs = function (n) { return 74 + 520 * (Math.log(n) / Math.LN10) / 3; };
  var PYs = function (v) { return 300 - 230 * v; };

  var axG = el("g", {}, svg);
  el("line", { x1: 74, y1: 300, x2: 600, y2: 300, class: "axis" }, axG);
  el("line", { x1: 74, y1: 300, x2: 74, y2: 62, class: "axis" }, axG);
  [1, 10, 100, 1000].forEach(function (n) { txt(axG, PXs(n), 318, "tick", String(n), "middle"); });
  [0, 0.5, 1].forEach(function (v) { txt(axG, 66, PYs(v) + 4, "tick", String(v), "end"); });
  txt(axG, 600, 336, "note", "number of flips so far (log scale)", "end");
  txt(axG, 80, 54, "note", "fraction of heads so far", "start");

  var trueG = el("g", {}, svg);
  el("line", { x1: 74, y1: PYs(0.8), x2: 600, y2: PYs(0.8), stroke: "#e2b44a", "stroke-width": 2.5, "stroke-dasharray": "7 5" }, trueG);
  txt(trueG, 596, PYs(0.8) - 8, "lbl lbl-y", "true p = 0.8", "end");

  var lineA = el("polyline", { fill: "none", stroke: "#38bdf8", "stroke-width": 2.5 }, svg);
  var lineB = el("polyline", { fill: "none", stroke: "#f472b6", "stroke-width": 2.5 }, svg);
  var dotsA = [];
  for (var i = 0; i < 30; i++) dotsA.push(el("circle", { cx: PXs(i + 1), cy: PYs(A[i]), r: 4.5, fill: "#38bdf8", stroke: "#071510", "stroke-width": 1.5 }, svg));
  var endA = el("circle", { r: 6, fill: "#38bdf8", stroke: "#071510", "stroke-width": 2 }, svg);
  var endB = el("circle", { r: 6, fill: "#f472b6", stroke: "#071510", "stroke-width": 2 }, svg);
  var readout = txt(svg, 90, 90, "mono", "", "start");

  var driftG = el("g", {}, svg);
  el("rect", { x: PXs(10), y: PYs(0.95), width: PXs(30) - PXs(10), height: PYs(0.55) - PYs(0.95), rx: 8, fill: "rgba(248,113,113,0.14)", stroke: "#f87171", "stroke-width": 2, "stroke-dasharray": "5 4" }, driftG);
  txt(driftG, PXs(10), PYs(0.55) + 16, "lbl lbl-r", "moved AWAY from 0.8", "start");
  txt(driftG, PXs(10), PYs(0.55) + 32, "note", "(n = 10: 0.80, n = 30: 0.63)", "start");

  var mlG = el("g", {}, svg);
  card(mlG, 40, 80, 270, 150, "fillA");
  txt(mlG, 175, 116, "lbl lbl-b", "AVERAGE LOSS", "middle");
  txt(mlG, 175, 148, "big", "on a larger dataset", "middle");
  txt(mlG, 175, 178, "note", "is steadier and closer to", "middle");
  txt(mlG, 175, 196, "note", "the true expected loss", "middle");
  card(mlG, 330, 80, 270, 150, "fillB");
  txt(mlG, 465, 116, "lbl lbl-p", "MORE DATA", "middle");
  txt(mlG, 465, 148, "big", "steadier estimates", "middle");
  txt(mlG, 465, 178, "note", "but how tightly do averages", "middle");
  txt(mlG, 465, 196, "note", "cluster? next: the CLT", "middle");
  txt(mlG, 320, 270, "lbl lbl-y", "empirical averages approximate expectations", "middle");

  function draw(nShow, showB) {
    var pa = [], pb = [];
    var step = nShow > 60 ? 1 : 1;
    for (var n = 1; n <= nShow; n += step) { pa.push(PXs(n).toFixed(1) + "," + PYs(A[n - 1]).toFixed(1)); pb.push(PXs(n).toFixed(1) + "," + PYs(B[n - 1]).toFixed(1)); }
    lineA.setAttribute("points", pa.join(" "));
    lineB.setAttribute("points", showB ? pb.join(" ") : "");
    endA.setAttribute("cx", PXs(nShow)); endA.setAttribute("cy", PYs(A[nShow - 1]));
    endB.setAttribute("cx", PXs(nShow)); endB.setAttribute("cy", PYs(B[nShow - 1]));
    show(endB, showB);
    for (var k = 0; k < 30; k++) dotsA[k].setAttribute("opacity", k < Math.min(nShow, 10) && nShow <= 10 ? "1" : "0");
    readout.textContent = "n = " + nShow + "   run A: " + fmt(A[nShow - 1], 2) + (showB ? "   run B: " + fmt(B[nShow - 1], 2) : "");
  }

  function render(index, id) {
    var i = index;
    show(axG, i <= 6);
    show(trueG, i >= 5 && i <= 6);
    show(driftG, i === 6);
    show(lineA, i <= 6); show(lineB, i >= 3 && i <= 6);
    show(endA, i <= 6);
    show(readout, i <= 5);
    show(mlG, i === 7);
    if (i >= 5) vis(dotsA, false);
    if (i === 0) draw(5, false);
    if (i === 1) draw(10, false);
    if (i === 2) draw(30, false);
    if (i === 3) anim("n", 2200, function (e) { draw(Math.round(30 * Math.pow(200 / 30, e)), true); });
    if (i === 4) anim("n", 2600, function (e) { draw(Math.round(200 * Math.pow(1000 / 200, e)), true); });
    if (i >= 5 && i <= 6) draw(1000, true);
  }
