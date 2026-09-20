import { useState, useEffect } from "react"
import LandingPage from "./pages/LandingPage"
import SetupPage from "./pages/SetupPage"
import InterviewPage from "./pages/InterviewPage"
import ResultsPage from "./pages/ResultsPage"
import StudentDashboardPage from "./pages/StudentDashboardPage"
import AdminPage from "./pages/AdminPage"
import PlacementFlowPage from "./pages/PlacementFlowPage"
import ReagvisTrailPage from "./pages/ReagvisTrailPage"
import TransitionPortal from "./components/forest/TransitionPortal"
import { LanguageProvider } from "./i18n/LanguageContext"
import { AppStateProvider, useAppState } from "./state/AppStateContext"
import { DEVELOPMENT_MODE, isInterviewPage } from "./config/developmentMode"
import { FeedbackProvider } from "./feedback/FeedbackContext"
import FeedbackDrawer from "./components/feedback/FeedbackDrawer"
import { TrailGuideProvider } from "./assistant/TrailGuideContext"
import TrailGuideDrawer from "./components/assistant/TrailGuideDrawer"
import TrailUtilityCluster from "./components/assistant/TrailUtilityCluster"

type Page =
  | "landing"
  | "setup"
  | "interview"
  | "results"
  | "placement-flow"
  | "dashboard"
  | "admin"
  | "reagvis-trail"

const navItems: { id: Page; label: string; emoji: string }[] = [
  { id: "landing", label: "Landing", emoji: "🏠" },
  { id: "setup", label: "Setup", emoji: "📄" },
  { id: "interview", label: "Interview", emoji: "🎤" },
  { id: "results", label: "Results", emoji: "📊" },
  { id: "reagvis-trail", label: "Reagvis Trails", emoji: "🌿" },
  { id: "placement-flow", label: "Placement", emoji: "📚" },
  { id: "dashboard", label: "Journey", emoji: "🎓" },
  { id: "admin", label: "Admin", emoji: "⚙️" },
]

// Course-First Development Mode: Setup/Interview are frozen entry points.
// See /COURSE_FIRST_DEVELOPMENT_MODE.md
const visibleNavItems = DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
  ? navItems
  : navItems.filter(item => !isInterviewPage(item.id))

function AppContent() {
  // Course-First Development Mode: boot straight into the post-interview
  // experience instead of Landing. See /COURSE_FIRST_DEVELOPMENT_MODE.md
  const [page, setPage] = useState<Page>(DEVELOPMENT_MODE.DEFAULT_ENTRY as Page)
  const [showDemoNav, setShowDemoNav] = useState(false)
  const { activeProduct, setActiveProduct } = useAppState()

  // Single guarded navigation entry point. Every onNavigate callback passed
  // to a page ultimately calls this, so blocking frozen pages here is
  // sufficient even if a component tries to navigate("setup"/"interview")
  // directly.
  const handleNavigate = (targetPage: string) => {
    if (!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && isInterviewPage(targetPage)) {
      return
    }

    if (targetPage === "reagvis-trail") {
      setActiveProduct("reagvis")
      setPage("reagvis-trail")
    } else {
      setActiveProduct("hireos")
      setPage(targetPage as Page)
    }
  }

  // When activeProduct is set to reagvis via card button / CTA
  const isReagvis = activeProduct === "reagvis" || page === "reagvis-trail"

  // Course-First Development Mode boots straight into `page ===
  // "reagvis-trail"` (DEVELOPMENT_MODE.DEFAULT_ENTRY) WITHOUT ever going
  // through handleNavigate("reagvis-trail") — so on a fresh load,
  // `activeProduct` stayed at its default "hireos" even though the learner
  // is looking at Reagvis Trails the whole time. That mismatch fed wrong
  // (empty) context into learningScreenContext.ts, which Feedback AND Trail
  // Guide both derive from — this keeps `activeProduct` in sync with what's
  // actually rendered instead of only with explicit nav clicks.
  useEffect(() => {
    if (isReagvis && activeProduct !== "reagvis") {
      setActiveProduct("reagvis")
    }
  }, [isReagvis, activeProduct, setActiveProduct])

  return (
    <div className="relative font-display bg-[#071A14]">
      <TransitionPortal />

      {/* Page content */}
      {isReagvis ? (
        <ReagvisTrailPage onNavigateHireOS={handleNavigate} />
      ) : (
        <>
          {page === "landing" && <LandingPage onNavigate={handleNavigate} />}
          {page === "setup" && <SetupPage onNavigate={handleNavigate} />}
          {page === "interview" && <InterviewPage onNavigate={handleNavigate} />}
          {page === "results" && <ResultsPage onNavigate={handleNavigate} />}
          {page === "placement-flow" && <PlacementFlowPage onNavigate={handleNavigate} />}
          {page === "dashboard" && <StudentDashboardPage onNavigate={handleNavigate} />}
          {page === "admin" && <AdminPage onNavigate={handleNavigate} />}
        </>
      )}

      {/* Floating page navigator — discreet toggle on Reagvis Trails for scenic immersion */}
      {isReagvis ? (
        <div className="fixed bottom-3 right-4 z-50 pointer-events-auto">
          {showDemoNav ? (
            <nav
              className="flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg border border-[#1DB584]/30 max-w-[90vw] overflow-x-auto"
              style={{ background: "rgba(7, 26, 20, 0.94)", backdropFilter: "blur(16px)" }}
              aria-label="Demo page navigator"
            >
              {visibleNavItems.map(item => {
                const isActive = item.id === "reagvis-trail"
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigate(item.id)
                      setShowDemoNav(false)
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#1DB584] text-white shadow-md shadow-[#1DB584]/30"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-sm leading-none">{item.emoji}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                )
              })}
              <button
                onClick={() => setShowDemoNav(false)}
                className="ml-1 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center text-[11px] cursor-pointer"
                title="Hide Switcher"
              >
                ✕
              </button>
            </nav>
          ) : (
            <button
              onClick={() => setShowDemoNav(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#071A14]/70 hover:bg-[#071A14]/95 text-gray-400 hover:text-[#1DB584] text-[11px] font-medium border border-[#1DB584]/25 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              title="Open Demo Pages"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Demos</span>
            </button>
          )}
        </div>
      ) : (
        <nav
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg border border-[#1DB584]/20 opacity-80 hover:opacity-100 transition-opacity duration-300 max-w-[95vw] overflow-x-auto pointer-events-auto"
          style={{ background: "rgba(7, 26, 20, 0.90)", backdropFilter: "blur(16px)" }}
          aria-label="Demo page navigator"
        >
          {visibleNavItems.map(item => {
            const isActive = item.id === page

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#1DB584] text-white shadow-md shadow-[#1DB584]/30 scale-105"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-sm leading-none">{item.emoji}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppStateProvider>
        <FeedbackProvider>
          <TrailGuideProvider>
            <AppContent />
            <TrailUtilityCluster />
            <FeedbackDrawer />
            <TrailGuideDrawer />
          </TrailGuideProvider>
        </FeedbackProvider>
      </AppStateProvider>
    </LanguageProvider>
  )
}
