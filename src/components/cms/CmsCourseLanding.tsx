import type { CreatorCourse } from "../../creator/types"
import type { Module } from "../../learning/types"

interface CmsCourseLandingProps {
  course: CreatorCourse
  modules: Module[]
  onEnterModule: (moduleId: string) => void
  onExit: () => void
}

/**
 * Course landing page for a published CMS course — the CMS equivalent of
 * what the DSA World Map is for the DSA course, but deliberately NOT a
 * fake Alpine world map. Content here comes entirely from the course's own
 * authored metadata (title/description/instructor/difficulty/duration),
 * never from DSA-specific copy like "Diagnostic Transfer Complete." Uses
 * Reagvis Trails' light course-library visual language so it reads as part
 * of the same product, not a separate CMS preview surface.
 */
export default function CmsCourseLanding({ course, modules, onEnterModule, onExit }: CmsCourseLandingProps) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 animate-fade-up">
      <button
        onClick={onExit}
        className="text-xs font-bold text-[#5B8854] hover:text-[#2F6747] cursor-pointer mb-4 inline-flex items-center gap-1.5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Course Library
      </button>

      <div className="rounded-[30px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-7 sm:p-9 shadow-[0_20px_50px_rgba(40,65,45,0.10)] mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xs flex-shrink-0"
            style={{ backgroundColor: `${course.accentColor ?? "#1DB584"}22`, border: `1px solid ${course.accentColor ?? "#1DB584"}55` }}
          >
            🎓
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-1">{course.category}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1B3F2B] tracking-tight">{course.title}</h1>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-5 max-w-2xl">{course.description ?? course.shortDescription}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 font-bold pt-4 border-t border-[#CBDCC4]">
          <span className="inline-flex items-center gap-1.5">👤 {course.instructor}</span>
          <span className="inline-flex items-center gap-1.5">📊 {course.difficulty}</span>
          <span className="inline-flex items-center gap-1.5">⏱️ {course.duration ?? "Self-paced"}</span>
          <span className="inline-flex items-center gap-1.5">📚 {modules.length} module{modules.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Modules</h2>
      <div className="space-y-4">
        {modules.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">This course has no modules yet.</p>}
        {modules.map((mod, idx) => (
          <div
            key={mod.id}
            className="rounded-[26px] bg-white border-2 border-[#C2D6B8] p-6 shadow-[0_15px_35px_rgba(40,65,45,0.06)] flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xs flex-shrink-0"
                style={{ backgroundColor: `${mod.accentColor}22`, border: `1px solid ${mod.accentColor}55` }}
              >
                {mod.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-0.5">Module {idx + 1}</span>
                <h3 className="text-base font-black text-[#1B3F2B]">{mod.title}</h3>
                {mod.description && <p className="text-xs text-gray-600 mt-0.5 max-w-md">{mod.description}</p>}
                <p className="text-[11px] text-gray-400 mt-1">{mod.checkpoints.length} activit{mod.checkpoints.length === 1 ? "y" : "ies"}</p>
              </div>
            </div>
            <button
              onClick={() => onEnterModule(mod.id)}
              className="px-5 py-2.5 rounded-full bg-[#5B8854] hover:bg-[#487342] text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0"
            >
              Enter Module ➔
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
