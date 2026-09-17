import { useState } from "react"
import type { Checkpoint, ProgressState } from "../../learning/types"
import type { CodeRunner } from "../../learning/services/codeRunner"
import type { NotesRepository } from "../../learning/services/notesRepository"
import BinaryTreeDiagram from "./BinaryTreeDiagram"
import CallStackVisual from "./CallStackVisual"
import TwoPointerVisual from "./TwoPointerVisual"
import CodeExampleTabs from "./CodeExampleTabs"
import CodeWorkspace from "./CodeWorkspace"
import QuickCheckCard from "./QuickCheckCard"
import NotesPanel from "./NotesPanel"

interface LessonWorkspaceProps {
  checkpoint: Checkpoint
  moduleTitle: string
  state: ProgressState
  lives: number
  runner: CodeRunner
  notesRepository: NotesRepository
  courseId: string
  moduleId: string
  /** True when this checkpoint is being viewed via Course Library's
   * "Preview" flow rather than real progression — inspection only, never
   * mutating. Changes the completion button to an honest "End Preview"
   * instead of pretending to complete/award XP. */
  isPreview?: boolean
  onFailedSubmit: () => void
  /** Performs the actual engine completion (AppStateContext's
   * completeCheckpointById) — synchronous, called once. Returns whether the
   * completion actually happened (true) or was rejected by the engine
   * (false, e.g. the checkpoint wasn't actually available/current) — the
   * celebration UI must only appear when this is true. Preview mode passes
   * a callback that always returns false, since preview must never mutate
   * progress or award XP. */
  onComplete: () => boolean
  /** Navigate to the next checkpoint's workspace (or back to the roadmap if
   * this was the module's last checkpoint) — called from the post-completion
   * celebration's "Continue" button. */
  onContinue: () => void
  onBack: () => void
}

/** Generic Lesson Workspace: THEORY -> VISUAL -> WORKED EXAMPLE -> TRY IT
 * YOURSELF -> QUICK CHECK -> CONTINUE (PART 4). Reused by any checkpoint
 * whose `workspace` content is populated — Trees today, future
 * DBMS/OS/Networks/System Design checkpoints reuse this same shell with
 * their own theory/visual/activity content. Nothing here is Trees-specific
 * except which content object gets passed in. */
