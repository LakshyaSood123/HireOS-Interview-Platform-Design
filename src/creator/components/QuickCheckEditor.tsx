import type { CreatorQuickCheckActivity } from "../types"

interface QuickCheckEditorProps {
  activity: CreatorQuickCheckActivity
  onChange: (activity: CreatorQuickCheckActivity) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"
const OPTION_LETTERS = ["A", "B", "C", "D"]

export default function QuickCheckEditor({ activity, onChange }: QuickCheckEditorProps) {
  const set = <K extends keyof CreatorQuickCheckActivity>(key: K, value: CreatorQuickCheckActivity[K]) =>
    onChange({ ...activity, [key]: value })

  const setOption = (idx: number, value: string) => {
    const options = activity.options.slice()
    options[idx] = value
    set("options", options)
  }

  const addOption = () => {
    if (activity.options.length >= 4) return
    set("options", [...activity.options, ""])
  }

  const removeOption = (idx: number) => {
    if (activity.options.length <= 2) return
    const options = activity.options.filter((_, i) => i !== idx)
    set("options", options)
    if (activity.correctIndex >= options.length) set("correctIndex", 0)
  }

  const invalidOptionCount = activity.options.filter(o => o.trim()).length < 2

  return (
    <div className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Quick Check Title *</label>
        <input className={FIELD_CLASS} value={activity.title} onChange={e => set("title", e.target.value)} placeholder="Variables Check" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Question *</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={activity.question} onChange={e => set("question", e.target.value)} placeholder="Which statement creates a Python variable?" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Options {invalidOptionCount && <span className="text-red-400 normal-case font-normal ml-1">(at least 2 options required)</span>}</label>
        <div className="space-y-2">
          {activity.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => set("correctIndex", idx)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 cursor-pointer border transition-colors ${
                  activity.correctIndex === idx ? "bg-[#1DB584] border-[#1DB584] text-white" : "bg-black/20 border-white/15 text-gray-400 hover:border-[#1DB584]/50"
                }`}
                title="Mark as correct answer"
              >
                {OPTION_LETTERS[idx]}
              </button>
              <input className={FIELD_CLASS} value={opt} onChange={e => setOption(idx, e.target.value)} placeholder={`Option ${OPTION_LETTERS[idx]}`} />
              {activity.options.length > 2 && (
                <button onClick={() => removeOption(idx)} className="w-7 h-7 shrink-0 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer text-xs" title="Remove option">✕</button>
              )}
            </div>
          ))}
        </div>
        {activity.options.length < 4 && (
          <button onClick={addOption} className="mt-2 text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
            + Add option
          </button>
        )}
        <p className="text-[10.5px] text-gray-500 mt-1.5">Click a letter badge to mark that option as correct.</p>
      </div>

      <div>
        <label className={LABEL_CLASS}>Explanation (shown after answering)</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={2} value={activity.explanation ?? ""} onChange={e => set("explanation", e.target.value)} placeholder="Python variables are created through assignment." />
      </div>
    </div>
  )
}
