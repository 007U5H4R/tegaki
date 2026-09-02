'use client'

import { useId, useRef, useState } from 'react'
import { MicroLabel } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { EXCERPTS, FICTIONAL_LABEL } from '@/content/excerpts'
import { TIER_DETAILS } from '@/lib/tiers'

/**
 * One excerpt per depth — Design.md §3.2-6.
 *
 * The subjects are fictional composites, and the label saying so sits **on
 * the card**, in the same type size as the byline, not in a footnote. The
 * PRD rules out testimonials until real ones exist; a "sample report" that
 * let a reader assume it was somebody's real assessment would be the same
 * dishonesty wearing better clothes.
 *
 * Proper tab semantics — `role="tablist"`, arrow keys, roving tabindex — so
 * this is operable without a mouse. A tab strip that only responds to clicks
 * is three buttons pretending.
 */
export function Excerpts() {
  const [active, setActive] = useState(0)
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
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <MicroLabel>From a report</MicroLabel>
      <h2 className="text-washi-50 mt-3 font-serif text-4xl">How it reads.</h2>

      <div
        role="tablist"
        aria-label="Report excerpts by depth"
        onKeyDown={onKeyDown}
        className="mt-8 flex flex-wrap gap-2"
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
              'duration-press rounded-full border px-4 py-2 font-mono text-xs tracking-[0.08em] uppercase transition-[color,background-color,border-color] ease-out',
              active === i
                ? 'border-shu-500 bg-shu-900/30 text-washi-50'
                : 'border-ink-700 text-washi-300 hover:border-ink-500',
            )}
          >
            {TIER_DETAILS[item.tier].name}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className="bg-washi-50 text-ink-950 mt-6 rounded-2xl p-6 sm:p-10"
      >
        {/* On the card, not in a footnote. */}
        <p className="text-shu-700 font-mono text-xs tracking-[0.08em] uppercase">
          {FICTIONAL_LABEL}
        </p>

        {/* ink-700, not ink-500: the metadata tokens are calibrated against
            the dark ground, and on this washi card ink-500 measures 3.6:1 —
            below the 4.5:1 small text needs. Lighthouse caught it. */}
        <p className="text-ink-700 mt-4 font-mono text-xs">
          {excerpt.subject} · {excerpt.context} · {tier.name}
        </p>

        <h3 className="text-ink-950 mt-3 font-serif text-2xl">{excerpt.heading}</h3>
        <p className="mt-4 max-w-[62ch] leading-relaxed">{excerpt.body}</p>
      </div>
    </section>
  )
}
