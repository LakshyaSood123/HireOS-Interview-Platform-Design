import { useEffect, useState, type ReactNode } from "react"
import type { Checkpoint, LessonWorkspaceLayoutBlockType, ProgressState } from "../../learning/types"
import type { CodeRunner } from "../../learning/services/codeRunner"
import type { NotesRepository } from "../../learning/services/notesRepository"
import BinaryTreeDiagram from "./BinaryTreeDiagram"
import CallStackVisual from "./CallStackVisual"
import TwoPointerVisual from "./TwoPointerVisual"
import AlgorithmAnimation from "./AlgorithmAnimation"
import CodeExampleTabs from "./CodeExampleTabs"
import CodeWorkspace from "./CodeWorkspace"
import QuickCheckCard, { type QuickCheckAnswer } from "./QuickCheckCard"
import NotesPanel from "./NotesPanel"
import LessonCampBackdrop from "./camp/LessonCampBackdrop"
import LessonQuickFeedback from "../feedback/LessonQuickFeedback"
import { useAuth } from "../../auth/AuthContext"
import { recordAttempt } from "../../learning/services/attemptsApi"
import { ApiUnavailableError, SessionExpiredError } from "../../learning/services/apiClient"

/** The one course wired to the backend in this phase — matches
 * AppStateContext.tsx's BACKEND_COURSE_ID. */
const BACKEND_COURSE_ID = "dsa-foundations"

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
  /** Creator Studio's Preview Draft "Tablet / Narrow" mode — forces the
   * custom-layout renderer's responsive stacking regardless of the actual
   * browser viewport, since the preview is rendered inline in the page
   * (not a real emulated device) and `window.innerWidth` alone wouldn't
   * reflect an author-chosen preview width. No effect when this checkpoint
   * has no custom `layout` (the three original per-type branches don't
   * read this prop at all). */
  forceNarrow?: boolean
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

