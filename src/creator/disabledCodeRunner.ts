// A CodeRunner that never executes anything — used exclusively for
// CMS-authored coding exercises. Reuses the real CodeWorkspace component's
// visual shell (problem/editor/results columns, Run/Submit buttons) so a
// published CMS course "feels like Reagvis," while being structurally
// incapable of running arbitrary learner-submitted CMS code through Piston
// or any other execution path. Every DSA coding checkpoint keeps using
// MockCodeRunner/RoutingCodeRunner exactly as before — this file is never
// imported by DSA code.

import type { CodeRunner, CodeRunRequest, CodeRunResult } from "../learning/services/codeRunner"

const PENDING_MESSAGE = "Execution configuration pending platform setup — this exercise is authorable and viewable, but not yet connected to a live code runner."

export class DisabledCodeRunner implements CodeRunner {
  async run(_request: CodeRunRequest): Promise<CodeRunResult> {
    return {
      status: "error",
      message: PENDING_MESSAGE,
      testsPassed: 0,
      totalTests: 0,
      runtimeMs: 0,
      tests: [],
    }
  }

  async submit(_request: CodeRunRequest): Promise<CodeRunResult> {
    return this.run(_request)
  }
}
