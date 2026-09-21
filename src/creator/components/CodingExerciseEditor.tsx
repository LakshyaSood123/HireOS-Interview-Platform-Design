import { useState } from "react"
import type { CreatorCodingActivity, CmsLanguage, CmsDifficulty, CmsTestCase } from "../types"
import { newCmsId } from "../types"

interface CodingExerciseEditorProps {
  activity: CreatorCodingActivity
  onChange: (activity: CreatorCodingActivity) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"
const ALL_LANGUAGES: CmsLanguage[] = ["python", "cpp", "java"]
const LANGUAGE_LABEL: Record<CmsLanguage, string> = { python: "Python", cpp: "C++", java: "Java" }

export default function CodingExerciseEditor({ activity, onChange }: CodingExerciseEditorProps) {
  const [starterTab, setStarterTab] = useState<CmsLanguage>(activity.languages[0] ?? "python")

  const set = <K extends keyof CreatorCodingActivity>(key: K, value: CreatorCodingActivity[K]) =>
    onChange({ ...activity, [key]: value })

  const toggleLanguage = (lang: CmsLanguage) => {
    const has = activity.languages.includes(lang)
    const languages = has ? activity.languages.filter(l => l !== lang) : [...activity.languages, lang]
    set("languages", languages)
    if (!has) setStarterTab(lang)
  }

  const setStarterCode = (lang: CmsLanguage, code: string) => {
    set("starterCode", { ...activity.starterCode, [lang]: code })
  }

  const addTest = () => {
    const test: CmsTestCase = { id: newCmsId("test"), input: "", expected: "" }
    set("visibleTests", [...activity.visibleTests, test])
  }
  const updateTest = (id: string, patch: Partial<CmsTestCase>) => {
    set("visibleTests", activity.visibleTests.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }
  const removeTest = (id: string) => {
    set("visibleTests", activity.visibleTests.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Problem Title *</label>
        <input className={FIELD_CLASS} value={activity.title} onChange={e => set("title", e.target.value)} placeholder="Create a Variable" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Problem Statement *</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={3} value={activity.problemStatement} onChange={e => set("problemStatement", e.target.value)} placeholder="Write a function that…" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Function Name *</label>
          <input className={`${FIELD_CLASS} font-mono`} value={activity.functionName} onChange={e => set("functionName", e.target.value)} placeholder="makeGreeting" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Difficulty</label>
          <select className={FIELD_CLASS} value={activity.difficulty ?? "Beginner"} onChange={e => set("difficulty", e.target.value as CmsDifficulty)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Supported Languages</label>
        <div className="flex items-center gap-2">
          {ALL_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${
                activity.languages.includes(lang) ? "bg-[#1DB584]/20 border-[#1DB584]/50 text-[#4FD8A8]" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/25"
              }`}
            >
              {LANGUAGE_LABEL[lang]}
            </button>
          ))}
        </div>
      </div>

      {activity.languages.length > 0 && (
        <div>
          <label className={LABEL_CLASS}>Starter Code</label>
          <div className="flex items-center gap-1 mb-2">
            {activity.languages.map(lang => (
              <button
                key={lang}
                onClick={() => setStarterTab(lang)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  starterTab === lang ? "bg-[#1DB584] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {LANGUAGE_LABEL[lang]}
              </button>
            ))}
          </div>
          <textarea
            className={`${FIELD_CLASS} resize-none font-mono text-xs`}
            rows={4}
            value={activity.starterCode[starterTab] ?? ""}
            onChange={e => setStarterCode(starterTab, e.target.value)}
            placeholder={`def ${activity.functionName || "solve"}(...):\n    # your code here\n    pass`}
          />
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Visible Test Cases</label>
        <div className="space-y-2">
          {activity.visibleTests.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-5 shrink-0">#{idx + 1}</span>
              <input className={`${FIELD_CLASS} font-mono text-xs`} value={t.input} onChange={e => updateTest(t.id, { input: e.target.value })} placeholder="Input: [1,2,3]" />
              <span className="text-gray-600 shrink-0">→</span>
              <input className={`${FIELD_CLASS} font-mono text-xs`} value={t.expected} onChange={e => updateTest(t.id, { expected: e.target.value })} placeholder="Expected: 3" />
              <button onClick={() => removeTest(t.id)} className="w-7 h-7 shrink-0 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer text-xs">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addTest} className="mt-2 text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
          + Add Visible Test
        </button>
      </div>

      <div className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 flex items-start gap-2.5">
        <span className="text-sm shrink-0">ℹ️</span>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          This exercise is authorable and previewable only in this demo. Execution configuration is managed by the platform — Creator Studio does not connect authored problems to real code execution.
        </p>
      </div>
    </div>
  )
}
