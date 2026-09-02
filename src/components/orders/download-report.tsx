'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getReportDownloadUrl } from '@/lib/reports/actions'

/**
 * The customer's copy of their report.
 *
 * The link is minted on click rather than rendered into the page, and it
 * lives for sixty seconds. A signed URL is a bearer token in a query string —
 * it ends up in browser history and in whatever gets forwarded — so putting
 * one in the HTML of every dashboard load would leave a working link lying
 * around long after the page was closed.
 */
export function DownloadReport({ orderId }: { orderId: string }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function download() {
    setWorking(true)
    setError(null)

    const result = await getReportDownloadUrl(orderId)
    setWorking(false)

    if (result.error || !result.url) {
      setError(result.error ?? 'We could not open your report just then.')
      return
    }
    // Same tab: the signed URL responds with a download disposition, so the
    // page the customer is on stays where it is.
    window.location.href = result.url
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={download} loading={working}>
          Download report (PDF)
        </Button>
        <p className="text-washi-300 text-sm">Also sent to you directly by Tushar.</p>
      </div>

      {error ? (
        <p role="alert" className="text-err-500 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
