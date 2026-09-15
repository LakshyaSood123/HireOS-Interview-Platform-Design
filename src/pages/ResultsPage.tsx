import { useState } from "react"
import OwlAvatar from "../components/OwlAvatar"
import LanguageToggle from "../components/LanguageToggle"
import CourseRecommendCard from "../components/forest/CourseRecommendCard"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { findCompany } from "../data/companies"
import { DEVELOPMENT_MODE, INTERVIEW_FROZEN_MESSAGE } from "../config/developmentMode"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

const metrics = [
  { label: "Communication", score: 88, icon: "💬", color: "text-[#1DB584]", ring: "#1DB584", bg: "bg-[#092B1F]/60", border: "border-[#1DB584]/30" },
  { label: "Role Fit & Culture", score: 86, icon: "🤝", color: "text-[#A7CE65]", ring: "#A7CE65", bg: "bg-[#143016]/60", border: "border-[#A7CE65]/30" },
  { label: "Technical Depth", score: 74, icon: "⚙️", color: "text-[#38BDF8]", ring: "#38BDF8", bg: "bg-[#07242B]/60", border: "border-[#38BDF8]/30" },
  { label: "Problem Solving", score: 69, icon: "🧩", color: "text-[#FB923C]", ring: "#FB923C", bg: "bg-[#281A0B]/60", border: "border-[#FB923C]/30" },
]

const strengths = [
  {
    title: "Articulate Behavioral Storytelling",
    desc: "Seamless use of the STAR method with clear business metrics and ownership.",
    tag: "Exceptional",
    color: "text-[#1DB584]",
  },
  {
    title: "Code Structure & Clarity",
    desc: "Clean variable naming and systematic modularity during live problem solving.",
    tag: "High Mastery",
    color: "text-[#A7CE65]",
  },
  {
    title: "Stakeholder Empathy",
    desc: "Balanced perspectives on resolving technical friction across engineering teams.",
    tag: "Strong",
    color: "text-[#10B981]",
  },
]

const breakdown = [
  {
    q: "Tell me about yourself and your professional background.",
    summary: "Clear self-introduction with 5 years of experience context. Well-structured timeline.",
    score: 8.8,
    feedback: "Great storytelling arc. Clear progression from IC to technical mentor.",
    tag: "Outstanding",
    tagColor: "bg-[#1DB584]/20 text-[#1DB584]",
  },
  {
    q: "Describe a challenging project you led and how you overcame obstacles.",
    summary: "Used STAR method effectively. Concrete metrics cited (32% latency reduction).",
    score: 9.0,
    feedback: "Outstanding example. Leadership and system-level trade-offs shone through.",
    tag: "Mastery",
    tagColor: "bg-[#A7CE65]/20 text-[#A7CE65]",
  },
  {
    q: "Difference between synchronous and asynchronous code with real-world examples.",
    summary: "Accurately distinguished blocking vs non-blocking I/O and Promise lifecycle.",
    score: 8.2,
    feedback: "Solid foundation. Could briefly mention event loop microtask vs macrotask queue.",
    tag: "Strong",
    tagColor: "bg-blue-500/20 text-blue-400",
  },
  {
    q: "Algorithmic coding: Two Sum target pair finder.",
    summary: "Solved with a Set, but struggled when asked to handle duplicates and space trade-offs.",
    score: 6.8,
    feedback: "Functional solution, but hesitated on time/space analysis and binary search trade-offs.",
    tag: "Needs Work",
    tagColor: "bg-[#FB923C]/20 text-[#FB923C]",
  },
]

