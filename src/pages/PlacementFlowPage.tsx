import LanguageToggle from "../components/LanguageToggle"
import PlacementPrepFlow from "../components/PlacementPrepFlow"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { demoInterviewSession } from "../data/placementPrepDemo"
import { DEVELOPMENT_MODE } from "../config/developmentMode"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

export default function PlacementFlowPage({ onNavigate }: Props) {
  const { t } = useLanguage()
  const { interviewSession } = useAppState()
  const session = interviewSession ?? demoInterviewSession

  return (
    <div className="min-h-screen bg-gray-950 font-display">
      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate(DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? "interview" : "results")}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("placementFlow.back")}
          </button>
          <h1 className="text-sm sm:text-base font-black text-white truncate px-4">{t("placementFlow.header")}</h1>
          <LanguageToggle variant="dark" />
        </div>
      </div>

      {/* ── FLOW ── */}
      <div className="px-6 pb-16">
        <PlacementPrepFlow session={session} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
