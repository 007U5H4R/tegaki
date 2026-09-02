'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { FRAME_COUNT, useFrames, useHeroScrubEligible } from './use-hero-scrub'

/**
 * The pen-guided scroll — Design.md §4.2b.
 *
 * A 15-second film sliced into 180 frames, painted to a sticky canvas at an
 * index driven by scroll position. This *is* the page's three dimensions:
 * no WebGL, no Three.js, no smooth-scroll engine. The cinematic register
 * comes from a photograph and restraint, which is also why it costs a mid-
 * range Android nothing.
 *
 * Everything about it is conditional. Ineligible visitors — phones, reduced
 * motion, no JavaScript — get the static hero passed in as `fallback`, and
 * the frames are never requested. The gate is upstream of the fetch, not
 * upstream of the render, because 6.8 MB nobody sees is still 6.8 MB
 * somebody paid for.
 */

/**
 * Frame marks from the beat map, tuned against a screenshot sweep.
 *
 * None of these lines repeats a section further down the page. An earlier
 * pass used "Written by hand. Read with care." and "Ready when your pen is."
 * here, and both are said again later — the scrub is the opening of the
 * argument, not a preview of its ending.
 */
const CHAPTERS = [
  { from: 0, to: 50, kind: 'hero' as const },
  { from: 50, to: 96, kind: 'copy' as const, text: 'Two pages. Your own words. Unlined paper.' },
  { from: 96, to: 130, kind: 'copy' as const, text: 'Read by one person, not a machine.' },
  { from: 130, to: 160, kind: 'copy' as const, text: 'Three depths, from ₹999.' },
  { from: 160, to: FRAME_COUNT, kind: 'final' as const },
]

/**
 * Linear, deliberately.
 *
 * An ease-in-out here looked reasonable and quietly ate the last two
 * chapters: at 78% of the scroll it was already on frame 162, so the tiers
 * beat got a sliver of travel and the film appeared to jump. A screenshot
 * sweep is what showed it. Each beat now gets scroll in proportion to its
 * length, which is what the beat map assumes.
 */
function eased(t: number): number {
  return t
}

export function HeroScrub({ fallback }: { fallback: React.ReactNode }) {
  const eligible = useHeroScrubEligible()
  const { images, progress, ready } = useFrames(eligible)

  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState(0)

  // Paint only when the index changes — Design.md §4.1. Repainting an
  // identical frame on every scroll tick is the difference between a canvas
  // that glides and one that heats a laptop.
  const painted = useRef(-1)

  useEffect(() => {
    if (!ready) return
    const el = section.current
    const cv = canvas.current
    if (!el || !cv) return

    const ctx = cv.getContext('2d', { alpha: false })
    if (!ctx) return

    let raf = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(cv.clientWidth * dpr)
      cv.height = Math.round(cv.clientHeight * dpr)
      painted.current = -1
    }

    const paint = (index: number) => {
      const img = images[index]
      if (!img?.complete || img.naturalWidth === 0) return

      // Cover-fit with the poster's focal crop, so the still and the film
      // frame the same thing and the swap is invisible.
      const scale = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.drawImage(img, (cv.width - w) * 0.62, (cv.height - h) * 0.32, w, h)
      painted.current = index
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const rect = el.getBoundingClientRect()
        const travel = rect.height - window.innerHeight
        const p = travel <= 0 ? 0 : Math.min(Math.max(-rect.top / travel, 0), 1)
        const index = Math.round(eased(p) * (FRAME_COUNT - 1))

        if (index !== painted.current) {
          paint(index)
          setFrame(index)
        }
      })
    }

    size()
    onScroll()
    paint(0)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', size)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', size)
    }
  }, [ready, images])

  if (!eligible) return <>{fallback}</>

  const chapter = CHAPTERS.find((c) => frame >= c.from && frame < c.to) ?? CHAPTERS[0]!

  return (
    <section ref={section} className="relative h-[420svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* The same two scrims the static hero uses, so the copy is legible
            against every frame rather than against the average of them. */}
        <div
          aria-hidden
          className="from-ink-950 via-ink-950/92 absolute inset-0 bg-gradient-to-t via-58% to-transparent to-82%"
        />
        <div
          aria-hidden
          className="from-ink-950 via-ink-950/90 absolute inset-0 bg-gradient-to-r via-40% to-transparent to-68%"
        />

        {!ready ? <Preloader progress={progress} /> : null}

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
            {/* The hero copy is always in the DOM — it is the page's h1 and
                its primary action, and neither may depend on a scroll
                position. The later chapters only fade over it. */}
            <div
              className={cn(
                'duration-modal max-w-[680px] transition-opacity ease-out',
                chapter.kind === 'hero' ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <p className="text-shu-500 font-mono text-xs tracking-[0.14em] uppercase">
                Handwriting analysis ·{' '}
                <span className="font-jp" lang="ja">
                  手書き
                </span>
              </p>
              <h1 className="text-washi-50 mt-5 font-serif text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05]">
                Your handwriting
                <br />
                holds a story.
              </h1>
              <p className="text-washi-300 mt-6 max-w-[62ch] text-lg text-balance">
                A personal, growth-oriented assessment of what your writing suggests about how you
                think and work — analyzed by hand, delivered as a considered report.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild>
                  <Link href="/sign-in">Begin your assessment</Link>
                </Button>
                <Button asChild variant="ghost">
                  <a href="#samples">See a sample report</a>
                </Button>
              </div>
              <p className="text-washi-300 mt-6 font-mono text-xs">
                Pilot programme · reports hand-validated by Tushar Pathak
              </p>
            </div>

            {CHAPTERS.filter((c) => c.kind === 'copy').map((c) => (
              <p
                key={c.text}
                aria-hidden
                className={cn(
                  'absolute bottom-24 max-w-[680px] font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]',
                  'text-washi-50 duration-modal transition-opacity ease-out',
                  chapter === c ? 'opacity-100' : 'opacity-0',
                )}
              >
                {c.text}
              </p>
            ))}

            <div
              className={cn(
                'duration-modal absolute bottom-24 transition-opacity ease-out',
                chapter.kind === 'final' ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <p className="text-washi-50 font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
                Your turn.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/sign-in">Begin your assessment</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The counter is part of the show, not an apology for it — Geist Mono, shu,
 * and it leaves at 100 rather than lingering.
 */
function Preloader({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-x-0 bottom-8 flex justify-center">
      <p className="text-shu-500 font-mono text-xs tracking-[0.14em] tabular-nums">
        {String(Math.round(progress * 100)).padStart(3, '0')}
      </p>
    </div>
  )
}
