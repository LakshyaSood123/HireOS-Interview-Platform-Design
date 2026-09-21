# Keshav's_Day-Wise_Checkpoints

---

## Progress at a glance

| Day | Theme | Status |
|---|---|---|
| **0** | Planning, baseline, approval | ✅ **Done** |
| **1** | Server skeleton + auth | ✅ **Done** |
| **2** | Progress, XP, lives, streak | ✅ **Done** |
| 3 | Notes + frontend adapters | ▶ **Next** |
| 4 | Code execution via Piston | ⬜ Not started |
| 5 | Interview handoff + recommendations | ⬜ Not started |
| 6 | Analytics + security pass | ⬜ Not started |
| 7 | Tests, docs, demo data | ⬜ Not started |

Legend: ✅ done · ▶ in progress · ⬜ not started

---

## Day 0 — Planning, baseline and approval ✅

**Goal:** agree on the architecture and lock the exact commit the backend is built against, so no
integration work is wasted on a stale baseline.

### Checkpoints

| # | Checkpoint | Status |
|---|---|---|
| 0.1 | Architecture chosen: MongoDB Atlas + Node/Express + TypeScript + Mongoose + Zod | ✅ |
| 0.2 | Separation of concerns agreed — frontend keeps content, backend owns state | ✅ |
| 0.3 | Data model designed — 12 collections | ✅ |
| 0.4 | API contract written — 25 endpoints, `openapi.yaml` | ✅ |
| 0.5 | Twelve pre-coding questions answered | ✅ |
| 0.6 | Repo rebased onto the final handoff SHA `99e1d72` | ✅ |
| 0.7 | Documents revised: baseline, Piston, languages, hidden tests | ✅ |

### What changed at Day 0 (and why it mattered)

| Assumption in the first draft | Corrected to | Why |
|---|---|---|
| Baseline `frontend/dsa-complete-29-modules @ 6f3ac43` | `frontend/dsa-world-v2 @ 99e1d72` | The old baseline predates the Piston work and the lesson-workspace redesign |
| Branch `backend/keshav-local` | `backend/keshav-current-baseline` | Old branch deleted to stop anyone building on a stale tree |
| Build a temporary `local-gcc` runner | **Dropped** — use the existing Piston service | Running learner code on the host without container isolation is unsafe and now unnecessary |
| Languages `c \| cpp` | `python \| cpp \| java` | Matches what Piston actually executes today |
| Compiler is a "Later" item after handover | **Complete.** Piston already executes for real; Day 4 just calls it | 14 activities real-enabled, 84/84 execution QA pass. No "Later" row remains |
| Judge with frontend-bundled `hiddenTests` | Server-side `judgeFixtures` collection | Bundled tests ship to the browser, so they are not secret |
| One large merge at the end | Smaller reviewable PRs | Avoids a painful conflict with ongoing frontend work |

### Verification ✅

- `git log -1` on `backend/keshav-current-baseline` → `99e1d72`.
- `99e1d72` confirmed as `4a163e5` + the lesson-workspace redesign commit.
- No stale `6f3ac43`, `keshav-local` or `local-gcc` reference survives in `docs/` except where
  explicitly labelled superseded.
- All six documents cross-reference the same baseline, the same language list and the same
  two-provider execution model.

---

## Day 1 — Server skeleton and authentication ✅

**Goal:** a clean machine can clone the repo, follow the README, and reach a running authenticated
API backed by Atlas.

The backend lives in [`backend/`](../backend), a self-contained npm workspace — the repository root
`src/` is the frontend Vite app, so plan §5's layout sits under `backend/src/`.

### Checkpoints

