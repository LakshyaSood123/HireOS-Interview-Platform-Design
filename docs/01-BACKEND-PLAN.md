# Backend Integration — Plan

---

## 1. Baseline

| | |
|---|---|
| Frontend branch | `frontend/dsa-world-v2` |
| Handoff commit | `99e1d72cb20ec51384bbdb597f35d74870e7e300` — *"Redesign lesson workspace for desktop learning"* |
| Our branch | `backend/keshav-current-baseline`, branched from that commit |
| Merge | smaller reviewable pull requests back into the frontend branch, not one large merge at the end |

This is the **final handoff SHA** confirmed on 20 Sep 2026. It is the previously-quoted technical
reference `4a163e5` (*"Expand real Piston execution across Family A activities"*) plus the
lesson-workspace redesign that was still uncommitted when the handoff note was written.

The superseded baseline was `frontend/dsa-complete-29-modules @ 6f3ac43` on branch
`backend/keshav-local`. That branch is deleted; do not build against it.

Every id and interface in these documents was read from the frontend source, not from the
requirements PDF. Ids re-verified against `99e1d72`.

---

## 2. What changed from the original requirements document

| Original | Now | Why |
|---|---|---|
| FastAPI + Python | Node.js + Express | Same language as the frontend |
| PostgreSQL | MongoDB | Learner state is one document, not six joined tables |
| Pydantic | Zod | Same job — validate every request |
| SQLAlchemy + Alembic | Mongoose, no migration tool | v1 does not need versioned migrations |
| Lesson content may move to the DB | Stays in the frontend | A CMS is future scope |
| — | Lesson **image paths** stored in the DB | Paths and URLs only, never image files |
| Backend builds the sandbox | Self-hosted **Piston** service, already working | Frontend already ships real Python/C++/Java execution; backend calls it behind the server boundary |
| Temporary `local-gcc` runner | **Dropped** | Piston already does real compile + execution; a host child-process compiler is redundant and less safe |
| Languages `c` \| `cpp` | `python` \| `cpp` \| `java` | Matches what Piston actually runs today |
| Docker / Docker Compose | Plain `npm` commands + MongoDB Atlas | Nothing to install; containers are future scope |

Everything else from that document — curriculum rules, state semantics, security rules, the
acceptance flow — is unchanged.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Runtime / framework | Node.js 20, Express 5 |
| Language | TypeScript — lets backend types mirror `src/learning/types.ts` |
| Database | **MongoDB Atlas** (hosted, reached by `MONGO_URI`) with Mongoose |
| Validation | Zod on every body, param and query |
| Auth | JWT access token (~15 min) + refresh token, hashed and revocable in the DB |
| Passwords | bcrypt |
| Logging | pino, with a request id on every line |
| Code execution | Self-hosted **Piston** (`PISTON_URL`, `EXECUTION_PROVIDER=piston`) — Python, C++, Java |
| Docs | hand-written `openapi.yaml`, served at `/api/v1/docs` |
| Run | `npm run dev` on `PORT` (default **4883**) — no containers, no local database install |
| Tests | Vitest + Supertest + in-memory MongoDB (tests never touch Atlas) |

Nothing else gets added without a written reason.

**About the database.** One Atlas cluster, free tier to start, with a separate database name per
environment (`reagvis_dev`, `reagvis_test`, `reagvis_prod`) on the same cluster. That means:

- `MONGO_URI` is a **secret**. It lives in `.env`, never in the repo; `.env.example` carries a
  placeholder only.
- Atlas needs an IP allowlist entry (or `0.0.0.0/0` for a demo — with a strong password) for
  whoever is running the server.
- Automated tests run against in-memory MongoDB, so they never touch the cluster.
- Atlas clusters are replica sets, so **transactions are available** — see the note in the schema
  document about the completion write.
- The team can browse the data in the Atlas UI, which is useful while reviewing progress and XP.

Nothing in the code depends on Atlas specifically. If we later run MongoDB locally or in a
container, only `MONGO_URI` changes.

---

## 4. Canonical IDs

Read from the frontend registry. Display names are never used as keys.

- **Course:** `dsa-foundations`
- **Zones (7):** `basecamp`, `pattern-meadows`, `structure-woods`, `recursive-forest`,
  `graph-highlands`, `optimization-peaks`, `interview-summit`
