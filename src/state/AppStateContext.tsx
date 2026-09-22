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
import { getCourseById, isCourseAvailable, findCheckpoint, getAllCheckpointsInOrder } from "../learning/courseRegistry"
import { deriveLegacyCourseData } from "../learning/legacyAdapter"
import { learnerSession, progressRepository } from "../learning/services/learnerSession"
import { MockRecommendationProvider } from "../learning/services/recommendationProvider"
import { navigate, useRoute } from "../router"

export type ActiveProduct = "hireos" | "reagvis"
export type ReagvisView = "intro" | "map" | "library" | "lesson" | "challenge" | "complete" | "roadmap" | "workspace"

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

  // Dual-Product Ecosystem states. `activeProduct` follows the URL: Reagvis on
  // /trails, HireOS everywhere else.
  activeProduct: ActiveProduct
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
  /** Resolved ProgressState for an arbitrary checkpoint id in the active
   * course — used by ModuleRoadmap/LessonWorkspace so they don't need to
   * import the engine directly. */
  getCheckpointState: (checkpointId: string) => ProgressState

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

  // Ecosystem state. The URL is the one source of truth for which product is
  // showing (src/router.ts); entering or leaving Reagvis navigates.
  const activeProduct: ActiveProduct = useRoute() === "trails" ? "reagvis" : "hireos"
  const [reagvisView, setReagvisView] = useState<ReagvisView>("map")

  // Learning-engine progress snapshot — the single source of truth for
  // course/zone/module/checkpoint state. Loaded on first mount from the
  // repository learnerSession.ts chose (the learner's account when signed in,
  // this browser otherwise — falling back to the demo bootstrap), persisted
  // on every change. See LEARNING_ENGINE_ARCHITECTURE.md.
  const [progress, setProgress] = useState<LearnerProgressState>(() => {
    const defaultCourseId = dsaCourseData.id
    const loaded = progressRepository.load(defaultCourseId)
    // Signed in: the learner's real progress, owned by the server — shown as
    // it is, never swapped for the demo bootstrap below.
    if (loaded && learnerSession.signedIn) return loaded
    if (loaded && (!loaded.activeCheckpointId || !loaded.completedCheckpointIds.includes("recursion-5"))) {
      return buildDemoLearnerBootstrap(defaultCourseId)
    }
    return loaded ?? buildDemoLearnerBootstrap(defaultCourseId)
  })

  useEffect(() => {
    progressRepository.save(progress)
  }, [progress])

  const [activeNode, setActiveNode] = useState<TrailNode | null>(
    dsaCourseData.nodes.find(n => String(n.id) === progress.activeCheckpointId) ?? dsaCourseData.nodes[3],
  )
  const [simulatedReadinessScore, setSimulatedReadinessScore] = useState<number>(58)

  // Module Roadmap / Lesson Workspace viewing state — see AppStateValue's
  // doc comment. Not persisted: which screen you're looking at isn't
  // learner progress, it resets to "wherever the map takes you" on reload.
  const [viewedModuleId, setViewedModuleId] = useState<string | null>(null)
  const [viewedCheckpointId, setViewedCheckpointId] = useState<string | null>(null)

  // Transition animation state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState("")

  const course = getCourseById(progress.activeCourseId)
  const totalCheckpoints = useMemo(() => (course ? getAllCheckpointsInOrder(course).length : 0), [course])
  // Signed in, readiness is the learner's real share of the course — 0 on a
  // new account. Signed out it stays the demo story's simulated score.
  const readinessScore = learnerSession.signedIn
    ? totalCheckpoints > 0
      ? Math.round((100 * progress.completedCheckpointIds.length) / totalCheckpoints)
      : 0
    : simulatedReadinessScore
  const courseData = useMemo(() => deriveLegacyCourseData(progress, readinessScore), [progress, readinessScore])
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
      setReagvisView("intro")
      setIsTransitioning(false)
      navigate("trails")
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

  const retakeInterview = () => {
    // Course-First Development Mode: block entry into the interview flow.
    // See /COURSE_FIRST_DEVELOPMENT_MODE.md
    if (!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED) return

    // The caller navigates to the interview; this only plays the transition.
    setIsTransitioning(true)
    setTransitionMessage("Returning to HireOS with refreshed credentials...")
    setTimeout(() => {
      setIsTransitioning(false)
    }, 1000)
  }

  const returnToHireOS = () => {
    navigate("landing")
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
      simulatedReadinessScore: readinessScore,
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
      readinessScore,
      dsaModuleStates,
      dsaZoneStates,
      viewedModuleId,
      viewedCheckpointId,
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
