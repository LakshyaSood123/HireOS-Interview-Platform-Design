import { useState, useEffect, useMemo } from "react"
import OwlAvatar from "../components/OwlAvatar"
import CodeEditor from "../components/CodeEditor"
import LanguageToggle from "../components/LanguageToggle"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { questions, type QuestionCategory } from "../data/questions"
import { findCompany } from "../data/companies"
import { demoInterviewQuestions, demoInterviewSession } from "../data/placementPrepDemo"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

type OwlState = "idle" | "listening" | "thinking" | "celebrating"

const categoryKey: Record<string, string> = {
  behavioral: "interview.categoryBehavioral",
  technical: "interview.categoryTechnical",
  coding: "interview.categoryCoding",
  situational: "interview.categorySituational",
  culture: "interview.categoryCulture",
}

// Slow, watchable timing for the auto-fill demo sequence (~9s per question).
const QUESTION_READ_MS = 1200 // question is on screen before the popup appears
const POPUP_WAIT_MS = 2000 // popup visible, "processing" pause before the reveal starts
const WORD_INTERVAL_MS = 70 // delay between words for text/video answers
const LINE_INTERVAL_MS = 150 // delay between lines for code answers
const VIEW_MS = 2000 // pause after the answer finishes revealing, before advancing
const CELEBRATE_MS = 700 // brief celebration beat before moving to the next question

