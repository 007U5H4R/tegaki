'use client'

import { Fragment, useEffect, useRef } from 'react'

/**
 * The tagline moment.
 *
 * Two lines on the paper, coming up to full ink a word at a time in reading
 * order as they cross the trigger. Each word is its own IntersectionObserver
 * target rather than one throttled scroll listener: the browser does the
 * geometry off the main thread, and there is no per-frame work to get wrong.
 *
 * The muting is applied by the effect, not rendered. Without JavaScript the
 * sentence simply reads at full strength — a reveal that starts invisible is
 * a reveal that can stay invisible. The colours live in landing.css, keyed
 * off `data-armed`, so no state and no second render.
 */

const LINES = [
  ['Written', 'by', 'hand.'],
  ['Read', 'with', 'care.'],
] as const

export function TaglineReveal() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    el.dataset.armed = 'true'

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // Once. A tagline that re-dims on every pass keeps asking to be
          // read again.
          ;(entry.target as HTMLElement).dataset.lit = 'true'
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -35% 0px' },
    )

    for (const word of el.querySelectorAll<HTMLElement>('[data-word]')) observer.observe(word)

    return () => {
      observer.disconnect()
      delete el.dataset.armed
    }
  }, [])

  return (
    <section className="mx-auto w-full max-w-[84rem] px-5 pt-8 pb-24 sm:px-8 sm:pb-32 lg:px-[4vw]">
      <div className="border-inkl-900/15 flex flex-col gap-10 border-t pt-14 lg:flex-row lg:items-end lg:justify-between lg:pt-16">
        <div ref={root} data-tagline className="max-w-[40rem]">
          {LINES.map((line, lineIndex) => (
            <p
              key={lineIndex}
              className="font-display text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[1.02] font-bold tracking-[-0.015em]"
            >
              {line.map((word, wordIndex) => (
                <Fragment key={`${lineIndex}-${wordIndex}`}>
                  <span data-word style={{ transitionDelay: `${wordIndex * 60}ms` }}>
                    {word}
                  </span>
                  {/* Outside the span: an inline-block drops its own trailing
                    space, which rendered "Writtenbyhand." on production. */}
                  {wordIndex < line.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </p>
          ))}
        </div>

        {/* one handwritten aside for this viewport, no more */}
        <p className="font-hand text-pencil-600 max-w-[16ch] -rotate-2 text-[1.5rem] leading-[1.1] font-medium lg:mb-2 lg:text-right lg:text-[1.7rem]">
          Small details.
          <br />
          Bigger stories.
        </p>
      </div>
    </section>
  )
}