/**
 * Desktop-First Reagvis Trails Campsite Study Station:
 * - Immersive illustrated campsite backdrop framing the functional panels
 * - Expansive multi-column layout taking full advantage of desktop viewport width
 * - Eliminates deep vertical stacking while preserving 100% of Reagvis visual identity
 * - Intelligently adapts to Checkpoint Type: Coding, Animation, or Concept/MCQ
 */
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
  forceNarrow = false,
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

  // Recording a Quick Check answer as a learner attempt — the one meaningful
  // attempt semantic the backend's LearningAttempt model actually supports
  // (see attemptsApi.ts). Never in preview: previewing is inspection only,
  // exactly like it never touches completion/XP. A failure here is logged
  // and otherwise invisible — the Quick Check UI, and the rest of the
  // checkpoint, behave exactly as they did before this existed.
  const { client, reportSessionExpired } = useAuth()
  const handleQuickCheckAnswered = (answer: QuickCheckAnswer) => {
    if (isPreview || courseId !== BACKEND_COURSE_ID) return
    recordAttempt(client, {
      courseId,
      checkpointId: checkpoint.id,
      activityId: `${checkpoint.id}-quick-check`,
      attemptType: "quick-check",
      passed: answer.passed,
      payload: { selectedIndex: answer.selectedIndex, correctIndex: answer.correctIndex },
    }).catch(error => {
      if (error instanceof SessionExpiredError) {
        reportSessionExpired()
        return
      }
      if (!(error instanceof ApiUnavailableError)) console.error("[reagvis] quick check attempt did not reach the backend", error)
    })
  }

  if (!content) {
    return (
      <div className="relative min-h-screen bg-[#071A14] font-display text-white flex items-center justify-center p-6">
        <LessonCampBackdrop moduleTitle={moduleTitle} />
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-[#092218]/95 border border-[#1DB584]/30 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-[#1DB584]/20 border border-[#1DB584]/40 flex items-center justify-center text-2xl mx-auto mb-4">
            🏕️
          </div>
          <h2 className="text-xl font-black mb-2 text-white">{checkpoint.title}</h2>
          <p className="text-sm text-gray-300 mb-6">This checkpoint does not have Lesson Workspace content authored yet.</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-[#1DB584] hover:bg-[#159a6f] text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Back to {moduleTitle} Roadmap
          </button>
        </div>
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

  const handleCompleteAction = () => {
    if (isReview || isPreview) {
      onBack()
      return
    }
    const completed = onComplete()
    if (completed) setCelebrating(true)
  }

  // Checkpoint category classification
  const isCoding = Boolean(content.codingActivity)
  const isAnimation = Boolean(content.animation || content.visual || content.callStackVisual || content.twoPointerVisual)
  const isConceptOnly = !isCoding && !isAnimation

  // ══════════════════════════════════════════════════════════════════════
  // CMS-authored custom layout — see `LessonWorkspaceLayout` (learning/types.ts).
  // A checkpoint without a valid `layout` (every checkpoint that existed
  // before this subsystem, and any new one an author hasn't customized)
  // renders through the three ORIGINAL branches below, completely
  // untouched — this block only ever intercepts when `layout` is present
  // and structurally sound.
  // ══════════════════════════════════════════════════════════════════════
  const layout = checkpoint.layout
  const hasValidCustomLayout = Boolean(layout && layout.version === 1 && Array.isArray(layout.rows) && layout.rows.length > 0)

  const [narrowByViewport, setNarrowByViewport] = useState(false)
  useEffect(() => {
    if (!hasValidCustomLayout) return
    const check = () => setNarrowByViewport(window.innerWidth < 900)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [hasValidCustomLayout])
  const isNarrow = forceNarrow || narrowByViewport

  // Each of these renders the EXACT SAME components/state as the original
  // three branches below — never a second CodeWorkspace/QuickCheckCard
  // instance, never re-derived data. `null` means "this block type has no
  // content for this checkpoint" (coding/quickCheck are conditional) or
  // "this block type isn't independently renderable" (codeTrace — see its
  // comment) — either way, the custom-layout loop below skips it
  // gracefully rather than leaving a visible gap.
  const renderConceptsBlock = () => (
    <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-5 shadow-xl min-w-0 h-full">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <span className="text-base">💡</span>
        <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">Concept Foundations</h3>
      </div>
      <div className="space-y-3.5 min-w-0">
        {content.theory.map((block, i) => (
          <div key={i} className="rounded-xl bg-black/25 border border-white/5 p-3.5 min-w-0">
            <h4 className="text-xs font-bold text-[#A7CE65] mb-1">{block.heading}</h4>
            <p className="text-xs text-gray-300 leading-relaxed break-words">{block.body}</p>
          </div>
        ))}
      </div>
      {content.learnMore && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            onClick={() => setLearnMoreOpen(v => !v)}
            className="text-xs font-bold text-[#1DB584] hover:text-[#4FD8A8] transition-colors flex items-center justify-between w-full cursor-pointer"
          >
            <span>{learnMoreOpen ? "Hide Details" : "Learn More Details ›"}</span>
            <span>{learnMoreOpen ? "▲" : "▼"}</span>
          </button>
          {learnMoreOpen && <p className="mt-2 text-xs text-gray-400 leading-relaxed bg-black/30 rounded-xl p-3 border border-white/5 break-words">{content.learnMore}</p>}
        </div>
      )}
      {content.codeExamples && (
        <div className="mt-4 pt-3.5 border-t border-white/10">
          <h4 className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
            <span>💻</span>
            <span>Implementation Example</span>
          </h4>
          <CodeExampleTabs examples={content.codeExamples} />
        </div>
      )}
    </div>
  )

  const renderAnimationBlock = () => (
    <div className="rounded-2xl bg-[#04100C] border border-[#1DB584]/35 shadow-2xl overflow-hidden p-1 min-w-0 w-full max-w-full box-border h-full">
      {content.animation && <AlgorithmAnimation animation={content.animation} />}
      {content.visual && <BinaryTreeDiagram visual={content.visual} />}
      {content.callStackVisual && <CallStackVisual frames={content.callStackVisual.frames} />}
      {content.twoPointerVisual && <TwoPointerVisual values={content.twoPointerVisual.values} mode={content.twoPointerVisual.mode} />}
    </div>
  )

  const renderQuickCheckBlock = () => (
    <div className="min-w-0">
      <QuickCheckCard quickCheck={content.quickCheck!} onAnswered={handleQuickCheckAnswered} />
      <button
        onClick={() => setActivitySatisfied(true)}
        className="mt-2.5 text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2 block text-center w-full cursor-pointer"
      >
        Mark quick check reviewed and continue
      </button>
    </div>
  )

  const renderCodingBlock = () => (
    <CodeWorkspace
      activity={content.codingActivity!}
      activityId={checkpoint.id}
      theory={content.theory}
      learnMore={content.learnMore}
      runner={runner}
      onFailedSubmit={handleFailedSubmit}
      onSuccessfulSubmit={() => setActivitySatisfied(true)}
    />
  )

  // `codeTrace` has no independently renderable content of its own for a
  // REGISTERED animation — CodeTracePanel is rendered from INSIDE
  // AnimationPlayback.tsx (nested under `animation`), not as a sibling
  // LessonWorkspace controls directly. Splitting them apart would mean
  // restructuring AnimationPlayback itself, which is a larger change than
  // this composition-only pass covers. A layout that places `codeTrace` as
  // its own block therefore skips it gracefully here (its content already
  // appears wherever `animation` renders) rather than showing an empty box
  // or a fabricated duplicate.
  const blockRenderers: Partial<Record<LessonWorkspaceLayoutBlockType, () => ReactNode>> = {
    concepts: renderConceptsBlock,
    animation: isAnimation ? renderAnimationBlock : undefined,
    quickCheck: content.quickCheck ? renderQuickCheckBlock : undefined,
    coding: content.codingActivity ? renderCodingBlock : undefined,
  }

  const renderCompletionBar = () => (
    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-2 min-w-0">
        <span className="text-xs text-gray-400">
          {isReview
            ? "You've reviewed this checkpoint. Return to the roadmap whenever you're ready."
            : canComplete
              ? "Ready to record progress!"
              : "Complete the activity above to unlock this button."}
        </span>
        <LessonQuickFeedback checkpointTitle={content.title} />
      </div>
      <button
        onClick={handleCompleteAction}
        disabled={!canComplete}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <span>{isReview ? "Return to Roadmap" : isPreview ? "End Preview" : "Complete Checkpoint"}</span>
        <span>➔</span>
      </button>
    </div>
  )

  const renderCustomLayout = () => {
    const renderedTypes = new Set<LessonWorkspaceLayoutBlockType>()
    return (
      <div className="flex-1 flex flex-col justify-between min-w-0 w-full max-w-full">
        <div className="space-y-4 w-full max-w-full min-w-0">
          {layout!.rows.map((row, rowIdx) => (
            <div key={rowIdx} className="grid gap-4 items-stretch w-full max-w-full min-w-0" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
              {row.blocks.map((block, blockIdx) => {
                if (block.hidden) return null
                // Singleton guard — a block type already rendered earlier
                // in this layout (e.g. authored twice by mistake) never
                // renders a second time; there is exactly one QuickCheckCard/
                // CodeWorkspace/etc. instance regardless of how many times
                // its type appears in the configured rows.
                if (renderedTypes.has(block.type)) return null
                const renderer = blockRenderers[block.type]
                if (!renderer) return null // unavailable for this checkpoint, or structurally merged (codeTrace) — skip gracefully, no empty hole
                renderedTypes.add(block.type)
                const span = isNarrow ? 12 : Math.min(12, Math.max(1, block.span))
                return (
                  <div key={block.type + blockIdx} className="min-w-0" style={{ gridColumn: `span ${span} / span ${span}` }}>
                    {renderer()}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {renderCompletionBar()}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#071A14] font-display text-white overflow-x-hidden">
      {/* ── CAMPSITE ILLUSTRATED SCENERY BACKDROP ── */}
      <LessonCampBackdrop moduleTitle={moduleTitle} />

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="relative z-10 w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col min-h-screen box-border min-w-0">
        {/* ══════════════════════════════════════════════════════════════════
            1. SLEEK HORIZONTAL LESSON HEADER (DESKTOP OPTIMIZED)
            ══════════════════════════════════════════════════════════════════ */}
        <header className="mb-5 pb-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Roadmap navigation & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all group cursor-pointer shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#1DB584]"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Back to {moduleTitle} Roadmap</span>
            </button>

            <div className="h-4 w-[1px] bg-white/15 hidden sm:block" />

            <span className="text-xs font-semibold text-gray-400 hidden sm:inline-flex items-center gap-1.5">
              <span>🏕️</span>
              <span>Camp Learning Station</span>
            </span>
          </div>

          {/* Center: State Badges */}
          <div className="flex items-center gap-2">
            {isReview && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1DB584]/15 border border-[#1DB584]/35 text-[#4FD8A8]">
                <span>✓</span>
                <span>Completed • Review Mode</span>
              </span>
            )}
            {isPreview && !isReview && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 border border-blue-500/35 text-blue-300">
                <span>👁️</span>
                <span>Demo Preview</span>
              </span>
            )}
            {!isReview && !isPreview && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E2B44A]/15 border border-[#E2B44A]/30 text-[#E2B44A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E2B44A] animate-ping" />
                <span>Active Expedition</span>
              </span>
            )}
          </div>

          {/* Right: Gamification & Utilities */}
          <div className="flex items-center gap-3">
            {/* Lives */}
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-red-400 font-bold shadow-xs"
              title="Remaining attempts"
            >
              <span className="tracking-wider">{"♥".repeat(Math.max(0, lives))}</span>
              <span className="text-gray-600 tracking-wider">{"♡".repeat(Math.max(0, 3 - lives))}</span>
            </div>

            {/* Notes button */}
            <button
              onClick={() => setNotesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Open personal lesson notes"
            >
              <span>📝</span>
              <span>Notes</span>
            </button>

            {/* XP Award Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#1DB584]/20 border border-[#1DB584]/40 text-[#1DB584] shadow-xs">
              <span>📖</span>
              <span>+{checkpoint.xp}{checkpoint.masteryXp ? ` (+${checkpoint.masteryXp})` : ""} XP</span>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════
            2. CHECKPOINT TITLE & CONTEXT ROW
            ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] bg-[#A7CE65]/10 px-2 py-0.5 rounded-md border border-[#A7CE65]/20">
                {isCoding ? "Interactive Coding Challenge" : isAnimation ? "Visual Algorithm Lab" : "Core Concept & Theory"}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{moduleTitle}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {content.title}
            </h1>
          </div>

          {/* Quick complete button for review / non-activity lessons in header */}
          {(isReview || isPreview) && (
            <button
              onClick={handleCompleteAction}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isReview ? "Return to Roadmap" : "End Preview"}</span>
              <span>➔</span>
            </button>
          )}
        </div>

        {/* Out of lives warning banner */}
        {outOfLives && !isReview && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>You have used your current attempts. Take a short break or continue in demo mode — Submit still functions for learning.</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. WORKSPACE LAYOUTS (INTENTIONALLY DESIGNED PER CHECKPOINT TYPE)
            — unless a valid CMS custom layout is configured, in which case
            renderCustomLayout() takes over instead of all three branches
            below. Every branch from here down is completely unchanged from
            before the layout subsystem existed.
            ══════════════════════════════════════════════════════════════════ */}

        {hasValidCustomLayout && renderCustomLayout()}

        {!hasValidCustomLayout && (
          <>
        {/* ── TYPE 1: CODING CHECKPOINT (3-COLUMN WORKSTATION) ── */}
        {isCoding && content.codingActivity && (
          <div className="flex-1 flex flex-col justify-between">
            <CodeWorkspace
              activity={content.codingActivity}
              activityId={checkpoint.id}
              theory={content.theory}
              learnMore={content.learnMore}
              runner={runner}
              onFailedSubmit={handleFailedSubmit}
              onSuccessfulSubmit={() => setActivitySatisfied(true)}
            />

            {/* Bottom completion bar for coding */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-xs text-gray-400">
                  {activitySatisfied
                    ? "✓ Coding challenge solved! You can advance to the next trail milestone."
                    : "Submit solution passing all test cases to complete this checkpoint."}
                </span>
                <LessonQuickFeedback checkpointTitle={content.title} />
              </div>
              <button
                onClick={handleCompleteAction}
                disabled={!canComplete}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span>{isReview ? "Return to Roadmap" : isPreview ? "End Preview" : "Complete Checkpoint"}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TYPE 2: ANIMATION / INTERACTIVE VISUAL CHECKPOINT (3-COLUMN) ── */}
        {!isCoding && isAnimation && (
          <div className="flex-1 flex flex-col justify-between min-w-0 w-full max-w-full">
            <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] xl:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.5fr)_minmax(260px,0.85fr)] gap-5 items-start box-border min-w-0">
              {/* Left Column: Theory & Key Ideas */}
              <div className="space-y-4 min-w-0 w-full max-w-full">
                <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-5 shadow-xl min-w-0">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <span className="text-base">💡</span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">
                      Concept Foundations
                    </h3>
                  </div>

                  <div className="space-y-3.5 min-w-0">
                    {content.theory.map((block, i) => (
                      <div key={i} className="rounded-xl bg-black/25 border border-white/5 p-3.5 min-w-0">
                        <h4 className="text-xs font-bold text-[#A7CE65] mb-1">{block.heading}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed break-words">{block.body}</p>
                      </div>
                    ))}
                  </div>

                  {content.learnMore && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => setLearnMoreOpen(v => !v)}
                        className="text-xs font-bold text-[#1DB584] hover:text-[#4FD8A8] transition-colors flex items-center justify-between w-full cursor-pointer"
                      >
                        <span>{learnMoreOpen ? "Hide Details" : "Learn More Details ›"}</span>
                        <span>{learnMoreOpen ? "▲" : "▼"}</span>
                      </button>
                      {learnMoreOpen && (
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed bg-black/30 rounded-xl p-3 border border-white/5 break-words">
                          {content.learnMore}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Worked Code Examples (if present alongside animation) */}
                {content.codeExamples && (
                  <div className="rounded-2xl bg-[#082017]/90 border border-white/10 p-4 shadow-lg min-w-0">
                    <h4 className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
                      <span>💻</span>
                      <span>Implementation Example</span>
                    </h4>
                    <CodeExampleTabs examples={content.codeExamples} />
                  </div>
                )}
              </div>

              {/* Center Column: Dominant Hero Algorithm Animation / Visual */}
              <div className="space-y-4 min-w-0 w-full max-w-full">
                <div className="rounded-2xl bg-[#04100C] border border-[#1DB584]/35 shadow-2xl overflow-hidden p-1 min-w-0 w-full max-w-full box-border">
                  {content.animation && (
                    <AlgorithmAnimation animation={content.animation} />
                  )}
                  {content.visual && (
                    <BinaryTreeDiagram visual={content.visual} />
                  )}
                  {content.callStackVisual && (
                    <CallStackVisual frames={content.callStackVisual.frames} />
                  )}
                  {content.twoPointerVisual && (
                    <TwoPointerVisual values={content.twoPointerVisual.values} mode={content.twoPointerVisual.mode} />
                  )}
                </div>
              </div>

              {/* Right Column: Quick Check, State & Takeaway */}
              <div className="space-y-4 min-w-0 w-full max-w-full lg:col-span-2 xl:col-span-1">
                {content.quickCheck ? (
                  <div className="min-w-0">
                    <QuickCheckCard quickCheck={content.quickCheck} onAnswered={handleQuickCheckAnswered} />
                    <button
                      onClick={() => setActivitySatisfied(true)}
                      className="mt-2.5 text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2 block text-center w-full cursor-pointer"
                    >
                      Mark quick check reviewed and continue
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-5 shadow-xl min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <span className="text-base">🧭</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Expedition Progress
                      </h4>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed mb-4 break-words">
                      Interact with the visual step controls to observe state transformations. Once you understand the algorithm flow, advance to the next checkpoint.
                    </p>
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-emerald-300/90 font-mono">
                      <span>✓ State synchronization active</span>
                    </div>
                  </div>
                )}

                {/* Completion Action Card */}
                <div className="rounded-2xl bg-[#082017]/95 border border-white/10 p-5 shadow-lg min-w-0">
                  <h4 className="text-xs font-bold text-gray-300 mb-2">Ready to Advance?</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 break-words">
                    {isReview
                      ? "You've reviewed this checkpoint. Return to the roadmap whenever you're ready."
                      : "Complete this checkpoint to record your progress and unlock the next trail step."}
                  </p>
                  <button
                    onClick={handleCompleteAction}
                    disabled={!canComplete}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>{isReview ? "Return to Roadmap" : isPreview ? "End Preview" : "Complete Checkpoint"}</span>
                    <span>➔</span>
                  </button>

                  <div className="mt-4 pt-3.5 border-t border-white/10">
                    <LessonQuickFeedback checkpointTitle={content.title} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TYPE 3: CONCEPT / READING CHECKPOINT (BALANCED MULTI-COLUMN) ── */}
        {isConceptOnly && (
          <div className="flex-1 flex flex-col justify-between min-w-0 w-full max-w-full">
            <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 items-start box-border min-w-0">
              {/* Left Column: Comprehensive Concept & Theory */}
              <div className="space-y-4 min-w-0 w-full max-w-full">
                <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-6 shadow-xl min-w-0">
                  <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-white/10">
                    <span className="text-lg">📚</span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">
                      Foundational Theory &amp; Insights
                    </h3>
                  </div>

                  <div className="space-y-4 min-w-0">
                    {content.theory.map((block, i) => (
                      <div key={i} className="rounded-xl bg-black/25 border border-white/5 p-4 min-w-0">
                        <h4 className="text-sm font-bold text-[#A7CE65] mb-1.5">{block.heading}</h4>
                        <p className="text-sm text-gray-200 leading-relaxed break-words">{block.body}</p>
                      </div>
                    ))}
                  </div>

                  {content.learnMore && (
                    <div className="mt-5 pt-3.5 border-t border-white/10">
                      <button
                        onClick={() => setLearnMoreOpen(v => !v)}
                        className="text-xs font-bold text-[#1DB584] hover:text-[#4FD8A8] transition-colors flex items-center justify-between w-full cursor-pointer"
                      >
                        <span>{learnMoreOpen ? "Hide In-Depth Analysis" : "Learn More Details ›"}</span>
                        <span>{learnMoreOpen ? "▲" : "▼"}</span>
                      </button>
                      {learnMoreOpen && (
                        <p className="mt-2.5 text-xs text-gray-400 leading-relaxed bg-black/30 rounded-xl p-3.5 border border-white/5 break-words">
                          {content.learnMore}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Code Examples, Quick Check & Progression */}
              <div className="space-y-5 min-w-0 w-full max-w-full">
                {/* Worked Code Examples */}
                {content.codeExamples && (
                  <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-white/10 p-5 shadow-xl min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <span className="text-base">💻</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Code Reference Implementation
                      </h4>
                    </div>
                    <CodeExampleTabs examples={content.codeExamples} />
                  </div>
                )}

                {/* Quick Check MCQ Card */}
                {content.quickCheck && (
                  <div className="min-w-0">
                    <QuickCheckCard quickCheck={content.quickCheck} onAnswered={handleQuickCheckAnswered} />
                    <button
                      onClick={() => setActivitySatisfied(true)}
                      className="mt-2.5 text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2 block text-center w-full cursor-pointer"
                    >
                      Mark quick check reviewed and continue
                    </button>
                  </div>
                )}

                {/* Completion Action Card */}
                <div className="rounded-2xl bg-[#082017]/95 border border-[#1DB584]/25 p-5 shadow-xl flex flex-col gap-4 min-w-0">
                  <div className="flex items-center justify-between gap-4 flex-wrap min-w-0">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white mb-0.5">Checkpoint Status</h4>
                      <p className="text-[11px] text-gray-400">
                        {isReview
                          ? "Review complete. Return to roadmap anytime."
                          : canComplete
                            ? "Ready to record progress!"
                            : "Review concepts or answer quick check to unlock."}
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteAction}
                      disabled={!canComplete}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
                    >
                      <span>{isReview ? "Return to Roadmap" : isPreview ? "End Preview" : "Complete Checkpoint"}</span>
                      <span>➔</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <LessonQuickFeedback checkpointTitle={content.title} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
          </>
        )}

      </div>

      {/* ── NOTES SLIDE-IN MODAL ── */}
      {notesOpen && (
        <NotesPanel
          repository={notesRepository}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={checkpoint.id}
          onClose={() => setNotesOpen(false)}
        />
      )}

      {/* ── CELEBRATION MODAL ── */}
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
