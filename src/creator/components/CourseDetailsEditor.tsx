import CourseDetailsForm, { type CourseDetailsValue } from "./CourseDetailsForm"
import type { CreatorCourse } from "../types"

interface CourseDetailsEditorProps {
  course: CreatorCourse
  onChange: (course: CreatorCourse) => void
}

function toFormValue(course: CreatorCourse): CourseDetailsValue {
  return {
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description ?? "",
    category: course.category,
    difficulty: course.difficulty,
    duration: course.duration ?? "",
    instructor: course.instructor,
    tags: course.tags.join(", "),
    thumbnailDataUrl: course.thumbnailDataUrl,
    accentColor: course.accentColor ?? "#1DB584",
  }
}

export default function CourseDetailsEditor({ course, onChange }: CourseDetailsEditorProps) {
  const handleFormChange = (value: CourseDetailsValue) => {
    onChange({
      ...course,
      title: value.title,
      shortDescription: value.shortDescription,
      description: value.description || undefined,
      category: value.category,
      difficulty: value.difficulty,
      duration: value.duration || undefined,
      instructor: value.instructor,
      tags: value.tags.split(",").map(t => t.trim()).filter(Boolean),
      thumbnailDataUrl: value.thumbnailDataUrl,
      accentColor: value.accentColor,
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-7 shadow-xl">
        <CourseDetailsForm value={toFormValue(course)} onChange={handleFormChange} />
      </div>
    </div>
  )
}
