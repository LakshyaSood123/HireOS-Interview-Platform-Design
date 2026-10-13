// Behavioural QA for animation packages, run WITHOUT a browser: each animation.js
// is executed in a vm sandbox with a permissive fake DOM and fake timers.
//
//   node seed/ml/qa-autoplay.mjs <folder> [<folder> ...]
//
// Checks: initial ready + first stepChanged, PLAY advances one step per tick and
// stops on the last step, PAUSE keeps the step, PLAY resumes, PLAY on the last
// step restarts, RESET/NEXT/PREVIOUS/GOTO_STEP stop autoplay, never more than one
// timer, no duplicate stepChanged per move, no step past the end, and no leaked
// "false/undefined/null/NaN/[object Object]" text written to the page.
// It does NOT check how the animation looks; that needs a browser.

import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";

const LEAK = /^(false|true|undefined|null|NaN|\[object Object\])$/i;

function makeSandbox(manifestEvents) {
  const written = [];
  const record = (v) => { if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === undefined || v === null) written.push(String(v)); else if (typeof v === "object") written.push("[object]"); };
  const fake = () => {
    const target = function () {};
    const store = {};
    return new Proxy(target, {
      get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => "";
        if (prop === "classList") return { add() {}, remove() {}, contains() { return false; }, toggle() {} };
        if (prop === "style") return new Proxy({}, { set() { return true; }, get() { return ""; } });
        if (prop === "length") return 0;
        if (prop === "forEach") return () => {};
        if (prop === "querySelectorAll") return () => Array.from({ length: 8 }, () => fake());
        if (prop === "querySelector") return () => fake();
        if (prop === "getContext") return () => fake();
        if (prop in store) return store[prop];
        return fake();
      },
      set(_t, prop, value) {
        if (prop === "textContent" || prop === "innerHTML" || prop === "innerText") record(value);
        store[prop] = value;
        return true;
      },
      apply() { return fake(); },
    });
  };
  const events = [];
  const timers = new Map();
  const durations = [];
  let nextId = 1;
  const window = {
    ReagvisBridge: {
      ready() { events.push("READY"); },
      stepChanged(id) { events.push("STEP:" + id); },
    },
    addEventListener() {},
  };
  const document = {
    getElementById: () => fake(),
    createElementNS: () => fake(),
    createElement: () => fake(),
    querySelector: () => fake(),
    querySelectorAll: () => Array.from({ length: 8 }, () => fake()),
  };
  const sandbox = {
    window, document, console,
    setInterval(fn, ms) { const id = nextId++; timers.set(id, { fn, ms }); return id; },
    clearInterval(id) { timers.delete(id); },
    setTimeout(fn, ms) { const id = nextId++; timers.set(id, { fn, ms, once: true }); durations.push(ms); return id; },
    clearTimeout(id) { timers.delete(id); },
    Math, JSON, Array, Object, String, Number, parseInt, parseFloat, isNaN,
  };
  sandbox.window.window = sandbox.window;
  return { sandbox, window, events, timers, written, manifestEvents, durations };
}

