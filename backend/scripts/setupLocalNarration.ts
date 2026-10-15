/**
 * One-time setup (and health check) of the LOCAL, OFFLINE narration engine: Kokoro-82M (Apache-2.0).
 *
 *   npm run narration:setup            install the Python runtime + download the model, then verify (prints READY)
 *   npm run narration:check            verify only, change nothing (prints READY / NOT READY and why)
 *
 * What it creates (all gitignored, under backend/.models/kokoro/): a Python 3.12 virtualenv (via `uv`), CPU PyTorch, the
 * `kokoro` + `soundfile` packages, the spaCy English model used for text-to-phoneme conversion, and the pinned model files
 * (~340 MB). Needs the internet ONCE (PyPI, PyTorch, GitHub releases, Hugging Face). Normal backend start-up never downloads
 * anything, and narration generation afterwards makes zero external network calls.
 *
 * Only a machine that GENERATES narration needs this. Learners play the stored audio and need none of it.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { KOKORO_UPSTREAM_REVISION, LocalKokoroNarrationProvider, checkLocalKokoroReadiness } from "../src/modules/cms/narration/providers/localKokoro.provider.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, "..");
const root = path.join(backend, ".models", "kokoro");
const venv = path.join(root, "venv");
const python = path.join(venv, process.platform === "win32" ? path.join("Scripts", "python.exe") : path.join("bin", "python"));
const modelDir = path.join(root, "model");
const SPACY_MODEL = "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl";

function run(label: string, file: string, args: string[]): void {
  console.log(`\n==> ${label}`);
  const result = spawnSync(file, args, { stdio: "inherit", cwd: backend });
  if (result.status !== 0) throw new Error(`${label} failed (exit ${result.status ?? "none"})`);
}

/** Finds a way to run `uv` (the Python toolchain manager): a `uv` on PATH, else `python -m uv` (installed with pip --user if needed). */
function uvCommand(): { file: string; prefix: string[] } {
  for (const candidate of [{ file: "uv", prefix: [] as string[] }, { file: "python", prefix: ["-m", "uv"] }, { file: "python3", prefix: ["-m", "uv"] }]) {
    if (spawnSync(candidate.file, [...candidate.prefix, "--version"], { stdio: "ignore" }).status === 0) return candidate;
  }
  for (const py of ["python", "python3"]) {
    if (spawnSync(py, ["--version"], { stdio: "ignore" }).status !== 0) continue;
    console.log("\n==> installing uv (Python toolchain manager) for the current user");
    if (spawnSync(py, ["-m", "pip", "install", "--user", "uv"], { stdio: "inherit" }).status === 0) return { file: py, prefix: ["-m", "uv"] };
  }
  throw new Error("Python is required to install the local narration engine (need `python` or `uv` on PATH).");
}

async function verify(): Promise<boolean> {
  const readiness = checkLocalKokoroReadiness();
  if (!readiness.ready) {
    console.log(`\nNOT READY: ${readiness.problem}`);
    return false;
  }
  const provider = new LocalKokoroNarrationProvider();
  try {
    const health = await provider.health();
    if (!health.ready) {
      console.log(`\nNOT READY: ${health.problem}`);
      return false;
    }
    const d = health.details ?? {};
    console.log(`\nREADY: Kokoro-82M on ${String(d.device)} (python ${String(d.python)}, torch ${String(d.torch)}), model load ${String(d.loadMs)} ms, ${(d.voices as string[]).length} voices, outbound network blocked: ${String(d.networkBlocked)}`);
    return d.networkBlocked === true;
  } finally {
    provider.dispose();
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  if (!checkOnly) {
    mkdirSync(root, { recursive: true });
    const uv = uvCommand();
    const uvRun = (label: string, args: string[]) => run(label, uv.file, [...uv.prefix, ...args]);
    if (!existsSync(python)) uvRun("create a Python 3.12 virtualenv (Kokoro does not support 3.13 yet)", ["venv", venv, "--python", "3.12"]);
    uvRun("install CPU PyTorch", ["pip", "install", "--python", python, "torch==2.14.1", "--index-url", "https://download.pytorch.org/whl/cpu"]);
    // `docopt` (a dependency of num2words, itself a dependency of kokoro) only ships a source archive that fails to build in isolation.
    uvRun("install build helpers", ["pip", "install", "--python", python, "wheel", "setuptools<70"]);
    uvRun("install docopt", ["pip", "install", "--python", python, "--no-build-isolation", "docopt"]);
    uvRun("install kokoro + soundfile", ["pip", "install", "--python", python, "kokoro==0.9.4", "soundfile"]);
    uvRun("install the spaCy English model", ["pip", "install", "--python", python, SPACY_MODEL]);
    run("download Kokoro-82M (pinned upstream revision)", python, [path.join(backend, "tools", "local-tts", "download_model.py"), modelDir, KOKORO_UPSTREAM_REVISION]);
  }
  const ok = await verify();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
