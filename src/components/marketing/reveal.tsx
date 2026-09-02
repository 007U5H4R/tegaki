'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Reveal a section as it enters view — Design.md §4.2.
 *
 * IntersectionObserver, never a scroll listener: a listener fires on every
 * frame of every scroll and recalculates layout while doing it, which on the
 * mid-range Android this product is built for is the difference between a
 * page that glides and one that stutters.
 *
 * `once`. Content that re-animates every time it scrolls past draws attention
 * to itself instead of to what it says.
 *
 * The hidden state is added by the effect rather than rendered, so the server
 * sends a visible section and JavaScript takes it away for the moment before
 * it comes back. Without JS, an old browser, or an exception, the content is
 * simply there — a reveal that hides content by default is a reveal that can
 * hide it forever. Doing it through the ref rather than through state also
 * avoids a second render for something the browser can do in one.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  /** Milliseconds, for staggering siblings. */
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    el.classList.add('reveal')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        el.dataset.shown = 'true'
        observer.disconnect()
      },
      { rootMargin: '-80px' },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      el.classList.remove('reveal')
    }
  }, [])

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(className)}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}
