interface TimelineStep {
  label: string
}

interface ProgressTimelineProps {
  steps: TimelineStep[]
  activeIndex: number // index of the current (in-progress) step
}

export default function ProgressTimeline({ steps, activeIndex }: ProgressTimelineProps) {
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = i < activeIndex
        const current = i === activeIndex
        return (
          <div key={step.label} className="flex items-center flex-1 min-w-[92px] last:flex-none">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? "bg-brand border-brand text-white"
                    : current
                    ? "bg-brand-muted border-brand text-brand animate-pulse"
                    : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-xs font-black">{i + 1}</span>
                )}
              </div>
              <p className={`mt-2 text-[11px] font-semibold text-center leading-tight max-w-[90px] ${
                done || current ? "text-navy" : "text-gray-400"
              }`}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mt-[-20px] ${i < activeIndex ? "bg-brand" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
