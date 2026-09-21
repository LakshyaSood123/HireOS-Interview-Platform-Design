import { useState, useEffect, useRef } from "react"
import { useTrailGuide } from "../../assistant/TrailGuideContext"

export default function TrailGuideDrawer() {
  const {
    isOpen,
    closeGuide,
    context,
    messages,
    isThinking,
    error,
    suggestedQuestions,
    includeLearnerCode,
    setIncludeLearnerCode,
    sendMessage,
    clearConversation,
  } = useTrailGuide()

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Scroll to bottom when messages or thinking state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isThinking, isOpen])

  // Focus management and Escape key handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        closeGuide()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    setTimeout(() => textareaRef.current?.focus(), 50)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeGuide])

  if (!isOpen) return null

  // ── CMS (CREATOR STUDIO) LIMITED-SUPPORT STATE ──
  // Trail Guide's curriculum knowledge (topicKnowledgeBuilder/topicOverrides)
  // is grounded entirely in the static DSA course registry. Rather than
  // silently produce a generic/ungrounded answer for a Creator
  // Studio-authored lesson it has no real knowledge of, show this explicit,
  // honest state instead — never invents facts about arbitrary CMS content.
  if (context.source === "cms") {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={closeGuide} aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trail-guide-title"
          className="relative z-10 w-full sm:w-[460px] h-full bg-[#082017] border-l border-[#1DB584]/30 shadow-2xl flex flex-col text-white font-display overflow-hidden animate-in slide-in-from-right duration-200"
        >
          <div className="relative overflow-hidden bg-gradient-to-b from-[#0B2E21] to-[#082017] border-b border-white/10 px-5 pt-5 pb-4 flex-shrink-0 flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65] block mb-1">Alpine Learning Companion</span>
              <h2 id="trail-guide-title" className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🧭</span>
                <span>Trail Guide</span>
              </h2>
              {context.moduleTitle && <p className="mt-1 text-xs text-gray-300 truncate">{context.moduleTitle}</p>}
            </div>
            <button
              ref={closeButtonRef}
              onClick={closeGuide}
              aria-label="Close Trail Guide"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="p-4 rounded-2xl bg-black/35 border border-amber-400/25">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🏗️</span>
                <h3 className="text-xs font-black text-white">Limited support for this course</h3>
              </div>
              <p className="text-[12px] text-gray-300 leading-relaxed">
                Trail Guide's curriculum knowledge is built for the Data Structures &amp; Algorithms course today. Creator
                Studio-authored courses like this one aren't connected to that knowledge base yet, so Trail Guide can't
                answer questions about this lesson's specific content.
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-3">
                For real DSA checkpoints, open Trail Guide from any lesson, animation, quick check, or coding challenge for
                full contextual help.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    if (!input.trim() || isThinking) return
    const text = input
    setInput("")
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isCodingCheckpoint =
    context.activityType === "coding-challenge" ||
    Boolean(context.checkpointId?.includes("code-lab")) ||
    Boolean(context.checkpointId?.includes("-4"))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Subtle backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeGuide}
        aria-hidden="true"
      />

      {/* ── ALPINE / MOUNTAIN TRAIL GUIDE DRAWER ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trail-guide-title"
        className="relative z-10 w-full sm:w-[460px] h-full bg-[#082017] border-l border-[#1DB584]/30 shadow-2xl flex flex-col justify-between text-white font-display overflow-hidden select-text animate-in slide-in-from-right duration-200"
      >
        {/* ── TOP HEADER (MOUNTAIN RIDGE & AMBER GLOW) ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0B2E21] to-[#082017] border-b border-white/10 px-5 pt-5 pb-4 flex-shrink-0">
          {/* Mountain silhouette vector */}
          <svg
            className="absolute top-0 right-0 w-full h-20 opacity-20 text-[#1DB584] pointer-events-none"
            viewBox="0 0 460 80"
            fill="currentColor"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0,50 L60,15 L140,45 L220,10 L310,40 L390,15 L460,45 L460,0 L0,0 Z" />
            <path
              d="M0,65 L70,30 L160,60 L240,25 L340,55 L460,30 L460,0 L0,0 Z"
              className="text-[#051710] opacity-70"
            />
          </svg>

          {/* Warm campfire / lantern glow */}
          <div
            className="absolute top-0 right-12 w-36 h-36 rounded-full opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(226, 180, 74, 0.45) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E2B44A] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">
                  Alpine Learning Companion
                </span>
              </div>
              <h2 id="trail-guide-title" className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🧭</span>
                <span>Trail Guide</span>
              </h2>

              {/* Context Breadcrumb */}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-300 truncate">
                {context.moduleTitle && (
                  <span className="font-semibold text-emerald-300/90 truncate">{context.moduleTitle}</span>
                )}
                {context.checkpointTitle && (
                  <>
                    <span className="text-gray-500">›</span>
                    <span className="text-gray-300 truncate">{context.checkpointTitle}</span>
                  </>
                )}
                {isCodingCheckpoint && context.problemTitle && (
                  <>
                    <span className="text-gray-500">›</span>
                    <span className="text-[#4FD8A8] font-mono truncate">{context.problemTitle}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
                  title="Clear conversation for this topic"
                >
                  Clear
                </button>
              )}
              <button
                ref={closeButtonRef}
                onClick={closeGuide}
                aria-label="Close Trail Guide"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ── CONVERSATION AREA ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {/* ══ CASE 1: EMPTY STATE WITH CONTEXTUAL SUGGESTIONS ══ */}
          {messages.length === 0 && (
            <div className="py-4 space-y-4 animate-fade-up">
              <div className="p-4 rounded-2xl bg-black/35 border border-[#1DB584]/25 shadow-inner">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xl">🏕️</span>
                  <div>
                    <h3 className="text-xs font-black text-white">Stuck on this part of the trail?</h3>
                    <p className="text-[11px] text-gray-400">Ask your guide for hints, explanations, or concepts.</p>
                  </div>
                </div>

                {/* Dynamic Runtime indicators */}
                {context.animationStep !== undefined && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#A7CE65]">
                    <span>🎬 Animation Step: {context.animationStep}</span>
                    {context.animationOperation && <span>• {context.animationOperation}</span>}
                  </div>
                )}
                {context.language && isCodingCheckpoint && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#4FD8A8]">
                    <span>💻 Editor Language: {context.language.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 block mb-2.5">
                  Suggested Questions
                </span>
                <div className="space-y-2">
                  {suggestedQuestions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => sendMessage(q.label, q.intent)}
                      className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-[#1DB584]/15 border border-white/10 hover:border-[#1DB584]/40 text-xs font-semibold text-gray-200 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <span className="truncate">{q.label}</span>
                      <span className="text-[#1DB584] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        ➔
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ CASE 2: ACTIVE CONVERSATION ══ */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-fade-up`}
            >
              {msg.role === "user" ? (
                <div className="bg-[#0D3827] border border-[#1DB584]/30 text-white text-xs rounded-2xl rounded-tr-xs px-4 py-3 max-w-[88%] shadow-md leading-relaxed break-words">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-2 max-w-[95%]">
                  <div className="bg-[#092218] border border-[#1DB584]/35 text-gray-100 text-xs rounded-2xl rounded-tl-xs p-4 shadow-lg leading-relaxed break-words">
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/10 text-[10.5px] font-bold text-[#A7CE65]">
                      <span>🧭</span>
                      <span>Trail Guide</span>
                    </div>

                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>

                  {/* Follow-up suggestion pills */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map(fu => (
                        <button
                          key={fu.id}
                          onClick={() => sendMessage(fu.label, fu.intent)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#1DB584]/20 border border-white/10 hover:border-[#1DB584]/40 text-[11px] font-bold text-emerald-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>{fu.label}</span>
                          <span className="text-[10px]">➔</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* ══ THINKING INDICATOR ══ */}
          {isThinking && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#092218] border border-[#1DB584]/30 max-w-[85%] text-xs text-gray-300 animate-fade-in">
              <span className="text-base animate-spin">🧭</span>
              <span className="font-semibold text-emerald-300/90">Trail Guide is consulting the trail map...</span>
            </div>
          )}

          {/* ══ ERROR BANNER ══ */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  const lastUser = [...messages].reverse().find(m => m.role === "user")
                  if (lastUser) sendMessage(lastUser.content)
                }}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-bold text-[11px] cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── BOTTOM COMPOSER ── */}
        <div className="p-4 bg-[#04100C] border-t border-white/10 flex-shrink-0 space-y-2.5">
          {/* Optional Code Inclusion Toggle for Coding Checkpoints */}
          {isCodingCheckpoint && (
            <div className="flex items-center justify-between px-1 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-gray-200">
                <input
                  type="checkbox"
                  checked={includeLearnerCode}
                  onChange={e => setIncludeLearnerCode(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#1DB584] focus:ring-[#1DB584] focus:ring-offset-0 cursor-pointer"
                />
                <span>Include my current editor code in question</span>
              </label>
              {includeLearnerCode && (
                <span className="text-emerald-400 font-bold font-mono text-[10px]">Active</span>
              )}
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-[#082017] rounded-xl border border-white/10 focus-within:border-[#1DB584]/60 p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask a question about this topic... (Enter to send)"
              aria-label="Ask Trail Guide a question"
              className="w-full bg-transparent text-emerald-100 placeholder-gray-500 text-xs outline-none resize-none p-1 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              aria-label="Send question"
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-[#1DB584]/30"
            >
              <span>➔</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 px-1 font-mono">
            <span>Shift+Enter for new line</span>
            <span>Reagvis Trails Guide</span>
          </div>
        </div>
      </div>
    </div>
  )
}
