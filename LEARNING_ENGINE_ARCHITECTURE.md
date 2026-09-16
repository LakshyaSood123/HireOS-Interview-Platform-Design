# Reagvis Trails — Learning Engine Architecture

This documents the frontend-only learning-engine refactor introduced to stabilize Reagvis Trails: turning a hardcoded, single-course demo into a real (still frontend-only) course/progression architecture that can grow to other courses without rebuilding the engine.

**Nothing here is a backend.** There is still no server, API, or database — see `BACKEND_CAPABILITY_AND_GAP_AUDIT.md` for the full inventory. This document is about the frontend's internal data model and service seams, not new infrastructure.

**The HireOS interview flow remains frozen.** `src/config/developmentMode.ts` (`INTERVIEW_FLOW_ENABLED: false`) was not touched by this refactor.

**The Gemini-produced scenic design (Alpine map, cabins, mountains, trail art, HUD, typography) is unchanged.** Every edit in `BiomeTrailMap.tsx` replaces a hardcoded `status:` string with a lookup into the engine — no JSX structure, positioning, or visual asset was modified.

---

## 1. The hierarchy

```
Course
 └─ Zone
     └─ Module
         └─ Checkpoint
             └─ Lesson
                 └─ Activity
```

Defined in `src/learning/types.ts`. `Activity.type` is `"reading" | "quick-check" | "code" | "quiz" | "sql" | "simulation" | "design"` — only `reading`/`quick-check`/`code` are populated today; the others exist so the model doesn't need to change shape when SQL/simulation/design activities eventually land (explicitly not built this task).

### How it maps onto the old data (`src/data/reagvisCourses.ts`)

The old shapes (`CourseData`, `TrailNode`, `BiomeZone`, `LessonContent`) were **not deleted or rewritten** — `src/learning/courseRegistry.ts` builds the new hierarchy by wrapping them:

| Old concept | New concept | Mapping |
|---|---|---|
| `BiomeZone` (7: grove, river, cave, canopy, wilds, caverns, summit) | `Module` | 1:1 — one biome = one module |
| `TrailNode` (18, numbered 1–18) | `Checkpoint` | 1:1 — `Checkpoint.id = String(TrailNode.id)`, `Checkpoint.legacyNodeId = TrailNode.id` bridges back |
| `TrailNode.lesson` (`LessonContent`) | `Checkpoint.lesson.content` | Reused verbatim, not duplicated |
| *(new)* | `Zone` (3: zone-1/2/3) | Groups modules — zone-1 = foundations/linked-structures/recursion/trees, zone-2 = graphs/dp, zone-3 = summit. Matches the zone grouping `BiomeTrailMap.tsx`'s scenic map already renders. |

`Checkpoint.prerequisites` is derived from TrailNode order: each checkpoint depends on the one immediately before it in the flattened 1→18 sequence. This is still a linear chain today (matching the actual demo content), but it's now an explicit, inspectable graph instead of `currentLessonId + 1` arithmetic — a checkpoint can be given multiple prerequisites later without changing how progression is resolved.

---

## 2. Course registry (`src/learning/courseRegistry.ts`)

```ts
export const coursesById: Record<string, Course>
export function getCourseById(courseId: string): Course | undefined
export function isCourseAvailable(courseId: string): boolean
```

**Only `"dsa-foundations"` is registered.** Before this refactor, `AppStateContext`'s `startLearningTrail(courseId)` accepted a `courseId` argument and silently ignored it — every "Enter Trail" button opened the same hardcoded DSA data regardless of which course was requested (see `BACKEND_CAPABILITY_AND_GAP_AUDIT.md` §9/Target G). That's fixed: `startLearningTrail` now resolves the id through `isCourseAvailable`.

The other 5 cards in `libraryCourses` (`src/data/reagvisCourses.ts`) — System Design, DBMS, OS, Networks, Behavioral — are **intentionally unregistered**. `ReagvisTrailPage.tsx`'s library view now renders a disabled "Coming Soon" pill for any card where `isCourseAvailable(course.id)` is false, instead of a working "Enter Trail" button that used to silently open DSA content under the wrong course's name. No fake `Course` data was authored for them.

### Adding a real course later

1. Author its content (biomes/nodes-equivalent, or directly as `Zone[]`/`Module[]`/`Checkpoint[]`).
2. Write a `buildXCourse(): Course` factory next to `buildDsaCourse()`.
3. Add it to `coursesById`.

Nothing else needs to change — `AppStateContext`, `BiomeTrailMap`, `ReagvisTrailPage`'s library view, and the progress engine are all already course-agnostic (they operate on `Course`/`progress.activeCourseId`, not on `"dsa-foundations"` literals). The scenic rendering in `BiomeTrailMap.tsx` (the SVG art, module positions) is DSA/Alpine-themed and would need its own visual treatment per course — that's a frontend design task, not an engine change.

---

## 3. Progression states (`src/learning/progressEngine.ts`)

```ts
type ProgressState = "locked" | "available" | "current" | "completed" | "mastered"
```

Pure functions, no React, no I/O:

- `resolveCheckpointState(checkpoint, progress)` — `mastered`/`completed` from the progress snapshot's id lists; `current` if it's `progress.activeCheckpointId`; otherwise `available` if every prerequisite is completed, else `locked`.
- `resolveModuleState(module, progress)` / `resolveZoneState(zone, progress)` — roll up from their children's checkpoint/module states (completed only when every child is; current if any child is; locked if the first child is).
- `completeCheckpoint(course, progress, checkpointId)` — the checkpoint's own `xp` is credited (previously a flat `+120` regardless of which lesson), it's added to `completedCheckpointIds`, and `activeCheckpointId`/`activeModuleId`/`activeZoneId` advance to the next checkpoint in course order. This is what replaces `currentLessonId + 1`.

