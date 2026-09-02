'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { RAIL_POSITION, RAIL_STEPS, type OrderStatus } from '@/lib/orders/status'

/**
 * Where an order has got to — Design.md §3.6.
 *
 * Four nodes, mapped one-to-one onto Solution-PRD §6.6. `needs_reupload` and
 * `parked` are deliberately absent: they replace the rail with their own
 * panel rather than showing progress, because a stalled order pretending to
 * advance is a lie told to the person waiting.
 *
 * The active node pulses. It pauses when the tab is hidden — browsers
 * already throttle background animation, but saying so explicitly is what
 * the spec asks for and costs one listener.
 */
export function StatusRail({
  status,
  delivered = false,
  className,
}: {
  status: OrderStatus
  /**
   * `completed` means the report exists and is downloadable; the last node
   * only fills once the analyst confirms they actually sent it. Showing
   * "Delivered" as done before that would be the software claiming credit for
   * something that happens in Tushar's inbox.
   */
  delivered?: boolean
  className?: string
}) {
  const active = delivered ? RAIL_STEPS.length : RAIL_POSITION[status]
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onChange = () => setHidden(document.visibilityState === 'hidden')
    onChange()
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  if (active === undefined) return null

  return (
    <ol className={cn('flex items-start', className)} aria-label="Progress">
      {RAIL_STEPS.map((label, i) => {
        const done = i < active
        const isActive = i === active

        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'grid size-2 shrink-0 place-items-center rounded-full',
                  done && 'bg-ok-500',
                  isActive && 'bg-shu-500',
                  !done && !isActive && 'bg-ink-700',
                  isActive && !hidden && 'rail-pulse',
                )}
              />
              {/* The connector stops at the last node rather than trailing
                  into nothing. */}
              {i < RAIL_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn('h-px min-w-4 flex-1', done ? 'bg-ok-500/50' : 'bg-ink-700')}
                />
              ) : null}
            </div>

            <span
              className={cn(
                'font-mono text-[0.625rem] tracking-[0.08em] uppercase',
                done && 'text-ok-500',
                isActive && 'text-shu-500',
                !done && !isActive && 'text-ink-500',
              )}
            >
              {/* Only the current step is announced as current; the rest are
                  read as plain list items. */}
              {isActive ? <span className="sr-only">Current step: </span> : null}
              {done ? <span className="sr-only">Done: </span> : null}
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
