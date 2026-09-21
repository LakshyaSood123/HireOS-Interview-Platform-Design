import type { AssistantMessage } from "./types"

export interface AssistantHistoryRepository {
  getHistory(topicKey: string): AssistantMessage[]
  saveHistory(topicKey: string, messages: AssistantMessage[]): void
  clearHistory(topicKey: string): void
}

const STORAGE_PREFIX = "reagvis.trailguide.history."

export class LocalTopicAssistantHistoryRepository implements AssistantHistoryRepository {
  private memoryFallback: Record<string, AssistantMessage[]> = {}

  getHistory(topicKey: string): AssistantMessage[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_PREFIX + topicKey)
        if (!raw) return this.memoryFallback[topicKey] ?? []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      // no-op
    }
    return this.memoryFallback[topicKey] ?? []
  }

  saveHistory(topicKey: string, messages: AssistantMessage[]): void {
    // Keep at most the last 30 messages per topic to avoid bloat
    const trimmed = messages.slice(-30)
    this.memoryFallback[topicKey] = trimmed

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_PREFIX + topicKey, JSON.stringify(trimmed))
      }
    } catch {
      // storage quota or private mode fallback
    }
  }

  clearHistory(topicKey: string): void {
    delete this.memoryFallback[topicKey]
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(STORAGE_PREFIX + topicKey)
      }
    } catch {
      // no-op
    }
  }
}
