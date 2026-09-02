import type { Metadata } from 'next'
import Link from 'next/link'
import { Seal } from '@/components/brand/seal'
import { Button } from '@/components/ui/button'
import { MicroLabel } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false },
}

/**
 * The 404 — Design.md §5.2 ship set.
 *
 * Branded, and it offers a way out rather than only an apology. Somebody
 * arriving here has usually followed a stale link from a message, so the
 * useful thing is the two places they were probably trying to reach.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[52ch] flex-col items-center px-4 py-32 text-center sm:px-6">
      <Seal size={80} title={null} className="text-shu-500" />

      <MicroLabel className="mt-8">404</MicroLabel>
      <h1 className="text-washi-50 mt-3 font-serif text-[clamp(2rem,6vw,3rem)]">
        This page isn&rsquo;t in our files.
      </h1>
      <p className="text-washi-300 mt-4">
        The link may be old, or it may never have existed. Nothing has gone wrong with your order —
        those live in your dashboard.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/">Back to the start</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Your assessments</Link>
        </Button>
      </div>
    </main>
  )
}
