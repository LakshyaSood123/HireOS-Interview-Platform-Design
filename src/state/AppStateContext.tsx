import { createContext, useContext, useState, useMemo, useEffect } from "react"
import type { ReactNode } from "react"
import type { InterviewSessionData } from "../data/placementPrepDemo"
import { dsaCourseData, type CourseData, type TrailNode } from "../data/reagvisCourses"
import { DEVELOPMENT_MODE } from "../config/developmentMode"
import type { ProgressState } from "../learning/types"
import type { LearnerProgressState } from "../learning/progressEngine"
import {
  completeCheckpoint,
  recordFailedSubmit,
  resolveModuleState,
  resolveAllModuleStates,
  resolveAllZoneStates,
  resolveCheckpointState,
  DEFAULT_LIVES,
} from "../learning/progressEngine"
import { getCourseById, isCourseAvailable, findCheckpoint } from "../learning/courseRegistry"
import { deriveLegacyCourseData } from "../learning/legacyAdapter"
import { LocalProgressRepository } from "../learning/progressRepository"
import { MockRecommendationProvider } from "../learning/services/recommendationProvider"
import { completeCheckpointOnBackend, fetchCourseState } from "../learning/services/progressApi"
import { ApiUnavailableError, SessionExpiredError } from "../learning/services/apiClient"
import { useAuth } from "../auth/AuthContext"

/** The one course wired to backend progress in this phase. Every other
 * course id keeps behaving exactly as it did before (local-only). */
const BACKEND_COURSE_ID = "dsa-foundations"

export type ProgressSyncStatus = "idle" | "loading" | "synced" | "error"

export type ActiveProduct = "hireos" | "reagvis"
export type ReagvisView =
  | "intro"
  | "map"
  | "library"
  | "lesson"
  | "challenge"
  | "complete"
  | "roadmap"
  | "workspace"
  | "cms-course"

const progressRepository = new LocalProgressRepository()
const recommendationProvider = new MockRecommendationProvider()

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** DEMO/DEVELOPMENT bootstrap — NOT a stand-in for real backend seeding.
 *
 * Conceptually this is what `MockRecommendationProvider().getHandoff()`
 * already implies: the (mock) interview diagnosed weak Trees/Graphs skills
 * and recommended starting the DSA course at the Trees module. This seeds a
 * learner progress snapshot that matches that story — earlier prerequisite
 * modules (Foundations, Linked Structures, Recursion) already completed,
 * Trees genuinely CURRENT (it now has real authored content — see
 * src/learning/content/treesModule.ts — so this is no longer "faking"
 * anything the way seeding it before the Trees vertical slice would have),
 * everything after Trees still LOCKED.
 *
 * This goes through the same `LearnerProgressState`/`ProgressRepository`
 * every other progress read/write uses — nothing here bypasses the
 * prerequisite engine or hardcodes a status directly into scenic JSX. When
 * a real interview result exists, replace this function's body with
 * `interviewRecommendationProvider.getHandoff()` -> an equivalent snapshot;
 * every caller of `buildDemoLearnerBootstrap` stays the same. */
function buildDemoLearnerBootstrap(courseId: string): LearnerProgressState {
  return {
    activeCourseId: courseId,
    activeZoneId: "recursive-forest",
    activeModuleId: "trees",
    activeCheckpointId: "trees-1",
    completedCheckpointIds: [
      "foundations-1", "foundations-2", "foundations-3", "foundations-4", "foundations-5",
      "linked-structures-1", "linked-structures-2", "linked-structures-3", "linked-structures-4", "linked-structures-5",
      "recursion-1", "recursion-2", "recursion-3", "recursion-4", "recursion-5",
    ],
    masteredCheckpointIds: [],
    xp: 1240,
    streak: 7,
    lives: DEFAULT_LIVES,
    lastActivityDate: null,
  }
}

interface AppStateValue {
  // Existing HireOS states
  candidateName: string
  setCandidateName: (name: string) => void
  companyId: string | null
  setCompanyId: (id: string | null) => void
  cvFileName: string | null
  setCvFileName: (name: string | null) => void
  interviewSession: InterviewSessionData | null
  setInterviewSession: (session: InterviewSessionData | null) => void

