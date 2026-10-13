// Verifies the VISUAL progression of the Training/Validation/Testing animation
// without a browser: runs animation.js with a recording DOM, jumps to every
// step, and classifies each of the 24 dots by the region it is positioned in
// and its colour. Also reads the visible counter text and which zone groups are
// visible. It checks logic and positions, not how the page looks.
//
//   node seed/ml/qa-split-progression.mjs seed/ml/animations-module1/training-validation-testing

import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";

const folder = process.argv[2];
const code = readFileSync(path.join(folder, "animation.js"), "utf8");

function makeNode(tag) {
  const node = {
    tag, attrs: {}, children: [], style: {}, text: "",
    classes: new Set(),
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === "class") this.classes = new Set(String(v).split(/\s+/)); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    querySelectorAll(sel) { return collect(this, sel); },
    querySelector(sel) { return collect(this, sel)[0] ?? null; },
    classList: {
      add: (c) => node.classes.add(c), remove: (c) => node.classes.delete(c),
      contains: (c) => node.classes.has(c),
    },
  };
  Object.defineProperty(node, "textContent", { get() { return node.text; }, set(v) { node.text = String(v); } });
  return node;
}
function collect(root, sel) {
  const out = [];
  const want = sel.startsWith(".") ? sel.slice(1) : null;
  (function walk(n) { for (const c of n.children) { if (want && c.classes.has(want)) out.push(c); walk(c); } })(root);
  return out;
}

const byId = {};
for (const id of ["step-label", "caption", "counts", "frame", "zones", "flow", "boxes", "dots"]) byId[id] = makeNode("el");
const events = [];
const window = {
  ReagvisBridge: { ready() {}, stepChanged(id) { events.push(id); } },
  addEventListener() {},
};
const sandbox = {
  window, document: { getElementById: (id) => byId[id], createElementNS: (_ns, tag) => makeNode(tag) },
  setInterval: () => 1, clearInterval() {}, Math, JSON, Object, Array, String, Number,
};
window.window = window;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const dots = byId["dots"].children;
const REGION = { train: [10, 28, 280, 160], validation: [305, 28, 160, 160], test: [480, 28, 150, 160], frame: [10, 28, 620, 160], model: [30, 232, 220, 60], compare: [300, 232, 160, 60], final: [400, 322, 230, 64] };
const px = (v) => parseFloat(String(v));
// Regions count only while VISIBLE: hidden regions (opacity 0) cannot contain anything.
function visibleRegions() {
  const list = [];
  for (const name of ["model", "compare", "final"]) list.push([name, REGION[name]]);
  const zoneNames = ["train", "validation", "test"];
  byId["zones"].children.forEach((g, i) => {
    if (parseFloat(g.attrs.opacity) >= 0.5) list.push([zoneNames[i], REGION[zoneNames[i]]]);
  });
  const frames = byId["frame"].children; // [dataset, remaining]
  if (parseFloat(frames[0].attrs.opacity) >= 0.5) list.push(["dataset", REGION.frame]);
  if (parseFloat(frames[1].attrs.opacity) >= 0.5) {
    const r = frames[1].children[0].attrs;
    list.push(["remaining", [parseFloat(r.x), parseFloat(r.y), parseFloat(r.width), parseFloat(r.height)]]);
  }
  return list;
}
function region(x, y) {
  for (const [name, [bx, by, bw, bh]] of visibleRegions()) {
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) return name;
  }
  return "nowhere";
}
const COLORS = { "#1DB584": "train-green", "#E2B44A": "validation-gold", "#F472B6": "test-pink", "#8FA89C": "unassigned-gray" };
const colorName = (f) => COLORS[f] ?? (String(f).startsWith("rgba") ? "dimmed" : f);

const ids = ["full-dataset", "shuffle", "train-split", "validation-split", "test-split", "training", "validation", "final-test"];
const failures = [];
const expect = (cond, msg) => { if (!cond) failures.push(msg); };

