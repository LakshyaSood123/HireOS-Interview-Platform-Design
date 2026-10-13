import { describe, expect, it } from "vitest"
import { pinnedContentToLearnerCourse } from "../pinnedCourseAdapter"
import { cmsZonesToLearnerZones } from "../../creator/dsa/dsaCmsAdapter"
import { mlPublishedV1Zones, ML_CHECKPOINT_IDS, ML_PACKAGE_ID } from "../__fixtures__/mlPublishedV1"

const content = {
  courseId: "machine-learning-foundations",
  versionId: "v1",
  title: "Machine Learning Foundations",
  courseType: "standard",
  zones: mlPublishedV1Zones,
}

describe("backend-pinned CMS → learner course adapter", () => {
  const { course, versionId } = pinnedContentToLearnerCourse(content)

  it("produces 1 zone, 1 module, 3 checkpoints from published v1", () => {
    expect(versionId).toBe("v1")
    expect(course.id).toBe("machine-learning-foundations")
    expect(course.zones).toHaveLength(1)
    expect(course.zones[0].modules).toHaveLength(1)
    expect(course.zones[0].modules[0].checkpoints).toHaveLength(3)
  })

  it("preserves ids, titles, XP and the 1 → 2 → 3 prerequisite chain", () => {
    const module = course.zones[0].modules[0]
    expect(module.id).toBe("ml-foundations")
    expect(module.checkpoints.map(cp => cp.id)).toEqual([...ML_CHECKPOINT_IDS])
    expect(module.checkpoints.map(cp => cp.xp)).toEqual([30, 30, 30])
    expect(module.checkpoints[0].prerequisites).toEqual([])
    expect(module.checkpoints[1].prerequisites).toEqual(["ml-foundations-1"])
    expect(module.checkpoints[2].prerequisites).toEqual(["ml-foundations-2"])
    expect(module.checkpoints[2].title).toBe("Linear Regression — The Line That Learns")
  })

  it("keeps theory and quick check, and marks modules as Lesson Workspace modules", () => {
    const module = course.zones[0].modules[0]
    expect(module.contentKind).toBe("workspace")
    const cp1 = module.checkpoints[0]
    expect(cp1.workspace?.theory[0].heading).toBe("Idea")
    expect(cp1.workspace?.quickCheck?.correctIndex).toBe(1)
  })

  it("carries the custom animation as a frozen-revision reference, not as a registered animation", () => {
    const cp = course.zones[0].modules[0].checkpoints[0]
    expect(cp.workspace?.animation).toBeUndefined()
    expect(cp.workspace?.customAnimation).toEqual({
      packageId: ML_PACKAGE_ID,
      revisionId: "r1",
      title: "What is Machine Learning?",
      bridgeMode: "synchronized",
    })
  })

  it("does NOT emit customAnimation for the DSA/preview path (flag off by default)", () => {
    const dsaStyle = cmsZonesToLearnerZones(mlPublishedV1Zones)
    const cp = dsaStyle[0].modules[0].checkpoints[0]
    expect(cp.workspace?.customAnimation).toBeUndefined()
  })
})
