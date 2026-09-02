'use client'

import { Fragment, useEffect, useRef } from 'react'

/**
 * The tagline moment — Design.md §3.2-3 and §4.2.
 *
 * Two lines, activating a word at a time in reading order as they cross the
 * trigger. Each word is its own IntersectionObserver target rather than one
 * throttled scroll listener: the browser does the geometry off the main
 * thread, and there is no per-frame work to get wrong.
 *
 * The muting is applied by the effect, not rendered. Without JavaScript the
 * sentence simply reads at full strength — a reveal that starts invisible is
 * a reveal that can stay invisible. The colours live in globals.css, keyed
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
    <section className="mx-auto w-full max-w-6xl px-4 py-32 sm:px-6">
      <div ref={root} data-tagline className="max-w-[680px]">
        {LINES.map((line, lineIndex) => (
          <p
            key={lineIndex}
            className="text-washi-50 font-serif text-[clamp(2rem,6vw,3.75rem)] leading-[1.15]"
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
    </section>
  )
}