for (const id of ids) {
  window.ReagvisAnimation.onCommand("GOTO_STEP", id);
  const rows = dots.map((d) => ({ region: region(px(d.style.cx), px(d.style.cy)), color: colorName(d.attrs.fill) }));
  const tally = {};
  for (const r of rows) tally[`${r.color}@${r.region}`] = (tally[`${r.color}@${r.region}`] ?? 0) + 1;
  const zones = byId["zones"].children.map((g, i) => ["train", "validation", "test"][i] + "=" + g.attrs.opacity);
  const frame = byId["frame"].children[0].attrs.opacity;
  console.log(`${id.padEnd(17)} counter: "${byId["counts"].text}"  frame=${frame}  zones: ${zones.join(" ")}`);
  console.log("   ", JSON.stringify(tally));

  const inRegion = (name) => rows.filter((r) => r.region === name).length;
  const coloredIn = (name, color) => rows.filter((r) => r.region === name && r.color === color).length;
  if (id === "full-dataset" || id === "shuffle") {
    expect(rows.every((r) => r.color === "unassigned-gray"), `${id}: some dots are coloured/assigned`);
    expect(["train", "validation", "test"].every((n) => inRegion(n) === 0), `${id}: dots sit inside Train/Validation/Test regions`);
    expect(inRegion("dataset") === 24, `${id}: not all 24 dots are inside the single dataset frame`);
    expect(zones.every((z) => z.endsWith("=0")), `${id}: split regions are visible`);
    expect(frame === "1", `${id}: dataset frame not shown`);
    expect(byId["counts"].text === "24 examples", `${id}: counter is "${byId["counts"].text}"`);
  }
  if (id === "train-split") {
    expect(coloredIn("train", "train-green") === 17 && inRegion("train") === 17, "train-split: 17 green dots not in TRAIN");
    expect(inRegion("validation") === 0 && inRegion("test") === 0, "train-split: dots already in Validation/Test");
    expect(rows.filter((r) => r.color === "unassigned-gray" && r.region === "remaining").length === 7, "train-split: the other 7 are not neutral dots in REMAINING");
  }
  if (id === "validation-split") {
    expect(inRegion("validation") === 4 && coloredIn("validation", "validation-gold") === 4, "validation-split: 4 gold dots not in VALIDATION");
    expect(inRegion("test") === 0, "validation-split: dots already in TEST");
    expect(inRegion("train") === 17, "validation-split: TRAIN lost its dots");
    expect(rows.filter((r) => r.color === "unassigned-gray" && r.region === "remaining").length === 3, "validation-split: the other 3 are not neutral dots in REMAINING");
  }
  if (id === "test-split") {
    expect(inRegion("train") === 17 && inRegion("validation") === 4 && inRegion("test") === 3, "test-split: not 17/4/3");
    expect(coloredIn("test", "test-pink") === 3, "test-split: TEST dots are not pink");
    expect(byId["counts"].text === "Train 17 · Validation 4 · Test 3", `test-split: counter "${byId["counts"].text}"`);
  }
  if (id === "training" || id === "validation") {
    expect(inRegion("final") === 0, `${id}: a dot already reached Final Evaluation`);
    const testDots = rows.filter((_, i) => dots[i].attrs.fill === "rgba(143,168,156,0.3)" && region(px(dots[i].style.cx), px(dots[i].style.cy)) === "test");
    expect(inRegion("test") === 3 && testDots.length === 3, `${id}: TEST dots are not still, dimmed, in TEST`);
  }
  if (id === "final-test") {
    expect(inRegion("final") === 3 && coloredIn("final", "test-pink") === 3, "final-test: the 3 TEST dots are not in Final Evaluation");
  }
}

// TEST untouched until the final step: every earlier step keeps the 3 TEST dots out of model/compare/final.
console.log(failures.length ? "\nFAILURES:\n - " + failures.join("\n - ") : "\nALL PROGRESSION CHECKS PASS");
process.exit(failures.length ? 1 : 0);
