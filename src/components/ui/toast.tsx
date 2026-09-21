'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Toast — Design.md §4.3.
 *
 * Enters and exits along the same axis (up from the bottom), because an
 * element that leaves the way it arrived is what makes a dismissal gesture
 * feel obvious. Transitions rather than keyframes: a transition retargets
 * from wherever it currently is, so a toast dismissed mid-entrance slides
 * back down smoothly instead of restarting.
 *
 * Deliberately not a queue. One confirmation at a time is all this product
 * produces today; the admin surfaces that need stacking can grow this when
 * they exist, rather than this shipping a manager with one client.
 */
export function Toast({
  message,
  onDismiss,
  durationMs = 6000,
}: {
  message: string
  onDismiss?: () => void
  /** Time on screen before it leaves of its own accord. */
  durationMs?: number
}) {
  const [leaving, setLeaving] = useState(false)
  const dismissed = useRef(false)

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), durationMs)
    return () => clearTimeout(hide)
  }, [durationMs])

  useEffect(() => {
    if (!leaving || dismissed.current) return
    dismissed.current = true
    // Matches the exit transition, so the element is gone only once it has
    // actually finished leaving.
    const done = setTimeout(() => onDismiss?.(), 400)
    return () => clearTimeout(done)
  }, [leaving, onDismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'border-ink-700 bg-ink-900 text-washi-50 in-[[data-theme=paper]]:border-inkl-900/15 in-[[data-theme=paper]]:bg-paper-100 in-[[data-theme=paper]]:text-inkl-900 pointer-events-auto',
          'flex w-full max-w-md items-center gap-4 rounded-2xl border px-5 py-4 shadow-lg',
          'transition-[transform,opacity] duration-[400ms] ease-out',
          // @starting-style, so the entrance needs no mount flag and no
          // JavaScript timer to look right.
          'starting:translate-y-full starting:opacity-0',
          leaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100',
        )}
      >
        <p className="flex-1 text-sm">{message}</p>
        <button
          type="button"
          onClick={() => setLeaving(true)}
          className="text-washi-300 hover:text-washi-50 in-[[data-theme=paper]]:text-inkl-900/60 in-[[data-theme=paper]]:hover:text-inkl-900 -m-2 shrink-0 p-2"
        >
          <span className="sr-only">Dismiss</span>
          <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden focusable="false">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
