import { useState, useEffect, useCallback, useMemo } from "react"
import type { CourseAuthoringRepository } from "../courseAuthoringRepository"
import type { CreatorCourse } from "../types"
import CourseDetailsEditor from "./CourseDetailsEditor"
import CurriculumBuilder from "./CurriculumBuilder"
import CreatorPreview from "./CreatorPreview"

interface CourseEditorShellProps {
  courseId: string
  repository: CourseAuthoringRepository
  onBackToDashboard: () => void
}

type Tab = "details" | "curriculum" | "preview"

export default function CourseEditorShell({ courseId, repository, onBackToDashboard }: CourseEditorShellProps) {
  const [course, setCourse] = useState<CreatorCourse | null>(() => repository.getCourse(courseId) ?? null)
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(repository.getCourse(courseId)))
  const [tab, setTab] = useState<Tab>("curriculum")
  const [saveFlash, setSaveFlash] = useState<string | null>(null)

  useEffect(() => {
    const found = repository.getCourse(courseId) ?? null
    setCourse(found)
    setSavedSnapshot(JSON.stringify(found))
  }, [courseId, repository])

  const isDirty = useMemo(() => course !== null && JSON.stringify(course) !== savedSnapshot, [course, savedSnapshot])

  const handleChange = useCallback((updated: CreatorCourse) => {
    setCourse(updated)
  }, [])

  const flash = (msg: string) => {
    setSaveFlash(msg)
    setTimeout(() => setSaveFlash(null), 2200)
  }

  const handleSaveDraft = () => {
    if (!course) return
    const saved = repository.saveDraft(course)
    setCourse(saved)
    setSavedSnapshot(JSON.stringify(saved))
    flash("Draft saved")
  }

  const handlePublish = () => {
    if (!course) return
    const saved = repository.saveDraft(course)
    const published = repository.publishDemo(saved.id)
    if (published) {
      setCourse(published)
      setSavedSnapshot(JSON.stringify(published))
      flash("Published as demo")
    }
  }

  const handleBack = () => {
    if (isDirty) {
      const ok = window.confirm("You have unsaved changes. Leave without saving? Your last saved draft will be kept.")
      if (!ok) return
    }
    onBackToDashboard()
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Course not found. <button onClick={onBackToDashboard} className="ml-2 text-[#1DB584] underline cursor-pointer">Back to dashboard</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#0F2A20] border-b border-white/10 px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer text-gray-300 shrink-0" title="Back to dashboard">
            ←
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white truncate">{course.title || "Untitled Course"}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider shrink-0 ${
                  course.status === "published-demo" ? "bg-[#1DB584]/20 text-[#4FD8A8] border border-[#1DB584]/40" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}
              >
                {course.status === "published-demo" ? "Published Demo" : "Draft"}
              </span>
              {isDirty && <span className="text-[10px] text-amber-400 font-semibold shrink-0">• Unsaved changes</span>}
            </div>
            <p className="text-[11px] text-gray-500 truncate">{course.modules.length} modules • v{course.version}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveFlash && <span className="text-[11px] font-bold text-[#4FD8A8] mr-1">✓ {saveFlash}</span>}
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/25 cursor-pointer transition-all"
          >
            {course.status === "published-demo" ? "Re-publish Demo" : "Publish Demo"}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#0A1F17] border-b border-white/10 px-6 flex items-center gap-1">
        {([
          ["details", "Course Details"],
          ["curriculum", "Curriculum Builder"],
          ["preview", "Preview as Learner"],
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

      <main className="flex-1 min-h-0">
        {tab === "details" && <CourseDetailsEditor course={course} onChange={handleChange} />}
        {tab === "curriculum" && <CurriculumBuilder course={course} onChange={handleChange} />}
        {tab === "preview" && <CreatorPreview course={course} />}
      </main>
    </div>
  )
}
