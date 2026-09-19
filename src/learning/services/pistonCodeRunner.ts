// Real code execution over a self-hosted Piston instance, reached through a
// small local gateway (tools/code-runner-gateway.mjs, proxied at
// /api/code-runner/execute by vite.config.ts). This file never talks to
// Piston directly and never knows Piston's base URL, resource policy, or
// package/management endpoints — those are entirely the gateway's concern.
//
// CRITICAL: fallback to MockCodeRunner is for INFRASTRUCTURE failure only
// (gateway unreachable, Piston unreachable, runtime missing, gateway system
// error). A legitimate real-execution outcome — compile error, runtime
// error, wrong answer, timeout — is returned as a real result and must
// never be silently swapped for mock behavior. See RoutingCodeRunner below.

import type { CodeRunner, CodeRunRequest, CodeRunResult } from "./codeRunner"
import { looksLikeStarter, MockCodeRunner } from "./codeRunner"
import { DEVELOPMENT_MODE } from "../../config/developmentMode"

const GATEWAY_EXECUTE_URL = "/api/code-runner/execute"

interface GatewaySuccessResponse {
  ok: true
  result: CodeRunResult
}
interface GatewayInfraFailureResponse {
  ok: false
  infrastructure_failure: true
  reason: string
}
interface GatewayUnsupportedResponse {
  ok: false
  infrastructure_failure: false
  unsupported: true
  reason: string
}
type GatewayResponse = GatewaySuccessResponse | GatewayInfraFailureResponse | GatewayUnsupportedResponse

/** Thrown only for genuine infrastructure problems — callers (RoutingCodeRunner)
 * treat this, and only this, as a signal to fall back to MockCodeRunner. */
export class InfrastructureUnavailableError extends Error {
  reason: string
  constructor(reason: string) {
    super(`Real code execution infrastructure unavailable: ${reason}`)
    this.reason = reason
  }
}

async function callGateway(mode: "run" | "submit", request: CodeRunRequest): Promise<CodeRunResult> {
  let res: Response
  try {
    res = await fetch(GATEWAY_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        activityId: request.activityId,
        language: request.language,
        code: request.code,
      }),
    })
  } catch {
    throw new InfrastructureUnavailableError("gateway_unreachable")
  }

  if (!res.ok && res.status !== 200) {
    throw new InfrastructureUnavailableError(`gateway_http_${res.status}`)
  }

  let payload: GatewayResponse
  try {
    payload = (await res.json()) as GatewayResponse
  } catch {
    throw new InfrastructureUnavailableError("gateway_invalid_response")
  }

  if (!payload.ok) {
    if (payload.infrastructure_failure) throw new InfrastructureUnavailableError(payload.reason)
    // Defensive: an "unsupported" response should never happen given
    // RoutingCodeRunner's client-side gating, but if it does, it's not a
    // legitimate execution outcome either — treat as infrastructure so the
    // caller falls back to Mock rather than showing a confusing result.
    throw new InfrastructureUnavailableError(payload.reason)
  }

  return payload.result
}

/** Implements the same CodeRunner interface as MockCodeRunner, backed by
 * real self-hosted Piston execution via the local gateway. Preserves the
 * exact same empty/unchanged-starter UX as MockCodeRunner (checked here,
 * client-side, before ever calling the gateway — an untouched starter
 * submission never needs a compiler to tell the learner that). */
export class PistonCodeRunner implements CodeRunner {
  async run(request: CodeRunRequest): Promise<CodeRunResult> {
    const shortCircuit = this.checkEmptyOrUnchanged(request, request.activity.visibleTests.length)
    if (shortCircuit) return shortCircuit
    return callGateway("run", request)
  }

  async submit(request: CodeRunRequest): Promise<CodeRunResult> {
    const shortCircuit = this.checkEmptyOrUnchanged(request, request.activity.hiddenTests.length)
    if (shortCircuit) return shortCircuit
    return callGateway("submit", request)
  }

  private checkEmptyOrUnchanged(request: CodeRunRequest, totalTests: number): CodeRunResult | null {
    const { code, language, activity } = request
    if (code.trim().length === 0) {
      return { status: "empty", message: "Write a solution before running.", testsPassed: 0, totalTests, runtimeMs: 0, tests: [] }
    }
    if (looksLikeStarter(code, activity, language)) {
      return {
        status: "unchanged",
        message: "This still looks like the starter code — implement the function body before running.",
        testsPassed: 0,
        totalTests,
        runtimeMs: 0,
        tests: [],
      }
    }
    return null
  }
}

/** The single construction/injection site (ReagvisTrailPage.tsx) uses this
 * instead of a raw MockCodeRunner. It routes a request to PistonCodeRunner
 * ONLY when REAL_CODE_EXECUTION_ENABLED is on and the request's activityId
 * is in REAL_CODE_EXECUTION_ACTIVITY_IDS; every other request — including
 * one that WOULD be real-execution-eligible but hits an infrastructure
 * failure — goes to (or falls back to) MockCodeRunner. A legitimate real
 * result (pass, fail, compile error, runtime error, timeout) is returned
 * as-is and never overridden. */
export class RoutingCodeRunner implements CodeRunner {
  constructor(
    private readonly mock: CodeRunner = new MockCodeRunner(),
    private readonly piston: CodeRunner = new PistonCodeRunner()
  ) {}

  private isRealExecutionEligible(request: CodeRunRequest): boolean {
    return (
      DEVELOPMENT_MODE.REAL_CODE_EXECUTION_ENABLED &&
      !!request.activityId &&
      DEVELOPMENT_MODE.REAL_CODE_EXECUTION_ACTIVITY_IDS.includes(request.activityId)
    )
  }

  async run(request: CodeRunRequest): Promise<CodeRunResult> {
    if (!this.isRealExecutionEligible(request)) return this.mock.run(request)
    try {
      return await this.piston.run(request)
    } catch (err) {
      if (err instanceof InfrastructureUnavailableError) return this.mock.run(request)
      throw err
    }
  }

  async submit(request: CodeRunRequest): Promise<CodeRunResult> {
    if (!this.isRealExecutionEligible(request)) return this.mock.submit(request)
    try {
      return await this.piston.submit(request)
    } catch (err) {
      if (err instanceof InfrastructureUnavailableError) return this.mock.submit(request)
      throw err
    }
  }
}
