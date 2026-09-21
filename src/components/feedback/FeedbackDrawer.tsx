import { useState, useEffect, useRef, useMemo } from "react"
import { useFeedback } from "../../feedback/FeedbackContext"
import type { FeedbackCategory, FeedbackSentiment } from "../../feedback/types"

interface CategoryOption {
  id: FeedbackCategory
  label: string
  icon: string
}

const CONCEPT_CATEGORIES: CategoryOption[] = [
  { id: "content", label: "Content", icon: "📖" },
  { id: "confusing", label: "Confusing", icon: "🧭" },
  { id: "ui", label: "UI / Design", icon: "🎨" },
  { id: "bug", label: "Bug / Issue", icon: "🪲" },
  { id: "suggestion", label: "Suggestion", icon: "💡" },
  { id: "other", label: "Other", icon: "🌲" },
]

const CODING_CATEGORIES: CategoryOption[] = [
  { id: "problem-statement", label: "Problem Statement", icon: "📝" },
  { id: "compiler-run", label: "Compiler / Run", icon: "⚙️" },
  { id: "ui", label: "UI / Design", icon: "🎨" },
  { id: "bug", label: "Bug / Issue", icon: "🪲" },
  { id: "confusing", label: "Confusing", icon: "🧭" },
  { id: "suggestion", label: "Suggestion", icon: "💡" },
  { id: "other", label: "Other", icon: "🌲" },
]

const WORLD_CATEGORIES: CategoryOption[] = [
  { id: "navigation", label: "Navigation", icon: "🗺️" },
  { id: "progress", label: "Progress", icon: "⭐" },
  { id: "ui", label: "UI / Design", icon: "🎨" },
  { id: "bug", label: "Bug / Issue", icon: "🪲" },
  { id: "suggestion", label: "Suggestion", icon: "💡" },
  { id: "other", label: "Other", icon: "🌲" },
]

interface RatingOption {
  value: FeedbackSentiment
  label: string
  icon: string
}

const RATINGS: RatingOption[] = [
  { value: 1, label: "Needs Work", icon: "🌧️" },
  { value: 2, label: "Okay", icon: "⛅" },
  { value: 3, label: "Helpful", icon: "🌲" },
  { value: 4, label: "Trail Blazing!", icon: "🏔️" },
]

