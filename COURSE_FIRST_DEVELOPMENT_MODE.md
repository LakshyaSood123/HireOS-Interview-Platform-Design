# Course-First Development Mode

## ⚠️ Current Project Mode

**STATUS: ACTIVE**

The project is temporarily operating in:

**COURSE-FIRST DEVELOPMENT MODE**

Current development priority is the post-interview and Reagvis Labs learning/course experience.

The HireOS interview implementation has **NOT been removed**.

It is intentionally frozen through centralized frontend configuration while the course experience is developed.

---

## Current Active Product Flow

```text
Application Start
      ↓
Post-Interview Results
      ↓
Weak Topic Diagnosis
      ↓
Recommended Course
      ↓
Reagvis Trails
      ↓
Course World
      ↓
Module
      ↓
Module Roadmap
      ↓
Lesson
      ↓
Practice / Challenge
      ↓
Completion / Progress
```

---

## Temporarily Frozen Flow

```text
Landing
   ↓
Setup        [FROZEN]
   ↓
Interview    [FROZEN]
   ↓
Results
```

Landing may remain available for visual/reference purposes, but actions entering Setup/Interview are gated while the freeze is active.

---

## Source of Truth

The freeze is controlled by:

`src/config/developmentMode.ts`

Current configuration:

```ts
DEVELOPMENT_MODE = {
  COURSE_FIRST_MODE: true,
  INTERVIEW_FLOW_ENABLED: false,
  DEFAULT_ENTRY: "results",
}
```

Do not implement additional unrelated interview guards elsewhere without referencing this configuration.

---

## What Is Temporarily Disabled

While Interview Flow is disabled:

- Setup entry
- Interview entry
- Start Interview
- New Interview
- Start Another Interview
- Try Interview Again
- Retake Interview
- equivalent navigation into Setup/Interview
- interview API invocation, if such API calls exist (none currently — this is a frontend page-state freeze, not a backend gate)

---

## What Remains Active

The following remain active and are the current development priority:

- Results
- Post-interview diagnosis
- Weak-topic recommendations
- Placement/report learning recommendations
- Reagvis Trails
- Course World
- Course Library
- Module experience
- Module Roadmaps
- Lessons
- Quick Checks
- Challenges
- XP / mastery / readiness/progress
- Completion/unlock flow

---

## Interview Code Is Preserved

DO NOT DELETE the interview implementation.

Important preserved areas include:

- `src/pages/LandingPage.tsx`
- `src/pages/SetupPage.tsx`
- `src/pages/InterviewPage.tsx`
- interview question data (`src/data/questions.ts`, `src/data/companies.ts`)
- interview state/session structures (`src/state/AppStateContext.tsx`, `src/data/placementPrepDemo.ts`)
- simulated interview functionality
- interview → results flow
- retake/start-another functionality (`retakeInterview` in `AppStateContext.tsx`, gated but not removed)
- related translations/styles (`src/i18n/translations.ts`)

The current freeze is intended to be reversible.

---

## Why This Mode Exists

The current development phase is focused on completing and polishing the Reagvis Labs course experience first.

The intended eventual complete ecosystem is:

```text
Interview
    ↓
Diagnosis
    ↓
Recommended Learning
    ↓
Reagvis Course
    ↓
Skill Improvement
    ↓
Retake Interview
```

The first and final Interview portions will be resumed later.

---

## How to Unfreeze the Interview Flow

When interview development resumes:

### 1. Open

`src/config/developmentMode.ts`

### 2. Change configuration to:

```ts
COURSE_FIRST_MODE = false
INTERVIEW_FLOW_ENABLED = true
DEFAULT_ENTRY = "landing"
```

### 3. Verify previously gated navigation becomes visible/active

Check:

- Landing → Setup
- Setup → Interview
- Interview → Results
- Results → New Interview
- Admin → New Interview
- Placement → Try Interview Again
- Reagvis → Retake Interview

### 4. Restore demo-nav entries

`visibleNavItems` in `src/App.tsx` will automatically include Setup and Interview again once `INTERVIEW_FLOW_ENABLED` is `true` — verify they appear in the bottom demo navigator.

### 5. Verify mock/demo data remains compatible

### 6. Run:

```bash
pnpm build
```

### 7. Manually test:

```text
Landing
→ Setup
→ Interview
→ Results
→ Reagvis Trails
→ Course
→ Retake Interview
```

Only after that should the freeze be considered removed.

---

## New Developer / Clone Instructions

After cloning:

```bash
pnpm install
pnpm dev
```

If the application opens directly on Results rather than Landing:

**THIS IS EXPECTED.**

It means Course-First Development Mode is active.

Do not "fix" this by changing `App.tsx` manually.

Read:

`src/config/developmentMode.ts`

before changing application entry behavior.

---

## Development Rule

Until this document is explicitly updated:

**Course-side development takes priority.**

Do not independently reactivate the interview flow simply because its files still exist.

---

## Date Activated

2026-09-15

---

## Reactivation Checklist

- [ ] Set `COURSE_FIRST_MODE = false`
- [ ] Set `INTERVIEW_FLOW_ENABLED = true`
- [ ] Default entry restored to Landing
- [ ] Setup reachable
- [ ] Interview reachable
- [ ] Results flow verified
- [ ] New Interview restored
- [ ] Start Another restored
- [ ] Retake Interview restored
- [ ] Demo navigation restored
- [ ] `pnpm build` passes
- [ ] Full end-to-end flow manually tested

---

**If you are an AI coding agent:** Do not remove this freeze or modify the interview subsystem unless the user explicitly asks you to resume interview development.
