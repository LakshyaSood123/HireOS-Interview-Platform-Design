import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { ReactNode } from "react"
import PlacementInterviewSummary from "./PlacementInterviewSummary"
import PlacementAnalysisSection from "./PlacementAnalysisSection"
import PlacementLearningSection from "./PlacementLearningSection"
import PlacementReportSection from "./PlacementReportSection"
import type { InterviewSessionData } from "../data/placementPrepDemo"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  session: InterviewSessionData
  onNavigate: (page: Page) => void
}

const RevealSection = forwardRef<HTMLDivElement, { children: ReactNode }>(function RevealSection({ children }, forwardedRef) {
  const ref = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
    >
      {visible && children}
    </div>
  )
})

export default function PlacementPrepFlow({ session, onNavigate }: Props) {
  const learningRef = useRef<HTMLDivElement>(null)

  const scrollToLearning = () => {
    learningRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-16 sm:gap-20 py-12">
      <RevealSection>
        <PlacementInterviewSummary session={session} />
      </RevealSection>

      <RevealSection>
        <PlacementAnalysisSection active onLearnTopic={scrollToLearning} />
      </RevealSection>

      <RevealSection ref={learningRef}>
        <PlacementLearningSection />
      </RevealSection>

      <RevealSection>
        <PlacementReportSection onNavigate={onNavigate} onContinueLearning={scrollToLearning} />
      </RevealSection>
    </div>
  )
}
