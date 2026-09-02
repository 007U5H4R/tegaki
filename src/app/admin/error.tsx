'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/states'

/**
 * The queue's error state.
 *
 * The message can be blunter here than on a customer screen — the only
 * person who sees it is the analyst, and knowing whether to retry or to go
 * and look at the logs is useful to them. It still does not print the
 * database's own words: those name tables and columns, and this page renders
 * beside handwriting samples.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  return (
    <div className="py-8">
      <ErrorState
        message={`The queue could not be loaded just now. Nothing has been changed — try again, and if it keeps failing the server logs will have the detail${error.digest ? ` (${error.digest})` : ''}.`}
        onRetry={reset}
      />
    </div>
  )
}
