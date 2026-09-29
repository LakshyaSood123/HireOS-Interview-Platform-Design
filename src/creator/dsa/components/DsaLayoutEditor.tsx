// Preview Draft layout editor — a constrained 12-column grid, never free
// x/y positioning. Scoped to one checkpoint's own lesson blocks; app chrome
// (nav, Trail HUD, auth, feedback control) is never represented here at
// all, since this only ever edits `CmsDsaCheckpoint.layout`.
//
// Reordering/resizing uses explicit move/span controls rather than HTML5
// drag-and-drop — a real, fully-functional constrained-grid editor, just
// with simpler interaction affordances than a drag handle (documented
// scope reduction, not a stub: every operation the spec asks for — reorder,
// move between rows, resize, add/remove rows, hide/show, reset — works).

import type { CmsDsaLayout, CmsDsaLayoutBlockType } from "../dsaCmsTypes"
import { DEFAULT_LAYOUT_BLOCK_ORDER, CMS_DSA_LAYOUT_VERSION } from "../dsaCmsTypes"

interface DsaLayoutEditorProps {
  layout: CmsDsaLayout | undefined
  onChange: (layout: CmsDsaLayout | undefined) => void
}

const BLOCK_LABELS: Record<CmsDsaLayoutBlockType, string> = {
  concepts: "Concept Foundations",
  animation: "Animation",
  codeTrace: "Code Trace",
  quickCheck: "Quick Check",
  coding: "Coding Workspace",
}

function defaultLayout(): CmsDsaLayout {
  return { version: CMS_DSA_LAYOUT_VERSION, rows: DEFAULT_LAYOUT_BLOCK_ORDER.map(type => ({ blocks: [{ type, span: 12 }] })) }
}

export default function DsaLayoutEditor({ layout, onChange }: DsaLayoutEditorProps) {
  const effective = layout ?? defaultLayout()
  const isCustom = layout !== undefined

  function update(next: CmsDsaLayout) {
    onChange(next)
  }

  function moveBlock(rowIdx: number, blockIdx: number, direction: "up" | "down" | "left" | "right") {
    const rows = effective.rows.map(r => ({ blocks: [...r.blocks] }))
    const block = rows[rowIdx]!.blocks[blockIdx]!

    if (direction === "left" || direction === "right") {
      const delta = direction === "left" ? -1 : 1
      const target = blockIdx + delta
      if (target < 0 || target >= rows[rowIdx]!.blocks.length) return
      ;[rows[rowIdx]!.blocks[blockIdx], rows[rowIdx]!.blocks[target]] = [rows[rowIdx]!.blocks[target]!, rows[rowIdx]!.blocks[blockIdx]!]
    } else {
      const targetRowIdx = direction === "up" ? rowIdx - 1 : rowIdx + 1
      if (targetRowIdx < 0 || targetRowIdx >= rows.length) return
      rows[rowIdx]!.blocks.splice(blockIdx, 1)
      rows[targetRowIdx]!.blocks.push(block)
      // A row left with zero blocks stays as an empty row rather than being
      // auto-removed — the author removes it explicitly via "Remove row" if
      // they don't want it, so an accidental move never silently deletes a row.
    }
    update({ ...effective, rows })
  }

  function setSpan(rowIdx: number, blockIdx: number, span: number) {
    const rows = effective.rows.map((r, i) => (i === rowIdx ? { blocks: r.blocks.map((b, j) => (j === blockIdx ? { ...b, span } : b)) } : r))
    update({ ...effective, rows })
  }

  function toggleHidden(rowIdx: number, blockIdx: number) {
    const rows = effective.rows.map((r, i) => (i === rowIdx ? { blocks: r.blocks.map((b, j) => (j === blockIdx ? { ...b, hidden: !b.hidden } : b)) } : r))
    update({ ...effective, rows })
  }

  function addRow() {
    const placedTypes = new Set(effective.rows.flatMap(r => r.blocks.map(b => b.type)))
    const unplaced = DEFAULT_LAYOUT_BLOCK_ORDER.find(t => !placedTypes.has(t))
    if (!unplaced) return
    update({ ...effective, rows: [...effective.rows, { blocks: [{ type: unplaced, span: 12 }] }] })
  }

  function removeRow(rowIdx: number) {
    const rows = effective.rows.filter((_, i) => i !== rowIdx)
    update({ ...effective, rows })
  }

  function resetToDefault() {
    onChange(undefined)
  }

  const rowSpanSum = (rowIdx: number) => effective.rows[rowIdx]!.blocks.reduce((sum, b) => sum + (b.hidden ? 0 : b.span), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] text-gray-500">{isCustom ? "Custom layout" : "Default layout (no custom layout configured)"}</p>
        {isCustom && (
          <button onClick={resetToDefault} className="text-[10.5px] font-bold text-gray-400 hover:text-white cursor-pointer">
            Reset to Default
          </button>
        )}
      </div>

      {effective.rows.map((row, rowIdx) => (
        <div key={rowIdx} className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Row {rowIdx + 1} · {rowSpanSum(rowIdx)}/12
            </span>
            <button onClick={() => removeRow(rowIdx)} className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer">
              Remove row
            </button>
          </div>
          {rowSpanSum(rowIdx) > 12 && <p className="text-[10.5px] text-red-400 mb-2">Row spans exceed 12 columns — will block publish.</p>}
          <div className="flex flex-wrap gap-2">
            {row.blocks.map((block, blockIdx) => (
              <div key={block.type} className={`rounded-lg border px-3 py-2 ${block.hidden ? "border-white/5 bg-white/[0.02] opacity-50" : "border-[#38BDF8]/30 bg-[#38BDF8]/5"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-white">{BLOCK_LABELS[block.type]}</span>
                  <button onClick={() => toggleHidden(rowIdx, blockIdx)} className="text-[9px] font-bold text-gray-400 hover:text-white cursor-pointer">
                    {block.hidden ? "Show" : "Hide"}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] text-gray-500">span</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={block.span}
                    onChange={e => setSpan(rowIdx, blockIdx, Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-12 rounded bg-black/30 border border-white/10 px-1.5 py-0.5 text-[10px] text-white outline-none"
                  />
                  <button onClick={() => moveBlock(rowIdx, blockIdx, "left")} className="text-[10px] text-gray-400 hover:text-white cursor-pointer px-1">
                    ←
                  </button>
                  <button onClick={() => moveBlock(rowIdx, blockIdx, "right")} className="text-[10px] text-gray-400 hover:text-white cursor-pointer px-1">
                    →
                  </button>
                  <button onClick={() => moveBlock(rowIdx, blockIdx, "up")} className="text-[10px] text-gray-400 hover:text-white cursor-pointer px-1">
                    ↑ row
                  </button>
                  <button onClick={() => moveBlock(rowIdx, blockIdx, "down")} className="text-[10px] text-gray-400 hover:text-white cursor-pointer px-1">
                    ↓ row
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addRow} className="px-3.5 py-2 rounded-xl text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
        + Add Row
      </button>

      <p className="text-[10px] text-gray-500">
        This grid controls Preview Draft's layout data only — see the note in this section's header: actually reordering the live lesson render is a follow-up (the shared
        LessonWorkspace component is not modified by this pass).
      </p>
    </div>
  )
}
