import { useEffect, useMemo, useState } from "react"
import { useLanguage } from "../i18n/LanguageContext"
import type { InterviewSessionData } from "../data/placementPrepDemo"

interface Props {
  session: InterviewSessionData
}

const WORD_INTERVAL_MS = 70
const LINE_INTERVAL_MS = 150
const STAGGER_MS = 500

function RevealedAnswer({ text, isCode, startDelay }: { text: string; isCode: boolean; startDelay: number }) {
  const [count, setCount] = useState(0)
  const tokens = useMemo(() => (isCode ? text.split("\n") : text.split(" ")), [text, isCode])

  useEffect(() => {
    setCount(0)
    const interval = isCode ? LINE_INTERVAL_MS : WORD_INTERVAL_MS
    let tick: ReturnType<typeof setInterval>

    const startTimer = setTimeout(() => {
      let i = 0
      tick = setInterval(() => {
        i++
        setCount(i)
        if (i >= tokens.length) clearInterval(tick)
      }, interval)
    }, startDelay)

    return () => {
      clearTimeout(startTimer)
      clearInterval(tick)
    }
  }, [tokens, isCode, startDelay])

  const shown = tokens.slice(0, count).join(isCode ? "\n" : " ")

  if (isCode) {
    return (
      <pre className="rounded-md bg-gray-950 border border-gray-800 p-4 overflow-x-auto">
        <code className="font-mono text-sm text-gray-300 whitespace-pre">{shown}</code>
      </pre>
    )
  }

  return <p className="text-base text-gray-400 leading-relaxed whitespace-pre-line">{shown}</p>
}

export default function PlacementInterviewSummary({ session }: Props) {
  const { t } = useLanguage()

  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand/20 text-brand font-black text-sm">1</span>
        <h2 className="text-3xl font-bold text-white">{t("placementFlow.interviewSummary")}</h2>
      </div>

      {/* Candidate + duration */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-6 rounded-lg border border-white/10 bg-white/5 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("placementFlow.candidateName")}</p>
          <p className="text-white font-semibold">{session.candidateName}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Role</p>
          <p className="text-white font-semibold">{session.jobTitle} · {session.company}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("placementFlow.totalDuration")}</p>
          <p className="text-white font-semibold">{session.totalDuration}</p>
        </div>
      </div>

      <div className="space-y-4">
        {session.questions.map((q, i) => {
          const answer = session.answers.find((a) => a.questionId === q.id)
          return (
            <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 font-semibold">{t("placementFlow.question")} {i + 1}</span>
                <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-amethyst/20 text-amethyst capitalize">
                  {q.category}
                </span>
                {q.isFollowUp && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-ember/20 text-ember">
                    ↳ {t("placementFlow.followUp")}
                  </span>
                )}
              </div>

              <p className="text-lg font-semibold text-white mb-3">{q.text}</p>

              <div className="rounded-lg bg-gray-900 border border-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("placementFlow.answer")}</p>
                {answer && (
                  <RevealedAnswer text={answer.answer} isCode={q.type === "code"} startDelay={i * STAGGER_MS} />
                )}
              </div>

              {answer && (
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-sm text-gray-500 font-medium">
                    {t("placementFlow.score")}: <span className="text-white font-black font-mono">{answer.score}/{answer.maxScore}</span>
                  </span>
                  <span className="text-sm text-gray-500 font-medium">{answer.duration}s</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
