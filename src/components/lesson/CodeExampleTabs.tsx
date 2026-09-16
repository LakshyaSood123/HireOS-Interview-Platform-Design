import { useState } from "react"
import type { CodeExample } from "../../learning/types"

const LANGUAGE_LABEL: Record<string, string> = { python: "Python", cpp: "C++", java: "Java" }

/** Read-only worked-example code with language tabs (PART 7). Generic over
 * any `CodeExample[]` — not tied to Trees. The user's editable exercise
 * lives in a separate component (CodeWorkspace) below this. */
export default function CodeExampleTabs({ examples }: { examples: CodeExample[] }) {
  const [active, setActive] = useState(examples[0]?.language)
  const current = examples.find(e => e.language === active) ?? examples[0]
  if (!current) return null

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Worked Example</span>
        <div className="flex items-center gap-1">
          {examples.map(ex => (
            <button
              key={ex.language}
              onClick={() => setActive(ex.language)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                active === ex.language ? "bg-[#1DB584] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {LANGUAGE_LABEL[ex.language] ?? ex.language}
            </button>
          ))}
        </div>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
        <code>{current.code}</code>
      </pre>
    </div>
  )
}