export default function InterviewPage({ onNavigate }: Props) {
  const { t, lang } = useLanguage()
  const { companyId, setInterviewSession } = useAppState()
  const company = findCompany(companyId)

  // Auto-fill uses its own short 4-question script; manual mode uses the full question bank.
  const [autoFillMode, setAutoFillMode] = useState(false)
  const [showAutoFillConfirm, setShowAutoFillConfirm] = useState(false)
  const [autoFillPopupVisible, setAutoFillPopupVisible] = useState(false)
  const [autoFillTranscript, setAutoFillTranscript] = useState("")

  const activeQuestions = useMemo(
    () =>
      autoFillMode
        ? demoInterviewQuestions.map(dq => ({
            id: dq.id,
            type: dq.type,
            category: dq.category as QuestionCategory,
            text: { en: dq.text, hi: dq.text },
            duration: dq.duration,
            starterCode: dq.starterCode,
            codeLanguage: dq.type === "code" ? "javascript" : undefined,
          }))
        : questions,
    [autoFillMode],
  )

  const [currentQ, setCurrentQ] = useState(0)
  const q = activeQuestions[currentQ]

  const [timeLeft, setTimeLeft] = useState(q.duration)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [owlState, setOwlState] = useState<OwlState>("idle")
  const [answered, setAnswered] = useState<number[]>([])
  const [textAnswer, setTextAnswer] = useState("")
  const [codeAnswer, setCodeAnswer] = useState(q.starterCode ?? "")

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Question countdown (auto-fill drives its own advance timing instead)
  useEffect(() => {
    if (!isRecording || autoFillMode) return
    if (timeLeft <= 0) {
      handleNext()
      return
    }
    const timer = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeLeft, autoFillMode])

  // Auto-fill scripted sequence — slow and watchable (~9s/question):
  // question reads → popup appears → wait → word/line-by-word reveal → popup hides → view pause → advance.
  useEffect(() => {
    if (!autoFillMode) return
    const demoQ = demoInterviewQuestions[currentQ]
    if (!demoQ) return

    setAutoFillPopupVisible(false)
    setAutoFillTranscript("")
    setOwlState("idle")

    const timers: ReturnType<typeof setTimeout>[] = []

    const showPopupTimer = setTimeout(() => {
      setIsRecording(true)
      setAutoFillPopupVisible(true)
      setOwlState("listening")

      const startRevealTimer = setTimeout(() => {
        const isCode = demoQ.type === "code"
        const tokens = isCode ? demoQ.demoAnswer.split("\n") : demoQ.demoAnswer.split(" ")
        const interval = isCode ? LINE_INTERVAL_MS : WORD_INTERVAL_MS
        const joiner = isCode ? "\n" : " "

        const revealStep = (i: number) => {
          const partial = tokens.slice(0, i).join(joiner)
          if (demoQ.type === "text") setTextAnswer(partial)
          else if (demoQ.type === "code") setCodeAnswer(partial)
          else setAutoFillTranscript(partial)

          if (i < tokens.length) {
            timers.push(setTimeout(() => revealStep(i + 1), interval))
          } else {
            setAutoFillPopupVisible(false)
            setOwlState("thinking")
            timers.push(setTimeout(() => {
              setAnswered(a => [...a, currentQ])
              setOwlState("celebrating")
              timers.push(setTimeout(() => {
                if (currentQ < demoInterviewQuestions.length - 1) {
                  const nextIndex = currentQ + 1
                  setCurrentQ(nextIndex)
                  resetForQuestion(activeQuestions[nextIndex])
                } else {
                  setInterviewSession(demoInterviewSession)
                  onNavigate("placement-flow")
                }
              }, CELEBRATE_MS))
            }, VIEW_MS))
          }
        }
        revealStep(1)
      }, POPUP_WAIT_MS)
      timers.push(startRevealTimer)
    }, QUESTION_READ_MS)
    timers.push(showPopupTimer)

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillMode, currentQ])

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  const resetForQuestion = (nextQ: typeof q) => {
    setIsRecording(false)
    setTimeLeft(nextQ.duration)
    setOwlState("idle")
    setTextAnswer("")
    setCodeAnswer(nextQ.starterCode ?? "")
  }

  const handleStart = () => {
    setIsRecording(true)
    setOwlState("listening")
  }

  const handleNext = () => {
    setAnswered(a => [...a, currentQ])
    setOwlState("thinking")
    setTimeout(() => {
      if (currentQ < activeQuestions.length - 1) {
        const nextIndex = currentQ + 1
        setCurrentQ(nextIndex)
        resetForQuestion(activeQuestions[nextIndex])
      } else {
        onNavigate("results")
      }
    }, 1200)
  }

  const handleSkip = () => {
    if (currentQ < activeQuestions.length - 1) {
      const nextIndex = currentQ + 1
      setCurrentQ(nextIndex)
      resetForQuestion(activeQuestions[nextIndex])
    }
  }

  const handleRepeat = () => resetForQuestion(q)

  const startAutoFill = () => {
    setShowAutoFillConfirm(false)
    setAnswered([])
    setAutoFillMode(true)
    setCurrentQ(0)
    resetForQuestion({
      id: demoInterviewQuestions[0].id,
      type: demoInterviewQuestions[0].type,
      category: demoInterviewQuestions[0].category as QuestionCategory,
      text: { en: demoInterviewQuestions[0].text, hi: demoInterviewQuestions[0].text },
      duration: demoInterviewQuestions[0].duration,
      starterCode: demoInterviewQuestions[0].starterCode,
      codeLanguage: demoInterviewQuestions[0].type === "code" ? "javascript" : undefined,
    })
  }

  const stopAutoFill = () => {
    setAutoFillMode(false)
    setAutoFillPopupVisible(false)
    setAutoFillTranscript("")
    setAnswered([])
    setCurrentQ(0)
    resetForQuestion(questions[0])
  }

  const progress = (answered.length / activeQuestions.length) * 100
  const timeColor = timeLeft > q.duration * 0.4 ? "text-brand" : timeLeft > q.duration * 0.15 ? "text-amber-500" : "text-red-500"

  const startLabel = q.type === "code" ? t("interview.startCoding") : q.type === "text" ? t("interview.startTyping") : t("interview.startSpeaking")
  const idleHint = q.type === "code" ? t("interview.hintIdleCode") : q.type === "text" ? t("interview.hintIdleText") : t("interview.hintIdleVideo")

  return (
    <div className="min-h-screen bg-[#071A14] font-display flex flex-col relative overflow-hidden text-white">
      <ForestBackdrop intensity="deep" />

      {/* ── TOP BAR ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0 bg-[#071A14]/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate("landing")} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p className="text-white font-bold text-sm">{company ? `${company.role[lang]} — ${company.name}` : "HireOS"}</p>
            <p className="text-gray-400 text-xs">Initial AI Screening</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <LanguageToggle variant="dark" />
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-500 font-medium">{t("interview.sessionTime")}</p>
            <p className="text-white font-mono font-bold">{fmtTime(elapsed)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">{t("interview.progress")}</p>
            <p className="text-white font-mono font-bold">{currentQ + 1}<span className="text-gray-400">/{activeQuestions.length}</span></p>
          </div>
          {!autoFillMode && (
            <button
              onClick={() => setShowAutoFillConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors hidden sm:flex"
            >
              {t("placementFlow.autoFillDemo")}
            </button>
          )}
          <button
            onClick={() => onNavigate("placement-flow")}
            className="text-xs font-semibold text-amethyst hover:text-purple-300 border border-amethyst/30 hover:border-amethyst/50 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
          >
            🚀 Placement Prep
          </button>
          <button
            onClick={() => onNavigate("results")}
            className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {t("interview.end")}
          </button>
        </div>
      </header>

      {/* ── AUTO-FILL CONFIRMATION MODAL ── */}
      {showAutoFillConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-fade-up">
            <h3 className="text-white font-bold text-lg mb-2">{t("placementFlow.autoFillDemo")}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{t("placementFlow.autoFillConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAutoFillConfirm(false)}
                className="flex-1 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                {t("placementFlow.autoFillCancel")}
              </button>
              <button
                onClick={startAutoFill}
                className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                {t("placementFlow.autoFillStart")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MEDIA + QUESTION (full-width) ── */}
        <div className="flex-1 flex flex-col overflow-y-auto max-w-4xl mx-auto w-full">

          {/* Media area — camera for video questions, owl-topped panel otherwise */}
          {q.type === "video" ? (
            <div className="relative bg-gray-900 flex-shrink-0" style={{ aspectRatio: "16/9", maxHeight: "480px" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-700/50 border-2 border-gray-600 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-10 h-10 text-gray-500">
                      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">{t("interview.cameraPreview")}</p>
                </div>
              </div>

              <div className="absolute top-4 right-4 z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand/20 rounded-full blur-2xl" />
                  <OwlAvatar size={200} state={owlState} className="relative drop-shadow-2xl" />
                  {autoFillMode && (
                    <div
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap bg-navy/95 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl transition-opacity duration-300 ${
                        autoFillPopupVisible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {t("placementFlow.startSpeaking")}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                {isRecording ? (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-record" />
                    <span className="text-white text-xs font-semibold">{t("interview.recording")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-300 text-xs">{t("interview.ready")}</span>
                  </div>
                )}
              </div>

              {isRecording && (
                <div className="absolute bottom-4 right-4 z-10">
                  <div className={`bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 font-mono font-bold text-2xl ${timeColor}`}>
                    {fmtTime(timeLeft)}
                  </div>
                </div>
              )}

              {autoFillMode && isRecording && (
                <div className="absolute bottom-6 left-4 right-4 z-10 bg-black/75 backdrop-blur-sm rounded-xl p-4 transition-opacity duration-300">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand mb-1">Live Transcript</p>
                  <p className="text-white text-sm leading-relaxed line-clamp-4 min-h-[1.5em]">
                    {autoFillTranscript}
                  </p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                <div
                  className="h-full bg-brand transition-all duration-500"
                  style={{ width: `${isRecording ? ((q.duration - timeLeft) / q.duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="relative bg-gray-900 flex-shrink-0 p-6 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-record" />
                      <span className="text-white text-xs font-semibold">{t("interview.recording")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-300 text-xs">{t("interview.ready")}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isRecording && (
                    <span className={`font-mono font-bold text-lg ${timeColor}`}>{fmtTime(timeLeft)}</span>
                  )}
                  <div className="relative">
                    <OwlAvatar size={56} state={owlState} />
                    {autoFillMode && (
                      <div
                        className={`absolute top-1/2 right-full mr-2 -translate-y-1/2 whitespace-nowrap bg-navy/95 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl transition-opacity duration-300 ${
                          autoFillPopupVisible ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {q.type === "code" ? t("placementFlow.startWriting") : t("placementFlow.startSpeaking")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {q.type === "code" ? (
                  <CodeEditor
                    value={codeAnswer}
                    onChange={setCodeAnswer}
                    language={q.codeLanguage}
                    runLabel={t("interview.runCode")}
                    outputLabel={t("interview.consoleOutput")}
                    outputPlaceholder={t("interview.consolePlaceholder")}
                    ranMessage={t("interview.consoleRan")}
                  />
                ) : (
                  <div className="bg-[#0d1117] rounded-xl border border-white/10 p-4">
                    <textarea
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      readOnly={autoFillMode}
                      placeholder={t("interview.typeAnswerPlaceholder")}
                      className="w-full bg-transparent text-gray-100 outline-none resize-none placeholder-gray-600"
                      style={{ height: "160px" }}
                    />
                    <p className="text-right text-xs text-gray-500 mt-2">
                      {textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0} {t("interview.words")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── QUESTION CARD ── */}
          <div className="p-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand">
                    {t("interview.question")} {currentQ + 1} {t("interview.of")} {activeQuestions.length}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {t(categoryKey[q.category])}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {activeQuestions.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i < answered.length ? "bg-brand" :
                        i === currentQ ? "bg-brand/60 scale-125" :
                        "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-white text-xl font-semibold leading-relaxed mb-6">
                {q.text[lang]}
              </p>

              {autoFillMode ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-amethyst/10 border border-amethyst/30 text-amethyst px-4 py-3 rounded-xl text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amethyst animate-pulse" />
                    🎬 Auto-filling demo answers… ({currentQ + 1}/{demoInterviewQuestions.length})
                  </div>
                  <button
                    onClick={stopAutoFill}
                    className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {!isRecording ? (
                    <button
                      onClick={handleStart}
                      className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {startLabel}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {t("interview.submitNext")}
                    </button>
                  )}

                  <button
                    onClick={handleRepeat}
                    className="flex items-center gap-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                    {t("interview.repeat")}
                  </button>

                  {currentQ < activeQuestions.length - 1 && (
                    <button
                      onClick={handleSkip}
                      className="flex items-center gap-2 border border-white/10 text-gray-500 hover:text-gray-300 px-4 py-3 rounded-xl text-sm transition-all"
                    >
                      {t("interview.skip")}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <OwlAvatar size={36} state="idle" className="flex-shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm leading-relaxed">
                  {isRecording ? t("interview.hintRecording") : idleHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
