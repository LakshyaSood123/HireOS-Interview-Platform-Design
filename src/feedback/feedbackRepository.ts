import type { FeedbackRecord, FeedbackSubmissionPayload } from "./types"

export interface FeedbackRepository {
  submit(payload: FeedbackSubmissionPayload): Promise<{ success: boolean; id?: string; error?: string }>
  list(): FeedbackRecord[]
  clear(): void
}

const STORAGE_KEY = "reagvis.feedback.records"

export class LocalFeedbackRepository implements FeedbackRepository {
  private inMemoryFallback: FeedbackRecord[] = []

  list(): FeedbackRecord[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return this.inMemoryFallback
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : this.inMemoryFallback
      }
    } catch (e) {
      console.warn("Could not read feedback from localStorage, using memory fallback", e)
    }
    return this.inMemoryFallback
  }

  async submit(payload: FeedbackSubmissionPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const record: FeedbackRecord = {
        ...payload,
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }

      const current = this.list()
      const updated = [record, ...current]

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        }
      } catch (storageErr) {
        console.warn("Failed to write feedback to localStorage; stored in-memory", storageErr)
        this.inMemoryFallback = updated
      }

      this.inMemoryFallback = updated
      return { success: true, id: record.id }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record feedback"
      return { success: false, error: message }
    }
  }

  clear(): void {
    this.inMemoryFallback = []
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // no-op
    }
  }
}
