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
| GET / PUT / DELETE | `/me/notes` · `/me/notes/{noteId}` | notes |
| POST | `/code/run` | visible tests only — never rewards |
| POST | `/code/submit` | server-side hidden fixtures, stored, may complete the checkpoint |
| GET | `/me/submissions` | history |
| POST | `/interviews/handoff` | store the interview result |
| GET | `/me/recommendations` · POST `/me/recommendations/{key}/dismiss` | next steps |
| GET | `/practice` | practice metadata |
| GET | `/me/analytics/summary` · `/me/activity` | analytics |
| GET | `/lesson-assets` | image paths for a module or checkpoint |

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

Checked against the stored prerequisite graph, so it holds even if the UI is bypassed.

### Completing a checkpoint

`POST /me/checkpoints/trees-3/complete` → `{ "courseId": "dsa-foundations", "source": "submit" }`

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
`"alreadyCompleted": true`, `xpAwarded: 0` and identical progress.

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

### Notes (upsert by scope)

`PUT /me/notes`

```json
{ "courseId": "dsa-foundations", "moduleId": "trees", "lessonId": "trees-3",
  "text": "Inorder = left, node, right." }
```

Returns the saved note with its `id` and `updatedAt`, matching the frontend's `NoteRecord`.
`lessonId` is the checkpoint id.

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
