// Generalizes the existing standard-CMS CodingExerciseEditor.tsx pattern
// onto the REAL learner CodingActivityContent shape (prompt/constraints/
// functionName/requiredKeywords/starterCode/languages/visibleTests/
// hiddenTests/hint/mistakeFeedback/demoSolution) — richer than the
// standard CMS coding model, and none of these fields are invented; every
// one already exists in src/learning/types.ts and is read by the real
// CodeWorkspace/MockCodeRunner/PistonCodeRunner.
//
// IMPORTANT — this editor does NOT change what the LIVE DSA runtime
// executes. Editing a checkpoint's coding activity here only ever touches
// the local draft (src/creator/dsa/dsaDraftRepository.ts); the real
// RoutingCodeRunner/PistonCodeRunner allowlist and the real checkpoint
// content served by courseRegistry.ts are completely untouched in this
// phase. Draft Preview (DsaDraftPreview.tsx) always uses DisabledCodeRunner
// regardless of what's edited here — see PART 11/17 of the task.

import { useState } from "react"
import type { CodeLanguage, CodingActivityContent, TestCase } from "../../../learning/types"

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"
const ALL_LANGUAGES: CodeLanguage[] = ["python", "cpp", "java", "javascript"]

let testIdCounter = 0
function newTestId(): string {
  testIdCounter += 1
  return `test-${Date.now().toString(36)}-${testIdCounter}`
}

interface DsaCodingActivitySubEditorProps {
  coding: CodingActivityContent | undefined
  onChange: (coding: CodingActivityContent | undefined) => void
}

const EMPTY_CODING: CodingActivityContent = {
  prompt: "",
  functionName: "",
  requiredKeywords: [],
  starterCode: {},
  languages: ["python"],
  visibleTests: [],
  hiddenTests: [],
  hint: "",
  mistakeFeedback: "",
}

function TestList({ label, tests, onChange }: { label: string; tests: TestCase[]; onChange: (tests: TestCase[]) => void }) {
  const update = (id: string, patch: Partial<TestCase>) => onChange(tests.map(t => (t.id === id ? { ...t, ...patch } : t)))
  const remove = (id: string) => onChange(tests.filter(t => t.id !== id))
  const add = () => onChange([...tests, { id: newTestId(), description: "", input: "", expected: "" }])

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="space-y-2">
        {tests.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-5 shrink-0">#{i + 1}</span>
            <input className={`${FIELD_CLASS} font-mono text-xs`} value={t.description} onChange={e => update(t.id, { description: e.target.value })} placeholder="Description" />
            <input className={`${FIELD_CLASS} font-mono text-xs`} value={t.input} onChange={e => update(t.id, { input: e.target.value })} placeholder="Input" />
            <span className="text-gray-600 shrink-0">→</span>
            <input className={`${FIELD_CLASS} font-mono text-xs`} value={t.expected} onChange={e => update(t.id, { expected: e.target.value })} placeholder="Expected" />
            <button onClick={() => remove(t.id)} className="w-7 h-7 shrink-0 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer text-xs">✕</button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-2 text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
        + Add Test
      </button>
    </div>
  )
}

export default function DsaCodingActivitySubEditor({ coding, onChange }: DsaCodingActivitySubEditorProps) {
  const [starterTab, setStarterTab] = useState<CodeLanguage>(coding?.languages[0] ?? "python")

  if (!coding) {
    return (
      <button
        onClick={() => onChange(EMPTY_CODING)}
        className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4FD8A8] bg-[#1DB584]/10 hover:bg-[#1DB584]/15 border border-[#1DB584]/25 cursor-pointer transition-all"
      >
        + Add Coding Activity
      </button>
    )
  }

  const set = <K extends keyof CodingActivityContent>(key: K, value: CodingActivityContent[K]) => onChange({ ...coding, [key]: value })

  const toggleLanguage = (lang: CodeLanguage) => {
    const has = coding.languages.includes(lang)
    const languages = has ? coding.languages.filter(l => l !== lang) : [...coding.languages, lang]
    set("languages", languages)
    if (!has) setStarterTab(lang)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={LABEL_CLASS}>Coding Activity</label>
        <button onClick={() => onChange(undefined)} className="text-[10.5px] font-bold text-gray-500 hover:text-red-400 cursor-pointer">
          Remove Coding Activity
        </button>
      </div>

      {coding.demoSolution && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5 text-[11px] text-amber-200">
          This is a real, currently-executable DSA checkpoint (has a demo solution + hidden tests). Editing here only changes the local
          draft — it never modifies the live checkpoint or its Piston allowlist entry.
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Problem Prompt</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={3} value={coding.prompt} onChange={e => set("prompt", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Function Name</label>
          <input className={`${FIELD_CLASS} font-mono`} value={coding.functionName} onChange={e => set("functionName", e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Required Keywords (comma separated)</label>
          <input
            className={`${FIELD_CLASS} font-mono text-xs`}
            value={coding.requiredKeywords.join(", ")}
            onChange={e => set("requiredKeywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
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
                coding.languages.includes(lang) ? "bg-[#1DB584]/20 border-[#1DB584]/50 text-[#4FD8A8]" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/25"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {coding.languages.length > 0 && (
        <div>
          <label className={LABEL_CLASS}>Starter Code</label>
          <div className="flex items-center gap-1 mb-2">
            {coding.languages.map(lang => (
              <button
                key={lang}
                onClick={() => setStarterTab(lang)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  starterTab === lang ? "bg-[#1DB584] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <textarea
            className={`${FIELD_CLASS} resize-none font-mono text-xs`}
            rows={5}
            value={coding.starterCode[starterTab] ?? ""}
            onChange={e => set("starterCode", { ...coding.starterCode, [starterTab]: e.target.value })}
          />
        </div>
      )}

      <TestList label="Visible Tests" tests={coding.visibleTests} onChange={t => set("visibleTests", t)} />
      <TestList label="Hidden Tests" tests={coding.hiddenTests} onChange={t => set("hiddenTests", t)} />

      <div>
        <label className={LABEL_CLASS}>Hint</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={coding.hint} onChange={e => set("hint", e.target.value)} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Mistake Feedback</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={coding.mistakeFeedback} onChange={e => set("mistakeFeedback", e.target.value)} />
      </div>
    </div>
  )
}
