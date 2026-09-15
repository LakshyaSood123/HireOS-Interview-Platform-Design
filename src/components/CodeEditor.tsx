import { useRef, useState } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  filename?: string
  runLabel: string
  outputLabel: string
  outputPlaceholder: string
  ranMessage: string
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  filename = "solution.js",
  runLabel,
  outputLabel,
  outputPlaceholder,
  ranMessage,
}: CodeEditorProps) {
  const [hasRun, setHasRun] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = value.split("\n").length

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = value.slice(0, start) + "  " + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand/70" />
          </div>
          <span className="text-gray-400 text-xs font-mono">{filename}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-1 rounded-full">
          {language}
        </span>
      </div>

      {/* Editor */}
      <div className="flex font-mono text-sm" style={{ height: "220px" }}>
        <div
          ref={gutterRef}
          className="select-none text-right px-3 py-3 text-gray-600 bg-[#0a0e14] overflow-hidden flex-shrink-0"
          style={{ lineHeight: "1.6" }}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-gray-100 px-3 py-3 outline-none resize-none overflow-auto"
          style={{ lineHeight: "1.6" }}
        />
      </div>

      {/* Run bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-t border-white/10">
        <button
          onClick={() => setHasRun(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M8 5v14l11-7z" />
          </svg>
          {runLabel}
        </button>
      </div>

      {/* Output */}
      <div className="px-4 py-3 bg-black/40 border-t border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{outputLabel}</p>
        <p className="font-mono text-xs text-gray-400">{hasRun ? ranMessage : outputPlaceholder}</p>
      </div>
    </div>
  )
}
