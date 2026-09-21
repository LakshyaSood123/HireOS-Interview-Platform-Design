# Reagvis Trails — Backend API

Node 20+ · Express 5 · TypeScript · MongoDB Atlas (Mongoose) · Zod · JWT

The frontend owns lesson content and visuals. This API owns accounts, durable learner progress,
notes, submissions, interview signals, recommendations and analytics.

Plans and contract live in [`../docs/`](../docs). The machine-readable contract is
[`../docs/openapi.yaml`](../docs/openapi.yaml), served at `/api/v1/docs`.

---

## Quick start

```bash
cd backend
cp .env.example .env       # then fill in MONGO_URI and the two JWT secrets
npm install
npm run seed:curriculum    # 7 zones · 29 modules · 107 checkpoints
npm run dev                # http://localhost:4883
```

The seeder is a one-off. Skip it and the server still boots — auth and health work — but every
learning endpoint returns 404 with a message naming the command, and the boot log says so.

```bash
curl localhost:4883/api/v1/health
# { "data": { "status": "ok", "db": "connected", "uptimeSeconds": 3 }, "meta": { "requestId": "req_…" } }
```

Swagger UI: <http://localhost:4883/api/v1/docs>

### Generating the JWT secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run it twice — `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must differ.

### MongoDB Atlas

`MONGO_URI` comes from Atlas → **Database → Connect → Drivers**. Two things catch people out:

- **IP allowlist.** Atlas → Network Access. Add your current IP, or `0.0.0.0/0` for a demo — with a
  strong database password.
- **Database name** comes from `MONGO_DB_NAME`, not from the URI path. One cluster holds
  `reagvis_dev`, `reagvis_test` and `reagvis_prod` side by side.

Nothing is installed locally and there is no Docker in v1. Indexes are created on boot.

---

## Environment variables

Every variable is validated by Zod at boot (`src/config/env.ts`). A missing or malformed value
stops the process with a readable message — it never fails later on a request.

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `4883` | |
| `API_PREFIX` | `/api/v1` | |
| `MONGO_URI` | — | **Required. Secret.** Atlas connection string |
| `MONGO_DB_NAME` | `reagvis_dev` | One database per environment |
| `JWT_ACCESS_SECRET` | — | **Required. Secret.** ≥ 32 chars |
| `JWT_REFRESH_SECRET` | — | **Required. Secret.** ≥ 32 chars, different from the access secret |
| `ACCESS_TOKEN_TTL` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Also the TTL index on `refreshTokens.expiresAt` |
| `BCRYPT_ROUNDS` | `12` | 10–15 |
| `CORS_ORIGINS` | localhost 8443 / 5173 / 3000 | Comma-separated allowlist |
| `TRUST_PROXY` | `loopback` | Express `trust proxy` — governs the client IP used for rate limits |
| `JSON_BODY_LIMIT` | `128kb` | |
| `LOG_LEVEL` | `info` | |
| `LOG_PRETTY` | `false` | Human-readable logs in dev |
| `EXECUTION_PROVIDER` | `piston` | Day 4. `piston` \| `mock` |
| `PISTON_URL` | `http://localhost:2000` | Day 4 |

`.env` is git-ignored. `.env.example` carries placeholders only — no real secret belongs in it.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Watch mode on `PORT` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, in-memory MongoDB — never touches Atlas (none yet; Day 7) |
| `npm run seed` | Everything seedable. Today that is the curriculum |
| `npm run seed:curriculum` | Writes the curriculum snapshot. `-- --dry-run` builds and checks without writing |
| `npm run verify:day1` | 47 assertions — the auth flow, against a running server |
| `npm run verify:day2` | 67 assertions — progress, XP, locks, streak, against a running server |
| `npm run verify:parity` | Backend engine vs. the frontend's `progressEngine.ts`. No server, no database |
| `npm run verify:ledger` | Reconciles stored XP against the reward ledger, for every user |

### Seeding the curriculum

```bash
npm run seed:curriculum -- --dry-run              # build and check, write nothing
npm run seed:curriculum -- --version=2026-09-16   # name the snapshot yourself
npm run seed:curriculum -- --course=dsa-foundations
```

It imports the frontend's own `src/learning/courseRegistry.ts` and writes the course's **ID
structure only** — ids, order, type, XP, mastery bonus, prerequisites, a coding-activity flag, and
one short title per zone and module for the lock messages. No theory, no questions, no starter
code, no solutions. That is enforced by a field allowlist and a 120-character cap on every string
in `scripts/lib/buildSnapshot.ts`: add anything else and the seeder refuses to write and names the
field.

