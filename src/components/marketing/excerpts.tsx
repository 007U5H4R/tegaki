'use client'

import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { EXCERPTS, FICTIONAL_LABEL } from '@/content/excerpts'
import { TIER_DETAILS } from '@/lib/tiers'

/**
 * One excerpt per depth, on a sheet of paper.
 *
 * The subjects are fictional composites, and the label saying so sits **on
 * the sheet**, above the byline, not in a footnote. The PRD rules out
 * testimonials until real ones exist; a "sample report" that let a reader
 * assume it was somebody's real assessment would be the same dishonesty
 * wearing better clothes.
 *
 * Proper tab semantics — `role="tablist"`, arrow keys, roving tabindex — so
 * this is operable without a mouse. The tabs are the depth names, set as
 * text with a red-pencil underline on the one you are reading.
 */
export function Excerpts() {
  const [active, setActive] = useState(1)
  const baseId = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (delta === 0) return

    e.preventDefault()
    const next = (active + delta + EXCERPTS.length) % EXCERPTS.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  const excerpt = EXCERPTS[active]!
  const tier = TIER_DETAILS[excerpt.tier]

  return (
    <section id="report" className="mx-auto w-full max-w-[84rem] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-[4vw]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-bold tracking-[-0.015em]">
            How it reads.
          </h2>
          <p className="mt-5 max-w-[34ch] text-[1.05rem] leading-relaxed opacity-85">
            A paragraph from each depth, so you know the voice before you pay for it.
          </p>

          <div
            role="tablist"
            aria-label="Report excerpts by depth"
            onKeyDown={onKeyDown}
            className="mt-10 flex flex-col items-start gap-3"
          >
            {EXCERPTS.map((item, i) => (
              <button
                key={item.tier}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={active === i}
                aria-controls={`${baseId}-panel-${i}`}
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  'excerpt-tab font-display relative min-h-11 py-1 text-left text-[1.2rem] leading-none font-semibold transition-[opacity] duration-200',
                  active === i ? 'opacity-100' : 'opacity-55 hover:opacity-85',
                )}
              >
                {TIER_DETAILS[item.tier].name}
                <svg
                  aria-hidden
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute -bottom-0.5 left-0 h-[5px] w-full"
                  fill="none"
                  stroke="var(--color-pencil-500)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path
                    d="M 1 5 C 25 3 50 6 75 4 C 85 3.5 93 4.5 99 4"
                    pathLength="100"
                    className="mark"
                    data-drawn={active === i ? 'true' : undefined}
                    style={{ '--len': 100, '--draw': '420ms' } as React.CSSProperties}
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel-${active}`}
          aria-labelledby={`${baseId}-tab-${active}`}
          tabIndex={0}
          className="border-paper-100 relative -rotate-[0.6deg] border px-7 py-8 shadow-[0_1px_0_rgba(60,20,10,0.22)] sm:px-12 sm:py-12"
          style={{ background: '#faf3e4' }}
        >
          {/* On the sheet, not in a footnote. */}
          <p className="text-[0.85rem] font-semibold">{FICTIONAL_LABEL}</p>

          <p className="mt-5 text-[0.92rem] opacity-70">
            {excerpt.subject} · {excerpt.context} · {tier.name}
          </p>

          <h3 className="font-display mt-3 text-[1.6rem] leading-tight font-semibold text-balance">{excerpt.heading}</h3>
          <p className="mt-5 max-w-[62ch] text-[1.05rem] leading-[1.7] opacity-90">{excerpt.body}</p>
        </div>
      </div>
    </section>
  )
}
