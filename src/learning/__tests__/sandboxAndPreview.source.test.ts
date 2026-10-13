// STATIC source checks. These read component files and assert that the
// security-relevant text is present. They do NOT render the components. A
// runtime iframe test is a separate task that has not been written yet.
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8")

describe("shared custom animation host (static source check)", () => {
  const host = read("../../creator/dsa/components/CustomAnimationHost.tsx")

  it("the iframe sandbox attribute is exactly allow-scripts", () => {
    // Check the real attribute value, not free text: the file's comments
    // legitimately name the forbidden tokens while explaining the design.
    const values = [...host.matchAll(/sandbox="([^"]*)"/g)].map(m => m[1])
    expect(values.length).toBeGreaterThan(0)
    expect(values.every(v => v === "allow-scripts")).toBe(true)
  })

  it("keeps default-src none and connect-src none in the CSP", () => {
    expect(host).toContain("default-src 'none'")
    expect(host).toContain("connect-src 'none'")
  })

  it("the learner Animation block reuses this host and defines no iframe of its own", () => {
    const block = read("../../components/lesson/PackageAnimationBlock.tsx")
    expect(block).toContain("creator/dsa/components/CustomAnimationHost")
    expect(block).not.toContain("<iframe")
    expect(block).not.toContain("srcDoc")
  })
})

describe("Creator Studio preview does not write learner state (static source check)", () => {
  const preview = read("../../creator/dsa/components/DsaDraftPreview.tsx")

  it("the draft preview does not import or call any progress, attempt or completion writer", () => {
    for (const writer of ["completeCheckpoint", "recordAttempt", "progressApi", "attemptsApi", "setProgress"]) {
      expect(preview).not.toContain(writer)
    }
  })

  it("LessonWorkspace records no attempt in preview mode", () => {
    const ws = read("../../components/lesson/LessonWorkspace.tsx")
    expect(ws).toContain("if (isPreview || !isBackendSyncedCourse(courseId)) return")
  })
})
