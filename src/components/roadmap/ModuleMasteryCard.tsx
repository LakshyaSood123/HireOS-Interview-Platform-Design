interface ModuleMasteryCardProps {
  title: string
  questionCount: number
  /** True once every checkpoint in the module is completed (or in preview). */
  ready: boolean
  onStart: () => void
}

/** Roadmap entry for the module's final quiz. Sits after the checkpoints; it is
 * not a checkpoint and never affects their order, XP, unlocking or completion. */
export default function ModuleMasteryCard({ title, questionCount, ready, onStart }: ModuleMasteryCardProps) {
  return (
    <li className="relative">
      <div className="absolute left-5 -top-4 h-4 w-0.5 bg-[#BDD4B6]" aria-hidden="true" />
      <button
        type="button"
        onClick={onStart}
        className="w-full text-left rounded-2xl border-2 border-[#E2B44A]/60 bg-[#143326] p-4 sm:p-5 flex items-start gap-4 transition-all shadow-2xs hover:bg-[#1A4030] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#CFDFBA]"
      >
        <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-[#E2B44A] text-[#3B2A05]" aria-hidden="true">
          ★
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white">Module Mastery</h3>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-[#E2B44A]/50 bg-[#E2B44A]/15 text-[#F3D98B]">
              Optional Quiz
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {title} · {questionCount} questions
          </p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {ready
              ? "A final check on the whole module. It does not change your progress."
              : "You can try it any time. Finishing the checkpoints first makes it a fairer check."}
          </p>
        </div>
      </button>
    </li>
  )
}
