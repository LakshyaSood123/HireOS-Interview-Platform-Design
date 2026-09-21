import type { CreatorActivity } from "../types"
import LessonEditor from "./LessonEditor"
import QuickCheckEditor from "./QuickCheckEditor"
import CodingExerciseEditor from "./CodingExerciseEditor"

interface ActivityEditorProps {
  activity: CreatorActivity
  onChange: (activity: CreatorActivity) => void
}

const TYPE_LABEL: Record<CreatorActivity["type"], string> = {
  lesson: "Lesson",
  "quick-check": "Quick Check",
  coding: "Coding Exercise",
}
const TYPE_ICON: Record<CreatorActivity["type"], string> = {
  lesson: "📖",
  "quick-check": "❓",
  coding: "💻",
}

export default function ActivityEditor({ activity, onChange }: ActivityEditorProps) {
  return (
    <div className="max-w-3xl mx-auto px-7 py-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-base">{TYPE_ICON[activity.type]}</span>
        <span className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65]">{TYPE_LABEL[activity.type]}</span>
      </div>

      {activity.type === "lesson" && <LessonEditor activity={activity} onChange={onChange} />}
      {activity.type === "quick-check" && <QuickCheckEditor activity={activity} onChange={onChange} />}
      {activity.type === "coding" && <CodingExerciseEditor activity={activity} onChange={onChange} />}
    </div>
  )
}