| # | Checkpoint | Done when | Status |
|---|---|---|---|
| 1.1 | Project scaffold — TypeScript, Express 5, folder layout from plan §5 | `npm run dev` boots on `PORT` (default **4883**) | ✅ |
| 1.2 | `config/env.ts` — every environment variable validated by Zod at boot, `PORT` defaulting to 4883 | A missing `MONGO_URI` fails loudly at startup, not on first request | ✅ |
| 1.3 | `db/connect.ts` — Atlas connection + index creation on boot | Logs `db: connected` | ✅ |
| 1.4 | Middleware — `requestId`, `errorHandler`, `validate(zod)`, `rateLimit`, pino logging | Every response carries `meta.requestId`; every error uses the `{ error }` envelope | ✅ |
| 1.5 | `GET /health` | Returns `{ status, db, uptimeSeconds }` | ✅ |
| 1.6 | `users` + `refreshTokens` models with indexes | `email` unique; TTL index on `expiresAt` | ✅ |
| 1.7 | `POST /auth/register` — bcrypt, duplicate email → 409 | | ✅ |
| 1.8 | `POST /auth/login` — access (~15 min) + refresh token | | ✅ |
| 1.9 | `POST /auth/refresh` — rotates the refresh token | The old refresh token stops working | ✅ |
| 1.10 | `POST /auth/logout` — revokes the refresh token | | ✅ |
| 1.11 | `GET /users/me` — identity from the verified token only | | ✅ |
| 1.12 | Swagger served at `/api/v1/docs` | | ✅ |
| 1.13 | `README.md` + `.env.example` (placeholders only) | | ✅ |

### Verification

```bash
cd backend
cp .env.example .env     # fill in MONGO_URI and the two JWT secrets
npm install && npm run dev
curl localhost:4883/api/v1/health
# → { "data": { "status": "ok", "db": "connected", ... } }
```

The whole flow below is asserted by `backend/scripts/verify-day1.sh`, which runs against a live
server and checks every "Passes when" line:

```bash
npm run verify:day1      # 47 checks — register → login → me → refresh → logout
```

```bash
# the same flow by hand
curl -X POST localhost:4883/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"correct-horse-battery","displayName":"Demo"}'

curl -X POST localhost:4883/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"correct-horse-battery"}'

curl localhost:4883/api/v1/users/me -H "authorization: Bearer $ACCESS"
```

**Passes when:** ✅ all verified — 47/47 on 20 Sep 2026.

- A wrong password returns `401`, never a hint about which field was wrong. ✅ Both a wrong password
  and an unknown email return the same `"Invalid email or password."`, and an unknown email is
  compared against a throwaway hash so the two take the same time.
- A second register with the same email returns `409`. ✅ `EMAIL_ALREADY_REGISTERED`, enforced by
  the unique index rather than a read-then-write.
- `GET /users/me` with no token, an expired token or a tampered token returns `401`. ✅ A refresh
  token presented as an access token is also rejected.
- A refresh token cannot be reused after rotation or after logout. ✅ Rotation revokes the presented
  token in the same atomic write that claims it; presenting an already-rotated token revokes every
  live session for that user.
- `passwordHash` never appears in any response or log line. ✅ `select: false` on the model, plus a
  redaction list in `shared/logger.ts`. Grepped the boot-to-shutdown log for the password, the
  hash prefix and the token prefix — none present.
- No secret is committed — `.env` is git-ignored, `.env.example` has placeholders only. ✅ The root
  `.gitignore` excludes `.env*`, so `backend/.gitignore` re-includes `.env.example` explicitly.

**Also done, beyond the checkpoint list:** refresh-token reuse detection, `x-request-id` request
and response header, CORS allowlist, helmet, a body-size cap, and the auth/general rate limits from
the contract.

**Contract drift fixed:** `openapi.yaml` gained `EMAIL_ALREADY_REGISTERED`, `PAYLOAD_TOO_LARGE` and
`INTERNAL_ERROR` in the error enum, and the real response codes for `/auth/refresh` and
`/auth/logout` — the codes the implementation actually returns.

**Carried to Day 7:** no automated tests yet (`npm test` passes with none). Day 7.2 owns the
Vitest + in-memory MongoDB suite; `verify-day1.sh` is the manual stand-in until then.

**Demo line:** "Register, log in, and the server knows who you are — from the token, never from the
request body."

