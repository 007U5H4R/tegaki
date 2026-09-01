import { cn } from '@/lib/cn'

/**
 * The wizard stepper — Design.md §3.4.
 *
 * Shares its visual language with the how-it-works rail and the order status
 * rail: one dashed-connector lineage for "process", so the same idea never
 * arrives wearing three different costumes (§3.8, continuity).
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: readonly string[]
  /** Zero-based index of the active step. */
  current: number
  className?: string
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-start">
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current

          return (
            <li key={step} className={cn('flex flex-1 flex-col gap-2', i > 0 && 'ml-2')}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    'duration-pop transition-[background-color,border-color,color] ease-out',
                    done && 'border-shu-500 bg-shu-500 text-washi-50',
                    active && 'border-shu-500 text-shu-500',
                    !done && !active && 'border-ink-700 text-ink-500',
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                      <path
                        d="M4 8.25 6.75 11 12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>

                {i < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      'h-px flex-1 border-t border-dashed',
                      done ? 'border-shu-500' : 'border-ink-700',
                    )}
                  />
                ) : null}
              </div>

              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'font-mono text-[0.6875rem] tracking-[0.08em] uppercase',
                  active ? 'text-washi-50' : done ? 'text-washi-300' : 'text-ink-500',
                )}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