export default function LessonWorkspace({
  checkpoint,
  moduleTitle,
  state,
  lives,
  runner,
  notesRepository,
  courseId,
  moduleId,
  isPreview = false,
  onFailedSubmit,
  onComplete,
  onContinue,
  onBack,
}: LessonWorkspaceProps) {
  const content = checkpoint.workspace
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [activitySatisfied, setActivitySatisfied] = useState(false)
  const [outOfLives, setOutOfLives] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 text-center text-white">
        <h2 className="text-xl font-bold mb-4">{checkpoint.title}</h2>
        <p className="text-gray-400 mb-6">This checkpoint doesn't have Lesson Workspace content yet.</p>
        <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-[#1DB584] text-white font-bold">
          Back to Roadmap
        </button>
      </div>
    )
  }

  const isReview = state === "completed" || state === "mastered"
  const requiresActivity = Boolean(content.codingActivity) || Boolean(content.quickCheck)
  const canComplete = isReview || isPreview || !requiresActivity || activitySatisfied

  const handleFailedSubmit = () => {
    onFailedSubmit()
    if (lives - 1 <= 0) setOutOfLives(true)
  }

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to {moduleTitle} Roadmap
          </button>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-red-400 font-bold" title="Lives">
              {"♥".repeat(Math.max(0, lives))}
              {"♡".repeat(Math.max(0, 3 - lives))}
            </span>
            <button
              onClick={() => setNotesOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold"
            >
              📝 Notes
            </button>
          </div>
        </div>

        {isReview && (
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-[#1DB584]/10 border border-[#1DB584]/30 text-[#4FD8A8] text-xs font-semibold">
            You've already completed this checkpoint — feel free to review it. No additional XP is awarded.
          </div>
        )}

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1DB584]/20 text-[#1DB584] mb-3">
            <span>📖</span> +{checkpoint.xp}{checkpoint.masteryXp ? ` (+${checkpoint.masteryXp} mastery)` : ""} XP
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{content.title}</h1>
        </div>

        {/* ── THEORY ── */}
        <div className="space-y-4 mb-8">
          {content.theory.map((block, i) => (
            <div key={i} className="rounded-2xl bg-[#092218] border border-white/10 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-[#A7CE65] mb-1.5">{block.heading}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{block.body}</p>
            </div>
          ))}

          {content.learnMore && (
            <div>
              <button
                onClick={() => setLearnMoreOpen(v => !v)}
                className="text-xs font-semibold text-[#1DB584] hover:text-[#4FD8A8]"
              >
                {learnMoreOpen ? "Hide details" : "Learn More ›"}
              </button>
              {learnMoreOpen && (
                <p className="mt-2 text-xs text-gray-400 leading-relaxed bg-white/5 rounded-xl p-3.5 border border-white/10">
                  {content.learnMore}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── VISUAL ── */}
        {content.visual && (
          <div className="mb-8">
            <BinaryTreeDiagram visual={content.visual} />
          </div>
        )}
        {content.callStackVisual && (
          <div className="mb-8">
            <CallStackVisual frames={content.callStackVisual.frames} />
          </div>
        )}
        {content.twoPointerVisual && (
          <div className="mb-8">
            <TwoPointerVisual values={content.twoPointerVisual.values} mode={content.twoPointerVisual.mode} />
          </div>
        )}

        {/* ── WORKED EXAMPLE (read-only) ── */}
        {content.codeExamples && (
          <div className="mb-8">
            <CodeExampleTabs examples={content.codeExamples} />
          </div>
        )}

        {/* ── TRY IT YOURSELF ── */}
        {content.codingActivity && (
          <div className="mb-8">
            <CodeWorkspace
              activity={content.codingActivity}
              runner={runner}
              onFailedSubmit={handleFailedSubmit}
              onSuccessfulSubmit={() => setActivitySatisfied(true)}
            />
          </div>
        )}

        {/* ── QUICK CHECK ── */}
        {content.quickCheck && (
          <div className="mb-8">
            <QuickCheckCard
              quickCheck={content.quickCheck}
            />
            {!content.codingActivity && (
              <button
                onClick={() => setActivitySatisfied(true)}
                className="mt-3 text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2"
              >
                Mark quick check reviewed and continue
              </button>
            )}
          </div>
        )}

        {outOfLives && !isReview && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold">
            You've used your current attempts. Take a short break or continue in demo mode — Submit still works.
          </div>
        )}

        {/* ── CONTINUE ── */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              if (isReview || isPreview) {
                onBack()
                return
              }
              const completed = onComplete()
              if (completed) setCelebrating(true)
            }}
            disabled={!canComplete}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isReview ? "Return to Roadmap" : isPreview ? "End Preview" : "Complete Checkpoint"}</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      {notesOpen && (
        <NotesPanel
          repository={notesRepository}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={checkpoint.id}
          onClose={() => setNotesOpen(false)}
        />
      )}

      {celebrating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F3524] via-[#092218] to-[#05140F] border border-[#1DB584]/50 p-7 text-center text-white shadow-[0_0_60px_rgba(29,181,132,0.3)]">
            <div className="text-4xl mb-3">{checkpoint.masteryXp ? "🏆" : "✅"}</div>
            <h2 className="text-xl font-black mb-1">
              {checkpoint.masteryXp ? "Module Mastered!" : "Checkpoint Complete!"}
            </h2>
            <p className="text-sm text-emerald-200/90 mb-5">
              +{checkpoint.xp}{checkpoint.masteryXp ? ` +${checkpoint.masteryXp} mastery` : ""} XP earned
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onContinue}
                className="py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:scale-[1.02] transition-all cursor-pointer"
              >
                Continue ➔
              </button>
              <button
                onClick={onBack}
                className="py-3 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Return to {moduleTitle} Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
