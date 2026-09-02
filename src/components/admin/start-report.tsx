'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { startReport } from '@/lib/admin/actions'

/**
 * Move an approved order into report production.
 *
 * Deliberately plain: no confirmation dialog, because unlike approving or
 * rejecting this costs the customer nothing and promises them nothing — the
 * delivery date was already fixed at approval. It only tells the queue what
 * you are working on.
 */
export function StartReport({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setWorking(true)
    setError(null)
    const result = await startReport(orderId)
    setWorking(false)

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <MicroLabel>Approved — waiting on you</MicroLabel>
        <p className="text-washi-300 mt-2 text-sm">
          The sample is accepted and the clock is running. Mark this as in production when you start
          writing, and the report upload appears here.
        </p>
      </div>
      <div>
        <Button type="button" onClick={start} loading={working}>
          Start the report
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-err-500 text-sm">
          {error}
        </p>
      ) : null}
    </Card>
  )
}
