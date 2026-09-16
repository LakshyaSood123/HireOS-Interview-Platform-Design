# HireOS / Reagvis Trails — Backend Capability & Gap Audit

**Read-only audit. No application code was changed to produce this document.**
Audit date: 2026-09-16. Scope: the single project at the repository root (`figma-make-app`, published as `LakshyaSood123/HireOS-Interview-Platform-Design`) plus a check of every other directory visible in this workspace.

> **2026-09-16 update — frontend learning-engine refactor.** A subsequent task (see `LEARNING_ENGINE_ARCHITECTURE.md`) introduced `src/learning/` — a real course registry, prerequisite-based progression engine, and a `localStorage`-backed `ProgressRepository`. This is **still entirely frontend, still no backend** — it changes the accuracy of a few specific statements below, listed here rather than rewritten inline:
> - **§9 Current Course Data Model / Target G**: `startLearningTrail(courseId)` no longer ignores its argument — `src/learning/courseRegistry.ts` now provides a real `getCourseById`/`isCourseAvailable` lookup. Only `"dsa-foundations"` is registered; the other 5 library cards now render a "Coming Soon" state instead of silently opening DSA content. The underlying limitation is unchanged: only one course has real content.
> - **§10 Current Progress State**: progress is no longer *only* React state — `LocalProgressRepository` persists it to `localStorage` (`reagvis.progress.<courseId>`) and survives a refresh. It is still not backend/database persistence (nothing syncs across devices or users), so Target A's `CourseProgress`/`ModuleProgress`/`LessonProgress` rows remain classified **C — frontend-only**, now with real (if browser-local) persistence rather than none.
> - **§14 Course Progression**: `currentLessonId + 1` no longer describes advancement — `src/learning/progressEngine.ts` resolves state from an explicit prerequisite graph per checkpoint (still linear in practice, since that's what the real content supports, but no longer hardcoded arithmetic). `BiomeZone.isUnlocked` and `BiomeTrailMap.tsx`'s local `courseZones` are no longer separate, never-updated hardcoded sources — both now derive from the same engine.
> - **§11 Code Editor / Compiler, §12 Notes**: `ChallengeStage.tsx` itself (used by the legacy Foundations/Linked Structures/etc. modules) is unchanged — still a trivial always-succeeds mock. But a second, separate task (the "Trees vertical slice") added a new Lesson Workspace path (`src/components/lesson/CodeWorkspace.tsx`) used by the Trees module, backed by a real `MockCodeRunner` (`src/learning/services/codeRunner.ts`) that judges submissions with keyword/shape heuristics — still 100% mocked (no `eval`, no execution, no network), but no longer unconditionally accepting anything. Notes now has a working UI (`NotesPanel.tsx`) for Trees checkpoints, backed by `LocalNotesRepository`. Full detail in `LEARNING_ENGINE_ARCHITECTURE.md` §10.
> - **BACKEND COMPLETENESS ESTIMATE**: "Progress persistence: Missing" should now read "Missing (backend) / present (browser-local only)" — see `LEARNING_ENGINE_ARCHITECTURE.md` §5.

---

## 0. Workspace-wide check

The workspace exposes several other directories besides this project. They were inspected and are **not part of HireOS / Reagvis Trails** — noted here only so nothing is silently ignored:

| Path | What it is | Relevant to this audit? |
|---|---|---|
| `C:\Users\PREDATOR\Downloads\reagvis-push-temp` | Static `index.html` + two PDF research papers on AI-image/deepfake detection, branded "Reagvis" | No — different product (document/deepfake detection), no app code |
| `C:\Users\PREDATOR\Reagvis ProdSite1` | Static HTML pages (`reagvis-document-detection-LIVE.html`, gemini-generated snippet) | No — same unrelated deepfake/document-detection product |
| `C:\Users\PREDATOR\Reagvis ProdSite 4` | Static HTML pages (document + audio deepfake detection) | No — same unrelated product |
| `C:\Users\PREDATOR\Downloads\kyc-rebase-temp` | Next.js 15 app (KYC/identity verification), has `src/app`, `src/_disabled-auth` | No — unrelated product (KYC), not HireOS/Reagvis Trails. Note: it does contain a real Next.js app shape with an `_disabled-auth` module, i.e. this sibling project *has* backend/auth plumbing precedent in this workspace even though the audited project does not. |

Everything below concerns **only** `c:\Users\PREDATOR\Downloads\HireOS Interview Platform Design` (git remote: `https://github.com/LakshyaSood123/HireOS-Interview-Platform-Design`).

---

## 1. Repository / Project Structure

**Single repository, single frontend package. Not a monorepo, not frontend+backend, no serverless functions.**

| Path | Language | Framework | Package manager | Entry point | Role | Build | Run |
|---|---|---|---|---|---|---|---|
| `.` (repo root) | TypeScript/TSX | React 19 + Vite 8 | pnpm (`pnpm-lock.yaml`, `.mise.toml` pins `pnpm 10.34.3`) | `index.html` → `src/main.tsx` → `src/App.tsx` | Frontend only | `pnpm build` (`vite build`) | `pnpm dev` (`vite --host 0.0.0.0`, port from `$PORT`, default 8443) |

Full `dependencies`: `react@^19`, `react-dom@^19`. Full `devDependencies`: `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `tailwindcss@^4`, `@tailwindcss/vite`, `oxfmt`, `typescript@^5.7`, `vite@^8`. **No server framework, no ORM, no database driver, no auth library, no HTTP client library (no axios/ky/got), no test runner, no AI SDK** appear anywhere in `package.json`.

`vite.config.ts` defines four **Vite dev-server plugins**, all authored for the Figma Make hosting platform, not application backend:
- `figmaSiteConfiguration` — injects `<title>/<meta>` tags and serves `robots.txt` from `.figma/make/site.json`.
- `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback` — dev-only HMR reliability shims.
- `figmaMakeKitPlugin` — serves a dev-only `/.figma/make/kit.html` Storybook-style route (`apply: 'serve'`, stripped from prod builds).

These use `server.middlewares.use(...)`, which *looks* like backend routing but only exists inside `vite dev`/`vite preview` and only serves static text/HTML for the Figma Make design tool — it is not an application API and carries no business logic, auth, or database access.

**Architecture classification: single frontend, client-only SPA.**

---

## 2. Backend Existence

**BACKEND STATUS: NONE.**

No directory named `server/`, `api/`, `backend/`, `functions/`, no Express/Fastify/Nest/Koa dependency, no `Dockerfile`, no serverless function folder, no `src/pages/api/*` (this isn't Next.js). Confirmed via full repo file listing and `package.json` dependency inspection — there is nothing to identify a framework, runtime, entrypoint, port, route table, middleware stack, controllers, services, or data layer for, because none of those exist in this codebase.

---

## 3. Complete API Inventory

**No backend/API endpoints exist in this repository.** Table intentionally empty — there is nothing to enumerate.

| Method | Route | Source File | Handler | Auth | Input | Output | Database | Frontend Caller | Status |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | **N/A — no backend** |

---

## 4. Frontend → Backend Connection Map

Searched all of `src/**` for `fetch(`, `axios`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `graphql`, `process.env.`, `import.meta.env` (this would catch any API-base-URL config too).

**Result: zero matches.** No frontend file makes any network call of any kind. There is no API client module, no `.env`/env-var usage anywhere in `src/`. Every "data fetch" in the UI (interview results, course content, placement report) is a plain synchronous import from a static TypeScript file in `src/data/`.

---

## 5. Database Audit

**No database exists.** No ORM (`prisma`, `drizzle`, `typeorm`, `mongoose`, `sequelize`), no DB client (`pg`, `mysql2`, `better-sqlite3`, `@supabase/supabase-js`, `firebase`), no `schema.prisma`/migrations/seeds directory, no connection string or `DATABASE_URL` reference anywhere.

"Data" that exists is hardcoded exported constants in `src/data/*.ts`:

| File | Purpose | "Model" shape | Relations | Currently used? |
|---|---|---|---|---|
| `src/data/reagvisCourses.ts` | The one DSA course's content | `CourseData` → `BiomeZone[]` + `TrailNode[]`; `TrailNode.lesson: LessonContent`; `LessonContent.quickCheck`, `.challenge?: PracticeChallenge`; separate `LibraryCourse[]` for the course-library cards | `TrailNode.biome` is a free-text string matched against `BiomeZone.name`, not a foreign key | Yes — sole source for Reagvis Trails |
| `src/data/questions.ts` | Manual-mode interview question bank | `Question[]` (bilingual `text: {en, hi}`) | None | Yes — `InterviewPage.tsx` manual mode |
| `src/data/placementPrepDemo.ts` | Hardcoded interview session + AI-analysis + placement report | `DemoInterviewQuestion[]`, `InterviewSessionData`, `demoAnalysis`, `demoLearningMaterial`, `demoPlacementReport` | None; all static, none derived from `questions.ts` | Yes — auto-fill demo, Results/Placement pages |
| `src/data/companies.ts` | Company directory for the Setup page | `Company[]` | None | Yes — Setup/Admin/Dashboard |

None of these are "tables"; they are frozen module-level arrays reimported on every page render. There is no read/write API to them — "writing" happens only by mutating in-memory React state that is initialized *from* these constants (see §10).

---

## 6. Authentication & User System

**No authentication exists.** No login/registration screen, no session/JWT/cookie handling, no OAuth, and none of Cognito/Clerk/Supabase/Firebase/NextAuth appear in dependencies or source.

`candidateName` (`AppStateContext.tsx:52`, default `"Alex Chen"`) is the only "identity" concept, and it is a plain `useState` string with no login flow behind it — anyone opening the app *is* "Alex Chen" for that browser tab. **Users do not have persistent identities**; nothing survives a page refresh (see §10).

---

## 7. Current Interview System

**Confirmed frozen** via both files the task asked to check:

- `src/config/developmentMode.ts` — currently `COURSE_FIRST_MODE: true`, `INTERVIEW_FLOW_ENABLED: false`, `DEFAULT_ENTRY: "reagvis-trail"` (this constant was edited on disk after this audit began — outside this audit's own edits — see the note at the top of this session; it now boots straight into Reagvis Trails rather than Results, but the interview-gating behavior below is unaffected).
- `COURSE_FIRST_DEVELOPMENT_MODE.md` (repo root) — documents the freeze and the unfreeze checklist.
- Enforcement: `App.tsx`'s `handleNavigate` refuses to route to `"setup"`/`"interview"` while `INTERVIEW_FLOW_ENABLED` is false (`isInterviewPage` check); `AppStateContext.tsx`'s `retakeInterview()` short-circuits under the same flag; CTA buttons across `LandingPage.tsx`, `ResultsPage.tsx`, `AdminPage.tsx`, `PlacementReportSection.tsx`, `UnlockCelebration.tsx` render `disabled` with a shared tooltip message.

Functionality audit (`src/pages/InterviewPage.tsx`, `src/pages/SetupPage.tsx`, `src/pages/ResultsPage.tsx`):

- **Interview pages**: `LandingPage`, `SetupPage`, `InterviewPage`, `ResultsPage`, `PlacementFlowPage` (+ `PlacementPrepFlow`/`PlacementReportSection`/`PlacementAnalysisSection`/`PlacementInterviewSummary`/`PlacementLearningSection` components).
- **Question data**: `src/data/questions.ts` (10 bilingual questions, types `video`/`text`/`code`) for manual mode; `src/data/placementPrepDemo.ts` (`demoInterviewQuestions`, 4 questions) for the "Auto-fill for Demo Recording" scripted flow.
- **Session state**: `answered: number[]`, `textAnswer`, `codeAnswer`, `autoFillTranscript` — all local `useState` inside `InterviewPage.tsx`, never persisted.
- **"Recording"**: no camera/mic is ever requested (`navigator.mediaDevices` is never referenced) — the video question UI (`InterviewPage.tsx:305-371`) is a static placeholder panel with a fake red "● Recording" dot and countdown timer.
- **Answer storage**: none beyond the component's own `useState`. `setInterviewSession(demoInterviewSession)` (`AppStateContext.tsx`) stores only the *pre-baked* demo session object, not whatever the user actually typed.
- **Scoring / results generation**: **100% hardcoded.** `ResultsPage.tsx` renders a fixed score of `82`, a fixed `metrics` array (Communication 88%, Role Fit 86%, Technical Depth 74%, Problem Solving 69%), fixed `strengths[]`, and a fixed `breakdown[]` of Q&A feedback — none of these read from `interviewSession` or from what the candidate typed during the interview.
- **Weak-topic analysis / recommendations**: hardcoded in `src/data/placementPrepDemo.ts` (`demoAnalysis.weakAreas`, `demoPlacementReport.weakAreas/recommendedLearningPath`) and in `dsaCourseData.weakSkills` (`reagvisCourses.ts`) — static strings, not computed from any answer.
- **Retake behavior**: `retakeInterview()` in `AppStateContext.tsx` just flips `activeProduct` back to `"hireos"` (now no-op while frozen); no session reset logic beyond that.
- **Persistence**: none — refreshing the tab loses everything.
- **API usage**: none (confirmed in §4).

Classification: **A. Real functionality: none. B. Frontend simulation: the entire recording/timer/auto-fill UX. C. Hardcoded data: all scores, feedback, weak-areas, recommendations. D. Backend-powered functionality: none.**

---

## 8. Current Reagvis Learning System

| Feature | File(s) | Classification |
|---|---|---|
| `ReagvisTrailPage` (intro / map / lesson / challenge / library view switch) | `src/pages/ReagvisTrailPage.tsx` | Functional (frontend-only) |
| Course World / biome map | `src/components/forest/BiomeTrailMap.tsx` | Functional UI, but `courseZones` (multi-zone progression) is a **local hardcoded array inside the component**, zone 2/3 always `status: "locked"` regardless of any real progress; scenic-only |
| Module map / trail nodes | `BiomeTrailMap.tsx`, `TrailNode[]` in `reagvisCourses.ts` | Static data, no dynamic unlocking beyond the single `completeCurrentLesson()` step (see §14) |
| Checkpoint / lesson UI | `src/components/forest/LessonReader.tsx`, `LessonModal.tsx` | Functional (renders static `LessonContent`) |
| Challenge UI | `src/components/forest/ChallengeStage.tsx` | **Mock** — Run/Submit are `setTimeout` calls that print `challenge.mockRunOutput`, a pre-written string in the data file (see §11) |
| Code editor | `src/components/CodeEditor.tsx` (interview) + inline `<textarea>` in `ChallengeStage.tsx` | Mock/Static — plain `<textarea>` with a manual line-number gutter, no syntax highlighting, no language server |
| XP | `AppStateContext.tsx` (`userXP`, `+120` per `completeCurrentLesson()`) | Functional in-memory only, resets on refresh |
| Streak | `AppStateContext.tsx` (`userStreak`, `useState(7)`, **no setter ever exposed or called**) | Static/decorative — always shows "7" |
| Progress (`completedLessonIds`, `currentLessonId`) | `AppStateContext.tsx` | Functional in-memory only |
| Readiness (`simulatedReadinessScore`) | `AppStateContext.tsx` (58 → hardcoded jump to 74 on first completion) | Mock — a single hardcoded step function, not derived from performance |
| Lives | — | **Missing entirely** — no lives/hearts concept anywhere in the codebase |
| Completion / unlocks | `completeCurrentLesson()` (`AppStateContext.tsx:89-115`) | Functional but simplistic — see §14 |
| Notes | — | **Missing entirely** (§12) |
| Course library | `libraryCourses` in `reagvisCourses.ts`, rendered in `ReagvisTrailPage.tsx`'s `library` view | Static — every card's "Enter Trail" button routes to the *same* `dsaCourseData` regardless of which course card was clicked (see §9) |

---

## 9. Current Course Data Model

Actual exported names from `src/data/reagvisCourses.ts` (not assumed — read directly): `NodeStatus`, `NodeType`, `QuickCheck`, `PracticeChallenge`, `LessonContent`, `TrailNode`, `BiomeZone`, `CourseData`, `dsaCourseData: CourseData`, `LibraryCourse`, `libraryCourses: LibraryCourse[]`.

Hierarchy: `CourseData { biomes: BiomeZone[], nodes: TrailNode[] }`, `TrailNode { lesson?: LessonContent }`, `LessonContent { quickCheck: QuickCheck, challenge?: PracticeChallenge }`.

- **Only one `CourseData` object exists** (`dsaCourseData`) and it is the sole value ever assigned to `AppStateContext`'s `courseData` state (`useState<CourseData>(dsaCourseData)`, `AppStateContext.tsx:59`).
- `libraryCourses` (6 entries: DSA, System Design, DBMS, OS, Networks, Behavioral) is a **separate, unrelated type** (`LibraryCourse`) with no `CourseData` behind any entry except `dsa-foundations`.
- `startLearningTrail(courseId?: string)` (`AppStateContext.tsx:71-79`) **accepts a `courseId` parameter and ignores it** — the parameter is named `_courseId` and unused; the function always just flips `reagvisView` to `"intro"` while `courseData` stays `dsaCourseData`. Confirmed by reading the function body directly.
- **Conclusion: `courseId` does NOT currently change content.** Content is 100% hardcoded to the single DSA course. The multi-course *frontend* (library grid) is a facade over one real course's data.

---

## 10. Current Progress State

| Value | Source file | Storage type | Persistence | Reset behavior |
|---|---|---|---|---|
| `activeCourse` (`courseData`) | `AppStateContext.tsx:59` | React `useState` in context | None (in-memory) | Resets to `dsaCourseData` on reload |
| `activeNode`/module | `AppStateContext.tsx:60` | React `useState` | None | Resets to `nodes[2]` on reload |
| `activeLesson` (`currentLessonId`) | `AppStateContext.tsx:64` | React `useState` | None | Resets to `3` on reload |
| `completedLessonIds` | `AppStateContext.tsx:63` | React `useState` | None | Resets to `[1, 2]` on reload |
| `userXP` | `AppStateContext.tsx:61` | React `useState` | None | Resets to `1240` on reload |
| `userStreak` | `AppStateContext.tsx:62` | React `useState` (no setter wired) | None | Static `7`, never changes |
| `simulatedReadinessScore` | `AppStateContext.tsx:65` | React `useState` | None | Resets to `58` on reload |
| `mastery` (per node/course) | `TrailNode.mastery`, `CourseData.currentMastery` | Mutated via `setCourseData(prev => ...)` in `completeCurrentLesson()` | None | Resets to hardcoded initial values on reload |
| Notes | — | Not implemented | N/A | N/A |
| Challenge attempts | `ChallengeStage.tsx` local `useState` (`isRunning`, `isSuccess`, `consoleOutput`) | Component-local state | None | Discarded when the component unmounts (leaving the challenge view) |

`localStorage`/`sessionStorage`/`IndexedDB`: **grepped for across `src/` — zero usages.** Storage classification for every value above: **component state or React Context, exclusively. No browser storage, no backend, no database, anywhere.**

---

## 11. Current Code Editor / Compiler

Traced Run/Submit end-to-end in both places code execution UI exists:

**A. Interview coding question (`src/components/CodeEditor.tsx`, used by `InterviewPage.tsx`):**
- Editor: plain `<textarea>` (`CodeEditor.tsx:78-87`) with a separately-scrolled `<div>` gutter rendering line numbers — not a real code editor (no Monaco/CodeMirror dependency exists in `package.json`).
- "Run" button (`CodeEditor.tsx:92-100`) → `onClick={() => setHasRun(true)}` → renders the prop-passed static string `ranMessage` (`t("interview.consoleRan")`, a plain translation string). **No code is ever executed.**
- There is no "Submit" concept in the interview flow — `handleNext()` just advances to the next question.

**B. Reagvis practice challenge (`src/components/forest/ChallengeStage.tsx`):**
- Editor: plain `<textarea>` (line 125-130), no gutter, no highlighting.
- **Run** (`handleRunCode`, line 21-28): `setTimeout(700ms) → setConsoleOutput(challenge.mockRunOutput)`. `mockRunOutput` is a **pre-written string baked into the lesson's data object** (e.g. `reagvisCourses.ts:348`: `"✓ Test 1: ... Passed ...\n✓ Complexity: O(N) Time, O(N) Space verified."`) — printed regardless of what the user actually typed in the textarea.
- **Submit** (`handleSubmit`, line 30-38): `setTimeout(850ms) → setIsSuccess(true)` + a second hardcoded success string. Also unconditional — **any code, including empty/garbage input, "succeeds."**

Direct answers:
- Real editor? **No — `<textarea>`.**
- Languages supported? Cosmetically labeled "JavaScript (ES6)" / whatever `language` prop is passed; never actually parsed/executed.
- Does Run/Submit execute code? **No.**
- Real test cases? **No — a fixed string per lesson.**
- Outputs calculated? **No.**
- External judge/sandbox/worker/container service? **None exist.**
- Backend execution routes? **None (confirmed §2/§3).**
- Hidden tests, compile errors, runtime errors, timeout/memory/CPU limits, stdout/stderr separation, submission history? **None implemented — there is no execution engine to have any of these.**

---

## 12. Notes System

**Does not exist.** Grepped `src/**` for `notes`/`Notes` — the only hits are unrelated (`src/imports/*.md` planning docs, translations file has no notes keys, `StudentDashboardPage`/`CourseRecommendCard`/`ChallengeStage` hits are incidental word matches, not a notes feature — verified by reading each). No note-taking UI, no save/edit/delete, no lesson/module linkage, no backend.

---

## 13. Gamification

| Element | Current logic | Storage | Mutates? | Persists? | Meaningful or demo-only? |
|---|---|---|---|---|---|
| XP | `+120` flat per `completeCurrentLesson()` call (`AppStateContext.tsx:91`), ignores the actual lesson's `xp` field | Context state | Yes, in-memory | No | Demo-only — same +120 regardless of which lesson |
| Streak | `useState(7)`, no setter in the context's public interface | Context state | **No** | No | Purely decorative constant |
| Lives | Not implemented | — | — | — | Missing |
| Badges | `badgeDefs` array hardcoded in `StudentDashboardPage.tsx:28-35` with a static `earned: true/false` per badge | Component-local const | No | No | Demo-only, disconnected from any real event |
| Mastery | `CourseData.currentMastery`/`TrailNode.mastery`, jumps to a hardcoded `74` on first `completeCurrentLesson()` (`AppStateContext.tsx:97`) | Context state | Yes, once | No | Demo-only single hardcoded jump, not a formula |
| Achievements/Level | `StudentDashboardPage.tsx` hardcodes `xpForNextLevel = 2000`, `level = 4` | Component-local const | No | No | Purely decorative |
| Completion rewards | `UnlockCelebration.tsx` shows "+120 XP" and readiness delta on lesson completion | Presentational only | — | — | Cosmetic |

---

## 14. Course Progression

Traced exactly, from `AppStateContext.tsx:89-115` (`completeCurrentLesson`):

1. `userXP += 120` (flat, not lesson-specific).
2. `completedLessonIds` gets `currentLessonId` appended (if not already present).
3. `currentLessonId += 1` (simple integer increment — **does not consult the trail graph, node dependencies, or biome boundaries at all**).
4. `simulatedReadinessScore` is hardcoded to `74` (a single fixed jump, not a formula of any kind, and only correct the *first* time this runs — calling it again would set it to `74` again, not increase further).
5. `setCourseData` maps over `nodes`: the node whose `id === currentLessonId` (pre-increment) becomes `{status: "completed", mastery: 100}`; the node whose `id === nextId` becomes `{status: "current"}`. All other nodes are untouched — so a node that was `"locked"` stays `"locked"` even if it's the new "current" one, unless it already happened to be `"available"`.
6. `reagvisView` is set to `"complete"` (shows `UnlockCelebration`).

**What works:** lesson completion → next node flagged "current" → XP/mastery bump, for the *linear id+1* case only.

**What is missing / broken by design:**
- **Checkpoint → module unlock**, and **biome/zone unlock** (`BiomeZone.isUnlocked`) are **never mutated anywhere in the codebase** — `river`, `cave`, `canopy`, `wilds`, `caverns`, `summit` biomes stay at their hardcoded `isUnlocked: false` forever; only `grove` and `river` start `true`. Confirmed by grepping — `isUnlocked` is only ever *read*, never *written*.
- The `BiomeTrailMap.tsx` `courseZones` array (a second, parallel "zone" concept, distinct from `BiomeZone`) is fully hardcoded with `zone-1: "active"`, `zone-2`/`zone-3: "locked"` and no code path changes those strings.
- No branching/prerequisite graph — progression is a flat `id + 1`, so it cannot represent the tree/DAG structure a real "Course → Zone → Module → Checkpoint → Lesson → Activity" hierarchy needs.

---

## 15. Current AI / LLM Capabilities

Grepped `src/` for OpenAI/Anthropic/Gemini/Vertex/LangChain/model-API/`*_API_KEY` patterns: **zero code hits.** The only two hits in the whole repository are prose mentions inside `src/imports/HIREOS_MASTER_DEVELOPMENT_PROMPT.md` (lines 478 and 859) — an **aspirational planning document**, not implemented code, describing a future "LLM INTEGRATION: OpenAI API" that was never built. No provider, no model, no endpoint, no credentials, no AI SDK dependency exists. **All "AI feedback" (interview scores, coach feedback, weak-area analysis) is 100% hardcoded static data** (§7, §13) — none of it is generated by any model at request time.

---

## 16. File Storage

**None implemented.** `SetupPage.tsx` has a CV "upload" control (`fileInputRef`, drag-over state) but only ever stores the **filename string** (`cvFileName`) in context state via `setCvFileName(file.name)` — the actual `File` object/bytes are discarded, never uploaded anywhere, never read. No cloud storage SDK (`aws-sdk`, `@google-cloud/storage`, `@supabase/storage-js`, `cloudinary`, etc.) in dependencies. No object-storage or file-metadata concept exists.

---

## 17. Deployment / Infrastructure

No `Dockerfile`, no `docker-compose.yml`, no `.github/workflows/`, no `vercel.json`, `netlify.toml`, `firebase.json`, `now.json`, Kubernetes manifests, or Terraform/Pulumi files anywhere in the repo (confirmed by full-tree listing + targeted `find` for `docker*`/`*.yml`/`*.yaml`). `.figma/make/*` are Figma Make platform scripts (`dev`, `deploy`, `deploy-preview`, `install`, `format`, `langserver`, `analyze-routes`) that drive the Figma Make hosted-preview workflow specifically, not a general CI/CD or cloud-infra setup.

**Current deployment model:** the app is deployed only as a static Vite build (`pnpm build` → `dist/`) served by Figma Make's own hosting, or locally via `pnpm dev`/`pnpm preview`. **No backend infrastructure is currently deployable** because none exists to deploy.

---

## 18. Testing

No test runner in `devDependencies` (no `vitest`, `jest`, `@testing-library/react`, `playwright`, `cypress`). No `*.test.ts(x)`/`*.spec.ts(x)` files anywhere in `src/`. `package.json` has no `test` script. `oxfmt` (`pnpm format`) is a formatter, not a linter/test tool — there is also no ESLint config in this repo (contrast: the unrelated `kyc-rebase-temp` sibling project does have `eslint.config.mjs`). Only "validation" currently exercised in practice is `vite build`'s TypeScript/esbuild transform (not a full `tsc --noEmit`, which currently reports 2 pre-existing errors in `ReagvisTrailPage.tsx` around `LibraryCourse.icon`/`.category` — unrelated to this audit, unrelated to any backend). **Backend test coverage: N/A, no backend exists.**

---

## 19. Security

- **Secrets handling**: no `.env` file present; `.gitignore` does exclude `.env*`, so the repo is set up correctly *if* secrets were ever added, but none exist today because nothing calls an external service.
- **Environment variables**: only `PORT` (`vite.config.ts`, dev-server port) and `FIGMA_PUBLIC_URL` (`vite.config.ts`, asset base path) are read, both Vite/deploy-tooling concerns, not app secrets.
- **Exposed keys**: none found in source.
- **Auth checks**: N/A, no auth system (§6).
- **CORS**: N/A, no server to configure it on.
- **Input validation**: minimal to none — e.g. `SetupPage.tsx` doesn't validate uploaded file type/size beyond triggering the browser's native picker; `InterviewPage.tsx`/`ChallengeStage.tsx` textareas accept arbitrary text with no sanitization (low risk today since nothing is ever sent anywhere or executed).
- **Rate limiting**: N/A, no server.
- **Unsafe code execution risk**: the "code editor" never actually executes user input (§11), so there is currently **no `eval`/sandboxed-execution risk in this codebase** — but this also means there's no real execution to secure once one is built (that will be an entirely new surface to design carefully in Target B).
- **File upload validation**: N/A — no bytes are ever transmitted (§16).

---

# TARGET COMPARISON

## TARGET A — Learning Backend Concepts

| Concept | Classification | Note |
|---|---|---|
| User | D — missing | No auth/identity at all |
| Course | C — frontend-only | One hardcoded `CourseData`; `courseId` param exists but is unused |
| Zone | C — frontend-only | Two parallel, both-hardcoded concepts: `BiomeZone` and `BiomeTrailMap.tsx`'s local `courseZones` |
| Module | C — frontend-only | `TrailNode` doubles as "module"; flat array, not a real module boundary |
| Checkpoint | C — frontend-only | `NodeType: "checkpoint"` exists as a label on some nodes but has no distinct completion logic from `"lesson"` |
| Lesson | C — frontend-only | `LessonContent`, fully static |
| Activity | C — frontend-only | Only two activity "types" exist in practice: reading + one MCQ (`QuickCheck`) + optional code challenge; no SQL/quiz/simulation/design-challenge types exist |
| Enrollment | D — missing | No concept of enrolling into a course; `activeProduct`/`courseData` is just always-on |
| CourseProgress / ModuleProgress / LessonProgress | C — frontend-only | Collapsed into `completedLessonIds`/`currentLessonId`, in-memory only |
| Attempt / QuestionAttempt | D — missing | `QuickCheck` answer selection isn't recorded anywhere beyond the current render |
| CodeSubmission | D — missing | No submission is ever stored; "success" is unconditional (§11) |
| Note | D — missing | §12 |
| XPEvent | D — missing | XP is a single mutable counter, not an event log |
| Streak | C — frontend-only, and not even mutated | Static display value |
| Lives | D — missing | |
| Skill / UserSkill / Mastery | C — frontend-only | `weakSkills: string[]` and a single `mastery` number per node/course; no skill taxonomy, no per-skill user record |
| Recommendation / WeakSkill | C — frontend-only | Hardcoded strings in `placementPrepDemo.ts`/`reagvisCourses.ts`, not computed |
| Company / CompanyQuestionMetadata | C — frontend-only | `Company[]` in `companies.ts`; no link from a company to specific question metadata beyond the flat `questions.ts` bank |
| LearningSession | D — missing | No session object of any kind persists across a visit |

## TARGET B — Real Code Execution

**Existing**: nothing. `POST /code/run`, `POST /code/submit` do not exist; there is no queue, no isolated worker, no compiler/runtime, no test harness (§11 traced this exhaustively).

**What must be built, from scratch:**
- An API surface (`run`/`submit`) with request validation (language, source, stdin).
- Execution backend: either a managed judge API (e.g. Judge0-style service) or a self-hosted sandboxed worker pool (containers/gVisor/Firecracker) — a genuinely new infrastructure component, not an extension of anything here.
- A test harness format (visible + hidden test definitions) — today's `PracticeChallenge` type has no test-case array at all, only a single `expectedOutput` string and a free-text `mockRunOutput`.
- Resource limiting (timeout/memory/CPU), stdout/stderr capture, structured result + submission history storage (needs Target A's `CodeSubmission`/`Attempt` models and a database, both currently absent).
- Frontend rewrite of `ChallengeStage.tsx`'s Run/Submit handlers to call the new API instead of `setTimeout`.

## TARGET C — Notes

**Existing**: nothing (§12). **Missing**: the entire feature — UI, per-user persistence, and the `GET/POST/PATCH/DELETE` API, plus the `User`/`Note` backend models from Target A.

## TARGET D — Progress

**Existing**: an in-memory shape that *conceptually* matches part of the target (course/module/lesson/XP/mastery/attempts-adjacent fields already exist as JS variables in `AppStateContext.tsx`). **Missing**: everything that makes it "backend progress" — persistence, a `User` to own it, and an API/DB to read/write it. Streak and lives specifically don't even have functioning in-memory logic today (§13).

## TARGET E — Adaptive Learning

**No infrastructure exists for this at all.** There is no attempt log, no hint-count tracking, no time-spent tracking, no per-question difficulty metadata beyond a coarse `"Easy"/"Medium"/"Hard"` string on one type (`PracticeChallenge.difficulty`), and no recommendation engine of any kind — `demoAnalysis`/`demoPlacementReport`'s "recommendations" are pre-written strings, not computed from any input.

## TARGET F — Interview Handoff

**No such object currently exists as data — but the shape it should take is already implied by two things that DO exist:**
- `dsaCourseData.weakSkills: string[]` and `assessmentScore: number` (`reagvisCourses.ts`) — this is effectively already "the smallest clean contract," just hand-filled instead of computed.
- `CourseRecommendCard` props in `ResultsPage.tsx` (`title`, `score`, `maxScore`, `focusAreas`, `duration`, `lessonsCount`, `courseId`) is the closest thing to a real "Interview → Reagvis" handoff shape already in the UI layer.

**Recommendation (not implemented, per instructions):** the smallest clean contract that would bridge Interview → Reagvis without coupling the systems is something isomorphic to:
```ts
interface InterviewToLearningHandoff {
  recommendedCourseId: string       // matches LibraryCourse.id / CourseData.id
  weakSkills: string[]              // matches CourseData.weakSkills today
  startingModuleId?: number         // matches TrailNode.id
  difficulty?: string
  targetCompanyIds?: string[]       // matches Company.id
}
```
This would replace today's implicit assumption (baked into `ResultsPage.tsx`'s JSX) that the recommended course is always `"dsa-foundations"`.

## TARGET G — Multiple Courses

**Not genuinely multi-course capable today.** Confirmed in §9: `startLearningTrail(courseId)` ignores its argument; `courseData` is permanently `dsaCourseData`; every "Enter Trail" button across `libraryCourses` routes into the same DSA `CourseData` object regardless of which card was clicked.

**DSA-specific hardcoding that blocks multi-course support:**
- `AppStateContext.tsx:59-60`: `useState<CourseData>(dsaCourseData)` / `useState<TrailNode | null>(dsaCourseData.nodes[2])` — hardcoded import, hardcoded starting node index.
- `AppStateContext.tsx:71`: `startLearningTrail(_courseId: string = "dsa-foundations")` — parameter unused, default is the tell.
- `reagvisCourses.ts` only exports **one** `CourseData` object; there is no course registry/lookup-by-id function (`findCompany`-style) for `CourseData`, unlike `companies.ts` which does have `findCompany`.
- `BiomeTrailMap.tsx`'s scenic assets (Alpine mountains/cabins/pine trees, `AlpineMountainRange`/`AlpineCabin`/`AlpinePineTree`) and copy ("Alpine DSA Trail", biome names like "Trailhead Grove"/"Recursion Cave") are DSA-narrative-specific, hardcoded into JSX, not theme-able per course.
- `ResultsPage.tsx`'s course-recommendation card hardcodes `courseId="dsa-foundations"` (line ~260) as a literal prop value.

---

# REQUIRED GAP ANALYSIS

| Capability | Exists? | Current Implementation | Production Ready? | Missing Work | Files Affected | Backend Needed? | Complexity |
|---|---|---|---|---|---|---|---|
| Authentication | No | — | No | Full auth system (identity, session/JWT, protected routes) | New backend + `AppStateContext.tsx`, all page components reading `candidateName` | Yes | L |
| Database / persistence layer | No | Static TS constants only | No | Schema design, ORM, migrations, hosting | New backend | Yes | L |
| Course content API | No | Hardcoded imports from `src/data/*` | No | `GET /courses`, `/courses/:id`, content versioning | New backend; `reagvisCourses.ts` consumers (`ReagvisTrailPage.tsx`, `BiomeTrailMap.tsx`, `LessonReader.tsx`) | Yes | M |
| Progress persistence | Partial (in-memory shape exists) | `AppStateContext.tsx` | No | Persist `completedLessonIds`/XP/mastery/currentLessonId server-side, tie to a `User` | New backend + `AppStateContext.tsx` | Yes | M |
| Notes | No | — | No | Full feature: UI + CRUD API + persistence | New components + new backend | Yes | M |
| Compiler/execution | No | Mocked (`ChallengeStage.tsx`, `CodeEditor.tsx`) | No | Real sandboxed execution service, test harness, security hardening | New backend/infra; `ChallengeStage.tsx`, `PracticeChallenge` type | Yes | XL |
| Submissions | No | Unconditional fake success | No | `CodeSubmission` model + history UI | New backend; `ChallengeStage.tsx` | Yes | M |
| Adaptive learning | No | — | No | Attempt/telemetry logging, mastery formula, recommendation logic | New backend; touches almost every learning component | Yes | XL |
| Recommendations | No (hardcoded) | Static strings in `placementPrepDemo.ts`/`reagvisCourses.ts` | No | Real computation from interview + learning telemetry | New backend (can start as a pure function once Target E exists) | Eventually | L |
| Interview handoff object | Partial (implicit shape exists) | `CourseRecommendCard` props, `weakSkills` field | No | Formalize as a real payload from a real interview result | Frontend contract first (S), backend once interview is un-frozen (M) | Later | S→M |
| Multi-course data model | No (facade only) | `libraryCourses` (metadata) vs. one real `CourseData` | No | Real `CourseData` per course id, registry/lookup fn, decouple scenic theming from DSA | `AppStateContext.tsx`, `reagvisCourses.ts`, `BiomeTrailMap.tsx`, scenic components | Frontend-first, then backend content API | L |
| Real code editor (Monaco/CodeMirror) | No | `<textarea>` | No | Swap editor library, syntax highlighting, language modes | `CodeEditor.tsx`, `ChallengeStage.tsx` | No (frontend only) | S |
| Gamification backend (XP/streak/lives/badges) | Partial (frontend shape) | `AppStateContext.tsx`, `StudentDashboardPage.tsx` | No | Event-sourced XP log, real streak calculation, badge-earning rules engine | New backend; `AppStateContext.tsx`, `StudentDashboardPage.tsx` | Yes | M |
| Company-question integration | Partial | `Company[]` + flat `questions.ts`, no link between them | No | `CompanyQuestionMetadata` relation, per-company question sets | New backend; `companies.ts`, `questions.ts` | Yes | M |
| File storage (CV upload) | No (filename only) | `SetupPage.tsx` discards the `File` object | No | Real upload endpoint + object storage | New backend + `SetupPage.tsx` | Yes | S |
| Deployment/infra for a backend | No | Static Vite build only | No | Choose runtime (Node/Deno/edge), containerize, CI/CD, env/secrets management | New infra | Yes | M |
| Testing (any layer) | No | None | No | Introduce a test runner, write frontend unit/E2E tests, add backend test suite once backend exists | Whole repo | Partly | M |

---

# REQUIRED IMPLEMENTATION PHASES

### PHASE 0 — Current demo stabilization
- **Reusable**: everything in §7-§13 as-is; it is a coherent, working *demo* of the target UX.
- **Frontend work**: none required, optional polish only (fix the pre-existing `ReagvisTrailPage.tsx` `LibraryCourse.icon`/`.category` TS errors noted in §18).
- **Backend/DB/infra work**: none.
- **Tests**: none required to keep demoing.
- **Blockers**: none — this phase is effectively done.

### PHASE 1 — Learning model normalization (frontend-only, no backend yet)
- **Reusable**: `CourseData`/`TrailNode`/`LessonContent`/`BiomeZone` types are a reasonable starting shape.
- **Frontend work**: give `reagvisCourses.ts` a real course *registry* (`Record<string, CourseData>` + a `findCourse(id)` lookup like `companies.ts`'s `findCompany`); make `startLearningTrail(courseId)` actually swap `courseData`; reconcile the two competing "zone" concepts (`BiomeZone` vs. `BiomeTrailMap.tsx`'s local `courseZones`) into one; add a real test-case array to `PracticeChallenge` instead of one `expectedOutput` string.
- **Backend/DB/infra**: none yet.
- **Tests**: introduce a test runner here (currently none exist) and cover the new lookup/registry logic.
- **Blockers**: none; purely additive to existing types.

### PHASE 2 — Persistence backend
- **Reusable**: Phase 1's normalized types become the API/DB schema's starting point directly.
- **Frontend work**: replace `AppStateContext.tsx`'s local `useState` for progress fields with API calls (behind the same context interface, to minimize churn in consumers).
- **Backend work**: stand up the first real backend (framework/runtime choice), implement `User`, `Course`, `Enrollment`, `CourseProgress`/`ModuleProgress`/`LessonProgress`.
- **Database work**: schema + migrations for the above.
- **Infra work**: hosting for the backend, DB hosting, secrets management (the `.gitignore` already excludes `.env*`, good starting point).
- **Tests**: backend unit/integration tests; contract tests against the frontend.
- **Blockers**: needs Target A's model decisions finalized; needs auth (or at least a stub user) to attach progress to.

### PHASE 3 — Real compiler service
- **Reusable**: `ChallengeStage.tsx`'s UI shell (problem panel, editor panel, console panel) and `PracticeChallenge`'s `starterCode`/`solutionHint` fields.
- **Frontend work**: swap `<textarea>` for a real editor (Monaco/CodeMirror); wire Run/Submit to the new API; render real stdout/stderr/test-by-test results instead of one string.
- **Backend work**: `POST /code/run`, `POST /code/submit`, queue + sandboxed worker integration (build vs. buy decision).
- **Database work**: `CodeSubmission` history.
- **Infra work**: this is the highest-risk infra addition — isolated execution environments, resource limits, abuse prevention.
- **Tests**: security-focused tests (sandbox escape attempts), correctness tests against known-good/known-bad submissions.
- **Blockers**: Phase 2 (needs `User`/`Attempt` to attach submissions to); a real test-case schema from Phase 1.

### PHASE 4 — Progress/gamification backend
- **Reusable**: Phase 2's persistence layer.
- **Frontend work**: `StudentDashboardPage.tsx`'s badges/streak/level become data-driven instead of hardcoded arrays; `TrailHUD.tsx`'s XP/streak read from the backend.
- **Backend work**: `XPEvent` log (event-sourced, not a single mutable counter as today), real streak calculation (calendar-aware), badge rules engine, `lives` concept if the product wants one.
- **Database work**: event tables, badge definitions.
- **Blockers**: Phase 2.

### PHASE 5 — Adaptive learning
- **Reusable**: nothing existing — genuinely new subsystem.
- **Frontend work**: surface recommendations/mastery in the UI (`ResultsPage.tsx`'s and `BiomeTrailMap.tsx`'s hardcoded sections become dynamic).
- **Backend work**: attempt/telemetry ingestion (`Attempt`, `QuestionAttempt`), mastery-scoring formula, a recommendation function (skip/continue/reinforcement/harder/review-later).
- **Database work**: telemetry storage (likely higher write volume — worth its own scaling consideration).
- **Blockers**: Phase 2 (needs real `Attempt` records), Phase 3 (needs real submission telemetry for coding items).

### PHASE 6 — Company-question integration
- **Reusable**: `companies.ts`'s `Company[]`/`findCompany`, `questions.ts`'s `Question[]`.
- **Frontend work**: Setup/Admin pages surface company-specific question sets instead of the one global bank.
- **Backend work**: `CompanyQuestionMetadata` relation, admin tooling to manage it.
- **Database work**: join table/relation.
- **Blockers**: none technical; mostly a content-authoring effort once the schema exists.

### PHASE 7 — Interview integration (un-freezing)
- **Reusable**: the entire preserved interview UI (`LandingPage`/`SetupPage`/`InterviewPage`/`ResultsPage`), the `INTERVIEW_FLOW_ENABLED` flag already built for exactly this switch-over, and Target F's handoff-contract sketch above.
- **Frontend work**: flip `developmentMode.ts`, replace `ResultsPage.tsx`'s hardcoded score/metrics with real interview-result data, implement the `InterviewToLearningHandoff` payload and pass it into Reagvis's `startLearningTrail`.
- **Backend work**: real interview scoring (this is also where an actual LLM integration — currently 100% absent, §15 — would first become necessary if AI-generated feedback is wanted).
- **Database work**: `InterviewSession`/`InterviewAnswer` persistence.
- **Blockers**: Phase 2 (persistence), Phase 5 if scoring should factor in adaptive signals, and a product decision on whether interview scoring uses a real LLM or a deterministic rubric.

### PHASE 8 — Multi-course expansion
- **Reusable**: Phase 1's course registry.
- **Frontend work**: decouple `BiomeTrailMap.tsx`'s Alpine/forest scenic theme from DSA-specific copy so other courses (DBMS, SQL, OS, Networks, OOP, System Design) can use their own theming or a shared neutral theme; author `CourseData` content for each.
- **Backend work**: course-content CRUD/admin tooling once Phase 2's API exists.
- **Database work**: none beyond Phase 2's `Course` table already being multi-row-capable.
- **Blockers**: Phase 1 must land first (today's single-course hardcoding, §9/Target G, is the direct blocker).

---

# BACKEND COMPLETENESS ESTIMATE

**Authentication:** Missing
**Database:** Missing
**Course content API:** Missing
**Progress persistence:** Missing *(in-memory shape exists in the frontend, nothing survives past a page refresh)*
**Notes:** Missing
**Compiler:** Missing
**Submissions:** Missing
**Adaptive learning:** Missing
**Recommendations:** Missing *(hardcoded strings stand in for it)*
**Interview handoff:** Missing *(an implicit, hand-filled version of the shape already exists in the UI props/data)*
**Analytics:** Missing *(no analytics/telemetry collection anywhere — not even the Figma Make Google Analytics hook in `vite.config.ts` is populated with an ID by default)*
**Deployment (backend):** Missing *(frontend static-hosting deploy only)*

### "WHAT WE CAN REUSE"
- All React UI components/pages as the visual and interaction layer (`ReagvisTrailPage`, `BiomeTrailMap`, `LessonReader`, `ChallengeStage`, `TrailHUD`, `UnlockCelebration`, `StudentDashboardPage`, the whole interview UI).
- The TypeScript interfaces in `reagvisCourses.ts` (`CourseData`, `TrailNode`, `LessonContent`, `QuickCheck`, `PracticeChallenge`, `BiomeZone`) as a strong starting point for a real DB schema/API contract.
- `companies.ts`'s `findCompany`-style lookup pattern as the template for the course-registry lookup Phase 1 needs.
- `src/config/developmentMode.ts` and the `INTERVIEW_FLOW_ENABLED` gating already built for exactly the interview/course cutover Phase 7 will need.
- `CourseRecommendCard`'s existing prop shape and `dsaCourseData.weakSkills`/`assessmentScore` fields as the seed for the Interview→Reagvis handoff contract (Target F).

### "WHAT MUST BE BUILT"
- An entire backend service (framework/runtime, hosting, CI/CD) — there is currently none.
- A database and schema for every Target A concept.
- Authentication/identity.
- A real code execution service (compiler/sandbox/test harness) — the highest-complexity net-new piece.
- Notes feature end-to-end (UI + API + storage).
- A course-content API and a real multi-course registry (today: one course, `courseId` ignored).
- Adaptive-learning/recommendation logic — currently 0% implemented, not even a stub formula.
- Any real AI/LLM integration, if the product wants AI-generated interview or lesson feedback — today it's 100% hardcoded strings, and no SDK/provider is wired up.

### "WHAT SHOULD REMAIN MOCKED FOR THE CURRENT DEMO"
- The interview "recording" UI (no real camera/mic pipeline needed until Phase 7 makes a firm product call on it).
- `ChallengeStage.tsx`'s Run/Submit mock output, until Phase 3 is actually scheduled — the current mock is good enough to keep demoing the UX.
- Course-library cards for courses that don't exist yet (System Design, DBMS, OS, Networks, Behavioral) — fine to keep as "coming soon" static cards until Phase 8.
- Badges/streak in `StudentDashboardPage.tsx` — fine to keep as static/demo values until Phase 4.

---

# FILE-LEVEL PLAN (proposed only — nothing below was created or modified as part of this audit)

## FRONTEND

**Can remain unchanged (for now):**
`src/main.tsx`, `src/index.css`, `src/i18n/*`, `src/components/OwlAvatar.tsx`, `src/components/LanguageToggle.tsx`, `src/components/forest/scenic/*`, `src/components/ProgressTimeline.tsx`, `src/pages/AdminPage.tsx` (until Phase 6/backend admin needs wiring).

**Should later be modified:**
`src/state/AppStateContext.tsx` (swap local `useState` for API-backed state, Phase 2), `src/data/reagvisCourses.ts` (become a registry / move to API-fetched content, Phase 1 & 2), `src/pages/ReagvisTrailPage.tsx` + `src/components/forest/BiomeTrailMap.tsx` (real multi-course + multi-zone support, Phase 1 & 8), `src/components/forest/ChallengeStage.tsx` + `src/components/CodeEditor.tsx` (real editor + real execution calls, Phase 3), `src/pages/ResultsPage.tsx` (real interview-result rendering + real handoff payload, Phase 7), `src/pages/StudentDashboardPage.tsx` (real gamification data, Phase 4), `src/pages/SetupPage.tsx` (real file upload, Phase 2/16).

**Should eventually be created:**
An API client module (e.g. `src/lib/api.ts` or similar), a Notes feature (`src/pages/NotesPage.tsx` or a panel component + hook), an auth context/provider, a course-registry lookup module.

## BACKEND *(does not exist yet — proposed net-new tree)*
`server/` (or equivalent) with: route/controller layer for courses, progress, notes, submissions, recommendations; a service layer; a data-access layer; an auth module.

## SHARED TYPES
Candidate: extract `CourseData`/`TrailNode`/`LessonContent`/etc. (currently only in `src/data/reagvisCourses.ts`) into a package/directory shared between frontend and the future backend, so the API contract and the frontend types can't drift.

## DATABASE *(does not exist yet)*
Schema/migrations directory, seed scripts mirroring today's `dsaCourseData` as the first seeded course.

## INFRASTRUCTURE *(does not exist yet)*
`Dockerfile`(s), CI workflow, environment/secrets configuration, hosting config for the new backend + database.

---

## Validation notes

- Every claim above was checked against actual source — file paths and, where practical, line numbers are cited inline.
- Where something could not be verified from code (e.g. hosting provider choices, future intent), it is explicitly labeled "not implemented" / "missing" rather than inferred.
- No backend routes, database tables, or API endpoints were assumed to exist; §2-§5 report their absence directly from dependency and file-tree inspection, not guesswork.
