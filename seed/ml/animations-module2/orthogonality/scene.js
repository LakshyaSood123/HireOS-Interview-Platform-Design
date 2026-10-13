  var steps = [
    { id: "two-vectors", label: "Two vectors", caption: "Take two vectors, u and v. We want a number that says how much they point the same way." },
    { id: "dot-product", label: "The dot product", caption: "Multiply matching entries and add: u · v = u₁v₁ + u₂v₂. The result is one number." },
    { id: "aligned", label: "Pointing the same way", caption: "When v points the same way as u, the dot product is large and positive." },
    { id: "perpendicular", label: "Turn v to a right angle", caption: "Rotate v until it makes a right angle with u. They no longer share any direction." },
    { id: "zero-dot", label: "Perpendicular means dot product 0", caption: "At 90° the dot product is exactly 0. Vectors with u · v = 0 are called orthogonal." },
    { id: "ml-meaning", label: "Orthogonal directions are independent", caption: "Perpendicular directions do not overlap, so each coordinate can be read off independently. That is why ML likes them." }
  ];

  var P = makePlane(240, 190, 44);
  axes(svg, P, 4.3, 4);
  var U = [3, 0];
  var LEN = 2.5;

  var arrU = arrow(svg, "b", 4);
  setLine(arrU, P.x(0), P.y(0), P.x(U[0]), P.y(U[1]));
  txt(svg, P.x(U[0]) + 10, P.y(0) + 5, "lbl lbl-b", "u");
  var arrV = arrow(svg, "p", 4);
  var labV = txt(svg, 0, 0, "lbl lbl-p", "v");
  var arcPath = el("path", { fill: "none", stroke: "#e2b44a", "stroke-width": 2 }, svg);
  var rightSq = el("polyline", { fill: "none", stroke: "#e2b44a", "stroke-width": 2, opacity: 0 }, svg);
  var angleLab = txt(svg, P.x(0) + 40, P.y(0) - 14, "lbl lbl-y", "");

  // Readout panel on the right.
  var panel = el("g", {}, svg);
  el("rect", { x: 440, y: 40, width: 188, height: 136, rx: 12, class: "fillG" }, panel);
  txt(panel, 534, 66, "lbl", "u · v", "middle");
  var calc = txt(panel, 534, 100, "mono", "", "middle");
  var value = txt(panel, 534, 142, "big", "", "middle");
  var meaning = txt(panel, 534, 164, "note", "", "middle");

  var proj = el("g", { opacity: 0 }, svg);
  var dropX = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, proj);
  var dropY = el("line", { class: "dash", stroke: "#c9dccf", "stroke-width": 1.5 }, proj);
  var pointP = el("circle", { r: 6, fill: "#e2b44a" }, proj);
  var axisNote = txt(svg, 320, 334, "note", "", "middle");

  var theta = 50; // degrees
  function drawVector() {
    var rad = (theta * Math.PI) / 180;
    var vx = LEN * Math.cos(rad);
    var vy = LEN * Math.sin(rad);
    setLine(arrV, P.x(0), P.y(0), P.x(vx), P.y(vy));
    labV.setAttribute("x", P.x(vx) + 10);
    labV.setAttribute("y", P.y(vy) - 6);
    var r = 0.9;
    arcPath.setAttribute("d", "M " + P.x(r) + " " + P.y(0) + " A " + r * P.s + " " + r * P.s + " 0 0 0 " + P.x(r * Math.cos(rad)) + " " + P.y(r * Math.sin(rad)));
    // Show the arithmetic with the same rounded components that are printed, so the readout always adds up.
    var shownX = Number(round1(vx));
    var shownY = Number(round1(vy));
    var dot = U[0] * shownX + U[1] * shownY;
    angleLab.textContent = Math.round(theta) + "°";
    calc.textContent = "3×" + round1(vx) + " + 0×" + round1(vy);
    value.textContent = "= " + round1(dot);
    meaning.textContent = dot > 0.05 ? "positive: same general direction" : dot < -0.05 ? "negative: opposite directions" : "zero: perpendicular";
    show(rightSq, Math.abs(theta - 90) < 0.5);
    if (Math.abs(theta - 90) < 0.5) {
      rightSq.setAttribute("points", P.x(0.45) + "," + P.y(0) + " " + P.x(0.45) + "," + P.y(0.45) + " " + P.x(0) + "," + P.y(0.45));
    }
  }

  function turnTo(target, ms) {
    var from = theta;
    anim("theta", ms, function (e) { theta = lerp(from, target, e); drawVector(); });
  }

  function render(index, id) {
    show(panel, id !== "two-vectors");
    show(proj, false);
    axisNote.textContent = "";
    show(angleLab, id !== "two-vectors" && id !== "ml-meaning");
    show(arcPath, id !== "ml-meaning");
    if (id === "two-vectors") turnTo(50, 400);
    else if (id === "dot-product") turnTo(50, 400);
    else if (id === "aligned") turnTo(8, 800);
    else if (id === "perpendicular") turnTo(90, 900);
    else if (id === "zero-dot") turnTo(90, 200);
    else {
      turnTo(90, 200);
      show(panel, false);
      show(proj, true);
      // A point read along two perpendicular directions: coordinates are independent.
      var px = 2.2, py = 1.8;
      setLine(dropX, P.x(px), P.y(py), P.x(px), P.y(0));
      setLine(dropY, P.x(px), P.y(py), P.x(0), P.y(py));
      pointP.setAttribute("cx", P.x(px));
      pointP.setAttribute("cy", P.y(py));
      axisNote.textContent = "Each coordinate is measured along its own perpendicular direction";
    }
  }
