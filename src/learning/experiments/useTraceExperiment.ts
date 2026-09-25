// Experiment Mode — the one hook every experiment-capable animation calls.
//
// Owns: whether this animation supports experimenting, the editable text,
// the last successfully parsed config, the generated states (if any), and
// which mode the panel is in. Deliberately returns plain data + callbacks —
// no React context, no global store, nothing that could leak into learner
// progress or survive a remount. See traceExperimentTypes.ts's file header
// for why persistence is out of scope for V1.

import { useEffect, useRef, useState } from "react"
import type { AlgorithmAnimationId } from "../types"
import type { CodeTraceState, TraceLanguage } from "../animations/codeTraceTypes"
import { EXPERIMENT_SUPPORTED_IDS, type TraceExperimentConfig } from "./traceExperimentTypes"
import { defaultExperimentConfig, parseExperimentText, renderExperimentText } from "./traceExperimentParser"
import { getSimulator } from "./traceExperimentSimulators"

export type TraceExperimentMode = "authored" | "editing" | "running"

/** Everything CodeTracePanel needs to render the Experiment UI — no
 * animation-state type leaks in here, so the panel stays a generic,
 * TState-agnostic leaf component. `TraceExperimentApi<TState>` below is
 * structurally a superset of this, so any caller can pass its own API
 * object straight through as this prop. */
export interface TraceExperimentPanelProps {
  supported: boolean
  mode: TraceExperimentMode
  configText: string
  setConfigText: (text: string) => void
  error: string | null
  startEditing: () => void
  cancelEditing: () => void
  runChanges: () => void
  resetToLesson: () => void
}

export interface TraceExperimentApi<TState> extends TraceExperimentPanelProps {
  /** Current animation states — authored input until Run Changes succeeds,
   * the generated custom run afterward. This is what the caller should
   * actually render and hand to AnimationPlayback/ArrayTraversalVisual. */
  states: TState[]
  /** Non-null only in "running" mode — the matching Code Trace states for
   * the SAME custom run, same length as `states`. */
  traceStatesOverride: CodeTraceState[] | null
  /** The config actually driving `states`, only in "running" mode — for a
   * component (BinarySearchAnimation, SlidingWindowAnimation) that needs
   * the raw values/target/limit for parts of its render that the state
   * objects themselves don't carry. */
  activeConfig: TraceExperimentConfig | undefined
}

export function useTraceExperiment<TState>(
  traceId: AlgorithmAnimationId | undefined,
  authoredStates: TState[],
  language: TraceLanguage,
): TraceExperimentApi<TState> {
  const supported = traceId !== undefined && EXPERIMENT_SUPPORTED_IDS.includes(traceId)

  const [mode, setMode] = useState<TraceExperimentMode>("authored")
  const [configText, setConfigText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<{ states: TState[]; traceStates: CodeTraceState[] } | null>(null)
  const lastConfigRef = useRef<TraceExperimentConfig | undefined>(undefined)
  const previousAuthoredRef = useRef(authoredStates)

  // A different checkpoint's animation mounting with a new authored array —
  // never carry a stale custom run or editor text across lessons.
  useEffect(() => {
    if (previousAuthoredRef.current !== authoredStates) {
      previousAuthoredRef.current = authoredStates
      setMode("authored")
      setGenerated(null)
      setError(null)
      lastConfigRef.current = undefined
    }
  }, [authoredStates])

  // Language changes the DISPLAYED text only, from the same underlying
  // config — never re-parses, never touches `generated`/`mode`, so a custom
  // run and its playback position survive a language switch untouched.
  useEffect(() => {
    if (mode === "editing" && traceId) {
      const config = lastConfigRef.current ?? defaultExperimentConfig(traceId)
      if (config) setConfigText(renderExperimentText(traceId, config, language))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  if (!supported || !traceId) {
    return {
      supported: false,
      mode: "authored",
      states: authoredStates,
      traceStatesOverride: null,
      activeConfig: undefined,
      configText: "",
      setConfigText: () => {},
      error: null,
      startEditing: () => {},
      cancelEditing: () => {},
      runChanges: () => {},
      resetToLesson: () => {},
    }
  }

  const startEditing = () => {
    const config = lastConfigRef.current ?? defaultExperimentConfig(traceId)
    setConfigText(config ? renderExperimentText(traceId, config, language) : "")
    setError(null)
    setMode("editing")
  }

  const cancelEditing = () => {
    setError(null)
    setMode(generated ? "running" : "authored")
  }

  const runChanges = () => {
    const result = parseExperimentText(traceId, configText)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const simulate = getSimulator<TState, TraceExperimentConfig>(traceId)
    if (!simulate) {
      setError("Experiment Mode is not available for this animation.")
      return
    }
    const { animationStates, traceStates } = simulate(result.config)
    lastConfigRef.current = result.config
    setGenerated({ states: animationStates as TState[], traceStates })
    setError(null)
    setMode("running")
  }

  const resetToLesson = () => {
    setMode("authored")
    setGenerated(null)
    setError(null)
    lastConfigRef.current = undefined
  }

  return {
    supported: true,
    mode,
    states: mode === "running" && generated ? generated.states : authoredStates,
    traceStatesOverride: mode === "running" && generated ? generated.traceStates : null,
    activeConfig: mode === "running" ? lastConfigRef.current : undefined,
    configText,
    setConfigText,
    error,
    startEditing,
    cancelEditing,
    runChanges,
    resetToLesson,
  }
}
