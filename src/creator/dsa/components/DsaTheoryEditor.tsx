// Editors for the parts of LessonWorkspaceContent that are already
// block-shaped in the real schema: `theory: TheoryBlock[]` (heading+body
// pairs) and `codeExamples: CodeExample[]` (language+code pairs). These
// are the ONLY block types LessonWorkspaceContent actually has — no
// "callout"/"example" union like the standard CMS's LessonBlock, so this
// editor doesn't invent one (PART 9: "ONLY support block types that
// really exist in the current schema").

import type { CodeExample, CodeLanguage, TheoryBlock } from "../../../learning/types"

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const copy = items.slice()
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

interface DsaTheoryBlocksEditorProps {
  blocks: TheoryBlock[]
  onChange: (blocks: TheoryBlock[]) => void
}

export function DsaTheoryBlocksEditor({ blocks, onChange }: DsaTheoryBlocksEditorProps) {
  const update = (index: number, patch: Partial<TheoryBlock>) => {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)))
  }
  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index))
  const move = (index: number, direction: -1 | 1) => onChange(moveItem(blocks, index, direction))
  const add = () => onChange([...blocks, { heading: "New Section", body: "" }])

  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Theory Blocks</label>
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl bg-black/20 border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={block.heading}
              onChange={e => update(i, { heading: e.target.value })}
              placeholder="Heading"
              className={`${FIELD_CLASS} font-bold`}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-[10px]">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-[10px]">▼</button>
              <button onClick={() => remove(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/10 cursor-pointer text-xs">✕</button>
            </div>
          </div>
          <textarea
            value={block.body}
            onChange={e => update(i, { body: e.target.value })}
            placeholder="Body"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>
      ))}
      <button onClick={add} className="text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
        + Add Theory Block
      </button>
    </div>
  )
}

const ALL_LANGUAGES: CodeLanguage[] = ["python", "cpp", "java", "javascript"]

interface DsaCodeExamplesEditorProps {
  codeExamples: CodeExample[] | undefined
  onChange: (codeExamples: CodeExample[] | undefined) => void
}

export function DsaCodeExamplesEditor({ codeExamples, onChange }: DsaCodeExamplesEditorProps) {
  const examples = codeExamples ?? []
  const update = (index: number, patch: Partial<CodeExample>) => {
    onChange(examples.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }
  const remove = (index: number) => {
    const next = examples.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : undefined)
  }
  const add = () => onChange([...examples, { language: "python", code: "" }])

  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Code Examples</label>
      {examples.map((example, i) => (
        <div key={i} className="rounded-xl bg-black/20 border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={example.language}
              onChange={e => update(i, { language: e.target.value as CodeLanguage })}
              className={`${FIELD_CLASS} w-32 shrink-0`}
            >
              {ALL_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button onClick={() => remove(i)} className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/10 cursor-pointer text-xs">✕</button>
          </div>
          <textarea
            value={example.code}
            onChange={e => update(i, { code: e.target.value })}
            rows={5}
            className={`${FIELD_CLASS} resize-none font-mono text-xs`}
          />
        </div>
      ))}
      <button onClick={add} className="text-[11px] font-bold text-[#4FD8A8] hover:text-white cursor-pointer transition-colors">
        + Add Code Example
      </button>
    </div>
  )
}
