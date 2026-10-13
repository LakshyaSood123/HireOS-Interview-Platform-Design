  var steps = [
    { id: "variable-x", label: "A first variable: bedrooms", caption: "Look at houses. Let X = the number of bedrooms: 1, 2 or 3. Each house has one value of X." },
    { id: "variable-y", label: "A second variable: price band", caption: "Each house also has a price band. Let Y = Low or High. Now every house carries two values at once." },
    { id: "pair-values", label: "Pairs of values", caption: "Together the two variables give pairs: (1, Low), (1, High), (2, Low) and so on. With 3 × 2 choices there are 6 possible pairs, one per cell of a table." },
    { id: "grid", label: "One cell, one pair", caption: "Each cell stands for one combination. The highlighted cell is the pair (3 bedrooms, High price). We want a probability for every cell." },
    { id: "joint-probabilities", label: "The joint probabilities", caption: "P(X = x, Y = y) is the probability of both happening together. For example P(X = 3, Y = High) = 0.25: 25% of all houses. All six cells add up to 1." },
    { id: "pattern", label: "Reading the pattern", caption: "Small houses are mostly Low priced (0.25 versus 0.05); big houses are mostly High (0.25 versus 0.05). The numbers are not spread evenly, so the variables are related." },
    { id: "ml-features", label: "Why ML cares: features together", caption: "A dataset is a pile of samples from a joint distribution: each row holds several variables at once. Models learn how features relate by learning about this joint behavior." }
  ];

  var ROWS = [1, 2, 3], COLS = ["Low", "High"];
  var P = { "1,Low": 0.25, "1,High": 0.05, "2,Low": 0.20, "2,High": 0.20, "3,Low": 0.05, "3,High": 0.25 };
  var GX = 230, GY = 110, CW = 140, CH = 66;

  var gridG = el("g", {}, svg);
  var cells = {}, pairLbls = {}, probLbls = {};
  ROWS.forEach(function (r, ri) {
    COLS.forEach(function (c, ci) {
      var key = r + "," + c;
      var x = GX + ci * CW, y = GY + ri * CH;
      cells[key] = box(gridG, x + 3, y + 3, CW - 6, CH - 6, "rgba(56,189,248,0.08)", "rgba(56,189,248,0.5)", 8);
      pairLbls[key] = txt(gridG, x + CW / 2, y + CH / 2 + 5, "lbl", "(" + r + ", " + c + ")", "middle");
      probLbls[key] = txt(gridG, x + CW / 2, y + CH / 2 + 9, "big", P[key].toFixed(2), "middle");
      probLbls[key].setAttribute("font-size", "22");
    });
  });
  var rowHdr = el("g", {}, svg);
  ROWS.forEach(function (r, ri) {
    txt(rowHdr, GX - 14, GY + ri * CH + CH / 2 + 6, "big", r + (r === 1 ? " bedroom" : " bedrooms"), "end").setAttribute("font-size", "15");
  });
  txt(rowHdr, 26, 84, "lbl lbl-y", "X = number of bedrooms", "start");
  var colHdr = el("g", {}, svg);
  COLS.forEach(function (c, ci) {
    txt(colHdr, GX + ci * CW + CW / 2, GY - 12, "big", c, "middle").setAttribute("font-size", "17");
  });
  txt(colHdr, GX + CW, GY - 36, "lbl lbl-p", "Y = price band", "middle");

  var spotlight = el("rect", { x: GX + CW + 1, y: GY + 2 * CH + 1, width: CW - 2, height: CH - 2, rx: 10, fill: "none", stroke: "#e2b44a", "stroke-width": 4 }, svg);
  var spotLbl = txt(svg, GX + 2 * CW + 12, GY + 2 * CH + CH / 2 + 5, "lbl lbl-y", "one cell = one pair", "start");
  var sumLbl = txt(svg, GX + CW, GY + 3 * CH + 30, "big", "all six add up to 1.00", "middle");
  var patG = el("g", {}, svg);
    txt(patG, GX + 2 * CW + 12, GY + 60, "lbl lbl-g", "bigger houses go", "start");
  txt(patG, GX + 2 * CW + 12, GY + 78, "lbl lbl-g", "with higher prices,", "start");
  txt(patG, GX + 2 * CW + 12, GY + 96, "lbl lbl-g", "small ones with", "start");
  txt(patG, GX + 2 * CW + 12, GY + 114, "lbl lbl-g", "lower prices", "start");

  var featG = el("g", {}, svg);
  card(featG, 60, 36, 300, 40, "fillA");
  txt(featG, 130, 62, "lbl", "bedrooms", "middle");
  txt(featG, 290, 62, "lbl", "price band", "middle");
  [[3, "High"], [1, "Low"], [2, "Low"], [3, "High"], [2, "High"]].forEach(function (row, i) {
    var y = 84 + i * 44;
    card(featG, 60, y, 300, 38, "fillG");
    txt(featG, 130, y + 25, "mono", String(row[0]), "middle");
    txt(featG, 290, y + 25, "mono", row[1], "middle");
  });
  txt(featG, 210, 22, "lbl lbl-y", "five houses from the dataset", "middle");
  var fa = arrow(featG, "w", 4); setLine(fa, 368, 180, 428, 180);
  card(featG, 436, 120, 184, 120, "fillB");
  txt(featG, 528, 154, "lbl", "each row is one sample", "middle");
  txt(featG, 528, 176, "lbl", "from the joint", "middle");
  txt(featG, 528, 198, "lbl", "distribution of", "middle");
  txt(featG, 528, 220, "lbl lbl-y", "(bedrooms, price)", "middle");

  function render(index, id) {
    var i = index;
    show(gridG, i <= 5);
    show(rowHdr, i <= 5);
    show(colHdr, i >= 1 && i <= 5);
    show(spotlight, i === 3); show(spotLbl, i === 3);
    show(sumLbl, i === 4);
    show(patG, i === 5);
    show(featG, i === 6);
    ROWS.forEach(function (r) {
      COLS.forEach(function (c) {
        var key = r + "," + c;
        var showNums = i >= 4;
        show(pairLbls[key], i === 2 || i === 3);
        show(probLbls[key], showNums);
        var p = P[key];
        var strong = key === "1,Low" || key === "3,High";
        var fill = "rgba(56,189,248,0.08)";
        if (showNums) fill = "rgba(56,189,248," + (0.1 + (p / 0.25) * 0.5).toFixed(2) + ")";
        if (i === 5) fill = strong ? "rgba(29,181,132,0.6)" : "rgba(56,189,248," + (0.05 + (p / 0.25) * 0.15).toFixed(2) + ")";
        cells[key].setAttribute("fill", fill);
        cells[key].setAttribute("opacity", i === 5 && !strong ? "0.55" : "1");
      });
    });
  }
