// Renders animation packages in REAL headless Chrome, one screenshot per step, so
// layout problems (overlap, clipping, empty states) can be seen. Uses a throwaway
// browser profile and a tiny bridge shim; nothing is installed.
//
//   node seed/ml/render-steps.mjs <package-folder> [<step-id> ...] [--out=<dir>]
//
// The package is inlined into one HTML file the same way the lesson host does it
// (html + css + js), a fake ReagvisBridge records step events, and the page jumps
// to the requested step with GOTO_STEP before the screenshot is taken.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const args = process.argv.slice(2);
const outArg = args.find((a) => a.startsWith("--out="));
const outDir = outArg ? outArg.slice(6) : path.join(tmpdir(), "ml-renders");
const positional = args.filter((a) => !a.startsWith("--"));
const folder = positional[0];
const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
const wanted = positional.slice(1).length ? positional.slice(1) : manifest.traceEvents;

const body = readFileSync(path.join(folder, "animation.html"), "utf8");
const css = readFileSync(path.join(folder, "animation.css"), "utf8");
const js = readFileSync(path.join(folder, "animation.js"), "utf8");
mkdirSync(outDir, { recursive: true });
const name = path.basename(folder);
const profile = process.env.ML_RENDER_PROFILE || path.join(tmpdir(), "ml-render-profile");

const gridMode = args.includes("--grid");
const FRAME_H = Math.ceil(manifest.heightPx * 0.7);
const WIN_H = 2 * (FRAME_H + 28) + 20;
function pageFor(step) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style><style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head><body>${body}
<script>window.requestAnimationFrame = undefined; window.ReagvisBridge = { ready() {}, stepChanged() {} };</script>
<script>${js}</script>
<script>window.ReagvisAnimation.onCommand("GOTO_STEP", ${JSON.stringify(step)});</script></body></html>`;
}
if (gridMode) {
  // Four steps per screenshot (2 x 2), each in its own iframe so scenes do not clash.
  for (let i = 0; i < wanted.length; i += 4) {
    const group = wanted.slice(i, i + 4);
    const cells = group
      .map((step) => `<div class="cell"><div class="tag">${step}</div><div class="frame"><iframe srcdoc="${pageFor(step).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" width="700" height="${manifest.heightPx}" scrolling="no"></iframe></div></div>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#222;font-family:system-ui;color:#fff}
      .grid{display:grid;grid-template-columns:490px 490px;gap:6px;padding:6px}
      .tag{font-size:12px;padding:2px 6px;background:#444}
      .frame{width:490px;height:${FRAME_H}px;overflow:hidden}
      iframe{border:0;transform:scale(0.7);transform-origin:0 0}
    </style></head><body><div class="grid">${cells}</div></body></html>`;
    const htmlFile = path.join(outDir, `${name}__grid${i / 4 + 1}.html`);
    const pngFile = path.join(outDir, `${name}__grid${i / 4 + 1}.png`);
    writeFileSync(htmlFile, html);
    execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, "--hide-scrollbars", `--window-size=1000,${WIN_H}`, "--virtual-time-budget=4000", `--screenshot=${pngFile}`, "file:///" + htmlFile.split("\\").join("/")], { stdio: "ignore", timeout: 90000 });
    console.log(pngFile);
  }
  process.exit(0);
}

for (const step of wanted) {
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style><style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head><body>${body}
<script>
window.requestAnimationFrame = undefined;
window.ReagvisBridge = { ready() {}, stepChanged() {} };
</script>
<script>${js}</script>
<script>
window.ReagvisAnimation.onCommand("GOTO_STEP", ${JSON.stringify(step)});
</script></body></html>`;
  const htmlFile = path.join(outDir, `${name}__${step}.html`);
  const pngFile = path.join(outDir, `${name}__${step}.png`);
  writeFileSync(htmlFile, page);
  execFileSync(
    CHROME,
    [
      "--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`,
      "--hide-scrollbars", `--window-size=700,${manifest.heightPx}`, "--virtual-time-budget=3000",
      `--screenshot=${pngFile}`, "file:///" + htmlFile.replace(/\\/g, "/"),
    ],
    { stdio: "ignore", timeout: 60000 },
  );
  console.log(pngFile);
}
