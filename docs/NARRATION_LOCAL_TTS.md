# Animation narration: local, offline text-to-speech

Each animation step's explanation can be spoken. The audio is generated **once**, by an admin, on a machine with a local
text-to-speech engine, stored **inside the animation package revision**, frozen when the curriculum is published, and played
by learners. There is no TTS API, no API key, no per-view generation and no network request to any speech service.

```
CMS explanation ──▶ local Kokoro-82M ──▶ MP3 in the package revision ──▶ frozen on publish ──▶ learner plays stored audio
   (source of truth)   (admin generates)      (narration.json + audio/)                          (no TTS server needed)
```

The visible explanation stays the single source of truth. Narration is derived from it and marked STALE when the explanation
changes (`sourceTextHash`). Nothing in a package is ever a second hand-written "script".

## Engine

| | |
|---|---|
| Model | **Kokoro-82M** (`hexgrad/Kokoro-82M`), 82 M parameters, ~327 MB weights (~340 MB with English voices) |
| Model / weights licence | **Apache-2.0** (model card `license: apache-2.0`, "Apache-licensed weights"). Commercial use permitted |
| Code licence | `kokoro` (inference library) and `misaki` (G2P): **Apache-2.0** |
| Other runtime | PyTorch (BSD-style), spaCy and `en_core_web_sm` (MIT), `soundfile` / libsndfile (LGPL, used for MP3 encoding), espeak-ng data via misaki (GPL-3 data used only as a phonemiser fallback, never redistributed by us) |
| Python | 3.10 to 3.12 (`kokoro` declares `<3.13`); setup creates a private 3.12 virtualenv with `uv` |
| Native output | 24 kHz, mono, 16-bit PCM; encoded to **MP3, constant ~48 kbit/s** by default (`NARRATION_LOCAL_FORMAT=wav` keeps PCM) |
| Where it lives | `backend/.models/kokoro/` (**gitignored**: the virtualenv, dominated by PyTorch, plus ~340 MB of model files) |

> Dependency licence notes are informational, not legal advice. Review them before a commercial launch. Nothing under
> `backend/.models/` is committed or redistributed.

## Runtime architecture

A **persistent Python worker** (`backend/tools/local-tts/kokoro_worker.py`) is spawned lazily the first time an admin generates
narration, loads the model once, then serves every step. The Node backend talks to it with **newline-delimited JSON over
stdin/stdout**: no socket, no port, nothing for a browser or another machine to connect to. The worker:

- forces the Hugging Face hub **offline** and **refuses every non-loopback network connection** (so generation makes zero
  external calls; `npm run narration:check` reports `outbound network blocked: true`);
- keeps stdout for the protocol only (library chatter goes to stderr);
- is restarted automatically after a crash, killed after a request timeout, and stopped after 5 minutes of inactivity;
- seeds the model's noise per request from the text, voice and speed, so the same input produces the same audio.

Provider code: `backend/src/modules/cms/narration/providers/localKokoro.provider.ts` (`LocalKokoroNarrationProvider`,
provider id `local-kokoro`). The CMS and learner code only see the generic `NarrationProvider` interface.

## Setup (one time, on a machine that generates narration)

```
cd backend
npm run narration:setup     # Python 3.12 venv, CPU PyTorch, kokoro, spaCy model, pinned model download, then verify
npm run narration:check     # verify only; prints READY / NOT READY and why
```

Setup needs the internet **once** (PyPI, PyTorch, GitHub releases, Hugging Face). The model download is pinned to upstream
commit `f3ff3571791e39611d31c381e3a41a3af07b4987` and is retried because some networks reset long downloads. Normal backend
start-up never downloads anything.

## Configuration

```
NARRATION_PROVIDER=local-kokoro          # none (production default) | local-kokoro | dev (development only)
NARRATION_DEFAULT_VOICE=af_heart         # Kokoro voice id; the approved voice
NARRATION_LOCAL_MODEL_PATH=              # default backend/.models/kokoro/model
NARRATION_LOCAL_PYTHON=                  # default backend/.models/kokoro/venv python
NARRATION_LOCAL_DEVICE=cpu               # cpu | cuda | auto
NARRATION_LOCAL_FORMAT=mp3               # mp3 | wav
NARRATION_REQUEST_TIMEOUT_MS=60000
```

No credential exists anywhere. If the engine is selected but not installed, the CMS panel shows "Local narration engine
unavailable: ..." and generation is refused with the same message; nothing crashes and learner playback is unaffected.

The generation hash includes the provider id, model revision, default voice, output format, the step's voice, language and speed.
Changing any of them makes existing narration regenerable.

## Two deployment modes

**MODE A: pilot / static narration (recommended for the first external pilot).**
All narration is generated before deployment on a development machine, reviewed by a human, published with the curriculum and
deployed as ordinary package content. The production server does **not** need Python or the model. Leave `NARRATION_PROVIDER`
unset (it is `none` in production): the CMS "Generate" buttons report that generation is unavailable, and learners play the audio.

**MODE B: full CMS narration generation in production.**
The CMS server also has the local engine (`npm run narration:setup`) and `NARRATION_PROVIDER=local-kokoro`, so admins can
regenerate narration after deployment. Needs disk for the virtualenv and model; no GPU required (measured on a laptop CPU: roughly 4 to 6 times
faster than real time, about 2 to 3.5 s per step, with a one-off ~5.5 s model load).

## Safety

- Generation is **admin-only** (`requireRole("admin")`); learners get 403 on every narration route.
- The browser never contacts the worker: it has no port. Provider settings never reach the frontend.
- Learner playback needs only the audio already inside the published package.
- AI-generated speech should be disclosed to learners as such.

## Human review is required before the course-wide run

Automated checks prove the files are valid, audible and correctly timed. They cannot judge naturalness, pronunciation of ML
terms ("MLE", "MAP", "PCA", "eigenvector", "F1", ...) or numbers ("0.8", "97.2%"). Voice comparison files are written to
`backend/.narration-qa/voice-comparison/` (gitignored) by `scripts/compareNarrationVoices.ts` for a person to listen to. Do not
add pronunciation rewrites until the real audio shows a problem; if needed they must be deterministic, separate from the visible
text, and included in the generation hash.

## The narrated release (v19)

The narration-complete Machine Learning Foundations curriculum was published as **v19** (v18 is kept, unchanged and readable).
All 980 steps have approved af_heart narration (3.08 hours, 63.4 MB of MP3), frozen inside the 115 package revisions.

- Release export (not in Git, about 91 MB, audio is inside the package JSON): `deployment/releases/ml-v19-narrated/`, produced by
  `backend/scripts/exportCourseRelease.ts --course=machine-learning-foundations --version=v19`. Import it into a fresh database with
  `backend/scripts/importCourseRelease.ts --in=<dir>` and check it with `backend/scripts/verifyCourseRelease.ts`. Keep a copy off this
  machine, like the database backups. The committed `deployment/course-bootstrap/` is still the small v18 bootstrap.
- Audit a draft: `npx tsx scripts/verifyCourseNarration.ts` (structure, identity, MP3 validity, silence, storage, timing).
- Publish and repin: `npx tsx scripts/releaseNarratedCourse.ts --phase=preflight|publish|verify|repin`.
- Prove a copy is exact: `scripts/compareNarrationDrafts.ts` and `scripts/digestRelease.ts`.
