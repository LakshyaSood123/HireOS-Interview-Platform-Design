import { useEffect, useState } from "react"
import { useLanguage } from "../i18n/LanguageContext"
import { demoAnalysis } from "../data/placementPrepDemo"

const severityStyles: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400",
  High: "bg-amber-500/20 text-amber-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
}

function scoreStatus(ratio: number) {
  if (ratio >= 0.8) return { label: "Excellent", classes: "text-green-400 border-green-500/40 bg-green-500/10" }
  if (ratio >= 0.6) return { label: "Good", classes: "text-brand border-brand/40 bg-brand/10" }
  if (ratio >= 0.4) return { label: "Needs Work", classes: "text-amber-400 border-amber-500/40 bg-amber-500/10" }
  return { label: "Critical", classes: "text-red-400 border-red-500/40 bg-red-500/10" }
}

interface Props {
  active: boolean
  onLearnTopic?: () => void
}

export default function PlacementAnalysisSection({ active, onLearnTopic }: Props) {
  const { t } = useLanguage()
  const [analyzing, setAnalyzing] = useState(true)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setAnalyzing(false), 1000)
    return () => clearTimeout(timer)
  }, [active])

  useEffect(() => {
    if (analyzing || !active) return
    const target = demoAnalysis.overallScore
    const start = performance.now()
    const duration = 1000

    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplayScore(progress * target)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setDisplayScore(target)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [analyzing, active])

  const ratio = demoAnalysis.overallScore / demoAnalysis.maxScore
  const status = scoreStatus(ratio)
  const isWholeNumber = Number.isInteger(demoAnalysis.overallScore)

  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand/20 text-brand font-black text-sm">2</span>
        <h2 className="text-3xl font-bold text-white">{t("placementFlow.analysis")}</h2>
      </div>

      {analyzing ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-brand rounded-full animate-spin" />
          <p className="text-gray-400 text-base font-medium">{t("placementFlow.analyzing")}</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-up">
          {/* Overall score */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t("placementFlow.overallScore")}</p>
                <p className="text-5xl font-black text-white font-mono">
                  {isWholeNumber ? Math.round(displayScore) : displayScore.toFixed(2)}
                  <span className="text-gray-500 text-2xl font-normal">/{demoAnalysis.maxScore}</span>
                </p>
              </div>
              <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-center px-1 flex-shrink-0 ${status.classes}`}>
                <span className="font-black text-xs leading-tight">{status.label}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mt-4">{demoAnalysis.analysisMessage}</p>
          </div>

          {/* Performance by category */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.performanceByCategory")}</h3>
            <div className="space-y-4">
              {Object.entries(demoAnalysis.performanceByCategory).map(([category, score]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base text-gray-400">{category}</span>
                    <span className="text-sm font-bold text-white font-mono">{score}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full animate-bar ${score >= 70 ? "bg-brand" : "bg-ember"}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak areas */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.weakAreas")}</h3>
            <div className="space-y-4">
              {demoAnalysis.weakAreas.map((w, i) => (
                <div
                  key={w.topicId}
                  className="border border-white/5 rounded-lg p-4 animate-fade-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-white font-semibold">{w.topic}</p>
                      <p className="text-gray-500 text-sm">{w.category}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-mono text-gray-400">{w.score}/{w.maxScore}</span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${severityStyles[w.severity]}`}>
                        {w.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{w.description}</p>
                </div>
              ))}
            </div>
            <button
              onClick={onLearnTopic}
              className="mt-5 bg-amethyst hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              {t("placementFlow.learnThisTopic")}
            </button>
          </div>

          {/* Strong areas */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">{t("placementFlow.strongAreas")}</h3>
            <div className="space-y-3">
              {demoAnalysis.strongAreas.map((s, i) => (
                <div
                  key={s.topic}
                  className="flex items-center justify-between gap-3 animate-fade-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{s.topic}</p>
                    <p className="text-gray-500 text-xs">{s.category}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-mono text-gray-400">{s.score}/{s.maxScore}</span>
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                      Strong
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
