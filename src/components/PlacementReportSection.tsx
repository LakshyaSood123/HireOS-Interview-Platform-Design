import { useLanguage } from "../i18n/LanguageContext"
import { demoPlacementReport } from "../data/placementPrepDemo"
import { DEVELOPMENT_MODE, INTERVIEW_FROZEN_MESSAGE } from "../config/developmentMode"

const severityStyles: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400",
  High: "bg-amber-500/20 text-amber-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
}

const stepStatusStyles: Record<string, string> = {
  "In Progress": "bg-brand/20 text-brand",
  "Recommended": "bg-amethyst/20 text-amethyst",
  "Recommended After Learning": "bg-white/10 text-gray-400",
}

const learningStatusStyles: Record<string, string> = {
  Started: "bg-brand/20 text-brand",
  "Not Started": "bg-white/10 text-gray-400",
}

interface Props {
  onNavigate?: (page: "interview" | "landing") => void
  onContinueLearning?: () => void
}

export default function PlacementReportSection({ onNavigate, onContinueLearning }: Props) {
  const { t } = useLanguage()
  const { overallReadiness, byCategory, weakAreas, strongAreas, recommendedLearningPath, nextSteps, estimatedReadinessAfterLearning, nextReviewDate } = demoPlacementReport
  const readinessBarColor =
    overallReadiness.percentage >= 80 ? "from-brand to-green-500" :
    overallReadiness.percentage >= 50 ? "from-amber-400 to-ember" :
    "from-ember to-red-500"

  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand/20 text-brand font-black text-sm">4</span>
        <h2 className="text-3xl font-bold text-white">{t("placementFlow.report")}</h2>
      </div>

      <div className="space-y-6">
        {/* Overall readiness */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{t("placementFlow.placementReadiness")}</p>
          <p className="text-6xl font-black text-white font-mono mb-2">
            {overallReadiness.score}<span className="text-gray-500 text-2xl font-normal">/{overallReadiness.maxScore}</span>
          </p>
          <div className="w-full max-w-xs mx-auto h-2.5 bg-white/10 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${readinessBarColor} animate-bar`}
              style={{ width: `${overallReadiness.percentage}%` }}
            />
          </div>
          <p className={`font-bold text-base mt-3 ${overallReadiness.statusColor}`}>{overallReadiness.status}</p>
          <p className="text-sm text-gray-500 mt-2">{nextSteps}</p>
        </div>

        {/* By category */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.performanceByCategory")}</h3>
          <div className="space-y-4">
            {Object.entries(byCategory).map(([category, score]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base text-gray-400">{category}</span>
                  <span className="text-sm font-bold text-white font-mono">{score}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full animate-bar ${score >= 50 ? "bg-brand" : "bg-ember"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak areas ranked */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.weakAreas")}</h3>
          <div className="space-y-3">
            {weakAreas.map((w) => (
              <div key={w.topic} className="border border-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center">
                      {w.rank}
                    </span>
                    <span className="text-white font-semibold text-sm">{w.topic}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${severityStyles[w.severity]}`}>
                      {w.severity}
                    </span>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${learningStatusStyles[w.learningStatus]}`}>
                    {w.learningStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
                  <span>{t("placementFlow.currentScore")}: <span className="text-gray-300 font-mono">{w.currentScore}</span></span>
                  <span>{t("placementFlow.targetScore")}: <span className="text-gray-300 font-mono">{w.targetScore}</span></span>
                  <span>{t("placementFlow.estimatedTime")}: <span className="text-gray-300">{w.estimatedLearningTime}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strong areas */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.strongAreas")}</h3>
          <div className="space-y-3">
            {strongAreas.map((s) => (
              <div key={s.topic} className="flex items-center justify-between gap-3">
                <p className="text-white font-semibold text-sm">{s.topic}</p>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-mono text-gray-400">{s.score}%</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                    {s.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning path */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.recommendedPath")}</h3>
          <div className="space-y-3">
            {recommendedLearningPath.map((step) => (
              <div key={step.step} className="flex items-center gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center">
                  {step.step}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-300">{step.topic}</span>
                  <span className="block text-xs text-gray-500">{t("placementFlow.estimatedTime")}: {step.estimatedTime}</span>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${stepStatusStyles[step.status]}`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness projection */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t("placementFlow.estimatedReadinessAfterLearning")}</p>
            <p className="text-2xl font-black text-brand font-mono">{estimatedReadinessAfterLearning}/100</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t("placementFlow.nextReviewDate")}</p>
            <p className="text-white font-semibold">{nextReviewDate}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && onNavigate?.("interview")}
            disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
            title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
            className={`flex-1 border-2 font-semibold px-6 py-3 rounded-xl transition-all text-center ${
              DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
                ? "border-white/15 text-white hover:border-brand hover:text-brand"
                : "border-white/5 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t("placementFlow.tryAgain")}
          </button>
          <button
            onClick={onContinueLearning}
            className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-all text-center"
          >
            {t("placementFlow.continueLearning")}
          </button>
        </div>
      </div>
    </section>
  )
}
