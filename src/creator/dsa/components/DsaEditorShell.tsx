import { useMemo, useState } from "react"
import type { CreatorCourse } from "../../types"
import type { DsaCourseAuthoringRepository } from "../dsaDraftRepository"
import { getOrCreateDsaDraft, dsaCourseAuthoringRepository } from "../dsaDraftRepository"
import { validateDsaDraft } from "../dsaDraftValidation"
import DsaZoneList from "./DsaZoneList"
import DsaZoneEditor from "./DsaZoneEditor"
import DsaModuleEditor from "./DsaModuleEditor"
import DsaCheckpointEditor from "./DsaCheckpointEditor"
import DsaValidationPanel from "./DsaValidationPanel"
import DsaDraftPreview from "./DsaDraftPreview"

interface DsaEditorShellProps {
  onBackToDashboard: () => void
  repository?: DsaCourseAuthoringRepository
}

type Tab = "curriculum" | "validation" | "preview"

export interface PreviewTarget {
  zoneId: string | null
  moduleId: string | null
  checkpointId: string | null
}

function countAll(course: CreatorCourse) {
  const zones = course.dsaZones ?? []
  const modules = zones.flatMap(z => z.modules)
  const checkpoints = modules.flatMap(m => m.checkpoints)
  return {
    zones: zones.length,
    modules: modules.length,
    checkpoints: checkpoints.length,
    activeZones: zones.filter(z => z.state === "active").length,
    activeModules: modules.filter(m => m.state === "active").length,
    activeCheckpoints: checkpoints.filter(cp => cp.state === "active").length,
  }
}

