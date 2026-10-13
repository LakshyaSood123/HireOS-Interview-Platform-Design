  var steps = [
    { id: "initialize", label: "Initialize the parameters", caption: "Start from a blank guess: w = 0, b = 0 (a flat line along the bottom) with learning rate η = 0.1. Training will improve it step by step." },
    { id: "predict", label: "Predict", caption: "Predict every house with the current line: ŷ = w·x + b. With w = 0 and b = 0, every prediction is 0." },
    { id: "measure-error", label: "Measure the error", caption: "Residuals ŷ − y are −2.0, −2.8, −3.7, −4.1, −5.2, so the MSE is huge: 13.876. The line is far below every house." },
    { id: "compute-gradients", label: "Compute the gradients", caption: "Slopes of the MSE: ∂MSE/∂w = (2/n) Σ r·x = −15.78 and ∂MSE/∂b = (2/n) Σ r = −7.12. Both are negative, so raising w and b lowers the MSE." },
    { id: "update-w", label: "Update w", caption: "w ← w − η·∂MSE/∂w = 0 − 0.1 × (−15.78) = 1.578. The line tilts upward." },
    { id: "update-b", label: "Update b", caption: "b ← b − η·∂MSE/∂b = 0 − 0.1 × (−7.12) = 0.712. Both parameters are updated together from the same residuals: w = 1.578 combined with b = 0.712 after the first round." },
    { id: "new-line", label: "The new line", caption: "After one round the line passes through the houses and the MSE has dropped from 13.876 to 0.1122." },
    { id: "repeat", label: "Repeat the loop", caption: "Predict, measure, compute gradients, update, again and again. The line settles quickly and the MSE falls by orders of magnitude." },
    { id: "trained-line", label: "The trained line", caption: "After 500 rounds: w = 1.54, b = 0.48, MSE 0.0166. This is the least-squares line. Training is just this loop run many times." }
  ];

  var g = housePlot(svg, 46, 318, 84, 44, 3.8, 6.4);
  clipTo("plotclip", 46, 30, 330, 292);
  var PATH = gdPath(500);
  function lossAt(k) { var p = PATH[k]; return mseOf(function (x) { return p[0] * x + p[1]; }, HOUSES); }

  var trail = [1, 2, 3, 5, 10, 30].map(function (k) {
    return el("path", { class: "ghost", d: wbPath(g, PATH[k][0], PATH[k][1], 0, 3.8), "clip-path": "url(#plotclip)" }, svg);
  });
  var fitLine = el("path", { class: "curve-g", d: "M 0 0", "clip-path": "url(#plotclip)" }, svg);
  var resG = el("g", {}, svg);
  var resLines = HOUSES.map(function () { return el("line", { stroke: C_RES, "stroke-width": 4, "stroke-linecap": "round" }, resG); });
  var predG = el("g", {}, svg);
  var predRings = HOUSES.map(function () { return el("circle", { r: 6, fill: "none", stroke: C_FIT, "stroke-width": 3 }, predG); });
  var dotsA = dotSet(svg, g, HOUSES, C_TRAIN, 6);

  // Right panel: parameters, gradients, loss curve.
  var parG = el("g", {}, svg);
  card(parG, 398, 30, 234, 76, "fillG");
  var wTxt = txt(parG, 415, 56, "mono", "", "start");
  var bTxt = txt(parG, 415, 80, "mono", "", "start");
  var lrTxt = txt(parG, 590, 56, "lbl lbl-y", "η = 0.1", "end");
  var mseTxt = txt(parG, 590, 80, "lbl lbl-r", "", "end");

  var gradG = el("g", {}, svg);
  card(gradG, 398, 114, 234, 74, "fillB");
  txt(gradG, 415, 136, "lbl", "gradients (slopes of MSE)", "start");
  var gwTxt = txt(gradG, 415, 160, "mono", "", "start");
  var gbTxt = txt(gradG, 415, 180, "mono", "", "start");

  var lossG = el("g", {}, svg);
  card(lossG, 398, 196, 234, 142, "fillA");
  txt(lossG, 415, 216, "lbl", "MSE after round k (log scale)", "start");
  var LC = { x0: 424, x1: 612, y0: 306, y1: 232 };
  var KS = [0, 1, 2, 3, 5, 10, 20, 50, 100, 500];
  function lx(ix) { return LC.x0 + (LC.x1 - LC.x0) * (ix / (KS.length - 1)); }
  function ly(v) { var t = (Math.log(v) / Math.LN10 + 2) / 3.2; return LC.y0 - (LC.y0 - LC.y1) * t; }
  el("line", { x1: LC.x0, y1: LC.y0, x2: LC.x1, y2: LC.y0, class: "axis" }, lossG);
  KS.forEach(function (k, ix) { txt(lossG, lx(ix), LC.y0 + 13, "tick", String(k), "middle"); });
  txt(lossG, 515, 334, "note", "round", "middle");
  var lossPts = KS.map(function (k, ix) { return [lx(ix), ly(lossAt(k))]; });
  var lossPath = el("path", { class: "curve-y", d: lossPts.map(function (p, n) { return (n ? "L " : "M ") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ") }, lossG);
  lossPts.forEach(function (p) { el("circle", { cx: p[0], cy: p[1], r: 2.5, fill: "#e2b44a" }, lossG); });
  var lossDot = el("circle", { r: 6, fill: C_FIT, stroke: "#071510", "stroke-width": 2 }, lossG);
  function setLossDot(k) { var ix = KS.indexOf(k); lossDot.setAttribute("cx", lx(ix)); lossDot.setAttribute("cy", ly(lossAt(k))); }

  function setFit(w, b) { fitLine.setAttribute("d", wbPath(g, w, b, 0, 3.8)); }
  function setResid(w, b) {
    HOUSES.forEach(function (d, i) {
      var yh = w * d[0] + b;
      setLine(resLines[i], g.x(d[0]), g.y(yh), g.x(d[0]), g.y(d[1]));
      predRings[i].setAttribute("cx", g.x(d[0])); predRings[i].setAttribute("cy", g.y(yh));
    });
  }
  function setReadout(w, b, loss) {
    wTxt.textContent = "w = " + w.toFixed(3);
    bTxt.textContent = "b = " + b.toFixed(3);
    mseTxt.textContent = "MSE " + loss.toFixed(4);
  }

  function render(index, id) {
    var i = index;
    show(fitLine, true);
    trail.forEach(function (t, n) { show(t, i === 7 && n < 5); });
    show(predG, i === 1 || i === 2);
    show(resG, i >= 2 && i <= 6);
    show(gradG, i >= 3 && i <= 5);
    show(lossG, i >= 6);
    if (i <= 3) {
      setFit(0, 0); setResid(0, 0); setReadout(0, 0, 13.876);
    }
    if (i === 3) {
      gwTxt.textContent = "∂/∂w = −15.78"; gbTxt.textContent = "∂/∂b = −7.12";
    }
    if (i === 4) {
      gwTxt.textContent = "∂/∂w = −15.78"; gbTxt.textContent = "∂/∂b = −7.12";
      anim("upd", 800, function (e) { setFit(lerp(0, PATH[1][0], e), 0); setResid(lerp(0, PATH[1][0], e), 0); });
      wTxt.textContent = "w = 0 → " + PATH[1][0].toFixed(3); bTxt.textContent = "b = 0.000"; mseTxt.textContent = "";
    }
    if (i === 5) {
      gwTxt.textContent = "∂/∂w = −15.78"; gbTxt.textContent = "∂/∂b = −7.12";
      anim("upd", 800, function (e) { setFit(PATH[1][0], lerp(0, PATH[1][1], e)); setResid(PATH[1][0], lerp(0, PATH[1][1], e)); });
      wTxt.textContent = "w = " + PATH[1][0].toFixed(3); bTxt.textContent = "b = 0 → " + PATH[1][1].toFixed(3); mseTxt.textContent = "";
    }
    if (i === 6) {
      setFit(PATH[1][0], PATH[1][1]); setResid(PATH[1][0], PATH[1][1]); setReadout(PATH[1][0], PATH[1][1], lossAt(1));
      setLossDot(1);
    }
    if (i === 7) {
      var seq = [1, 2, 3, 5, 10, 20, 50];
      anim("rep", 2400, function (e) {
        var idx = Math.min(seq.length - 1, Math.floor(e * seq.length));
        var kk = seq[idx];
        setFit(PATH[kk][0], PATH[kk][1]); setResid(PATH[kk][0], PATH[kk][1]); setReadout(PATH[kk][0], PATH[kk][1], lossAt(kk));
        setLossDot(kk);
      });
    }
    if (i === 8) {
      setFit(PATH[500][0], PATH[500][1]); setResid(PATH[500][0], PATH[500][1]); setReadout(PATH[500][0], PATH[500][1], lossAt(500));
      setLossDot(500);
    }
  }
