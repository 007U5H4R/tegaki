'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SampleUploader } from '@/components/upload/sample-uploader'
import { Button } from '@/components/ui/button'
import { MicroLabel } from '@/components/ui/card'
import { resubmitSample } from '@/lib/orders/resubmit-action'

/**
 * What a customer sees when their sample could not be used.
 *
 * The analyst's sentence is shown **verbatim**. It is the only thing the
 * customer has to work from, and softening or summarising it would be
 * putting words in the analyst's mouth about somebody else's handwriting.
 *
 * The uploader is the same component as wizard stage 2 — a customer whose
 * sample was rejected should meet exactly the interface they met the first
 * time, not a second, subtly different one. New files land as a new version;
 * the rejected page is never overwritten.
 */
export function ReuploadPanel({
  orderId,
  buyerId,
  reason,
  deadlineLabel,
  guardrails,
}: {
  orderId: string
  buyerId: string
  reason: string | null
  /**
   * Already formatted by the server. Formatting a date inside a client
   * component means Node and the browser each run their own ICU: 'en-IN'
   * renders differently in Safari, React sees a hydration mismatch, and
   * regenerates the tree — which on this panel wipes an upload in progress.
   */
  deadlineLabel: string | null
  guardrails: Record<string, boolean> | null
}) {
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function resubmit() {
    setWorking(true)
    setError(null)
    const result = await resubmitSample(orderId)
    setWorking(false)

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="border-err-500/40 bg-err-500/5 flex flex-col gap-5 rounded-2xl border p-5">
      <div>
        {/* Not a repeat of the status chip beside it — this label introduces
            the analyst's own words, which is what the panel is for. */}
        <MicroLabel tone="muted">What your analyst saw</MicroLabel>
        {reason ? <p className="text-washi-50 mt-2">{reason}</p> : null}
        {deadlineLabel ? (
          <p className="text-washi-300 mt-2 text-sm">
            Send a replacement by <strong className="text-washi-50">{deadlineLabel}</strong>. After
            that the order is parked and you would need to get in touch.
          </p>
        ) : null}
      </div>

      <SampleUploader
        orderId={orderId}
        buyerId={buyerId}
        initialGuardrails={guardrails ?? {}}
        initialFiles={[]}
        onUploaded={() => setAdded(true)}
      />

      {error ? (
        <p role="alert" className="text-err-500 text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={resubmit} loading={working} disabled={!added}>
          Send it back for review
        </Button>
        {!added ? <p className="text-washi-300 text-sm">Add your replacement page first.</p> : null}
      </div>
    </div>
  )
}
