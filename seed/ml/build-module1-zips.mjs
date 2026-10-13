// Packs the Module 1 animation packages into upload-ready ZIP files. Each ZIP
// has the five required files at its ROOT (no nested folder):
//   animation.html, animation.css, animation.js, manifest.json, trace.json
//
//   node seed/ml/build-module1-zips.mjs
//
// Output: seed/ml/module1-zips/<package>.zip. Uses the backend's jszip.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.join(here, "..", "..", "backend", "package.json"));
const JSZip = backendRequire("jszip");

const PACKAGES = [
  "training-validation-testing",
  "generalization-fit-comparison",
  "supervised-vs-unsupervised",
  "ml-workflow",
];
const ROOT_FILES = ["animation.html", "animation.css", "animation.js", "manifest.json", "trace.json"];

const sourceRoot = path.join(here, "animations-module1");
const outRoot = path.join(here, "module1-zips");
mkdirSync(outRoot, { recursive: true });

for (const pkg of PACKAGES) {
  const folder = path.join(sourceRoot, pkg);
  const zip = new JSZip();
  for (const file of ROOT_FILES) {
    const full = path.join(folder, file);
    if (!existsSync(full)) throw new Error(`${pkg}: missing ${file}`);
    zip.file(file, readFileSync(full));
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const out = path.join(outRoot, `${pkg}.zip`);
  writeFileSync(out, buffer);
  const entries = Object.keys((await JSZip.loadAsync(buffer)).files);
  console.log(`${out}  (${buffer.length} bytes)  entries: ${entries.join(", ")}`);
}
