
  // ── Module 12 helpers: the six-customer dataset and plain PCA maths (covariance divides by n - 1) ──
  var DX = [[2, 1.5], [3, 2.5], [4, 2.5], [5, 4.5], [6, 4.0], [7, 6.0]];
  var DN = DX.length;
  var DMEAN = [0, 0];
  DX.forEach(function (p) { DMEAN[0] += p[0] / DN; DMEAN[1] += p[1] / DN; });
  var DC = DX.map(function (p) { return [p[0] - DMEAN[0], p[1] - DMEAN[1]]; });
  var DSXX = 0, DSYY = 0, DSXY = 0;
  DC.forEach(function (c) { DSXX += c[0] * c[0] / (DN - 1); DSYY += c[1] * c[1] / (DN - 1); DSXY += c[0] * c[1] / (DN - 1); });
  var DMID = (DSXX + DSYY) / 2, DRAD = Math.sqrt(Math.pow((DSXX - DSYY) / 2, 2) + DSXY * DSXY);
  var DL1 = DMID + DRAD, DL2 = DMID - DRAD, DTOT = DSXX + DSYY;
  var DNORM = Math.sqrt(DSXY * DSXY + (DL1 - DSXX) * (DL1 - DSXX));
  var DV1 = [DSXY / DNORM, (DL1 - DSXX) / DNORM], DV2 = [-DV1[1], DV1[0]];
  function dot2(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  var DZ1 = DC.map(function (c) { return dot2(c, DV1); });
  var DZ2 = DC.map(function (c) { return dot2(c, DV2); });
  var DSIG1 = Math.sqrt(DL1 * (DN - 1)), DSIG2 = Math.sqrt(DL2 * (DN - 1));
  var DEV1 = DL1 / DTOT, DANG1 = Math.atan2(DV1[1], DV1[0]) * 180 / Math.PI;
  var DSSE = 0;
  DZ2.forEach(function (z) { DSSE += z * z; });
  var CUST = ["#e2b44a", "#38bdf8", "#f472b6", "#1db584", "#c084fc", "#fb923c"];
  var C_PC1 = "#e2b44a", C_PC2 = "#38bdf8", C_PRJ = "#f472b6", C_LOSS = "#f87171", C_KEEP = "#1db584";
  // Original-data plane (data origin at the lower left) and centered plane (origin at the feature means). Same pixels.
  var OP = makePlane(40, 330, 40), CP = makePlane(220, 190, 40);
  function dirOf(deg) { var r = deg * Math.PI / 180; return [Math.cos(r), Math.sin(r)]; }
  function varAlong(deg) { var d = dirOf(deg); return DSXX * d[0] * d[0] + 2 * DSXY * d[0] * d[1] + DSYY * d[1] * d[1]; }
  function f2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2); }
  function f3(v) { return (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3); }
  function s2(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }
  function s3(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(3); }

  function dotsAt(parent, P, pts, r) {
    return pts.map(function (p, i) {
      var s = P.pt(p);
      return el("circle", { cx: s[0], cy: s[1], r: r || 6, fill: CUST[i], stroke: "#071510", "stroke-width": 2 }, parent);
    });
  }
  function moveDots(dots, P, pts) {
    dots.forEach(function (d, i) { var s = P.pt(pts[i]); d.setAttribute("cx", s[0]); d.setAttribute("cy", s[1]); });
  }
  function frameAxes(parent, P, xr, yr, cls) {
    var a = el("g", {}, parent);
    el("line", { x1: P.x(-xr), y1: P.y(0), x2: P.x(xr), y2: P.y(0), class: cls || "axis" }, a);
    el("line", { x1: P.x(0), y1: P.y(-yr), x2: P.x(0), y2: P.y(yr), class: cls || "axis" }, a);
    return a;
  }
  // A line through the origin of plane P along direction v, extending len either way (maths units).
  function dirLine(parent, P, color, width, dash) {
    var l = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: color, "stroke-width": width || 3, "stroke-linecap": "round" }, parent);
    if (dash) l.setAttribute("stroke-dasharray", "6 5");
    return l;
  }
  function setDir(line, P, v, len) {
    setLine(line, P.x(-len * v[0]), P.y(-len * v[1]), P.x(len * v[0]), P.y(len * v[1]));
  }
  function arrowFromOrigin(parent, P, key, width) {
    return arrow(parent, key, width);
  }
  function setArrow(a, P, v, len) {
    setLine(a, P.x(0), P.y(0), P.x(len * v[0]), P.y(len * v[1]));
  }
  // Perpendicular drops from every centered point to the line through the origin with direction v.
  function dropSet(parent, color, count) {
    var lines = [], feet = [];
    for (var i = 0; i < count; i++) {
      lines.push(el("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: color, "stroke-width": 1.8, "stroke-dasharray": "4 3" }, parent));
      feet.push(el("circle", { cx: 0, cy: 0, r: 4.5, fill: CUST[i], stroke: "#071510", "stroke-width": 1.5 }, parent));
    }
    return { lines: lines, feet: feet };
  }
  function setDrops(set, P, pts, v) {
    pts.forEach(function (c, i) {
      var t = dot2(c, v), fx = t * v[0], fy = t * v[1], a = P.pt(c), b = P.pt([fx, fy]);
      setLine(set.lines[i], a[0], a[1], b[0], b[1]);
      set.feet[i].setAttribute("cx", b[0]); set.feet[i].setAttribute("cy", b[1]);
    });
  }
  function rightAngle(parent) {
    return el("path", { d: "M 0 0", fill: "none", stroke: "#e6f5ec", "stroke-width": 1.5 }, parent);
  }
  function setRightAngle(node, P, v, w, s) {
    var a = P.pt([v[0] * s, v[1] * s]), b = P.pt([(v[0] + w[0]) * s, (v[1] + w[1]) * s]), c = P.pt([w[0] * s, w[1] * s]);
    node.setAttribute("d", "M " + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L " + b[0].toFixed(1) + " " + b[1].toFixed(1) + " L " + c[0].toFixed(1) + " " + c[1].toFixed(1));
  }
  // A grid of matrix cells. Returns {cells, text(i, j, str), group}.
  function matGrid(parent, x, y, rows, cols, cw, ch, vals) {
    var g = el("g", {}, parent), cells = [];
    for (var i = 0; i < rows; i++) {
      cells.push([]);
      for (var j = 0; j < cols; j++) {
        var cg = el("g", { class: "cell" }, g);
        el("rect", { x: x + j * cw, y: y + i * ch, width: cw - 3, height: ch - 3, rx: 5 }, cg);
        var t = txt(cg, x + j * cw + (cw - 3) / 2, y + i * ch + (ch - 3) / 2 + 5, "mono", vals ? vals[i][j] : "", "middle");
        t.style.fontSize = ch < 26 ? "12px" : "14px";
        cells[i].push(cg);
      }
    }
    return { group: g, cells: cells, mark: function (i, j, cls) { cells[i][j].setAttribute("class", "cell " + (cls || "")); } };
  }
  function bracket(parent, color) {
    return el("path", { d: "M 0 0", fill: "none", stroke: color, "stroke-width": 2.5 }, parent);
  }
  function numLine(parent, x0, x1, y, lo, hi, step) {
    var g = el("g", {}, parent);
    el("line", { x1: x0, y1: y, x2: x1, y2: y, class: "axis" }, g);
    var sx = (x1 - x0) / (hi - lo);
    for (var v = lo; v <= hi + 1e-9; v += step) {
      el("line", { x1: x0 + (v - lo) * sx, y1: y - 4, x2: x0 + (v - lo) * sx, y2: y + 4, class: "axis" }, g);
      txt(g, x0 + (v - lo) * sx, y + 17, "tick", (v < 0 ? "−" : "") + Math.abs(v), "middle");
    }
    return { g: g, x: function (v) { return x0 + (v - lo) * sx; } };
  }

  // Text on a tinted card or matrix cell is drawn without the dark outline (the outline looks blobby on fills).
  function flatCards() {
    var texts = svg.querySelectorAll("text");
    for (var i = 0; i < texts.length; i++) {
      var p = texts[i].parentNode, flat = p.getAttribute("class") === "cell";
      if (!flat && p.children) {
        for (var k = 0; k < p.children.length; k++) {
          var c = p.children[k].getAttribute && p.children[k].getAttribute("class");
          if (c === "fillA" || c === "fillB" || c === "fillG") { flat = true; break; }
        }
      }
      if (flat) texts[i].style.stroke = "none";
    }
  }
