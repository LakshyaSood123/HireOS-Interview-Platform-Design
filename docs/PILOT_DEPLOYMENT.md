# Production deployment — Course Platform + CMS (Machine Learning Foundations v19, narrated)

Scope: the learner Course Platform and the CMS (Creator Studio) only, not the interview platform. Target: a controlled
launch on **one** backend instance. The release includes the narrated Machine Learning Foundations **v19** (7 zones, 13 modules,
115 checkpoints, 115 animation packages, 980 narration clips), manual course authoring in the CMS, the dynamic learner course
catalog, and password-protected permanent deletion of manually created courses.

## 0. What you are deploying

| Piece | What | Build | Run |
|---|---|---|---|
| Backend | Express 5 + Mongoose API, `backend/` | `npm ci && npm run build` | `NODE_ENV=production npm start` (`node dist/server.js`) |
| Frontend | Vite/React static bundle, repo root | `pnpm install && pnpm build` (needs `VITE_REAGVIS_API_URL`) | serve `dist/` as static files over HTTPS |
| Database | MongoDB 7 (Atlas or self-hosted) | — | — |
| Course data | the narrated v19 release export (an artifact, **not in Git**, about 91 MB) | — | `importCourseRelease.ts` |

Node ≥ 20, pnpm for the frontend, npm for the backend. Source: deploy the commit that contains this document
(see `deployment/RELEASE_MANIFEST.json` for what must be committed). The frontend is a single-page app with no URL
routes: any host that serves `index.html` for `/` works; no rewrite rules are needed.

## 1. Database and the exact v19 course (narrated release)

The narrated release is produced on a development machine and carried to the server like a database backup (it is large and
git-ignored: `deployment/releases/ml-v19-narrated/`, made by `exportCourseRelease.ts --course=machine-learning-foundations --version=v19`).

```bash
# empty database, e.g. reagvis_prod (never a *_dev / *_test name in production)
cd backend
export MONGO_URI=...            # secret
export MONGO_DB_NAME=reagvis_prod
npx tsx scripts/importCourseRelease.ts --in=<path>/ml-v19-narrated --dry-run   # plan: CREATE 118 expected (1 pointer, 1 version, 1 snapshot, 115 packages)
npx tsx scripts/importCourseRelease.ts --in=<path>/ml-v19-narrated             # verifies checksums, imports, verifies via the CMS service
npx tsx scripts/verifyCourseRelease.ts --in=<path>/ml-v19-narrated             # optional: read-only proof of what is stored
```

The import creates only: 1 course pointer, the published v19 version, its curriculum snapshot and 115 frozen animation
packages (with Package Traces and 980 narration clips). It imports **no** users, progress or drafts, refuses to overwrite a
database that already holds different data (`CONFLICT`), and is idempotent (second run: `REUSED 118`). The first time an admin
opens the CMS a draft is created from v19 automatically. (`deployment/course-bootstrap/` is the small, older v18 bootstrap and is
not needed for this release.)

## 2. Backend configuration (runtime)

Copy `backend/.env.production.example` to `backend/.env` (or inject the same variables). In production the server
**refuses to start** unless:

- `CORS_ORIGINS` is set explicitly to the frontend's exact `https://` origin(s) (no wildcard, no localhost, no path);
- `TRUST_PROXY` is set explicitly (use `1` behind one reverse proxy; `true` is rejected);
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are different, ≥ 32 characters and not placeholders;
- `MONGO_DB_NAME` is set and does not end in `_dev`/`_test`; `LOG_PRETTY=false`.

Generate secrets with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
`MONGO_URI` is required. Never commit `backend/.env`. Health: `GET /api/v1/health` (liveness, always 200, reports `db`) and
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

## 4a. Narration: static (Mode A) in production

All 980 clips are already frozen in the published packages, so learners need **no** speech engine. Do not install Kokoro, Python
or model weights on the production server and leave `NARRATION_PROVIDER` unset (it defaults to `none` in production). The CMS
"Generate" buttons then say narration generation is unavailable; learner playback is unaffected. Regenerating narration after
launch (Mode B) is a separate, deliberate step: see `docs/NARRATION_LOCAL_TTS.md`.

