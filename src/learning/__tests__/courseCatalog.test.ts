import { afterEach, describe, expect, it } from "vitest"

import { backendCourseHomeConfig, ML_HOME } from "../courseHomeConfig"
import { catalogEntryToLibraryCard, getCatalogEntry, setCourseCatalog, type CatalogEntry } from "../courseCatalog"
import { getCourseSourceDefinition, isBackendPinnedCourse, isBackendSyncedCourse } from "../courseSources"
import { getUnifiedLibraryCourses } from "../libraryCourseSource"
import { isCourseAvailable } from "../courseRegistry"

const entry = (courseId: string, over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  courseId,
  title: "CMS Manual Authoring QA",
  courseType: "standard",
  publishedVersion: "v1",
  lessonCount: 5,
  details: { subtitle: "", shortDescription: "Built by hand.", description: "Longer text.", category: "Testing", difficulty: "Beginner", duration: "20 minutes", instructor: "QA", tags: [], accentColor: "#1DB584" },
  ...over,
})

afterEach(() => setCourseCatalog([]))

describe("backend course catalog", () => {
  it("a published CMS course becomes a Course Library card with the same shape as the built-in cards", () => {
    const card = catalogEntryToLibraryCard(entry("manual-course"))
    expect(card).toMatchObject({ id: "manual-course", title: "CMS Manual Authoring QA", biomeTitle: "Testing", description: "Built by hand.", duration: "20 minutes", lessonCount: 5, status: "available", source: "backend" })
  })

  it("is registered as a backend-pinned, backend-synced course (opened exactly like Machine Learning) only once the catalog lists it", () => {
    expect(isBackendPinnedCourse("manual-course")).toBe(false)
    expect(isCourseAvailable("manual-course")).toBe(false)
    setCourseCatalog([entry("manual-course")])
    expect(isBackendPinnedCourse("manual-course")).toBe(true)
    expect(isBackendSyncedCourse("manual-course")).toBe(true)
    expect(isCourseAvailable("manual-course")).toBe(true)
    expect(getCourseSourceDefinition("manual-course")).toEqual({ id: "manual-course", source: "backend-pinned" })
    expect(getCatalogEntry("manual-course")?.title).toBe("CMS Manual Authoring QA")
  })

  it("never re-registers or replaces the built-in courses", () => {
    setCourseCatalog([entry("machine-learning-foundations"), entry("dsa-foundations")])
    expect(getCourseSourceDefinition("dsa-foundations")?.source).toBe("static")
    expect(getCourseSourceDefinition("machine-learning-foundations")?.source).toBe("backend-pinned")
  })

  it("library: built-in cards come first, catalog courses follow, and a catalog entry never duplicates a built-in card", () => {
    const base = getUnifiedLibraryCourses([]).map(c => c.id)
    const merged = getUnifiedLibraryCourses([entry("manual-course"), entry("machine-learning-foundations")])
    expect(merged.map(c => c.id)).toEqual([...base.filter(id => id !== "manual-course"), "manual-course"].filter((id, i, all) => all.indexOf(id) === i))
    expect(merged.filter(c => c.id === "machine-learning-foundations")).toHaveLength(1)
    expect(merged.find(c => c.id === "manual-course")?.source).toBe("backend")
  })

  it("home config: Machine Learning keeps its own config; other courses are built from their own details", () => {
    expect(backendCourseHomeConfig({ courseId: "machine-learning-foundations" })).toBe(ML_HOME)
    const home = backendCourseHomeConfig({ courseId: "manual-course", category: "Testing", description: "Longer text." })
    expect(home).toMatchObject({ courseId: "manual-course", destinationName: "Testing", description: "Longer text.", beginLabel: "Begin Trail" })
    expect(backendCourseHomeConfig({ courseId: "manual-course" }).heroVariant).toBe(home.heroVariant) // stable per course
  })
})