Re-running is safe. The same structure is an upsert on `{ courseId, version }`, and `isActive`
moves to the snapshot just written — a unique partial index guarantees exactly one active snapshot
per course, so a rollback is a flag flip. **Restart the API afterwards**: it loads the snapshot at
boot and keeps it in memory.

---

## What is live today (Days 1–2)

| Method | Path | Auth | Day |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | 1 |
| `POST` | `/api/v1/auth/register` | — | 1 |
| `POST` | `/api/v1/auth/login` | — | 1 |
| `POST` | `/api/v1/auth/refresh` | — | 1 |
| `POST` | `/api/v1/auth/logout` | Bearer | 1 |
| `GET` | `/api/v1/users/me` | Bearer | 1 |
| `GET` | `/api/v1/docs` | — | 1 |
| `GET` | `/api/v1/me/courses/{courseId}/state` | Bearer | 2 |
| `PUT` | `/api/v1/me/courses/{courseId}/active` | Bearer | 2 |
| `POST` | `/api/v1/me/modules/{moduleId}/start` | Bearer | 2 |
| `GET` | `/api/v1/me/modules/{moduleId}/progress` | Bearer | 2 |
| `POST` | `/api/v1/me/checkpoints/{checkpointId}/complete` | Bearer | 2 |
| `POST` | `/api/v1/me/attempts` | Bearer | 2 |

Notes, execution, interviews, recommendations and analytics arrive on Days 3–6, per
[`../docs/05-DAY-WISE-CHECKPOINTS.md`](../docs/05-DAY-WISE-CHECKPOINTS.md).

### Walking through the learning flow

```bash
BASE=http://localhost:4883/api/v1
ACCESS=…                                    # from /auth/login

# where the learner stands — this call also enrolls, first time
curl -s $BASE/me/courses/dsa-foundations/state -H "authorization: Bearer $ACCESS" | jq .data

# a locked module says no, and says what is missing
curl -sX POST $BASE/me/modules/graphs/start -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}'
# → 409 MODULE_LOCKED  details.missingPrerequisites: ["trees-5"]

# complete one — and again, and again
curl -sX POST $BASE/me/checkpoints/foundations-1/complete -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations","source":"reading"}'
# → xpAwarded 30, then 0, then 0 …
```

### Walking through the auth flow

```bash
BASE=http://localhost:4883/api/v1

curl -sX POST $BASE/auth/register -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"correct-horse-battery","displayName":"Demo"}'

LOGIN=$(curl -sX POST $BASE/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"correct-horse-battery"}')
ACCESS=$(echo "$LOGIN"  | jq -r .data.accessToken)
REFRESH=$(echo "$LOGIN" | jq -r .data.refreshToken)

curl -s $BASE/users/me -H "authorization: Bearer $ACCESS"

curl -sX POST $BASE/auth/refresh -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"        # the old refresh token now stops working

curl -sX POST $BASE/auth/logout -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}"
```

---

## Response shape

Success:

```json
{ "data": { }, "meta": { "requestId": "req_7f1c" } }
```

Failure:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "The request is invalid.",
             "details": { }, "requestId": "req_7f1c" } }
```

Every response carries a request id, also returned as the `x-request-id` header, so a client report
can be matched to a log line. Error codes and their HTTP statuses are in `src/shared/errors.ts` and
in the contract.

---

## Layout

```
src/
  server.ts              boot: database first, then listen
  app.ts                 express app factory (tests build it without listening)
  config/env.ts          every environment variable, validated once
  db/connect.ts          Atlas connection + index creation on boot
  db/models.ts           the model list indexes are built from
  middleware/            requestId · auth · validate(zod) · rateLimit · httpLogger · errorHandler
  modules/
    auth/                routes · service · schema · user.model · refreshToken.model · tokens
    curriculum/          the seeded ID structure, and the in-memory prerequisite graph
    learning/            routes · service · schema · progress.engine · three models
    system/              health
  docs/swagger.ts        serves ../docs/openapi.yaml
  shared/                envelope · errors · logger · dates · transaction
scripts/
  lib/buildSnapshot.ts   registry → snapshot, with the structure-only rules
  seedCurriculum.ts      writes it to MongoDB
  verifyEngineParity.ts  backend engine vs. the frontend's
  verifyLedger.ts        stored XP vs. the ledger
  verify-day1.sh · verify-day2.sh
