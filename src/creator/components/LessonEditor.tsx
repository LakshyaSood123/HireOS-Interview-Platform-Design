import type { CreatorLessonActivity, LessonBlock, CmsDifficulty } from "../types"
import { newCmsId } from "../types"

interface LessonEditorProps {
  activity: CreatorLessonActivity
  onChange: (activity: CreatorLessonActivity) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

function getBlock<T extends LessonBlock["type"]>(blocks: LessonBlock[], type: T): Extract<LessonBlock, { type: T }> | undefined {
  return blocks.find(b => b.type === type) as Extract<LessonBlock, { type: T }> | undefined
}

function upsertBlock(blocks: LessonBlock[], block: LessonBlock): LessonBlock[] {
  const idx = blocks.findIndex(b => b.type === block.type)
  if (idx === -1) return [...blocks, block]
  const copy = blocks.slice()
  copy[idx] = block
  return copy
}

export default function LessonEditor({ activity, onChange }: LessonEditorProps) {
  const explanation = getBlock(activity.blocks, "explanation")
  const keyPoints = getBlock(activity.blocks, "keyPoints")
  const example = getBlock(activity.blocks, "example")

  const set = <K extends keyof CreatorLessonActivity>(key: K, value: CreatorLessonActivity[K]) =>
    onChange({ ...activity, [key]: value })

  const setExplanation = (content: string) =>
    onChange({ ...activity, blocks: upsertBlock(activity.blocks, { id: explanation?.id ?? newCmsId("block"), type: "explanation", content }) })

  const setExample = (content: string) =>
    onChange({ ...activity, blocks: upsertBlock(activity.blocks, { id: example?.id ?? newCmsId("block"), type: "example", content }) })

  const keyPointItems = keyPoints?.items ?? []
  const setKeyPoints = (items: string[]) =>
    onChange({ ...activity, blocks: upsertBlock(activity.blocks, { id: keyPoints?.id ?? newCmsId("block"), type: "keyPoints", items }) })

  return (
    <div className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Lesson Title *</label>
        <input className={FIELD_CLASS} value={activity.title} onChange={e => set("title", e.target.value)} placeholder="Understanding Variables" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Learning Objective</label>
        <input className={FIELD_CLASS} value={activity.objective ?? ""} onChange={e => set("objective", e.target.value)} placeholder="Understand how variables store values in Python." />
      </div>

      <div>
        <label className={LABEL_CLASS}>Explanation</label>
        <textarea className={`${FIELD_CLASS} resize-none`} rows={5} value={explanation?.content ?? ""} onChange={e => setExplanation(e.target.value)} placeholder="Explain the concept in plain language…" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Key Points (one per line)</label>
        <textarea
          className={`${FIELD_CLASS} resize-none font-mono text-xs`}
          rows={4}
          value={keyPointItems.join("\n")}
          onChange={e => setKeyPoints(e.target.value.split("\n"))}
          placeholder={"Variables have names\nValues can change"}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Worked Example</label>
        <textarea className={`${FIELD_CLASS} resize-none font-mono text-xs`} rows={4} value={example?.content ?? ""} onChange={e => setExample(e.target.value)} placeholder="age = 21&#10;print(age)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className={LABEL_CLASS}>Time Complexity</label>
          <input className={FIELD_CLASS} value={activity.complexityTime ?? ""} onChange={e => set("complexityTime", e.target.value)} placeholder="Optional, e.g. O(n)" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Space Complexity</label>
          <input className={FIELD_CLASS} value={activity.complexitySpace ?? ""} onChange={e => set("complexitySpace", e.target.value)} placeholder="Optional, e.g. O(1)" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Reading Time (min)</label>
          <input type="number" min={1} className={FIELD_CLASS} value={activity.estimatedMinutes ?? ""} onChange={e => set("estimatedMinutes", e.target.value ? Number(e.target.value) : undefined)} placeholder="8" />
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
    </div>
  )
}
