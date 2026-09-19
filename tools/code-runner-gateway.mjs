#!/usr/bin/env node
// Local execution gateway: Browser -> (Vite proxy) -> this gateway -> self-hosted
// Piston (127.0.0.1:2000). Node built-ins + native fetch only, no npm deps.
//
// Scope (MVP): real execution is allowed ONLY for activityId "foundations-4"
// (findMax) in python/cpp/java. Every other activity/language is rejected as
// unsupported so the frontend falls back to MockCodeRunner. This process
// owns all Piston resource/timeout/version policy — the browser can never
// influence it, and never sees Piston's management/package endpoints.

import http from "node:http"

const GATEWAY_HOST = "127.0.0.1"
const GATEWAY_PORT = 8787
const PISTON_BASE_URL = "http://127.0.0.1:2000"

const ALLOWED_ACTIVITY_IDS = new Set(["foundations-4"])
const ALLOWED_LANGUAGES = new Set(["python", "cpp", "java"])
const MAX_SOURCE_BYTES = 50 * 1024

// Conservative resource policy — set once, here, never overridable by the
// browser. Java's single-file source launch (compile+run in one "run"
// stage) measured ~95MB RSS for a trivial program in direct smoke testing,
// so run_memory_limit is set well above that for headroom.
// 15s (Piston server ceiling raised to 20s via PISTON_COMPILE_TIMEOUT in the
// external Piston docker-compose.yaml) — this host's Docker/WSL2 filesystem
// showed I/O-bound g++ compiles ranging ~6s-10s+ for the same trivial
// source across repeated runs (cpu_time stayed <1s throughout), so 10s was
// occasionally tripped by environment noise rather than a real compile
// problem. 15s keeps a real ceiling while absorbing that variance.
const COMPILE_TIMEOUT_MS = 15_000
const RUN_TIMEOUT_MS = 3_000
const COMPILE_CPU_TIME_MS = 10_000
const RUN_CPU_TIME_MS = 3_000
const COMPILE_MEMORY_LIMIT_BYTES = 256_000_000
const RUN_MEMORY_LIMIT_BYTES = 512_000_000

