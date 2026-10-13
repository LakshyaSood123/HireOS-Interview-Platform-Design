// Measures every animation package on EVERY step at several iframe widths (real headless Chrome) and writes
// seed/ml/shared/heights.json: package folder name -> heightPx (tallest measured scroll height + margin, rounded up).
// The build scripts and apply-heights.mjs read that file so each package's iframe is only as tall as it needs to be.
//
//   node seed/ml/compute-heights.mjs [widths comma separated, default 700,540,420,360] <package-folder> ...

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MARGIN = 16;
const MIN_HEIGHT = 360;
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const widths = (/^\d+(,\d+)*$/.test(args[0]) ? args.shift() : "700,540,420,360").split(",").map(Number);
const folders = args;
const out = path.join(tmpdir(), "ml-heights2");
mkdirSync(out, { recursive: true });
const profile = path.join(tmpdir(), "ml-heights2-profile");
const target = path.join(here, "shared", "heights.json");
const heights = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
let over = 0;

for (const folder of folders) {
  const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
  const html = readFileSync(path.join(folder, "animation.html"), "utf8");
  const css = readFileSync(path.join(folder, "animation.css"), "utf8");
  const js = readFileSync(path.join(folder, "animation.js"), "utf8");
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}
<script>window.requestAnimationFrame = undefined; window.ReagvisBridge = { ready() {}, stepChanged() {} };</script>
<script>${js}</script>
<script>
(function () {
  var ids = ${JSON.stringify(manifest.traceEvents)}, max = 0, xo = 0;
  ids.forEach(function (id) {
    window.ReagvisAnimation.onCommand("GOTO_STEP", id);
    var h = document.documentElement.scrollHeight;
    if (h > max) max = h;
    if (document.documentElement.scrollWidth > window.innerWidth + 1) xo++;
  });
  document.body.setAttribute("data-result", max + "|" + xo);
})();
</script></body></html>`;
  const name = path.basename(folder);
  const file = path.join(out, name + ".html");
  writeFileSync(file, page);
  let worst = 0;
  for (const w of widths) {
    const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, `--window-size=${w},200`, "--virtual-time-budget=3000", "--dump-dom", "file:///" + file.replace(/\\/g, "/")], { encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "ignore"] });
    const m = dom.match(/data-result="(\d+)\|(\d+)"/);
    if (!m) throw new Error(`${name}@${w}: no measurement`);
    if (Number(m[2]) > 0) { over++; console.log(`  x-overflow in ${name} at ${w}px`); }
    worst = Math.max(worst, Number(m[1]));
  }
  heights[name] = Math.max(MIN_HEIGHT, Math.ceil((worst + MARGIN) / 10) * 10);
  console.log(`${name.padEnd(38)} tallest ${worst}  ->  heightPx ${heights[name]}`);
}
const sorted = Object.fromEntries(Object.entries(heights).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(target, JSON.stringify(sorted, null, 1) + "\n");
console.log(`wrote ${Object.keys(sorted).length} heights; horizontal overflow cases: ${over}`);
process.exit(over ? 1 : 0);