`BiomeTrailMap.tsx` consumes two precomputed maps instead of hardcoding status: `dsaModuleStates: Record<string, ProgressState>` and `dsaZoneStates: Record<string, ProgressState>`, exposed by `AppStateContext`. The component's own `toModuleBadgeStatus`/`toZoneBadgeStatus` helpers collapse the 5-state model down to the 3 visual states the existing badges render (`completed`/`current`/`locked`, and `active`/`locked`/`completed` for zones) — this is the **only** thing that changed inside `BiomeTrailMap.tsx`'s two previously-hardcoded arrays (`dsaModules`, `courseZones`): their `status:` literals were deleted, everything else (icons, positions, copy, SVG art) is untouched.

### Update — resolved by the Trees vertical slice

The paragraph that used to live here described Trees showing "Locked" because nodes 9–11 had no authored lesson content. That's resolved: Trees is now authored directly in the new content model (`src/learning/content/treesModule.ts`, §10 below) with 5 real checkpoints, and the demo bootstrap (§4) seeds it as genuinely `current`. The scenic map's badges and camera focus now agree with each other.

---

## 4. Demo learner bootstrap (`src/state/AppStateContext.tsx`, `buildDemoLearnerBootstrap`)

**This is explicitly a DEMO/DEVELOPMENT fixture, not a stand-in for backend seeding.** It represents what a real `InterviewToLearningHandoff` would eventually produce: the interview (mocked, frozen) diagnosed weak Trees/Graphs skills and placed the learner at the Trees module, with earlier prerequisite modules already completed.

```ts
{
  activeCourseId: "dsa-foundations",
  activeZoneId: "zone-1",
  activeModuleId: "trees",
  activeCheckpointId: "trees-1",
  completedCheckpointIds: ["1", "2", "3", "4", "5", "6", "7", "8"],
  masteredCheckpointIds: [],
  xp: 1240,
  streak: 7,
  lives: 3,
  lastActivityDate: null,
}
```

