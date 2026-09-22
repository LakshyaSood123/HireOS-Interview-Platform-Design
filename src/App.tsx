import { useEffect, useState } from "react"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import SetupPage from "./pages/SetupPage"
import InterviewPage from "./pages/InterviewPage"
import ResultsPage from "./pages/ResultsPage"
import StudentDashboardPage from "./pages/StudentDashboardPage"
import AdminPage from "./pages/AdminPage"
import PlacementFlowPage from "./pages/PlacementFlowPage"
import ReagvisTrailPage from "./pages/ReagvisTrailPage"
import TransitionPortal from "./components/forest/TransitionPortal"
import { LanguageProvider } from "./i18n/LanguageContext"
import { AppStateProvider } from "./state/AppStateContext"
import { DEVELOPMENT_MODE, isInterviewPage } from "./config/developmentMode"
import { learnerSession } from "./learning/services/learnerSession"
import { isRoute, navigate, useRoute, type Route } from "./router"

const navItems: { id: Route; label: string; emoji: string }[] = [
  { id: "landing", label: "Landing", emoji: "🏠" },
  { id: "setup", label: "Setup", emoji: "📄" },
  { id: "interview", label: "Interview", emoji: "🎤" },
  { id: "results", label: "Results", emoji: "📊" },
  { id: "trails", label: "Reagvis Trails", emoji: "🌿" },
  { id: "placement-flow", label: "Placement", emoji: "📚" },
  { id: "dashboard", label: "Journey", emoji: "🎓" },
  { id: "admin", label: "Admin", emoji: "⚙️" },
]

// Course-First Development Mode: Setup/Interview are frozen entry points.
// See /COURSE_FIRST_DEVELOPMENT_MODE.md
const visibleNavItems = DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
  ? navItems
  : navItems.filter(item => !isInterviewPage(item.id))

/** Where a request for `requested` actually lands — every guard in one place.
 * Reagvis Trails is open to everyone: signed out it runs on the demo
 * progress, signed in on the learner's account. The auth pages are pointless
 * once signed in. */
function resolveRoute(requested: Route | null, signedIn: boolean): Route {
  if (requested === null) return "landing"
  if (!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && isInterviewPage(requested)) return "landing"
  if ((requested === "login" || requested === "signup") && signedIn) return "landing"
  return requested
}

function AppContent() {
  const requested = useRoute()
  const route = resolveRoute(requested, learnerSession.account !== null)
  const [showDemoNav, setShowDemoNav] = useState(false)

  // A guarded or unknown address is replaced, so Back never returns to it.
  useEffect(() => {
    if (route !== requested) navigate(route, { replace: true })
  }, [route, requested])

  // Pages navigate by page name (`onNavigate("results")`); "reagvis-trail" is
  // the name they use for Trails. Frozen pages are ignored rather than
  // redirected, so a disabled button does nothing.
  const handleNavigate = (page: string) => {
    const target = page === "reagvis-trail" ? "trails" : page
    if (!isRoute(target)) return
    if (!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && isInterviewPage(target)) return
    navigate(target)
  }

  return (
    <div className="relative font-display bg-[#071A14]">
      <TransitionPortal />

      {route === "landing" && <LandingPage onNavigate={handleNavigate} />}
      {(route === "login" || route === "signup") && <AuthPage mode={route} />}
      {route === "trails" && <ReagvisTrailPage onNavigateHireOS={handleNavigate} />}
      {route === "setup" && <SetupPage onNavigate={handleNavigate} />}
      {route === "interview" && <InterviewPage onNavigate={handleNavigate} />}
      {route === "results" && <ResultsPage onNavigate={handleNavigate} />}
      {route === "placement-flow" && <PlacementFlowPage onNavigate={handleNavigate} />}
      {route === "dashboard" && <StudentDashboardPage onNavigate={handleNavigate} />}
      {route === "admin" && <AdminPage onNavigate={handleNavigate} />}

      {/* Floating page navigator — discreet toggle on Reagvis Trails for scenic immersion */}
      {route === "trails" ? (
        <div className="fixed bottom-3 right-4 z-50 pointer-events-auto">
          {showDemoNav ? (
            <nav
              className="flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg border border-[#1DB584]/30 max-w-[90vw] overflow-x-auto"
              style={{ background: "rgba(7, 26, 20, 0.94)", backdropFilter: "blur(16px)" }}
              aria-label="Demo page navigator"
            >
              {visibleNavItems.map(item => {
                const isActive = item.id === route
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
            const isActive = item.id === route

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
        <AppContent />
      </AppStateProvider>
    </LanguageProvider>
  )
}
