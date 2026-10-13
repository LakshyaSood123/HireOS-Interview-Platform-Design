// Generic Course Home: scenic hero, identity, stats, primary CTA, then the
// selected course's own curriculum (passed as children). Used for every
// course (DSA, Machine Learning, and published Creator Studio courses), so
// there is one composition with course-specific configuration, not four pages.

import type { ReactNode } from "react"
import CourseHero from "./CourseHero"
import type { CourseHomeConfig } from "../../learning/courseHomeConfig"

export interface CourseStat {
  label: string
  value: string
  hint?: string
}

interface CourseHomeProps {
  config: CourseHomeConfig
  title: string
  stats: CourseStat[]
  /** True when the learner has already completed something. */
  hasProgress: boolean
  onPrimary: () => void
  onBack: () => void
  backLabel?: string
  children: ReactNode
}

export default function CourseHome({ config, title, stats, hasProgress, onPrimary, onBack, backLabel = "Course Library", children }: CourseHomeProps) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-fade-up">
      <button
        onClick={onBack}
        className="text-xs font-bold text-[#5B8854] hover:text-[#2F6747] cursor-pointer mb-4 inline-flex items-center gap-1.5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {backLabel}
      </button>

      <div className="rounded-[36px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-5 sm:p-9 shadow-[0_25px_60px_rgba(40,65,45,0.12)] relative overflow-hidden mb-10">
        <CourseHero variant={config.heroVariant} />

        <div className="mt-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5B8854]/15 text-[#2F6747] border border-[#5B8854]/30 mb-3">
            <span>{config.icon}</span> {config.destinationName} · {config.themeLabel}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1B3F2B] tracking-tight">{title}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed max-w-3xl">{config.description}</p>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-7">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white/80 rounded-2xl border border-[#CBDCC4] p-4 text-center shadow-2xs">
                <span className="text-xs text-gray-500 block mb-1">{stat.label}</span>
                <span className="text-xl font-black text-[#1E3B2B]">{stat.value}</span>
                {stat.hint && <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">{stat.hint}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 mt-7 border-t border-[#CBDCC4]">
          <button
            onClick={onPrimary}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-black text-xs text-white bg-[#5B8854] hover:bg-[#487342] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>{hasProgress ? config.continueLabel : config.beginLabel}</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-1">{config.destinationName}</span>
        <h2 className="text-xl font-black text-[#1B3F2B] mb-5">Course Curriculum</h2>
        {children}
      </div>
    </div>
  )
}