- **Modules (29):** `foundations`, `arrays-strings`, `hashing`, `two-pointers`, `sliding-window`,
  `prefix-sum`, `binary-search`, `intervals`, `linked-structures`, `stack-queue`,
  `heap-priority-queue`, `trie`, `recursion`, `backtracking`, `trees`, `binary-search-trees`,
  `graphs`, `dfs-bfs`, `grid-graphs`, `topological-sort`, `union-find`, `greedy`, `dp`, `dp-2d`,
  `dp-patterns`, `mixed-pattern-recognition`, `timed-problems`, `company-missions`, `summit`
- **Checkpoints:** `<moduleId>-<n>` (e.g. `trees-3`) — **all 107 of them**
- A checkpoint **is** the lesson, so `lessonId === checkpointId`

Source files: `courseRegistry.ts`, `content/dsaSkeleton.ts`, `scripts/validateCurriculum.ts`.

**Corrected at Day 2.** This section previously said the three legacy modules (`graphs`, `dp`,
`summit`) keep bare `"1"`–`"18"` checkpoint ids. At the handoff baseline they do not:
`content/fullCurriculumModules.ts` supersedes the legacy TrailNode-derived build for all three, so
every checkpoint in the course uses `<moduleId>-<n>`. `scripts/seedCurriculum.ts` reads the
registry rather than any list in these documents, so nothing was built on the wrong ids — but a
stale id list here is how Day 5's weak-skill lookup table gets written wrong, so it is fixed at the
source.

---

## 5. Folder layout

The repository root `src/` is the frontend Vite app, so the backend is a self-contained npm
workspace in `backend/` and this layout sits under `backend/src/`:

```
backend/
  src/
    server.ts            boot: database first, then listen
    app.ts               express app factory (tests build it without listening)
    config/env.ts        all environment variables, one place
    db/connect.ts        mongo connection + index creation on boot
    db/models.ts         the model list indexes are built from
    middleware/          auth, validate(zod), errorHandler, requestId, rateLimit, httpLogger
    modules/
      auth/  system/  curriculum/  learning/  notes/  execution/
      interviews/  recommendations/  practice/  analytics/
    docs/swagger.ts      serves ../docs/openapi.yaml at /api/v1/docs
    shared/              response envelope, error codes, logger, shared types
  scripts/               verify-day1.sh, then seedCurriculum.ts, seedPractice.ts,
                         seedJudgeFixtures.ts, seedDemoUser.ts
  .env.example           placeholders only; .env is git-ignored
docs/                    these documents + openapi.yaml
```

Each module folder has the same four files: `*.routes.ts`, `*.service.ts`, `*.model.ts`,
`*.schema.ts`. Nothing clever.

---

## 6. Rules we do not break

- User code never runs inside the API process, and never in a host child-process compiler. It runs
  in Piston, behind the server boundary.
- `Run` never grants XP or completes anything. Only `Submit` can.
- Reviewing a completed checkpoint returns the existing state and awards nothing.
- Preview mode never reaches the backend; no preview flag is stored.
- The user id always comes from the token. A `userId` in a request body is ignored.
- Locked modules are rejected server-side, using the frontend's own prerequisite graph.
- No lesson text or scenic content is copied into the database.
- **A wrong answer, compile error, runtime error or timeout is a real execution result — never a
  runner outage.** Only genuine runner/gateway unavailability may fall back to the mock, and that
  case returns `RUNNER_UNAVAILABLE`, never a fabricated pass or fail.
- Hidden judging fixtures live server-side. Frontend-bundled `hiddenTests` are not secret and must
  not be trusted for judging.
- The execution provider stays activity-agnostic — no per-activity special cases.

---

## 7. Out of scope for v1

A CMS for lesson content · Docker and containers · migration tooling · ML recommendations ·
admin dashboard, billing, multi-tenancy · storing image files.

Containers were considered and deliberately deferred: v1 should be startable and inspectable with
plain `npm` commands. Adding a Dockerfile later changes no application code.

**Code execution is not on this list.** It is solved and in scope — the self-hosted Piston service
already does real compile and execution for Python, C++ and Java. Day 4 calls it (§9). There is no
compiler left to write, wait for, or defer.

