import { useEffect, useState, useMemo } from "react"
import type { CourseAuthoringRepository } from "../courseAuthoringRepository"
import type { CreatorCourse } from "../types"
import { useAuth } from "../../auth/AuthContext"
import { createCmsCourse, listCmsCourses, type CmsCourseSummary } from "../dsa/dsaCmsClient"
import CourseDetailsModal from "./CourseDetailsModal"

interface CreatorDashboardProps {
  repository: CourseAuthoringRepository
  onOpenCourse: (id: string) => void
  /** Opens a backend CMS course (DSA, Machine Learning, or one created in Creator Studio) in the structured editor. */
  onOpenCmsCourse: (courseId: string) => void
  /** A one-line success notice (for example after a course was permanently deleted). */
  notice?: string | null
  onDismissNotice?: () => void
  onExit: () => void
}

function BackendCourseCard({ course, onOpen }: { course: CmsCourseSummary; onOpen: () => void }) {
  const published = course.latestPublishedVersion
  return (
    <button
      onClick={onOpen}
      className="text-left w-full rounded-2xl bg-[#0F2A20] border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 p-5 transition-all cursor-pointer shadow-lg hover:shadow-[#38BDF8]/10 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-[#38BDF8]/15 border border-[#38BDF8]/40">🏔️</div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
            published ? "bg-[#1DB584]/20 text-[#4FD8A8] border border-[#1DB584]/40" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
          }`}
        >
          {published ? `Published ${published}` : "Draft only"}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-[#7DD3FC] transition-colors">{course.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3 min-h-[2.2em]">
        {course.details?.shortDescription || "Open the course to edit its zones, modules and lessons."}
      </p>
      <div className="flex items-center justify-between text-[10.5px] text-gray-500 pt-3 border-t border-white/10">
        <span>CMS course · zones → modules → checkpoints</span>
        <span>{course.creationSource === "manual" ? "Created in Creator Studio" : "Seeded course"}</span>
      </div>
    </button>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

function CourseCard({ course, onOpen }: { course: CreatorCourse; onOpen: () => void }) {
  const activityCount = course.modules.reduce((sum, m) => sum + m.activities.length, 0)
  return (
    <button
      onClick={onOpen}
      className="text-left w-full rounded-2xl bg-[#0F2A20] border border-white/10 hover:border-[#1DB584]/50 p-5 transition-all cursor-pointer shadow-lg hover:shadow-[#1DB584]/10 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${course.accentColor ?? "#1DB584"}22`, border: `1px solid ${course.accentColor ?? "#1DB584"}55` }}
        >
          🏔️
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
            course.status === "published-demo"
              ? "bg-[#1DB584]/20 text-[#4FD8A8] border border-[#1DB584]/40"
              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
          }`}
        >
          {course.status === "published-demo" ? "Published Demo" : "Draft"}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-[#4FD8A8] transition-colors">{course.title || "Untitled Course"}</h3>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3 min-h-[2.2em]">{course.shortDescription || "No description yet."}</p>
      <div className="flex items-center justify-between text-[10.5px] text-gray-500 pt-3 border-t border-white/10">
        <span>{course.modules.length} module{course.modules.length === 1 ? "" : "s"} • {activityCount} item{activityCount === 1 ? "" : "s"}</span>
        <span>Edited {formatDate(course.updatedAt)}</span>
      </div>
    </button>
  )
}

export default function CreatorDashboard({ repository, onOpenCourse, onOpenCmsCourse, notice, onDismissNotice, onExit }: CreatorDashboardProps) {
  const [courses] = useState<CreatorCourse[]>(() => repository.listCourses())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { client } = useAuth()
  const [cmsCourses, setCmsCourses] = useState<CmsCourseSummary[] | null>(null)
  const [cmsError, setCmsError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    listCmsCourses(client)
      .then(list => setCmsCourses(list))
      .catch(() => setCmsError("Couldn't load the CMS courses from the backend."))
  }, [client])

  // New courses are created through the backend CMS: the same canonical draft every other course uses (Basecamp first).
  const handleCreateCmsCourse = (input: Parameters<typeof createCmsCourse>[1]) => {
    if (creating) return
    setCreating(true)
    setCreateError(null)
    createCmsCourse(client, input)
      .then(({ course }) => {
        setShowCreateModal(false)
        onOpenCmsCourse(course.courseId)
      })
      .catch(error => setCreateError(error instanceof Error ? error.message : "Couldn't create the course."))
      .finally(() => setCreating(false))
  }

  const drafts = useMemo(() => courses.filter(c => c.status === "draft"), [courses])
  const published = useMemo(() => courses.filter(c => c.status === "published-demo"), [courses])


  return (
    <div className="min-h-screen w-full">
      {/* Topographic header band */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F2A20] to-[#0A1F17] border-b border-white/10 px-6 sm:px-10 py-8">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 200" fill="none">
          <path d="M0,150 Q100,100 200,140 T400,120 T600,150 T800,110" stroke="#1DB584" strokeWidth="1.5" fill="none" />
          <path d="M0,170 Q100,130 200,160 T400,145 T600,170 T800,135" stroke="#1DB584" strokeWidth="1" fill="none" />
          <path d="M0,190 Q100,160 200,180 T400,170 T600,190 T800,160" stroke="#A7CE65" strokeWidth="1" fill="none" />
        </svg>
        <div className="relative z-10 max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl">🧭</span>
              <span className="text-[10.5px] font-black uppercase tracking-[0.15em] text-[#A7CE65]">Reagvis Labs • Demo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Creator Studio</h1>
            <p className="text-sm text-gray-400 mt-1">Build and manage learning experiences.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              ← Exit to Reagvis Trails
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Create Course</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-8">
        {notice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-[#1DB584]/15 border border-[#1DB584]/40 px-4 py-3 text-xs font-bold text-[#4FD8A8]">
            <span>✓ {notice}</span>
            <button onClick={onDismissNotice} className="text-[#4FD8A8]/80 hover:text-white cursor-pointer" aria-label="Dismiss notice">✕</button>
          </div>
        )}
        <div className="flex items-center gap-2 mb-4 text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>CMS courses are saved to the backend as editable drafts</span>
          <span className="opacity-40">•</span>
          <span>Local demo drafts below are stored in this browser only</span>
        </div>

        <section className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-3">CMS Courses ({cmsCourses?.length ?? 0})</h2>
          {cmsError && <p className="text-xs text-red-400 mb-3">{cmsError}</p>}
          {cmsCourses === null && !cmsError && <p className="text-xs text-gray-500">Loading courses…</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cmsCourses ?? []).map(c => (
              <BackendCourseCard key={c.courseId} course={c} onOpen={() => onOpenCmsCourse(c.courseId)} />
            ))}
          </div>
        </section>

        {courses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Local demo drafts — this browser only ({courses.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(c => (
                <CourseCard key={c.id} course={c} onOpen={() => onOpenCourse(c.id)} />
              ))}
            </div>
          </section>
        )}

        {courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-300/90 mb-3">Drafts ({drafts.length})</h2>
                {drafts.length === 0 ? (
                  <p className="text-xs text-gray-500">No drafts.</p>
                ) : (
                  <div className="space-y-2">
                    {drafts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onOpenCourse(c.id)}
                        className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-gray-200 truncate">{c.title || "Untitled Course"}</span>
                        <span className="text-[10px] text-gray-500 shrink-0 ml-3">{formatDate(c.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#4FD8A8] mb-3">Published Demo Courses ({published.length})</h2>
                {published.length === 0 ? (
                  <p className="text-xs text-gray-500">Nothing published yet.</p>
                ) : (
                  <div className="space-y-2">
                    {published.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onOpenCourse(c.id)}
                        className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-[#1DB584]/10 hover:bg-[#1DB584]/15 border border-[#1DB584]/25 transition-all cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-gray-200 truncate">{c.title || "Untitled Course"}</span>
                        <span className="text-[10px] text-gray-500 shrink-0 ml-3">{formatDate(c.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <CourseDetailsModal
          onClose={() => setShowCreateModal(false)}
          onCreate={input =>
            handleCreateCmsCourse({
              title: input.title,
              shortDescription: input.shortDescription,
              description: input.description,
              category: input.category,
              difficulty: input.difficulty,
              duration: input.duration,
              instructor: input.instructor,
              tags: input.tags,
              accentColor: input.accentColor,
            })
          }
          busy={creating}
          error={createError}
        />
      )}
    </div>
  )
}
