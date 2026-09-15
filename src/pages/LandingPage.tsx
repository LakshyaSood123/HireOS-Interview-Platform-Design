import { useState } from "react"
import OwlAvatar from "../components/OwlAvatar"
import LanguageToggle from "../components/LanguageToggle"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { DEVELOPMENT_MODE, INTERVIEW_FROZEN_MESSAGE } from "../config/developmentMode"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

const features = [
  {
    icon: "🧭",
    title: "Diagnostic Forest Journey",
    desc: "Every interview maps out a living knowledge tree, pinpointing exactly where your technical and behavioral strengths flourish.",
  },
  {
    icon: "🧪",
    title: "Reagvis Labs Integration",
    desc: "Direct handoff from interview struggles into personalized, bite-sized learning trails with zero generic advice.",
  },
  {
    icon: "📈",
    title: "Continuous Retake Loop",
    desc: "Complete challenges in the forest, verify your readiness, and re-enter HireOS with verified confidence.",
  },
]

const stats = [
  { value: "10k+", label: "Simulated Interviews" },
  { value: "84%", label: "Placement Readiness Gain" },
  { value: "200+", label: "Target Companies & Roles" },
  { value: "2.4×", label: "Faster Skill Recovery" },
]

export default function LandingPage({ onNavigate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useLanguage()
  const { startLearningTrail } = useAppState()

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white overflow-x-hidden relative">
      <ForestBackdrop intensity="subtle" />

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#071A14]/85 backdrop-blur-md border-b border-[#1DB584]/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1DB584] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#1DB584]/30">
              🦉
            </div>
            <span className="text-xl font-black text-white tracking-tight">HireOS</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1DB584]/20 text-[#1DB584] border border-[#1DB584]/30">
              FOREST EDITION
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#how" className="hover:text-white transition-colors">Ecosystem Loop</a>
            <a href="#features" className="hover:text-white transition-colors">Sylva Engine</a>
            <button
              onClick={() => startLearningTrail("dsa-foundations")}
              className="text-[#A7CE65] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>🌿</span> Reagvis Trails
            </button>
          </div>

          {/* Auth & CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle variant="dark" />
            <button
              onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && onNavigate("setup")}
              disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
              title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
              className={`text-xs font-bold text-white transition-all px-5 py-2.5 rounded-xl shadow-lg ${
                DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
                  ? "bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-[#1DB584]/25 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-white/10 text-gray-500 shadow-none cursor-not-allowed"
              }`}
            >
              Begin Interview ➔
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-300"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#071A14] border-b border-white/10 px-6 py-4 flex flex-col gap-4">
            <button
              onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && (setMenuOpen(false), onNavigate("setup"))}
              disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
              title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
              className={`text-left text-sm font-semibold ${
                DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? "text-white" : "text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Interview
            </button>
            <button onClick={() => { setMenuOpen(false); startLearningTrail(); }} className="text-left text-sm font-semibold text-[#1DB584]">
              Explore Reagvis Trails
            </button>
            <LanguageToggle variant="dark" />
          </div>
        )}
      </nav>

      {/* ── CINEMATIC HERO ── */}
      <section className="relative z-10 pt-32 sm:pt-36 pb-16 px-6 text-center max-w-6xl mx-auto">
        {/* Subtle pill banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#1DB584]/15 border border-[#1DB584]/40 text-[#1DB584] mb-6 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-[#1DB584] animate-ping" />
          Interviews that show you where to grow
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto animate-fade-up delay-100">
          Turn Every Interview Into A <span className="text-[#1DB584]">Forest Path</span> Forward.
        </h1>

        {/* Subhead */}
        <p className="mt-5 text-base sm:text-xl text-emerald-200/80 font-normal max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
          Practice realistic interviews, diagnose technical &amp; behavioral weaknesses, and seamlessly transition into personalized Reagvis Labs learning trails to conquer them.
        </p>

        {/* Dual Primary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
          <button
            onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && onNavigate("setup")}
            disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
            title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-bold px-8 py-4 rounded-2xl text-base transition-all ${
              DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
                ? "bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] text-white shadow-xl shadow-[#1DB584]/35 hover:-translate-y-0.5 cursor-pointer"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Begin Your Interview</span>
            <span>➔</span>
          </button>
          <button
            onClick={() => startLearningTrail("dsa-foundations")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-[#1DB584]/40 text-emerald-300 font-bold px-8 py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span>🌿 Explore Reagvis Trails</span>
          </button>
        </div>

        {/* ── GLOWING TRAIL ENTRANCE & OWL MASCOT ── */}
        <div className="relative mt-16 flex items-end justify-center min-h-[380px] sm:min-h-[440px]">
          {/* Left floating diagnostic chip */}
          <div className="absolute left-4 xl:left-8 bottom-12 rounded-2xl bg-[#092218]/90 border border-[#1DB584]/30 p-4 shadow-2xl w-56 hidden lg:block text-left animate-float">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A7CE65] mb-1.5">
              Live Signal Radar
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-gray-300 mb-0.5">
                  <span>Communication</span>
                  <span className="font-mono text-[#1DB584] font-bold">88%</span>
                </div>
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1DB584] rounded-full w-[88%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-gray-300 mb-0.5">
                  <span>DSA Readiness</span>
                  <span className="font-mono text-[#FB923C] font-bold">58%</span>
                </div>
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FB923C] rounded-full w-[58%]" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Auto-calibrating next trail...
            </p>
          </div>

          {/* Right floating trailhead pass */}
          <div className="absolute right-4 xl:right-8 top-8 rounded-2xl bg-[#092218]/90 border border-[#1DB584]/30 p-4 shadow-2xl w-52 hidden lg:block text-left animate-float-slow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🗺️</span>
              <div>
                <p className="text-xs font-bold text-white">Algorithmic Forest</p>
                <p className="text-[10px] text-[#1DB584]">Trailhead Grove Ready</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-300 leading-snug">
              6 targeted landmarks calibrated to fix recursion &amp; tree complexity.
            </p>
          </div>

          {/* Center Mascot with bioluminescent glow portal behind */}
          <div className="relative z-10">
            <div className="absolute inset-0 bg-[#1DB584]/25 rounded-full blur-3xl scale-95 animate-pulse" />
            <OwlAvatar size={310} state="idle" className="relative z-10 drop-shadow-[0_0_40px_rgba(29,181,132,0.45)]" />
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-12 bg-[#05140F] border-y border-[#1DB584]/15 relative z-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-white font-mono">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS: THE 5-STEP LOOP ── */}
      <section id="how" className="py-20 px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1DB584]">
            Continuous Growth Architecture
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white">
            How The Knowledge Forest Operates
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-gradient-to-b from-[#0F3524] to-[#071A14] border border-[#1DB584]/25 p-8 transition-all hover:border-[#1DB584]/60 hover:-translate-y-1 shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1DB584]/20 border border-[#1DB584]/30 flex items-center justify-center text-2xl mb-5">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-white/10 text-center text-xs text-gray-500 relative z-10">
        <p>HireOS &bull; Sylva Engine &bull; Reagvis Labs Ecosystem 2026</p>
      </footer>
    </div>
  )
}
