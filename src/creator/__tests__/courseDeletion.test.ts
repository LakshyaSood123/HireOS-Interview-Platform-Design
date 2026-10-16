import { describe, expect, it } from "vitest"

import { ApiRequestError } from "../../learning/services/apiClient"
import { canSubmitDeletion, confirmationMatches, deletionErrorMessage, showDangerZone } from "../courseDeletion"

const impact = { canDelete: true, blockers: [] as string[] }

describe("Danger Zone visibility", () => {
  it("shows only for a course the backend says is permanently deletable and was created in the CMS", () => {
    expect(showDangerZone({ courseId: "my-course", creationSource: "manual", canPermanentlyDelete: true })).toBe(true)
  })
  it("is hidden for protected / seeded courses (DSA, Machine Learning) and while the course is unknown", () => {
    expect(showDangerZone({ courseId: "dsa-foundations", creationSource: null, canPermanentlyDelete: false })).toBe(false)
    expect(showDangerZone({ courseId: "machine-learning-foundations", creationSource: null, canPermanentlyDelete: false })).toBe(false)
    expect(showDangerZone({ courseId: "x", creationSource: "seed", canPermanentlyDelete: true })).toBe(false) // never trust one flag alone
    expect(showDangerZone({ courseId: "x", creationSource: "manual", canPermanentlyDelete: false })).toBe(false)
    expect(showDangerZone(null)).toBe(false)
  })
})

describe("confirmation and submit rules", () => {
  it("the title must match exactly: no partial, trimmed or case-insensitive match", () => {
    expect(confirmationMatches("Permanent Delete QA", "Permanent Delete QA")).toBe(true)
    for (const typed of ["permanent delete qa", "Permanent Delete", "Permanent Delete QA ", " Permanent Delete QA", ""]) expect(confirmationMatches("Permanent Delete QA", typed), typed).toBe(false)
  })
  it("requires the impact to be loaded and unblocked, a password and the exact title", () => {
    const ok = { courseTitle: "Course", password: "pw", confirmation: "Course", impact, busy: false }
    expect(canSubmitDeletion(ok)).toBe(true)
    expect(canSubmitDeletion({ ...ok, password: "" })).toBe(false) // password required
    expect(canSubmitDeletion({ ...ok, confirmation: "course" })).toBe(false) // confirmation required, exact
    expect(canSubmitDeletion({ ...ok, impact: null })).toBe(false)
    expect(canSubmitDeletion({ ...ok, impact: { canDelete: false, blockers: ["pinned"] } })).toBe(false) // pinned learners / dependencies block
    expect(canSubmitDeletion({ ...ok, busy: true })).toBe(false)
  })
})

describe("error messages", () => {
  const err = (status: number, code: string, message: string) => new ApiRequestError(status, code, message)
  it("maps each failure to clear, non-destructive wording", () => {
    expect(deletionErrorMessage(err(403, "FORBIDDEN", "Password verification failed."))).toBe("Password verification failed.")
    expect(deletionErrorMessage(err(400, "VALIDATION_ERROR", "Course title does not match."))).toBe("Course title does not match.")
    expect(deletionErrorMessage(err(409, "CONFLICT", "This course cannot be permanently deleted while 3 learners are pinned to it."))).toBe("This course cannot be permanently deleted while learners are assigned to it.")
    expect(deletionErrorMessage(err(403, "FORBIDDEN", "This course is protected and cannot be permanently deleted."))).toBe("This course is protected and cannot be permanently deleted.")
    expect(deletionErrorMessage(err(409, "CONFLICT", "This course is referenced by other content (x) and cannot be deleted."))).toBe("This course is referenced by other content and cannot be deleted.")
  })
  it("never leaks internals for an unexpected failure", () => {
    expect(deletionErrorMessage(new Error("MongoServerError: stack trace at ..."))).toBe("The course could not be deleted. Nothing was changed.")
    expect(deletionErrorMessage(err(500, "INTERNAL_ERROR", "boom"))).toBe("The course could not be deleted. Nothing was changed.")
  })
})

describe("password handling", () => {
  it("the deletion modules never persist anything to browser storage", async () => {
    const { readFileSync } = await import("node:fs")
    for (const file of ["src/creator/courseDeletion.ts", "src/creator/dsa/components/DeleteCourseModal.tsx"]) {
      const source = readFileSync(file, "utf8").replace(/\/\/[^\n]*/g, "") // ignore comments
      expect(source, file).not.toMatch(/localStorage|sessionStorage|indexedDB|console\./)
    }
  })
})
