// The learner-side catalog of courses that were created through the CMS and published (no code change per course).
//
// Why this exists: DSA and Machine Learning are registered statically (src/learning/courseSources.ts) and have hand-written Course
// Library cards. A course authored in Creator Studio has neither, so the backend lists it (GET /courses) and this store turns each
// entry into (a) a Course Library card and (b) a backend-pinned course registration, so the learner opens it through exactly the
// same path as Machine Learning: pinned published version -> Course Home -> Roadmap -> LessonWorkspace.

import { useSyncExternalStore } from "react"
import type { LibraryCourse } from "../data/reagvisCourses"
import type { ApiClient } from "./services/apiClient"
import { registerBackendPinnedCourses } from "./courseSources"

export interface CatalogCourseDetails {
  subtitle: string
  shortDescription: string
  description: string
  category: string
  difficulty: string
  duration: string
  instructor: string
  tags: string[]
  accentColor: string
}

export interface CatalogEntry {
  courseId: string
  title: string
  courseType: string
  publishedVersion: string
  lessonCount: number
  details: CatalogCourseDetails
}

let entries: readonly CatalogEntry[] = []
const listeners = new Set<() => void>()

export function setCourseCatalog(next: readonly CatalogEntry[]): void {
  entries = next
  registerBackendPinnedCourses(next.map(e => e.courseId))
  listeners.forEach(l => l())
}

export function getCourseCatalog(): readonly CatalogEntry[] {
  return entries
}

export function getCatalogEntry(courseId: string): CatalogEntry | undefined {
  return entries.find(e => e.courseId === courseId)
}

export function useCourseCatalog(): readonly CatalogEntry[] {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => entries,
  )
}

/** Loads the catalog from the backend. Failure leaves the previous catalog in place: the static courses still show. */
export async function loadCourseCatalog(client: ApiClient): Promise<void> {
  try {
    const res = await client.request<CatalogEntry[]>("GET", "/courses")
    setCourseCatalog(res.data)
  } catch {
    /* offline / signed out: keep what we have */
  }
}

/** Library card for a catalog entry. Same card shape and metadata fields as the static cards. */
export function catalogEntryToLibraryCard(entry: CatalogEntry): LibraryCourse & { source: "backend" } {
  const d = entry.details
  return {
    id: entry.courseId,
    title: entry.title,
    biomeTitle: d.category || "Creator Studio",
    biomeIcon: "🎓",
    accentColor: d.accentColor || "#1DB584",
    description: d.shortDescription,
    duration: d.duration || "Self-paced",
    lessonCount: entry.lessonCount,
    difficulty: d.difficulty as LibraryCourse["difficulty"],
    status: "available",
    source: "backend",
  }
}
