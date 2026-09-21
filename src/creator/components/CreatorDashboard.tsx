import { useState, useMemo } from "react"
import type { CourseAuthoringRepository } from "../courseAuthoringRepository"
import type { CreatorCourse } from "../types"
import CourseDetailsModal from "./CourseDetailsModal"

interface CreatorDashboardProps {
  repository: CourseAuthoringRepository
  onOpenCourse: (id: string) => void
  onCourseCreated: (course: CreatorCourse) => void
  onExit: () => void
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

export default function CreatorDashboard({ repository, onOpenCourse, onCourseCreated, onExit }: CreatorDashboardProps) {
  const [courses, setCourses] = useState<CreatorCourse[]>(() => repository.listCourses())
  const [showCreateModal, setShowCreateModal] = useState(false)

  const drafts = useMemo(() => courses.filter(c => c.status === "draft"), [courses])
  const published = useMemo(() => courses.filter(c => c.status === "published-demo"), [courses])

  const handleCreated = (course: CreatorCourse) => {
    setShowCreateModal(false)
    onCourseCreated(course)
  }

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
        <div className="flex items-center gap-2 mb-4 text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>Demo Creator</span>
          <span className="opacity-40">•</span>
          <span>Local persistence only — not connected to a real backend</span>
        </div>

        {courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#0F2A20]/50 p-14 text-center">
            <p className="text-sm text-gray-400 mb-4">No courses yet. Start building your first trail.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] transition-all cursor-pointer"
            >
              + Create Course
            </button>
          </div>
        )}

        {courses.length > 0 && (
          <>
            <section className="mb-8">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-3">My Courses ({courses.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => (
                  <CourseCard key={c.id} course={c} onOpen={() => onOpenCourse(c.id)} />
                ))}
              </div>
            </section>

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
          onCreate={input => {
            const created = repository.createCourse(input)
            setCourses(repository.listCourses())
            handleCreated(created)
          }}
        />
      )}
    </div>
  )
}