const PISTON_LANGUAGE = {
  python: { language: "python", version: "3.12.0" },
  cpp: { language: "c++", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
}

const CASE_MARKER = "__REAGVIS_CASE__"

// Structured server-side fixtures for foundations-4 ONLY (MVP). Mirrors the
// display strings in src/learning/content/complexityModule.ts's
// miniAnalysisChallenge.codingActivity visibleTests/hiddenTests exactly —
// intentionally not a generic parser of TestCase.input strings (fragile),
// and intentionally not extended to the other 36 activities.
const FIXTURES = {
  "foundations-4": {
    functionName: "findMax",
    visible: [
      { id: "v1", description: "Mixed values", input: "[3,7,2,9,4]", expected: "9", args: [3, 7, 2, 9, 4], expectedValue: 9 },
      { id: "v2", description: "Single element", input: "[5]", expected: "5", args: [5], expectedValue: 5 },
      { id: "v3", description: "All negative", input: "[-3,-1,-7]", expected: "-1", args: [-3, -1, -7], expectedValue: -1 },
    ],
    hidden: [
      { id: "h1", description: "Ascending run", input: "[1,2,3,4,5]", expected: "5", args: [1, 2, 3, 4, 5], expectedValue: 5 },
      { id: "h2", description: "Descending run", input: "[9,8,7,6]", expected: "9", args: [9, 8, 7, 6], expectedValue: 9 },
      { id: "h3", description: "Repeated max values", input: "[4,4,4]", expected: "4", args: [4, 4, 4], expectedValue: 4 },
    ],
  },
}

let runtimeCache = null
let runtimeCacheAt = 0
const RUNTIME_CACHE_TTL_MS = 60_000

async function getPistonRuntimes() {
  const now = Date.now()
  if (runtimeCache && now - runtimeCacheAt < RUNTIME_CACHE_TTL_MS) return runtimeCache
  const res = await fetch(`${PISTON_BASE_URL}/api/v2/runtimes`)
  if (!res.ok) throw new Error(`piston runtimes fetch failed: ${res.status}`)
  runtimeCache = await res.json()
  runtimeCacheAt = now
  return runtimeCache
}

async function isRuntimeInstalled(language, version) {
  try {
    const runtimes = await getPistonRuntimes()
    return runtimes.some(r => r.language === language && r.version === version)
  } catch {
    return false
  }
}

function truncate(text, max = 4000) {
  if (!text) return ""
  return text.length > max ? text.slice(0, max) + "\n... (truncated)" : text
}

function pyLiteral(nums) {
  return `[${nums.join(", ")}]`
}

function buildPythonSource(learnerCode, cases) {
  const driverLines = cases
    .map(
      (c, i) =>
        `    try:\n        print("${CASE_MARKER}${i}\\t" + str(findMax(${pyLiteral(c.args)})))\n    except Exception as __reagvis_e:\n        print("__REAGVIS_ERROR__${i}\\t" + str(__reagvis_e))`
    )
    .join("\n")
  return `${learnerCode.replace(/\s+$/, "")}\n\ndef __reagvis_run_cases():\n${driverLines}\n\n__reagvis_run_cases()\n`
}

function buildCppSource(learnerCode, cases) {
  const caseBlocks = cases
    .map(
      (c, i) =>
        `    {\n        vector<int> nums = {${c.args.join(", ")}};\n        cout << "${CASE_MARKER}${i}" << "\\t" << findMax(nums) << "\\n";\n    }`
    )
    .join("\n")
  // Targeted includes rather than <bits/stdc++.h>: the umbrella header measured
  // 10s+ wall-clock compiles in this Docker/WSL2 environment (I/O bound, not
  // CPU bound — cpu_time stayed under 1s while wall_time hit the compile
  // timeout), which would misreport as a compile_error. Minimal includes
  // compile in ~6s and cover everything findMax needs.
  return `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${learnerCode.trim()}\n\nint main() {\n${caseBlocks}\n    return 0;\n}\n`
}

function buildJavaSource(learnerCode, cases) {
  const casesLiteral = cases.map(c => `{${c.args.join(", ")}}`).join(", ")
  return [
    "import java.util.*;",
    "",
    "public class Main {",
    `    static ${learnerCode.trim()}`,
    "",
    "    public static void main(String[] args) {",
    `        int[][] cases = {${casesLiteral}};`,
    "        for (int i = 0; i < cases.length; i++) {",
    `            System.out.println("${CASE_MARKER}" + i + "\\t" + findMax(cases[i]));`,
    "        }",
    "    }",
    "}",
    "",
  ].join("\n")
}

function buildHarnessSource(language, learnerCode, cases) {
  if (language === "python") return buildPythonSource(learnerCode, cases)
  if (language === "cpp") return buildCppSource(learnerCode, cases)
  if (language === "java") return buildJavaSource(learnerCode, cases)
  throw new Error(`unsupported language: ${language}`)
}

function pistonFileFor(language, source) {
  if (language === "python") return { name: "main.py", content: source }
  if (language === "cpp") return { name: "main.cpp", content: source }
  if (language === "java") return { name: "main", content: source }
  throw new Error(`unsupported language: ${language}`)
}

/** Classifies a raw Piston /api/v2/execute response into our normalized
 * status vocabulary. Never returns the raw Piston shape to callers. */
function classifyPistonResponse(piston) {
  if (piston.compile && piston.compile.code !== 0) {
    return { status: "compile_error", message: truncate(piston.compile.stderr || piston.compile.output || "Compile failed.") }
  }
  const run = piston.run
  if (!run) return { status: "system_error", message: "Piston returned no run result." }
  if (run.status === "TO") return { status: "time_limit_exceeded", message: "Execution exceeded the time limit." }
  if (run.status === "RE" || run.code !== 0) {
    const text = run.stderr || run.output || "Runtime error."
    // Java has no separate Piston "compile" stage (single-file source
    // launch compiles+runs in one step, verified directly against the
    // runtime) — a javac diagnostic surfaces here indistinguishably from a
    // real runtime exception unless we recognize its distinct shape.
    const looksLikeJavaCompileError = /error: compilation failed/.test(text) || /\.java:\d+: error:/.test(text)
    return { status: looksLikeJavaCompileError ? "compile_error" : "runtime_error", message: truncate(text) }
  }
  return { status: "ok", stdout: run.stdout ?? "" }
}

function parseTaggedOutput(stdout, count) {
  const lines = stdout.split("\n")
  const results = new Map()
  for (const line of lines) {
    const okMatch = line.match(/^__REAGVIS_CASE__(\d+)\t(.+)$/)
    if (okMatch) {
      results.set(Number(okMatch[1]), { ok: true, value: okMatch[2].trim() })
      continue
    }
    const errMatch = line.match(/^__REAGVIS_ERROR__(\d+)\t(.+)$/)
    if (errMatch) {
      results.set(Number(errMatch[1]), { ok: false, value: errMatch[2].trim() })
    }
  }
  const out = []
  for (let i = 0; i < count; i++) out.push(results.get(i) ?? null)
  return out
}

async function runAgainstFixtures(activityId, language, code, testSet) {
  const fixture = FIXTURES[activityId]
  const cases = fixture[testSet]
  const source = buildHarnessSource(language, code, cases)
  const { language: pistonLanguage, version } = PISTON_LANGUAGE[language]

  const pistonRequest = {
    language: pistonLanguage,
    version,
    files: [pistonFileFor(language, source)],
    stdin: "",
    args: [],
    compile_timeout: COMPILE_TIMEOUT_MS,
    run_timeout: RUN_TIMEOUT_MS,
    compile_cpu_time: COMPILE_CPU_TIME_MS,
    run_cpu_time: RUN_CPU_TIME_MS,
    compile_memory_limit: COMPILE_MEMORY_LIMIT_BYTES,
    run_memory_limit: RUN_MEMORY_LIMIT_BYTES,
  }

  const started = Date.now()
  let pistonRes
  try {
    pistonRes = await fetch(`${PISTON_BASE_URL}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonRequest),
    })
  } catch {
    return { ok: false, infrastructure_failure: true, reason: "piston_unreachable" }
  }
  if (!pistonRes.ok) {
    return { ok: false, infrastructure_failure: true, reason: "piston_unreachable" }
  }
  const piston = await pistonRes.json()
  const runtimeMs = Date.now() - started
  const classified = classifyPistonResponse(piston)

  if (classified.status === "compile_error" || classified.status === "runtime_error" || classified.status === "time_limit_exceeded") {
    return {
      ok: true,
      result: {
        status: "error",
        message: classified.message,
        testsPassed: 0,
        totalTests: cases.length,
        runtimeMs,
        tests: [],
        errorKind: classified.status,
      },
    }
  }
  if (classified.status === "system_error") {
    return { ok: false, infrastructure_failure: true, reason: "gateway_system_error" }
  }

  const parsed = parseTaggedOutput(classified.stdout, cases.length)
  const tests = cases.map((c, i) => {
    const p = parsed[i]
    const receivedRaw = p ? p.value : "(no output for this case)"
    const passed = !!p && p.ok && Number(p.value) === c.expectedValue
    return {
      id: c.id,
      description: c.description,
      status: passed ? "passed" : "failed",
      input: c.input,
      expected: c.expected,
      received: receivedRaw,
    }
  })

  return {
    ok: true,
    result: {
      status: "completed",
      testsPassed: tests.filter(t => t.status === "passed").length,
      totalTests: tests.length,
      runtimeMs,
      tests,
    },
  }
}

async function handleExecute(req, res) {
  let body = ""
  let tooLarge = false
  req.on("data", chunk => {
    body += chunk
    if (Buffer.byteLength(body, "utf8") > MAX_SOURCE_BYTES + 4096) tooLarge = true
  })
  req.on("end", async () => {
    try {
      if (tooLarge) return sendJson(res, 413, { ok: false, infrastructure_failure: false, unsupported: true, reason: "source_too_large" })

      let payload
      try {
        payload = JSON.parse(body)
      } catch {
        return sendJson(res, 400, { ok: false, infrastructure_failure: false, unsupported: true, reason: "invalid_json" })
      }

      const { mode, activityId, language, code } = payload ?? {}
      if (mode !== "run" && mode !== "submit") {
        return sendJson(res, 400, { ok: false, infrastructure_failure: false, unsupported: true, reason: "invalid_mode" })
      }
      if (typeof activityId !== "string" || !ALLOWED_ACTIVITY_IDS.has(activityId)) {
        return sendJson(res, 200, { ok: false, infrastructure_failure: false, unsupported: true, reason: "unsupported_activity" })
      }
      if (typeof language !== "string" || !ALLOWED_LANGUAGES.has(language)) {
        return sendJson(res, 200, { ok: false, infrastructure_failure: false, unsupported: true, reason: "unsupported_language" })
      }
      if (typeof code !== "string" || Buffer.byteLength(code, "utf8") > MAX_SOURCE_BYTES) {
        return sendJson(res, 200, { ok: false, infrastructure_failure: false, unsupported: true, reason: "source_too_large" })
      }

      const { language: pistonLanguage, version } = PISTON_LANGUAGE[language]
      const installed = await isRuntimeInstalled(pistonLanguage, version)
      if (!installed) {
        return sendJson(res, 200, { ok: false, infrastructure_failure: true, reason: "runtime_unavailable" })
      }

      const testSet = mode === "run" ? "visible" : "hidden"
      const result = await runAgainstFixtures(activityId, language, code, testSet)
      return sendJson(res, 200, result)
    } catch (err) {
      return sendJson(res, 200, { ok: false, infrastructure_failure: true, reason: "gateway_system_error", detail: String(err?.message ?? err) })
    }
  })
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) })
  res.end(body)
}

async function handleHealth(req, res) {
  try {
    const runtimes = await getPistonRuntimes()
    const have = (lang, ver) => runtimes.some(r => r.language === lang && r.version === ver)
    sendJson(res, 200, {
      ok: true,
      piston: PISTON_BASE_URL,
      runtimes: {
        python: have("python", "3.12.0"),
        cpp: have("c++", "10.2.0"),
        java: have("java", "15.0.2"),
      },
    })
  } catch (err) {
    sendJson(res, 200, { ok: false, reason: "piston_unreachable", detail: String(err?.message ?? err) })
  }
}

const server = http.createServer((req, res) => {
  const url = req.url?.split("?")[0] ?? ""

  if (req.method === "GET" && url === "/health") return handleHealth(req, res)

  // Only ever the gateway's own execute route — never proxies or exposes
  // Piston's package/management endpoints.
  if (req.method === "POST" && url === "/api/code-runner/execute") return handleExecute(req, res)

  sendJson(res, 404, { ok: false, reason: "not_found" })
})

server.listen(GATEWAY_PORT, GATEWAY_HOST, () => {
  console.log(`[code-runner-gateway] listening on http://${GATEWAY_HOST}:${GATEWAY_PORT}`)
  console.log(`[code-runner-gateway] piston base: ${PISTON_BASE_URL}`)
})
