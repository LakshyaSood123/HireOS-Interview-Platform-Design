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
cp .env.example .env     # then fill in MONGO_URI and the two JWT secrets
npm install
npm run dev              # http://localhost:4883
```

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
| `npm test` | Vitest, in-memory MongoDB — never touches Atlas |

---

## What is live today (Day 1)

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/health` | — |
| `POST` | `/api/v1/auth/register` | — |
| `POST` | `/api/v1/auth/login` | — |
| `POST` | `/api/v1/auth/refresh` | — |
| `POST` | `/api/v1/auth/logout` | Bearer |
| `GET` | `/api/v1/users/me` | Bearer |
| `GET` | `/api/v1/docs` | — |

Learning, notes, execution, interviews, recommendations and analytics arrive on Days 2–6, per
[`../docs/05-DAY-WISE-CHECKPOINTS.md`](../docs/05-DAY-WISE-CHECKPOINTS.md).

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
    system/              health
  docs/swagger.ts        serves ../docs/openapi.yaml
  shared/                envelope · errors · logger
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