function ScoreRing({ score, radius = 80, color }: { score: number; radius?: number; color: string }) {
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width={radius * 2 + 24} height={radius * 2 + 24} viewBox={`0 0 ${radius * 2 + 24} ${radius * 2 + 24}`}>
      <circle
        cx={radius + 12}
        cy={radius + 12}
        r={radius}
        fill="none"
        stroke="#1A3328"
        strokeWidth="12"
      />
      <circle
        cx={radius + 12}
        cy={radius + 12}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${radius + 12} ${radius + 12})`}
        className="animate-ring drop-shadow-[0_0_10px_#1DB584]"
      />
    </svg>
  )
}

export default function ResultsPage({ onNavigate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(3) // Expand the struggle Q by default
  const { t, lang } = useLanguage()
  const { candidateName, companyId, startLearningTrail } = useAppState()
  const company = findCompany(companyId)

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white relative overflow-x-hidden pb-24">
      <ForestBackdrop intensity="deep" />

      {/* ── TOP HEADER / BRAND ── */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1DB584] flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-[#1DB584]/30">
            🦉
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight">HireOS</span>
            <span className="text-xs text-gray-400 block -mt-0.5">Interview Diagnosis &bull; Sylva Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle variant="dark" />
        </div>
      </header>

      {/* ── SECTION 1: RESULT HERO & PERFORMANCE CANOPY ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#1DB584]/20 border border-[#1DB584]/40 text-[#1DB584] mb-3">
            <span>✓</span> AI Evaluation Complete
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Interview Assessment for {candidateName}
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2 max-w-2xl mx-auto">
            {company ? `${company.role[lang]} at ${company.name}` : "Software Engineer Evaluation"} &bull;{" "}
            Your communication was outstanding, and targeted growth trails will bring your technical mastery into alignment.
          </p>
        </div>

        {/* ── Central Performance Canopy Card ── */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0F3524] to-[#081F17] border border-[#1DB584]/40 p-6 sm:p-10 shadow-[0_0_60px_rgba(29,181,132,0.2)]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
            {/* Mascot with Celebratory beat */}
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-3xl bg-[#1DB584]/15 border border-[#1DB584]/30 mb-3">
                <OwlAvatar size={130} state="celebrating" className="drop-shadow-xl" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1DB584]/20 text-[#1DB584]">
                <span className="w-2 h-2 rounded-full bg-[#1DB584] animate-ping" />
                Strong Candidate Baseline
              </span>
            </div>

            {/* Score Ring Center */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <ScoreRing score={82} color="#1DB584" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white font-mono animate-score-bounce">82</span>
                  <span className="text-xs text-gray-400 font-medium">Out of 100</span>
                </div>
              </div>
              <p className="text-[#1DB584] font-bold text-sm mt-3">
                Meets Screening Threshold (80)
              </p>
            </div>

            {/* Branching Performance Categories Canopy */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {metrics.map(m => (
                <div
                  key={m.label}
                  className={`rounded-2xl p-4 flex items-center justify-between border ${m.bg} ${m.border} backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-300">{m.label}</p>
                      <p className={`text-xl font-black ${m.color} font-mono mt-0.5`}>{m.score}%</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-gray-300">
                    {m.score >= 80 ? "Healthy" : "Growth"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: HEALTHY CANOPY STRENGTHS ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🌿</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Key Strengths Identified</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {strengths.map((s, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#092218] border border-[#1DB584]/25 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${s.color}`}>{s.tag}</span>
                <span className="text-[#1DB584] text-xs">✓ Verified</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: PROMINENT GROWTH AREAS (THE SIGNATURE GATEWAY) ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FB923C]/20 border border-[#FB923C]/40 text-[#FB923C] mb-2">
              <span>🎯</span> Actionable Growth Gateway
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Personalized Improvement Trails
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              HireOS diagnosed specific conceptual hurdles. Step directly into Reagvis Labs to close these gaps.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-400/90 hidden sm:block">
            Powered by Reagvis Labs &bull; Adaptive Sylva Trails
          </span>
        </div>

        {/* The Star: Course Recommendation Card for DSA */}
        <div className="mb-6">
          <CourseRecommendCard
            title="Data Structures & Algorithms Foundations"
            score={58}
            maxScore={100}
            focusAreas={[
              "Trees & Binary Search Trees",
              "Graph Traversal (BFS / DFS)",
              "Time & Space Complexity Trade-offs",
              "Recursion Base Conditions",
            ]}
            duration="~2h 30m"
            lessonsCount={6}
            courseId="dsa-foundations"
          />
        </div>

        {/* Secondary Recommendation: System Design */}
        <div className="rounded-2xl border border-white/10 bg-[#0A261B]/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">System Design: Architect&apos;s Highlands</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-gray-400">
                  Score: 64/100
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Focus on Horizontal Scalability, Cache Invalidation, and Partitioning.
              </p>
            </div>
          </div>
          <button
            onClick={() => startLearningTrail("system-design")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all text-center whitespace-nowrap cursor-pointer"
          >
            Explore System Design Trail ➔
          </button>
        </div>
      </section>

      {/* ── SECTION 4: QUESTION BREAKDOWN ACCORDION ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-bold text-white mb-2">Question Breakdown &amp; Transcripts</h2>
        <p className="text-xs text-gray-400 mb-6">
          Detailed AI breakdown of responses, timing, and detected signal strengths.
        </p>

        <div className="space-y-3">
          {breakdown.map((b, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#092218] border border-white/10 overflow-hidden shadow-sm transition-all"
            >
              <button
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                  <span className="text-base font-black text-white font-mono">{b.score}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-medium">Question {i + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.tagColor}`}>
                      {b.tag}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{b.q}</p>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expanded === i ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expanded === i && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <p className="font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Observed Answer Summary
                      </p>
                      <p className="text-gray-300 leading-relaxed">{b.summary}</p>
                    </div>
                    <div className="bg-[#1DB584]/10 rounded-xl p-4 border border-[#1DB584]/25">
                      <p className="font-bold uppercase tracking-wider text-[#1DB584] mb-2">
                        AI Coach Feedback
                      </p>
                      <p className="text-emerald-200/90 leading-relaxed">{b.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: NEXT STEPS & NAVIGATION ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#092218] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Next Steps in Your Journey</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Candidate profile updated. You can review your dashboard or retake the interview at any time.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all text-center"
            >
              Candidate Journey
            </button>
            <button
              onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && onNavigate("setup")}
              disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
              title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
                  ? "bg-[#1DB584] hover:bg-[#159a6f] text-white"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              }`}
            >
              New Interview
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
