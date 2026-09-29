// "View Package Requirements" / "View Trace Requirements" — a plain human
// reference (no AI, no prompt generation), for an author who wants to build
// a package by hand rather than ask an external tool. Limits are pulled
// from the actual project constants, not duplicated magic numbers.

import { CMS_PACKAGE_CAPABILITIES, BRIDGE_VERSION } from "../animationBridge"
import { PACKAGE_TRACE_LIMITS } from "../packageTraceUtils"

interface PackageRequirementsModalProps {
  /** "package" shows the full animation-package reference; "trace" focuses
   * on trace.json only, per PART 15's "should focus on trace.json". */
  focus: "package" | "trace"
  onClose: () => void
}

const ROW = "flex items-start justify-between gap-4 py-1.5 border-b border-white/5 last:border-0"
const LABEL = "text-[11px] text-gray-400 shrink-0"
const VALUE = "text-[11px] text-gray-200 font-mono text-right"

export default function PackageRequirementsModal({ focus, onClose }: PackageRequirementsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] rounded-2xl bg-[#0F2A20] border border-white/10 shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black text-white">{focus === "trace" ? "Trace Requirements" : "Package Requirements"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer text-lg leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {focus === "package" && (
            <>
              <section>
                <h4 className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">Animation Package</h4>
                <div className={ROW}>
                  <span className={LABEL}>Required file</span>
                  <span className={VALUE}>animation.html</span>
                </div>
                <div className={ROW}>
                  <span className={LABEL}>Optional files</span>
                  <span className={VALUE}>animation.css, animation.js, manifest.json, trace.json, assets/*</span>
                </div>
                <div className={ROW}>
                  <span className={LABEL}>Single-file upload</span>
                  <span className={VALUE}>a bare .html file is also accepted</span>
                </div>
              </section>

              <section>
                <h4 className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">Security</h4>
                <div className={ROW}>
                  <span className={LABEL}>Network</span>
                  <span className={VALUE}>offline only — no fetch/XHR/WebSocket/remote script</span>
                </div>
                <div className={ROW}>
                  <span className={LABEL}>Sandbox</span>
                  <span className={VALUE}>sandbox="allow-scripts" only</span>
                </div>
                <div className={ROW}>
                  <span className={LABEL}>Asset types</span>
                  <span className={VALUE}>png, jpg, jpeg, gif, webp</span>
                </div>
              </section>

              <section>
                <h4 className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">Bridge</h4>
                <div className={ROW}>
                  <span className={LABEL}>Version</span>
                  <span className={VALUE}>{BRIDGE_VERSION}</span>
                </div>
                <div className={ROW}>
                  <span className={LABEL}>Capabilities</span>
                  <span className={VALUE}>{CMS_PACKAGE_CAPABILITIES.join(", ")}</span>
                </div>
              </section>
            </>
          )}

          <section>
            <h4 className="text-[10.5px] font-black uppercase tracking-wider text-[#A7CE65] mb-2">trace.json schema</h4>
            <div className={ROW}>
              <span className={LABEL}>version</span>
              <span className={VALUE}>1 (required)</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>steps[].id</span>
              <span className={VALUE}>unique, required</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>steps[].label</span>
              <span className={VALUE}>required</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>steps[].animationEvent</span>
              <span className={VALUE}>optional</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>steps[].code.pseudocode</span>
              <span className={VALUE}>required</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>steps[].code.python/cpp/java</span>
              <span className={VALUE}>optional</span>
            </div>
            <div className={ROW}>
              <span className={LABEL}>max steps</span>
              <span className={VALUE}>{PACKAGE_TRACE_LIMITS.maxSteps}</span>
            </div>
            <p className="text-[10.5px] text-gray-500 mt-2">Every animationEvent used must appear in the package's manifest.json traceEvents list.</p>

            <pre className="mt-3 rounded-xl bg-black/30 border border-white/10 p-3 text-[10.5px] font-mono text-gray-300 overflow-x-auto">
{`{
  "version": 1,
  "steps": [
    {
      "id": "initialize",
      "label": "Initialize pointers",
      "animationEvent": "initialize",
      "code": {
        "pseudocode": "left <- 0\\nright <- n - 1",
        "python": "left = 0\\nright = len(nums) - 1"
      }
    }
  ]
}`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
