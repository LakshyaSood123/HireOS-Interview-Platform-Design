// Static QA for Machine Learning animation packages (folders with
// animation.html / animation.css / animation.js / manifest.json / trace.json).
//
//   node seed/ml/qa-packages.mjs <folder> [<folder> ...]
//
// Checks the rules the backend and learner runtime depend on. It does NOT
// render the animation in a browser; that is a separate manual QA step.

import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const ALLOWED_CAPABILITIES = ["play", "pause", "next", "previous", "reset", "gotoStep"];
const ROOT_FILES = ["animation.html", "animation.css", "animation.js", "manifest.json", "trace.json"];
const FORBIDDEN_PATTERNS = [
  { name: "remote <script src>", re: /<script[^>]*\bsrc\s*=\s*["']?\s*(https?:|\/\/)/i },
  { name: "remote <link href>", re: /<link[^>]*\bhref\s*=\s*["']?\s*(https?:|\/\/)/i },
  { name: "css @import", re: /@import\s/i },
  { name: "fetch(", re: /\bfetch\s*\(/ },
  { name: "XMLHttpRequest", re: /XMLHttpRequest/ },
  { name: "WebSocket", re: /WebSocket/ },
  // The SVG namespace identifier is a string constant, not a request. It is the
  // only URL allowed; any other http(s) URL fails the scan.
  { name: "remote URL", re: /https?:\/\/(?!www\.w3\.org\/2000\/svg\b)/i },
  { name: "dynamic import(", re: /\bimport\s*\(/ },
  { name: "navigator.sendBeacon", re: /sendBeacon/ },
];
const LANGUAGE_KEYS = ["pseudocode", "python", "cpp", "java"];

function py(snippet) {
  // Compile-only check: valid Python syntax, nothing executed.
  const dir = mkdtempSync(path.join(tmpdir(), "ml-qa-"));
  const file = path.join(dir, "snippet.py");
  writeFileSync(file, snippet, "utf8");
  try {
    execFileSync("python", ["-c", "import sys,ast; ast.parse(open(sys.argv[1]).read())", file], { stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error.stderr || error.message).split("\n").slice(-3).join(" ").trim() };
  }
}

export function qaPackage(folder) {
  const report = { package: path.basename(folder), folder, failures: [], warnings: [] };
  const fail = msg => report.failures.push(msg);
  const warn = msg => report.warnings.push(msg);

  for (const f of ROOT_FILES) if (!existsSync(path.join(folder, f))) fail(`missing root file ${f}`);
  if (report.failures.length) return report;

  const read = f => readFileSync(path.join(folder, f), "utf8");
  const manifest = JSON.parse(read("manifest.json"));
  const trace = JSON.parse(read("trace.json"));
  const html = read("animation.html");
  const css = read("animation.css");
  const js = read("animation.js");

  // Manifest.
  if (!Number.isInteger(manifest.heightPx) || manifest.heightPx < 80 || manifest.heightPx > 2000) fail(`heightPx ${manifest.heightPx} out of range 80–2000`);
  const caps = manifest.capabilities ?? [];
  for (const c of caps) if (!ALLOWED_CAPABILITIES.includes(c)) fail(`unknown capability "${c}"`);
  for (const c of ALLOWED_CAPABILITIES) if (!caps.includes(c)) warn(`capability "${c}" not declared`);
  const traceEvents = manifest.traceEvents ?? [];
  if (new Set(traceEvents).size !== traceEvents.length) fail("duplicate traceEvents in manifest");
  report.manifestTraceEvents = traceEvents.length;

  // Trace.
  if (trace.version !== 1) fail(`trace version ${trace.version}, expected 1`);
  const steps = trace.steps ?? [];
  report.steps = steps.length;
  const ids = steps.map(s => s.id);
  report.uniqueIds = new Set(ids).size === ids.length;
  if (!report.uniqueIds) fail("duplicate trace step ids");
  const eventSet = new Set(steps.filter(s => s.animationEvent).map(s => s.animationEvent));
  report.traceEventCount = steps.filter(s => s.animationEvent).length;
  const declared = new Set(traceEvents);
  const undeclared = [...eventSet].filter(e => !declared.has(e));
  const unused = traceEvents.filter(e => !eventSet.has(e));
  report.match = undeclared.length === 0 && unused.length === 0 && report.traceEventCount === traceEvents.length;
  if (undeclared.length) fail(`animationEvent not in manifest: ${undeclared.join(", ")}`);
  if (unused.length) fail(`manifest traceEvent without a trace step: ${unused.join(", ")}`);

  const pyStatus = [];
  let allPseudo = true;
  let allPython = true;
  for (const step of steps) {
    if (!step.label || !step.label.trim()) fail(`step "${step.id}" has empty label`);
    if (!step.code || !step.code.pseudocode || !step.code.pseudocode.trim()) { allPseudo = false; fail(`step "${step.id}" has empty pseudocode`); }
    for (const key of Object.keys(step.code ?? {})) {
      if (!LANGUAGE_KEYS.includes(key)) fail(`step "${step.id}" has unknown language key "${key}"`);
      if ((key === "cpp" || key === "java") && step.code[key]) fail(`step "${step.id}" has ${key} code; ML packages must not ship C++/Java`);
    }
    if (!step.code?.python || !step.code.python.trim()) {
      allPython = false;
    } else {
      const check = py(step.code.python);
      if (!check.ok) fail(`step "${step.id}" python does not parse: ${check.error}`);
      pyStatus.push(check.ok);
    }
  }
  report.pseudocode = allPseudo ? "ok" : "MISSING";
  report.python = allPython ? `ok (${pyStatus.length}/${steps.length} parse)` : `partial (${pyStatus.length}/${steps.length})`;
  if (!allPython) warn("some steps have no Python (allowed only when Python adds no value)");

  // Bridge: ready() then an initial stepChanged(), onCommand dispatch, GOTO_STEP.
  const readyIdx = js.indexOf("ReagvisBridge.ready()");
  const stepIdx = js.indexOf("ReagvisBridge.stepChanged(", readyIdx);
  report.bridgeReady = readyIdx >= 0 ? "ok" : "MISSING";
  report.initialStepChanged = readyIdx >= 0 && stepIdx > readyIdx ? "ok" : "MISSING";
  if (readyIdx < 0) fail("animation.js does not call window.ReagvisBridge.ready()");
  if (stepIdx < 0 || stepIdx < readyIdx) fail("no stepChanged() emitted after ready()");
  const hasOnCommand = /window\.ReagvisAnimation\s*=\s*\{[\s\S]*onCommand\s*:/.test(js);
  if (!hasOnCommand) fail("window.ReagvisAnimation.onCommand is not defined");
  report.onCommand = hasOnCommand ? "ok" : "MISSING";
  report.gotoStep = /GOTO_STEP/.test(js) ? "ok" : "MISSING";
  if (!/GOTO_STEP/.test(js)) fail("GOTO_STEP is not handled");
  for (const cmd of ["PLAY", "PAUSE", "NEXT", "PREVIOUS", "RESET"]) {
    if (!js.includes(`"${cmd}"`)) fail(`command ${cmd} is not handled`);
  }

  // Every semantic event must be referenced by the animation itself.
  const missingInJs = traceEvents.filter(e => !js.includes(`"${e}"`));
  if (missingInJs.length) fail(`trace events not present in animation.js: ${missingInJs.join(", ")}`);

  // Remote dependency and network scan across all three source files.
  const combined = { html, css, js };
  const hits = [];
  for (const [file, text] of Object.entries(combined)) {
    for (const p of FORBIDDEN_PATTERNS) if (p.re.test(text)) hits.push(`${p.name} in ${file}`);
  }
  report.remoteScan = hits.length ? `FAIL: ${hits.join("; ")}` : "clean";
  for (const h of hits) fail(h);

  report.result = report.failures.length === 0 ? "PASS" : "FAIL";
  return report;
}

const isMain = process.argv[1] && process.argv[1].endsWith("qa-packages.mjs");
if (isMain) {
  const folders = process.argv.slice(2);
  if (folders.length === 0) {
    console.error("usage: node seed/ml/qa-packages.mjs <folder> [...]");
    process.exit(2);
  }
  let failed = 0;
  for (const folder of folders) {
    const r = qaPackage(folder);
    if (r.result !== "PASS") failed += 1;
    console.log(JSON.stringify({
      package: r.package,
      result: r.result,
      steps: r.steps,
      uniqueIds: r.uniqueIds,
      manifestTraceEvents: r.manifestTraceEvents,
      traceEventCount: r.traceEventCount,
      match: r.match,
      pseudocode: r.pseudocode,
      python: r.python,
      bridgeReady: r.bridgeReady,
      initialStepChanged: r.initialStepChanged,
      onCommand: r.onCommand,
      gotoStep: r.gotoStep,
      remoteScan: r.remoteScan,
      failures: r.failures,
      warnings: r.warnings,
    }, null, 1));
  }
  process.exit(failed ? 1 : 0);
}