export default function DsaEditorShell({ onBackToDashboard, repository = dsaCourseAuthoringRepository }: DsaEditorShellProps) {
  const [course, setCourse] = useState<CreatorCourse>(() => getOrCreateDsaDraft(repository))
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(course))
  const [tab, setTab] = useState<Tab>("curriculum")
  const [saveFlash, setSaveFlash] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null)

  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>({ zoneId: null, moduleId: null, checkpointId: null })

  const isDirty = useMemo(() => JSON.stringify(course) !== savedSnapshot, [course, savedSnapshot])
  const counts = useMemo(() => countAll(course), [course])
  const issues = useMemo(() => validateDsaDraft(course), [course])
  const errorCount = issues.filter(i => i.severity === "error").length

  const flash = (msg: string) => {
    setSaveFlash(msg)
    setTimeout(() => setSaveFlash(null), 2200)
  }

  const handleUpdate = (updated: CreatorCourse) => setCourse(updated)

  const handleSave = () => {
    const saved = repository.saveDraft(course)
    setCourse(saved)
    setSavedSnapshot(JSON.stringify(saved))
    flash("Draft saved")
  }

  const handleResetConfirmed = () => {
    const fresh = repository.resetDraftToStatic()
    setCourse(fresh)
    setSavedSnapshot(JSON.stringify(fresh))
    setSelectedZoneId(null)
    setSelectedModuleId(null)
    setSelectedCheckpointId(null)
    setShowResetConfirm(false)
    flash("Draft reset to current static DSA")
  }

  const jumpToPreview = (target: PreviewTarget) => {
    setPreviewTarget(target)
    setTab("preview")
  }

  const selectedZone = course.dsaZones?.find(z => z.id === selectedZoneId) ?? null
  const selectedModule = selectedZone?.modules.find(m => m.id === selectedModuleId) ?? null
  const selectedCheckpoint = selectedModule?.checkpoints.find(cp => cp.id === selectedCheckpointId) ?? null

  const breadcrumb: { label: string; onClick: () => void }[] = [
    { label: "DSA Interview Trail", onClick: () => { setSelectedZoneId(null); setSelectedModuleId(null); setSelectedCheckpointId(null) } },
  ]
  if (selectedZone) breadcrumb.push({ label: selectedZone.title, onClick: () => { setSelectedModuleId(null); setSelectedCheckpointId(null) } })
  if (selectedModule) breadcrumb.push({ label: selectedModule.title, onClick: () => setSelectedCheckpointId(null) })
  if (selectedCheckpoint) breadcrumb.push({ label: selectedCheckpoint.title, onClick: () => {} })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#0F2A20] border-b border-white/10 px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBackToDashboard} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer text-gray-300 shrink-0" title="Back to dashboard">
            ←
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white truncate">DSA Interview Trail</h1>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider shrink-0 bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Draft
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider shrink-0 bg-[#38BDF8]/15 text-[#7DD3FC] border border-[#38BDF8]/30">
                Structured DSA Course
              </span>
              {isDirty && <span className="text-[10px] text-amber-400 font-semibold shrink-0">• Unsaved changes</span>}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {counts.zones} zones • {counts.modules} modules • {counts.checkpoints} checkpoints
              {errorCount > 0 && <span className="text-red-400 font-bold"> • {errorCount} validation error{errorCount === 1 ? "" : "s"}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveFlash && <span className="text-[11px] font-bold text-[#4FD8A8] mr-1">✓ {saveFlash}</span>}
          <button
            onClick={() => jumpToPreview({ zoneId: null, moduleId: null, checkpointId: null })}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
          >
            Preview Draft
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 cursor-pointer transition-all"
          >
            Reset Draft
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/25 cursor-pointer transition-all"
          >
            Save Draft
          </button>
          <button
            disabled
            title="Backend/version publishing will be enabled after integration."
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-white/5 border border-white/10 cursor-not-allowed opacity-50"
          >
            Publish
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#0A1F17] border-b border-white/10 px-6 flex items-center gap-1">
        {([
          ["curriculum", "Curriculum"],
          ["validation", `Validation${errorCount > 0 ? ` (${errorCount})` : ""}`],
          ["preview", "Preview Draft"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === key ? "border-[#1DB584] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Breadcrumb (curriculum tab only) */}
      {tab === "curriculum" && (
        <div className="bg-[#0A1F17] px-6 py-2.5 flex items-center gap-1.5 text-[11px] border-b border-white/5 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-600">›</span>}
              <button
                onClick={crumb.onClick}
                disabled={i === breadcrumb.length - 1}
                className={`cursor-pointer ${i === breadcrumb.length - 1 ? "text-white font-bold cursor-default" : "text-gray-400 hover:text-[#4FD8A8]"}`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      <main className="flex-1 min-h-0">
        {tab === "curriculum" && !selectedZone && (
          <DsaZoneList course={course} onChange={handleUpdate} onOpenZone={setSelectedZoneId} />
        )}
        {tab === "curriculum" && selectedZone && !selectedModule && (
          <DsaZoneEditor
            course={course}
            zone={selectedZone}
            onChange={handleUpdate}
            onOpenModule={setSelectedModuleId}
          />
        )}
        {tab === "curriculum" && selectedZone && selectedModule && !selectedCheckpoint && (
          <DsaModuleEditor
            course={course}
            zone={selectedZone}
            module={selectedModule}
            onChange={handleUpdate}
            onOpenCheckpoint={setSelectedCheckpointId}
            onPreviewModule={() => jumpToPreview({ zoneId: selectedZone.id, moduleId: selectedModule.id, checkpointId: null })}
          />
        )}
        {tab === "curriculum" && selectedZone && selectedModule && selectedCheckpoint && (
          <DsaCheckpointEditor
            course={course}
            zone={selectedZone}
            module={selectedModule}
            checkpoint={selectedCheckpoint}
            onChange={handleUpdate}
            onPreview={() => jumpToPreview({ zoneId: selectedZone.id, moduleId: selectedModule.id, checkpointId: selectedCheckpoint.id })}
          />
        )}

        {tab === "validation" && (
          <DsaValidationPanel
            issues={issues}
            onJumpTo={(zoneId, moduleId, checkpointId) => {
              setSelectedZoneId(zoneId ?? null)
              setSelectedModuleId(moduleId ?? null)
              setSelectedCheckpointId(checkpointId ?? null)
              setTab("curriculum")
            }}
          />
        )}

        {tab === "preview" && <DsaDraftPreview course={course} target={previewTarget} onTargetChange={setPreviewTarget} />}
      </main>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F2A20] border border-white/10 shadow-2xl p-7">
            <h2 className="text-lg font-black text-white mb-2">Reset draft to current static DSA?</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              This replaces every edit in this DSA draft with a fresh import of the current live DSA curriculum
              (7 zones, 29 modules, 107 checkpoints). It does not affect Python Foundations, any other Creator
              Studio course, learner progress, notes, Feedback, or Trail Guide history. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                Cancel
              </button>
              <button onClick={handleResetConfirmed} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-md cursor-pointer transition-all">
                Reset Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
