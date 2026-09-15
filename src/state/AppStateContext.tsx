import { createContext, useContext, useState, useMemo } from "react"
import type { ReactNode } from "react"
import type { InterviewSessionData } from "../data/placementPrepDemo"
import { dsaCourseData, type CourseData, type TrailNode } from "../data/reagvisCourses"
import { DEVELOPMENT_MODE } from "../config/developmentMode"

export type ActiveProduct = "hireos" | "reagvis"
export type ReagvisView = "intro" | "map" | "library" | "lesson" | "challenge" | "complete"

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

  // Gamified Learning State
  courseData: CourseData
  setCourseData: (data: CourseData) => void
  activeNode: TrailNode | null
  setActiveNode: (node: TrailNode | null) => void
  userXP: number
  setUserXP: React.Dispatch<React.SetStateAction<number>>
  userStreak: number
  completedLessonIds: number[]
  currentLessonId: number
  simulatedReadinessScore: number

  // Transition & Action helpers
  isTransitioning: boolean
  transitionMessage: string
  startLearningTrail: (courseId?: string) => void
  openNodeLesson: (nodeId: number) => void
  completeCurrentLesson: () => void
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
  // App.tsx's DEVELOPMENT_MODE.DEFAULT_ENTRY ("results") actually renders
  // first, instead of always jumping straight to Reagvis Trails. See
  // /COURSE_FIRST_DEVELOPMENT_MODE.md
  const [activeProduct, setActiveProduct] = useState<ActiveProduct>("hireos")
  const [reagvisView, setReagvisView] = useState<ReagvisView>("map")
  const [courseData, setCourseData] = useState<CourseData>(dsaCourseData)
  const [activeNode, setActiveNode] = useState<TrailNode | null>(dsaCourseData.nodes[2]) // Sorting Clearing
  const [userXP, setUserXP] = useState(1240)
  const [userStreak] = useState(7)
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([1, 2])
  const [currentLessonId, setCurrentLessonId] = useState<number>(3)
  const [simulatedReadinessScore, setSimulatedReadinessScore] = useState<number>(58)

  // Transition animation state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState("")

  const startLearningTrail = (_courseId: string = "dsa-foundations") => {
    setIsTransitioning(true)
    setTransitionMessage("Preparing your personalized learning trail...")
    setTimeout(() => {
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

  const completeCurrentLesson = () => {
    // Reward XP and complete node
    setUserXP(prev => prev + 120)
    setCompletedLessonIds(prev => (prev.includes(currentLessonId) ? prev : [...prev, currentLessonId]))

    // Advance to next node
    const nextId = currentLessonId + 1
    setCurrentLessonId(nextId)
    setSimulatedReadinessScore(74) // Boost estimated readiness from 58 to 74!

    // Update node statuses in courseData
    setCourseData(prev => ({
      ...prev,
      currentMastery: 74,
      nodes: prev.nodes.map(node => {
        if (node.id === currentLessonId) {
          return { ...node, status: "completed", mastery: 100 }
        }
        if (node.id === nextId) {
          return { ...node, status: "current" }
        }
        return node
      }),
    }))

    setReagvisView("complete")
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
      setCourseData,
      activeNode,
      setActiveNode,
      userXP,
      setUserXP,
      userStreak,
      completedLessonIds,
      currentLessonId,
      simulatedReadinessScore,
      isTransitioning,
      transitionMessage,
      startLearningTrail,
      openNodeLesson,
      completeCurrentLesson,
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
      userXP,
      userStreak,
      completedLessonIds,
      currentLessonId,
      simulatedReadinessScore,
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
