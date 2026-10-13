  // ── shared helpers (SVG, tweening) ─────────────────────────────────────────
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("scene");
  var labelEl = document.getElementById("step-label");
  var captionEl = document.getElementById("caption");

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function txt(parent, x, y, cls, str, anchor) {
    var t = el("text", { x: x, y: y, class: cls }, parent);
    if (anchor) t.setAttribute("text-anchor", anchor);
    t.textContent = str;
    return t;
  }
  function show(node, on) {
    node.setAttribute("opacity", on ? "1" : "0");
  }
  function place(node, x, y) {
    node.style.transform = "translate(" + x + "px," + y + "px)";
  }
  function setLine(node, x1, y1, x2, y2) {
    node.setAttribute("x1", x1);
    node.setAttribute("y1", y1);
    node.setAttribute("x2", x2);
    node.setAttribute("y2", y2);
  }
  function lerp(a, b, e) {
    return a + (b - a) * e;
  }
  function round1(v) {
    return (Math.round(v * 10) / 10).toFixed(1);
  }

  // Eased animation. fn(e) is called with e from 0 to 1. Without
  // requestAnimationFrame (or with ms = 0) it jumps straight to fn(1).
  var animTokens = {};
  function anim(key, ms, fn) {
    var token = (animTokens[key] || 0) + 1;
    animTokens[key] = token;
    if (typeof requestAnimationFrame !== "function" || ms <= 0) {
      fn(1);
      return;
    }
    var start = null;
    function frame(now) {
      if (animTokens[key] !== token) return;
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / ms);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      fn(e);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Arrowheads, one marker per colour.
  var COLORS = { g: "#1DB584", y: "#E2B44A", p: "#F472B6", b: "#38BDF8", w: "#c9dccf", r: "#F87171" };
  var defs = el("defs", {}, svg);
  Object.keys(COLORS).forEach(function (k) {
    var m = el("marker", { id: "ah-" + k, viewBox: "0 0 10 10", refX: 9, refY: 5, markerUnits: "userSpaceOnUse", markerWidth: 13, markerHeight: 13, orient: "auto" }, defs);
    el("path", { d: "M0 0 L10 5 L0 10 Z", fill: COLORS[k] }, m);
  });
  function arrow(parent, colorKey, width) {
    return el("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: COLORS[colorKey], "stroke-width": width || 3, "marker-end": "url(#ah-" + colorKey + ")", "stroke-linecap": "round" }, parent);
  }
  function polygon(parent, cls) {
    return el("polygon", { points: "", class: cls }, parent);
  }
  function setPoly(node, pts) {
    node.setAttribute("points", pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
  }
  function lerpPts(a, b, e) {
    return a.map(function (p, i) { return [lerp(p[0], b[i][0], e), lerp(p[1], b[i][1], e)]; });
  }
  // Maps maths coordinates (x right, y up) to screen pixels.
  function makePlane(cx, cy, s) {
    return {
      x: function (v) { return cx + s * v; },
      y: function (v) { return cy - s * v; },
      pt: function (p) { return [cx + s * p[0], cy - s * p[1]]; },
      s: s, cx: cx, cy: cy
    };
  }
  function axes(parent, plane, xr, yr) {
    el("line", { x1: plane.x(-xr), y1: plane.y(0), x2: plane.x(xr), y2: plane.y(0), class: "axis" }, parent);
    el("line", { x1: plane.x(0), y1: plane.y(-yr), x2: plane.x(0), y2: plane.y(yr), class: "axis" }, parent);
  }

  // ── Module 3 helpers: graphs, curves, contour plane ───────────────────────
  // makeGraph maps maths values to pixels with separate x and y scales.
  function makeGraph(ox, oy, sx, sy) {
    return {
      ox: ox, oy: oy, sx: sx, sy: sy,
      x: function (v) { return ox + sx * v; },
      y: function (v) { return oy - sy * v; }
    };
  }
  function curveD(g, f, a, b, n) {
    var d = "";
    for (var i = 0; i <= n; i++) {
      var v = a + ((b - a) * i) / n;
      d += (i ? " L " : "M ") + g.x(v).toFixed(1) + " " + g.y(f(v)).toFixed(1);
    }
    return d;
  }
  function setD(node, d) {
    node.setAttribute("d", d);
  }
  function fmt(v, n) {
    return (Math.round(v * 100000) / 100000).toFixed(n === undefined ? 1 : n);
  }
  function drawAxes(parent, g, xmax, ymax, xticks, yticks) {
    el("line", { x1: g.x(0), y1: g.y(0), x2: g.x(xmax), y2: g.y(0), class: "axis" }, parent);
    el("line", { x1: g.x(0), y1: g.y(0), x2: g.x(0), y2: g.y(ymax), class: "axis" }, parent);
    (xticks || []).forEach(function (t) { txt(parent, g.x(t), g.y(0) + 15, "tick", String(t), "middle"); });
    (yticks || []).forEach(function (t) { txt(parent, g.x(0) - 7, g.y(t) + 4, "tick", String(t), "end"); });
  }
  function card(parent, x, y, w, h, cls) {
    return el("rect", { x: x, y: y, width: w, height: h, rx: 10, class: cls || "fillG" }, parent);
  }
  function ring(parent, cx, cy, rx, ry, cls) {
    return el("ellipse", { cx: cx, cy: cy, rx: rx, ry: ry, fill: "none", class: cls || "contour" }, parent);
  }
  function clipTo(id, x, y, w, h) {
    var c = el("clipPath", { id: id }, defs);
    el("rect", { x: x, y: y, width: w, height: h }, c);
  }

  // ── Module 4 helpers: seeded randomness, small shapes ─────────────────────
  function mulberry(seed) {
    var a = seed;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussSource(rand) {
    return function () {
      var u = 1 - rand(), v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }
  function box(parent, x, y, w, h, fill, stroke, r) {
    return el("rect", { x: x, y: y, width: w, height: h, rx: r === undefined ? 6 : r, fill: fill, stroke: stroke || "none", "stroke-width": 2 }, parent);
  }
  function setBox(node, x, y, w, h) {
    node.setAttribute("x", x); node.setAttribute("y", y); node.setAttribute("width", Math.max(0, w)); node.setAttribute("height", Math.max(0, h));
  }
  function vis(list, on) {
    list.forEach(function (n) { show(n, on); });
  }

  // ── Module 5 helpers: coins, and rows of bars over the nine candidate values of p ──
  function coin(parent, x, y, r, letter) {
    var g = el("g", {}, parent);
    var head = letter === "H";
    el("circle", { cx: x, cy: y, r: r, fill: head ? "rgba(244,114,182,0.35)" : "rgba(56,189,248,0.3)", stroke: head ? "#f472b6" : "#38bdf8", "stroke-width": 3 }, g);
    var t = txt(g, x, y + r * 0.36, "big", letter, "middle");
    t.setAttribute("font-size", String(Math.round(r * 1.05)));
    return g;
  }
  var THETAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  var WEIGHTS = [1, 2, 3, 4, 5, 4, 3, 2, 1];
  function lik(t, k, n) { return Math.pow(t, k) * Math.pow(1 - t, n - k); }
  function normalized(arr) {
    var s = 0;
    arr.forEach(function (v) { s += v; });
    return arr.map(function (v) { return v / s; });
  }
  function argmaxIndex(arr) {
    var b = 0;
    arr.forEach(function (v, i) { if (v > arr[b]) b = i; });
    return b;
  }
  // A row of nine bars. set(values, maxValue) rescales heights so maxValue fills `height`.
  function barRow(parent, x0, dx, base, bw, height, fill, stroke) {
    var g = el("g", {}, parent);
    var bars = THETAS.map(function (t, i) {
      return box(g, x0 + i * dx - bw / 2, base, bw, 0, fill, stroke || "none", 3);
    });
    var tick = THETAS.map(function (t, i) {
      var tt = txt(g, x0 + i * dx, base + 14, "tick", String(t), "middle");
      tt.setAttribute("opacity", "0");
      return tt;
    });
    return {
      g: g,
      bars: bars,
      ticks: tick,
      set: function (values, maxValue) {
        values.forEach(function (v, i) {
          var h = Math.max(0, (v / maxValue) * height);
          setBox(bars[i], x0 + i * dx - bw / 2, base - h, bw, h);
        });
      },
      showTicks: function (on) { tick.forEach(function (n) { n.setAttribute("opacity", on ? "1" : "0"); }); }
    };
  }

  // ── Module 6 helpers: the two-weight objective, contours, quick arrows ────
  function L2(w1, w2) { return (w1 - 3) * (w1 - 3) + 2 * (w2 - 1) * (w2 - 1); }
  function G2(w1, w2) { return [2 * (w1 - 3), 4 * (w2 - 1)]; }
  // Contour of L2 at level c, drawn in the plane P (makeGraph) around the minimum (3, 1).
  function levelEllipse(parent, P, c, cls) {
    var e = el("ellipse", { cx: P.x(3), cy: P.y(1), rx: Math.sqrt(c) * P.sx, ry: Math.sqrt(c / 2) * P.sy, fill: "none", class: cls || "contour" }, parent);
    return e;
  }
  function arrowLine(parent, key, width, x1, y1, x2, y2) {
    var a = arrow(parent, key, width);
    setLine(a, x1, y1, x2, y2);
    return a;
  }
