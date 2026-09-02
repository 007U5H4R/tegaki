'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lockup } from '@/components/brand/lockup'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

/**
 * The public top bar — Design.md §3.1.
 *
 * The T02 ticket deferred this deliberately: nav built before the pages it
 * navigates is nav built against guesses. These are the real sections.
 *
 * The mobile overlay uses a native `<dialog>`-free approach but keeps the
 * things a dialog would give it: Escape closes, focus goes to the panel, and
 * the page behind is inert to scroll. The hamburger *morphs* into a cross
 * rather than swapping icons — nothing in the real world disappears and is
 * replaced by something else in the same spot.
 */

const SECTIONS = [
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#samples', label: 'Samples' },
  { href: '#faq', label: 'FAQ' },
] as const

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="border-ink-700/60 bg-ink-950/85 fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" aria-label="Tegaki 手書き — home" className="shrink-0">
          <Lockup />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-6">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <a
                  href={section.href}
                  className="text-washi-300 hover:text-washi-50 duration-press font-mono text-sm tracking-[0.08em] uppercase transition-[color] ease-out"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>

          <Button asChild size="sm">
            <Link href={signedIn ? '/dashboard' : '/sign-in'}>
              {signedIn ? 'Dashboard' : 'Begin your assessment'}
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="text-washi-50 -mr-2 grid size-11 place-items-center md:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden className="relative block h-4 w-6">
            {/* Two bars that rotate into a cross. Neither ever vanishes. */}
            <span
              className={cn(
                'bg-washi-50 duration-modal absolute left-0 block h-px w-6 transition-transform ease-out',
                open ? 'top-1/2 rotate-45' : 'top-1',
              )}
            />
            <span
              className={cn(
                'bg-washi-50 duration-modal absolute left-0 block h-px w-6 transition-transform ease-out',
                open ? 'top-1/2 -rotate-45' : 'top-[calc(100%-1px)]',
              )}
            />
          </span>
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="bg-ink-950/95 fixed inset-0 top-16 z-40 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col gap-2 px-4 py-8 sm:px-6">
            {SECTIONS.map((section, i) => (
              <li
                key={section.href}
                className="duration-modal translate-y-0 opacity-100 transition-[transform,opacity] ease-out starting:translate-y-3 starting:opacity-0"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <a
                  href={section.href}
                  onClick={() => setOpen(false)}
                  className="text-washi-50 block py-3 font-serif text-2xl"
                >
                  {section.label}
                </a>
              </li>
            ))}
            <li className="mt-4">
              <Button asChild className="w-full">
                <Link href={signedIn ? '/dashboard' : '/sign-in'} onClick={() => setOpen(false)}>
                  {signedIn ? 'Dashboard' : 'Begin your assessment'}
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
