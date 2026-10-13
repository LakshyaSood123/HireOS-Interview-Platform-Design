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
