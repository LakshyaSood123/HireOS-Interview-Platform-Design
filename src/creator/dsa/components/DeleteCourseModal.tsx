// Permanent deletion of an entire manually created CMS course: impact preview, then the admin's CURRENT password and the exact course
// title. The password lives only in this component's state while the dialog is open, is sent once over the authenticated API call,
// and is verified by the backend. It is never cached, stored, logged or compared in the browser.

import { useEffect, useState } from "react"
import { useAuth } from "../../../auth/AuthContext"
import { canSubmitDeletion, deletionErrorMessage } from "../../courseDeletion"
import { getCourseDeleteImpact, permanentlyDeleteCourse, type CmsDeletionImpact } from "../dsaCmsClient"

interface DeleteCourseModalProps {
  courseId: string
  courseTitle: string
  onClose: () => void
  onDeleted: () => void
}

const FIELD_CLASS = "w-full rounded-xl bg-black/30 border border-white/15 focus:border-red-400/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

export default function DeleteCourseModal({ courseId, courseTitle, onClose, onDeleted }: DeleteCourseModalProps) {
  const { client, user } = useAuth()
  const [impact, setImpact] = useState<CmsDeletionImpact | null>(null)
  const [impactError, setImpactError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCourseDeleteImpact(client, courseId)
      .then(setImpact)
      .catch(err => setImpactError(deletionErrorMessage(err)))
  }, [client, courseId])

  const close = () => {
    setPassword("") // never keep the password around after the dialog is dismissed
    setConfirmation("")
    onClose()
  }

  const submit = async () => {
    if (!canSubmitDeletion({ courseTitle, password, confirmation, impact, busy })) return
    setBusy(true)
    setError(null)
    try {
      await permanentlyDeleteCourse(client, courseId, { password, confirmation })
      setPassword("")
      onDeleted()
    } catch (err) {
      setError(deletionErrorMessage(err))
      setPassword("") // a failed attempt does not leave the password in the field
    } finally {
      setBusy(false)
    }
  }

  const rows: [string, number | undefined][] = [
    ["Zones", impact?.zones],
    ["Modules", impact?.modules],
    ["Checkpoints", impact?.checkpoints],
    ["Versions", impact?.versions],
    ["Snapshots", impact?.snapshots],
    ["Package revisions", impact?.packageRevisions],
    ["Narration clips deleted", impact?.narrationAssets],
    ["Learners pinned", impact?.learnersPinned],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Permanently delete course">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#1A0F10] border border-red-500/40 shadow-2xl">
        <div className="px-7 pt-6 pb-4 border-b border-red-500/25">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-red-300 mb-1">Danger zone</p>
          <h2 className="text-lg font-black text-white">Permanently delete this course?</h2>
          <p className="text-xs text-red-200/90 mt-2 leading-relaxed">
            This permanently deletes <b>{courseTitle}</b> and the data it owns. <b>This cannot be undone.</b> Use Archive instead if you only want to hide something.
          </p>
        </div>

        <div className="px-7 py-5 space-y-5">
          <div>
            <p className={LABEL_CLASS}>Deletion impact</p>
            {impactError && <p role="alert" className="text-xs text-red-300">{impactError}</p>}
            {!impact && !impactError && <p className="text-xs text-gray-500">Calculating…</p>}
            {impact && (
              <>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-white/5 py-1">
                      <dt className="text-gray-400">{label}</dt>
                      <dd className="font-mono text-white">{value ?? 0}</dd>
                    </div>
                  ))}
                </dl>
                {impact.packagesKept > 0 && <p className="text-[11px] text-gray-500 mt-2">{impact.packagesKept} package(s) are shared with other courses and will be kept.</p>}
                {impact.blockers.length > 0 && (
                  <div role="alert" className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-200 space-y-1">
                    {impact.blockers.map(b => (
                      <p key={b}>{b}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className={LABEL_CLASS}>Signed in as</p>
              <p className="text-sm text-white font-mono">{user?.email}</p>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="delete-course-password">Your current password</label>
              <input
                id="delete-course-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={FIELD_CLASS}
                disabled={busy || (impact !== null && !impact.canDelete)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="delete-course-confirm">Type the course title to confirm</label>
              <input
                id="delete-course-confirm"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                placeholder={courseTitle}
                autoComplete="off"
                className={FIELD_CLASS}
                disabled={busy || (impact !== null && !impact.canDelete)}
              />
            </div>
          </div>

          {error && <p role="alert" className="text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">{error}</p>}
        </div>

        <div className="px-7 py-5 border-t border-red-500/25 flex items-center justify-end gap-3">
          <button onClick={close} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmitDeletion({ courseTitle, password, confirmation, impact, busy })}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? "Deleting…" : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
