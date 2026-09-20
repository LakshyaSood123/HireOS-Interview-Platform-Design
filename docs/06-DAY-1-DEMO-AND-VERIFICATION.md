# Day 1 — Demo Notes and Manual Verification

Day 1 delivered the server skeleton and authentication. This document has two halves:

- **[Part 1 — Presentation notes](#part-1--presentation-notes)**, the running order for the demo.
- **[Part 2 — Manual verification](#part-2--manual-verification)**, for a reviewer who wants to
  check the claims rather than take them on trust.

Checkpoint definitions live in [05-DAY-WISE-CHECKPOINTS.md](./05-DAY-WISE-CHECKPOINTS.md).

---

# Part 1 — Presentation notes

## The framing (30 seconds)

> Day 1 is not "login works". Login working is the easy half. Day 1 is the server becoming the
> authority on who you are — so that from Day 2 onwards, nothing the browser claims about a user is
> trusted.

Everything in Days 2–6 — XP that can't be double-awarded, modules that stay locked, hidden test
fixtures, one learner not reading another's data — rests on the server knowing the caller's
identity from a signed token rather than from the request body. That is what Day 1 built.

## What shipped

| | |
|---|---|
| Where | `backend/` — a self-contained npm workspace; the repo root `src/` is the frontend |
| Stack | Node 22, Express 5, TypeScript, MongoDB Atlas via Mongoose, Zod, JWT, pino |
| Live endpoints | `/health`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/me`, `/docs` |
| Database | Atlas cluster, database `reagvis_dev`, indexes built on boot |
| Verification | `npm run verify:day1` — 47 automated assertions, all passing against Atlas |

## Demo running order

Roughly eight minutes. The last section is the one worth the time — the first four just set it up.

### 1. It refuses to start misconfigured (~30s)

Temporarily rename `.env`, then `npm run dev`:

```
Invalid environment configuration:
  - MONGO_URI: required — the MongoDB Atlas connection string
  - JWT_ACCESS_SECRET: required — at least 32 random characters
  - JWT_REFRESH_SECRET: required — at least 32 random characters, different from JWT_ACCESS_SECRET

backend/.env is missing — copy backend/.env.example to backend/.env and fill it in.
```

> "Every environment variable is validated by Zod before the server opens a port. A missing
> connection string is a startup failure with a readable message, not a 500 on somebody's first
> request three hours later."

Restore `.env` and start properly:

```
db: connected          database: "reagvis_dev"
db: indexes ready      collections: 2
docs: swagger ready
api: listening         port: 4883
```

> "Database first, then listen. Indexes are created on boot rather than left to Mongoose's
> autoIndex, so a bad index fails the boot instead of racing the first request."

### 2. Health (~20s)

```bash
curl -s localhost:4883/api/v1/health | jq
```

```json
{ "data": { "status": "ok", "db": "connected", "uptimeSeconds": 9 },
  "meta": { "requestId": "req_b75a6b22b5e8" } }
```

> "Liveness and database reachability in one call, and note the `requestId` — every response
> carries one, success or failure, and it's on the `x-request-id` header too. A user reporting a
> problem can hand us that string and we find the exact log line."

### 3. The contract is live, not a document (~40s)

Open <http://localhost:4883/api/v1/docs>.

> "This is Swagger served from `docs/openapi.yaml` — the same file that's checked into the repo.
> There's no generated copy, so the contract and the docs can't drift apart. Everything in here can
> be called with 'Try it out'."

### 4. The flow works (~1 min)

Register → login → `/users/me`. Show the response to `/users/me`:

```json
{ "data": { "id": "6aafc5b46c86bde9bfb399de", "email": "…", "displayName": "Mentor Demo",
            "role": "learner", "createdAt": "2026-09-20T11:38:28.562Z" },
  "meta": { "requestId": "req_…" } }
```

> "The request had no user id in it. Just `Authorization: Bearer`. The server read the identity out
> of the signed token — that's the rule for every endpoint from here on, and a `userId` in a
> request body is ignored everywhere."

### 5. It can't be cheated — the actual demo (~5 min)

This is the part to slow down on. Run the five checks in
[Part 2 §3](#3-the-checks-that-actually-matter) live.

The lines worth saying, one per check:

| Check | Line |
|---|---|
| Wrong password vs unknown email | "Same message, same code — and the same timing. An unknown email is still compared against a throwaway hash, so you can't tell registered emails from unregistered ones by watching the clock." |
| Duplicate email → 409 | "That's the unique index rejecting it, not a check-then-insert. Two people registering the same email at the same instant — one wins, one gets a 409. A read-then-write would let both through." |
| Tampered / expired token → 401 | "Change one character and it's rejected. The signature is the whole point." |
| Refresh rotation | "Refresh once and the old token is dead. The new one works." |
| **Reuse a rotated token** | "And this is the one I'd point at. Presenting an already-rotated token means either a retry or a stolen token — we can't tell which, so we assume theft and kill *every* session for that user. They log in again; an attacker with a stolen token gets nothing." |

Close on:

> "Register, log in, and the server knows who you are — from the token, never from the request
> body."

## Questions to expect

**"Why is the frontend unchanged?"**
By design. Day 1 is server-only; the frontend still reads `localStorage`. Day 3 swaps
`LocalProgressRepository` → `ApiProgressRepository` and `LocalNotesRepository` →
`ApiNotesRepository`. That's four adapter files and zero component files — the UI is supposed to
look identical even after it's wired, which is standing rule 3 in the plan.

**"Why MongoDB rather than Postgres?"**
The learner state is one document that's read together and written together
(`LearnerProgressState`). One document means one atomic update, no joins, and no way for a module
row to disagree with its checkpoint rows. It's in the plan's §2 table of changes from the original
requirements.

**"Why is the refresh token a JWT *and* a database row?"**
The signature proves it was issued by us; the row makes it revocable. Only the SHA-256 hash is
stored, so a database dump can't be replayed as a login. You need both to refresh, which means
logout and reuse-detection actually work — a pure JWT can't be revoked.

**"What about tests?"**
There are none yet, and `npm test` passes with zero tests. Day 7.2 owns the Vitest and in-memory
MongoDB suite. `scripts/verify-day1.sh` is the stand-in — 47 assertions, but it needs a running
server, so it isn't CI-ready. Worth being upfront about rather than letting it be found.

**"Is anything not in the original contract?"**
Yes, and it's written down. `openapi.yaml` gained `EMAIL_ALREADY_REGISTERED`, `PAYLOAD_TOO_LARGE`
and `INTERNAL_ERROR` in the error enum, plus the real response codes for `/auth/refresh` and
`/auth/logout` — the codes the implementation actually returns. Day 7.4 requires the spec to match
the implementation, so it was fixed now rather than left to drift.

## What's deliberately not done

Say this before being asked — it reads as judgement rather than oversight.

| Not done | Why |
|---|---|
| Automated tests | Day 7.2. The shell suite covers Day 1 for now |
| Email verification, password reset | Not in the v1 contract's 25 endpoints |
| Refresh-token cookies | The contract returns tokens in the body; the frontend adapters expect that |
| Anything on Days 2–6 | One day at a time, in reviewable PRs |

---

# Part 2 — Manual verification

Everything below was run against the live Atlas cluster. Outputs are real, not illustrative.

## 0. Before you start

**You need:** Node 20+, and `jq` for the scripted checks (`brew install jq`). Plain `curl` works
without it, the output is just denser.

**The one gotcha — read this before you start.** `/auth/login` and `/auth/register` are rate
limited to **10 requests per 15 minutes per IP**, which is the contract's number. That budget is
small on purpose, and working through this document by hand *will* exhaust it:

```json
{ "error": { "code": "RATE_LIMITED", "message": "Too many requests. Please wait a moment and try again." } }
```

That is the limiter working, not a bug. The counter is in memory, so **restarting the server resets
it**:

```bash
kill $(lsof -ti:4883) && npm run dev
```

`scripts/verify-day1.sh` spends 7 of the 10 on register and login. It reads the remaining budget
from the limiter's own `RateLimit` response header and stops immediately with an explanation if
there isn't enough, rather than reporting a cascade of confusing failures:

```
  Auth rate limit reached. Only 2 of the 10 auth calls are left; this run needs 6 more.
```

**So: restart the server before a verification run**, and again before working through §2–§3 by
hand. Only `/auth/register` and `/auth/login` draw on this budget — `/health`, `/users/me`,
`/auth/refresh`, `/auth/logout` and `/docs` are on the separate 120-per-minute limit and won't
run out.

## 1. Zero to running

```bash
cd backend
cp .env.example .env
```

Fill in three values in `.env`:

- `MONGO_URI` — from Atlas → Database → Connect → Drivers. Your IP must be on the Atlas Network
  Access allowlist.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — run this twice, they must differ:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

```bash
npm install
npm run dev
```

**Expect:** `db: connected` → `db: indexes ready` → `api: listening` on port 4883.

**Check the failure path too.** Rename `.env` and run `npm run dev` again — it must exit with a
list of the missing variables, *before* binding a port. Rename it back.

## 2. The happy path

```bash
BASE=http://localhost:4883/api/v1
EMAIL="mentor-$(date +%s)@example.com"
PASS=correct-horse-battery
```

```bash
curl -s $BASE/health | jq
```
```json
{"data":{"status":"ok","db":"connected","uptimeSeconds":9},"meta":{"requestId":"req_b75a6b22b5e8"}}
```

```bash
curl -s -X POST $BASE/auth/register -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Mentor Demo\"}" | jq
```
```json
{ "data": { "accessToken": "eyJhbGciOiJIUzI1Ni…", "refreshToken": "eyJhbGciOiJIUzI1Ni…",
            "expiresIn": 900,
            "user": { "id": "6aafc5b46c86bde9bfb399de", "email": "mentor-…@example.com",
                      "displayName": "Mentor Demo", "role": "learner",
                      "createdAt": "2026-09-20T11:38:28.562Z" } },
  "meta": { "requestId": "req_4bb58eb87792" } }
```

`expiresIn: 900` is the 15-minute access token. **There is no `passwordHash` anywhere in that
response** — that's checkpoint 1.7.

```bash
LOGIN=$(curl -s -X POST $BASE/auth/login -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
ACCESS=$(jq -r .data.accessToken  <<<"$LOGIN")
REFRESH=$(jq -r .data.refreshToken <<<"$LOGIN")

curl -s $BASE/users/me -H "authorization: Bearer $ACCESS" | jq
```

Returns the profile. Note the request carried **no user id** — identity came from the token.

## 3. The checks that actually matter

These are the ones that prove the work. Each should *fail* the way it's supposed to.

### 3.1 A wrong password gives nothing away

```bash
curl -s -X POST $BASE/auth/login -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"definitely-wrong\"}" | jq -c
curl -s -X POST $BASE/auth/login -H 'content-type: application/json' \
  -d '{"email":"ghost@example.com","password":"definitely-wrong"}' | jq -c
```

```json
{"error":{"code":"UNAUTHENTICATED","message":"Invalid email or password.","requestId":"req_72684267d083"}}
{"error":{"code":"UNAUTHENTICATED","message":"Invalid email or password.","requestId":"req_2a8f906dbc5e"}}
```

**Identical.** A registered email with a wrong password and an email that doesn't exist are
indistinguishable — no code, message or status reveals which field was wrong. An unknown email is
also compared against a throwaway bcrypt hash, so the two take the same time to answer.

### 3.2 Duplicate registration → 409

```bash
curl -s -X POST $BASE/auth/register -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Again\"}" | jq -c
```
```json
{"error":{"code":"EMAIL_ALREADY_REGISTERED","message":"That email address is already registered.","requestId":"req_3db170c217da"}}
```

Enforced by the unique index on `email`, not a check-then-insert, so concurrent registrations can't
both succeed.

### 3.3 Tokens must be real

```bash
curl -s -o /dev/null -w 'no token        : %{http_code}\n' $BASE/users/me
curl -s -o /dev/null -w 'tampered token  : %{http_code}\n' $BASE/users/me -H "authorization: Bearer ${ACCESS%?}X"
curl -s -o /dev/null -w 'refresh as access: %{http_code}\n' $BASE/users/me -H "authorization: Bearer $REFRESH"
```
```
no token        : 401
tampered token  : 401
refresh as access: 401
```

The third matters: a refresh token is signed with a *different* secret and carries a different
type, so it can't be used as an access token.

For an expired token, either set `ACCESS_TOKEN_TTL=5s` in `.env`, restart, log in, wait six seconds
and call `/users/me` — or let `scripts/verify-day1.sh` forge one, which it does automatically.

### 3.4 Refresh rotates, and the old token dies

```bash
ROT=$(curl -s -X POST $BASE/auth/refresh -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}")
NEW_REFRESH=$(jq -r .data.refreshToken <<<"$ROT")
NEW_ACCESS=$(jq -r .data.accessToken  <<<"$ROT")

curl -s -o /dev/null -w 'new access token : %{http_code}\n' $BASE/users/me -H "authorization: Bearer $NEW_ACCESS"
curl -s -X POST $BASE/auth/refresh -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq -c
```
```
new access token : 200
{"error":{"code":"UNAUTHENTICATED","message":"Invalid or expired refresh token.","requestId":"req_…"}}
```

The old refresh token stops working the moment it's rotated — checkpoint 1.9.

### 3.5 Reuse is treated as theft

Carry straight on from 3.4. You still hold `NEW_REFRESH`, which was valid a second ago:

```bash
curl -s -X POST $BASE/auth/refresh -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$NEW_REFRESH\"}" | jq -c
```
```json
{"error":{"code":"UNAUTHENTICATED","message":"Invalid or expired refresh token."}}
```

**Why:** replaying the *old* token in 3.4 was read as a possible theft, so every live session for
that user was revoked — including the good one. The real user logs in again; an attacker holding a
stolen token gets nothing. The server log records it:

```
auth: refresh token reuse — all sessions revoked
```

### 3.6 Logout kills the session

```bash
L=$(curl -s -X POST $BASE/auth/login -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
A=$(jq -r .data.accessToken <<<"$L"); R=$(jq -r .data.refreshToken <<<"$L")

curl -s -o /dev/null -w 'logout          : %{http_code}\n' -X POST $BASE/auth/logout \
  -H "authorization: Bearer $A" -H 'content-type: application/json' -d "{\"refreshToken\":\"$R\"}"
curl -s -o /dev/null -w 'refresh after   : %{http_code}\n' -X POST $BASE/auth/refresh \
  -H 'content-type: application/json' -d "{\"refreshToken\":\"$R\"}"
```
```
logout          : 204
refresh after   : 401
```

### 3.7 Bad input is rejected with a usable message

```bash
curl -s -X POST $BASE/auth/register -H 'content-type: application/json' \
  -d '{"email":"nope","password":"x","displayName":""}' | jq
```
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "The request is invalid.",
    "details": { "source": "body", "issues": [
      { "path": "email",       "message": "A valid email address is required.", "code": "invalid_format" },
      { "path": "password",    "message": "Password must be at least 8 characters.", "code": "too_small" },
      { "path": "displayName", "message": "Display name is required.", "code": "too_small" } ] },
    "requestId": "req_4fdbe0448e6e" } }
```

All three problems in one response, not one at a time.

## 4. Check the database yourself

Atlas UI → **Browse Collections** → `reagvis_dev`. Or from the shell:

```bash
cd backend && node -e '
const fs=require("fs"),{MongoClient}=require("mongodb");
const env=Object.fromEntries(fs.readFileSync(".env","utf8").split("\n")
  .filter(l=>l.trim()&&!l.startsWith("#")&&l.includes("="))
  .map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
(async()=>{const c=await MongoClient.connect(env.MONGO_URI);const db=c.db(env.MONGO_DB_NAME);
for(const n of ["users","refreshTokens"]){console.log("\n"+n+":");
  for(const i of await db.collection(n).indexes())
    console.log("  ",JSON.stringify(i.key),"unique="+!!i.unique,
      i.expireAfterSeconds!==undefined?"TTL="+i.expireAfterSeconds+"s":"");}
const u=await db.collection("users").findOne({});
console.log("\npassword stored as:",String(u.passwordHash).slice(0,7),"(bcrypt, 12 rounds)");
const t=await db.collection("refreshTokens").findOne({});
console.log("refresh token stored as sha256 hex:",/^[0-9a-f]{64}$/.test(t.tokenHash));
console.log("raw token present in row:",Object.keys(t).some(k=>k.toLowerCase()==="token"));
await c.close();})();'
```

**Expect — this is checkpoint 1.6:**

```
users:
   {"_id":1} unique=false
   {"email":1} unique=true

refreshTokens:
   {"_id":1} unique=false
   {"userId":1} unique=false
   {"tokenHash":1} unique=true
   {"expiresAt":1} unique=false TTL=0s

password stored as: $2b$12$ (bcrypt, 12 rounds)
refresh token stored as sha256 hex: true
raw token present in row: false
```

The TTL index on `expiresAt` means expired sessions delete themselves. The raw refresh token is
never stored — only its hash — so a database dump can't be replayed as a login.

## 5. No secrets leak

**Into responses:** none of the bodies above contain `passwordHash`. Grep any of them.

**Into logs:** capture a log file, run the flow above against it, then grep it.

```bash
npm run dev 2>&1 | tee /tmp/api.log       # terminal 1
npm run verify:day1                        # terminal 2 — drives the whole auth flow
```

```bash
for t in "correct-horse-battery" passwordHash '\$2b\$' eyJhbGciOi tokenHash; do
  printf '%-24s ' "$t"; grep -qi -- "$t" /tmp/api.log && echo FOUND || echo absent
done
```
```
correct-horse-battery    absent
passwordHash             absent
\$2b\$                   absent
eyJhbGciOi               absent
tokenHash                absent
```

All five must be `absent` — that is the password, the bcrypt hash prefix, the JWT prefix and the
token-hash field name. Redaction lives in `src/shared/logger.ts`.

**Into the repository:**

```bash
git check-ignore -q backend/.env       && echo ".env ignored        OK"
git check-ignore -q backend/.env.example || echo ".env.example tracked OK"
grep -c 'replace-me\|<user>' backend/.env.example    # placeholders only
```

The root `.gitignore` excludes `.env*`, which would have swallowed the template too — so
`backend/.gitignore` re-includes `.env.example` explicitly.

## 6. Or run all of it at once

```bash
npm run dev          # terminal 1
npm run verify:day1  # terminal 2
```

Asserts all 47 checks — every "Passes when" line in the Day 1 checkpoints — and prints a
pass/fail table. Expected: `── Result: 47 passed, 0 failed ──`.

Run it twice in a row and the second run stops with the auth rate-limit notice instead of running,
because 7 of the 10-call budget are already spent. That is correct behaviour — restart the server
and run it again.

---

## Verification summary

| # | Checkpoint | How it was checked | Result |
|---|---|---|---|
| 1.1 | Scaffold boots on 4883 | `npm run dev` | ✅ |
| 1.2 | Env validated at boot | Renamed `.env`, confirmed startup failure | ✅ |
| 1.3 | Atlas + indexes on boot | `db: connected`, indexes read back from Atlas | ✅ |
| 1.4 | Middleware | `requestId` on every response, `{error}` envelope, 400/404/429 | ✅ |
| 1.5 | `/health` | Returns `status`, `db`, `uptimeSeconds` | ✅ |
| 1.6 | Models + indexes | `email` unique, `tokenHash` unique, TTL on `expiresAt` | ✅ |
| 1.7 | Register, duplicate → 409 | §3.2 | ✅ |
| 1.8 | Login, 15-min access token | §2, `expiresIn: 900` | ✅ |
| 1.9 | Refresh rotates | §3.4, §3.5 | ✅ |
| 1.10 | Logout revokes | §3.6 | ✅ |
| 1.11 | `/users/me` from token only | §2, §3.3 | ✅ |
| 1.12 | Swagger at `/api/v1/docs` | Loads, "Try it out" works | ✅ |
| 1.13 | README + `.env.example` | §1 followed start to finish | ✅ |

Cluster: Atlas replica set, MongoDB 8.0.32, database `reagvis_dev`. Transactions confirmed
available, which Day 2's reward-ledger write depends on.
