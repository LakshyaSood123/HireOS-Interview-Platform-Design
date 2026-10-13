// Generates deployment/RELEASE_MANIFEST.json: every file that differs from the committed HEAD (modified or untracked),
// classified so an engineer can see exactly what must be committed for the Course + CMS pilot release.
//
//   node deployment/generate-release-manifest.mjs
//
// Read-only: it only runs `git status`/`git rev-parse`. It does NOT stage or commit anything. Review the result,
// then stage the listed paths explicitly (never `git add .` / `git add -A`).
import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const rules = [
  // [group, required?, regex]
  ["EXCLUDE: local/QA/backup artifacts", false, /^(\.codex-backups|\.codex-screenshots|\.safety_backups)\/|\.bak$|^reagvis-.*\.png$|^deployment\/backups\/|\.archive\.gz|^\.tmp-/],
  ["EXCLUDE: generated, rebuildable", false, /^seed\/ml\/(animations-module\d+-built|module\d+-zips|module1-zips)\//],
  ["CORE BACKEND", true, /^backend\/(src|package\.json|package-lock\.json|tsconfig\.json|\.env\.example|\.env\.production\.example)/],
  ["BACKEND SCRIPTS (attach/finalize/release/ops)", true, /^backend\/scripts\//],
  ["TESTS", true, /^(backend\/tests|src\/learning\/(__tests__|__fixtures__))\//],
  ["ML CONTENT (curriculum source)", true, /^backend\/seed\//],
  ["ANIMATION SOURCE + GENERATORS", true, /^seed\//],
  ["FRONTEND", true, /^(src\/|index\.html|vite\.config\.ts|package\.json|pnpm-lock\.yaml|tsconfig\.json|\.env\.production\.example)/],
  ["DEPLOYMENT / BOOTSTRAP", true, /^deployment\//],
  ["DOCUMENTATION", true, /^(docs\/|README\.md|backend\/README\.md|[A-Z_]+\.md$)/],
  ["GITIGNORE / REPO CONFIG", true, /^\.git(ignore|attributes)$/],
];

function classify(file) {
  for (const [group, required, re] of rules) if (re.test(file)) return { group, required };
  return { group: "REVIEW MANUALLY (unclassified)", required: false };
}

const lines = git("status", "--porcelain=v1", "--untracked-files=all").split("\n").filter(Boolean);
const entries = lines.map((l) => {
  const code = l.slice(0, 2);
  const file = l.slice(3).replace(/^"|"$/g, "");
  const state = code.includes("?") ? "UNTRACKED" : code.includes("D") ? "DELETED" : "TRACKED MODIFIED";
  return { file, state, ...classify(file) };
});

const groups = {};
for (const e of entries) (groups[e.group] ??= []).push(e);
const summary = Object.fromEntries(Object.entries(groups).map(([g, list]) => [g, {
  files: list.length,
  untracked: list.filter((e) => e.state === "UNTRACKED").length,
  modified: list.filter((e) => e.state === "TRACKED MODIFIED").length,
  requiredForRelease: list[0].required,
}]));

// Exact per-file paths (no directory collapsing, so excluded/generated files can never be swept in by a broad `git add <dir>`).
const stage = {};
for (const [g, list] of Object.entries(groups)) if (list[0].required) stage[g] = list.map((e) => e.file).sort();

const manifest = {
  generatedAt: new Date().toISOString(),
  branch: git("branch", "--show-current").trim(),
  head: git("rev-parse", "HEAD").trim(),
  note: "Review, then stage the listed paths explicitly. Never use `git add .` or `git add -A`. Excluded groups must not be committed.",
  summary,
  stageExplicitly: stage,
  files: entries,
};
writeFileSync(path.join(root, "deployment", "RELEASE_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`branch ${manifest.branch} head ${manifest.head.slice(0, 7)}: ${entries.length} changed files`);
for (const [g, s] of Object.entries(summary)) console.log(`${g.padEnd(52)} files ${String(s.files).padStart(4)} (untracked ${s.untracked}, modified ${s.modified}) ${s.requiredForRelease ? "REQUIRED" : "exclude/review"}`);
