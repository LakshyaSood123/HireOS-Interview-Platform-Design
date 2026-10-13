  var steps = [
    { id: "target-vector", label: "A vector a we want to describe", caption: "Here is a vector a. Suppose we are only allowed to move along one direction." },
    { id: "direction", label: "A direction b", caption: "That direction is the line through the vector b. Which point on this line is closest to a?" },
    { id: "drop-perpendicular", label: "Drop a perpendicular", caption: "Drop a straight line from the tip of a down to the line, meeting it at a right angle." },
    { id: "projection", label: "The projection is the shadow", caption: "Where the perpendicular lands is the projection of a onto b: the part of a that points along b." },
    { id: "residual", label: "What is left over: the residual", caption: "The leftover part, a minus its projection, is the residual. It is perpendicular to b." },
    { id: "formula", label: "The formula behind the picture", caption: "The shadow's length comes from the dot product: proj = ((a · b) / (b · b)) · b." },
    { id: "ml-connection", label: "The best approximation along a direction", caption: "The projection is the closest point to a using only direction b. Least squares and PCA are built on this idea." }
  ];

  var P = makePlane(80, 318, 62);
  var A = [4, 3];
  var B = [5, 2];
  var dotAB = A[0] * B[0] + A[1] * B[1];
  var dotBB = B[0] * B[0] + B[1] * B[1];
  var k = dotAB / dotBB;
  var PR = [k * B[0], k * B[1]];
  var RES = [A[0] - PR[0], A[1] - PR[1]];

  el("line", { x1: P.x(0), y1: P.y(0), x2: P.x(0), y2: P.y(4.9), class: "axis" }, svg);
  el("line", { x1: P.x(-0.4), y1: P.y(0), x2: P.x(9), y2: P.y(0), class: "axis" }, svg);

  var dirLine = el("line", { x1: P.x(-1), y1: P.y(-0.4), x2: P.x(7.3), y2: P.y(2.92), stroke: "#38bdf8", "stroke-width": 1.5, class: "dash" }, svg);
  var arrB = arrow(svg, "b", 4);
  setLine(arrB, P.x(0), P.y(0), P.x(B[0]), P.y(B[1]));
  var labB = txt(svg, P.x(B[0]) + 8, P.y(B[1]) + 4, "lbl lbl-b", "b");

  var arrA = arrow(svg, "g", 4);
  setLine(arrA, P.x(0), P.y(0), P.x(A[0]), P.y(A[1]));
  var labA = txt(svg, P.x(A[0]) - 6, P.y(A[1]) - 10, "lbl lbl-g", "a");

  var drop = el("line", { class: "dash", stroke: "#f472b6", "stroke-width": 2 }, svg);
  setLine(drop, P.x(A[0]), P.y(A[1]), P.x(PR[0]), P.y(PR[1]));

  // Right-angle mark where the perpendicular meets the line.
  var ub = [B[0] / Math.sqrt(dotBB), B[1] / Math.sqrt(dotBB)];
  var rl = Math.sqrt(RES[0] * RES[0] + RES[1] * RES[1]);
  var un = [RES[0] / rl, RES[1] / rl];
  var sq = 0.3;
  var rightMark = el("polyline", { fill: "none", stroke: "#e2b44a", "stroke-width": 2 }, svg);
  rightMark.setAttribute("points", [
    [PR[0] - sq * ub[0], PR[1] - sq * ub[1]],
    [PR[0] - sq * ub[0] + sq * un[0], PR[1] - sq * ub[1] + sq * un[1]],
    [PR[0] + sq * un[0], PR[1] + sq * un[1]]
  ].map(function (p) { return P.x(p[0]) + "," + P.y(p[1]); }).join(" "));

  var arrProj = arrow(svg, "y", 5);
  setLine(arrProj, P.x(0), P.y(0), P.x(PR[0]), P.y(PR[1]));
  var labProj = txt(svg, P.x(PR[0]) + 12, P.y(PR[1]) + 20, "lbl lbl-y", "projection");

  var arrRes = arrow(svg, "p", 4);
  setLine(arrRes, P.x(PR[0]), P.y(PR[1]), P.x(A[0]), P.y(A[1]));
  var labRes = txt(svg, P.x(A[0]) + 30, P.y(A[1]) + 40, "lbl lbl-p", "residual ⟂ b");

  var panel = el("g", {}, svg);
  el("rect", { x: 392, y: 246, width: 240, height: 106, rx: 12, fill: "#071510" }, panel); // opaque base so the axis does not show through the text
  el("rect", { x: 392, y: 246, width: 240, height: 106, rx: 12, class: "fillG" }, panel);
  txt(panel, 406, 268, "mono", "proj = ((a · b) / (b · b)) b", "start");
  txt(panel, 406, 292, "note", "a · b = 4·5 + 3·2 = " + dotAB, "start");
  txt(panel, 406, 310, "note", "b · b = 5·5 + 2·2 = " + dotBB, "start");
  txt(panel, 406, 336, "mono", "proj ≈ " + (Math.round(k * 100) / 100) + " · b", "start");
  var mlPanel = el("g", {}, svg);
  el("rect", { x: 392, y: 250, width: 240, height: 90, rx: 12, fill: "#071510" }, mlPanel);
  el("rect", { x: 392, y: 250, width: 240, height: 90, rx: 12, class: "fillG" }, mlPanel);
  txt(mlPanel, 406, 276, "lbl", "closest point to a", "start");
  txt(mlPanel, 406, 296, "lbl", "along the direction b", "start");
  txt(mlPanel, 406, 322, "note", "→ least squares, PCA", "start");

  function render(index, id) {
    show(arrA, true); show(labA, true);
    show(dirLine, index >= 1); show(arrB, index >= 1); show(labB, index >= 1);
    show(drop, index >= 2); show(rightMark, index >= 2);
    show(arrProj, index >= 3); show(labProj, index >= 3);
    show(arrRes, index >= 4); show(labRes, index >= 4);
    show(panel, id === "formula");
    show(mlPanel, id === "ml-connection");
  }
