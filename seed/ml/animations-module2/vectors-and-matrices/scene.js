  var steps = [
    { id: "scalar", label: "A scalar is one number", caption: "A scalar is a single number, such as the area of one house: 1200." },
    { id: "vector", label: "A vector is a list of numbers", caption: "Put several numbers in order and you get a vector. This house is x = [1200, 2, 10]." },
    { id: "dimensions", label: "The dimension counts the entries", caption: "x has 3 entries (area, bedrooms, age), so it is a 3-dimensional vector." },
    { id: "matrix", label: "Stack vectors into a matrix", caption: "Stack one vector per house and you get a matrix X: a table of numbers." },
    { id: "rows-columns", label: "Rows are houses, columns are features", caption: "Each row is one house. Each column is one feature, measured for every house." },
    { id: "transpose", label: "Transpose: swap rows and columns", caption: "The transpose flips the table: rows become columns and columns become rows." },
    { id: "ml-dataset", label: "A dataset is a matrix", caption: "In machine learning a dataset is a matrix of examples: one row per example, one column per feature." }
  ];

  var X = [[1200, 2, 10], [1800, 3, 4], [900, 1, 15]];
  var FEATURES = ["area", "bedrooms", "age"];
  var HOUSES = ["house 1", "house 2", "house 3"];

  var heading = txt(svg, 320, 48, "big", "", "middle");
  var footnote = txt(svg, 320, 334, "note", "", "middle");

  // One group per number. Positions change between steps.
  var cells = [];
  for (var r = 0; r < 3; r++) {
    cells.push([]);
    for (var c = 0; c < 3; c++) {
      var g = el("g", { class: "cell", opacity: 0 }, svg);
      el("rect", { x: 0, y: 0, width: 76, height: 42, rx: 7 }, g);
      txt(g, 38, 27, "cell-t", String(X[r][c]), "middle");
      cells[r].push(g);
    }
  }
  var rowLbl = [0, 1, 2].map(function () { return txt(svg, 196, 0, "lbl", "", "end"); });
  var colLbl = [0, 1, 2].map(function () { return txt(svg, 0, 100, "lbl", "", "middle"); });
  var bigX = txt(svg, 80, 188, "big", "", "middle");
  var tagRow = txt(svg, 214, 292, "lbl lbl-y", "", "start");
  var tagCol = txt(svg, 214, 312, "lbl lbl-g", "", "start");
  var brace = el("line", { x1: 204, y1: 214, x2: 204 + 3 * 86 - 10, y2: 214, stroke: "#e2b44a", "stroke-width": 2 }, svg);
  var braceTxt = txt(svg, 320, 238, "lbl lbl-y", "", "middle");

  function matPos(rr, cc) { return [214 + cc * 86, 112 + rr * 54]; }
  function vecPos(cc) { return [206 + cc * 86, 150]; }

  function layoutMatrix(transposed, labelsFor) {
    for (var rr = 0; rr < 3; rr++) {
      for (var cc = 0; cc < 3; cc++) {
        var p = transposed ? matPos(cc, rr) : matPos(rr, cc);
        place(cells[rr][cc], p[0], p[1]);
        show(cells[rr][cc], true);
      }
    }
    var rowsText = transposed ? FEATURES : HOUSES;
    var colsText = transposed ? HOUSES : FEATURES;
    if (labelsFor === "example") { rowsText = transposed ? ["feature 1", "feature 2", "feature 3"] : ["example 1", "example 2", "example 3"]; colsText = transposed ? ["example 1", "example 2", "example 3"] : ["feature 1", "feature 2", "feature 3"]; }
    for (var i = 0; i < 3; i++) {
      rowLbl[i].textContent = rowsText[i];
      rowLbl[i].setAttribute("y", matPos(i, 0)[1] + 27);
      colLbl[i].textContent = colsText[i];
      colLbl[i].setAttribute("x", matPos(0, i)[0] + 38);
      show(rowLbl[i], true);
      show(colLbl[i], true);
    }
  }

  function clearHighlights() {
    for (var rr = 0; rr < 3; rr++) for (var cc = 0; cc < 3; cc++) cells[rr][cc].setAttribute("class", "cell");
  }

  function render(index, id) {
    clearHighlights();
    heading.textContent = "";
    footnote.textContent = "";
    bigX.textContent = "";
    tagRow.textContent = "";
    tagCol.textContent = "";
    braceTxt.textContent = "";
    show(brace, false);
    for (var i = 0; i < 3; i++) { show(rowLbl[i], false); show(colLbl[i], false); }
    for (var rr = 0; rr < 3; rr++) for (var cc = 0; cc < 3; cc++) show(cells[rr][cc], false);

    if (id === "scalar") {
      heading.textContent = "scalar";
      place(cells[0][0], 282, 150);
      show(cells[0][0], true);
      footnote.textContent = "area = 1200   (one number)";
    } else if (id === "vector" || id === "dimensions") {
      heading.textContent = "vector  x = [1200, 2, 10]";
      for (var c2 = 0; c2 < 3; c2++) {
        place(cells[0][c2], vecPos(c2)[0], vecPos(c2)[1]);
        show(cells[0][c2], true);
        colLbl[c2].textContent = FEATURES[c2];
        colLbl[c2].setAttribute("x", vecPos(c2)[0] + 38);
        colLbl[c2].setAttribute("y", 138);
        show(colLbl[c2], true);
      }
      if (id === "dimensions") {
        show(brace, true);
        braceTxt.textContent = "3 entries  →  dimension 3";
      }
    } else if (id === "matrix") {
      for (var k = 0; k < 3; k++) colLbl[k].setAttribute("y", 100);
      layoutMatrix(false);
      bigX.textContent = "X =";
      footnote.textContent = "3 houses × 3 features  →  a 3 × 3 matrix";
    } else if (id === "rows-columns") {
      for (var k2 = 0; k2 < 3; k2++) colLbl[k2].setAttribute("y", 100);
      layoutMatrix(false);
      bigX.textContent = "X =";
      for (var a = 0; a < 3; a++) {
        cells[1][a].setAttribute("class", "cell hl-row");
        cells[a][0].setAttribute("class", "cell hl-col");
      }
      cells[1][0].setAttribute("class", "cell hl-both");
      tagRow.textContent = "row = one house";
      tagCol.textContent = "column = one feature";
    } else if (id === "transpose") {
      for (var k3 = 0; k3 < 3; k3++) colLbl[k3].setAttribute("y", 100);
      layoutMatrix(true);
      bigX.textContent = "Xᵀ =";
      footnote.textContent = "rows ↔ columns: the first row of Xᵀ is the area of every house";
    } else {
      for (var k4 = 0; k4 < 3; k4++) colLbl[k4].setAttribute("y", 100);
      layoutMatrix(false, "example");
      bigX.textContent = "X =";
      heading.textContent = "ML dataset = matrix of examples";
      footnote.textContent = "one row per example, one column per feature";
    }
  }
