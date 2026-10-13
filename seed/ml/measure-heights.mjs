// Measures how tall each animation package really is (document scroll height) on EVERY step, in real
// headless Chrome, at several iframe widths. The host fixes the iframe height at manifest.heightPx and
// ignores HEIGHT_CHANGED, so heightPx must be at least the largest measured height or content is clipped.
//
//   node seed/ml/measure-heights.mjs <widths comma separated> <package-folder> [<package-folder> ...]
//
// Prints one line per package: package, heightPx, max measured height per width, and the worst step.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const widths = process.argv[2].split(",").map(Number);
const folders = process.argv.slice(3);
const out = path.join(tmpdir(), "ml-heights");
mkdirSync(out, { recursive: true });
const profile = path.join(tmpdir(), "ml-heights-profile");
let bad = 0;

for (const folder of folders) {
  const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
  const html = readFileSync(path.join(folder, "animation.html"), "utf8");
  const css = readFileSync(path.join(folder, "animation.css"), "utf8");
  const js = readFileSync(path.join(folder, "animation.js"), "utf8");
  const ids = manifest.traceEvents;
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}
<script>window.requestAnimationFrame = undefined; window.ReagvisBridge = { ready() {}, stepChanged() {} };</script>
<script>${js}</script>
<script>
(function () {
  var ids = ${JSON.stringify(ids)}, max = 0, worst = "", overflowX = 0;
  ids.forEach(function (id) {
    window.ReagvisAnimation.onCommand("GOTO_STEP", id);
    var h = document.documentElement.scrollHeight;
    if (h > max) { max = h; worst = id; }
    if (document.documentElement.scrollWidth > window.innerWidth + 1) overflowX++;
  });
  document.body.setAttribute("data-result", max + "|" + worst + "|" + overflowX);
})();
</script></body></html>`;
  const name = path.basename(folder);
  const file = path.join(out, name + ".html");
  writeFileSync(file, page);
  const cells = [];
  for (const w of widths) {
    const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, `--window-size=${w},200`, "--virtual-time-budget=3000", "--dump-dom", "file:///" + file.replace(/\\/g, "/")], { encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "ignore"] });
    const m = dom.match(/data-result="(\d+)\|([^|]*)\|(\d+)"/);
    if (!m) { cells.push(`${w}px: NO RESULT`); bad++; continue; }
    const h = Number(m[1]);
    const ok = h <= manifest.heightPx && Number(m[3]) === 0;
    if (!ok) bad++;
    cells.push(`${w}px: ${h}${ok ? "" : " (OVER " + manifest.heightPx + " or x-overflow " + m[3] + ")"} @${m[2]}`);
  }
  console.log(`${name.padEnd(36)} heightPx ${manifest.heightPx}  ${cells.join("  ")}`);
}
console.log(bad ? `${bad} measurement(s) over the declared height` : "ALL WITHIN DECLARED HEIGHT");
process.exit(bad ? 1 : 0);
