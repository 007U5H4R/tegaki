'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lockup } from '@/components/brand/lockup'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

/**
 * The public top bar — Design.md §3.1, recoloured for the illustrated
 * landing page.
 *
 * On the terracotta wall it is quiet and ivory: small links, generous
 * spacing, no bar of its own, and the ivory pill with the handwritten
 * "Read my handwriting →". On the cream paper below it turns to ink. On the
 * dark product sections it is the original bar.
 *
 * The mobile overlay keeps the things a dialog would give it: Escape
 * closes, focus goes to the panel, and the page behind is inert. The
 * hamburger *morphs* into a cross rather than swapping icons.
 */

const SECTIONS = [
  { href: '#how', label: 'How it works' },
  { href: '#report', label: 'Sample report' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

type Surface = 'terra' | 'paper' | 'dark'

/**
 * Which surface is under the bar right now. The landing page's hero and
 * how-it-works sections declare `data-nav-surface`; everything else is the
 * ink ground. An observer per declared section, watching only the top 64px
 * band of the viewport, so the bar recolours exactly as a section's edge
 * passes beneath it — no scroll listener.
 *
 * The callback re-reads the geometry of every declared section rather than
 * trusting `isIntersecting` alone, so a section that starts under the bar
 * at load is recognised on the observer's first report.
 */
function useSurface(): Surface {
  const [surface, setSurface] = useState<Surface>('dark')

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-surface]'))
    if (sections.length === 0) return

    const underBar = () => {
      let next: Surface = 'dark'
      for (const el of sections) {
        const r = el.getBoundingClientRect()
        if (r.top <= 64 && r.bottom > 0) next = (el.dataset.navSurface as Surface) ?? 'dark'
      }
      return next
    }
    if (typeof IntersectionObserver === 'undefined') return
    // The observer reports every target once on observe(), so the first
    // paint after hydration already reads the section under the bar.
    const observer = new IntersectionObserver(() => setSurface(underBar()), {
      rootMargin: `0px 0px -${Math.max(window.innerHeight - 64, 0)}px 0px`,
      threshold: 0,
    })
    for (const el of sections) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return surface
}

/** True once the page has scrolled past the top of the hero. */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setScrolled(window.scrollY > 24)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return scrolled
}

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const surface = useSurface()
  const scrolled = useScrolled()
  const light = surface !== 'dark'

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Scroll lock alone is not enough: Tab walked straight past the menu
    // into the hero behind it. Everything that is not the menu is inert.
    const behind = ['main', 'footer'].flatMap((tag) => Array.from(document.querySelectorAll(tag)))
    for (const el of behind) el.setAttribute('inert', '')

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      for (const el of behind) el.removeAttribute('inert')
    }
  }, [open])

  const cta = signedIn ? 'Dashboard' : 'Read my handwriting'
  const href = signedIn ? '/dashboard' : '/sign-in'

  return (
    <>
      <header
        data-surface={surface}
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,color] duration-300 ease-out',
          // On the wall the bar is transparent at the top of the page and
          // takes the wall's colour once content scrolls under it.
          surface === 'terra' && 'text-paper-50',
          surface === 'terra' && scrolled && 'bg-terra-500',
          surface === 'paper' && 'bg-paper-50 text-inkl-900',
          surface === 'dark' && 'border-ink-700/60 bg-ink-950/85 border-b backdrop-blur-xl',
        )}
      >
        <nav
          aria-label="Main"
          className={cn(
            'mx-auto flex w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-[4vw]',
            light ? 'h-[clamp(4rem,5vw,6rem)]' : 'h-16 max-w-[90rem] lg:px-10',
          )}
        >
          <Link href="/" className="land-rise shrink-0" style={{ '--at': '100ms', '--rise-y': '6px' } as React.CSSProperties}>
            <Lockup tone={surface === 'terra' ? 'paper' : surface === 'paper' ? 'ink' : 'washi'} showSubtitle={false} className="sm:hidden" />
            <Lockup
              tone={surface === 'terra' ? 'paper' : surface === 'paper' ? 'ink' : 'washi'}
              large={light}
              className="hidden sm:inline-flex"
            />
            <span className="sr-only"> — home</span>
          </Link>

          <div
            className="land-rise hidden items-center gap-[clamp(2rem,2.4vw,3rem)] md:flex"
            style={{ '--at': '100ms', '--rise-y': '6px' } as React.CSSProperties}
          >
            <ul className="flex items-center gap-[clamp(1.6rem,2vw,2.5rem)]">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className={cn(
                      'duration-press transition-[color,opacity] ease-out',
                      light && 'text-[clamp(0.9rem,1.05vw,1.25rem)] font-medium tracking-[0.005em]',
                      surface === 'terra' && 'text-paper-50 hover:text-paper-50/80',
                      surface === 'paper' && 'text-inkl-900 hover:text-inkl-900/75',
                      surface === 'dark' && 'text-washi-300 hover:text-washi-50 font-mono text-sm tracking-[0.08em] uppercase',
                    )}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>

            {light ? (
              <Link
                href={href}
                className={cn(
                  'font-hand inline-flex min-h-[clamp(2.5rem,2.8vw,3.4rem)] items-center gap-2.5 rounded-full px-[clamp(1.25rem,1.5vw,1.9rem)] py-1.5 text-[clamp(1.2rem,1.35vw,1.65rem)] leading-none font-semibold',
                  surface === 'terra' ? 'cta-paper' : 'cta-ink',
                )}
              >
                <span>{cta}</span>
                <span className="cta-arrow" aria-hidden>
                  →
                </span>
              </Link>
            ) : (
              <Button asChild size="sm">
                <Link href={href}>{signedIn ? 'Dashboard' : 'Begin your assessment'}</Link>
              </Button>
            )}
          </div>

          {/* phones: the pill stays visible; the links fold into the menu */}
          <div className="flex items-center gap-3 md:hidden">
            {light ? (
              <Link
                href={href}
                className={cn(
                  'font-hand inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1 text-[1rem] leading-none font-semibold whitespace-nowrap',
                  surface === 'terra' ? 'cta-paper' : 'cta-ink',
                )}
              >
                <span>{cta}</span>
                <span className="cta-arrow" aria-hidden>
                  →
                </span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className={cn('-mr-2 grid size-11 place-items-center', light ? 'text-current' : 'text-washi-50')}
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <span aria-hidden className="relative block h-4 w-6">
                {/* Two bars that rotate into a cross. Neither ever vanishes. */}
                <span
                  className={cn(
                    'duration-modal absolute left-0 block h-px w-6 bg-current transition-transform ease-out',
                    open ? 'top-1/2 rotate-45' : 'top-1',
                  )}
                />
                <span
                  className={cn(
                    'duration-modal absolute left-0 block h-px w-6 bg-current transition-transform ease-out',
                    open ? 'top-1/2 -rotate-45' : 'top-[calc(100%-1px)]',
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* A sibling of the header, not a child: backdrop-filter makes the
          header the containing block for fixed descendants, so nested here
          the overlay was sized to the 64px bar and its ink ground vanished —
          links drawn straight over the hero. */}
      {open ? (
        <div
          id="mobile-nav"
          className={cn(
            'fixed inset-0 z-40 md:hidden',
            light ? 'top-[clamp(4rem,5vw,6rem)]' : 'top-16',
            surface === 'terra' && 'wall text-paper-50',
            surface === 'paper' && 'bg-paper-50 text-inkl-900',
            surface === 'dark' && 'bg-ink-950/95 text-washi-50 backdrop-blur-xl',
          )}
        >
          <ul className="relative z-[1] flex flex-col gap-2 px-4 py-8 sm:px-6">
            {SECTIONS.map((section, i) => (
              <li
                key={section.href}
                className="duration-modal translate-y-0 opacity-100 transition-[transform,opacity] ease-out starting:translate-y-3 starting:opacity-0"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <a
                  href={section.href}
                  onClick={() => setOpen(false)}
                  className={cn('block py-3 text-2xl', light ? 'font-display font-semibold' : 'font-serif')}
                >
                  {section.label}
                </a>
              </li>
            ))}
            {light ? null : (
              <li className="mt-4">
                <Button asChild className="w-full">
                  <Link href={href} onClick={() => setOpen(false)}>
                    {signedIn ? 'Dashboard' : 'Begin your assessment'}
                  </Link>
                </Button>
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </>
  )
}
