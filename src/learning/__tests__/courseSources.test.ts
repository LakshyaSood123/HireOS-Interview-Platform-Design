import { describe, expect, it } from "vitest"
import { DSA_COURSE_ID, ML_COURSE_ID, getCourseSourceDefinition, isBackendPinnedCourse, isBackendSyncedCourse } from "../courseSources"
import { isCourseAvailable } from "../courseRegistry"

describe("course source selection", () => {
  it("dsa-foundations resolves to the static curriculum", () => {
    expect(getCourseSourceDefinition(DSA_COURSE_ID)).toEqual({ id: DSA_COURSE_ID, source: "static" })
    expect(isBackendPinnedCourse(DSA_COURSE_ID)).toBe(false)
  })

  it("machine-learning-foundations resolves to the backend-pinned curriculum", () => {
    expect(getCourseSourceDefinition(ML_COURSE_ID)).toEqual({ id: ML_COURSE_ID, source: "backend-pinned" })
    expect(isBackendPinnedCourse(ML_COURSE_ID)).toBe(true)
  })

  it("both courses are backend-synced for progress; unknown courses are not", () => {
    expect(isBackendSyncedCourse(DSA_COURSE_ID)).toBe(true)
    expect(isBackendSyncedCourse(ML_COURSE_ID)).toBe(true)
    expect(isBackendSyncedCourse("dbms-essentials")).toBe(false)
  })

  it("both courses are enterable; other unregistered courses stay Coming Soon", () => {
    expect(isCourseAvailable(DSA_COURSE_ID)).toBe(true)
    expect(isCourseAvailable(ML_COURSE_ID)).toBe(true)
    expect(isCourseAvailable("dbms-essentials")).toBe(false)
  })
})