**Demo script and a reviewer's manual verification walkthrough:**
[06-DAY-1-DEMO-AND-VERIFICATION.md](./06-DAY-1-DEMO-AND-VERIFICATION.md).

---

## Day 2 — Progress, XP, lives and streak ✅

**Goal:** durable learner state that the server, not the browser, is the authority on.

### Checkpoints

| # | Checkpoint | Done when | Status |
|---|---|---|---|
| 2.1 | `scripts/seedCurriculum.ts` — imports the frontend registry, writes ids/order/XP/prerequisites | 7 zones, 29 modules, 107 checkpoints, **no lesson text** | ✅ |
| 2.2 | `courseProgress` model shaped like `LearnerProgressState` | | ✅ |
| 2.3 | `rewardEvents` ledger with unique `{ userId, courseId, eventKey }` | | ✅ |
| 2.4 | `GET /me/courses/{id}/state` — derives locked/available/current/completed/mastered | Matches `progressEngine.ts` exactly | ✅ |
| 2.5 | `PUT /me/courses/{id}/active` | Rejects an unavailable target with 409 | ✅ |
| 2.6 | `POST /me/modules/{id}/start` — server-side prerequisite check | 409 lists the missing prerequisite ids | ✅ |
| 2.7 | `POST /me/checkpoints/{id}/complete` — ledger insert **before** XP, atomic | | ✅ |
| 2.8 | `POST /me/attempts` — quick-check / quiz records | | ✅ |
| 2.9 | Streak logic from `lastActivityDate` | | ✅ |

### Verification

```bash
cd backend
npm run seed:curriculum      # 7 zones · 29 modules · 107 checkpoints
npm run dev                  # terminal 1
npm run verify:day2          # terminal 2 — 67 checks
```

Three suites, because three different kinds of claim need three different kinds of proof:

| Command | What it proves | Result |
|---|---|---|
| `npm run verify:day2` | The API behaves — 67 assertions over two fresh accounts | 67/67 ✅ |
| `npm run verify:parity` | The backend derives what `progressEngine.ts` derives | 16,005 comparisons ✅ |
| `npm run verify:ledger` | Every point of XP in the database traces to the row that granted it | reconciles ✅ |

**Passes when:** ✅ all verified — 67/67 on 20 Sep 2026, against Atlas.

- **Idempotency:** calling complete on the same checkpoint 5× in a row awards XP exactly once.
  Calls 2–5 return `200` with `alreadyCompleted: true`, `xpAwarded: 0` and identical progress. ✅
  Asserted by comparing the whole `progress` object, not just the XP.
- **Concurrency:** 10 parallel complete calls for the same checkpoint → one reward, one ledger
  row. ✅ Exactly one of ten returns `alreadyCompleted: false`; XP moves 30 → 60 once. The guard
  is the unique `{ userId, courseId, eventKey }` index, written **before** the XP, not a
  read-then-write.
- **Locked stays locked:** `POST /me/modules/graphs/start` on a fresh account returns `409` with
  the missing prerequisites, even though the request bypasses the UI entirely. ✅
  `MODULE_LOCKED`, `missingPrerequisites: ["trees-5"]`, and a message a learner can act on. The
  same check guards `PUT …/active` and `complete`, so there is one lock rule behind three doors.
- **Review is free:** completing an already-completed checkpoint awards zero additional XP. ✅
- Derived states match `progressEngine.ts` for a fresh account, a mid-course account and a
  completed account. ✅ **Proved rather than argued:** `npm run verify:parity` loads the real
  frontend engine and the backend port, runs both over 49 progress snapshots — fresh, mid-course
  on both curriculum branches, completed, fully mastered, pointer-at-a-locked-checkpoint, and 40
  seeded-random ones — and compares every checkpoint state, module state, zone state, "what is
  next" answer and completion result. 16,005 comparisons, zero differences.

**Also done, beyond the checkpoint list:**

- `GET /me/modules/{id}/progress` — the roadmap-refresh endpoint from the contract, with
  per-checkpoint state, attempt count and completion time.