export default function FeedbackDrawer() {
  const {
    isOpen,
    context,
    prefilledRating,
    isSubmitting,
    lastSubmittedId,
    closeFeedback,
    submitFeedback,
  } = useFeedback()

  // Dynamically adapt categories to the active learning screen
  const categories = useMemo<CategoryOption[]>(() => {
    if (context.screenType === "coding-challenge") {
      return CODING_CATEGORIES
    }
    if (
      context.screenType === "dsa-world" ||
      context.screenType === "module-roadmap" ||
      context.screenType === "course-library"
    ) {
      return WORLD_CATEGORIES
    }
    return CONCEPT_CATEGORIES
  }, [context.screenType])

  const [rating, setRating] = useState<FeedbackSentiment | null>(null)
  const [category, setCategory] = useState<FeedbackCategory>("suggestion")
  const [message, setMessage] = useState("")
  const [includeContext, setIncludeContext] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Sync category validity when categories change
  useEffect(() => {
    if (!categories.some(c => c.id === category)) {
      setCategory(categories[0]?.id ?? "suggestion")
    }
  }, [categories, category])

  // Sync prefilled rating when opened via secondary affordance
  useEffect(() => {
    if (isOpen) {
      if (prefilledRating !== null) {
        setRating(prefilledRating)
      } else {
        setRating(null)
      }
      setCategory(categories[0]?.id ?? "suggestion")
      setMessage("")
      setErrorMessage(null)
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    }
  }, [isOpen, prefilledRating, categories])

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        closeFeedback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeFeedback])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const res = await submitFeedback(category, message, rating ?? undefined, includeContext)
    if (!res.success) {
      setErrorMessage(res.error ?? "Failed to save feedback. Please try again.")
    }
  }

  const isSuccess = Boolean(lastSubmittedId)

  const screenIcon =
    context.screenType === "coding-challenge"
      ? "💻"
      : context.screenType === "algorithm-animation"
        ? "🎬"
        : context.screenType === "quick-check"
          ? "✍️"
          : context.screenType === "module-roadmap"
            ? "🗺️"
            : context.screenType === "course-library"
              ? "📚"
              : "⛰️"

  const displayContextType =
    context.activityTitle ||
    (context.screenType === "coding-challenge"
      ? "Coding Checkpoint"
      : context.screenType === "algorithm-animation"
        ? "Algorithm Animation"
        : context.screenType === "quick-check"
          ? "Quick Check"
          : context.screenType === "module-roadmap"
            ? "Module Roadmap"
            : context.screenType === "course-library"
              ? "Course Library"
              : context.screenType === "dsa-world"
                ? "DSA World"
                : "Topic Lesson")

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Subtle backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeFeedback}
        aria-hidden="true"
      />

      {/* ── MOUNTAINOUS / ALPINE FEEDBACK DRAWER ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-drawer-title"
        aria-label={`Feedback for ${context.title}`}
        className="relative z-10 w-full sm:w-[460px] h-full bg-[#082017] border-l border-[#1DB584]/30 shadow-2xl flex flex-col justify-between text-white font-display overflow-hidden select-text animate-in slide-in-from-right duration-200"
      >
        {/* ── TOP SCENIC MOUNTAIN SILHOUETTE HEADER ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0B2E21] to-[#082017] border-b border-white/10 px-6 pt-6 pb-5 flex-shrink-0">
          {/* Subtle mountain range vector */}
          <svg
            className="absolute top-0 right-0 w-full h-24 opacity-25 text-[#1DB584] pointer-events-none"
            viewBox="0 0 460 96"
            fill="currentColor"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0,60 L60,20 L130,55 L210,12 L300,50 L380,18 L460,55 L460,0 L0,0 Z" />
            <path
              d="M0,75 L80,38 L160,70 L250,28 L350,65 L460,35 L460,0 L0,0 Z"
              className="text-[#061A13] opacity-60"
            />
          </svg>

          {/* Warm firelight corner glow */}
          <div
            className="absolute top-0 right-10 w-40 h-40 rounded-full opacity-25 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(226, 180, 74, 0.4) 0%, transparent 70%)",
              filter: "blur(25px)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E2B44A] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">
                  Trail Journal
                </span>
              </div>
              <h2 id="feedback-drawer-title" className="text-xl font-black text-white tracking-tight">
                Share Feedback
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                Help us improve this part of your learning trail.
              </p>
            </div>

            <button
              ref={closeButtonRef}
              onClick={closeFeedback}
              aria-label="Close feedback drawer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── DRAWER BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
          {/* ══ CASE 1: SUCCESS STATE ══ */}
          {isSuccess ? (
            <div className="py-8 px-4 text-center space-y-5 animate-fade-up">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1DB584]/20 to-[#10B981]/10 border border-[#1DB584]/40 text-4xl mx-auto shadow-[0_0_30px_rgba(29,181,132,0.25)]">
                <span>🏔️</span>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1DB584] text-white text-xs font-black flex items-center justify-center border-2 border-[#082017]">
                  ✓
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white mb-1.5">Feedback Received!</h3>
                <p className="text-xs text-emerald-200/90 leading-relaxed max-w-sm mx-auto">
                  Thank you for helping us carve a clearer path. Your notes have been recorded in the Trail Journal.
                </p>
              </div>

              {/* Context confirmation pill */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-[#1DB584]/25 text-left text-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65] block">
                  Logged for {displayContextType}
                </span>
                <p className="text-white font-bold">{context.title}</p>
                {context.subtitle && <p className="text-[11px] text-gray-400">{context.subtitle}</p>}
                {context.breadcrumb && context.breadcrumb.length > 1 && (
                  <p className="text-[10px] text-emerald-400/80 font-mono pt-1 border-t border-white/5">
                    {context.breadcrumb.join(" › ")}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={closeFeedback}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 transition-all cursor-pointer"
                >
                  Return to Trail
                </button>
              </div>
            </div>
          ) : (
            /* ══ CASE 2: FEEDBACK FORM ══ */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. CANONICAL SCREEN / TOPIC CONTEXT CARD */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-[#1DB584]/30 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1DB584] animate-pulse shrink-0" />
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#A7CE65] truncate">
                      Feedback on {displayContextType}
                    </span>
                  </div>
                  {context.courseTitle && (
                    <span className="text-[9.5px] font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 shrink-0">
                      {context.courseTitle}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#1DB584]/15 border border-[#1DB584]/30 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {screenIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    {context.moduleTitle && context.screenType !== "module-roadmap" && (
                      <p className="text-[11px] font-semibold text-emerald-300/90 truncate">
                        {context.moduleTitle}
                      </p>
                    )}
                    <h4 className="text-xs sm:text-sm font-black text-white break-words leading-snug">
                      {context.title}
                    </h4>
                    {context.problemTitle && (
                      <p className="text-[10.5px] font-mono text-amber-300/90 mt-0.5 truncate">
                        Function: {context.problemTitle}()
                      </p>
                    )}
                    {context.breadcrumb && context.breadcrumb.length > 1 && (
                      <p className="text-[10px] text-gray-400 truncate mt-1 flex items-center gap-1 font-mono">
                        <span className="text-[#A7CE65]/70">Trail:</span>
                        <span className="text-gray-300">{context.breadcrumb.slice(1).join(" › ")}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. QUICK SENTIMENT / RATING */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-300 mb-2.5">
                  How is this part of the trail?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {RATINGS.map(r => {
                    const isSelected = rating === r.value
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRating(r.value)}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584] ${
                          isSelected
                            ? "bg-[#1DB584]/25 border-[#1DB584] text-white shadow-[0_0_12px_rgba(29,181,132,0.3)] scale-[1.03]"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-xl mb-1">{r.icon}</span>
                        <span className="text-[10px] font-bold leading-tight">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. CATEGORY SELECTION */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-300 mb-2.5">
                  What is this about?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584] ${
                          isSelected
                            ? "bg-[#1DB584]/25 border-[#1DB584] text-white shadow-xs"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                        {isSelected && <span className="ml-auto text-[10px] text-[#1DB584]">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. MESSAGE TEXTAREA */}
              <div>
                <label htmlFor="feedback-message" className="block text-xs font-black uppercase tracking-wider text-gray-300 mb-1.5">
                  Tell us more <span className="text-gray-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="What worked well? What could be clearer? Any technical hiccups or suggestions?"
                  className="w-full bg-[#030E0A] text-emerald-200 placeholder-gray-500 text-xs rounded-xl border border-white/10 focus:border-[#1DB584]/60 focus:ring-1 focus:ring-[#1DB584]/60 p-3 outline-none resize-none leading-relaxed transition-all"
                />
              </div>

              {/* 5. INCLUDE CONTEXT CHECKBOX */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-400 hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={e => setIncludeContext(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black/40 text-[#1DB584] focus:ring-[#1DB584] focus:ring-offset-0 cursor-pointer"
                />
                <span>Include current trail checkpoint and device diagnostics</span>
              </label>

              {/* ERROR BANNER IF ANY */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200">
                  <span className="font-bold">⚠️ Error: </span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 6. ACTION BUTTONS */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Logging to Journal...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Feedback</span>
                      <span>➔</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="px-4 py-3 rounded-xl font-bold text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── BOTTOM TERRAIN / TOPOGRAPHIC FOOTER ACCENT ── */}
        <div className="relative py-3 px-6 bg-[#04100C] border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between pointer-events-none select-none">
          <span className="flex items-center gap-1.5 font-mono">
            <span>🌲</span>
            <span>Reagvis Trails Diagnostic Journal</span>
          </span>
          <span className="text-emerald-400/60 font-mono">v2.4</span>
        </div>
      </div>
    </div>
  )
}
