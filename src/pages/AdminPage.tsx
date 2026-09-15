import { useState, useMemo } from "react"
import OwlAvatar from "../components/OwlAvatar"
import LanguageToggle from "../components/LanguageToggle"
import { useLanguage } from "../i18n/LanguageContext"
import { DEVELOPMENT_MODE, INTERVIEW_FROZEN_MESSAGE } from "../config/developmentMode"

type Page = "landing" | "setup" | "interview" | "results" | "dashboard" | "admin"

interface Props {
  onNavigate: (page: Page) => void
}

interface Candidate {
  id: number
  name: string
  role: string
  score: number
  communication: number
  technical: number
  fit: number
  status: "Passed" | "Review" | "Failed"
  date: string
  avatar: string
}

const candidates: Candidate[] = [
  { id: 1, name: "Emma Rodriguez", role: "Senior Product Designer", score: 92, communication: 94, technical: 88, fit: 95, status: "Passed", date: "Aug 25", avatar: "ER" },
  { id: 2, name: "Alex Chen", role: "Senior Product Designer", score: 82, communication: 85, technical: 78, fit: 88, status: "Passed", date: "Aug 25", avatar: "AC" },
  { id: 3, name: "Sarah Kim", role: "Senior Product Designer", score: 78, communication: 80, technical: 72, fit: 82, status: "Review", date: "Aug 24", avatar: "SK" },
  { id: 4, name: "James Okonkwo", role: "Senior Product Designer", score: 88, communication: 90, technical: 85, fit: 90, status: "Passed", date: "Aug 24", avatar: "JO" },
  { id: 5, name: "Priya Sharma", role: "Senior Product Designer", score: 65, communication: 62, technical: 68, fit: 64, status: "Failed", date: "Aug 23", avatar: "PS" },
  { id: 6, name: "Marcus Johnson", role: "Senior Product Designer", score: 71, communication: 74, technical: 66, fit: 72, status: "Failed", date: "Aug 23", avatar: "MJ" },
  { id: 7, name: "Yuki Tanaka", role: "Senior Product Designer", score: 85, communication: 88, technical: 80, fit: 87, status: "Passed", date: "Aug 22", avatar: "YT" },
  { id: 8, name: "Lena Müller", role: "Senior Product Designer", score: 79, communication: 82, technical: 75, fit: 80, status: "Review", date: "Aug 22", avatar: "LM" },
]

type SortKey = keyof Pick<Candidate, "score" | "communication" | "technical" | "fit" | "name">

const statusConfig = {
  Passed: { bg: "bg-brand-muted", text: "text-brand", dot: "bg-brand" },
  Review: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  Failed: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400" },
}

const avatarColors = [
  "bg-brand text-white",
  "bg-amethyst text-white",
  "bg-ember text-white",
  "bg-blue-500 text-white",
  "bg-pink-500 text-white",
  "bg-cyan-500 text-white",
  "bg-orange-500 text-white",
  "bg-indigo-500 text-white",
]

