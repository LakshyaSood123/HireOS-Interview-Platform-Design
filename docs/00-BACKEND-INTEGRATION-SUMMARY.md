# Backend Integration Plan (v1)

---

## Current State

| | |
|---|---|
| Frontend baseline | `frontend/dsa-world-v2` @ `99e1d72` — *"Redesign lesson workspace for desktop learning"* |
| My branch | `backend/keshav-current-baseline` (branched from that exact commit) |
| Merge plan | Smaller reviewable pull requests into the frontend branch — **not** one large merge at the end |
| Backend code | [`backend/`](../backend) — a self-contained npm workspace, because the repo root `src/` is the frontend app |
| Progress | Days 0 and 1 complete. Day 2 (progress, XP, lives, streak) is next. |

---

## Separation of Concerns

| Frontend keeps | Backend takes over |
|---|---|
| Lesson text, questions and learning content | Accounts, login and sessions |
| Module / checkpoint definitions | Persistent progress, XP, lives, streak |
| World / scenic visuals and lesson visuals | Notes and learning attempts |
| Animations + synchronized Code Trace | Code submission records |
| Current lesson / coding UI | Interview handoff, recommendations, analytics |
| Frontend progression presentation | Server-side prerequisite validation |

**Coordinate — do not change alone:** the lesson and coding UI, Course Library, world map and
roadmaps, animations and Code Trace, curriculum text and questions, starter/demo solutions, the
Piston harness and gateway, the current lesson-layout redesign, and global styling/navigation.

One rule behind all of it: **the backend never becomes a second curriculum.** It stores only the
course's ID structure (ids, order, XP, prerequisites) so it can verify a locked module server-side.
No lesson content is copied into the database.

---

## Stack

Node.js + Express + MongoDB + Mongoose, TypeScript, Zod for validation, JWT for auth,
`openapi.yaml` + Swagger for the contract.

The database is **MongoDB Atlas** — a hosted cluster reached by a connection string in `.env`,
nothing installed on anyone's machine. It runs with two commands, `npm install` and `npm run dev`.
**No Docker
or containers in v1**, so anyone can start it and look at it without extra setup. Containers are
future scope, along with the CMS.

---

## Data model — 12 collections

| Collection | Holds |
|---|---|
| `users` | email, hashed password, name |
| `refreshTokens` | login sessions, revocable |
| `courseProgress` | **the main one** — one document per user per course, holding the whole learner state |
| `rewardEvents` | XP ledger; its unique key is what stops duplicate XP |
| `notes` | one note per lesson, private per user |
| `learningAttempts` | quick-check / quiz answers |
| `codeSubmissions` | submitted code and its test results |
| `interviewSessions` | the HireOS result and its weak skills |
| `curriculumSnapshots` | course ID structure only — no lesson text |
| `practiceItems` | question metadata and company tags |
| `lessonAssets` | **image paths / URLs only**, never image files |
| `judgeFixtures` | **server-side hidden test fixtures** — never returned in any response |

`courseProgress` is shaped exactly like the frontend's `LearnerProgressState`, so the frontend can
use the response directly.

---

## API — 25 endpoints under `/api/v1`

| Group | Endpoints |
|---|---|
| System | health check |
| Auth | register, login, refresh, logout, `/users/me` |
| Learning | course state, set active, start module, module progress, complete checkpoint, attempts |
| Notes | list, upsert, delete |
| Code | run, submit, submission history |
| Interview | store the interview result |
| Recommendations | list, dismiss |
| Practice / Analytics / Assets | practice list, summary, activity feed, lesson image paths |

Every response is `{ data, meta }` or `{ error: { code, message, details } }`.

---

## The four integration points

Only four frontend files gain a new class. No component is touched.

| Today | Becomes | Backed by |
|---|---|---|
| `LocalProgressRepository` | `ApiProgressRepository` | `GET /me/courses/{id}/state` |
| `LocalNotesRepository` | `ApiNotesRepository` | `/me/notes` |
| `MockCodeRunner` | `ApiCodeRunner` | `/code/run`, `/code/submit` |
| `MockRecommendationProvider` | `ApiRecommendationProvider` | `/me/recommendations` |

The local versions stay in the code as the offline fallback.

---

## Five rules we protect

1. **No duplicate XP.** Completing a checkpoint writes a unique ledger key first. A repeat call
   (retry, double-click, or reviewing a finished module) returns the same state and awards zero.
2. **Locked stays locked.** The server checks prerequisites itself, so calling the API directly
   cannot unlock a module.
3. **Preview costs nothing.** The Two Pointers demo never calls the backend at all.
4. **Run never rewards.** `/code/run` uses visible/sample tests only and can never grant XP or
   complete a checkpoint. Only a passing `/code/submit` can.
5. **Hidden tests are actually hidden.** Judging fixtures move server-side. Frontend-bundled
   `hiddenTests` ship in the browser bundle, so they are not secret and are not trusted for judging.

---

## Timeline

| Day | What ships | Status |
|---|---|---|
| 0 | These documents, revised against the final handoff SHA | ✅ **Done** |
| 1 | Server skeleton, MongoDB, login, health check | ✅ **Done** |
| 2 | Progress, XP, lives, streak, locked/available logic | ▶ Next |
| 3 | Notes + the frontend adapters — progress survives logout | ⬜ |
| 4 | Code run/submit endpoints on **Piston**, server-side hidden fixtures | ⬜ |
| 5 | Interview result + recommendations | ⬜ |
| 6 | Analytics + security pass | ⬜ |
| 7 | Tests, docs, demo data, bug fixes | ⬜ |

**The compiler part is complete.** A self-hosted **Piston** service does real compile and execution
for Python, C++ and Java through the real coding interface — 14 activities real-enabled, 84/84
execution QA pass. That closes the item: there is no compiler to write, no handover to wait for,
and no "Later" row in the timeline.

So Day 4 wires the backend to the service that exists. One `CodeExecutionProvider` interface, two
implementations — `piston` (default, real execution) and `mock` (tests, offline, infrastructure
fallback) — switched by one environment variable.

The rule that matters: **a wrong answer, compile error, runtime error or timeout is a real result,
not an outage.** Only genuine runner unavailability falls back, and it returns `RUNNER_UNAVAILABLE`
rather than inventing a pass.

---

## Done means

A learner logs in, gets a recommendation from their interview, opens a module, saves a note, runs
and submits code, earns XP — then logs out, logs back in on another device, and finds exactly the
state they left. With no visual change anywhere.