- `scripts/verifyEngineParity.ts` and `scripts/verifyLedger.ts`, above.
- The seeder refuses to write anything that is not structure: a field allowlist plus a 120-character
  cap on every string, so "no lesson text in the database" is enforced, not just intended. It also
  rejects a prerequisite graph with a dangling or self-referencing edge.
- `curriculumSnapshots` carries `structureHash`, `frontendCommit` and an `isActive` flag held by a
  unique partial index, so exactly one snapshot answers for a course and a rollback is a flag flip.
- `checkpointStats` and `moduleStats` are populated — attempts, first completion, module start and
  finish — which is what Day 5's recommendations and Day 6's analytics read.
- Completion runs inside a transaction on Atlas, and degrades to an un-wrapped write on a
  deployment that has no replica set (a developer's standalone `mongod`, or an in-memory test
  server), with a warning. The unique ledger key is the idempotency guard either way; the
  transaction only stops a half-applied write.

**Contract drift fixed:** `openapi.yaml` dropped `ALREADY_COMPLETED`, `COMPILE_ERROR` and
`EXECUTION_TIMEOUT` from the error-code enum — the contract has always said they are states inside
a 200, and `src/shared/errors.ts` has never had them. The learning endpoints gained their real
`400` / `401` / `404` responses, the `source` default, the rule that `moduleId` on `/me/attempts`
is accepted and ignored, and the real request rules for `PUT …/active`.

**Documentation corrected:** plan §4 said the three legacy modules (`graphs`, `dp`, `summit`) use
bare `"1"`–`"18"` checkpoint ids. At the handoff baseline they do not: `fullCurriculumModules`
supersedes the legacy TrailNode-derived build for all three, so **all 107 checkpoints** use
`<moduleId>-<n>`. The seeder reads whatever the registry says, so this was never a code problem —
but a stale id list in a planning document is how a Day 5 lookup table gets written wrong.

**One deliberate divergence from the frontend — the streak.** The rule is identical: same day
changes nothing, yesterday adds one, anything else resets to one. The arithmetic is not.
`progressEngine.recordActivity` derives "yesterday" with `new Date(today)` and local-timezone
getters, so on the two days a year a DST zone falls back — a 25-hour local day — it names the wrong
date, breaking a real streak and continuing a broken one. The server is the authority on the streak
now, so it does the arithmetic in UTC, where every day is 24 hours. `verify:parity` sweeps 3,288
date pairs across a three-year window, confirms the backend is right on all of them, and prints the
six the frontend would have answered differently. No frontend change is needed: the browser stops
computing the streak once Day 3's adapter lands.

**Carried to Day 7:** still no automated tests (`npm test` passes with none). Day 7.2 owns the
Vitest + in-memory MongoDB suite; `verify-day2.sh`, `verify:parity` and `verify:ledger` are the
stand-in until then, and the last two need no server at all.

**Demo line:** "Double-click Complete ten times. XP goes up once. Call the API directly to unlock
Graphs — the server says no."

**Demo script and a reviewer's manual verification walkthrough:**
[07-DAY-2-DEMO-AND-VERIFICATION.md](./07-DAY-2-DEMO-AND-VERIFICATION.md).

---

## Day 3 — Notes and the frontend adapters

**Goal:** the frontend talks to the API instead of `localStorage`, and progress survives logout —
with no component touched.

### Checkpoints

| # | Checkpoint | Done when |
|---|---|---|
| 3.1 | `notes` model, unique `{ userId, courseId, lessonId }` | |
| 3.2 | `GET` / `PUT` / `DELETE /me/notes` — upsert by scope | |
| 3.3 | `ApiProgressRepository` implements the existing `ProgressRepository` | |
| 3.4 | `ApiNotesRepository` implements the existing `NotesRepository` | |
| 3.5 | localStorage import path — `migrateLegacyCheckpointIds()`, uploaded **only** if the server has no progress | Demo bootstrap data is never imported |
| 3.6 | Local repositories kept as the offline fallback | |

