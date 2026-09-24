// Display-only preference for the Code Trace language view. Deliberately NOT
// part of learner progress, course progress, CMS content or any backend —
// just a small localStorage value so the choice carries between lessons.

import { useSyncExternalStore } from "react"
import { TRACE_LANGUAGES, type TraceLanguage } from "./animations/codeTraceTypes"

const STORAGE_KEY = "reagvis.traceLanguage"
const DEFAULT_LANGUAGE: TraceLanguage = "pseudocode"

const listeners = new Set<() => void>()
let cached: TraceLanguage | null = null

function isTraceLanguage(value: unknown): value is TraceLanguage {
  return typeof value === "string" && (TRACE_LANGUAGES as readonly string[]).includes(value)
}

function readStored(): TraceLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isTraceLanguage(raw) ? raw : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function getSnapshot(): TraceLanguage {
  if (cached === null) cached = readStored()
  return cached
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setTraceLanguage(next: TraceLanguage): void {
  if (!isTraceLanguage(next)) return
  cached = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage unavailable: the choice still applies for this session.
  }
  listeners.forEach(listener => listener())
}

export function useTraceLanguage(): [TraceLanguage, (language: TraceLanguage) => void] {
  const language = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LANGUAGE)
  return [language, setTraceLanguage]
}
