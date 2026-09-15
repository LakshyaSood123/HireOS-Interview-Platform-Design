import { useRef, useState } from "react"
import OwlAvatar from "../components/OwlAvatar"
import LanguageToggle from "../components/LanguageToggle"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { useLanguage } from "../i18n/LanguageContext"
import { useAppState } from "../state/AppStateContext"
import { companies } from "../data/companies"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin" | "placement-flow"

interface Props {
  onNavigate: (page: Page) => void
}

export default function SetupPage({ onNavigate }: Props) {
  const { t, lang } = useLanguage()
  const { candidateName, setCandidateName, companyId, setCompanyId, cvFileName, setCvFileName } =
    useAppState()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canContinue = !!companyId && !!cvFileName

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) setCvFileName(file.name)
  }

  const fillDemoResume = () => {
    setCvFileName("Alex_Chen_Staff_Engineer_Resume.pdf")
  }

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white pb-28 relative overflow-x-hidden">
      <ForestBackdrop intensity="deep" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-[#1DB584]/20 bg-[#071A14]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-sm font-semibold hidden sm:inline">HireOS Home</span>
          </button>
          <LanguageToggle variant="dark" />
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-10">
        {/* Intro */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 w-fit">
            <OwlAvatar size={100} state="idle" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#1DB584]/20 border border-[#1DB584]/40 text-[#1DB584]">
            <span>🌿</span> Step 1 of 2 &bull; Prepare Your Journey
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white">
            Select Your Interview Expedition
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-200/80 max-w-xl mx-auto leading-relaxed">
            Choose your target company track and attach your credentials to tailor the AI interviewer and subsequent learning trails.
          </p>
        </div>

        {/* Step 1: Company Destination Passes */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <span>🏷️</span> Choose Company Expedition Pass:
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => {
              const selected = companyId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setCompanyId(c.id)}
                  className={`text-left rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                    selected
                      ? "border-[#1DB584] bg-gradient-to-b from-[#0F3524] to-[#071A14] shadow-lg shadow-[#1DB584]/25 scale-[1.02]"
                      : "border-white/10 bg-[#092218]/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold ${c.color} shadow-md`}>
                      {c.initials}
                    </div>
                    {selected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#1DB584] bg-[#1DB584]/20 border border-[#1DB584]/40 px-2 py-0.5 rounded-full">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Target Selected
                      </span>
                    )}
                  </div>
                  <p className="font-black text-white text-base">{c.name}</p>
                  <p className="text-xs text-[#A7CE65] font-semibold mt-0.5">{c.role[lang]}</p>
                  <p className="text-xs text-gray-400 mt-2">{c.location[lang]}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{c.description[lang]}</p>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#1DB584]">{c.openings} Openings</span>
                    <span className="text-gray-400">Sylva Track</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Step 2: Resume Dropzone with Bioluminescent Glow */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <span>📄</span> Candidate Credentials (Resume / CV):
            </h2>
            {!cvFileName && (
              <button
                onClick={fillDemoResume}
                className="text-xs text-[#A7CE65] hover:text-white underline"
              >
                Auto-fill Demo Resume
              </button>
            )}
          </div>

          {!cvFileName ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all bg-[#092218]/60 ${
                dragOver
                  ? "border-[#1DB584] bg-[#0F3524]/70 shadow-[0_0_20px_rgba(29,181,132,0.3)]"
                  : "border-[#1DB584]/30 hover:border-[#1DB584]/60"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#1DB584]/15 border border-[#1DB584]/30 flex items-center justify-center mx-auto mb-3 text-2xl">
                📥
              </div>
              <p className="font-bold text-white text-base">Drop your resume or portfolio here</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX up to 10MB</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-[#1DB584] hover:bg-[#159a6f] text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Browse Files
                </button>
                <button
                  onClick={fillDemoResume}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-gray-200 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Use Demo CV
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0F3524] border border-[#1DB584]/50 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg shadow-[#1DB584]/15">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#1DB584]/20 border border-[#1DB584]/40 flex items-center justify-center text-xl flex-shrink-0">
                  📑
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{cvFileName}</p>
                  <p className="text-xs text-[#A7CE65] font-semibold">✓ Verified &amp; Parsed for Diagnostic</p>
                </div>
              </div>
              <button
                onClick={() => setCvFileName(null)}
                className="text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
              >
                Remove
              </button>
            </div>
          )}
        </section>

        {/* Step 3: Candidate Name */}
        <section className="mb-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Candidate Name
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            placeholder="Alex Chen"
            className="w-full max-w-md px-4 py-3 bg-[#04100C] border border-[#1DB584]/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#1DB584]/50 font-medium text-sm"
          />
        </section>

        {/* Continue Action */}
        <div className="text-center">
          <button
            disabled={!canContinue}
            onClick={() => onNavigate("interview")}
            className={`inline-flex items-center justify-center gap-2 font-black px-8 py-4 rounded-2xl text-sm transition-all cursor-pointer ${
              canContinue
                ? "bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] text-white hover:scale-105 shadow-xl shadow-[#1DB584]/35"
                : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <span>Enter AI Interview Chamber</span>
            <span>➔</span>
          </button>
          {!canContinue && (
            <p className="mt-3 text-xs text-gray-500">
              Select a target company pass and upload a resume to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
