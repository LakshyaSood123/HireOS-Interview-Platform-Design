# Backend Integration — API Contract

Base URL `/api/v1`. Machine-readable spec: [`openapi.yaml`](./openapi.yaml), served at
`/api/v1/docs`.

---

## Shared rules

Every endpoint except `/health`, `/auth/register`, `/auth/login` and `/auth/refresh` needs
`Authorization: Bearer <accessToken>`. The user id always comes from the token; a `userId` in a
body is ignored.

```json
{ "data": { }, "meta": { "requestId": "req_7f1c" } }
```

```json
{ "error": { "code": "MODULE_LOCKED", "message": "Complete Recursion first.",
             "details": { "missingPrerequisites": ["recursion-5"] }, "requestId": "req_7f1c" } }
```

| Code | HTTP | When |
|---|---|---|
| `UNAUTHENTICATED` | 401 | missing or expired token |
| `FORBIDDEN` | 403 | resource belongs to another user |
| `NOT_FOUND` | 404 | unknown id |
| `VALIDATION_ERROR` | 400 | Zod rejected the request |
| `MODULE_LOCKED` / `CHECKPOINT_LOCKED` | 409 | prerequisites not met |
| `RUNNER_UNAVAILABLE` | 503 | execution provider down |
| `RATE_LIMITED` | 429 | too many requests |