### Verification

**Passes when:**

- Log in, complete two checkpoints, write a note, log out, log in **in a different browser** — the
  same XP, the same progress and the same note come back.
- A returning user with existing localStorage progress keeps it; it uploads once and then the
  server is authoritative.
- A user who already has server progress does **not** have it overwritten by a stale local copy.
- **Zero component files changed.** `git diff --stat` on the frontend touches only the four
  adapter files.
- With the API stopped, the app still runs on the local fallback.

**Demo line:** "Same account, different laptop, same progress. And the UI diff is four files."

---

## Day 4 — Code execution through Piston

**Goal:** Run and Submit go through the backend to the real Piston service, and judging moves out
of the browser.

### Checkpoints

| # | Checkpoint | Done when |
|---|---|---|
| 4.1 | `CodeExecutionProvider` interface | |
| 4.2 | `MockExecutionProvider` — tests, offline, infrastructure fallback | |
| 4.3 | `PistonExecutionProvider` — real Python / C++ / Java | |
| 4.4 | `judgeFixtures` collection + `scripts/seedJudgeFixtures.ts` | Fixtures are **not** in the client bundle |
| 4.5 | `POST /code/run` — visible/sample tests only, never rewards | |
| 4.6 | `POST /code/submit` — server-side judging, stored, may complete | |
| 4.7 | `codeSubmissions` storage + `GET /me/submissions` | Runs are discarded; submits are kept |
| 4.8 | Rate limits and a 64 KB source cap | |
| 4.9 | `ApiCodeRunner` replaces `MockCodeRunner` | |

### Verification

**Passes when:**

| Scenario | Expected |
|---|---|
| Correct Python solution → Submit | `200 passed`, checkpoint completes, XP awarded once |
| Correct C++ solution → Submit | `200 passed` |
| Correct Java solution → Submit | `200 passed` |
| Wrong answer → Submit | `200 failed`, `livesDelta: -1` (floored at 0) |
| Syntax error → Submit | `200 compile-error`, `compileOutput` filled |
| Infinite loop → Submit | `200 timeout`, enforced by Piston |
| `language: "c"` | `400 VALIDATION_ERROR` |
| Correct solution → **Run** | `rewarded: false`, no XP, nothing stored |
| **Piston stopped** → Submit | `503 RUNNER_UNAVAILABLE` — no life lost, nothing stored, no fabricated pass |

- No hidden fixture `input` or `expected` appears in **any** response body. Verified by grepping
  the full response payloads for known fixture values.
- The coding UI is unchanged — no redesign, no new components.
- Automated tests run with `EXECUTION_PROVIDER=mock` and never reach Piston.

**Demo line:** "Real Python, C++ and Java. Kill the runner and it says the runner is down — it does
not pretend you failed, and it does not pretend you passed."

---

## Day 5 — Interview handoff and recommendations

**Goal:** an interview result turns into an explainable next step.

### Checkpoints

| # | Checkpoint | Done when |
|---|---|---|
| 5.1 | `interviewSessions` model | |
| 5.2 | `POST /interviews/handoff` — idempotent on `sourceSessionId` | |
| 5.3 | Weak-skill → module-id lookup table | Unknown labels stored as-is, produce no signal |
| 5.4 | Six deterministic recommendation rules in priority order | Each carries `reasonCode` + `reasonText` |
| 5.5 | `GET /me/recommendations` — computed per request, not stored | |
| 5.6 | `POST /me/recommendations/{key}/dismiss` — persists in `courseProgress` | |
| 5.7 | `ApiRecommendationProvider` | |
| 5.8 | `scripts/seedPractice.ts` — question metadata + company tags | |

### Verification

**Passes when:**

- An interview reporting weak Trees produces a Trees recommendation with a human-readable reason.
- Replaying the same `sourceSessionId` creates no duplicate session.
- A dismissed recommendation does not come back after logout and login.
- An unknown skill label is stored without crashing and generates no recommendation.
- Every recommendation is explainable — no rule fires without a `reasonCode`.

