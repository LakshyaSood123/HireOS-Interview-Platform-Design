import { useEffect, useMemo, useState } from "react"
import type { CreatorCourse } from "../../types"
import { validateDsaDraft } from "../dsaDraftValidation"
import {
  activateCmsVersion,
  CmsRevisionConflictError,
  listCmsVersions,
  loadCmsDraft,
  publishCmsDraft,
  resetCmsDraftToPublished,
  saveCmsDraft,
  validateCmsDraft,
  CMS_DSA_COURSE_ID,
  CMS_EDITABLE_COURSES,
  type CmsDraft,
  type CmsValidationIssue,
  type CmsVersionSummary,
} from "../dsaCmsClient"
import { ApiRequestError, ApiUnavailableError } from "../../../learning/services/apiClient"
import { useAuth } from "../../../auth/AuthContext"
import DsaZoneList from "./DsaZoneList"
import DsaZoneEditor from "./DsaZoneEditor"
import DsaModuleEditor from "./DsaModuleEditor"
import DsaCheckpointEditor from "./DsaCheckpointEditor"
import DsaValidationPanel from "./DsaValidationPanel"
import DsaDraftPreview from "./DsaDraftPreview"

interface DsaEditorShellProps {
  onBackToDashboard: () => void
}

type Tab = "curriculum" | "validation" | "preview" | "versions"
type LoadState = "loading" | "ready" | "error"

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
  }
}

function draftToCourse(draft: CmsDraft, courseId: string): CreatorCourse {
  return {
    id: courseId,
    title: draft.title,
    courseType: "structured-dsa",
    dsaZones: draft.zones,
    updatedAt: new Date().toISOString(),
  } as CreatorCourse
}

/** Draft canonical source is the backend CMS — see dsaCmsClient.ts. This
 * shell no longer reads/writes localStorage as the source of truth; it only
 * holds the currently-loaded draft and its server revision in React state. */