`ALREADY_COMPLETED`, `COMPILE_ERROR` and `EXECUTION_TIMEOUT` are **not** HTTP errors — they come
back inside a 200 as `alreadyCompleted: true` or as a submission `status`.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness + database reachable |
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` | account and session |
| GET | `/users/me` | profile |
| GET | `/me/courses/{courseId}/state` | full learner snapshot, used on app boot |
| PUT | `/me/courses/{courseId}/active` | set active module / checkpoint |
| POST | `/me/modules/{moduleId}/start` | start a module; locked ones are rejected |
| GET | `/me/modules/{moduleId}/progress` | states for a roadmap refresh |
| POST | `/me/checkpoints/{checkpointId}/complete` | complete + rewards, safe to repeat |
| POST | `/me/attempts` | record a quick-check or quiz answer |
| GET · PUT / DELETE | `/me/notes` · `/me/notes/{noteId}` | list notes · save or delete one note |
| POST | `/code/run` | visible tests only — never rewards |
| POST | `/code/submit` | server-side hidden fixtures, stored, may complete the checkpoint |
| GET | `/me/submissions` | history |
| POST | `/interviews/handoff` | store the interview result |
| GET | `/me/recommendations` · POST `/me/recommendations/{key}/dismiss` | next steps |
| GET | `/practice` | practice metadata |
| GET | `/me/analytics/summary` · `/me/activity` | analytics |
| GET | `/lesson-assets` | image paths for a module or checkpoint |
| **ADMIN CMS** — `requireRole("admin")`, Phase 3B | | |
| GET | `/cms/courses` | list every CMS-authored course and its draft/published pointers |
| GET | `/cms/courses/{courseId}/draft` | load the one mutable draft, materializing it from the active published version on first use |
| PATCH | `/cms/courses/{courseId}/draft` | replace the draft's content; optimistic concurrency via `expectedRevision` |
| GET | `/cms/courses/{courseId}/draft/validate` | re-run server-side structural validation without publishing |
| POST | `/cms/courses/{courseId}/draft/publish` | validate → create an immutable published version → derive and activate its `curriculumSnapshot` |
| POST | `/cms/courses/{courseId}/draft/reset` | discard the draft, recreate it from the currently active published version |
| GET | `/cms/courses/{courseId}/versions` | list every published/archived version (drafts excluded) |
| POST | `/cms/courses/{courseId}/versions/{versionId}/activate` | rollback — reactivate an older, already-published version |
| **LEARNER** — `requireAuth` only | | |
| GET | `/courses/{courseId}/published` | the currently active published version's full content |
| GET | `/courses/{courseId}/versions/{versionId}` | one exact published version's content, for a learner pinned to it |
| GET | `/me/courses/{courseId}/content` | the CALLING learner's own pinned version's content, resolved server-side from `courseProgress.curriculumVersion` |

---

## CMS authoring & publishing (Phase 3B)

The CMS owns *authored content* (`cmsCourses` + `cmsCourseVersions`) — the same split as the rest of
this contract: Keshav's backend continues to own accounts, progress, XP, streak, attempts and notes.
`curriculumSnapshots` (the ID-structure-only table the learning endpoints above already read) is
never edited directly; it is *derived* from a published CMS version at publish time and is
overwritten wholesale on every publish or rollback, never patched.

**One mutable draft per course.** `PATCH .../draft` requires the caller's last-seen `revision`
(`expectedRevision`) and rejects a stale write with `VALIDATION_ERROR` (400) rather than silently
overwriting another admin's edit — the same optimistic-concurrency shape `curriculumSnapshots`
already uses for its own `{courseId, version}` uniqueness, one level up.

**Server-side validation is authoritative.** Every field the frontend's own `dsaDraftValidation.ts`
checks for editor UX is re-checked here before a publish is accepted — duplicate ids, broken
hierarchy references, out-of-range quick-check answers, unknown animation ids (checked against the
backend's own hand-maintained `animationIds.ts`, independent of any frontend import), and coding
activities: a new CMS-authored activity always starts `executionMode: "disabled"`; `"piston"` is
only accepted when `harnessKey` matches the backend's own copy of the Family A allowlist
(`pistonHarnessKeys.ts`). The CMS never stores a shell command or executable code — only that
reference key. A request that is Zod-shape-valid but violates a business rule gets a 200 save and a
non-empty `issues[]` from `.../draft/validate`; publish itself always re-validates and refuses with
`VALIDATION_ERROR` if any issue remains.

**Publish is one atomic transaction:** re-validate → insert the new immutable `cmsCourseVersions`
document (`status: "published"`, `versionId` is the next sequential `"v" + n`, never a date) → build
the derived `curriculumSnapshot` from it → flip that snapshot active and the previous one inactive →
update `cmsCourses.latestPublishedVersion` → delete the now-superseded draft. Every published version
is retained forever; publishing never deletes or mutates an earlier one.

**Version pinning.** A learner's `courseProgress.curriculumVersion` (unchanged, still Keshav's field)
says which version they progressed against. Content resolution must not drift from that: `GET
/courses/{courseId}/published` always answers with whatever is *currently* active, but `GET
/courses/{courseId}/versions/{versionId}` resolves one exact, immutable, previously-published version
— so a learner pinned to `v1` keeps reading `v1` content even after `v2` becomes the default. This is
what prevents `progress=v1, content=v2` from ever happening silently.

The frontend should not have to know or guess which `versionId` to ask for. `GET
/me/courses/{courseId}/content` resolves the CALLING learner's own pin server-side — it reads their
`courseProgress.curriculumVersion` and returns exactly that version's content (or, if they have no
progress row yet, whichever version is currently active — what enrolling them right now would pin
them to). This is the endpoint lesson content should actually be fetched from; `/published` is a
"whatever is live right now" convenience, correct only for a learner who happens to already be
pinned to it.

**Rollback** (`POST .../versions/{versionId}/activate`) only moves the `latestPublishedVersion`
pointer (and the matching active `curriculumSnapshot`) back to an older, already-published version.
It never deletes a newer version and never touches an existing learner's pinned
`curriculumVersion` — new enrollments see the reactivated version; existing learners are unaffected.

**Bootstrap.** The very first CMS version of the DSA course is created by an explicit, idempotent
script — `npm run bootstrap:dsa-cms` (`backend/scripts/bootstrapDsaCms.ts`) — never run automatically
on boot. It maps the frontend's already-lossless `importStaticDsaCourse()` output onto this backend's
independently-defined CMS content DTO and publishes it as `v1`. Running it again once the course is
already bootstrapped is a no-op; further changes go through the draft/publish API above, never
through the bootstrap script again.

---

## Examples

### Hydration — the call the app makes on boot

`GET /me/courses/dsa-foundations/state`

```json
{
  "data": {
    "courseId": "dsa-foundations",
    "curriculumVersion": "2026-09-16",
    "progress": {
      "activeCourseId": "dsa-foundations",
      "activeZoneId": "recursive-forest",
      "activeModuleId": "trees",
      "activeCheckpointId": "trees-3",
      "completedCheckpointIds": ["foundations-1", "trees-1", "trees-2"],
      "masteredCheckpointIds": ["foundations-5"],
      "xp": 640, "lives": 3, "streak": 4, "lastActivityDate": "2026-09-19"
    },
    "moduleStates": { "foundations": "completed", "trees": "current", "graphs": "locked" },
    "zoneStates": { "basecamp": "completed", "recursive-forest": "current" }
  },
  "meta": { "requestId": "req_02" }
}
```

`progress` is field-for-field the frontend's `LearnerProgressState`, so `ApiProgressRepository`
returns it unchanged. `moduleStates` and `zoneStates` are a convenience — the frontend may keep
computing them locally; both sides use the same rules.

### Starting a locked module

`POST /me/modules/trees/start`

```json
{ "error": { "code": "MODULE_LOCKED", "message": "Complete Recursion before starting Trees.",
             "details": { "moduleId": "trees", "missingPrerequisites": ["recursion-5"] },
             "requestId": "req_03" } }
