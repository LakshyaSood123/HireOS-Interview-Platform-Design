import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { demoLearningMaterial } from "../data/placementPrepDemo"
import CourseRecommendCard from "./forest/CourseRecommendCard"

export default function PlacementLearningSection() {
  const { t } = useLanguage()
  const { startLearningTrail } = useAppState()

  return (
    <section className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1DB584]/20 text-[#1DB584] font-black text-sm">
          3
        </span>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t("placementFlow.learning")}</h2>
          <p className="text-xs text-gray-400">Direct connection to Reagvis Labs Personalized Learning Trails</p>
        </div>
      </div>

      {/* Course Recommendation Card as the primary interactive trailhead bridge */}
      <CourseRecommendCard
        title="Data Structures & Algorithms Foundations"
        score={58}
        focusAreas={["Binary Trees & Traversals", "Graph Search (BFS / DFS)", "Time / Space Big-O Analysis"]}
        duration="~2h 30m"
        lessonsCount={6}
        courseId="dsa-foundations"
      />

      <div className="rounded-2xl border border-white/10 bg-[#092218]/60 backdrop-blur-sm p-6 sm:p-8 space-y-8">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-cyan-300">
              {demoLearningMaterial.icon} {demoLearningMaterial.topic}
            </h3>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-400">
              {t("placementFlow.estimatedReadingTime")}: {demoLearningMaterial.estimatedReadingTime}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
            {demoLearningMaterial.explanation}
          </p>
        </div>

        {/* Types */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-4">{t("placementFlow.types")}</h4>
          <div className="space-y-4">
            {demoLearningMaterial.types.map((type) => (
              <div key={type.name} className="rounded-xl bg-black/40 border border-white/10 p-5">
                <h5 className="text-white font-bold mb-1.5 text-sm">{type.name}</h5>
                <p className="text-xs text-gray-400 mb-3">{type.description}</p>
                <pre className="rounded-lg bg-[#04100C] border border-white/5 p-4 overflow-x-auto">
                  <code className="font-mono text-xs text-emerald-300 whitespace-pre">{type.example}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Key points */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">{t("placementFlow.keyPoints")}</h4>
          <ul className="space-y-2">
            {demoLearningMaterial.keyPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                <span className="text-[#1DB584] mt-0.5 flex-shrink-0">●</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Related topics */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">{t("placementFlow.relatedTopics")}</h4>
          <div className="flex flex-wrap gap-2">
            {demoLearningMaterial.relatedTopics.map((topic) => (
              <span key={topic} className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => startLearningTrail("system-design")}
            className="w-full sm:w-auto bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#1DB584]/20 cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <span>🌿 Launch Learning Trail in Reagvis Labs</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </section>
  )
}