---

## 8. Day plan

| Day | Work | Done when |
|---|---|---|
| 0 | These documents | Reviewed and approved ✅ |
| 1 | Express skeleton, MongoDB connection, env config, `/health`, register/login/refresh/logout, `/users/me` | A clean machine boots by following the README ✅ |
| 2 | Curriculum seeder, enrollment, course state, start module, complete checkpoint, reward ledger, XP / lives / streak | Completed, current, available and locked all persist correctly ✅ |
| 3 | Notes API, `ApiProgressRepository`, `ApiNotesRepository`, localStorage import path | Logout and login restore progress and notes exactly ✅ |
| 4 | `/code/run`, `/code/submit`, submission storage, rate and size limits, server-side hidden fixtures, the `mock` and `piston` providers | CodeWorkspace works against the API with no UI change, on real Python/C++/Java |
| 5 | Interview result endpoint, skill signals, rule-based recommendations, practice metadata | Weak skills produce an explainable next step |
| 6 | Analytics summary, activity feed, authorization audit, rate limits, logging | Security checklist passes |
| 7 | End-to-end tests, fresh-database boot, Swagger, README, demo data | The full learner flow passes |

**There is no "Later" row, because the compiler is done.** Piston closed that item: real compile
and execution for Python, C++ and Java through the real coding interface, 14 activities
real-enabled, 84/84 execution QA pass. Day 4 is not building an execution engine and is not
waiting on a handover — it calls a service that already works, and the seven numbered days are
the whole of v1.

Piston harness and gateway changes stay **coordinated with the frontend owner**; the backend calls
the service, it does not unilaterally reconfigure it.

---

## 9. Code execution — self-hosted Piston

Real execution already exists. v1 ships **two** interchangeable providers behind one interface,
chosen by an environment variable:

```ts
// modules/execution/provider.ts
export interface CodeExecutionProvider {
  run(req: ExecRequest): Promise<ExecResult>     // visible/sample tests, no reward
  submit(req: ExecRequest): Promise<ExecResult>  // server-side hidden fixtures, may complete a checkpoint
}
// EXECUTION_PROVIDER=piston | mock
```

| Provider | What it does | Used for |
|---|---|---|
| `piston` | Real compile + execution of Python, C++ and Java in the self-hosted Piston service | **Default in dev and prod.** Every real learner action |
| `mock` | Executes nothing; judges the submitted text with the frontend's existing heuristics | Automated tests, offline work, and infrastructure-only fallback |

There is no `local-gcc` and no `compiler` provider. Both are removed from the plan.

### Languages

| Language | Status in the frontend today | Backend contract |
|---|---|---|
| Python | Real execution working | `python` |
| C++ | Real compile + execution working | `cpp` |
| Java | Real compile + execution working | `java` |

`c` is no longer accepted. The enum is exactly `python | cpp | java`.

### The fallback rule

This is the part that is easy to get wrong, so it is stated explicitly:

- Wrong answer, compile error, runtime error and timeout are **execution results**. They come back
  as real statuses with real output. They never trigger a fallback and are never masked.
- Only **runner or gateway unavailability** — Piston unreachable, refusing connections, or failing
  its health check — is an infrastructure failure.
- On infrastructure failure the API returns `RUNNER_UNAVAILABLE`. It does not invent a pass, and it
  does not award XP. The mock fallback exists for tests and offline development, not to paper over
  a dead runner in production.

### Isolation

Learner code does not run in the API process and does not run as a host child process. It runs in
Piston, which provides the isolation. The backend's job is to call it, enforce rate and size
limits, judge against server-side fixtures, and store the result.

Because the frontend already calls Piston directly today, Day 4 moves that call **behind the server
boundary** so hidden fixtures and judging stop living in the browser. The coding UI does not change.

---

**Status:** Days 0–3 are complete — planning and baseline, the server skeleton with
authentication, durable learner progress with server-side locks and an idempotent reward ledger,
and notes plus the frontend adapters that put the app on the API. Day 4 (code execution through
Piston) is next. Day-by-day checkpoints, goals and
verification steps are tracked in [05-DAY-WISE-CHECKPOINTS.md](./05-DAY-WISE-CHECKPOINTS.md).