```

Checked against the stored prerequisite graph, so it holds even if the UI is bypassed. The same
check guards `PUT …/active` and `POST …/complete`, which return `CHECKPOINT_LOCKED` in the same
shape — one lock rule behind three doors.

Module names in the message are the registry's own, verbatim. The example above reads *"Trees"*;
the registry titles that module *"Ancient Canopy"*, so that is what the server actually says. The
backend does not rename the frontend's world.

### Completing a checkpoint

`POST /me/checkpoints/trees-3/complete` → `{ "courseId": "dsa-foundations", "source": "submit" }`

`source` is `submit`, `quick-check`, `reading`, `manual` (the default) or `import` — the last marks
a completion replayed from a browser's signed-out progress on first sign-in. It is written to the
ledger row and never changes the reward.

```json
{
  "data": {
    "alreadyCompleted": false,
    "rewards": { "xpAwarded": 40, "masteryAwarded": false, "livesDelta": 0, "streak": 5 },
    "progress": { "activeCheckpointId": "trees-4", "xp": 680, "lives": 3, "streak": 5, "…": "…" },
    "unlocked": { "checkpointIds": ["trees-4"], "moduleIds": [] }
  },
  "meta": { "requestId": "req_04" }
}
```

Calling it again — retry, double-click, or reviewing a finished module — returns 200 with
`"alreadyCompleted": true`, `xpAwarded: 0` and identical progress. Ten of them at once return one
reward and nine of those, because the ledger row is written before the XP and the unique key
settles the race.

`unlocked` is computed by diffing derived states before and after the write, so it always agrees
with what the roadmap will draw. A module's terminal checkpoint pays `xp + masteryXp` and joins
`masteredCheckpointIds`; both numbers come from the curriculum, never from a constant in the
server.

### Run (never rewards)

`POST /code/run`

```json
{ "courseId": "dsa-foundations", "checkpointId": "trees-3", "activityId": "trees-3-code",
  "language": "cpp", "code": "#include <vector>\nvoid inorder() {}" }
