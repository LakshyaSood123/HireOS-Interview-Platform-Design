#!/usr/bin/env node
// Local execution gateway: Browser -> (Vite proxy) -> this gateway -> self-hosted
// Piston (127.0.0.1:2000). Node built-ins + native fetch only, no npm deps.
//
// Scope: real execution is allowed ONLY for the "Family A" activity ids in
// ALLOWED_ACTIVITY_IDS below (scalar/array-in, scalar/bool-out — no lists,
// trees, tries, or graph objects). Every other activity/language is rejected
// as unsupported so the frontend falls back to MockCodeRunner. This process
// owns all Piston resource/timeout/version policy — the browser can never
// influence it, and never sees Piston's management/package endpoints.

import http from "node:http"

const GATEWAY_HOST = "127.0.0.1"
const GATEWAY_PORT = 8787
const PISTON_BASE_URL = "http://127.0.0.1:2000"

// Family A rollout: foundations-4 (original MVP anchor) plus every other
// Family A checkpoint whose curriculum tests were verified to be genuine,
// deterministic data (not the generic-seed placeholder block). Six other
// Family A checkpoints generated via fullCurriculumModules.ts's
// codeCheckpoint() (stack-queue-3, grid-graphs-3 [countIsland], union-find-3,
// greedy-3, dp-3, dp-2d-3) all share one identical, non-type-matching
// placeholder test fixture and are deliberately NOT enabled — see the final
// report for this task.
const ALLOWED_ACTIVITY_IDS = new Set([
  "foundations-4",
  "foundations-5",
  "arrays-strings-5",
  "hashing-4",
  "two-pointers-4",
  "two-pointers-5",
  "sliding-window-4",
  "sliding-window-5",
  "prefix-sum-3",
  "prefix-sum-4",
  "binary-search-4",
  "binary-search-5",
  "recursion-4",
  "recursion-5",
])
const ALLOWED_LANGUAGES = new Set(["python", "cpp", "java"])
const MAX_SOURCE_BYTES = 50 * 1024

// Conservative resource policy — set once, here, never overridable by the
// browser. Java's single-file source launch (compile+run in one "run"
// stage) measured ~95MB RSS for a trivial program in direct smoke testing,
// so run_memory_limit is set well above that for headroom.
// Raised to the Piston server's actual max (20s, via PISTON_COMPILE_TIMEOUT
// in the external Piston docker-compose.yaml) — this host's Docker/WSL2
// filesystem is consistently I/O-bound for g++ compiles (cpu_time stays
// under 1s while wall_time has ranged from ~6s to ~15s across sessions on
// the same trivial source), so 15s was occasionally tripped by environment
// noise rather than a real compile problem. This is a host I/O
// characteristic, not a Trail Guide or compiler-semantics change.
const COMPILE_TIMEOUT_MS = 20_000
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

