# Pilot deployment — Course Platform + CMS (Machine Learning Foundations v18)

Scope: the learner Course Platform and the CMS only (not the interview platform). Target: a controlled pilot of
roughly 5–10 invited learners on **one** backend instance.

## 0. What you are deploying

| Piece | What | Build | Run |
|---|---|---|---|
| Backend | Express 5 + Mongoose API, `backend/` | `npm ci && npm run build` | `NODE_ENV=production npm start` (`node dist/server.js`) |
| Frontend | Vite/React static bundle, repo root | `pnpm install && pnpm build` (needs `VITE_REAGVIS_API_URL`) | serve `dist/` as static files over HTTPS |
| Database | MongoDB 7 (Atlas or self-hosted) | — | — |
| Course data | the exact v18 release, `deployment/course-bootstrap/` | — | `importCourseRelease.ts` |

Node ≥ 20, pnpm for the frontend, npm for the backend. Source: deploy the commit that contains this document
(see `deployment/RELEASE_MANIFEST.json` for what must be committed). The frontend is a single-page app with no URL
routes: any host that serves `index.html` for `/` works; no rewrite rules are needed.

## 1. Database and the exact v18 course

```bash
# empty database, e.g. reagvis_prod (never a *_dev / *_test name in production)
cd backend
export MONGO_URI=...            # secret
export MONGO_DB_NAME=reagvis_prod
npx tsx scripts/importCourseRelease.ts --in=../deployment/course-bootstrap --dry-run   # plan: CREATE 118 expected
npx tsx scripts/importCourseRelease.ts --in=../deployment/course-bootstrap             # verifies checksums, imports, verifies via the CMS service
```

The import creates only: 1 course pointer, the published v18 version, its curriculum snapshot, 115 frozen animation
packages (with Package Traces). It imports **no** users, progress or drafts, refuses to overwrite a database that
already holds different data (`CONFLICT`), and is idempotent (second run: `REUSED 118`). Details:
`deployment/course-bootstrap/README.md`. The first time an admin opens the CMS a draft is created from v18 automatically.

## 2. Backend configuration (runtime)

Copy `backend/.env.production.example` to `backend/.env` (or inject the same variables). In production the server
**refuses to start** unless:

- `CORS_ORIGINS` is set explicitly to the frontend's exact `https://` origin(s) (no wildcard, no localhost, no path);
- `TRUST_PROXY` is set explicitly (use `1` behind one reverse proxy; `true` is rejected);
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are different, ≥ 32 characters and not placeholders;
- `MONGO_DB_NAME` is set and does not end in `_dev`/`_test`; `LOG_PRETTY=false`.

Generate secrets with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
Never commit `backend/.env`. Health: `GET /api/v1/health` (liveness, always 200, reports `db`) and
`GET /api/v1/ready` (readiness: 200 only when Mongo is connected, otherwise 503) — point the uptime monitor at `/ready`.

## 3. Frontend build (build-time)

```bash
VITE_REAGVIS_API_URL=https://api.example.org/api/v1 pnpm build     # or: VITE_REAGVIS_API_URL=/api/v1  (same-origin proxy)
```

`vite build` fails if the variable is missing, is `localhost`, or is plain `http://`. The variable is baked into the
bundle: changing it needs a rebuild. Pilot learner UI (no demo navigator / Creator Studio / DSA world / mock readiness
score for non-admins) is on by default.

## 4. Domain, HTTPS, reverse proxy, CORS

Terminate TLS at a reverse proxy (nginx / Caddy / a cloud load balancer). Either

- **same origin (simplest, no CORS):** one host serves `dist/` and forwards `/api/` to the backend on `127.0.0.1:4883`;
  build with `VITE_REAGVIS_API_URL=/api/v1`; set `CORS_ORIGINS=https://<that host>`; or
- **two hosts:** `https://app.example.org` (static) and `https://api.example.org` (backend); build with the absolute API
  URL and set `CORS_ORIGINS=https://app.example.org`.

Set `TRUST_PROXY=1` and make the proxy send `X-Forwarded-For` / `X-Forwarded-Proto`. The API uses Bearer tokens (no
cookies), so there is no `Secure`/`SameSite` cookie configuration to get wrong.

## 5. Auth, learners and admin

Learners register themselves in the app (`Create Account`); enrollment is implicit and pins them to the published
version. Registration always creates `learner` accounts. **First admin:** register normally, then on the server run
`cd backend && npx tsx scripts/promoteAdmin.ts --email=<that account>` (no password is read or printed).

Rate limits (in-memory, per backend instance — fine for one instance, must move to a shared store such as Redis before
running several instances): register 30 / 15 min / IP; login 8 failed attempts / 15 min per (IP + email) and 100
failed / 15 min per IP (successful logins are not counted); general API 120 / min / user.

## 6. Backups (do this before inviting anyone)

```bash
export MONGO_URI=... MONGO_DB_NAME=reagvis_prod            # or BACKUP_DOCKER_CONTAINER=<mongo container>
deployment/backup/backup-pilot-db.sh                        # -> deployment/backups/<db>_<UTC>.archive.gz (+ .sha256)
```

The archive holds user data and password hashes: it is git-ignored, written with mode 600, and **must be copied to
storage off this machine** (object storage / another host). Schedule it nightly (cron / Task Scheduler). Restore
into a named database only:

```bash
deployment/backup/restore-pilot-db.sh <archive.gz> <target-db> --confirm=<target-db> [--drop]
```

Atlas users should additionally enable Atlas backups. Rehearse a restore into a scratch database once.

## 7. Smoke test after deploy

1. `GET /api/v1/ready` → 200. 2. Open the site: sign-in page, **Create Account** with a fresh email → lands on the Course
Library showing only *Machine Learning Foundations*. 3. Enter, *Begin the Meadow Trail*, open lesson 1: text, animation
with explanation panel, **PLAY** advances every ~5–10 s, Quick Check, **Complete Checkpoint** → +30 XP. 4. Refresh,
log out, log in: progress still 1 / 115. 5. As admin: open the CMS / Creator Studio and the course draft.
6. Take the first backup.

## 8. Rollback

- Bad curriculum publish: CMS → versions → activate the previous version (`POST /cms/courses/:id/versions/:versionId/activate`);
  learners stay pinned to their own version unless repinned with `backend/scripts/repinLearner.ts`.
- Bad deploy / data damage: stop the API, restore the latest backup into a new database, point `MONGO_DB_NAME` at it,
  start the API. Re-run the smoke test.

## 9. Known pilot limits

Single backend instance; in-memory rate limits; Chrome/Edge on desktop/laptop recommended (mobile is usable, not polished);
access tokens are kept in `localStorage`; no URL deep links to lessons; the QA accounts in the development database are not
part of any release (`backend/scripts/cleanupQaData.ts` removes them locally — dry-run by default).
