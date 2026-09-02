'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { moveOrder, markDelivered } from '@/lib/admin/actions'
import { adminActionsFor } from '@/lib/orders/transitions'
import type { OrderStatus } from '@/lib/orders/status'

/**
 * The analyst's controls for an order — generated, not written.
 *
 * Every button comes from `TRANSITIONS`, the same list the 49-pair matrix
 * test walks against the live `transition_order()`. So the interface can only
 * ever offer an edge the database would accept, and a hand-written button
 * cannot outlive the rule it was written for.
 *
 * Rejection is not here: it needs a reason the customer reads verbatim, so it
 * keeps its own dialog in ReviewActions. Completing is not here either — an
 * order is completed by attaching the report, inside `attach_report()`, so it
 * can never be completed with nothing to download.
 */
export function StatusControls({
  orderId,
  status,
  deliveredAt,
}: {
  orderId: string
  status: OrderStatus
  deliveredAt: string | null
}) {
  const router = useRouter()
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<{
    to: OrderStatus
    label: string
    consequence: string
  } | null>(null)

  const moves = adminActionsFor(status).filter((t) => !t.needsReason)
  const canDeliver = status === 'completed' && !deliveredAt

  if (moves.length === 0 && !canDeliver && !deliveredAt) return null

  async function confirmMove() {
    if (!pending) return
    setWorking(pending.to)
    setError(null)
    const result = await moveOrder(orderId, pending.to)
    setWorking(null)
    dialog.current?.close()

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function deliver() {
    setWorking('delivered')
    setError(null)
    const result = await markDelivered(orderId)
    setWorking(null)

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Card className="flex flex-col gap-4">
      <MicroLabel tone="muted">What happens next</MicroLabel>

      <div className="flex flex-wrap gap-3">
        {moves.map((move) => (
          <Button
            key={move.to}
            type="button"
            onClick={() => {
              setPending({ to: move.to, label: move.label!, consequence: move.consequence ?? '' })
              setError(null)
              dialog.current?.showModal()
            }}
          >
            {move.label}
          </Button>
        ))}

        {canDeliver ? (
          <Button type="button" onClick={deliver} loading={working === 'delivered'}>
            Mark as delivered
          </Button>
        ) : null}
      </div>

      {deliveredAt ? (
        <p className="text-washi-300 text-sm">
          You marked this delivered on{' '}
          <strong className="text-washi-50">{formatDay(deliveredAt)}</strong>. The customer&rsquo;s
          rail shows it as delivered.
        </p>
      ) : status === 'completed' ? (
        <p className="text-washi-300 text-sm">
          The report is downloadable. Mark it delivered once you have actually sent it — that is the
          date the 90-day retention clock counts from.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <dialog
        ref={dialog}
        aria-labelledby="status-move-title"
        className="border-ink-700 bg-ink-900 text-washi-50 m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-6 backdrop:bg-black/60"
      >
        <h2 id="status-move-title" className="text-washi-50 font-serif text-2xl">
          {pending?.label}
        </h2>
        <p className="text-washi-300 mt-3 text-sm">{pending?.consequence}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="quiet" size="sm" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button type="button" size="sm" loading={working === pending?.to} onClick={confirmMove}>
            {pending?.label}
          </Button>
        </div>
      </dialog>
    </Card>
  )
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