## 5. Auth, learners and admin

Learners register themselves in the app (`Create Account`); enrollment is implicit and pins them to the published
version. Registration always creates `learner` accounts. **First admin:** register normally, then on the server run
`cd backend && npx tsx scripts/promoteAdmin.ts --email=<that account>` (no password is read or printed).

**No default admin exists and no admin password is ever stored in configuration.** Never create an admin by hand in the database.

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

Restore rehearsal (do this once before launch): restore the newest archive into a scratch database
(`restore-pilot-db.sh <archive> reagvis_restore_check --confirm=reagvis_restore_check`), check the course is `v19` with 7 / 13 / 115,
115 packages and 980 narration entries (`scripts/digestCmsState.ts --db=reagvis_restore_check`), then drop only that scratch database.

## 6a. Manual course deletion safeguards

Creator Studio can **permanently delete** a course that was created manually in the CMS (Course Settings → Danger Zone). Archive is
the normal, reversible action and is unchanged. Permanent deletion is enforced by the backend, not the UI:

- admin only (anonymous 401, learner 403); the signed-in admin must re-enter their **current password** (checked server side
  against that same admin) and type the exact course title; wrong values are rejected with no change;
- Machine Learning Foundations, DSA and any course not created through the CMS (or marked `systemProtected`) can never be deleted;
- blocked while any learner is pinned to the course, while learner progress exists, or while another course's checkpoints list one
  of its checkpoints as a prerequisite;
- deletes only data the course owns (versions including the draft, snapshots, its animation package revisions and narration);
  a package still referenced by another course is kept;
- writes a permanent audit entry (`cmsAuditLog`, action `COURSE_PERMANENTLY_DELETED`: course id and title, admin id, time,
  counts; never a password, hash or token). A standalone Mongo server cannot roll back a half-finished deletion, so the order is
  children first, the course record last, audit last; a failed attempt leaves the course visible and it can simply be retried.
  Use a replica set (Atlas) in production for full transactions;
- password attempts are rate limited (10 per 15 minutes per admin).

Take a backup before deleting a course you may want back: deletion cannot be undone.

## 7. Smoke test after deploy

1. `GET /api/v1/health` → 200 and `GET /api/v1/ready` → 200. 2. Open the site: sign-in page, **Create Account** with a fresh email →
lands on the Course Library showing *Machine Learning Foundations*. 3. Enter, *Begin the Meadow Trail*, open lesson 1: text,
animation with explanation panel, **PLAY** advances, narration plays (the *Narration controls* group and the AI-generated
disclosure are visible), Quick Check, **Complete Checkpoint** → +30 XP. 4. Refresh, log out, log in: progress still 1 / 115.
5. As admin (promoted as above): open Creator Studio; Machine Learning Foundations shows no *Course Settings* tab and cannot be
permanently deleted; create a throwaway course, confirm it appears in the learner library once published, then delete it with
the Danger Zone and confirm it is gone. 6. Take the first backup.

## 8. Rollback

- Bad curriculum publish (the previous version stays readable): CMS → versions → activate the previous version (`POST /cms/courses/:id/versions/:versionId/activate`);
  learners stay pinned to their own version unless repinned with `backend/scripts/repinLearner.ts`.
- Bad deploy / data damage: stop the API, restore the latest backup into a new database, point `MONGO_DB_NAME` at it,
  start the API. Re-run the smoke test.

## 9. Known pilot limits

Single backend instance; in-memory rate limits; Chrome/Edge on desktop/laptop recommended (mobile is usable, not polished);
access tokens are kept in `localStorage`; no URL deep links to lessons; the QA accounts in the development database are not
part of any release (`backend/scripts/cleanupQaData.ts` removes them locally — dry-run by default). The CMS speech engine is not
included in production (Mode A); permanent course deletion cannot be undone.
