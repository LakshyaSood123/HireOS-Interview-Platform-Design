import { useMemo } from "react"
import { useAppState } from "../state/AppStateContext"
import {
  getCourseById,
  findCheckpoint,
  findModuleForCheckpoint,
  findZoneForModule,
} from "./courseRegistry"

export type LearningScreenType =
  | "course-library"
  | "dsa-world"
  | "zone"
  | "module"
  | "module-roadmap"
  | "lesson"
  | "concept-theory"
  | "quick-check"
  | "algorithm-animation"
  | "code-trace"
  | "coding-challenge"
  | "interview-results"
  | "interview-session"
  | "dashboard"
  | "general"

export interface LearningScreenContext {
  screenType: LearningScreenType
  screenId: string
  title: string
  subtitle?: string
  breadcrumb: string[]

  courseId?: string
  courseTitle?: string

  zoneId?: string
  zoneTitle?: string

  moduleId?: string
  moduleTitle?: string

  checkpointId?: string
  checkpointTitle?: string

  activityType?: string
  activityTitle?: string

  problemId?: string
  problemTitle?: string

  animationId?: string
  pageKey?: string
}

/**
 * Derives the canonical learning screen context from the active application state.
 * Both Feedback and Trail Guide use this as their single source of truth.
 */
export function deriveLearningScreenContext(appState: {
  activeProduct: "hireos" | "reagvis"
  reagvisView: string
  activeCourseId: string
  activeZoneId: string | null
  activeModuleId: string | null
  viewedModuleId: string | null
  viewedCheckpointId: string | null
  interviewSession: { company: string; jobTitle: string } | null
}): LearningScreenContext {
  const {
    activeProduct,
    reagvisView,
    activeCourseId,
    activeZoneId,
    viewedModuleId,
    viewedCheckpointId,
    interviewSession,
  } = appState

  if (activeProduct === "reagvis") {
    const course = getCourseById(activeCourseId)
    const courseTitle = course?.title ?? "DSA World"

    // ── 1. LESSON WORKSPACE VIEW ──
    if (reagvisView === "workspace" && viewedCheckpointId) {
      const viewedModule =
        course?.zones.flatMap(z => z.modules).find(m => m.id === viewedModuleId) ??
        (course ? findModuleForCheckpoint(course, viewedCheckpointId) : undefined)
      const viewedCheckpoint =
        viewedModule?.checkpoints.find(cp => cp.id === viewedCheckpointId) ??
        (course ? findCheckpoint(course, viewedCheckpointId) : undefined)
      const zone = course && viewedModule ? findZoneForModule(course, viewedModule.id) : undefined

      const moduleTitle = viewedModule?.title ?? "Module"
      const checkpointTitle = viewedCheckpoint?.title ?? "Lesson Checkpoint"
      const workspace = viewedCheckpoint?.workspace

      if (workspace?.codingActivity) {
        const functionName = workspace.codingActivity.functionName
        return {
          screenType: "coding-challenge",
          screenId: viewedCheckpointId,
          title: checkpointTitle,
          subtitle: `${moduleTitle} • ${functionName}`,
          breadcrumb: ["Reagvis Trails", courseTitle, moduleTitle, checkpointTitle],
          courseId: activeCourseId,
          courseTitle,
          zoneId: zone?.id ?? undefined,
          zoneTitle: zone?.title ?? undefined,
          moduleId: viewedModule?.id ?? viewedModuleId ?? undefined,
          moduleTitle,
          checkpointId: viewedCheckpointId,
          checkpointTitle,
          activityType: "coding-challenge",
          activityTitle: "Coding Checkpoint",
          problemId: functionName,
          problemTitle: functionName,
        }
      }

      if (
        workspace?.animation ||
        workspace?.visual ||
        workspace?.callStackVisual ||
        workspace?.twoPointerVisual
      ) {
        const animationId =
          workspace.animation?.id ??
          (workspace.twoPointerVisual
            ? "two-pointers"
            : workspace.callStackVisual
              ? "call-stack"
              : workspace.visual
                ? "tree-traversal"
                : undefined)

        return {
          screenType: "algorithm-animation",
          screenId: viewedCheckpointId,
          title: checkpointTitle,
          subtitle: `${moduleTitle} • Algorithm Animation`,
          breadcrumb: ["Reagvis Trails", courseTitle, moduleTitle, checkpointTitle],
          courseId: activeCourseId,
          courseTitle,
          zoneId: zone?.id ?? undefined,
          zoneTitle: zone?.title ?? undefined,
          moduleId: viewedModule?.id ?? viewedModuleId ?? undefined,
          moduleTitle,
          checkpointId: viewedCheckpointId,
          checkpointTitle,
          activityType: "algorithm-animation",
          activityTitle: "Algorithm Animation",
          animationId,
        }
      }

      if (workspace?.quickCheck) {
        return {
          screenType: "quick-check",
          screenId: viewedCheckpointId,
          title: checkpointTitle,
          subtitle: `${moduleTitle} • Quick Check`,
          breadcrumb: ["Reagvis Trails", courseTitle, moduleTitle, checkpointTitle],
          courseId: activeCourseId,
          courseTitle,
          zoneId: zone?.id ?? undefined,
          zoneTitle: zone?.title ?? undefined,
          moduleId: viewedModule?.id ?? viewedModuleId ?? undefined,
          moduleTitle,
          checkpointId: viewedCheckpointId,
          checkpointTitle,
          activityType: "quick-check",
          activityTitle: "Quick Check",
        }
      }

      return {
        screenType: "lesson",
        screenId: viewedCheckpointId,
        title: checkpointTitle,
        subtitle: moduleTitle,
        breadcrumb: ["Reagvis Trails", courseTitle, moduleTitle, checkpointTitle],
        courseId: activeCourseId,
        courseTitle,
        zoneId: zone?.id ?? undefined,
        zoneTitle: zone?.title ?? undefined,
        moduleId: viewedModule?.id ?? viewedModuleId ?? undefined,
        moduleTitle,
        checkpointId: viewedCheckpointId,
        checkpointTitle,
        activityType: "concept-theory",
        activityTitle: "Concept Theory",
      }
    }

    // ── 2. MODULE ROADMAP VIEW ──
    if (reagvisView === "roadmap" && viewedModuleId) {
      const viewedModule = course?.zones.flatMap(z => z.modules).find(m => m.id === viewedModuleId)
      const zone = course && viewedModule ? findZoneForModule(course, viewedModule.id) : undefined
      const moduleTitle = viewedModule?.title ?? "Module"

      return {
        screenType: "module-roadmap",
        screenId: `roadmap-${viewedModuleId}`,
        title: `${moduleTitle} Roadmap`,
        subtitle: courseTitle,
        breadcrumb: ["Reagvis Trails", courseTitle, moduleTitle],
        courseId: activeCourseId,
        courseTitle,
        zoneId: zone?.id ?? undefined,
        zoneTitle: zone?.title ?? undefined,
        moduleId: viewedModuleId,
        moduleTitle,
        activityType: "module-roadmap",
        activityTitle: "Module Roadmap",
      }
    }

    // ── 3. COURSE LIBRARY VIEW ──
    if (reagvisView === "library") {
      return {
        screenType: "course-library",
        screenId: "course-library",
        title: "Course Library",
        subtitle: "All Course Biomes",
        breadcrumb: ["Reagvis Trails", "Course Library"],
        courseId: activeCourseId,
        courseTitle,
        activityType: "course-library",
        activityTitle: "Course Library",
      }
    }

    // ── 4. EXPEDITION BRIEF VIEW ──
    if (reagvisView === "intro") {
      return {
        screenType: "general",
        screenId: "expedition-brief",
        title: "Expedition Briefing",
        subtitle: "Diagnostic Transfer",
        breadcrumb: ["Reagvis Trails", "Expedition Brief"],
        courseId: activeCourseId,
        courseTitle,
      }
    }

    // ── 5. DEFAULT REAGVIS VIEW: DSA WORLD MAP ──
    const zone = activeZoneId ? course?.zones.find(z => z.id === activeZoneId) : undefined
    return {
      screenType: "dsa-world",
      screenId: "dsa-world-map",
      title: "DSA World",
      subtitle: "Alpine Trail Map",
      breadcrumb: ["Reagvis Trails", courseTitle],
      courseId: activeCourseId,
      courseTitle,
      zoneId: activeZoneId ?? undefined,
      zoneTitle: zone?.title ?? undefined,
      activityType: "world-map",
      activityTitle: "DSA World Map",
    }
  }

  // ── 6. HIREOS INTERVIEW / RESULTS SCREENS ──
  if (interviewSession) {
    return {
      screenType: "interview-results",
      screenId: "interview-results",
      title: "Interview Diagnostic Results",
      subtitle: interviewSession.jobTitle,
      breadcrumb: ["HireOS", "Interview Results", interviewSession.jobTitle],
    }
  }

  return {
    screenType: "general",
    screenId: "hireos-platform",
    title: "HireOS Platform",
    subtitle: "Technical Readiness",
    breadcrumb: ["HireOS"],
  }
}

/**
 * React hook that returns the current canonical learning screen context.
 */
export function useLearningScreenContext(): LearningScreenContext {
  const appState = useAppState()
  return useMemo(() => deriveLearningScreenContext(appState), [
    appState.activeProduct,
    appState.reagvisView,
    appState.activeCourseId,
    appState.activeZoneId,
    appState.activeModuleId,
    appState.viewedModuleId,
    appState.viewedCheckpointId,
    appState.interviewSession,
  ])
}
