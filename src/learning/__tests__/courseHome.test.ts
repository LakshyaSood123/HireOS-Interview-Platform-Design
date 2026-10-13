import { beforeEach, describe, expect, it } from "vitest"
import { getUnifiedLibraryCourses } from "../libraryCourseSource"
import { cmsCourseHomeConfig, DSA_HOME, ML_HOME } from "../courseHomeConfig"
import { buildCourseStats, countCompleted } from "../courseHomeStats"
import { pinnedContentToLearnerCourse } from "../pinnedCourseAdapter"
import { mlPublishedV1Zones } from "../__fixtures__/mlPublishedV1"
import type { ProgressState } from "../types"

function installLocalStorage() {
  const store = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  }
}

describe("learner Course Library visibility", () => {
  beforeEach(() => installLocalStorage())

  // The two Python courses are published Creator Studio courses held in the
  // browser's localStorage, so a clean test environment has none. What is
  // deterministic is the built-in catalog: exactly these two.
  it("shows exactly two built-in courses: DSA and Machine Learning", () => {
    const titles = getUnifiedLibraryCourses().filter(c => c.source === "static").map(c => c.title).sort()
    expect(titles).toEqual(["Data Structures & Algorithms", "Machine Learning Foundations"])
  })

  it("never shows placeholder courses", () => {
    const ids = getUnifiedLibraryCourses().map(c => c.id)
    for (const placeholder of ["system-design", "dbms-essentials", "os-kernel", "networks", "behavioral-mastery"]) {
      expect(ids).not.toContain(placeholder)
    }
  })

  it("shows Data Structures & Algorithms and Machine Learning Foundations", () => {
    const ids = getUnifiedLibraryCourses().map(c => c.id)
    expect(ids).toContain("dsa-foundations")
    expect(ids).toContain("machine-learning-foundations")
  })

  it("every visible course is enterable (no Coming Soon cards)", () => {
    for (const course of getUnifiedLibraryCourses()) expect(["available", "recommended", "in-progress"]).toContain(course.status)
  })
})

describe("course home configuration", () => {
  it("DSA and ML have distinct destinations and heroes", () => {
    expect(DSA_HOME.heroVariant).not.toBe(ML_HOME.heroVariant)
    expect(ML_HOME.destinationName).toBe("Model Meadow")
    expect(DSA_HOME.destinationName).toBe("Algorithmic Forest")
  })

  it("two published courses get different hero variants", () => {
    const a = cmsCourseHomeConfig({ courseId: "a", title: "A", category: "Python", description: "d", position: 0 })
    const b = cmsCourseHomeConfig({ courseId: "b", title: "B", category: "Python", description: "d", position: 1 })
    expect(a.heroVariant).not.toBe(b.heroVariant)
  })
})

describe("course home stats come from the selected course", () => {
  const ml = pinnedContentToLearnerCourse({
    courseId: "machine-learning-foundations",
    versionId: "v1",
    title: "Machine Learning Foundations",
    courseType: "standard",
    zones: mlPublishedV1Zones,
  }).course

  it("counts zones, modules and lessons from the ML course data", () => {
    const stats = buildCourseStats({ zones: ml.zones, getCheckpointState: () => "available" })
    expect(stats.find(s => s.label === "Modules")?.value).toBe("1")
    expect(stats.find(s => s.label === "Lessons")?.value).toBe("3")
    expect(stats.find(s => s.label === "Progress")?.value).toBe("0 / 3")
  })

  it("counts completed lessons for progress", () => {
    const states: Record<string, ProgressState> = { "ml-foundations-1": "completed", "ml-foundations-2": "current", "ml-foundations-3": "locked" }
    const { done, total } = countCompleted(ml.zones, id => states[id])
    expect({ done, total }).toEqual({ done: 1, total: 3 })
  })
})
