import { beforeEach, describe, expect, it } from "vitest"
import { completeCheckpoint, resolveCheckpointState, type LearnerProgressState } from "../progressEngine"
import { LocalProgressRepository } from "../progressRepository"
import { pinnedContentToLearnerCourse } from "../pinnedCourseAdapter"
import { mlPublishedV1Zones } from "../__fixtures__/mlPublishedV1"
import { findCheckpoint } from "../courseRegistry"

// In-memory localStorage so LocalProgressRepository runs unmodified.
function installLocalStorage() {
  const store = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  }
}

const mlCourse = pinnedContentToLearnerCourse({
  courseId: "machine-learning-foundations",
  versionId: "v1",
  title: "Machine Learning Foundations",
  courseType: "standard",
  zones: mlPublishedV1Zones,
}).course

function mlStart(): LearnerProgressState {
  return {
    activeCourseId: "machine-learning-foundations",
    activeZoneId: "ml-basecamp",
    activeModuleId: "ml-foundations",
    activeCheckpointId: "ml-foundations-1",
    completedCheckpointIds: [],
    masteredCheckpointIds: [],
    xp: 0,
    streak: 0,
    lives: 3,
    lastActivityDate: null,
  }
}

// A DSA-shaped record that must never be touched by ML activity.
const dsaProgress: LearnerProgressState = {
  activeCourseId: "dsa-foundations",
  activeZoneId: "recursive-forest",
  activeModuleId: "trees",
  activeCheckpointId: "trees-1",
  completedCheckpointIds: ["foundations-1", "foundations-2"],
  masteredCheckpointIds: [],
  xp: 1240,
  streak: 7,
  lives: 3,
  lastActivityDate: null,
}

describe("ML checkpoint progression", () => {
  it("1 is current, 2 and 3 are locked until their prerequisite is completed", () => {
    const progress = mlStart()
    const [cp1, cp2, cp3] = ["ml-foundations-1", "ml-foundations-2", "ml-foundations-3"].map(id => findCheckpoint(mlCourse, id)!)
    expect(resolveCheckpointState(cp1, progress)).toBe("current")
    expect(resolveCheckpointState(cp2, progress)).toBe("locked")
    expect(resolveCheckpointState(cp3, progress)).toBe("locked")
  })

  it("completing checkpoint 1 awards XP once and unlocks checkpoint 2 only", () => {
    const after = completeCheckpoint(mlCourse, mlStart(), "ml-foundations-1", "2026-10-06")
    expect(after.completedCheckpointIds).toEqual(["ml-foundations-1"])
    expect(after.xp).toBe(30)
    const cp2 = findCheckpoint(mlCourse, "ml-foundations-2")!
    const cp3 = findCheckpoint(mlCourse, "ml-foundations-3")!
    expect(resolveCheckpointState(cp2, after)).not.toBe("locked")
    expect(resolveCheckpointState(cp3, after)).toBe("locked")
  })
})

describe("ML progress isolation from DSA", () => {
  beforeEach(() => installLocalStorage())

  it("completing an ML checkpoint leaves stored DSA progress unchanged", () => {
    const repo = new LocalProgressRepository()
    repo.save(dsaProgress)
    const dsaBefore = repo.load("dsa-foundations")

    const mlAfter = completeCheckpoint(mlCourse, mlStart(), "ml-foundations-1", "2026-10-06")
    repo.save(mlAfter)

    expect(repo.load("dsa-foundations")).toEqual(dsaBefore)
    expect(repo.load("machine-learning-foundations")?.completedCheckpointIds).toEqual(["ml-foundations-1"])
  })

  it("DSA completion ids and XP never appear in ML progress", () => {
    const repo = new LocalProgressRepository()
    repo.save(dsaProgress)
    repo.save(mlStart())
    expect(repo.load("machine-learning-foundations")?.completedCheckpointIds).toEqual([])
    expect(repo.load("dsa-foundations")?.xp).toBe(1240)
  })
})
