import Link from 'next/link'
import { HeroMotion } from './hero-motion'
import { HeroScene, MobileSheet } from './hero-scene'

/**
 * The hero: an analyst, a page, and a red pencil.
 *
 * The approved design, built: a terracotta wall, warm-ivory editorial serif
 * on the left (~40%), the illustrated scene on the right (~60%) anchored to
 * the torn cream edge below. Phones put the headline, copy and CTA first,
 * then the sheet flat and large enough to read, then the whole scene.
 *
 * Load order is written as `--at` delays on the elements themselves, in
 * milliseconds after the terracotta is on screen (nav 100 · headline 200 ·
 * copy and CTA 550–700 · illustration 500 · first red mark 900).
 */

const at = (ms: number, y = 12) => ({ '--at': `${ms}ms`, '--rise-y': `${y}px` }) as React.CSSProperties

export function Hero() {
  return (
    <section
      id="hero"
      data-nav-surface="terra"
      className="wall text-paper-50 relative overflow-x-clip pt-24 pb-24 sm:pt-28 lg:min-h-[44rem] lg:pt-16 lg:pb-0"
      // As the hero leaves, it slides 40px under the cream paper that
      // follows it, so the paper reads as pulled up over the wall. Only the
      // hero moves; a transform on everything after it would mean a layer
      // the height of the whole page. HeroMotion measures layout, not this.
      style={{ transform: 'translateY(calc(var(--hero-exit, 0) * 40px))' }}
    >
      <HeroMotion target="hero" />

      {/* Desktop: the hero is one viewport tall and the scene is sized from
          that height (capped by its column), so the illustration fills the
          page on wide screens and the copy column takes whatever remains. */}
      <div className="relative z-[1] mx-auto grid w-full gap-x-0 gap-y-10 px-5 sm:px-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(22rem,36fr)_64fr] lg:items-end lg:px-[4vw]">
        {/* ---------------- copy ---------------- */}
        <div className="relative z-[2] self-center lg:pt-10 lg:pb-24">
          <h1
            className="land-rise font-display text-[clamp(2.9rem,5.4vw,5.1rem)] leading-[0.93] font-bold tracking-[-0.015em] text-balance"
            style={at(200, 14)}
          >
            Your
            <br className="hidden lg:block" /> handwriting
            <br />
            has been
            <br />
            <span className="text-teal-900 relative inline-block pr-1 font-medium italic">
              talking
              <Underline />
            </span>
            <br />
            this whole time.
          </h1>

          <p
            className="land-rise font-hand relative mt-5 inline-block -rotate-1 pr-10 text-[1.55rem] leading-[1.05] font-medium sm:text-[1.7rem]"
            style={at(560)}
          >
            we just know
            <br />
            how to read it.
            <svg
              aria-hidden
              viewBox="0 0 40 40"
              className="absolute -top-1 right-0 size-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 4 34 C 12 28 22 18 32 8 M 22 7 L 33 6 L 32 17"
                pathLength="100"
                className="draw-once"
                style={{ '--at': '1200ms', '--draw': '520ms' } as React.CSSProperties}
              />
            </svg>
          </p>

          <p className="land-rise mt-7 max-w-[34ch] text-[1.05rem] leading-relaxed sm:text-lg" style={at(640)}>
            Two pages. One human reader.
            <br />A surprisingly personal report.
          </p>

          <div className="land-rise mt-8 flex flex-wrap items-center gap-x-7 gap-y-4" style={at(720)}>
            <Link
              href="/sign-in"
              className="cta-ink font-hand inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 py-2.5 text-[1.35rem] leading-none font-semibold"
            >
              <span>Read my handwriting</span>
              <span className="cta-arrow" aria-hidden>
                →
              </span>
              {/* the two tiny ochre strokes beside the button */}
              <svg aria-hidden viewBox="0 0 24 24" className="cta-accent" fill="none" stroke="var(--color-ochre-500)" strokeWidth="1.8" strokeLinecap="round">
                <path d="M 6 18 L 12 8 M 14 20 L 20 12" />
              </svg>
            </Link>
            <a href="#report" className="link-fine text-paper-50 text-[0.95rem] font-medium">
              See a sample report
            </a>
          </div>
        </div>

        {/* ---------------- scene (desktop) ---------------- */}
        <div
          className="illo-settle relative z-[3] hidden self-end justify-self-end lg:block lg:-mr-[4vw]"
          style={{ '--at': '500ms', width: 'min(100%, calc((100svh - 4rem) * 1.22))' } as React.CSSProperties}
        >
          <HeroScene className="w-full" />
        </div>

        {/* ---------------- phones: the sheet, then the scene ---------------- */}
        <div className="illo-settle lg:hidden" style={{ '--at': '500ms' } as React.CSSProperties}>
          <MobileSheet className="mx-auto max-w-[26rem]" />
        </div>
        {/* Phones: a crop of the scene — the analyst, the top of his page and
            the cat — rather than the whole room at postage-stamp size. The
            readable, tappable sheet is the one above. */}
        <div className="illo-settle -mx-5 sm:-mx-8 lg:hidden" style={{ '--at': '700ms' } as React.CSSProperties}>
          <div className="relative mx-auto w-full max-w-[44rem] overflow-hidden" style={{ aspectRatio: '10 / 11' }}>
            <HeroScene
              className="absolute top-[-1%] left-[-46%] w-[150%]"
              interactive={false}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** The pencil line under "talking", drawn after the headline lands. */
function Underline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 14"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-[0.06em] left-0 h-[0.16em] w-[96%]"
      fill="none"
    >
      <path
        d="M 3 9 C 40 4 80 10 120 6 C 160 2 190 8 217 5"
        stroke="var(--color-paper-50)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        className="draw-once"
        style={{ '--at': '780ms', '--draw': '480ms' } as React.CSSProperties}
      />
    </svg>
  )
}
