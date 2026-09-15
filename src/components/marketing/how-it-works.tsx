import { Reveal } from './reveal'
import { TornEdge } from './torn-edge'

/**
 * How it works — the second sheet of paper.
 *
 * Warm cream paper pulled out from under the terracotta: the torn top edge
 * overlaps the hero, and the whole section rises a further 40px as the hero
 * leaves (`--hero-exit`, written by HeroMotion). A thin red curved arrow
 * continues down from the analyst's page and lands on the section label,
 * drawing itself as the section comes into view.
 *
 * Three stages in reading order, revealed one after another, set as
 * editorial columns with thin dividers. Icons are hand-drawn linework that
 * draws itself; no card, no shadow.
 */

const STAGES = [
  {
    n: '01',
    label: 'You send',
    body: 'Two pages of your handwriting, on plain paper, photographed or scanned.',
    icon: (
      // two sheets, one behind the other, with a few lines of writing
      <>
        <path d="M 14 10 H 30 L 36 16 V 40 H 14 Z" />
        <path d="M 10 14 V 44 H 32" />
        <path d="M 19 22 H 30 M 19 27 H 31 M 19 32 H 26" />
      </>
    ),
  },
  {
    n: '02',
    label: 'We read',
    body: 'A human analyst looks at the patterns in your writing, considered in context.',
    icon: (
      // a loupe over three strokes
      <>
        <path d="M 8 16 C 14 13 20 18 26 14 M 8 24 C 14 21 20 26 26 22" />
        <circle cx="30" cy="30" r="8" />
        <path d="M 36 36 L 43 43" />
      </>
    ),
  },
  {
    n: '03',
    label: 'You receive',
    body: 'A thoughtful, easy-to-read personal report, written for you to reflect on.',
    icon: (
      // a folded report, with a small seal
      <>
        <path d="M 12 6 H 30 L 38 14 V 42 H 12 Z M 30 6 V 14 H 38" />
        <path d="M 18 22 H 32 M 18 28 H 32 M 18 34 H 26" />
        <circle cx="33" cy="36" r="3.5" fill="var(--color-pencil-500)" stroke="none" />
      </>
    ),
  },
] as const

export function HowItWorks() {
  return (
    <section id="how" data-nav-surface="paper" className="grain relative z-[2] -mt-14 scroll-mt-20 lg:-mt-20">
      <TornEdge side="top" className="relative z-[2] h-14 sm:h-20" />

      <div className="bg-paper-50 text-inkl-900 relative">
        <div className="relative z-[1] mx-auto w-full max-w-[84rem] px-5 pt-10 pb-8 sm:px-8 sm:pb-10 lg:px-[4vw] lg:pt-14">
          <Reveal soft className="relative max-w-[40rem]">
            {/* the red thread from the analyst's page, drawn as the label
                arrives and landing just to the right of it */}
            <svg
              aria-hidden
              viewBox="0 0 120 120"
              className="pointer-events-none absolute -top-[6.5rem] left-[11rem] hidden h-28 w-28 lg:block"
              fill="none"
              stroke="var(--color-pencil-500)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 108 4 C 90 30 60 56 34 84 C 28 91 22 98 16 106 M 12 92 L 15 108 L 30 102"
                pathLength="100"
                className="draw-on-reveal"
                style={{ '--at': '150ms', '--draw': '800ms' } as React.CSSProperties}
              />
            </svg>
            <p id="how-label" className="font-mono flex items-baseline gap-4 text-[0.72rem] tracking-[0.18em] uppercase">
              <span className="text-pencil-600">01</span>
              <span>How it works</span>
            </p>
            <h2 className="font-display mt-6 text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.015em]">
              From handwriting
              <br />
              <span className="relative inline-block">
                to insight.
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-[0.02em] left-0 h-[0.14em] w-[92%]"
                  fill="none"
                >
                  <path
                    d="M 2 8 C 40 3 90 9 140 5 C 165 3 185 6 198 4"
                    stroke="var(--color-ochre-500)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    pathLength="100"
                    className="draw-on-reveal"
                    style={{ '--at': '450ms' } as React.CSSProperties}
                  />
                </svg>
              </span>
            </h2>
          </Reveal>

          <ol className="mt-16 grid gap-y-10 sm:grid-cols-3 sm:gap-x-0 lg:mt-24">
            {STAGES.map((stage, i) => (
              <Reveal
                as="li"
                soft
                key={stage.n}
                delay={250 + i * 150}
                className="border-inkl-900/15 relative sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
              >
                <div className="flex items-end justify-between gap-4">
                  <svg
                    viewBox="0 0 48 48"
                    className="size-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <g pathLength="100" className="draw-on-reveal" style={{ '--at': `${300 + i * 150}ms`, '--draw': '900ms' } as React.CSSProperties}>
                      {stage.icon}
                    </g>
                  </svg>
                  <span className="font-mono text-pencil-600 text-[0.72rem] tracking-[0.18em]" aria-hidden>
                    {stage.n}
                  </span>
                </div>
                <h3 className="font-display mt-6 text-[1.6rem] leading-tight font-semibold">
                  <span className="sr-only">{stage.n}. </span>
                  {stage.label}
                </h3>
                <p className="mt-2 max-w-[30ch] text-[1rem] leading-relaxed opacity-90">{stage.body}</p>
              </Reveal>
            ))}
          </ol>

          {/* one of the analyst's notes, the way he'd write it */}
          <Reveal soft delay={650} className="mt-20 flex justify-end">
            <p className="font-hand rotate-1 text-right text-2xl leading-tight font-medium sm:text-[1.7rem]">
              Same words.
              <br />
              A different perspective.
              <svg
                aria-hidden
                viewBox="0 0 160 16"
                className="mt-1 ml-auto block h-4 w-40"
                fill="none"
                stroke="var(--color-ochre-500)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M 2 12 C 40 4 100 14 158 6" pathLength="100" className="draw-on-reveal" style={{ '--at': '900ms' } as React.CSSProperties} />
              </svg>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