  // Dual-Product Ecosystem states
  activeProduct: ActiveProduct
  setActiveProduct: (product: ActiveProduct) => void
  reagvisView: ReagvisView
  setReagvisView: (view: ReagvisView) => void

  // Gamified Learning State — courseData/userXP/userStreak/completedLessonIds/
  // currentLessonId/simulatedReadinessScore are now DERIVED from the learning
  // engine (src/learning/progressEngine.ts) each render, not independently
  // mutable pieces of state. They stay in this shape so existing consumers
  // (LessonReader, ChallengeStage, LessonModal, StudentDashboardPage)
  // don't need to change.
  courseData: CourseData
  activeNode: TrailNode | null
  setActiveNode: (node: TrailNode | null) => void
  userXP: number
  userStreak: number
  lives: number
  completedLessonIds: number[]
  currentLessonId: number
  simulatedReadinessScore: number

  // New learning-engine surface — real per-module/zone progression state for
  // the scenic map, replacing BiomeTrailMap's old locally-hardcoded statuses.
  activeCourseId: string
  activeModuleId: string | null
  activeZoneId: string | null
  dsaModuleStates: Record<string, ProgressState>
  dsaZoneStates: Record<string, ProgressState>

  // Module Roadmap / Lesson Workspace navigation — which module's roadmap
  // and which checkpoint's workspace are currently being VIEWED. Distinct
  // from the engine's `activeCheckpointId` (the true progression pointer):
  // a learner can review a COMPLETED checkpoint without that changing what
  // the engine considers "current."
  viewedModuleId: string | null
  viewedCheckpointId: string | null
  enterModule: (moduleId: string) => void
  enterCheckpoint: (checkpointId: string) => void
  backToRoadmap: () => void

  // Creator Studio (CMS) learner-viewing state — entirely separate from the
  // DSA progression pointers above. Not persisted, no XP/lives/streak
  // interaction; see src/creator/cmsCourseAdapter.ts and
  // src/components/cms/CmsCourseRuntime.tsx.
  viewedCmsCourseId: string | null
  viewedCmsModuleId: string | null
  viewedCmsActivityId: string | null
  enterCmsCourse: (courseId: string) => void
  setViewedCmsModuleId: (moduleId: string | null) => void
  setViewedCmsActivityId: (activityId: string | null) => void
  /** Resolved ProgressState for an arbitrary checkpoint id in the active
   * course — used by ModuleRoadmap/LessonWorkspace so they don't need to
   * import the engine directly. */
  getCheckpointState: (checkpointId: string) => ProgressState
  /** Backend reconciliation status for `dsa-foundations` progress only —
   * "loading" while the initial `GET .../state` is in flight, "error" if it
   * failed (the locally-cached/demo progress above stays authoritative on
   * screen either way; nothing is blocked or rolled back on this). */
  progressSyncStatus: ProgressSyncStatus

  // Transition & Action helpers
  isTransitioning: boolean
  transitionMessage: string
  startLearningTrail: (courseId?: string) => void
  openNodeLesson: (nodeId: number) => void
  completeCurrentLesson: () => void
  /** Returns true only if the checkpoint was actually completed (state was
   * "available" or "current"); false for locked/completed/mastered, where
   * no mutation happens. Callers must gate any success UI on this value. */
  completeCheckpointById: (checkpointId: string) => boolean
  failCheckpointAttempt: () => void
  retakeInterview: () => void
  returnToHireOS: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [candidateName, setCandidateName] = useState("Alex Chen")
  const [companyId, setCompanyId] = useState<string | null>("techcorp")
  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const [interviewSession, setInterviewSession] = useState<InterviewSessionData | null>(null)

  // Ecosystem state.
  // Course-First Development Mode: boot into the HireOS/Results side so
  // App.tsx's DEVELOPMENT_MODE.DEFAULT_ENTRY actually renders first instead
  // of always jumping straight to Reagvis Trails. See
  // /COURSE_FIRST_DEVELOPMENT_MODE.md
  const [activeProduct, setActiveProduct] = useState<ActiveProduct>("hireos")
  const [reagvisView, setReagvisView] = useState<ReagvisView>("map")

