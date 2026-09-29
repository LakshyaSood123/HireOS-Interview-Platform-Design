// The sandboxed runtime for a custom (author-uploaded) HTML animation
// package. Uploaded/authored HTML/CSS/JS is NEVER injected into the main
// React DOM — it only ever exists inside this iframe's `srcDoc`, sandboxed.
//
// Two independent layers of containment, deliberately not relying on either
// alone:
//   1. `sandbox="allow-scripts"` ONLY — no `allow-same-origin`, so the
//      browser gives the iframe document an opaque origin. That alone
//      already makes `parent.document`, `parent.localStorage`, and any
//      same-origin network credential impossible, structurally, regardless
//      of what the package's JS tries.
//   2. A restrictive CSP `<meta>` tag inside the composed document,
//      `default-src 'none'` plus `connect-src 'none'`, so even
//      cross-origin `fetch`/`XHR`/`WebSocket`/remote `<script src>` calls
//      are blocked at the content-loading level, not just at the
//      same-origin boundary.
//
// `script-src`/`style-src` use `'unsafe-inline'` (not a nonce) — this
// composes an author's ARBITRARY html document, which may contain its own
// inline `<script>` tags or `onclick=` attributes; rewriting/parsing
// untrusted HTML to inject nonces on every inline construct is out of
// scope for V1 and wouldn't add real security here anyway, since
// `allow-scripts` already permits the iframe to run its own script freely
// — the sandbox attribute and CSP's `connect-src`/`default-src` are what's
// doing the actual containment work, not script-src.

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { CmsAnimationPackage } from "../animationPackageClient"
import { BRIDGE_VERSION, parseBridgeEvent, buildBridgeCommand, type BridgeCommand, type BridgeEventMessage } from "../animationBridge"
import type { CmsPackageCapability } from "../animationPackageClient"
import type { CmsDsaBridgeMode } from "../dsaCmsTypes"

interface CustomAnimationHostProps {
  pkg: Pick<CmsAnimationPackage, "html" | "css" | "js" | "assets" | "manifest">
  bridgeMode: CmsDsaBridgeMode
  /** Called with a semantic step id whenever the package emits STEP_CHANGED
   * (synchronized mode only) — the caller (Preview Draft / a future
   * CodeTracePanel integration) uses this to highlight the matching trace
   * step. Never called with raw animation internals, only the id string. */
  onStepChanged?: (stepId: string) => void
  className?: string
}

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ")

/** Assets are inlined as `data:` URIs directly into the composed document
 * string (a literal, non-regex string replace of each asset's declared
 * path) rather than created as separate Blob object URLs — there is
 * nothing to `URL.revokeObjectURL` for a `data:` URI, so no cleanup
 * lifecycle is needed for them; the srcDoc string itself is simply
 * replaced/discarded by React on the next render or unmount. */
function inlineAssets(text: string, assets: CmsAnimationPackage["assets"]): string {
  let out = text
  for (const asset of assets) {
    const dataUri = `data:${asset.contentType};base64,${asset.dataBase64}`
    const variants = [asset.path, `./${asset.path}`, `/${asset.path}`]
    for (const variant of variants) {
      out = out.split(variant).join(dataUri)
    }
  }
  return out
}

