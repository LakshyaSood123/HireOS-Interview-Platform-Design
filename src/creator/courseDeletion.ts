// Pure rules for the permanent-course-deletion UI. The BACKEND is authoritative for every one of these (protection, password check,
// confirmation, blockers); this file only decides what the UI shows and which button is enabled, and how errors read to the author.
// It never sees, stores or compares a password hash, and nothing here persists the password.

import { ApiRequestError } from "../learning/services/apiClient"

export interface DeletableCourseSummary {
  courseId: string
  creationSource: string | null
  /** Computed by the backend: created through the CMS and not protected. */
  canPermanentlyDelete: boolean
}

export interface DeletionImpactView {
  canDelete: boolean
  blockers: string[]
}

/** The Danger Zone exists only for courses the backend says may be permanently deleted. Protected / seeded courses never show it. */
export function showDangerZone(summary: DeletableCourseSummary | null | undefined): boolean {
  return !!summary && summary.canPermanentlyDelete === true && summary.creationSource === "manual"
}

/** Exact match only: no trimming, no case folding, no partial matches. */
export function confirmationMatches(courseTitle: string, typed: string): boolean {
  return typed === courseTitle
}

export function canSubmitDeletion(args: { courseTitle: string; password: string; confirmation: string; impact: DeletionImpactView | null; busy: boolean }): boolean {
  return !args.busy && !!args.impact && args.impact.canDelete && args.password.length > 0 && confirmationMatches(args.courseTitle, args.confirmation)
}

/** Clear, non-destructive wording for each failure; never an internal message or stack. */
export function deletionErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403 && /password/i.test(error.message)) return "Password verification failed."
    if (error.status === 403 && /protected/i.test(error.message)) return "This course is protected and cannot be permanently deleted."
    if (error.status === 400 && /title/i.test(error.message)) return "Course title does not match."
    if (error.status === 409) {
      if (/pinned|learner/i.test(error.message)) return "This course cannot be permanently deleted while learners are assigned to it."
      if (/referenced/i.test(error.message)) return "This course is referenced by other content and cannot be deleted."
      return error.message
    }
    if (error.status === 429) return "Too many attempts. Wait a few minutes and try again."
    if (error.status === 404) return "This course no longer exists."
  }
  return "The course could not be deleted. Nothing was changed."
}