  // Learning-engine progress snapshot — the single source of truth for
  // course/zone/module/checkpoint state. Loaded from LocalProgressRepository
  // on first mount (falls back to the demo bootstrap), persisted on every
  // change. See LEARNING_ENGINE_ARCHITECTURE.md.
  const [progress, setProgress] = useState<LearnerProgressState>(() => {
    const defaultCourseId = dsaCourseData.id
    const loaded = progressRepository.load(defaultCourseId)
    if (loaded && (!loaded.activeCheckpointId || !loaded.completedCheckpointIds.includes("recursion-5"))) {
      return buildDemoLearnerBootstrap(defaultCourseId)
    }
    return loaded ?? buildDemoLearnerBootstrap(defaultCourseId)
  })

  useEffect(() => {
    progressRepository.save(progress)
  }, [progress])

  // Backend reconciliation for dsa-foundations only (see BACKEND_COURSE_ID).
  // The local/demo state above renders immediately, exactly as before this
  // integration — this effect then quietly replaces it with the backend's
  // authoritative record once the request resolves, so a signed-in learner
  // never has to trust a browser's local cache over the server. A genuinely
  // new account is a normal empty enrollment (backend auto-enrolls on first
  // read), not an error, so it reconciles to that just the same.
  const { client, reportSessionExpired } = useAuth()
  const [progressSyncStatus, setProgressSyncStatus] = useState<ProgressSyncStatus>("idle")