// Structured server-side fixtures for the Family A allowlist. Each entry's
// `args`/`expectedValue` are hand-derived, verbatim, from the CURRENT
// visibleTests/hiddenTests display strings in the corresponding
// src/learning/content/*.ts file (never parsed at runtime — see the file
// comment at each entry). inputDisplay/expectedDisplay are copied unchanged
// from that same curriculum source, purely for UI display; nothing here
// invents or infers a test value the curriculum doesn't already state.
//
// paramTypes: ordered list of "int" | "int[]" | "string", matching args[i].
// returnType: "int" | "long" | "bool" — long only affects C++/Java's
// generated declaration, not comparison (both compare as JS numbers).
const ACTIVITIES = {
  // src/learning/content/complexityModule.ts — miniAnalysisChallenge (original MVP anchor)
  "foundations-4": {
    functionName: "findMax",
    paramTypes: ["int[]"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Mixed values", inputDisplay: "[3,7,2,9,4]", expectedDisplay: "9", args: [[3, 7, 2, 9, 4]], expectedValue: 9 },
      { id: "v2", description: "Single element", inputDisplay: "[5]", expectedDisplay: "5", args: [[5]], expectedValue: 5 },
      { id: "v3", description: "All negative", inputDisplay: "[-3,-1,-7]", expectedDisplay: "-1", args: [[-3, -1, -7]], expectedValue: -1 },
    ],
    hidden: [
      { id: "h1", description: "Ascending run", inputDisplay: "[1,2,3,4,5]", expectedDisplay: "5", args: [[1, 2, 3, 4, 5]], expectedValue: 5 },
      { id: "h2", description: "Descending run", inputDisplay: "[9,8,7,6]", expectedDisplay: "9", args: [[9, 8, 7, 6]], expectedValue: 9 },
      { id: "h3", description: "Repeated max values", inputDisplay: "[4,4,4]", expectedDisplay: "4", args: [[4, 4, 4]], expectedValue: 4 },
    ],
  },
  // src/learning/content/complexityModule.ts — foundationsMastery
  "foundations-5": {
    functionName: "hasDuplicate",
    paramTypes: ["int[]"],
    returnType: "bool",
    visible: [
      { id: "v1", description: "Has a duplicate", inputDisplay: "[1,2,3,2]", expectedDisplay: "true", args: [[1, 2, 3, 2]], expectedValue: true },
      { id: "v2", description: "No duplicates", inputDisplay: "[1,2,3,4]", expectedDisplay: "false", args: [[1, 2, 3, 4]], expectedValue: false },
      { id: "v3", description: "Single element", inputDisplay: "[7]", expectedDisplay: "false", args: [[7]], expectedValue: false },
    ],
    hidden: [
      { id: "h1", description: "Duplicate at the ends", inputDisplay: "[5,1,2,5]", expectedDisplay: "true", args: [[5, 1, 2, 5]], expectedValue: true },
      { id: "h2", description: "All identical", inputDisplay: "[3,3,3]", expectedDisplay: "true", args: [[3, 3, 3]], expectedValue: true },
      { id: "h3", description: "Empty list", inputDisplay: "[]", expectedDisplay: "false", args: [[]], expectedValue: false },
    ],
  },
  // src/learning/content/arraysStringsModule.ts — mastery
  "arrays-strings-5": {
    functionName: "maxProfit",
    paramTypes: ["int[]"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Clear profit", inputDisplay: "[7,1,5,3,6,4]", expectedDisplay: "5", args: [[7, 1, 5, 3, 6, 4]], expectedValue: 5 },
      { id: "v2", description: "No profit possible", inputDisplay: "[7,6,4,3,1]", expectedDisplay: "0", args: [[7, 6, 4, 3, 1]], expectedValue: 0 },
      { id: "v3", description: "Single day", inputDisplay: "[5]", expectedDisplay: "0", args: [[5]], expectedValue: 0 },
    ],
    hidden: [
      { id: "h1", description: "Profit at the end", inputDisplay: "[3,2,6,5,0,3]", expectedDisplay: "4", args: [[3, 2, 6, 5, 0, 3]], expectedValue: 4 },
      { id: "h2", description: "Strictly increasing", inputDisplay: "[1,2,3,4,5]", expectedDisplay: "4", args: [[1, 2, 3, 4, 5]], expectedValue: 4 },
      { id: "h3", description: "Empty prices", inputDisplay: "[]", expectedDisplay: "0", args: [[]], expectedValue: 0 },
    ],
  },
  // src/learning/content/hashingModule.ts — codeLab
  "hashing-4": {
    functionName: "isAnagram",
    paramTypes: ["string", "string"],
    returnType: "bool",
    visible: [
      { id: "v1", description: "Valid anagram", inputDisplay: "s='anagram', t='nagaram'", expectedDisplay: "true", args: ["anagram", "nagaram"], expectedValue: true },
      { id: "v2", description: "Not an anagram", inputDisplay: "s='rat', t='car'", expectedDisplay: "false", args: ["rat", "car"], expectedValue: false },
      { id: "v3", description: "Different lengths", inputDisplay: "s='ab', t='a'", expectedDisplay: "false", args: ["ab", "a"], expectedValue: false },
    ],
    hidden: [
      { id: "h1", description: "Identical strings", inputDisplay: "s='abc', t='abc'", expectedDisplay: "true", args: ["abc", "abc"], expectedValue: true },
      { id: "h2", description: "Same letters, different counts", inputDisplay: "s='aabb', t='abbb'", expectedDisplay: "false", args: ["aabb", "abbb"], expectedValue: false },
      { id: "h3", description: "Both empty", inputDisplay: "s='', t=''", expectedDisplay: "true", args: ["", ""], expectedValue: true },
    ],
  },
  // src/learning/content/twoPointersModule.ts — codeLab
  "two-pointers-4": {
    functionName: "isPalindrome",
    paramTypes: ["string"],
    returnType: "bool",
    visible: [
      { id: "v1", description: "Palindrome with punctuation", inputDisplay: "'A man, a plan, a canal: Panama'", expectedDisplay: "true", args: ["A man, a plan, a canal: Panama"], expectedValue: true },
      { id: "v2", description: "Not a palindrome", inputDisplay: "'race a car'", expectedDisplay: "false", args: ["race a car"], expectedValue: false },
      { id: "v3", description: "Single character", inputDisplay: "'a'", expectedDisplay: "true", args: ["a"], expectedValue: true },
    ],
    hidden: [
      { id: "h1", description: "Mixed case", inputDisplay: "'Was it a car or a cat I saw'", expectedDisplay: "true", args: ["Was it a car or a cat I saw"], expectedValue: true },
      { id: "h2", description: "Numbers included", inputDisplay: "'0P'", expectedDisplay: "false", args: ["0P"], expectedValue: false },
      { id: "h3", description: "Empty string", inputDisplay: "''", expectedDisplay: "true", args: [""], expectedValue: true },
    ],
  },
  // src/learning/content/twoPointersModule.ts — mastery
  "two-pointers-5": {
    functionName: "maxArea",
    paramTypes: ["int[]"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Typical case", inputDisplay: "[1,8,6,2,5,4,8,3,7]", expectedDisplay: "49", args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expectedValue: 49 },
      { id: "v2", description: "Two walls", inputDisplay: "[1,1]", expectedDisplay: "1", args: [[1, 1]], expectedValue: 1 },
      { id: "v3", description: "Increasing heights", inputDisplay: "[1,2,3,4,5]", expectedDisplay: "6", args: [[1, 2, 3, 4, 5]], expectedValue: 6 },
    ],
    hidden: [
      { id: "h1", description: "Decreasing heights", inputDisplay: "[5,4,3,2,1]", expectedDisplay: "6", args: [[5, 4, 3, 2, 1]], expectedValue: 6 },
      { id: "h2", description: "All equal", inputDisplay: "[4,4,4,4]", expectedDisplay: "12", args: [[4, 4, 4, 4]], expectedValue: 12 },
      { id: "h3", description: "Tall walls at the ends", inputDisplay: "[9,1,1,1,9]", expectedDisplay: "36", args: [[9, 1, 1, 1, 9]], expectedValue: 36 },
    ],
  },
  // src/learning/content/slidingWindowModule.ts — codeLab
  "sliding-window-4": {
    functionName: "maxSumFixedWindow",
    paramTypes: ["int[]", "int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Typical case", inputDisplay: "nums=[2,1,5,1,3,2], k=3", expectedDisplay: "9", args: [[2, 1, 5, 1, 3, 2], 3], expectedValue: 9 },
      { id: "v2", description: "Window is whole array", inputDisplay: "nums=[4,2,1], k=3", expectedDisplay: "7", args: [[4, 2, 1], 3], expectedValue: 7 },
      { id: "v3", description: "Window size 1", inputDisplay: "nums=[1,5,2], k=1", expectedDisplay: "5", args: [[1, 5, 2], 1], expectedValue: 5 },
    ],
    hidden: [
      { id: "h1", description: "All negative", inputDisplay: "nums=[-1,-2,-3,-4], k=2", expectedDisplay: "-3", args: [[-1, -2, -3, -4], 2], expectedValue: -3 },
      { id: "h2", description: "Best window at the end", inputDisplay: "nums=[1,1,1,9,9], k=2", expectedDisplay: "18", args: [[1, 1, 1, 9, 9], 2], expectedValue: 18 },
      { id: "h3", description: "Single element window count", inputDisplay: "nums=[3,3,3], k=2", expectedDisplay: "6", args: [[3, 3, 3], 2], expectedValue: 6 },
    ],
  },
  // src/learning/content/slidingWindowModule.ts — mastery
  "sliding-window-5": {
    functionName: "lengthOfLongestSubstring",
    paramTypes: ["string"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Has repeats", inputDisplay: "'abcabcbb'", expectedDisplay: "3", args: ["abcabcbb"], expectedValue: 3 },
      { id: "v2", description: "All same character", inputDisplay: "'bbbbb'", expectedDisplay: "1", args: ["bbbbb"], expectedValue: 1 },
      { id: "v3", description: "No repeats at all", inputDisplay: "'pwwkew'", expectedDisplay: "3", args: ["pwwkew"], expectedValue: 3 },
    ],
    hidden: [
      { id: "h1", description: "Empty string", inputDisplay: "''", expectedDisplay: "0", args: [""], expectedValue: 0 },
      { id: "h2", description: "Single character", inputDisplay: "'a'", expectedDisplay: "1", args: ["a"], expectedValue: 1 },
      { id: "h3", description: "Longest at the end", inputDisplay: "'aab'", expectedDisplay: "2", args: ["aab"], expectedValue: 2 },
    ],
  },
  // src/learning/content/prefixSumModule.ts — codeLab
  "prefix-sum-3": {
    functionName: "rangeSum",
    paramTypes: ["int[]", "int", "int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Middle range", inputDisplay: "nums=[1,2,3,4,5], left=1, right=3", expectedDisplay: "9", args: [[1, 2, 3, 4, 5], 1, 3], expectedValue: 9 },
      { id: "v2", description: "Whole array", inputDisplay: "nums=[1,2,3], left=0, right=2", expectedDisplay: "6", args: [[1, 2, 3], 0, 2], expectedValue: 6 },
      { id: "v3", description: "Single element range", inputDisplay: "nums=[7,2,9], left=1, right=1", expectedDisplay: "2", args: [[7, 2, 9], 1, 1], expectedValue: 2 },
    ],
    hidden: [
      { id: "h1", description: "Range from the start", inputDisplay: "nums=[4,4,4,4], left=0, right=2", expectedDisplay: "12", args: [[4, 4, 4, 4], 0, 2], expectedValue: 12 },
      { id: "h2", description: "Negative numbers", inputDisplay: "nums=[-1,2,-3,4], left=0, right=3", expectedDisplay: "2", args: [[-1, 2, -3, 4], 0, 3], expectedValue: 2 },
      { id: "h3", description: "Single-element array", inputDisplay: "nums=[5], left=0, right=0", expectedDisplay: "5", args: [[5], 0, 0], expectedValue: 5 },
    ],
  },
  // src/learning/content/prefixSumModule.ts — mastery
  "prefix-sum-4": {
    functionName: "subarraySum",
    paramTypes: ["int[]", "int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Two matching subarrays", inputDisplay: "nums=[1,1,1], k=2", expectedDisplay: "2", args: [[1, 1, 1], 2], expectedValue: 2 },
      { id: "v2", description: "One matching subarray", inputDisplay: "nums=[1,2,3], k=3", expectedDisplay: "2", args: [[1, 2, 3], 3], expectedValue: 2 },
      { id: "v3", description: "No match", inputDisplay: "nums=[1,2,3], k=100", expectedDisplay: "0", args: [[1, 2, 3], 100], expectedValue: 0 },
    ],
    hidden: [
      { id: "h1", description: "Negative numbers involved", inputDisplay: "nums=[1,-1,0], k=0", expectedDisplay: "3", args: [[1, -1, 0], 0], expectedValue: 3 },
      { id: "h2", description: "Whole array matches", inputDisplay: "nums=[3], k=3", expectedDisplay: "1", args: [[3], 3], expectedValue: 1 },
      { id: "h3", description: "Repeated zeroes", inputDisplay: "nums=[0,0,0], k=0", expectedDisplay: "6", args: [[0, 0, 0], 0], expectedValue: 6 },
    ],
  },
  // src/learning/content/binarySearchModule.ts — codeLab
  "binary-search-4": {
    functionName: "binarySearch",
    paramTypes: ["int[]", "int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Target present", inputDisplay: "nums=[-1,0,3,5,9,12], target=9", expectedDisplay: "4", args: [[-1, 0, 3, 5, 9, 12], 9], expectedValue: 4 },
      { id: "v2", description: "Target absent", inputDisplay: "nums=[-1,0,3,5,9,12], target=2", expectedDisplay: "-1", args: [[-1, 0, 3, 5, 9, 12], 2], expectedValue: -1 },
      { id: "v3", description: "Single element, found", inputDisplay: "nums=[5], target=5", expectedDisplay: "0", args: [[5], 5], expectedValue: 0 },
    ],
    hidden: [
      { id: "h1", description: "Target at start", inputDisplay: "nums=[1,2,3,4,5], target=1", expectedDisplay: "0", args: [[1, 2, 3, 4, 5], 1], expectedValue: 0 },
      { id: "h2", description: "Target at end", inputDisplay: "nums=[1,2,3,4,5], target=5", expectedDisplay: "4", args: [[1, 2, 3, 4, 5], 5], expectedValue: 4 },
      { id: "h3", description: "Empty array", inputDisplay: "nums=[], target=1", expectedDisplay: "-1", args: [[], 1], expectedValue: -1 },
    ],
  },
  // src/learning/content/binarySearchModule.ts — mastery
  "binary-search-5": {
    functionName: "searchRotated",
    paramTypes: ["int[]", "int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Target in right half", inputDisplay: "nums=[4,5,6,7,0,1,2], target=0", expectedDisplay: "4", args: [[4, 5, 6, 7, 0, 1, 2], 0], expectedValue: 4 },
      { id: "v2", description: "Target absent", inputDisplay: "nums=[4,5,6,7,0,1,2], target=3", expectedDisplay: "-1", args: [[4, 5, 6, 7, 0, 1, 2], 3], expectedValue: -1 },
      { id: "v3", description: "No rotation", inputDisplay: "nums=[1,2,3,4,5], target=3", expectedDisplay: "2", args: [[1, 2, 3, 4, 5], 3], expectedValue: 2 },
    ],
    hidden: [
      { id: "h1", description: "Single element, found", inputDisplay: "nums=[1], target=1", expectedDisplay: "0", args: [[1], 1], expectedValue: 0 },
      { id: "h2", description: "Target at pivot", inputDisplay: "nums=[6,7,0,1,2,4,5], target=0", expectedDisplay: "2", args: [[6, 7, 0, 1, 2, 4, 5], 0], expectedValue: 2 },
      { id: "h3", description: "Single element, absent", inputDisplay: "nums=[1], target=0", expectedDisplay: "-1", args: [[1], 0], expectedValue: -1 },
    ],
  },
  // src/learning/content/recursionModule.ts — codeLab
  "recursion-4": {
    functionName: "sumOfDigits",
    paramTypes: ["int"],
    returnType: "int",
    visible: [
      { id: "v1", description: "Multi-digit number", inputDisplay: "n=1234", expectedDisplay: "10", args: [1234], expectedValue: 10 },
      { id: "v2", description: "Single digit", inputDisplay: "n=7", expectedDisplay: "7", args: [7], expectedValue: 7 },
      { id: "v3", description: "Number with a zero digit", inputDisplay: "n=105", expectedDisplay: "6", args: [105], expectedValue: 6 },
    ],
    hidden: [
      { id: "h1", description: "Large number", inputDisplay: "n=987654321", expectedDisplay: "45", args: [987654321], expectedValue: 45 },
      { id: "h2", description: "All same digit", inputDisplay: "n=1111", expectedDisplay: "4", args: [1111], expectedValue: 4 },
      { id: "h3", description: "n is zero", inputDisplay: "n=0", expectedDisplay: "0", args: [0], expectedValue: 0 },
    ],
  },
  // src/learning/content/recursionModule.ts — mastery
  "recursion-5": {
    functionName: "power",
    paramTypes: ["int", "int"],
    returnType: "long",
    visible: [
      { id: "v1", description: "Typical case", inputDisplay: "base=2, exp=5", expectedDisplay: "32", args: [2, 5], expectedValue: 32 },
      { id: "v2", description: "Exponent of zero", inputDisplay: "base=7, exp=0", expectedDisplay: "1", args: [7, 0], expectedValue: 1 },
      { id: "v3", description: "Base of one", inputDisplay: "base=1, exp=10", expectedDisplay: "1", args: [1, 10], expectedValue: 1 },
    ],
    hidden: [
      { id: "h1", description: "Negative base", inputDisplay: "base=-2, exp=3", expectedDisplay: "-8", args: [-2, 3], expectedValue: -8 },
      { id: "h2", description: "Larger exponent", inputDisplay: "base=3, exp=4", expectedDisplay: "81", args: [3, 4], expectedValue: 81 },
      { id: "h3", description: "Both zero", inputDisplay: "base=0, exp=0", expectedDisplay: "1", args: [0, 0], expectedValue: 1 },
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

// Shared double-quoted string literal for fixture strings, valid across
// Python/C++/Java for the plain-ASCII curriculum test strings used here
// (JSON's \\, \", \n, \t, \r, \uXXXX escapes are recognized identically by
// all three languages' double-quoted literal grammars). Fixture strings are
// curriculum-owned (not user input), but this is implemented correctly
// regardless.
function stringLiteral(value) {
  return JSON.stringify(value)
}

function pyArgExpr(type, value) {
  if (type === "int") return String(value)
  if (type === "int[]") return `[${value.join(", ")}]`
  if (type === "string") return stringLiteral(value)
  throw new Error(`unsupported Family-A paramType for python: ${type}`)
}

function cppDecl(type, varName, value) {
  if (type === "int") return `int ${varName} = ${value};`
  if (type === "int[]") return `vector<int> ${varName} = {${value.join(", ")}};`
  if (type === "string") return `string ${varName} = ${stringLiteral(value)};`
  throw new Error(`unsupported Family-A paramType for cpp: ${type}`)
}

function javaDecl(type, varName, value) {
  if (type === "int") return `int ${varName} = ${value};`
  if (type === "int[]") return `int[] ${varName} = {${value.join(", ")}};`
  if (type === "string") return `String ${varName} = ${stringLiteral(value)};`
  throw new Error(`unsupported Family-A paramType for java: ${type}`)
}

/** One generic scalar/bool-return harness path for all Family A activities
 * (int[]/int/string params in any combination, int/long/bool return) — the
 * gateway knows functionName/paramTypes/returnType per activity; the
 * browser only ever sends activityId/language/source/mode. */
function buildPythonSource(activity, learnerCode, cases) {
  const driverLines = cases
    .map((c, i) => {
      const argExprs = activity.paramTypes.map((t, idx) => pyArgExpr(t, c.args[idx])).join(", ")
      const call = `${activity.functionName}(${argExprs})`
      const resultExpr = activity.returnType === "bool" ? `("true" if (${call}) else "false")` : `str(${call})`
      return `    try:\n        print("${CASE_MARKER}${i}\\t" + ${resultExpr})\n    except Exception as __reagvis_e:\n        print("__REAGVIS_ERROR__${i}\\t" + str(__reagvis_e))`
    })
    .join("\n")
  return `${learnerCode.replace(/\s+$/, "")}\n\ndef __reagvis_run_cases():\n${driverLines}\n\n__reagvis_run_cases()\n`
}

function buildCppSource(activity, learnerCode, cases) {
  const caseBlocks = cases
    .map((c, i) => {
      const paramNames = activity.paramTypes.map((_, idx) => `p${idx}`)
      const decls = activity.paramTypes.map((t, idx) => "        " + cppDecl(t, paramNames[idx], c.args[idx])).join("\n")
      const call = `${activity.functionName}(${paramNames.join(", ")})`
      return `    {\n${decls}\n        cout << "${CASE_MARKER}${i}" << "\\t" << (${call}) << "\\n";\n    }`
    })
    .join("\n")
  // Targeted includes rather than <bits/stdc++.h>: the umbrella header measured
  // 10s+ wall-clock compiles in this Docker/WSL2 environment (I/O bound, not
  // CPU bound — cpu_time stayed under 1s while wall_time hit the compile
  // timeout), which would misreport as a compile_error. This set covers
  // every container/algorithm header any current Family A demoSolution uses
  // (unordered_set/unordered_map for hashing-4/foundations-5/sliding-window-5/
  // prefix-sum-4, algorithm for min/max in arrays-strings-5/two-pointers-5,
  // cctype for isalnum/tolower in two-pointers-4) while staying far lighter
  // than <bits/stdc++.h>.
  const includes =
    "#include <iostream>\n#include <vector>\n#include <string>\n#include <unordered_set>\n#include <unordered_map>\n#include <algorithm>\n#include <cctype>\nusing namespace std;\n\n"
  // boolalpha prints "true"/"false" instead of 1/0 — set once, persists for
  // the whole stream regardless of the per-case { } scoping below.
  const boolalphaLine = activity.returnType === "bool" ? "    cout << boolalpha;\n" : ""
  return `${includes}${learnerCode.trim()}\n\nint main() {\n${boolalphaLine}${caseBlocks}\n    return 0;\n}\n`
}

function buildJavaSource(activity, learnerCode, cases) {
  const caseBlocks = cases
    .map((c, i) => {
      const paramNames = activity.paramTypes.map((_, idx) => `p${idx}`)
      const decls = activity.paramTypes.map((t, idx) => "            " + javaDecl(t, paramNames[idx], c.args[idx])).join("\n")
      const call = `${activity.functionName}(${paramNames.join(", ")})`
      // Java's string concatenation calls String.valueOf on a boolean/long/int
      // result automatically (lowercase true/false for booleans) — no extra
      // formatting needed.
      return `        {\n${decls}\n            System.out.println("${CASE_MARKER}${i}" + "\\t" + (${call}));\n        }`
    })
    .join("\n")
  return [
    "import java.util.*;",
    "",
    "public class Main {",
    `    static ${learnerCode.trim()}`,
    "",
    "    public static void main(String[] args) {",
    caseBlocks,
    "    }",
    "}",
    "",
  ].join("\n")
}

function buildHarnessSource(activity, language, learnerCode, cases) {
  if (language === "python") return buildPythonSource(activity, learnerCode, cases)
  if (language === "cpp") return buildCppSource(activity, learnerCode, cases)
  if (language === "java") return buildJavaSource(activity, learnerCode, cases)
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
  const activity = ACTIVITIES[activityId]
  const cases = activity[testSet]
  const source = buildHarnessSource(activity, language, code, cases)
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
    // Boolean results compare as normalized "true"/"false" text (Python's
    // driver already emits lowercase — see buildPythonSource — and C++/Java
    // natively print lowercase true/false); numeric (int/long) results
    // compare as JS numbers, never as fragile formatted-string equality.
    const passed =
      !!p &&
      p.ok &&
      (activity.returnType === "bool" ? p.value === (c.expectedValue ? "true" : "false") : Number(p.value) === c.expectedValue)
    return {
      id: c.id,
      description: c.description,
      status: passed ? "passed" : "failed",
      input: c.inputDisplay,
      expected: c.expectedDisplay,
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