export default function DsaEditorShell({ onBackToDashboard }: DsaEditorShellProps) {
  const { client } = useAuth()
  // Which backend CMS course the editor is working on. DSA is the default;
  // Machine Learning Foundations is the second course (see CMS_EDITABLE_COURSES).
  const [cmsCourseId, setCmsCourseId] = useState<string>(CMS_DSA_COURSE_ID)
  const isDsaCourse = cmsCourseId === CMS_DSA_COURSE_ID
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [course, setCourse] = useState<CreatorCourse | null>(null)
  const [revision, setRevision] = useState<number>(0)
  const [savedSnapshot, setSavedSnapshot] = useState<string>("")

  const [tab, setTab] = useState<Tab>("curriculum")
  const [saveFlash, setSaveFlash] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ currentRevision: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState<"static" | "published" | null>(null)

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null)
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>({ zoneId: null, moduleId: null, checkpointId: null })

  const [publishing, setPublishing] = useState(false)
  const [publishIssues, setPublishIssues] = useState<CmsValidationIssue[] | null>(null)
  const [publishFlash, setPublishFlash] = useState<string | null>(null)

  const [versions, setVersions] = useState<CmsVersionSummary[] | null>(null)
  const [activeVersion, setActiveVersion] = useState<string | null>(null)
  const [versionsError, setVersionsError] = useState<string | null>(null)
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState(false)

  const loadDraft = () => {
    setLoadState("loading")
    setLoadError(null)
    loadCmsDraft(client, cmsCourseId)
      .then(draft => {
        const loaded = draftToCourse(draft, cmsCourseId)
        setCourse(loaded)
        setRevision(draft.revision)
        setSavedSnapshot(JSON.stringify(loaded.dsaZones))
        setLoadState("ready")
      })
      .catch(error => {
        setLoadState("error")
        setLoadError(
          error instanceof ApiRequestError
            ? error.message
            : error instanceof ApiUnavailableError
              ? "Can't reach the CMS backend right now."
              : "Couldn't load the draft.",
        )
      })
  }

  useEffect(loadDraft, [client, cmsCourseId])

  // Switching courses replaces the draft in view. Unsaved edits to the current
  // draft would be lost, so the author confirms first.
  const handleCourseChange = (nextCourseId: string) => {
    if (nextCourseId === cmsCourseId) return
    if (isDirty && !window.confirm("Discard your unsaved changes to this draft and switch courses?")) return
    setCmsCourseId(nextCourseId)
    setSelectedZoneId(null)
    setSelectedModuleId(null)
    setSelectedCheckpointId(null)
    setPreviewTarget({ zoneId: null, moduleId: null, checkpointId: null })
    setVersions(null)
    setConflict(null)
    setSaveError(null)
  }

  const isDirty = useMemo(() => (course ? JSON.stringify(course.dsaZones) !== savedSnapshot : false), [course, savedSnapshot])
  const counts = useMemo(() => (course ? countAll(course) : { zones: 0, modules: 0, checkpoints: 0 }), [course])
  const issues = useMemo(() => (course ? validateDsaDraft(course) : []), [course])
  const errorCount = issues.filter(i => i.severity === "error").length

  const flash = (msg: string) => {
    setSaveFlash(msg)
    setTimeout(() => setSaveFlash(null), 2200)
  }

  const handleUpdate = (updated: CreatorCourse) => {
    setCourse(updated)
    setConflict(null)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!course || saving) return
    setSaving(true)
    setSaveError(null)
    setConflict(null)
    try {
      const saved = await saveCmsDraft(client, cmsCourseId, course.dsaZones ?? [], revision)
      const nextCourse = draftToCourse(saved, cmsCourseId)
      setCourse(nextCourse)
      setRevision(saved.revision)
      setSavedSnapshot(JSON.stringify(nextCourse.dsaZones))
      flash("Draft saved")
    } catch (error) {
      if (error instanceof CmsRevisionConflictError) {
        setConflict({ currentRevision: error.currentRevision })
      } else if (error instanceof ApiUnavailableError) {
        setSaveError("Can't reach the CMS backend — your edits are still here, but nothing was saved. Try again.")
      } else {
        setSaveError(error instanceof ApiRequestError ? error.message : "Couldn't save the draft.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReloadServerDraft = () => {
    setConflict(null)
    loadDraft()
  }

  const handleResetConfirmed = async (kind: "static" | "published") => {
    setShowResetConfirm(null)
    if (kind === "static" && !isDsaCourse) {
      // The static reset imports the DSA curriculum. It must never overwrite
      // another course's draft.
      setSaveError("The static reset only applies to the DSA course. Use Reset to Published for this course.")
      return
    }
    if (kind === "static") {
      // Client-side only: replaces the in-memory draft with a fresh import
      // of the current static frontend DSA course. NOT saved automatically —
      // the admin still has to click Save Draft, exactly like any other edit.
      const { importStaticDsaCourse } = await import("../dsaImporter")
      const fresh = importStaticDsaCourse()
      setCourse(fresh)
      flash("Draft reset to current static DSA (unsaved — click Save Draft to keep it)")
      return
    }
    // Server-side: discards the draft entirely and recreates it from the
    // currently active PUBLISHED version — a different, already-persisted
    // operation from the client-side reset above.
    setSaving(true)
    try {
      const reset = await resetCmsDraftToPublished(client, cmsCourseId)
      const nextCourse = draftToCourse(reset, cmsCourseId)
      setCourse(nextCourse)
      setRevision(reset.revision)
      setSavedSnapshot(JSON.stringify(nextCourse.dsaZones))
      flash("Draft reset to the currently published version")
    } catch (error) {
      setSaveError(error instanceof ApiRequestError ? error.message : "Couldn't reset the draft.")
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (publishing) return
    setPublishing(true)
    setPublishIssues(null)
    try {
      const result = await publishCmsDraft(client, cmsCourseId)
      setPublishFlash(`Published ${result.snapshotVersion} (${result.snapshotCheckpointCount} checkpoints)`)
      setTimeout(() => setPublishFlash(null), 4000)
      loadDraft() // publishing recreates a fresh draft server-side
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "VALIDATION_ERROR" && Array.isArray(error.details?.issues)) {
        setPublishIssues(error.details.issues as CmsValidationIssue[])
        setTab("validation")
      } else {
        setSaveError(error instanceof ApiRequestError ? error.message : "Couldn't publish.")
      }
    } finally {
      setPublishing(false)
    }
  }

  const loadVersions = () => {
    setVersionsError(null)
    listCmsVersions(client, cmsCourseId)
      .then(setVersions)
      .catch(error => setVersionsError(error instanceof ApiRequestError ? error.message : "Couldn't load versions."))
  }

  useEffect(() => {
    if (tab === "versions") loadVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (course) setActiveVersion(null) // active marker comes from the versions list itself
  }, [course])

  const handleRollback = async (versionId: string) => {
    setRollingBack(true)
    try {
      await activateCmsVersion(client, cmsCourseId, versionId)
      setActiveVersion(versionId)
      loadVersions()
      flash(`Rolled back to ${versionId}`)
    } catch (error) {
      setVersionsError(error instanceof ApiRequestError ? error.message : "Couldn't roll back.")
    } finally {
      setRollingBack(false)
      setRollbackTarget(null)
    }
  }

  if (loadState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1DB584]/30 border-t-[#1DB584] animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading draft from CMS…</p>
        </div>
      </div>
    )
  }

  if (loadState === "error" || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center rounded-3xl bg-white/[0.04] border border-white/10 p-8">
          <h1 className="text-lg font-black text-white mb-2">Couldn't load the draft</h1>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">{loadError}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={onBackToDashboard} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer">
              Back
            </button>
            <button onClick={loadDraft} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectedZone = course.dsaZones?.find(z => z.id === selectedZoneId) ?? null
  const selectedModule = selectedZone?.modules.find(m => m.id === selectedModuleId) ?? null
  const selectedCheckpoint = selectedModule?.checkpoints.find(cp => cp.id === selectedCheckpointId) ?? null

  const jumpToPreview = (target: PreviewTarget) => {
    setPreviewTarget(target)
    setTab("preview")
  }

  const breadcrumb: { label: string; onClick: () => void }[] = [
    { label: "DSA Interview Trail", onClick: () => { setSelectedZoneId(null); setSelectedModuleId(null); setSelectedCheckpointId(null) } },
  ]
  if (selectedZone) breadcrumb.push({ label: selectedZone.title, onClick: () => { setSelectedModuleId(null); setSelectedCheckpointId(null) } })
  if (selectedModule) breadcrumb.push({ label: selectedModule.title, onClick: () => setSelectedCheckpointId(null) })
  if (selectedCheckpoint) breadcrumb.push({ label: selectedCheckpoint.title, onClick: () => {} })

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#0F2A20] border-b border-white/10 px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBackToDashboard} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer text-gray-300 shrink-0" title="Back to dashboard">
            ←
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label="Course"
                value={cmsCourseId}
                onChange={e => handleCourseChange(e.target.value)}
                className="text-sm font-black text-white bg-transparent border border-white/15 rounded-md px-2 py-0.5 cursor-pointer"
              >
                {CMS_EDITABLE_COURSES.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0b1d16]">
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider shrink-0 bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Draft · CMS backend
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider shrink-0 bg-[#38BDF8]/15 text-[#7DD3FC] border border-[#38BDF8]/30">
                rev {revision}
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
          {publishFlash && <span className="text-[11px] font-bold text-[#4FD8A8] mr-1">✓ {publishFlash}</span>}
          <button
            onClick={() => jumpToPreview({ zoneId: null, moduleId: null, checkpointId: null })}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
          >
            Preview Draft
          </button>
          <button
            onClick={() => setShowResetConfirm("static")}
            disabled={!isDsaCourse}
            title={isDsaCourse
              ? "Replace the draft with a fresh import of the current static frontend DSA course (unsaved until you Save Draft)"
              : "Only available for the DSA course"}
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 cursor-pointer transition-all"
          >
            Reset to Static DSA
          </button>
          <button
            onClick={() => setShowResetConfirm("published")}
            title="Discard the draft and recreate it from the currently published version — saved immediately"
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 cursor-pointer transition-all"
          >
            Reset to Published
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!conflict}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/25 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !!conflict}
            title="Runs full backend validation and creates a new immutable version"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] hover:opacity-90 shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      {conflict && (
        <div role="alert" className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-amber-200">
            Someone (possibly you, in another tab) saved a newer draft — this is revision {revision}, the server is on {conflict.currentRevision}. Your edits here have NOT been overwritten
            or lost, but they can't be saved until you reload the server's draft.
          </p>
          <button onClick={handleReloadServerDraft} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 cursor-pointer shrink-0">
            Reload Server Draft
          </button>
        </div>
      )}
      {saveError && (
        <div role="alert" className="bg-red-500/10 border-b border-red-500/30 px-6 py-2.5 text-xs text-red-200">
          {saveError}
        </div>
      )}

      <div className="bg-[#0A1F17] border-b border-white/10 px-6 flex items-center gap-1">
        {([
          ["curriculum", "Curriculum"],
          ["validation", `Validation${errorCount > 0 ? ` (${errorCount})` : ""}`],
          ["preview", "Preview Draft"],
          ["versions", "Versions"],
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
        {tab === "curriculum" && !selectedZone && <DsaZoneList course={course} onChange={handleUpdate} onOpenZone={setSelectedZoneId} />}
        {tab === "curriculum" && selectedZone && !selectedModule && (
          <DsaZoneEditor course={course} zone={selectedZone} onChange={handleUpdate} onOpenModule={setSelectedModuleId} />
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
          <div>
            {publishIssues && (
              <div className="mx-6 mt-4 rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-xs font-bold text-red-300 mb-2">Publish failed — the backend rejected {publishIssues.length} issue{publishIssues.length === 1 ? "" : "s"}:</p>
                <ul className="text-[11px] text-red-200 space-y-1 list-disc pl-4">
                  {publishIssues.map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <DsaValidationPanel
              issues={issues}
              onJumpTo={(zoneId, moduleId, checkpointId) => {
                setSelectedZoneId(zoneId ?? null)
                setSelectedModuleId(moduleId ?? null)
                setSelectedCheckpointId(checkpointId ?? null)
                setTab("curriculum")
              }}
            />
          </div>
        )}

        {tab === "preview" && <DsaDraftPreview course={course} target={previewTarget} onTargetChange={setPreviewTarget} />}

        {tab === "versions" && (
          <div className="max-w-3xl mx-auto px-6 py-6">
            <h2 className="text-sm font-black text-white mb-1">Published Versions</h2>
            <p className="text-xs text-gray-500 mb-5">
              Each Publish freezes the draft into a new immutable version. Rolling back activates an existing version — it never deletes or edits any version.
            </p>
            {versionsError && <p className="text-xs text-red-300 mb-3">{versionsError}</p>}
            {!versions ? (
              <p className="text-xs text-gray-500">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="text-xs text-gray-500">No published versions yet.</p>
            ) : (
              <div className="space-y-2">
                {versions.map(v => (
                  <div key={v.versionId} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {v.versionId}
                        {activeVersion === v.versionId && (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-[#1DB584]/15 text-[#4FD8A8] border border-[#1DB584]/30">Active</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {v.publishedAt ? `Published ${new Date(v.publishedAt).toLocaleString()}` : "Not published"}
                        {v.createdFromVersion && ` · from ${v.createdFromVersion}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setRollbackTarget(v.versionId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                    >
                      Activate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F2A20] border border-white/10 shadow-2xl p-7">
            <h2 className="text-lg font-black text-white mb-2">
              {showResetConfirm === "static" ? "Reset draft to current static DSA?" : "Reset draft to the currently published version?"}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              {showResetConfirm === "static"
                ? "Replaces every edit in this draft with a fresh import of the current live frontend DSA curriculum (7 zones, 29 modules, 107 checkpoints). Not saved automatically — you still need to click Save Draft. It does not affect any other course, learner progress, notes, or the currently published CMS version."
                : "Discards this draft entirely and recreates it from whatever is currently published in the CMS — saved to the backend immediately. It does not affect any published version."}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowResetConfirm(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                Cancel
              </button>
              <button onClick={() => handleResetConfirmed(showResetConfirm)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-md cursor-pointer transition-all">
                Reset Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {rollbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F2A20] border border-white/10 shadow-2xl p-7">
            <h2 className="text-lg font-black text-white mb-2">Activate {rollbackTarget}?</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Learners currently pinned to another version keep reading their own pinned version — this only changes what a NEW read of "published" resolves to. No version is deleted or modified.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setRollbackTarget(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleRollback(rollbackTarget)}
                disabled={rollingBack}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {rollingBack ? "Activating…" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
