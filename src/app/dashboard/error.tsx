'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/states'

/**
 * The dashboard's error state — the fourth of the four required screen states
 * (Solution-PRD §6.4).
 *
 * `reset` is Next's own re-render of the segment, so "Try again" genuinely
 * retries the failed query rather than reloading the whole page and losing
 * the user's place.
 *
 * The message stays generic on purpose. A database error string can name
 * tables and columns, and this screen belongs to a product whose promise is
 * that handwriting samples stay private; the detail goes to the console for
 * whoever is debugging, not to the customer.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-washi-50 font-serif text-4xl">Your assessments</h1>
      <div className="mt-8">
        <ErrorState
          message="We could not load your assessments just now. Nothing has been lost — please try again."
          onRetry={reset}
        />
      </div>
    </main>
  )
}
