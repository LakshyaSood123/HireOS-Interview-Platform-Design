import { useState } from "react"
import CourseDetailsForm, { type CourseDetailsValue } from "./CourseDetailsForm"
import type { CreateCourseInput } from "../courseAuthoringRepository"

interface CourseDetailsModalProps {
  onClose: () => void
  onCreate: (input: CreateCourseInput) => void
}

const EMPTY: CourseDetailsValue = {
  title: "",
  shortDescription: "",
  description: "",
  category: "",
  difficulty: "Beginner",
  duration: "",
  instructor: "",
  tags: "",
  accentColor: "#1DB584",
}

export default function CourseDetailsModal({ onClose, onCreate }: CourseDetailsModalProps) {
  const [value, setValue] = useState<CourseDetailsValue>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof CourseDetailsValue, string>>>({})

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof CourseDetailsValue, string>> = {}
    if (!value.title.trim()) nextErrors.title = "Course title is required."
    if (!value.shortDescription.trim()) nextErrors.shortDescription = "A short description is required."
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onCreate({
      title: value.title.trim(),
      shortDescription: value.shortDescription.trim(),
      description: value.description.trim() || undefined,
      category: value.category.trim() || "General",
      difficulty: value.difficulty,
      duration: value.duration.trim() || undefined,
      instructor: value.instructor.trim() || "Demo Creator",
      tags: value.tags.split(",").map(t => t.trim()).filter(Boolean),
      thumbnailDataUrl: value.thumbnailDataUrl,
      accentColor: value.accentColor,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0F2A20] border border-white/10 shadow-2xl">
        <div className="px-7 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-1">Step 1 of 5</p>
            <h2 className="text-lg font-black text-white">Course Details</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer text-gray-400">
            ✕
          </button>
        </div>
        <div className="px-7 py-6">
          <CourseDetailsForm value={value} onChange={setValue} errors={errors} />
        </div>
        <div className="px-7 py-5 border-t border-white/10 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/25 cursor-pointer transition-all"
          >
            Continue to Curriculum →
          </button>
        </div>
      </div>
    </div>
  )
}