export function qaAutoplay(folder) {
  const failures = [];
  const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
  const stepIds = manifest.traceEvents;
  const code = readFileSync(path.join(folder, "animation.js"), "utf8");
  const env = makeSandbox(stepIds);
  vm.createContext(env.sandbox);
  try {
    vm.runInContext(code, env.sandbox);
  } catch (e) {
    return { package: path.basename(folder), failures: ["animation.js threw: " + e.message] };
  }
  const { window, events, timers, written } = env;
  const cmd = (type, stepId) => window.ReagvisAnimation.onCommand(type, stepId);
  const tick = () => { for (const [id, t] of [...timers.entries()]) { if (t.once) timers.delete(id); t.fn(); } };
  const last = () => { const s = events.filter(e => e.startsWith("STEP:")); return s.length ? s[s.length - 1].slice(5) : null; };
  const check = (cond, msg) => { if (!cond) failures.push(msg); };
  const n = stepIds.length;

  check(events[0] === "READY", "READY is not the first bridge event");
  check(events[1] === "STEP:" + stepIds[0], `first stepChanged is ${events[1]}, expected STEP:${stepIds[0]}`);

  // PLAY advances one step per tick, stops on the last step.
  events.length = 0;
  cmd("PLAY");
  check(timers.size === 1, `PLAY started ${timers.size} timers`);
  cmd("PLAY");
  check(timers.size === 1, "second PLAY created a second timer");
  const seen = [];
  for (let i = 0; i < n + 3; i++) { tick(); seen.push(last()); }
  const stepsEmitted = events.filter(e => e.startsWith("STEP:")).map(e => e.slice(5));
  check(JSON.stringify(stepsEmitted) === JSON.stringify(stepIds.slice(1)), `autoplay emitted ${stepsEmitted.join(",")} expected ${stepIds.slice(1).join(",")}`);
  check(timers.size === 0, "timer still running after the final step");
  check(last() === stepIds[n - 1], "did not end on the final step");

  // PLAY on the last step restarts from the first step.
  events.length = 0;
  cmd("PLAY");
  check(last() === stepIds[0], "PLAY on the last step did not restart at step 1");
  check(timers.size === 1, "restart did not start a timer");
  tick();
  check(last() === stepIds[1], "restarted autoplay did not advance");

  // PAUSE keeps the step; PLAY resumes from it.
  cmd("PAUSE");
  check(timers.size === 0, "PAUSE left a timer running");
  const pausedAt = last();
  tick(); tick();
  check(last() === pausedAt, "step changed while paused");
  cmd("PLAY");
  tick();
  check(last() === stepIds[2] || n < 3, `resume went to ${last()} expected ${stepIds[2]}`);

  // NEXT / PREVIOUS stop autoplay and move exactly one step.
  const before = stepIds.indexOf(last());
  cmd("NEXT");
  check(timers.size === 0, "NEXT did not stop autoplay");
  check(stepIds.indexOf(last()) === Math.min(before + 1, n - 1), "NEXT did not move exactly one step");
  cmd("PLAY");
  cmd("PREVIOUS");
  check(timers.size === 0, "PREVIOUS did not stop autoplay");

  // GOTO_STEP stops autoplay and jumps; RESET returns to the first step and emits it.
  cmd("PLAY");
  cmd("GOTO_STEP", stepIds[n - 1]);
  check(timers.size === 0, "GOTO_STEP did not stop autoplay");
  check(last() === stepIds[n - 1], "GOTO_STEP went to the wrong step");
  cmd("PLAY");
  cmd("RESET");
  check(timers.size === 0, "RESET did not stop autoplay");
  check(last() === stepIds[0], "RESET did not return to the first step");

  // Never past the end; unknown step ignored.
  cmd("GOTO_STEP", stepIds[n - 1]);
  cmd("NEXT");
  check(last() === stepIds[n - 1], "NEXT moved past the final step");
  const lenBefore = events.length;
  cmd("GOTO_STEP", "no-such-step");
  check(events.length === lenBefore, "unknown GOTO_STEP emitted an event");

  // Educational pace: every scheduled autoplay delay (and every step's declared duration) is 4.5 to 10.5 seconds.
  const badDelays = env.durations.filter((ms) => ms < 4500 || ms > 10500);
  check(env.durations.length > 0 && badDelays.length === 0, `autoplay delays outside 4.5-10.5s: ${badDelays.join(",")}`);
  const stepDuration = window.ReagvisAnimation.stepDuration;
  if (typeof stepDuration !== "function") check(false, "ReagvisAnimation.stepDuration is not exposed");
  else for (let i = 0; i < n; i++) { const ms = stepDuration(i); check(ms >= 4500 && ms <= 10500, `step ${i} duration ${ms}ms outside 4.5-10.5s`); }

  // Leaked values.
  const leaks = written.filter(w => LEAK.test(w.trim()));
  check(leaks.length === 0, `leaked text written to the page: ${[...new Set(leaks)].join(", ")}`);

  return { package: path.basename(folder), steps: n, result: failures.length ? "FAIL" : "PASS", failures };
}

const isMain = process.argv[1] && process.argv[1].endsWith("qa-autoplay.mjs");
if (isMain) {
  let failed = 0;
  for (const folder of process.argv.slice(2)) {
    const r = qaAutoplay(folder);
    if (r.failures.length) failed++;
    console.log(`${r.package.padEnd(32)} ${r.failures.length ? "FAIL" : "PASS"} ${r.steps ? "(" + r.steps + " steps)" : ""}`);
    for (const f of r.failures) console.log("   - " + f);
  }
  process.exit(failed ? 1 : 0);
}
