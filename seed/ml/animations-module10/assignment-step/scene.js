  var steps = [
    { id: "fixed-centers", label: "The centers are fixed", caption: "Assignment step: the three centers (diamonds) are fixed where they are. Only memberships will change." },
    { id: "select-point", label: "Pick one customer", caption: "Take the customer P = (6.8, 6.8) and ask which center it should join." },
    { id: "distance-c1", label: "Distance to C1", caption: "Distance from P to C1 = (3, 4): sqrt(3.8² + 2.8²) = 4.72." },
    { id: "distance-c2", label: "Distance to C2", caption: "Distance from P to C2 = (5, 3): sqrt(1.8² + 3.8²) = 4.20." },
    { id: "distance-c3", label: "Distance to C3", caption: "Distance from P to C3 = (5, 9.5): sqrt(1.8² + 2.7²) = 3.24." },
    { id: "nearest-center", label: "The nearest center", caption: "The smallest of the three distances is 3.24, to C3. The other two are farther, so they lose." },
    { id: "assign-point", label: "Assign the point", caption: "P joins the cluster of C3 (id 2). The id is just a name; cluster 2 is not better or larger than cluster 0." },
    { id: "repeat-points", label: "Repeat for every point", caption: "Every other customer does the same: compute the distance to all three centers and join the nearest." },
    { id: "assigned-groups", label: "The assigned groups", caption: "Result: four customers join C1, three join C2 and five join C3. The centers did not move at all. Updating the centers is the next step." }
  ];

  var plotG = el("g", {}, svg);
  var G = custPlot(plotG, 50, 330, 36, 30, 10, 10);
  var Pi = 7, PT = CPTS[Pi];
  var A1 = assignAll(CPTS, C0);
  var lineG = el("g", {}, svg);
  var dl = [0, 1, 2].map(function (k) {
    var ln = el("line", { stroke: KC[k], "stroke-width": 3, "stroke-linecap": "round" }, lineG);
    setLine(ln, G.x(PT[0]), G.y(PT[1]), G.x(C0[k][0]), G.y(C0[k][1]));
    var mx = (G.x(PT[0]) + G.x(C0[k][0])) / 2, my = (G.y(PT[1]) + G.y(C0[k][1])) / 2;
    var t = txt(lineG, mx, my - 6, "lbl", f2(dist2d(PT, C0[k])), "middle");
    t.style.fill = KC[k];
    return { line: ln, text: t };
  });
  var dots = ptDots(svg, G, CPTS, 8);
  var ring = el("circle", { cx: G.x(PT[0]), cy: G.y(PT[1]), r: 14, fill: "none", stroke: "#e6f5ec", "stroke-width": 3 }, svg);
  txt(svg, G.x(PT[0]) + 14, G.y(PT[1]) - 12, "lbl", "P", "start");
  var marks = [0, 1, 2].map(function (k) {
    var m = centerMark(svg, KC[k]); setCenter(m, G, C0[k]);
    txt(svg, G.x(C0[k][0]) + 14, G.y(C0[k][1]) + 18, "lbl", "C" + (k + 1), "start").style.fill = KC[k];
    return m;
  });
  var panel = el("g", {}, svg);
  card(panel, 424, 50, 206, 200, "fillG");
  txt(panel, 527, 76, "lbl lbl-y", "distance from P", "middle");
  var bars = [0, 1, 2].map(function (k) {
    var y = 100 + k * 46;
    txt(panel, 440, y + 22, "lbl", "C" + (k + 1), "start").style.fill = KC[k];
    var b = box(panel, 470, y, 10, 30, KC[k], "none", 5);
    var v = txt(panel, 480, y + 22, "mono", "", "start");
    return { bar: b, val: v, y: y };
  });
  var verdict = txt(panel, 527, 242, "lbl lbl-g", "", "middle");
  var note = txt(svg, 527, 290, "note", "", "middle");

  function showBars(n) {
    bars.forEach(function (b, k) {
      var d = dist2d(PT, C0[k]);
      show(b.bar, k < n); show(b.val, k < n);
      setBox(b.bar, 470, b.y, d * 22, 30);
      b.val.textContent = f2(d);
      b.val.setAttribute("x", 470 + d * 22 + 6);
    });
  }

  function render(index, id) {
    var i = index;
    show(ring, i >= 1 && i <= 6);
    show(lineG, i >= 2 && i <= 6);
    dl.forEach(function (d, k) { show(d.line, i >= 2 + k); show(d.text, i >= 2 + k); d.line.setAttribute("opacity", i >= 5 && k !== 2 ? "0.25" : "1"); d.text.setAttribute("opacity", i >= 5 && k !== 2 ? "0.25" : "1"); });
    show(panel, i >= 2 && i <= 6);
    showBars(i >= 2 ? Math.min(3, i - 1) : 0);
    verdict.textContent = i >= 5 ? "smallest: C3" : "";
    show(note, i === 0 || i === 8);
    note.textContent = i === 0 ? "centers stay where they are" : i === 8 ? "centers did not move" : "";
    dots.forEach(function (d, k) {
      var coloured = i >= 8 || (i >= 6 && k === Pi);
      d.setAttribute("fill", coloured ? KC[A1[k]] : C_GRAY);
    });
    if (i === 7) {
      anim("rep", 1800, function (e) {
        var n = Math.floor(e * 12);
        dots.forEach(function (d, k) { d.setAttribute("fill", (k === Pi || k < n) ? KC[A1[k]] : C_GRAY); });
      });
    }
  }
