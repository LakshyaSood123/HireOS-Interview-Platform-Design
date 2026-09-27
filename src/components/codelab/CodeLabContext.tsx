import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { AlgorithmAnimationId } from "../../learning/types"
import type { LabLanguage } from "../../learning/codeLab/conceptCodeLabs"

export interface CodeLabRequest {
  animationId: AlgorithmAnimationId
  language: LabLanguage
}

type OpenCodeLab = (request: CodeLabRequest) => void

const CodeLabLauncherContext = createContext<OpenCodeLab | null>(null)

export function CodeLabLauncherProvider({ open, children }: { open: OpenCodeLab; children: ReactNode }) {
  return <CodeLabLauncherContext.Provider value={open}>{children}</CodeLabLauncherContext.Provider>
}

/** Returns the launcher, or null outside a page that hosts Code Labs. The
 * Code Trace panel shows no Code Lab button when this is null. */
export function useCodeLabLauncher(): OpenCodeLab | null {
  return useContext(CodeLabLauncherContext)
}

/** Page-level Code Lab state. Opening pushes one history entry so the browser
 * Back button returns to the lesson; the lesson stays mounted (hidden) by the
 * caller, so its own state is untouched. No router — just this one entry. */
export function useCodeLabNavigation(active: boolean) {
  const [request, setRequest] = useState<CodeLabRequest | null>(null)
  const savedScroll = useRef(0)

  const restoreScroll = () => {
    const y = savedScroll.current
    window.requestAnimationFrame(() => window.scrollTo({ top: y }))
  }

  const open = useCallback((next: CodeLabRequest) => {
    savedScroll.current = window.scrollY
    try {
      window.history.pushState({ reagvisCodeLab: true }, "")
    } catch {
      // History unavailable: the in-page Back button still works.
    }
    setRequest(next)
  }, [])

  const close = useCallback(() => {
    if (window.history.state && (window.history.state as { reagvisCodeLab?: boolean }).reagvisCodeLab) {
      window.history.back() // popstate below does the actual close
      return
    }
    setRequest(null)
    restoreScroll()
  }, [])

  useEffect(() => {
    const onPop = () => {
      setRequest(current => {
        if (current) restoreScroll()
        return null
      })
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Leaving the lesson view by any other route discards the Code Lab.
  useEffect(() => {
    if (!active) setRequest(null)
  }, [active])

  return { request, open, close }
}
