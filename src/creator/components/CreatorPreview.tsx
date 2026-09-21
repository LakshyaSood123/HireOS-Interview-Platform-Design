import { useState, useMemo } from "react"
import type { CreatorCourse, CreatorActivity, LessonBlock } from "../types"

interface CreatorPreviewProps {
  course: CreatorCourse
}

/**
 * Read-only, standalone renderer that shows what a CMS-authored course
 * would look like as a Reagvis-style learner experience (PART 21).
 *
 * CRITICAL ISOLATION (PART 22): this NEVER touches AppStateContext,
 * progressRepository, Piston, or any learner-progression state. It has no
 * XP/lives/completion concept at all — it is a pure, throwaway rendering of
 * `course` (in-memory CreatorCourse data), not a real lesson session.
 */
export default function CreatorPreview({ course }: CreatorPreviewProps) {
  const modules = course.modules
  const [moduleIdx, setModuleIdx] = useState(0)
  const [activityIdx, setActivityIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const activeModule = modules[moduleIdx]
  const activeActivity: CreatorActivity | undefined = activeModule?.activities[activityIdx]

  const flatList = useMemo(() => {
    const out: { moduleIdx: number; activityIdx: number }[] = []
    modules.forEach((m, mi) => m.activities.forEach((_, ai) => out.push({ moduleIdx: mi, activityIdx: ai })))
    return out
  }, [modules])

  const currentFlatIndex = flatList.findIndex(x => x.moduleIdx === moduleIdx && x.activityIdx === activityIdx)

  const goTo = (mi: number, ai: number) => {
    setModuleIdx(mi)
    setActivityIdx(ai)
    setSelectedOption(null)
    setSubmitted(false)
  }

  const goNext = () => {
    const next = flatList[currentFlatIndex + 1]
    if (next) goTo(next.moduleIdx, next.activityIdx)
  }
  const goPrev = () => {
    const prev = flatList[currentFlatIndex - 1]
    if (prev) goTo(prev.moduleIdx, prev.activityIdx)
  }

  if (modules.length === 0 || !activeActivity) {
    return (
      <div className="h-[calc(100vh-108px)] flex items-center justify-center text-center px-6">
        <div>
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm text-gray-400">Add a module and an activity in the Curriculum Builder to preview this course.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-108px)] flex flex-col bg-[#071A14]">
      {/* Preview mode banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">Preview Mode — not saved to any learner progress, no XP, no real execution</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-6">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-1">Reagvis Trails • {course.title}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{activeModule.title}</span>
              <span className="text-gray-600">›</span>
              <span className="text-gray-300">{activeActivity.title}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#092218] border border-[#1DB584]/30 p-6 shadow-xl">
            {activeActivity.type === "lesson" && <LessonPreview activity={activeActivity} />}
            {activeActivity.type === "quick-check" && (
              <QuickCheckPreview
                activity={activeActivity}
                selectedOption={selectedOption}
                submitted={submitted}
                onSelect={setSelectedOption}
                onSubmit={() => setSubmitted(true)}
              />
            )}
            {activeActivity.type === "coding" && <CodingPreview activity={activeActivity} />}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentFlatIndex <= 0}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              ← Previous
            </button>
            <span className="text-[11px] text-gray-500">{currentFlatIndex + 1} / {flatList.length}</span>
            <button
              onClick={goNext}
              disabled={currentFlatIndex >= flatList.length - 1}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getBlock<T extends LessonBlock["type"]>(blocks: LessonBlock[], type: T) {
  return blocks.find(b => b.type === type) as Extract<LessonBlock, { type: T }> | undefined
}

function LessonPreview({ activity }: { activity: Extract<CreatorActivity, { type: "lesson" }> }) {
  const explanation = getBlock(activity.blocks, "explanation")
  const keyPoints = getBlock(activity.blocks, "keyPoints")
  const example = getBlock(activity.blocks, "example")

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-3">{activity.title}</h1>
      {activity.objective && (
        <div className="mb-4 p-3.5 rounded-xl bg-black/25 border border-white/10">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-1">Learning Objective</p>
          <p className="text-xs text-gray-300 leading-relaxed">{activity.objective}</p>
        </div>
      )}
      {explanation?.content && (
        <div className="mb-4">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Explanation</p>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{explanation.content}</p>
        </div>
      )}
      {keyPoints && keyPoints.items.filter(Boolean).length > 0 && (
        <div className="mb-4">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Key Points</p>
          <ul className="space-y-1">
            {keyPoints.items.filter(Boolean).map((item, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-[#1DB584] mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {example?.content && (
        <div className="mb-2">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Worked Example</p>
          <pre className="rounded-xl bg-black/40 border border-white/10 p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">{example.content}</pre>
        </div>
      )}
      {(activity.complexityTime || activity.complexitySpace) && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-[11px] text-gray-400">
          {activity.complexityTime && <span>Time: <span className="text-[#4FD8A8] font-mono">{activity.complexityTime}</span></span>}
          {activity.complexitySpace && <span>Space: <span className="text-[#4FD8A8] font-mono">{activity.complexitySpace}</span></span>}
        </div>
      )}
    </div>
  )
}

function QuickCheckPreview({
  activity,
  selectedOption,
  submitted,
  onSelect,
  onSubmit,
}: {
  activity: Extract<CreatorActivity, { type: "quick-check" }>
  selectedOption: number | null
  submitted: boolean
  onSelect: (i: number) => void
  onSubmit: () => void
}) {
  return (
    <div>
      <p className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">Quick Check</p>
      <h2 className="text-base font-bold text-white mb-4">{activity.question}</h2>
      <div className="space-y-2 mb-4">
        {activity.options.map((opt, idx) => {
          const isCorrect = idx === activity.correctIndex
          const isSelected = idx === selectedOption
          let style = "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
          if (submitted && isCorrect) style = "bg-[#1DB584]/15 border-[#1DB584]/50 text-[#4FD8A8]"
          else if (submitted && isSelected && !isCorrect) style = "bg-red-500/10 border-red-500/40 text-red-300"
          else if (isSelected) style = "bg-[#1DB584]/10 border-[#1DB584]/40 text-white"
          return (
            <button
              key={idx}
              onClick={() => !submitted && onSelect(idx)}
              disabled={submitted}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer disabled:cursor-default ${style}`}
            >
              {opt || `Option ${idx + 1}`}
            </button>
          )
        })}
      </div>
      {!submitted ? (
        <button
          onClick={onSubmit}
          disabled={selectedOption === null}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          Submit
        </button>
      ) : (
        activity.explanation && (
          <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 text-xs text-gray-300 leading-relaxed">{activity.explanation}</div>
        )
      )}
    </div>
  )
}

function CodingPreview({ activity }: { activity: Extract<CreatorActivity, { type: "coding" }> }) {
  const lang = activity.languages[0]
  return (
    <div>
      <p className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">Coding Exercise</p>
      <h2 className="text-base font-bold text-white mb-2">{activity.title}</h2>
      <p className="text-xs text-gray-300 leading-relaxed mb-4">{activity.problemStatement || "No problem statement yet."}</p>

      {activity.languages.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          {activity.languages.map(l => (
            <span key={l} className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${l === lang ? "bg-[#1DB584] text-white" : "text-gray-400"}`}>
              {l === "python" ? "Python" : l === "cpp" ? "C++" : "Java"}
            </span>
          ))}
        </div>
      )}

      {lang && activity.starterCode[lang] && (
        <pre className="rounded-xl bg-black/40 border border-white/10 p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap mb-4">{activity.starterCode[lang]}</pre>
      )}

      {activity.visibleTests.length > 0 && (
        <div className="mb-4">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Visible Test Cases ({activity.visibleTests.length})</p>
          <div className="space-y-1.5">
            {activity.visibleTests.map((t, i) => (
              <div key={t.id} className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
                <span className="text-gray-600">#{i + 1}</span>
                <span className="text-gray-300">{t.input || "(no input)"}</span>
                <span className="text-gray-600">→</span>
                <span className="text-emerald-300">{t.expected || "(no expected value)"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-black/20 border border-white/10 px-3.5 py-2.5 text-[11px] text-gray-500">
        Preview only — Run/Submit are not wired to real code execution for CMS-authored exercises.
      </div>
    </div>
  )
}
