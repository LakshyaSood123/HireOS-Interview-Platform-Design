// Client for the Concept Code Lab execution route (POST /api/code-runner/lab,
// proxied to tools/code-runner-gateway.mjs). Separate from PistonCodeRunner:
// no activity id, no grading, no mock fallback — the learner's source runs as
// written and whatever comes back (stdout, compiler errors, runtime errors,
// timeout) is shown as plain output. Never touches progress, XP or quiz state.

import type { LabLanguage } from "./conceptCodeLabs"

export const LAB_MAX_SOURCE_BYTES = 20 * 1024
export const LAB_RUN_TIMEOUT_SECONDS = 3
/** C++ compiles are slow on the self-hosted Piston, so the browser waits well
 * past the gateway's own compile limit before giving up. */
const CLIENT_TIMEOUT_MS = 45_000

export type LabRunStatus =
  | "ok"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "empty_source"
  | "too_large"
  | "unsupported"
  | "unavailable"

export interface LabRunResult {
  status: LabRunStatus
  stdout: string
  stderr: string
  runtimeMs?: number
}

function failure(status: LabRunStatus): LabRunResult {
  return { status, stdout: "", stderr: "" }
}

export async function runLabCode(language: LabLanguage, code: string): Promise<LabRunResult> {
  if (code.trim() === "") return failure("empty_source")
  if (new TextEncoder().encode(code).length > LAB_MAX_SOURCE_BYTES) return failure("too_large")

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  try {
    const res = await fetch("/api/code-runner/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
      signal: controller.signal,
    })
    let data: unknown
    try {
      data = await res.json()
    } catch {
      return failure("unavailable")
    }
    const body = data as {
      ok?: boolean
      unsupported?: boolean
      reason?: string
      result?: { status?: string; stdout?: string; stderr?: string; runtimeMs?: number }
    }
    if (body.ok && body.result) {
      const status = body.result.status
      const mapped: LabRunStatus | null =
        status === "ok" ? "ok" : status === "compile_error" ? "compile_error" : status === "runtime_error" ? "runtime_error" : status === "time_limit_exceeded" ? "timeout" : null
      if (!mapped) return failure("unavailable")
      return { status: mapped, stdout: body.result.stdout ?? "", stderr: body.result.stderr ?? "", runtimeMs: body.result.runtimeMs }
    }
    if (body.unsupported) {
      if (body.reason === "empty_source") return failure("empty_source")
      if (body.reason === "source_too_large") return failure("too_large")
      return failure("unsupported")
    }
    return failure("unavailable")
  } catch {
    return failure("unavailable")
  } finally {
    window.clearTimeout(timer)
  }
}