```

```json
{
  "data": {
    "status": "failed", "testsPassed": 1, "testsTotal": 3, "runtimeMs": 42,
    "stdout": "", "stderr": "", "compileOutput": "",
    "tests": [
      { "id": "t1", "description": "single node", "status": "passed", "input": "[1]", "expected": "[1]", "received": "[1]" },
      { "id": "t2", "description": "left-skewed", "status": "failed", "input": "[2,1]", "expected": "[1,2]", "received": "[2]" }
    ],
    "provider": "mock", "rewarded": false
  },
  "meta": { "requestId": "req_05" }
}
```

`rewarded` is always false here. Nothing is stored and no progress changes. Run executes the
**visible/sample tests only** — it never touches hidden fixtures.

`provider` names the engine that produced the result — `piston` (self-hosted, real Python/C++/Java
execution) or `mock` (tests, offline development, infrastructure fallback).

### Submit

`POST /code/submit` — same body. Runs hidden tests, stores the submission, and completes the
checkpoint in the same call when it passes:

```json
{
  "data": {
    "submissionId": "66f1bb", "status": "passed",
    "testsPassed": 6, "testsTotal": 6, "runtimeMs": 88, "provider": "mock",
    "completion": { "checkpointId": "trees-3", "alreadyCompleted": false,
                    "rewards": { "xpAwarded": 40, "masteryAwarded": false, "livesDelta": 0 } }
  },
  "meta": { "requestId": "req_06" }
}
```

The submitted source code is stored with the result; runs are not.

A failed submit returns `status: "failed"` with `livesDelta: -1` (floored at 0), matching
`progressEngine.recordFailedSubmit`. A compile error returns `status: "compile-error"` with
`compileOutput` filled in — still HTTP 200, because a failed compile is a real result.

**v1 accepts `python`, `cpp` and `java`**; anything else is a `VALIDATION_ERROR`. `c` is not
accepted. Both endpoints execute through the self-hosted Piston service.

### Execution results vs. runner outages

These are different things and the API must not blur them.

| Situation | HTTP | `status` | Notes |
|---|---|---|---|
| Tests pass | 200 | `passed` | Submit may complete the checkpoint |
| Wrong answer | 200 | `failed` | Real result. `livesDelta: -1` on submit |
| Compile error | 200 | `compile-error` | Real result. `compileOutput` filled in |
| Runtime error | 200 | `runtime-error` | Real result. `stderr` filled in |
| Time limit exceeded | 200 | `timeout` | Real result, produced by Piston's limits |
| **Piston unreachable** | 503 | — | `RUNNER_UNAVAILABLE`. **Not** a learner failure |

A `503` costs no lives, stores no submission and awards nothing. The `mock` provider exists for
tests and offline development; it must never be used to manufacture a pass or fail when the real
runner is down.

### Hidden tests

`/code/submit` judges against **server-side fixtures** in `judgeFixtures`, not the `hiddenTests`
bundled into the frontend — those ship to the browser and are readable by any learner.

A failed hidden test returns its `id`, `description` and `status` only. Its `input` and `expected`
are never serialized into a response.

### Notes (upsert by the note's own id)

`PUT /me/notes/note-1726900000000`

```json
{ "courseId": "dsa-foundations", "moduleId": "trees", "lessonId": "trees-3",
  "text": "Inorder = left, node, right." }
```

```json
{ "data": { "id": "note-1726900000000", "courseId": "dsa-foundations", "moduleId": "trees",
            "lessonId": "trees-3", "text": "Inorder = left, node, right.",
            "createdAt": "2026-09-19T11:45:00Z", "updatedAt": "2026-09-19T11:45:00Z" },
  "meta": { "requestId": "req_08" } }
```

Creates the note, or replaces it if the id exists — the same request twice leaves one note. The
Notes panel keeps several notes per lesson and mints each id itself, so the id, not the lesson, is
what a save is keyed on. Ids are unique per user: every query carries the token's user, so two
learners with the same id each have their own note. `lessonId` is the checkpoint id; when it is
set, `moduleId` is read from the curriculum. `DELETE /me/notes/{noteId}` is `204`, then `404` —
and `404` too for an id that belongs to someone else, never `403`, which would confirm it exists.

`GET /me/notes?courseId=dsa-foundations` lists the caller's notes in a course, oldest first, up to
`limit` (default 100, max 200) per page. `meta.nextCursor` fetches the next page and is `null` on
the last. `moduleId` and `lessonId` narrow it.

**Changed at Day 3** from `PUT /me/notes`, an upsert by lesson. That shape assumed one note per
lesson; the Notes panel has many, and under it every second note on a lesson would have replaced
the first. The endpoint count is unchanged.

### Interview result

`POST /interviews/handoff`

```json
{ "sourceSessionId": "hireos-sess-8821", "recommendedCourseId": "dsa-foundations",
  "weakSkills": ["Trees & Binary Search Trees", "Graph Traversal (BFS / DFS)"],
  "startingModuleId": "trees", "difficulty": "normal", "targetCompanyIds": [] }
