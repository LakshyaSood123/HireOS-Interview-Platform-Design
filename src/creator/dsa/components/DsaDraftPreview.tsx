// Real Draft Preview — CMS DSA draft -> dsaCmsAdapter -> canonical
// Course/Zone/Module/Checkpoint -> the REAL ModuleRoadmap and
// LessonWorkspace components (PART 17/18 of the task). Not a fake/
// simplified preview: these are the exact same components the live DSA
// course renders with.
//
// Isolation (PART 17): this NEVER touches AppStateContext, the real
// progress engine, or LocalProgressRepository. `isPreview={true}` is
// LessonWorkspace's own built-in non-mutating mode (already used by both
// the DSA "Demo Preview" flow and the standard CMS's CmsCourseRuntime) —
// `onComplete` always returns false, no XP is awarded, no checkpoint is
// marked complete. Coding checkpoints always use DisabledCodeRunner
// (never RoutingCodeRunner/PistonCodeRunner), so no draft-edited coding
// problem — including edits to an otherwise real Piston-eligible
// checkpoint — can ever reach the real execution allowlist from here.
// Notes are scoped under a distinct courseId suffix so preview notes never
// mix with a learner's real DSA notes.
//
// The zone/course-level landing below is NOT the scenic DSA World
// (BiomeTrailMap.tsx) — that file is protected and hardcodes exactly the 7
// real module ids with world-map coordinates, so it can't safely represent
// an arbitrary edited draft (new zones/modules the scenic map has never
// heard of). This lightweight list is the "appropriate DSA entry" for a
// draft that doesn't yet have scenic coordinates.

import { useEffect, useState } from "react"
import type { CreatorCourse } from "../../types"
import type { PreviewTarget } from "./DsaEditorShell"
import { cmsDsaCourseToLearnerCourse } from "../dsaCmsAdapter"
import { DisabledCodeRunner } from "../../disabledCodeRunner"
import { LocalNotesRepository } from "../../../learning/services/notesRepository"
import ModuleRoadmap from "../../../components/roadmap/ModuleRoadmap"
import LessonWorkspace from "../../../components/lesson/LessonWorkspace"
import type { ProgressState } from "../../../learning/types"

const previewRunner = new DisabledCodeRunner()
const previewNotesRepository = new LocalNotesRepository()

interface DsaDraftPreviewProps {
  course: CreatorCourse
  target: PreviewTarget
  onTargetChange: (target: PreviewTarget) => void
}

export default function DsaDraftPreview({ course, target, onTargetChange }: DsaDraftPreviewProps) {
  const [error, setError] = useState<string | null>(null)

  let learnerCourse
  try {
    learnerCourse = cmsDsaCourseToLearnerCourse(course, { activeOnly: true })
  } catch (err) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <p className="text-sm text-red-400">Preview unavailable: {err instanceof Error ? err.message : String(err)}</p>
      </div>
    )
  }

  const zone = learnerCourse.zones.find(z => z.id === target.zoneId) ?? null
  const module = zone?.modules.find(m => m.id === target.moduleId) ?? null
  const checkpoint = module?.checkpoints.find(cp => cp.id === target.checkpointId) ?? null

  // All-available preview progression — never mutating, never persisted,
  // entirely local to this render (see file header). A learner never
  // "unlocks" anything real by browsing a draft preview.
  const checkpointStates: Record<string, ProgressState> = {}
  if (module) {
    for (const cp of module.checkpoints) checkpointStates[cp.id] = "available"
  }

  useEffect(() => {
    setError(null)
  }, [target.zoneId, target.moduleId, target.checkpointId])

  if (module && checkpoint) {
    return (
      <div className="relative">
        <PreviewBadge />
        <LessonWorkspace
          key={checkpoint.id}
          checkpoint={checkpoint}
          moduleTitle={module.title}
          state="available"
          lives={3}
          runner={previewRunner}
          notesRepository={previewNotesRepository}
          courseId={`${learnerCourse.id}__draft-preview`}
          moduleId={module.id}
          isPreview
          onFailedSubmit={() => {}}
          onComplete={() => false}
          onContinue={() => {
            const idx = module.checkpoints.findIndex(cp => cp.id === checkpoint.id)
            const next = module.checkpoints[idx + 1]
            onTargetChange({ zoneId: zone!.id, moduleId: module.id, checkpointId: next ? next.id : null })
          }}
          onBack={() => onTargetChange({ zoneId: zone!.id, moduleId: module.id, checkpointId: null })}
        />
      </div>
    )
  }

  if (zone && module) {
    return (
      <div className="relative">
        <PreviewBadge />
        <ModuleRoadmap
          module={module}
          checkpointStates={checkpointStates}
          onEnterCheckpoint={checkpointId => onTargetChange({ zoneId: zone.id, moduleId: module.id, checkpointId })}
          onBack={() => onTargetChange({ zoneId: zone.id, moduleId: null, checkpointId: null })}
        />
      </div>
    )
  }

  if (zone) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PreviewBanner />
        <button onClick={() => onTargetChange({ zoneId: null, moduleId: null, checkpointId: null })} className="text-xs font-bold text-[#5B8854] hover:text-[#2F6747] cursor-pointer mb-4">
          ← DSA Interview Trail
        </button>
        <h2 className="text-2xl font-black text-[#1B3F2B] mb-1">{zone.title}</h2>
        <p className="text-sm text-gray-600 mb-6">{zone.description}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {zone.modules.map(m => (
            <button
              key={m.id}
              onClick={() => onTargetChange({ zoneId: zone.id, moduleId: m.id, checkpointId: null })}
              disabled={m.checkpoints.length === 0}
              className="text-left rounded-2xl bg-white border border-[#C2D6B8] p-4 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-bold text-[#1B3F2B]">{m.title}</span>
              </div>
              <p className="text-[11px] text-gray-500">{m.checkpoints.length} checkpoint{m.checkpoints.length === 1 ? "" : "s"}</p>
            </button>
          ))}
          {zone.modules.length === 0 && <p className="text-xs text-gray-500 col-span-2 text-center py-8">No active modules in this zone.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PreviewBanner />
      <h2 className="text-2xl font-black text-[#1B3F2B] mb-1">{learnerCourse.title}</h2>
      <p className="text-sm text-gray-600 mb-6">{learnerCourse.description}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {learnerCourse.zones.map(z => (
          <button
            key={z.id}
            onClick={() => onTargetChange({ zoneId: z.id, moduleId: null, checkpointId: null })}
            className="text-left rounded-2xl bg-white border border-[#C2D6B8] p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <span className="text-sm font-bold text-[#1B3F2B] block mb-1">{z.title}</span>
            <p className="text-[11px] text-gray-500">{z.modules.length} module{z.modules.length === 1 ? "" : "s"}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
    </div>
  )
}

function PreviewBanner() {
  return (
    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-700 border border-amber-400/40">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Draft Preview — not the live DSA course
    </div>
  )
}

function PreviewBadge() {
  return (
    <div className="sticky top-0 z-30 bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
        Draft Preview — isolated from real learner progress, no XP, no real code execution
      </span>
    </div>
  )
}