```

Each module folder keeps the same four files — `*.routes.ts`, `*.service.ts`, `*.model.ts`,
`*.schema.ts`. Nothing clever.

---

## How auth works

- **Access token** — JWT, 15 minutes, `Authorization: Bearer`. Identity comes from this token and
  nothing else; a `userId` in a body is ignored everywhere.
- **Refresh token** — JWT signed with a separate secret, and stored only as a SHA-256 hash, so a
  database dump cannot be replayed as a login. `expiresAt` carries a TTL index, so expired sessions
  delete themselves.
- **Rotation** — `/auth/refresh` revokes the presented token in the same atomic write that claims
  it, then issues a new pair. Two concurrent refreshes cannot both succeed.
- **Reuse detection** — presenting an already-rotated token is treated as theft: every live session
  for that user is revoked and the call returns 401.
- **Passwords** — bcrypt at 12 rounds via `bcryptjs`. `passwordHash` is `select: false` on the
  model, so a stray query cannot carry it into a response.
- **No field hints** — a wrong password and an unknown email return the same 401 with the same
  message, and take the same time to answer.

Passwords, hashes and tokens are redacted from logs in `src/shared/logger.ts`. Anything added to a
request body later (Day 4's `sourceCode`) belongs in that redaction list.

---

## How progress works

**The server derives; it does not store what it can derive.** `courseProgress` holds facts — which
checkpoints are completed, XP, lives, streak, the active pointer. `locked` / `available` /
`current` / `completed` / `mastered` are computed per request from the prerequisite graph by
`modules/learning/progress.engine.ts`, which is a function-for-function port of the frontend's
`src/learning/progressEngine.ts`. Storing those states would create a second source of truth that
drifts.

`npm run verify:parity` is what stops the port drifting: it loads the real frontend engine and the
backend one, runs both over 49 progress snapshots, and compares 16,005 answers. Both are pure
functions, so it needs no server and no database. Change either engine and run it.

**No duplicate XP.** Completing a checkpoint writes a `rewardEvents` row *before* the XP, on a
unique `{ userId, courseId, eventKey }` index. A retry, a double-click, ten parallel requests, or a
learner reviewing a module they finished last week all collide on that index and take the same
path: `200`, `alreadyCompleted: true`, `xpAwarded: 0`, identical progress. "Already completed" is a
state, not an HTTP error.

On Atlas the ledger row and the progress update share a transaction. On a deployment with no
replica set the work runs un-wrapped with a warning — safe, because the index is the guarantee and
the transaction only stops a half-applied write.

**Locked stays locked.** The prerequisite graph is in the database, so the check runs server-side
at all three write endpoints — start a module, set the active pointer, complete a checkpoint. A
request that never touches the UI gets the same answer, with `missingPrerequisites` filled in.

**Rewards come from the curriculum.** A checkpoint pays its own `xp`; a module's terminal
checkpoint also pays `masteryXp` and joins `masteredCheckpointIds`. Both numbers are read from the
snapshot — there is no reward constant anywhere in the server.

**The streak** follows `progressEngine.recordActivity`: same day changes nothing, yesterday adds
one, anything else resets to one. The arithmetic is UTC here and local-timezone there, which
differs only on DST fall-back days; the server is the authority and is the correct one.
`verify:parity` sweeps three years of dates and prints any divergence.

**Identity comes from the token, always.** No endpoint accepts a `userId`. `/me/attempts` accepts a
`moduleId` and ignores it — the curriculum says which module a checkpoint belongs to.

---

## Rate limits

From the contract. Disabled under `NODE_ENV=test` so suites are not throttled.

| Group | Limit |
|---|---|
| `/auth/login`, `/auth/register` | 10 per 15 min per IP |
| everything else | 120 per minute per user (per IP when unauthenticated) |

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Invalid environment configuration` at boot | `.env` is missing or a value is wrong — the message names each variable |
| Boot hangs, then `db: connection error` | Your IP is not on the Atlas allowlist, or `MONGO_URI` is wrong |
| `401` on every authenticated call | Access token expired (15 min) — call `/auth/refresh` |
| `401` from `/auth/refresh` that used to work | The token was already rotated or logged out. Log in again |
| `429` | Rate limit — see the table above |
| Swagger page is blank | `docs/openapi.yaml` was not found; the boot log line `docs: swagger ready` names the file it loaded |
| `EADDRINUSE` | Something already holds `PORT`; change it in `.env` |
| `404` on every `/me/...` call | The curriculum is not seeded — run `npm run seed:curriculum`, then restart |
| Seeded, but the server still serves the old structure | The snapshot is loaded at boot; restart the API |
| `Refusing to seed — the snapshot is not structure-only` | Something non-structural reached the draft. The message names the field |
| `db: this deployment does not support transactions` | Not Atlas / not a replica set. Completions still cannot double-award; the unique ledger key is the guard |