export default function AdminPage({ onNavigate }: Props) {
  const { t } = useLanguage()
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<number[]>([])

  const passed = candidates.filter(c => c.status === "Passed").length
  const failed = candidates.filter(c => c.status === "Failed").length
  const review = candidates.filter(c => c.status === "Review").length
  const avgScore = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)

  const sorted = useMemo(() => {
    const filtered = candidates.filter(c => {
      const matchStatus = filterStatus === "All" || c.status === filterStatus
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as string | number
      const bv = b[sortKey] as string | number
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [sortKey, sortDir, filterStatus, searchQuery])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const toggleSelect = (id: number) => {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id])
  }

  const toggleAll = () => {
    if (selected.length === sorted.length) setSelected([])
    else setSelected(sorted.map(c => c.id))
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <svg viewBox="0 0 16 16" fill="none" className={`w-3.5 h-3.5 inline ml-1 transition-all ${sortKey === col ? "opacity-100" : "opacity-30"}`}>
      <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: sortKey === col && sortDir === "asc" ? "scaleY(-1)" : undefined, transformOrigin: "center" }} />
    </svg>
  )

  const scoreColor = (s: number) =>
    s >= 80 ? "text-brand" : s >= 70 ? "text-amber-500" : "text-red-500"

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-display text-gray-900">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200/80 border-t-2 border-t-[#1DB584] px-6 py-5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("landing")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-navy">{t("admin.title")}</h1>
              <p className="text-sm text-gray-400">Senior Product Designer — TechCorp · Aug 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:text-navy hover:border-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t("admin.exportCsv")}
            </button>
            <button
              onClick={() => DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED && onNavigate("setup")}
              disabled={!DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED}
              title={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? undefined : INTERVIEW_FROZEN_MESSAGE}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED
                  ? "bg-brand hover:bg-brand-dark text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("admin.newInterview")}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("admin.totalCandidates"), value: candidates.length, sub: "This role", color: "text-navy", icon: "👥" },
            { label: t("admin.passed"), value: passed, sub: `${Math.round(passed / candidates.length * 100)}% pass rate`, color: "text-brand", icon: "✅" },
            { label: t("admin.underReview"), value: review, sub: "Needs decision", color: "text-amber-500", icon: "⏳" },
            { label: t("admin.avgScore"), value: avgScore, sub: "out of 100", color: "text-amethyst", icon: "📊" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <span className="text-gray-400 text-sm font-medium">{s.label}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className={`text-3xl font-black ${s.color} font-mono`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── ANALYTICS MINI CHARTS ── */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Score distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-navy mb-1">{t("admin.scoreDistribution")}</h3>
            <p className="text-xs text-gray-400 mb-4">All candidates for this role</p>
            <div className="flex items-end gap-2 h-24">
              {[
                { range: "60–69", count: 1, total: candidates.length },
                { range: "70–74", count: 1, total: candidates.length },
                { range: "75–79", count: 2, total: candidates.length },
                { range: "80–84", count: 1, total: candidates.length },
                { range: "85–89", count: 2, total: candidates.length },
                { range: "90–100", count: 1, total: candidates.length },
              ].map((bar, i) => {
                const pct = (bar.count / bar.total) * 100 * 4
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400 font-mono">{bar.count}</span>
                    <div className="w-full flex justify-center">
                      <div
                        className="w-3/4 rounded-t-md bg-brand/70 hover:bg-brand transition-colors"
                        style={{ height: `${Math.max(pct, 8)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 text-center">{bar.range}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Metrics overview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-navy mb-1">{t("admin.metricAverages")}</h3>
            <p className="text-xs text-gray-400 mb-4">Across all candidates</p>
            {[
              { label: "Communication", avg: Math.round(candidates.reduce((s, c) => s + c.communication, 0) / candidates.length), color: "bg-brand" },
              { label: "Technical", avg: Math.round(candidates.reduce((s, c) => s + c.technical, 0) / candidates.length), color: "bg-amethyst" },
              { label: "Cultural Fit", avg: Math.round(candidates.reduce((s, c) => s + c.fit, 0) / candidates.length), color: "bg-ember" },
            ].map((m, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{m.label}</span>
                  <span className="text-navy font-bold font-mono">{m.avg}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.color} animate-bar`} style={{ width: `${m.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header / controls */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={t("admin.searchPlaceholder")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              {["All", "Passed", "Review", "Failed"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                    filterStatus === status
                      ? "bg-brand text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">{selected.length} selected</span>
                <button className="text-xs font-semibold text-brand border border-brand/30 px-3 py-2 rounded-lg hover:bg-brand-muted transition-all">
                  Schedule
                </button>
                <button className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-surface border-b border-gray-100">
                  <th className="pl-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === sorted.length && sorted.length > 0}
                      onChange={toggleAll}
                      className="accent-brand w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("name")} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-navy transition-colors flex items-center gap-1">
                      Candidate <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("score")} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-navy transition-colors">
                      Score <SortIcon col="score" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    <button onClick={() => toggleSort("communication")} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-navy transition-colors">
                      Comm. <SortIcon col="communication" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    <button onClick={() => toggleSort("technical")} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-navy transition-colors">
                      Technical <SortIcon col="technical" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</span>
                  </th>
                  <th className="pr-6 py-3 text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => {
                  const cfg = statusConfig[c.status]
                  const isChecked = selected.includes(c.id)
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isChecked ? "bg-brand-muted/30" : ""}`}
                    >
                      <td className="pl-6 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(c.id)}
                          className="accent-brand w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                            {c.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black font-mono ${scoreColor(c.score)}`}>{c.score}</span>
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${c.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className={`text-sm font-bold font-mono ${scoreColor(c.communication)}`}>{c.communication}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className={`text-sm font-bold font-mono ${scoreColor(c.technical)}`}>{c.technical}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400 font-medium">{c.date}</span>
                      </td>
                      <td className="pr-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigate("results")}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            View
                          </button>
                          {c.status === "Passed" && (
                            <button className="text-xs font-semibold text-white bg-brand hover:bg-brand-dark px-3 py-1.5 rounded-lg transition-all">
                              Schedule
                            </button>
                          )}
                          {c.status === "Failed" && (
                            <button className="text-xs font-semibold text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {sorted.length === 0 && (
              <div className="py-16 text-center">
                <OwlAvatar size={100} state="thinking" className="mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No candidates match your filters</p>
                <button onClick={() => { setFilterStatus("All"); setSearchQuery("") }} className="mt-2 text-sm text-brand font-semibold hover:underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <strong className="text-gray-700">{sorted.length}</strong> of <strong className="text-gray-700">{candidates.length}</strong> candidates
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                    p === 1 ? "bg-brand text-white" : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── INSIGHTS FOOTER ── */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pass rate", value: `${Math.round(passed / candidates.length * 100)}%`, sub: "Industry avg: 30%", trend: "↑", good: true },
            { label: "Average score", value: `${avgScore}/100`, sub: "Above benchmark", trend: "↑", good: true },
            { label: "Top metric", value: "Communication", sub: `${Math.round(candidates.reduce((s, c) => s + c.communication, 0) / candidates.length)} avg`, trend: "→", good: true },
            { label: "Needs work", value: "Technical", sub: `${Math.round(candidates.reduce((s, c) => s + c.technical, 0) / candidates.length)} avg`, trend: "↓", good: false },
          ].map((ins, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-1">{ins.label}</p>
              <p className="text-lg font-black text-navy">{ins.value}</p>
              <p className={`text-xs font-semibold mt-1 ${ins.good ? "text-brand" : "text-amber-500"}`}>
                {ins.trend} {ins.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