function composeSandboxDocument(pkg: CustomAnimationHostProps["pkg"]): string {
  const css = pkg.css ? inlineAssets(pkg.css, pkg.assets) : ""
  const js = pkg.js ? inlineAssets(pkg.js, pkg.assets) : ""
  let html = inlineAssets(pkg.html, pkg.assets)

  const cspTag = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`
  const bridgeShim = `<script>
    (function () {
      var BRIDGE_VERSION = ${BRIDGE_VERSION};
      window.ReagvisBridge = {
        ready: function () { parent.postMessage({ bridgeVersion: BRIDGE_VERSION, type: "READY" }, "*"); },
        stepChanged: function (stepId) { parent.postMessage({ bridgeVersion: BRIDGE_VERSION, type: "STEP_CHANGED", stepId: String(stepId) }, "*"); },
      };
      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.bridgeVersion !== BRIDGE_VERSION) return;
        var handler = window.ReagvisAnimation && window.ReagvisAnimation.onCommand;
        if (typeof handler === "function") handler(data.type, data.stepId);
      });
    })();
  </script>`
  const styleTag = css ? `<style>${css}</style>` : ""
  const scriptTag = js ? `<script>${js}</script>` : ""

  // Inject CSP + bridge shim + style/script into <head>/<body> of the
  // author's own HTML document if it has those tags; otherwise wrap the
  // whole thing in a minimal shell. Either way, the author's HTML is used
  // as-is beyond this injection — never parsed/executed server-side,
  // never modified beyond these literal string insertions.
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (match) => `${match}${cspTag}${bridgeShim}${styleTag}`)
  } else if (/<html[^>]*>/i.test(html)) {
    html = html.replace(/<html[^>]*>/i, (match) => `${match}<head>${cspTag}${bridgeShim}${styleTag}</head>`)
  } else {
    html = `<!doctype html><html><head>${cspTag}${bridgeShim}${styleTag}</head><body>${html}</body></html>`
  }
  if (scriptTag) {
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptTag}</body>`) : `${html}${scriptTag}`
  }
  return html
}

export interface CustomAnimationHostHandle {
  /** Reverse sync: a trace-step click (or any external driver) can call
   * this to make the animation follow — only takes effect if the package's
   * manifest declares `gotoStep` support; otherwise it's a silent no-op
   * (never assumed as a capability the package didn't declare). */
  gotoStep: (stepId: string) => void
}

const CustomAnimationHost = forwardRef<CustomAnimationHostHandle, CustomAnimationHostProps>(function CustomAnimationHost({ pkg, bridgeMode, onStepChanged, className }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const srcDoc = useMemo(() => composeSandboxDocument(pkg), [pkg])
  const declaredCapabilities = pkg.manifest.capabilities

  useEffect(() => {
    setReady(false)
    function onMessage(event: MessageEvent) {
      // MUST verify source before trusting anything — an iframe embedded
      // elsewhere on the page, or a message from an unrelated window/tab,
      // is ignored outright regardless of payload shape.
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      const message = parseBridgeEvent(event.data)
      if (!message) return // unknown type/version/malformed payload — silently ignored, never eval'd

      if (message.type === "READY") setReady(true)
      if (message.type === "STEP_CHANGED" && bridgeMode === "synchronized" && message.stepId) {
        onStepChanged?.(message.stepId)
      }
      // HEIGHT_CHANGED is parsed/bounded but not acted on in V1 — the host
      // uses the manifest's declared heightPx; a future pass could resize.
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [bridgeMode, onStepChanged, srcDoc])

  function sendCommand(type: BridgeCommand, stepId?: string) {
    if (bridgeMode === "standalone") return // standalone packages are never sent commands
    const message = buildBridgeCommand(type, declaredCapabilities, stepId)
    if (!message) return // not declared in the manifest — refuse to send, same guard as animationBridge.ts's own doc
    iframeRef.current?.contentWindow?.postMessage(message, "*")
  }

  useImperativeHandle(ref, () => ({ gotoStep: (stepId: string) => sendCommand("GOTO_STEP", stepId) }))

  return (
    <div className={className}>
      <iframe
        ref={iframeRef}
        title="Custom animation preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{ width: "100%", height: pkg.manifest.heightPx, border: "none", borderRadius: 12, background: "#fff" }}
      />
      {bridgeMode !== "standalone" && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {(["PLAY", "PAUSE", "RESET", "PREVIOUS", "NEXT"] as BridgeCommand[])
            .filter(cmd => declaredCapabilities.includes(cmd.toLowerCase() as CmsPackageCapability))
            .map(cmd => (
              <button
                key={cmd}
                onClick={() => sendCommand(cmd)}
                disabled={!ready}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 cursor-pointer transition-all"
              >
                {cmd}
              </button>
            ))}
          {!ready && <span className="text-[10.5px] text-gray-500">waiting for READY…</span>}
        </div>
      )}
    </div>
  )
})

export default CustomAnimationHost
export type { BridgeEventMessage }
