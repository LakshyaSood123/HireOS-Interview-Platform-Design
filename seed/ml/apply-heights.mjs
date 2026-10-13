// Applies seed/ml/shared/heights.json to the seven hand-written Module 1 package manifests (the generated
// packages of Modules 2-13 read heights.json inside their build scripts).
//
//   node seed/ml/apply-heights.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const heights = JSON.parse(readFileSync(path.join(here, "shared", "heights.json"), "utf8"));
const packages = [
  "animations/what-is-machine-learning",
  "animations/features-and-labels",
  "animations/linear-regression-learning",
  "animations-module1/training-validation-testing",
  "animations-module1/generalization-fit-comparison",
  "animations-module1/supervised-vs-unsupervised",
  "animations-module1/ml-workflow",
];
for (const rel of packages) {
  const file = path.join(here, rel, "manifest.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const h = heights[path.basename(rel)];
  if (!h) throw new Error(`no measured height for ${rel}`);
  if (manifest.heightPx !== h) {
    manifest.heightPx = h;
    writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`${rel}: heightPx -> ${h}`);
  }
}
