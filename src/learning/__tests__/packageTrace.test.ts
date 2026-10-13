import { describe, expect, it } from "vitest"
import { presentTraceLanguages, codeForTraceLanguage, findTraceStepForEvent } from "../packageTrace"
import { parseBridgeEvent, buildBridgeCommand } from "../../creator/dsa/animationBridge"
import type { CmsPackageTraceStep } from "../../creator/dsa/animationPackageClient"

const pythonOnly: CmsPackageTraceStep[] = [
  { id: "rules", label: "Rules", animationEvent: "rules", code: { pseudocode: "write rules", python: "rules = []" } },
  { id: "data", label: "Data", animationEvent: "data", code: { pseudocode: "collect data", python: "data = []" } },
]

describe("package trace language filtering", () => {
  it("shows Pseudocode and Python only when Python is present", () => {
    expect(presentTraceLanguages(pythonOnly)).toEqual(["pseudocode", "python"])
  })

  it("never shows an empty C++ or Java tab", () => {
    const langs = presentTraceLanguages(pythonOnly)
    expect(langs).not.toContain("cpp")
    expect(langs).not.toContain("java")
  })

  it("shows C++ only when some step provides C++ code", () => {
    const withCpp: CmsPackageTraceStep[] = [{ id: "a", label: "A", code: { pseudocode: "p", cpp: "int x;" } }]
    expect(presentTraceLanguages(withCpp)).toEqual(["pseudocode", "cpp"])
  })

  it("returns null (no pseudocode fallback) for a step lacking the selected language", () => {
    expect(codeForTraceLanguage(pythonOnly[0], "python")).toBe("rules = []")
    const noPython: CmsPackageTraceStep = { id: "x", label: "X", code: { pseudocode: "only pseudo" } }
    expect(codeForTraceLanguage(noPython, "python")).toBeNull()
  })
})

describe("trace and animation step synchronization (pure mapping)", () => {
  it("STEP_CHANGED(eventId) selects the trace step bound to that event", () => {
    const parsed = parseBridgeEvent({ bridgeVersion: 1, type: "STEP_CHANGED", stepId: "data" })
    expect(parsed?.stepId).toBe("data")
    expect(findTraceStepForEvent(pythonOnly, parsed?.stepId ?? null)?.id).toBe("data")
  })

  it("an unknown or null event selects nothing", () => {
    expect(findTraceStepForEvent(pythonOnly, "nope")).toBeUndefined()
    expect(findTraceStepForEvent(pythonOnly, null)).toBeUndefined()
  })

  it("trace click builds a GOTO_STEP only when the package declares gotoStep", () => {
    expect(buildBridgeCommand("GOTO_STEP", ["play", "gotoStep"], "data")).toEqual({
      bridgeVersion: 1,
      type: "GOTO_STEP",
      stepId: "data",
    })
    expect(buildBridgeCommand("GOTO_STEP", ["play"], "data")).toBeNull()
  })

  it("rejects malformed bridge events", () => {
    expect(parseBridgeEvent({ bridgeVersion: 2, type: "STEP_CHANGED", stepId: "data" })).toBeNull()
    expect(parseBridgeEvent({ bridgeVersion: 1, type: "STEP_CHANGED", stepId: "../../etc" })).toBeNull()
  })
})
