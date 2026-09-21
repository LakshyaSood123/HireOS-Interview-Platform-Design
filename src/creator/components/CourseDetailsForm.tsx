import { useRef } from "react"
import { CMS_ACCENT_COLORS, type CmsDifficulty } from "../types"

export interface CourseDetailsValue {
  title: string
  shortDescription: string
  description: string
  category: string
  difficulty: CmsDifficulty
  duration: string
  instructor: string
  tags: string
  thumbnailDataUrl?: string
  accentColor: string
}

interface CourseDetailsFormProps {
  value: CourseDetailsValue
  onChange: (value: CourseDetailsValue) => void
  errors?: Partial<Record<keyof CourseDetailsValue, string>>
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

export default function CourseDetailsForm({ value, onChange, errors }: CourseDetailsFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof CourseDetailsValue>(key: K, v: CourseDetailsValue[K]) => onChange({ ...value, [key]: v })

  const handleThumbnail = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set("thumbnailDataUrl", String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-5 items-start">
        <div>
          <label className={LABEL_CLASS}>Course Name *</label>
          <input className={FIELD_CLASS} value={value.title} onChange={e => set("title", e.target.value)} placeholder="Introduction to Python" />
          {errors?.title && <p className="text-[11px] text-red-400 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Thumbnail</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-[42px] rounded-xl border border-dashed border-white/20 hover:border-[#1DB584]/50 bg-black/20 flex items-center justify-center overflow-hidden cursor-pointer transition-colors"
          >
            {value.thumbnailDataUrl ? (
              <img src={value.thumbnailDataUrl} alt="Course thumbnail" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10.5px] text-gray-500">Upload image</span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleThumbnail(e.target.files?.[0])} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Short Description *</label>
        <input
          className={FIELD_CLASS}
          value={value.shortDescription}
          onChange={e => set("shortDescription", e.target.value)}
          placeholder="Learn Python fundamentals through interactive lessons."
        />
        {errors?.shortDescription && <p className="text-[11px] text-red-400 mt-1">{errors.shortDescription}</p>}
      </div>

      <div>
        <label className={LABEL_CLASS}>Detailed Description (optional)</label>
        <textarea
          className={`${FIELD_CLASS} resize-none`}
          rows={3}
          value={value.description}
          onChange={e => set("description", e.target.value)}
          placeholder="A deeper description shown on the course landing page…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLASS}>Category</label>
          <input className={FIELD_CLASS} value={value.category} onChange={e => set("category", e.target.value)} placeholder="Computer Science" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Difficulty</label>
          <select className={FIELD_CLASS} value={value.difficulty} onChange={e => set("difficulty", e.target.value as CmsDifficulty)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Estimated Duration</label>
          <input className={FIELD_CLASS} value={value.duration} onChange={e => set("duration", e.target.value)} placeholder="3 hours" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Instructor Name</label>
          <input className={FIELD_CLASS} value={value.instructor} onChange={e => set("instructor", e.target.value)} placeholder="Dr. Example" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Tags (comma separated)</label>
          <input className={FIELD_CLASS} value={value.tags} onChange={e => set("tags", e.target.value)} placeholder="python, beginner, programming" />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Course Theme / Accent (optional)</label>
        <div className="flex items-center gap-2">
          {CMS_ACCENT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => set("accentColor", color)}
              className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${value.accentColor === color ? "border-white scale-110" : "border-white/20"}`}
              style={{ backgroundColor: color }}
              aria-label={`Use accent ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