Checkpoints 1–8 (Foundations/Linked Structures/Recursion, all legacy-derived) are marked completed without the learner ever opening their lesson content — that's fine, they're only ever shown as ✓ badges in this demo, never re-entered (reviewing a legacy-completed checkpoint would hit `LessonReader`'s bare-stub fallback for nodes 5–8, which is a pre-existing, separately-scoped limitation, not something this bootstrap introduces). Trees itself is fully backed by real content (`src/learning/content/treesModule.ts`), so seeding it `current` here is honest, not faked.

---

## 5. Persistence (`src/learning/progressRepository.ts`)

```ts
export interface ProgressRepository {
  load(courseId: string): LearnerProgressState | null
  save(state: LearnerProgressState): void
  reset(courseId: string): void
}
export class LocalProgressRepository implements ProgressRepository // localStorage, key "reagvis.progress.<courseId>"
```

`AppStateContext` loads on mount (falling back to the seed above if nothing's stored or storage is unavailable — private browsing, quota, corrupted JSON all fail closed to the default rather than throwing) and saves on every progress change via a `useEffect`. **No component calls `localStorage` directly** — this is the one seam. Swapping to a real backend later means writing `ApiProgressRepository implements ProgressRepository` and changing one `new LocalProgressRepository()` call in `AppStateContext.tsx`; nothing else in the UI changes.

---

## 6. Interview → Learning handoff (`src/learning/services/recommendationProvider.ts`)

```ts
export interface InterviewToLearningHandoff {
  recommendedCourseId: string
  weakSkills: string[]
  startingModuleId?: string
  difficulty?: string
  targetCompanyIds?: string[]
}
export interface RecommendationProvider {
  getHandoff(): InterviewToLearningHandoff
}
export class MockRecommendationProvider implements RecommendationProvider
```

The interview is frozen and this **does not require it to run**. `MockRecommendationProvider` returns a fixed handoff (`recommendedCourseId: "dsa-foundations"`, matching the id already used across `dsaCourseData`/`libraryCourses`/the registry — not the shorter `"dsa"` from the task brief's illustrative example, to avoid a second id system). It's wired into `startLearningTrail()`: when called with no explicit `courseId` (e.g. a future "recommended for you" entry point), it resolves through the mock provider instead of a hardcoded string. Today this is a no-op in practice (the mock and the old hardcoded default agree), but the seam is real — a future `InterviewRecommendationProvider` reading an actual interview result implements the same interface and nothing calling `startLearningTrail()` needs to change.

---

## 7. Service seams — now wired into the Lesson Workspace

`CodeRunner`/`NotesRepository` were prepared but unwired by the previous task; the Trees vertical slice wires both into real UI (§10-§13 below). `ChallengeStage.tsx` (the legacy challenge component, used by Foundations/Linked Structures/etc.) is **still untouched** — it keeps its own inline mock, since migrating it to the shared `CodeRunner` is out of scope until those modules migrate to the new content model.

Mock → production swap path for all four services follows the same shape:

| Seam | Today | Later |
|---|---|---|
| `ProgressRepository` | `LocalProgressRepository` (localStorage) | `ApiProgressRepository` (real backend) |
| `NotesRepository` | `LocalNotesRepository` (localStorage) | `ApiNotesRepository` |
| `CodeRunner` | `MockCodeRunner` (fake timing + canned output) | `RemoteCodeRunner` (real sandboxed execution — see `BACKEND_CAPABILITY_AND_GAP_AUDIT.md` Target B) |
| `RecommendationProvider` | `MockRecommendationProvider` (fixed payload) | `InterviewRecommendationProvider` (reads a real interview result) |

---

## 8. File map

```
src/learning/
  types.ts                          Course/Zone/Module/Checkpoint/Lesson/Activity/ProgressState +
                                     TheoryBlock/TraversalVisual/TreeVizNode/CodeExample/TestCase/
                                     CodingActivityContent/QuickCheckContent/LessonWorkspaceContent +
                                     InterviewQuestionMeta/QuestionSource/QuestionRole (§16)
  courseRegistry.ts                 coursesById, getCourseById, isCourseAvailable, buildDsaCourse
                                     (now builds the full 7-zone skeleton — §12)
  legacyChallengeAdapter.ts         practiceChallengeToActivity — lets ChallengeStage.tsx call the
                                     shared MockCodeRunner (§15)
  content/
    treesModule.ts                  Authored Trees module — 5 checkpoints (unchanged this task)
    complexityModule.ts             Authored Foundations module — 5 checkpoints
    linkedListsModule.ts            Authored Linked Lists module — 5 checkpoints
    recursionModule.ts              Authored Recursion module — 5 checkpoints
    dsaSkeleton.ts                  DSA_ZONES (all 7 zones/~28 modules), buildSkeletonModule
    questionMeta.ts                 Curated InterviewQuestionMeta entries (§16)
  progressEngine.ts                 resolveCheckpointState/ModuleState/ZoneState, completeCheckpoint,
                                     recordActivity (streak), recordFailedSubmit (lives)
  progressRepository.ts             ProgressRepository, LocalProgressRepository,
                                     migrateLegacyCheckpointIds (§17)
  legacyAdapter.ts                  deriveLegacyCourseData — projects engine state back onto the
                                     old CourseData/TrailNode/BiomeZone shape for legacy consumers
  services/
    codeRunner.ts                   CodeRunner, MockCodeRunner — wired into CodeWorkspace AND
                                     ChallengeStage (§15)
    notesRepository.ts              NotesRepository, LocalNotesRepository — wired into NotesPanel
    recommendationProvider.ts       InterviewToLearningHandoff, MockRecommendationProvider

src/components/roadmap/
  ModuleRoadmap.tsx                 Data-driven module roadmap (generic — any Module)

src/components/lesson/
  LessonWorkspace.tsx                Generic lesson shell: theory -> visual -> examples ->
                                     try-it-yourself -> quick check -> completion
  BinaryTreeDiagram.tsx             Tree-specific traversal visualization (SVG, no assets)
  CodeExampleTabs.tsx                Read-only worked-example code, language tabs
  CodeWorkspace.tsx                  "Try It Yourself" — editor, Run/Submit/Hint/feedback
  QuickCheckCard.tsx                 Reusable MCQ
  NotesPanel.tsx                     Notes drawer (create/edit/delete/list)
```

`src/state/AppStateContext.tsx` is the primary place that imports from `src/learning/` on the React side. `src/components/forest/BiomeTrailMap.tsx` consumes the *results* (via `useAppState()`'s `dsaModuleStates`/`dsaZoneStates`/`activeModuleId`) rather than importing the engine directly. `src/pages/ReagvisTrailPage.tsx` is the router between the scenic map, the new roadmap/workspace screens, and the legacy lesson/challenge screens — it does import `getCourseById`/`getAllCheckpointsInOrder` directly, since it's the one place that needs to resolve "what module/checkpoint is currently being viewed."

---

## 9. What remains deliberately out of scope (this task's boundaries)

- No compiler/real code execution — `MockCodeRunner` is pattern-matching on submitted text, never `eval`s or runs anything.
- No LLM of any kind — Hint and "Explain My Mistake" are deterministic strings from content data.
- No new DSA lesson content beyond Foundations/Linked Lists/Recursion/Trees (§12/§13) — the other ~24 modules in the full skeleton (§12) are genuinely empty (`checkpoints: []`), not faked; Graphs/1D DP/Final Mastery are still the original legacy TrailNode data (nodes 12-18).
- No Grind75 or company-question dataset integration — only a small curated `InterviewQuestionMeta` set (§16), and the model supports company data without any fabricated entries.
- No backend, API, or database of any kind — confirmed zero `fetch`/`axios`/`XMLHttpRequest`/`WebSocket` anywhere in `src/`.
- No interview un-freezing — `developmentMode.ts`'s `INTERVIEW_FLOW_ENABLED: false` is untouched.
- No visual redesign of the Alpine scenic map — every scenic component (`AlpineCabin`, `AlpineMountainRange`, `AlpinePineTree`, `ScenicAnimals`, `BiomeTrailMap`'s SVG art, positions, copy) is pixel-identical to before this task, except the small id-only fixes in §12 (zone dropdown ids, "Review Lessons" routing) needed to keep the existing badges accurate under the new data model. The Module Roadmap / Lesson Workspace screens remain a deliberately different, more focused visual register, reusing the app's existing cream/forest-green palette rather than Alpine assets.

---

## 10. The Trees vertical slice

The first (and so far only) module built on the new Lesson Workspace content model — proof that the architecture in §1-§8 works end-to-end, not just in the abstract.

### Content: 5 checkpoints (`src/learning/content/treesModule.ts`)

1. **Tree Foundations** — terminology (root/leaf/depth/height), binary trees. Theory + 1 quick check. +30 XP.
2. **Traversals** — DFS vs BFS, preorder/inorder/postorder, level order. Theory + `BinaryTreeDiagram` visual + read-only preorder code examples (Python/C++/Java) + 1 quick check. +30 XP.
3. **DFS / BFS Code Lab** — implement `preorderTraversal(root)`. The first real coding activity: 3 visible tests, 3 hidden tests (including an empty-tree edge case). +40 XP.
4. **Binary Search Trees** — BST invariant, search, insert. Theory + quick check + a second coding activity (`searchBST`). +40 XP.
5. **Trees Interview Challenge** — `isBalanced(root)`, an interview-style height-balance check. Completing it also grants module **mastery**: +60 XP + 100 mastery XP, and the checkpoint (and therefore the module) resolves to `"mastered"` instead of just `"completed"`.

Each checkpoint's `prerequisites` chains strictly off the one before it — same linear model as the legacy checkpoints, just now covering genuinely new content instead of TrailNodes 9-11 (which had none). `courseRegistry.ts`'s `buildDsaCourse()` splices this authored module in at the `"trees"` module id (so `BiomeTrailMap.tsx`'s existing scenic tile keeps working unmodified) and repoints the Graphs module's first prerequisite at Trees' new terminal checkpoint, so the overall course sequence stays connected.

### Navigation: Course World → Roadmap → Workspace

`AppStateContext.tsx`'s `enterModule(moduleId)` checks the module's `contentKind`: `"workspace"` (Trees) opens `ModuleRoadmap`; anything else (`"legacy"`, the default) keeps using the original `LessonReader`/`ChallengeStage` flow. `BiomeTrailMap.tsx`'s three "Enter/Resume" buttons were consolidated into one `handleStartActiveLesson` that always calls `onEnterModule(activeModuleId)` — the routing decision lives in one place (`enterModule`), not duplicated across buttons.

`ModuleRoadmap` renders whatever `Module`/`checkpointStates` it's given — no per-checkpoint JSX, no Trees-specific logic. Checkpoint cards are clickable when `state !== "locked"`; locked cards show "Complete '<previous checkpoint>' first."

`LessonWorkspace` renders a checkpoint's `workspace` content top-to-bottom (theory → optional visual → optional read-only examples → optional coding activity → optional quick check → Continue), and is not Trees-specific — a future DBMS checkpoint reuses the exact same component with a SQL `CodingActivityContent` and no `visual`.

### CodeRunner: `MockCodeRunner` (`src/learning/services/codeRunner.ts`)

Still 100% mocked — no `eval`, no execution, no network call. `run()`/`submit()` return a structured `CodeRunResult` (`status`, `testsPassed`/`totalTests`, per-test `input`/`expected`/`received`), replacing the old `ChallengeStage.tsx` pattern of printing one hardcoded success string regardless of input.

The heuristic (`evaluate()` in `codeRunner.ts`) checks, per submission:
- **Empty code** → `status: "empty"`, "Write a solution before running/submitting."
- **Unchanged starter code** (normalized string match) → `status: "unchanged"`, "still looks like the starter code."
- **Otherwise**, per test: passes only if the function name is present, a control-flow signal exists (recursive self-call or a loop/queue), keyword coverage (e.g. `left`/`right`) is complete, and — only for tests whose description mentions "empty" — the code contains a recognizable null/empty guard (`not root`, `root == null`, `!root`, etc.).

`run()` evaluates `activity.visibleTests`; `submit()` evaluates `activity.hiddenTests` — genuinely different test sets, so a submission can pass Run's visible tests (no empty-tree case) and still fail Submit's hidden empty-tree test, exactly like a real judge's visible/hidden split. This is pattern matching on text, not static analysis or execution — documented in the file so nobody mistakes it for something it isn't.

### Notes: wired into `LessonWorkspace` via `NotesPanel`

A "📝 Notes" button opens a drawer backed by `LocalNotesRepository`, scoped to `courseId`/`moduleId`/`lessonId` (= the checkpoint id). Create/edit/delete, persisted to `localStorage["reagvis.notes.<courseId>"]`, survives a refresh (verified manually — see §13).

### XP, lives, streak

- **XP**: each checkpoint's `xp` (and, for the terminal checkpoint, `masteryXp`) is data, not a UI constant — `completeCheckpoint()` in `progressEngine.ts` is the only place XP is calculated. Reopening a completed checkpoint never re-awards XP (`completeCheckpointById` no-ops if the checkpoint is already in `completedCheckpointIds`/`masteredCheckpointIds`).
- **Lives**: `DEFAULT_LIVES = 3`. `CodeWorkspace`'s Run never costs a life; Hint never costs a life; a failed Submit calls `recordFailedSubmit()` (`-1`, floored at 0); a successful Submit costs nothing. Reaching 0 shows a soft message ("You've used your current attempts...") rather than locking anything.
- **Streak**: `recordActivity(progress, today)` runs inside every `completeCheckpoint()` call. Same calendar day as `lastActivityDate` → unchanged; exactly one day later → `+1`; any bigger gap (or no prior activity) → resets to `1`. No timezone handling — `today` is the caller's local `Date`, formatted `YYYY-MM-DD`, passed in rather than read internally so the function stays pure and testable.

### Manually verified end-to-end (headless Chromium, fresh `localStorage`)

Course World → "Enter Module" (Trees, badge correctly reads "Active/Current" thanks to the demo bootstrap) → Module Roadmap (5 checkpoints, correct locked/current badges) → Tree Foundations (theory renders, quick check works, "Complete Checkpoint" disabled until answered) → completion celebration → Continue → Traversals (visual renders with all 3 traversal tabs matching the spec exactly, code example tabs work) → DFS/BFS Code Lab: empty Run correctly rejected, unchanged-starter Run correctly rejected, a partial attempt (missing `right`) correctly fails all visible tests with input/expected/received breakdown, a correct attempt passes 3/3 visible and 3/3 hidden tests including the empty-tree case → Submit Accepted, "Complete Checkpoint" enabled → a second submission *without* a null guard correctly fails only the hidden "Empty tree" test (2/3) and **lives dropped 3 → 2** → "Explain My Mistake" reveals the configured feedback text → Notes: saved a note, confirmed via direct `localStorage` read that it survives a full page reload → "Return to Results" (HireOS side) correctly navigates away from Reagvis (see §11 root-cause note below).

One caught-and-fixed bug during this verification: `LessonWorkspace`'s local component state (which checkpoint is "celebrating," which activity is satisfied) was leaking across checkpoints, because React reuses a component instance across re-renders when its position in the tree doesn't change — only the `checkpoint` prop was changing, not the component identity. Fixed with `<LessonWorkspace key={viewedCheckpoint.id} ...>` in `ReagvisTrailPage.tsx`, forcing a fresh mount (and fresh local state) per checkpoint.

---

## 11. App-level navigation regression (fixed)

**Root cause:** `App.tsx` computes `isReagvis = activeProduct === "reagvis" || page === "reagvis-trail"`. `page` is `App.tsx`'s own top-level route state, defaulting to `DEVELOPMENT_MODE.DEFAULT_ENTRY` (`"reagvis-trail"`) — and nothing inside Reagvis ever called `App.tsx`'s `handleNavigate` to change `page` away from that value; `TrailHUD`'s "HireOS" button and `ReagvisTrailPage`'s "Return to Results" button only called `AppStateContext`'s `returnToHireOS()`, which flips `activeProduct` to `"hireos"` but never touches `page`. So `isReagvis` stayed permanently `true` via the `page === "reagvis-trail"` clause, and clicking either button visually did nothing.

**Fix:** both buttons now also call the App-level `onNavigateHireOS("results")` callback (already prop-drilled into `ReagvisTrailPage` as `onNavigateHireOS`, newly prop-drilled one level further into `TrailHUD`). `handleNavigate("results")` in `App.tsx` sets both `activeProduct` and `page` together, so `isReagvis` correctly evaluates to `false` on either clause afterward.

**Why not remove the `page === "reagvis-trail"` clause instead:** it's load-bearing in the other direction — entering Reagvis from a HireOS-side page (e.g. Results' "Start DSA Learning Trail") only flips `activeProduct` via `startLearningTrail()`, never touches `page`, and relies on that clause to actually show Reagvis. Removing it would break entry, not just exit. This is still a single routing system (`App.tsx`'s `page` state) — no React Router, no second state machine — the fix just makes sure both exit paths route through it instead of silently bypassing it via `activeProduct` alone.

**Untouched:** `COURSE_FIRST_MODE`, `INTERVIEW_FLOW_ENABLED` (still `false`), and every Setup/Interview gate in `App.tsx`'s `handleNavigate` — this fix only changes how leaving Reagvis for the HireOS/Results side works, not what's reachable within the HireOS side.

---

## 12. The full DSA course skeleton

The DSA course is now the complete 7-zone structure (`src/learning/content/dsaSkeleton.ts`'s `DSA_ZONES`), not the 3-zone/7-module structure it was after the Trees vertical slice. Only 7 of ~28 modules have real content — everything else is a genuine `Module` with **zero checkpoints**, which `progressEngine.ts`'s `resolveModuleState` already resolves to `"locked"` with no special-casing (`if (module.checkpoints.length === 0) return "locked"`). Nothing is faked.

```
ZONE 1 — Basecamp (id: "basecamp")
  foundations ★ real          Complexity & Problem Solving
  arrays-strings   skeleton   Arrays & Strings
  hashing          skeleton   Hashing

ZONE 2 — Pattern Meadows (id: "pattern-meadows")
  two-pointers     skeleton
  sliding-window   skeleton
  prefix-sum       skeleton
  binary-search    skeleton
  intervals        skeleton

ZONE 3 — Structure Woods (id: "structure-woods")
  linked-structures ★ real    Linked Lists
  stack-queue      skeleton
  heap-priority-queue skeleton
  trie             skeleton

ZONE 4 — Recursive Forest (id: "recursive-forest")
  recursion        ★ real     Recursion
  backtracking     skeleton
  trees            ★ real     Ancient Canopy (Trees — unchanged from the Trees vertical slice)
  binary-search-trees skeleton (NOT the same as Trees' internal "Binary Search Trees" checkpoint —
                                 this is a placeholder for a future full BST module)

ZONE 5 — Graph Highlands (id: "graph-highlands")
  graphs           ★ real (legacy)  Graph Fundamentals
  dfs-bfs          skeleton
  grid-graphs      skeleton
  topological-sort skeleton
  union-find       skeleton

ZONE 6 — Optimization Peaks (id: "optimization-peaks")
  greedy           skeleton
  dp               ★ real (legacy)  1D Dynamic Programming
  dp-2d            skeleton
  dp-patterns      skeleton

ZONE 7 — Interview Summit (id: "interview-summit")
  mixed-pattern-recognition skeleton
  timed-problems   skeleton
  company-missions skeleton
  summit           ★ real (legacy)  Final Mastery
```

"real (legacy)" = still derived from `reagvisCourses.ts`'s TrailNodes (unchanged this task). "★ real" = authored directly in the new Lesson Workspace content model.

### Module ids are preserved — this is a hard constraint, not a preference

`BiomeTrailMap.tsx`'s scenic tiles (`dsaModules`) hardcode exactly 7 module ids: `foundations`, `linked-structures`, `recursion`, `trees`, `graphs`, `dp`, `summit`. **None of these were renamed**, even though the task's zone taxonomy suggests names like "Complexity & Problem Solving" or "Linked Lists" — renaming the *id* would silently break the scenic map's `dsaModuleStates[mod.id]` lookups (undefined → always "locked"), which is exactly the kind of regression the visual-preservation rule exists to prevent. Instead:

- Module **ids** stayed the same.
- Module **titles** were updated to the new taxonomy (`foundations` → "Complexity & Problem Solving", `graphs` → "Graph Fundamentals", `dp` → "1D Dynamic Programming", `summit` → "Final Mastery") — titles are read by the new Module Roadmap/Lesson Workspace screens, not by the scenic map, so this was safe to change freely.
- New skeleton modules got entirely fresh ids that don't collide with anything the scenic map renders.

The same reasoning applies to **zone** ids: `BiomeTrailMap.tsx`'s cosmetic zone dropdown (`courseZones`, a decorative 3-pill widget, unrelated to real navigation) previously used ids `"zone-1"/"zone-2"/"zone-3"`. Since the real zone model now has 7 zones with different ids, those 3 dropdown entries were repointed at 3 real zones (`basecamp`, `recursive-forest`, `interview-summit`) that best represent the "early / current / final" narrative the 3-pill UI was always a simplification of — same JSX, same 3 pills, same copy, just correct underlying ids so the Active/Locked badge isn't permanently wrong. This was the one small, mechanical, non-visual edit made to `BiomeTrailMap.tsx` beyond what Trees required.

### Legacy → new module mapping

| Old concept (pre-course-expansion) | New module id | New zone | Status |
|---|---|---|---|
| "Foundations" (Trailhead Grove, TrailNodes 1-3) | `foundations` | `basecamp` | Fully re-authored (5 new checkpoints) |
| "Linked Structures" (River Crossing, TrailNodes 4-6) | `linked-structures` | `structure-woods` | Fully re-authored (5 new checkpoints) |
| "Recursion" (Recursion Cave, TrailNodes 7-8) | `recursion` | `recursive-forest` | Fully re-authored (5 new checkpoints) |
| "Trees" (Ancient Canopy) | `trees` | `recursive-forest` | Unchanged (Trees vertical slice content) |
| "Graphs" (Graph Wilds, TrailNodes 12-15) | `graphs` | `graph-highlands` | Unchanged, title updated to "Graph Fundamentals" |
| "DP" (Dynamic Caverns, TrailNodes 16-17) | `dp` | `optimization-peaks` | Unchanged, title updated to "1D Dynamic Programming" |
| "Summit" (Algorithm Summit, TrailNode 18) | `summit` | `interview-summit` | Unchanged, title updated to "Final Mastery" |

---

## 13. Content-authoring rules (the pattern to follow for future modules)

Trees remains the reference implementation. Foundations/Linked Lists/Recursion follow it, with variation where the topic called for it (Section 1 of the task explicitly warned against "five identical screens"):

- **4-6 checkpoints per module.** Every migrated module has exactly 5.
- **2-3 theory blocks per checkpoint**, occasionally a 4th, never a wall of text. Use `learnMore` for anything beyond that.
- **One meaningful coding challenge, not several near-identical ones.** Foundations has 2 coding checkpoints (`findMax`, `hasDuplicate`) that each teach something different (linear scan, hash-set trade-off) rather than 5 variations on the same idea.
- **Not every checkpoint needs a coding activity.** Foundations' first 3 checkpoints and Recursion's first 3 are theory + quick check only — action comes at checkpoint 4-5, not after every paragraph (PART 15/17).
- **A visual is optional, not mandatory.** Only Trees has one (`BinaryTreeDiagram`) — Linked Lists and Recursion use worked code examples instead, since a pointer-rewiring diagram or a call-stack animation would have been a much bigger lift for proportionally less teaching value in this pass. (Recursion's theory does describe the call stack in prose — a `CallStackVisual` component is a reasonable next addition, not built this task.)
- **The terminal checkpoint carries `masteryXp`** and is `type: "boss"` — this is what makes `completeCheckpoint()` add it to `masteredCheckpointIds` (not just `completedCheckpointIds`) and roll the module up to `"mastered"` instead of `"completed"`.
- **Module ids for anything already visible on the scenic map are fixed** — see §12. A genuinely new module (not replacing an existing scenic tile) can use any id.

To build out a skeleton module: write `src/learning/content/<name>Module.ts` following `complexityModule.ts`/`linkedListsModule.ts`/`recursionModule.ts`, then swap its entry into `courseRegistry.ts`'s `REAL_MODULES` map (or, for a module still using legacy TrailNode data, leave it out of `REAL_MODULES` and author real `LessonContent` for its TrailNodes instead). Nothing about `DSA_ZONES` needs to change either way.

---

## 14. Review mode

Completed/mastered checkpoints are fully reviewable, not just visually badge-checked:

- `ModuleRoadmap` treats any non-`"locked"` state as clickable — `completed`/`mastered`/`current` all open the Lesson Workspace.
- `LessonWorkspace` detects `state === "completed" || state === "mastered"` and renders a **review banner** ("You've already completed this checkpoint... No additional XP is awarded"), swaps the primary button from "Complete Checkpoint" to "Return to Roadmap", and skips the completion celebration entirely.
- `AppStateContext`'s `completeCheckpointById(checkpointId)` — the single function both the legacy flow and the new flow call — no-ops (no XP, no `masteredCheckpointIds` mutation, no progression change) if the checkpoint is already in `completedCheckpointIds`/`masteredCheckpointIds`, **and separately** no-ops if `checkpointId !== progress.activeCheckpointId` (out-of-turn completion isn't supported by the linear engine — only ever relevant for a future non-linear prerequisite graph). Both guards mean review mode cannot move `activeCheckpointId` backward, award XP twice, or touch lives.
- Coding activities can still be **run** freely in review mode (Run/Submit call the same `MockCodeRunner`) — only the *completion reward* is idempotent, not the interaction itself, matching PART 9's "it may run normally, but progression rewards should be idempotent."

Verified live: reopening Foundations' first checkpoint after it was already completed showed the review banner, left XP at exactly 1240, and left `completedCheckpointIds` unchanged.

---

## 15. Shared CodeRunner — legacy path retired

Before this task there were two independent mock-execution implementations: the new Lesson Workspace's `MockCodeRunner`, and `ChallengeStage.tsx`'s own inline `setTimeout` calls that always printed a canned success string regardless of input. That's fixed — `ChallengeStage.tsx` now calls the same `MockCodeRunner` via `practiceChallengeToActivity()` (`src/learning/legacyChallengeAdapter.ts`), which converts the old `PracticeChallenge` shape into a `CodingActivityContent` on the fly. There is exactly one mock-execution implementation in the codebase now.

**Known limitation of the adapter**, documented rather than engineered around (given `ChallengeStage` is only reachable through `graphs`/`dp`/`summit`, all locked in the current demo bootstrap): the old `PracticeChallenge` data never stored structured visible/hidden test cases — only one `expectedOutput` string. The adapter builds a single test from it and reuses it as the lone "hidden" test too, so `run()`/`submit()` are less rich here than for Trees/Foundations/Linked Lists/Recursion's purpose-built test suites. It also can't infer meaningful `requiredKeywords`, so it stays permissive on that check. A module migrated to the new content model (as Foundations/Linked Lists/Recursion already were) gets real, distinct visible/hidden tests authored directly — that's the actual fix, not a better adapter.

`CodeLanguage` gained a 4th value, `"javascript"`, used only by this adapter (the old `PracticeChallenge.starterCode` is JavaScript; every new-model activity still uses python/cpp/java). `CodingActivityContent.starterCode` changed from `Record<CodeLanguage, string>` to `Partial<Record<CodeLanguage, string>>` so activities don't need to supply all 4 languages.

---

## 16. Question metadata layer

`src/learning/types.ts`'s `InterviewQuestionMeta` — pointers to interview questions (title, source, external URL, difficulty, topics, target module, role), never the problem statement itself:

```ts
interface InterviewQuestionMeta {
  id: string
  title: string
  source: "grind75" | "company" | "internal"
  externalUrl?: string
  difficulty: "easy" | "medium" | "hard"
  topics: string[]
  moduleId: string
  role: "core" | "reinforcement" | "challenge" | "mastery" | "company-mission"
  estimatedMinutes?: number
  companyIds?: string[]       // reserved, unused — no fake company data
  recencyWindow?: string      // reserved, unused
  frequencyScore?: number     // reserved, unused
}
```

`Checkpoint.questionIds?: string[]` optionally links a checkpoint to one or more of these — metadata-only, not a requirement for a checkpoint to have a `codingActivity` (today's activities are original wording even where a `questionIds` entry names the canonical problem they're modeled after).

### Curated entries (`src/learning/content/questionMeta.ts`)

Not the Grind75 list — 8 entries, only for modules with real content:

| Module | Questions | Roles |
|---|---|---|
| Foundations | Complexity Analysis Drill (internal) | core |
| Linked Lists | Reverse Linked List, Linked List Cycle, Merge Two Sorted Lists | core, reinforcement, mastery |
| Recursion | Fibonacci Number, Subsets | core, mastery |
| Trees | Balanced Binary Tree, Search in a BST | mastery, core |

### Intended future use of the role model (not built this task)

```
learn concept → solve CORE question
  → if learner struggles → serve REINFORCEMENT
  → if learner succeeds  → move forward
  → revisit later in mixed practice (MASTERY / company-mission sets)
```

No adaptive selection logic exists yet — `getQuestionMetaByModule()`/`getQuestionMetaById()` are the only functions, plain lookups. `companyIds`/`recencyWindow`/`frequencyScore` are typed and present on the interface so a future company-question integration doesn't need a shape change, but every curated entry above leaves them `undefined` — no fabricated frequency/recency data exists anywhere in the codebase.

---

## 17. Progress schema migration

No version field was added — the migration is **structural**, not version-gated, because there's exactly one migration event to handle: bare-numeric checkpoint ids (`"1"`-`"8"`) from before this task's re-authoring of Foundations/Linked Structures/Recursion.

`src/learning/progressRepository.ts`'s `migrateLegacyCheckpointIds()` runs inside `LocalProgressRepository.load()`, before the caller ever sees the result:

- If `completedCheckpointIds`/`activeCheckpointId` contain any of the old bare ids (`"1"`-`"8"`), the corresponding module (`foundations`/`linked-structures`/`recursion`) is marked **fully completed** on the new ids (`<module>-1` through `<module>-5`) — the old ids only ever meant "this module is done" in the demo bootstrap, so there's no finer-grained history to lose.
- `"trees-N"` ids are untouched (already on the current scheme from the Trees vertical slice).
- A snapshot with no legacy ids passes through unchanged — this is a no-op for anyone who started fresh after the Trees vertical slice landed.

Verified live: seeded `localStorage` with a pre-migration snapshot (`completedCheckpointIds: ["1"..."8", "trees-1"]`), reloaded, and confirmed it was rewritten to the new ids on load with `xp`/`streak`/`lives`/`activeCheckpointId` all preserved.

---

## 18. Basecamp completion + Pattern Meadows v1

Basecamp is now complete (Complexity & Problem Solving, Arrays & Strings, Hashing), and Pattern Meadows v1 adds all 5 of its modules (Two Pointers, Sliding Window, Prefix Sum, Binary Search, Intervals) — 7 new authored modules, 14 real modules in the course total.

### Checkpoint counts (learning need, not a template)

| Module | Checkpoints | Why |
|---|---|---|
| Arrays & Strings | 5 | Essentials → traversal → patterns → code lab → mastery, matching the established 5-checkpoint shape |
| Hashing | 5 | Same shape — two coding checkpoints (`isAnagram`, `twoSum`) since the module's whole point is the lookup trick, taught once conceptually then applied twice differently |
| Two Pointers | 5 | Two distinct pointer *shapes* (opposite-end, same-direction) each earn their own checkpoint before the coding pair |
| Sliding Window | 5 | Called out as especially high-value (PART 6) — got the full 5-checkpoint treatment plus fixed AND variable window coverage |
| Prefix Sum | **4** | The pattern itself is narrow — a 5th checkpoint would have meant a second, similar range-sum problem back to back rather than new teaching |
| Binary Search | 5 | Boundaries and "search on condition" are genuinely separate ideas worth their own checkpoints before the coding pair |
| Intervals | **4** | Same reasoning as Prefix Sum — sort+overlap is one idea, merge/insert is the practice of it |

Prefix Sum and Intervals deliberately have 4, not 5 — PART 7/9 of the task explicitly asked for this ("Do not force five checkpoints if four are enough... checkpoint count should follow learning need, not arbitrary consistency").

### The prerequisite graph is a branch, not a longer chain

Foundations is a branch point (`src/learning/courseRegistry.ts`'s `buildDsaCourse`, `fanOutFrom`/`chainSerially` helpers):

```
                              ┌─ Linked Structures → Recursion → Trees → Graphs → 1D DP → Final Mastery
Foundations (foundations-5) ─┤        (Branch A — pre-existing, UNCHANGED this task)
                              └─ Arrays & Strings → Hashing ─┬─ Two Pointers
                                 (Branch B — new)            ├─ Sliding Window
                                                              ├─ Prefix Sum
                                                              ├─ Binary Search
                                                              └─ Intervals
                                                              (all 5 fan out from Hashing's last
                                                               checkpoint in PARALLEL, not serially)
```

Two design decisions this depends on:

1. **Branch A is untouched.** Linked Structures' first checkpoint prerequisite is still `foundations-5`, exactly as before — inserting Arrays & Strings/Hashing does NOT sit between Foundations and Linked Structures. This is what keeps the demo bootstrap's "Foundations/Linked Structures/Recursion completed, Trees current" state valid without any reseeding (PART 22 — "do not suddenly reset the demo learner back to Arrays").
2. **Pattern Meadows fans out, doesn't chain.** All 5 modules' first checkpoints share the identical prerequisite (`hashing-5`) rather than chaining through each other — none of them depends pedagogically on the others (PART 23). Verified live: seeding Basecamp as fully completed showed all 5 Pattern Meadows modules simultaneously `"available"` in the Course Library, not one-at-a-time locked.

This also exercises the `"available"` `ProgressState` for the first time in this codebase (previously only reachable in theory — see the Trees vertical slice's note that "available never actually occurs in practice" under strictly serial chains). It's real now: any Pattern Meadows module whose prerequisite is met but that isn't the learner's `activeCheckpointId` resolves to `"available"`, rendered in the Course Library with its own "AVAILABLE" badge distinct from "CURRENT."

### Question mapping conventions

- One `InterviewQuestionMeta` record per canonical problem — never duplicated per module. A cross-topic question (PART 14) gets multiple `topics` entries and lives under whichever module is its most natural primary home (`moduleId`); other modules reference it via a checkpoint's `questionIds` without a second record. Example: "Product of Array Except Self" is `moduleId: "arrays-strings"`, `topics: ["array", "prefix-sum"]`, and is referenced from Prefix Sum's code lab checkpoint.
- `getQuestionMetaByTopic(topic)` (`content/questionMeta.ts`) is the lookup for this — filters by `topics`, not `moduleId`, so a question surfaces from either angle.
- 22 curated entries total across Foundations/Linked Lists/Recursion/Trees (prior task) and Arrays & Strings/Hashing/Two Pointers/Sliding Window/Prefix Sum/Binary Search/Intervals (this task) — still nowhere close to the full Grind75 set, deliberately.
- Every entry has a `role` (`core`/`reinforcement`/`challenge`/`mastery`) per PART 13's intended future behavior (core exposure → reinforcement only if the learner struggles → move on → revisit in mixed practice later) — no adaptive selection logic reads these yet; they're plain, filterable metadata.

### Reusable visuals

- **`CallStackVisual`** (`src/components/lesson/CallStackVisual.tsx`) — steps through a `CallStackFrame[]` sequence (push/base-case/pop), animating the stack growing then unwinding. Not tied to `factorial` — wired into Recursion's "Call Stack Visualization" checkpoint with a 7-frame `factorial(3)` trace, but any recursive function's frame sequence works (a future Backtracking or Tree-recursion checkpoint reuses it with different `frames`, per PART 16's explicit ask).
- **`TwoPointerVisual`** (`src/components/lesson/TwoPointerVisual.tsx`) — animates `L`/`R` markers over a fixed array, in `"opposite"` (converging) or `"same-direction"` (one trailing, one racing ahead) mode. Wired into Two Pointers' checkpoints 2 and 3.
- **Sliding Window, Prefix Sum, Binary Search, Intervals did not get a dedicated visual** this task — PART 17 explicitly scoped visuals to "only if genuinely improves understanding" and capped effort at "lightweight... no visualization framework." Their worked code examples carry the teaching load instead. A `SlidingWindowVisual` (an animated window sliding across an array) is the most likely next addition given Sliding Window's "especially polished" priority (PART 6) — not built this task.
- Both new visuals use the same shape as `BinaryTreeDiagram`: a small, self-contained component driven by a typed spec field on `LessonWorkspaceContent` (`callStackVisual?`, `twoPointerVisual?`) — each visual type is its own optional field rather than one polymorphic union, matching the existing `visual?: TraversalVisual` pattern.

### Course World vs. Module Roadmap navigation

The Alpine scenic map (`BiomeTrailMap.tsx`) still shows exactly the original 7 module tiles — **not redesigned or expanded this task** (PART 21: "do NOT attempt to visually cram all ~28 modules into the current scenic scene"). The 7 newly-authored modules with no scenic tile (Arrays & Strings, Hashing, and all 5 Pattern Meadows modules) are reached through a new plain-list section on the existing Course Library screen (`ReagvisTrailPage.tsx`'s `"library"` view — already a non-scenic screen, not the Alpine world), grouped by zone, each card showing its real engine-resolved state and calling `enterModule()` — the same function the scenic map's tiles call. This is the PART 24 distinction in practice: **Course World** (the Alpine map) = major learning destinations only; **Module Roadmap** = the checkpoint-by-checkpoint screen every module (scenic-tiled or not) opens into. No new lesson content was placed directly on the Course World.

### BiomeTrailMap cleanup

`nodes: TrailNode[]` and `onSelectNode: (node: TrailNode) => void` were confirmed genuinely unused inside `BiomeTrailMap.tsx` (a leftover from before the module-level `onEnterModule` routing introduced in the Trees vertical slice) and removed from its props. This cascaded cleanly in `ReagvisTrailPage.tsx`: the only caller of `onSelectNode` was `handleSelectNode`, which only ever fed `previewNode`, which was the only thing that rendered `<LessonModal>` — all four (the prop wiring, `handleSelectNode`, `previewNode`/`setPreviewNode` state, and the `LessonModal` render block) were removed together as one dead code path, not left half-orphaned. `LessonModal.tsx` itself was left in place (not deleted) in case a similar node-preview pattern is wanted again later — it's just currently unreferenced.

### Future backend compatibility

Nothing introduced this task complicates a future backend: `InterviewQuestionMeta`/`Checkpoint`/`Module`/`Zone` all key off stable string ids exactly like before; the new prerequisite fan-out is still just `string[]` id references in `LearnerProgressState`, not any serialized UI structure; and the Course Library's new module list reads `dsaModuleStates`/`course.zones` the same way the scenic map does — no new local-only state shape that would need translating for an `ApiProgressRepository` later.