**Demo line:** "The interview said Trees were weak. The app opens on Trees, and it tells you why."

---

## Day 6 — Analytics and the security pass

**Goal:** the numbers exist, and nobody can read anyone else's data.

### Checkpoints

| # | Checkpoint | Done when |
|---|---|---|
| 6.1 | `GET /me/analytics/summary` | |
| 6.2 | `GET /me/activity` — paginated feed | |
| 6.3 | `GET /lesson-assets` — returns paths only, never files | |
| 6.4 | Authorization audit — every user-data query filters by `userId` from the token | |
| 6.5 | Rate limits tuned per endpoint group | |
| 6.6 | Security headers, CORS allowlist, body size caps | |
| 6.7 | Log scrub — no passwords, tokens or source code in logs | |

### Verification

**Cross-account test — the important one.** Create user A and user B, then with **A's token** try
to read B's progress, notes, submissions, attempts, interview sessions, recommendations and
activity. Every single one must return `404` or `403`. Never `200`.

Also passes when:

- A body-supplied `userId` is ignored everywhere — identity comes only from the token.
- No unbounded `find()` remains; every list endpoint is paginated.
- Rate limits return `429` with the standard error envelope.
- Grepping the logs for a known password or access token returns nothing.

**Demo line:** "User A cannot see one byte of user B — and we tried, endpoint by endpoint."

---

## Day 7 — Tests, documentation and demo data

**Goal:** someone else can run it, understand it, and demo it without asking a question.

### Checkpoints

| # | Checkpoint | Done when |
|---|---|---|
| 7.1 | End-to-end test: register → recommendation → module → note → submit → XP → logout → login | |
| 7.2 | Integration tests on in-memory MongoDB | Tests never touch Atlas |
| 7.3 | Fresh-database boot test | Empty database → seed → working app |
| 7.4 | `openapi.yaml` matches the implementation | Every endpoint, every error code |
| 7.5 | `scripts/seedDemoUser.ts` — a believable mid-course account | |
| 7.6 | README: setup, environment variables, commands, troubleshooting | |
| 7.7 | Bug-fix buffer | |

### Verification

```bash
npm test                       # all green
npm run seed && npm run dev    # from an empty database
```

**Passes when:**

- The full learner journey passes end to end, unattended.
- A teammate on a clean machine gets a running server from the README alone, with no verbal help.
- Swagger at `/api/v1/docs` matches real responses, including error shapes.
- The demo account opens on a sensible mid-course state.

**Demo line:** "Clean machine, empty database, two commands, working app."

---

## Definition of done (the whole project)

These are the acceptance criteria from the handoff. All must hold:

| # | Criterion |
|---|---|
| 1 | Login/logout restores the same progress and notes from MongoDB **on another device** |
| 2 | Server-side locks and idempotent rewards match the current frontend semantics |
| 3 | Real Run/Submit flows through backend → Piston **with no coding-UI redesign** |
| 4 | A successful Submit completes **once**; a failed Submit keeps current life behavior; Run never rewards |
| 5 | No visual regressions in Course Library, world, roadmaps or lesson workspace |
| 6 | Hidden judging fixtures are genuinely server-side |
| 7 | A runner outage is reported as an outage — never as a pass or a fail |

---

## Standing rules for every day

1. **Never build on a stale baseline.** Everything branches from `99e1d72`.
2. **Smaller reviewable PRs**, never one large merge at the end.
3. **Do not change frontend visuals or components** — lesson/coding UI, Course Library, world map,
   roadmaps, animations, Code Trace, curriculum text, starter solutions, global styling. Adapter
   changes only, coordinated.
4. **Do not change the Piston harness or gateway** without coordinating with the frontend owner.
5. **The backend never becomes a second curriculum.** Ids, order, XP and prerequisites only.
6. **Secrets stay out of the repo.** `MONGO_URI`, JWT keys and `PISTON_URL` live in `.env`.
