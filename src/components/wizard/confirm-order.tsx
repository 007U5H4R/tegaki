'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Seal } from '@/components/brand/seal'
import { Button } from '@/components/ui/button'
import { submitOrder } from '@/lib/orders/submit-action'

type Status = 'idle' | 'working' | 'stamped'

/**
 * Wizard stage 4 — confirming.
 *
 * Wraps the server-rendered summary so the seal can stamp onto it
 * (Design.md §4.3, the one celebratory beat). The action deliberately does
 * not redirect: the beat has to play on the page that was just confirmed.
 *
 * The button locks from the first click, but that is a courtesy rather than
 * the guard. Two clicks that both reach the server still produce exactly one
 * payment, because `payments.order_id` is unique and `submit_order()` takes a
 * row lock — proven in tests/rls/payments.test.ts.
 */
export function ConfirmOrder({
  orderId,
  children,
}: {
  orderId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function confirm() {
    setStatus('working')
    setError(null)

    const result = await submitOrder(orderId)

    if (result.error) {
      setStatus('idle')
      setError(result.error)
      return
    }

    setStatus('stamped')

    // Long enough to watch the seal land, and no longer. Someone who has
    // asked for reduced motion is not asked to wait for an animation they
    // will not see.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(
      () => {
        router.push('/dashboard?submitted=1')
        // The submit action revalidates nothing, so the dashboard is asked for
        // fresh data here rather than served from the client router cache
        // without the order that was just placed.
        router.refresh()
      },
      reduce ? 200 : 1100,
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        {children}

        {status === 'stamped' ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <Seal size={128} title={null} className="seal-stamp text-shu-500 drop-shadow-lg" />
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="button"
          onClick={confirm}
          loading={status === 'working'}
          disabled={status === 'stamped'}
          className="w-full sm:w-auto"
        >
          Confirm my order
        </Button>
      </div>

      {/* The stamp is decorative; this is how the same moment reaches someone
          using a screen reader. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status === 'stamped' ? 'Order confirmed. Taking you to your assessments.' : ''}
      </p>
    </div>
  )
}
