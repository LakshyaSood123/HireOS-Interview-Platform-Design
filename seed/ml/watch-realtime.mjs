// Plays animation packages in REAL time in headless Chrome (no virtual time, real timers and requestAnimationFrame),
// the way a learner would: press PLAY once and let it run to the end. For every step it records the wall-clock
// time the step was on screen and takes a screenshot of the settled frame. Prints a pacing table that compares
// the on-screen time with the time needed to read that step's explanation (230 words per minute).
//
//   node seed/ml/watch-realtime.mjs --out=<dir> <package-folder> [<package-folder> ...]
//
// Uses the Chrome DevTools protocol over Node's built-in WebSocket; nothing is installed.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const args = process.argv.slice(2);
const outDir = (args.find((a) => a.startsWith("--out=")) || "--out=" + path.join(tmpdir(), "ml-watch")).slice(6);
const folders = args.filter((a) => !a.startsWith("--"));
mkdirSync(outDir, { recursive: true });
const PORT = 9400 + Math.floor(Math.random() * 400);
const WPM = 230;

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(tmpdir(), "ml-watch-profile-" + PORT)}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not start");
}

const ws = new WebSocket(await connect());
await new Promise((r) => (ws.onopen = r));
let nextId = 1;
const waiting = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  waiting.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

const rows = [];
for (const folder of folders) {
  const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
  const html = readFileSync(path.join(folder, "animation.html"), "utf8");
  const css = readFileSync(path.join(folder, "animation.css"), "utf8");
  const js = readFileSync(path.join(folder, "animation.js"), "utf8");
  const name = path.basename(folder);
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}
<script>
window.__log = [];
window.ReagvisBridge = { ready() {}, stepChanged(id) { window.__log.push([id, performance.now()]); } };
</script>
<script>${js}</script></body></html>`;
  const file = path.join(outDir, name + ".html");
  writeFileSync(file, page);
  await send("Emulation.setDeviceMetricsOverride", { width: 700, height: manifest.heightPx, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/") });
  await sleep(1200);
  const steps = manifest.traceEvents;
  // The explanations are embedded in animation.js as `var EXPLAIN = {...};` (built packages carry no explain.json).
  const start1 = js.indexOf("var EXPLAIN = ") + "var EXPLAIN = ".length;
  const end1 = js.indexOf("};", start1) + 1;
  const m = start1 > 13 && end1 > start1 ? [null, js.slice(start1, end1)] : null;
  if (!m) throw new Error(name + ": EXPLAIN data not found in animation.js");
  const explain = JSON.parse(m[1]);
  await evalJs(`window.__log.length = 0; window.ReagvisAnimation.onCommand("RESET"); window.ReagvisAnimation.onCommand("PLAY"); 0`);
  const shots = new Set();
  const start = Date.now();
  while (Date.now() - start < 240000) {
    const log = await evalJs("JSON.stringify(window.__log)");
    const entries = JSON.parse(log);
    for (let i = 0; i < entries.length; i++) {
      if (!shots.has(i) && (await evalJs("performance.now()")) - entries[i][1] > 1300) {
        const shot = await send("Page.captureScreenshot", { format: "png" });
        writeFileSync(path.join(outDir, `${name}__${String(i + 1).padStart(2, "0")}-${entries[i][0]}.png`), Buffer.from(shot.data, "base64"));
        shots.add(i);
      }
    }
    // Finished once the final step has been shown and its screenshot taken (the chain stops there).
    if (entries.length >= steps.length && shots.size >= steps.length) {
      rows.push({ name, entries, explain, steps });
      break;
    }
    await sleep(200);
  }
  if (!rows.find((r) => r.name === name)) { rows.push({ name, entries: JSON.parse(await evalJs("JSON.stringify(window.__log)")), explain, steps, incomplete: true }); }
}
ws.close();
chrome.kill();

let flagged = 0;
for (const r of rows) {
  console.log(`\n${r.name}${r.incomplete ? "   (INCOMPLETE RUN)" : ""}   steps reached ${r.entries.length}/${r.steps.length}`);
  for (let i = 0; i < r.entries.length; i++) {
    const [id, t] = r.entries[i];
    const next = r.entries[i + 1];
    const onScreen = next ? (next[1] - t) / 1000 : null;
    const words = r.explain[id].t.replace(/\*\*/g, "").split(/\s+/).length;
    const read = (words / WPM) * 60;
    const verdict = onScreen === null ? "last (stays)" : onScreen >= read + 1 ? "ok" : onScreen >= read ? "tight" : "FAST";
    if (verdict === "FAST") flagged++;
    console.log(`  ${String(i + 1).padStart(2)} ${id.padEnd(28)} words ${String(words).padStart(2)}  read ~${read.toFixed(1)}s  on screen ${onScreen === null ? "  -  " : onScreen.toFixed(2) + "s"}  ${verdict}`);
  }
}
console.log(`\nFAST steps: ${flagged}`);
