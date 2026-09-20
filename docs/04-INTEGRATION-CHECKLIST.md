# Backend Integration — Checklist

The twelve questions the requirements document says must be answerable before coding starts.
Short answers; detail is in the [schema](./02-DATABASE-SCHEMA.md) and
[API contract](./03-API-CONTRACT.md).

**1. Where are the canonical IDs defined?**
`courseRegistry.ts`, `content/dsaSkeleton.ts` (zones) and `scripts/validateCurriculum.ts`
(the 29 module ids). Listed in [plan §4](./01-BACKEND-PLAN.md#4-canonical-ids). Display names are
never used as keys.

**2. What does the server store vs. derive?**
Stores the facts: completed and mastered checkpoint ids, the active zone/module/checkpoint, XP,
lives, streak, last activity date, attempt counts. Derives every locked / available / current /
completed / mastered state from the prerequisite graph, the same way `progressEngine.ts` does.

**3. How is duplicate completion made idempotent?**
A `rewardEvents` document with unique key `complete:<checkpointId>`, inserted before the XP
update. A duplicate key means already completed → zero XP, `alreadyCompleted: true`.

**4. How is existing localStorage progress handled?**
On first login the adapter runs the existing `migrateLegacyCheckpointIds()` on the local snapshot
and uploads it **only if the server has no progress for that user**. Otherwise the server wins and
the local copy is cleared. Demo bootstrap data is not imported.

**5. How do review and preview avoid XP changes?**
Review takes the idempotent path above. Preview never calls the backend — `ReagvisTrailPage.tsx`
already replaces `onComplete` and `onFailedSubmit` with no-ops while previewing.

**6. How do the adapters satisfy the existing frontend interfaces?**

| Interface | Method | Call |
|---|---|---|
| `ProgressRepository` | `load` | `GET /me/courses/{id}/state` → return `data.progress` |
| | `save` | debounced `PUT /me/courses/{id}/active` + the completion calls |
| `NotesRepository` | `list` / `save` / `delete` | `GET` / `PUT` / `DELETE /me/notes` |
| `CodeRunner` | `run` / `submit` | `POST /code/run` / `POST /code/submit` |
| `RecommendationProvider` | `getHandoff` | `GET /me/recommendations` |

The response bodies were designed around these interfaces, not the other way round.

**7. How are locked module starts rejected outside the UI?**
`POST /me/modules/{id}/start` checks the module's first checkpoint's prerequisites against the
user's completed list, server-side. Same check guards setting the active checkpoint and completing
one. Returns 409 with the missing prerequisite ids.

**8. Where does code execute, and what isolates it?**
Never in the API process, and never as a host child-process compiler. Both endpoints call a
`CodeExecutionProvider`, which has two implementations: `piston` (the self-hosted Piston service —
the default, real compile and execution) and `mock` (executes nothing; automated tests, offline
work, and infrastructure-only fallback).

Piston provides the isolation, timeouts and memory caps. The proposed `local-gcc` runner is
**dropped** — it would run learner code on the host without container-level isolation, and Piston
already does the job properly. Languages in v1: **Python, C++ and Java**.

**8b. When is a failure a runner outage?**
Only when Piston is unreachable or failing its health check → HTTP 503 `RUNNER_UNAVAILABLE`, which
costs no lives, stores nothing and awards nothing. Wrong answer, compile error, runtime error and
timeout are **real execution results** returned with HTTP 200. The mock provider must never be used
to manufacture a pass or fail when the real runner is down.

**8c. Where do hidden tests live?**
In the `judgeFixtures` collection, server-side. The frontend's bundled `hiddenTests` ship inside
the client bundle, so they are readable by any learner and are not trusted for judging. A failed
hidden test returns its `id`, `description` and `status` only — never its input or expected value.

**9. How do interview weak skills map to module ids?**
A lookup table next to the curriculum seeder maps each known skill label to module ids. Unknown
labels are stored as-is and produce no signal. Course and module ids are validated against the
stored curriculum snapshot.

**10. What is the recommendation logic?**
Six deterministic rules in priority order — see [API contract](./03-API-CONTRACT.md#recommendations).
Each one carries a `reasonCode` and human-readable `reasonText`. No ML.

**11. What is private, and how is ownership enforced?**
Private: progress, notes, attempts, submissions, interview sessions, recommendations, activity.
The user id comes from the verified token and is injected into every query by the service layer.
Reference collections are read-only and non-private.

**12. What are the setup, test and health commands?**

```bash
cp .env.example .env           # PORT, MONGO_URI (Atlas), JWT secrets, PISTON_URL
npm install
npm run dev                    # serves on PORT (default 4883); nothing to install locally
npm run seed                   # curriculum + practice items + judge fixtures + demo user
npm test                       # unit + integration, in-memory mongo, EXECUTION_PROVIDER=mock
curl localhost:4883/api/v1/health
# Swagger: http://localhost:4883/api/v1/docs
```

No Docker in v1 and no migration command — both by decision. Indexes are created on boot.
