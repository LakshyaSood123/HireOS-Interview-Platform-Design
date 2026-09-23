// Generalizes the existing standard-CMS QuickCheckEditor.tsx's UI pattern
// (same field layout, same "click a letter to mark correct" interaction)
// onto the REAL learner QuickCheckContent shape used by DSA checkpoints —
// not a copy-paste of the standard editor, since QuickCheckContent's
// fields (question/options/correctIndex/explanation, no `id`/`order`) are
// a different shape from CreatorQuickCheckActivity.

import type { QuickCheckContent } from "../../../learning/types"

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"
const OPTION_LETTERS = ["A", "B", "C", "D"]

interface DsaQuickCheckSubEditorProps {
  quickCheck: QuickCheckContent | undefined
  onChange: (quickCheck: QuickCheckContent | undefined) => void
}

const EMPTY_QUICK_CHECK: QuickCheckContent = { question: "", options: ["", ""], correctIndex: 0, explanation: "" }

export default function DsaQuickCheckSubEditor({ quickCheck, onChange }: DsaQuickCheckSubEditorProps) {
  if (!quickCheck) {
    return (
      <button
        onClick={() => onChange(EMPTY_QUICK_CHECK)}
        className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4FD8A8] bg-[#1DB584]/10 hover:bg-[#1DB584]/15 border border-[#1DB584]/25 cursor-pointer transition-all"
      >
        + Add Quick Check
      </button>
    )
  }

  const set = <K extends keyof QuickCheckContent>(key: K, value: QuickCheckContent[K]) => onChange({ ...quickCheck, [key]: value })

  const setOption = (idx: number, value: string) => {
    const options = quickCheck.options.slice()
    options[idx] = value
    set("options", options)
  }
  const addOption = () => {
    if (quickCheck.options.length >= 4) return
    set("options", [...quickCheck.options, ""])
  }
  const removeOption = (idx: number) => {
    if (quickCheck.options.length <= 2) return
    const options = quickCheck.options.filter((_, i) => i !== idx)
    set("options", options)
    if (quickCheck.correctIndex >= options.length) set("correctIndex", 0)
  }

  const invalidOptionCount = quickCheck.options.filter(o => o.trim()).length < 2

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={LABEL_CLASS}>Quick Check</label>
        <button
          onClick={() => onChange(undefined)}
          className="text-[10.5px] font-bold text-gray-500 hover:text-red-400 cursor-pointer"
        >
          Remove Quick Check
        </button>
      </div>

      <div>
        <label className={LABEL_CLASS}>Question</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={quickCheck.question} onChange={e => set("question", e.target.value)} />
      </div>

      <div>
        <label className={LABEL_CLASS}>
          Options {invalidOptionCount && <span className="text-red-400 normal-case font-normal ml-1">(at least 2 required)</span>}
        </label>
        <div className="space-y-2">
          {quickCheck.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => set("correctIndex", idx)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 cursor-pointer border transition-colors ${
                  quickCheck.correctIndex === idx ? "bg-[#1DB584] border-[#1DB584] text-white" : "bg-black/20 border-white/15 text-gray-400 hover:border-[#1DB584]/50"
                }`}
                title="Mark as correct answer"
              >
                {OPTION_LETTERS[idx]}
              </button>
              <input className={FIELD_CLASS} value={opt} onChange={e => setOption(idx, e.target.value)} placeholder={`Option ${OPTION_LETTERS[idx]}`} />
              {quickCheck.options.length > 2 && (
                <button onClick={() => removeOption(idx)} className="w-7 h-7 shrink-0 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        {quickCheck.options.length < 4 && (
          <button onClick={addOption} className="mt-2 text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
            + Add option
          </button>
        )}
      </div>

      <div>
        <label className={LABEL_CLASS}>Explanation</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={quickCheck.explanation} onChange={e => set("explanation", e.target.value)} />
      </div>
    </div>
  )
}
