'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { approveOrder, rejectOrder } from '@/lib/admin/actions'
import { MAX_REASON_LENGTH } from '@/lib/admin/constants'

/**
 * Approve, or ask for another try.
 *
 * Both are consequential and neither is undoable from the interface, so both
 * go through a confirmation that states the consequence in the words that
 * matter: approving starts a clock, rejecting costs the customer days and
 * puts your sentence in front of them verbatim.
 *
 * Native `<dialog>` rather than a modal component: it brings its own focus
 * trap, Esc handling, backdrop and inert background, and Design.md §3.7 asks
 * for no decorative motion on admin surfaces anyway — so there is nothing
 * left for a custom implementation to add except ways to get it wrong.
 */
export function ReviewActions({
  orderId,
  turnaroundDays,
  expectedDelivery,
}: {
  orderId: string
  turnaroundDays: number
  /** Pre-formatted server-side, so the date shown is the date that gets stored. */
  expectedDelivery: string
}) {
  const router = useRouter()
  // Two error slots, not one. A failure belongs on the surface the analyst is
  // looking at: an approval failure closes its dialog and reports on the
  // page, a rejection failure stays in the dialog beside the text it is
  // about. One shared slot rendered the same sentence in both places at once.
  const [pageError, setPageError] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [working, setWorking] = useState<'approve' | 'reject' | null>(null)

  const approveDialog = useRef<HTMLDialogElement>(null)
  const rejectDialog = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')

  async function approve() {
    setWorking('approve')
    setPageError(null)
    const result = await approveOrder(orderId)
    setWorking(null)
    approveDialog.current?.close()

    if (result.error) {
      setPageError(result.error)
      return
    }
    router.refresh()
  }

  async function reject() {
    setWorking('reject')
    setRejectError(null)
    const result = await rejectOrder(orderId, reason)
    setWorking(null)

    if (result.error) {
      // Kept open: the reason is still in the box, and the message says what
      // to change about it.
      setRejectError(result.error)
      return
    }
    rejectDialog.current?.close()
    setReason('')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => approveDialog.current?.showModal()}>
          Approve this sample
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setRejectError(null)
            rejectDialog.current?.showModal()
          }}
        >
          Ask for another try
        </Button>
      </div>

      {pageError ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {pageError}
        </p>
      ) : null}

      <Dialog ref={approveDialog} title="Start the clock?">
        <p className="text-washi-300 text-sm">
          Approving starts the {turnaroundDays}-day turnaround. The customer will be told to expect
          their report by <strong className="text-washi-50">{expectedDelivery}</strong>, and that
          date does not move afterwards.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => approveDialog.current?.close()}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" loading={working === 'approve'} onClick={approve}>
            Approve and start
          </Button>
        </div>
      </Dialog>

      <Dialog ref={rejectDialog} title="Ask for another try">
        <p className="text-washi-300 text-sm">
          <strong className="text-washi-50">
            The customer sees this text exactly as you write it.
          </strong>{' '}
          Say what is wrong and what would fix it — they have 14 days to send a replacement, and
          this sentence is all they have to go on.
        </p>

        <label htmlFor="reject-reason" className="text-washi-50 mt-5 block text-sm font-medium">
          What went wrong?
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={MAX_REASON_LENGTH}
          rows={4}
          placeholder="The second page is out of focus — please photograph it flat, in daylight, without a flash."
          className="border-ink-700 bg-ink-950 text-washi-50 placeholder:text-ink-500 hover:border-ink-500 mt-2 w-full rounded-lg border px-4 py-3 text-base"
        />
        <p className="text-ink-500 mt-1 text-right font-mono text-xs">
          {reason.trim().length}/{MAX_REASON_LENGTH}
        </p>

        {rejectError ? (
          <p role="alert" className="text-err-500 mt-2 text-sm">
            {rejectError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => rejectDialog.current?.close()}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" loading={working === 'reject'} onClick={reject}>
            Send it back
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Dialog({
  ref,
  title,
  children,
}: {
  ref: React.RefObject<HTMLDialogElement | null>
  title: string
  children: React.ReactNode
}) {
  const titleId = `${title.replace(/\W+/g, '-').toLowerCase()}-title`

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="border-ink-700 bg-ink-900 text-washi-50 m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-6 backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-washi-50 font-serif text-2xl">
        {title}
      </h2>
      {children}
    </dialog>
  )
}
