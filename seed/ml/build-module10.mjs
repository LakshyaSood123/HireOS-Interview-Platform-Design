// Composes the seven Clustering animation packages from small sources:
//   seed/ml/module10-kit/{lib.js,runtime.js,base.css}   shared helpers + runtime
//   seed/ml/animations-module10/<name>/scene.js           the scene (defines `steps` and `render`)
//   seed/ml/animations-module10/<name>/meta.json          title, height, trace steps
//   seed/ml/animations-module10/<name>/extra.css          optional extra styles
// into the five root files each package needs, and then into upload-ready ZIPs.
//
//   node seed/ml/build-module10.mjs
//
// Output: seed/ml/animations-module10-built/<name>/{animation.*,manifest.json,trace.json}
//         seed/ml/module10-zips/<name>.zip

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "..", "..", "backend", "package.json"));
const JSZip = require("jszip");

const kit = (f) => readFileSync(path.join(here, "module10-kit", f), "utf8");
const lib = kit("lib.js");
const helpers = kit("helpers.js") + String.fromCharCode(10) + kit("helpers2.js") + String.fromCharCode(10) + kit("helpers3.js") + String.fromCharCode(10) + kit("helpers4.js");
const runtime = readFileSync(path.join(here, "shared", "explain-runtime.js"), "utf8");
const baseCss = kit("base.css") + readFileSync(path.join(here, "shared", "explain.css"), "utf8");
// Every ML animation shares one explanation panel, one 640px height budget and one educational autoplay pace.
const HEIGHT_PX = 640; // fallback; real heights come from shared/heights.json (compute-heights.mjs)
const HEIGHTS = existsSync(path.join(here, "shared", "heights.json")) ? JSON.parse(readFileSync(path.join(here, "shared", "heights.json"), "utf8")) : {};

const srcRoot = path.join(here, "animations-module10");
const outRoot = path.join(here, "animations-module10-built");
const zipRoot = path.join(here, "module10-zips");
mkdirSync(zipRoot, { recursive: true });

const html = (title) => `<div class="scene">
  <p class="step-label" id="step-label"></p>
  <svg id="scene" viewBox="0 0 640 360" role="img" aria-label="${title}"></svg>
  <section class="explain" aria-live="polite">
    <h3 class="explain-h" id="explain-h"></h3>
    <p class="explain-t" id="caption"></p>
  </section>
</div>
`;

const names = readdirSync(srcRoot, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(path.join(srcRoot, d.name, "meta.json"))).map((d) => d.name).sort();
for (const name of names) {
  const dir = path.join(srcRoot, name);
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const scene = readFileSync(path.join(dir, "scene.js"), "utf8");
  const explainFile = path.join(dir, "explain.json");
  if (!existsSync(explainFile)) throw new Error(`${name}: explain.json is missing (every step needs an explanation)`);
  const explain = JSON.parse(readFileSync(explainFile, "utf8"));
  const missing = meta.steps.map((s) => s.id).filter((id) => !explain[id] || !explain[id].h || !explain[id].t);
  const unknownIds = Object.keys(explain).filter((id) => !meta.steps.some((s) => s.id === id));
  if (missing.length || unknownIds.length) throw new Error(`${name}: explanations missing for [${missing.join(", ")}], unknown ids [${unknownIds.join(", ")}]`);
  const extra = existsSync(path.join(dir, "extra.css")) ? readFileSync(path.join(dir, "extra.css"), "utf8") : "";

  const out = path.join(outRoot, name);
  mkdirSync(out, { recursive: true });
  const files = {
    "animation.html": html(meta.title),
    "animation.css": baseCss + "\n" + extra,
    "animation.js": "(function () {\n" + lib + "\n" + helpers + "\n  var EXPLAIN = " + JSON.stringify(explain) + ";\n  // ── scene ──\n" + scene + "\n" + runtime + "})();\n",
    "manifest.json": JSON.stringify(
      { heightPx: HEIGHTS[name] ?? HEIGHT_PX, capabilities: ["play", "pause", "next", "previous", "reset", "gotoStep"], traceEvents: meta.steps.map((s) => s.id) },
      null,
      2,
    ) + "\n",
    "trace.json": JSON.stringify(
      { version: 1, steps: meta.steps.map((s) => ({ id: s.id, label: s.label, animationEvent: s.id, code: { pseudocode: s.pseudocode, python: s.python } })) },
      null,
      2,
    ) + "\n",
  };
  const zip = new JSZip();
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(path.join(out, file), content);
    zip.file(file, content);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  writeFileSync(path.join(zipRoot, `${name}.zip`), buffer);
  console.log(`${name.padEnd(28)} ${meta.steps.length} steps  zip ${buffer.length} bytes`);
}
