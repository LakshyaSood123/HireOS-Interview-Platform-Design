import OwlAvatar from "../components/OwlAvatar"
import LanguageToggle from "../components/LanguageToggle"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { companies, findCompany } from "../data/companies"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

const history = [
  { companyId: "techcorp", score: 82, status: "Diagnostic Ready", date: "Aug 25" },
  { companyId: "nimbus-health", score: 88, status: "Passed", date: "Aug 12" },
  { companyId: "bluepeak", score: 74, status: "Review", date: "Aug 03" },
  { companyId: "solstice-robotics", score: 91, status: "Passed", date: "Jul 22" },
]

const statusStyles: Record<string, string> = {
  "Diagnostic Ready": "bg-[#1DB584]/20 text-[#1DB584] border border-[#1DB584]/40",
  Passed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  Review: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  Failed: "bg-red-500/20 text-red-400 border border-red-500/30",
}

const badgeDefs = [
  { icon: "🧭", label: "Trail Starter", desc: "Started first learning trail", earned: true },
  { icon: "🦉", label: "Owl Mentee", desc: "Diagnostic evaluation complete", earned: true },
  { icon: "🔥", label: "7-Day Streak", desc: "Consistent learning cadence", earned: true },
  { icon: "🌲", label: "Grove Climber", desc: "Cleared Trailhead Grove", earned: true },
  { icon: "⚔️", label: "Code Tactician", desc: "Solved live practice challenge", earned: false },
  { icon: "⭐", label: "Summit Master", desc: "Ready for TechCorp final round", earned: false },
]

export default function StudentDashboardPage({ onNavigate }: Props) {
  const { lang } = useLanguage()
  const {
    candidateName,
    companyId,
    startLearningTrail,
    userXP,
    userStreak,
    simulatedReadinessScore,
  } = useAppState()
  const currentCompany = findCompany(companyId) ?? companies[0]

  const completed = history.length
  const avgScore = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
  const xpForNextLevel = 2000
  const level = 4

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white pb-24 relative overflow-x-hidden">
      <ForestBackdrop intensity="deep" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#1DB584]/20 bg-[#071A14]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate("landing")}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex items-center gap-2 text-xs font-semibold"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span>HireOS Home</span>
          </button>
          <LanguageToggle variant="dark" />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile header */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0F3524] to-[#092218] border border-[#1DB584]/30 shadow-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="p-2 rounded-2xl bg-[#1DB584]/15 border border-[#1DB584]/30">
            <OwlAvatar size={85} state="idle" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1DB584]/20 text-[#1DB584] mb-1">
              <span>🌱</span> Active Knowledge Forest Explorer
            </div>
            <h1 className="text-2xl font-black text-white">{candidateName}</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Target Track: <span className="text-emerald-300 font-semibold">{currentCompany.role[lang]}</span> &bull; {currentCompany.name}
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-56">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A7CE65] bg-[#A7CE65]/20 border border-[#A7CE65]/40 px-2.5 py-1 rounded-full">
                Level {level}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FB923C] bg-[#FB923C]/20 border border-[#FB923C]/40 px-2.5 py-1 rounded-full">
                🔥 {userStreak} Days
              </span>
            </div>
            <div className="w-full">
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#A7CE65] to-[#1DB584]"
                  style={{ width: `${(userXP / xpForNextLevel) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 text-right font-mono">
                {userXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>

        {/* Active Learning Trail Highlight Banner (The Reagvis Labs connection) */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0F3524] via-[#0B2A1D] to-[#071A14] border-2 border-[#1DB584] p-6 sm:p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1DB584]/20 border border-[#1DB584]/40 flex items-center justify-center text-3xl flex-shrink-0">
              🌲
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1DB584]/20 text-[#1DB584] border border-[#1DB584]/30">
                  Recommended Course
                </span>
                <span className="text-xs text-gray-400">Reagvis Labs</span>
              </div>
              <h2 className="text-xl font-bold text-white">DSA Foundations: Algorithmic Forest</h2>
              <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                Active Landmark: <span className="text-[#A7CE65] font-semibold">Sorting Clearing</span> &bull; 
                Readiness currently at <span className="text-[#1DB584] font-bold font-mono">{simulatedReadinessScore}%</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => startLearningTrail("dsa-foundations")}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-105 transition-all text-center whitespace-nowrap cursor-pointer"
            >
              🌿 Continue DSA Trail ➔
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#092218] rounded-2xl border border-white/10 p-4 text-center">
            <span className="text-xs text-gray-400 block mb-1">Interview Readiness</span>
            <span className="text-2xl font-black text-[#1DB584] font-mono">{simulatedReadinessScore}%</span>
          </div>
          <div className="bg-[#092218] rounded-2xl border border-white/10 p-4 text-center">
            <span className="text-xs text-gray-400 block mb-1">Completed Interviews</span>
            <span className="text-2xl font-black text-white font-mono">{completed}</span>
          </div>
          <div className="bg-[#092218] rounded-2xl border border-white/10 p-4 text-center">
            <span className="text-xs text-gray-400 block mb-1">Historical Average</span>
            <span className="text-2xl font-black text-[#A7CE65] font-mono">{avgScore}</span>
          </div>
          <div className="bg-[#092218] rounded-2xl border border-white/10 p-4 text-center">
            <span className="text-xs text-gray-400 block mb-1">Active Streak</span>
            <span className="text-2xl font-black text-[#FB923C] font-mono">7 Days</span>
          </div>
        </div>

        {/* Badges / Forest Achievements */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <span>🏆</span> Knowledge Forest Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {badgeDefs.map((b, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 text-center flex flex-col items-center justify-center transition-all ${
                  b.earned
                    ? "bg-[#092218] border-[#1DB584]/30 shadow-md shadow-[#1DB584]/10"
                    : "bg-black/30 border-white/5 opacity-50"
                }`}
              >
                <span className="text-3xl mb-2">{b.icon}</span>
                <p className="text-xs font-bold text-white">{b.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Interview History */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <span>📋</span> Interview Evaluation History
          </h2>
          <div className="space-y-3">
            {history.map((h, i) => {
              const comp = findCompany(h.companyId)
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-[#092218] border border-white/10 p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center font-bold text-sm">
                      {comp?.initials ?? "TC"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{comp?.name ?? "TechCorp"}</p>
                      <p className="text-xs text-gray-400">{h.date} &bull; Initial AI Screening</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-black font-mono text-white">{h.score}/100</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyles[h.status]}`}>
                      {h.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