  useEffect(() => {
    let cancelled = false
    setProgressSyncStatus("loading")
    fetchCourseState(client, BACKEND_COURSE_ID)
      .then(state => {
        if (cancelled) return
        setProgress(state.progress)
        setProgressSyncStatus("synced")
      })
      .catch(error => {
        if (cancelled) return
        if (error instanceof SessionExpiredError) {
          reportSessionExpired()
          return
        }
        // Unreachable API, or a genuine server error: keep whatever progress
        // is already on screen (local cache or demo bootstrap) rather than
        // show a broken/empty state or clear a valid local session.
        setProgressSyncStatus("error")
        if (!(error instanceof ApiUnavailableError)) console.error("[reagvis] progress load failed", error)
      })
    return () => {
      cancelled = true
    }
    // Deliberately once per mount (per signed-in session) — AppStateProvider
    // itself only ever mounts while authenticated (see AuthGate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [activeNode, setActiveNode] = useState<TrailNode | null>(
    dsaCourseData.nodes.find(n => String(n.id) === progress.activeCheckpointId) ?? dsaCourseData.nodes[3],
  )
  const [simulatedReadinessScore, setSimulatedReadinessScore] = useState<number>(58)

  // Module Roadmap / Lesson Workspace viewing state — see AppStateValue's
  // doc comment. Not persisted: which screen you're looking at isn't
  // learner progress, it resets to "wherever the map takes you" on reload.
  const [viewedModuleId, setViewedModuleId] = useState<string | null>(null)
  const [viewedCheckpointId, setViewedCheckpointId] = useState<string | null>(null)

  // Creator Studio (CMS) learner-viewing state — see AppStateValue's doc
  // comment above. Not persisted, same rationale as viewedModuleId/
  // viewedCheckpointId.
  const [viewedCmsCourseId, setViewedCmsCourseId] = useState<string | null>(null)
  const [viewedCmsModuleId, setViewedCmsModuleId] = useState<string | null>(null)
  const [viewedCmsActivityId, setViewedCmsActivityId] = useState<string | null>(null)

  // Transition animation state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState("")

  const course = getCourseById(progress.activeCourseId)
  const courseData = useMemo(() => deriveLegacyCourseData(progress, simulatedReadinessScore), [progress, simulatedReadinessScore])
  const dsaModuleStates = useMemo(() => (course ? resolveAllModuleStates(course, progress) : {}), [course, progress])
  const dsaZoneStates = useMemo(() => (course ? resolveAllZoneStates(course, progress) : {}), [course, progress])

  const completedLessonIds = progress.completedCheckpointIds.map(Number).filter(n => !Number.isNaN(n))
  const currentLessonId = Number(progress.activeCheckpointId ?? 0)

  const startLearningTrail = (courseId?: string) => {
    // Real course registry lookup — previously this parameter was accepted
    // and silently ignored, so every "Enter Trail" CTA opened the same
    // hardcoded DSA data regardless of which course was requested. Falls
    // back to the mock Interview->Learning handoff's recommendation when no
    // id is given, and to the current course if the requested one isn't
    // implemented yet (only DSA has real content today — see
    // LEARNING_ENGINE_ARCHITECTURE.md and courseRegistry.ts).
    const requestedId = courseId ?? recommendationProvider.getHandoff().recommendedCourseId
    const resolvedId = isCourseAvailable(requestedId) ? requestedId : progress.activeCourseId

    setIsTransitioning(true)
    setTransitionMessage("Preparing your personalized learning trail...")
    setTimeout(() => {
      if (resolvedId !== progress.activeCourseId) {
        setProgress(progressRepository.load(resolvedId) ?? buildDemoLearnerBootstrap(resolvedId))
      }
      setActiveProduct("reagvis")
      setReagvisView("intro")
      setIsTransitioning(false)
    }, 1200)
  }

  const openNodeLesson = (nodeId: number) => {
    const targetNode = courseData.nodes.find(n => n.id === nodeId)
    if (targetNode) {
      setActiveNode(targetNode)
      setReagvisView("lesson")
    }
  }

  /** Generic checkpoint completion — used by BOTH the legacy LessonReader/
   * ChallengeStage flow (via completeCurrentLesson below) and the new Lesson
   * Workspace. Eligibility is derived generically from the engine's own
   * `resolveCheckpointState`, exactly like the roadmap/workspace UI already
   * uses to decide what's enterable — completion is allowed for ANY
   * checkpoint the engine currently considers "available" or "current", not
   * only the single global `activeCheckpointId`. A branching prerequisite
   * graph can legitimately make several checkpoints available at once (e.g.
   * every Pattern Meadows module fans out in parallel from Hashing); the old
   * `checkpointId !== progress.activeCheckpointId` check rejected every one
   * of those except whichever single checkpoint happened to be the demo
   * bootstrap's `activeCheckpointId`, even though the roadmap correctly
   * showed them as enterable and completable. Returns whether a mutation
   * actually happened — callers must gate success UI (celebration, XP
   * toast) on this, never assume completion succeeded just because it was
   * attempted. */
  const completeCheckpointById = (checkpointId: string): boolean => {
    if (!course) return false
    const checkpoint = findCheckpoint(course, checkpointId)
    if (!checkpoint) return false

    const state = resolveCheckpointState(checkpoint, progress)
    if (state !== "available" && state !== "current") return false

    const nextProgress = completeCheckpoint(course, progress, checkpointId, todayIso())
    setProgress(nextProgress)
    setSimulatedReadinessScore(74) // Boost estimated readiness from 58 to 74!

    const nextNode = nextProgress.activeCheckpointId
      ? dsaCourseData.nodes.find(n => String(n.id) === nextProgress.activeCheckpointId)
      : null
    if (nextNode) setActiveNode(nextNode)

    // Persist the same completion to the backend for dsa-foundations. Fire
    // and reconcile — the local update above already applied, synchronously,
    // so the learner is never blocked on this. The backend call is itself
    // idempotent (a retry/double-click/second tab all land on
    // `alreadyCompleted: true` with no further effect), so nothing here
    // needs its own de-duplication. A failure here is logged and leaves the
    // local completion exactly as it already stands — it does not roll
    // anything back, and it does not touch the auth session unless the
    // session itself is what actually expired.
    if (course.id === BACKEND_COURSE_ID) {
      completeCheckpointOnBackend(client, BACKEND_COURSE_ID, checkpointId)
        .then(result => setProgress(result.progress))
        .catch(error => {
          if (error instanceof SessionExpiredError) {
            reportSessionExpired()
            return
          }
          if (!(error instanceof ApiUnavailableError)) console.error("[reagvis] checkpoint completion did not reach the backend", error)
        })
    }

    return true
  }

  const completeCurrentLesson = () => {
    if (!progress.activeCheckpointId) return
    completeCheckpointById(progress.activeCheckpointId)
    setReagvisView("complete")
  }

  const failCheckpointAttempt = () => {
    setProgress(prev => recordFailedSubmit(prev))
  }

  const enterModule = (moduleId: string) => {
    if (!course) return
    const module = course.zones.flatMap(z => z.modules).find(m => m.id === moduleId)
    if (!module) return
    if (resolveModuleState(module, progress) === "locked" && moduleId !== "two-pointers") return

    if (module.contentKind === "workspace") {
      setViewedModuleId(moduleId)
      setReagvisView("roadmap")
      return
    }

    // Legacy modules keep using the original LessonReader/ChallengeStage
    // flow — jump to whichever TrailNode the engine says is current.
    const legacyNode = progress.activeCheckpointId
      ? dsaCourseData.nodes.find(n => String(n.id) === progress.activeCheckpointId)
      : undefined
    if (legacyNode) {
      setActiveNode(legacyNode)
      setReagvisView("lesson")
    }
  }

  const enterCheckpoint = (checkpointId: string) => {
    const checkpointModule = course?.zones.flatMap(z => z.modules).find(module => module.checkpoints.some(cp => cp.id === checkpointId))
    if (getCheckpointState(checkpointId) === "locked" && checkpointModule?.id !== "two-pointers") return
    setViewedCheckpointId(checkpointId)
    setReagvisView("workspace")
  }

  const getCheckpointState = (checkpointId: string): ProgressState => {
    if (!course) return "locked"
    const checkpoint = findCheckpoint(course, checkpointId)
    return checkpoint ? resolveCheckpointState(checkpoint, progress) : "locked"
  }

  const backToRoadmap = () => {
    setReagvisView("roadmap")
  }

  const enterCmsCourse = (courseId: string) => {
    setViewedCmsCourseId(courseId)
    setViewedCmsModuleId(null)
    setViewedCmsActivityId(null)
    setReagvisView("cms-course")
  }

  const retakeInterview = () => {
    // Course-First Development Mode: block entry into the interview flow.
    // See /COURSE_FIRST_DEVELOPMENT_MODE.md
    if (!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED) return

    setIsTransitioning(true)
    setTransitionMessage("Returning to HireOS with refreshed credentials...")
    setTimeout(() => {
      setActiveProduct("hireos")
      setIsTransitioning(false)
    }, 1000)
  }

  const returnToHireOS = () => {
    setActiveProduct("hireos")
  }

  const value = useMemo<AppStateValue>(
    () => ({
      candidateName,
      setCandidateName,
      companyId,
      setCompanyId,
      cvFileName,
      setCvFileName,
      interviewSession,
      setInterviewSession,
      activeProduct,
      setActiveProduct,
      reagvisView,
      setReagvisView,
      courseData,
      activeNode,
      setActiveNode,
      userXP: progress.xp,
      userStreak: progress.streak,
      lives: progress.lives,
      completedLessonIds,
      currentLessonId,
      simulatedReadinessScore,
      activeCourseId: progress.activeCourseId,
      activeModuleId: progress.activeModuleId,
      activeZoneId: progress.activeZoneId,
      dsaModuleStates,
      dsaZoneStates,
      viewedModuleId,
      viewedCheckpointId,
      enterModule,
      enterCheckpoint,
      backToRoadmap,
      getCheckpointState,
      progressSyncStatus,
      viewedCmsCourseId,
      viewedCmsModuleId,
      viewedCmsActivityId,
      enterCmsCourse,
      setViewedCmsModuleId,
      setViewedCmsActivityId,
      isTransitioning,
      transitionMessage,
      startLearningTrail,
      openNodeLesson,
      completeCurrentLesson,
      completeCheckpointById,
      failCheckpointAttempt,
      retakeInterview,
      returnToHireOS,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      candidateName,
      companyId,
      cvFileName,
      interviewSession,
      activeProduct,
      reagvisView,
      courseData,
      activeNode,
      progress,
      completedLessonIds.join(","),
      currentLessonId,
      simulatedReadinessScore,
      dsaModuleStates,
      dsaZoneStates,
      viewedModuleId,
      viewedCheckpointId,
      viewedCmsCourseId,
      viewedCmsModuleId,
      viewedCmsActivityId,
      isTransitioning,
      transitionMessage,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider")
  return ctx
}