```

```json
{ "data": { "interviewSessionId": "66f3ee", "resolvedStartingModuleId": "trees",
            "skillSignals": [ { "skillId": "trees", "strength": "weak", "score": 0.35 },
                              { "skillId": "graphs", "strength": "weak", "score": 0.4 } ] },
  "meta": { "requestId": "req_08" } }
```

The server checks the course and module ids exist. It never interprets display labels beyond the
weak-skill lookup table.

### Recommendations

`GET /me/recommendations?courseId=dsa-foundations`

```json
{ "data": [
    { "key": "resume:trees-3", "type": "resume", "targetId": "trees-3", "priority": 1,
      "reasonCode": "CURRENT_MODULE_INCOMPLETE",
      "reasonText": "You're partway through Trees — finish checkpoint 3 first." },
    { "key": "review:graphs", "type": "review", "targetId": "graphs", "priority": 2,
      "reasonCode": "WEAK_SKILL_FROM_INTERVIEW",
      "reasonText": "Your interview showed graph traversal as a weak area." }
  ],
  "meta": { "requestId": "req_09" } }
```

The v1 rules, in priority order:

| # | Rule | `reasonCode` |
|---|---|---|
| 1 | Current module incomplete → resume it | `CURRENT_MODULE_INCOMPLETE` |
| 2 | Interview weak skill maps to an unlocked module | `WEAK_SKILL_FROM_INTERVIEW` |
| 3 | 3+ failed submits on one checkpoint → review or easier practice | `REPEATED_FAILURES` |
| 4 | Completed but not mastered → offer review, never reset | `COMPLETED_LOW_MASTERY` |
| 5 | Nothing pending → one newly unlocked module in course order | `NEXT_AVAILABLE_MODULE` |
| 6 | Target company selected → bias practice only, never locks | `COMPANY_TARGET` |

No machine learning. Every recommendation carries its reason so the UI can show it.

### Lesson images

`GET /lesson-assets?courseId=dsa-foundations&checkpointId=trees-3`

```json
{ "data": [ { "assetKey": "trees-3.traversal-diagram", "kind": "image", "location": "local",
              "path": "/assets/lessons/trees/inorder-traversal.svg",
              "alt": "In-order traversal visiting left, node, then right" } ],
  "meta": { "requestId": "req_10" } }
```

Paths only — the frontend loads the file itself.

### Analytics summary

`GET /me/analytics/summary?courseId=dsa-foundations`

```json
{ "data": { "completionPercent": 12.1, "checkpointsCompleted": 13, "checkpointsTotal": 107,
            "modulesCompleted": 2, "modulesTotal": 29, "xp": 680, "lives": 3, "streak": 5,
            "submissions": { "total": 18, "passed": 11, "successRate": 0.61 },
            "weakTopics": [ { "moduleId": "trees", "failedSubmits": 4 } ],
            "needsReview": ["foundations-4"] },
  "meta": { "requestId": "req_11" } }
```

---

## Limits

| Group | Limit |
|---|---|
| `/auth/login`, `/auth/register` | 10 per 15 min per IP |
| `/code/run` | 30 per minute per user |
| `/code/submit` | 10 per minute per user |
| everything else | 120 per minute per user |

Source code capped at 64 KB; stdout, stderr and compile output truncated to 32 KB each.
