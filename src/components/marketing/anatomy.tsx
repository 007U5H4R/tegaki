import { SPECIMENS, type Specimen } from '@/content/anatomy'
import { Reveal } from './reveal'

/**
 * What a reading actually looks at.
 *
 * Three scraps of paper, each carrying two lines in the site's hand with one
 * trait exaggerated in CSS — the slant skewed, the spacing widened, the
 * pressure set heavier — and the analyst's one-word note in red pencil
 * beside it. Drawn rather than photographed, so no real hand is on the page,
 * and in the same language as the sheet he is reading in the hero.
 *
 * Each row separates the observation from the reading, in that order. The
 * mark on the page is evidence; what it suggests is interpretation. Letting
 * the two blur is precisely how this subject earns its bad reputation.
 */
export function Anatomy() {
  return (
    <section id="samples" className="mx-auto w-full max-w-[84rem] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-[4vw]">
      <Reveal soft className="max-w-[44rem]">
        <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-bold tracking-[-0.015em] text-balance">
          Three things on a page,
          <br />
          and what they suggest.
        </h2>
        <p className="mt-5 max-w-[54ch] text-[1.05rem] leading-relaxed opacity-85">
          Your report names what is visible in your writing before it offers any reading of it, so
          you can disagree with the second part while still trusting the first.
        </p>
      </Reveal>

      <ol className="mt-14 flex flex-col gap-14 lg:mt-16 lg:gap-16">
        {SPECIMENS.map((specimen, i) => (
          <Reveal
            as="li"
            soft
            key={specimen.id}
            delay={i * 80}
            className="grid items-center gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16"
          >
            <Scrap specimen={specimen} index={i} />

            <div className="max-w-[46ch]">
              <p className="font-mono text-[0.72rem] tracking-[0.16em] uppercase opacity-80">What we notice</p>
              <p className="font-display mt-2 text-[1.45rem] leading-snug font-semibold text-balance">
                {specimen.observation}
              </p>
              <p className="font-mono mt-6 text-[0.72rem] tracking-[0.16em] uppercase opacity-80">
                What it may suggest
              </p>
              <p className="mt-2 text-[1.02rem] leading-relaxed opacity-90">{specimen.reading}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

/** Trait → how the two lines are set. Everything else is identical. */
const STYLE: Record<Specimen['id'], React.CSSProperties> = {
  slant: { transform: 'skewX(-14deg)', fontWeight: 500 },
  spacing: { wordSpacing: '0.7em', fontWeight: 500 },
  pressure: { fontWeight: 700, color: '#2b3d52', letterSpacing: '-0.005em' },
}

const TILT = [-1.6, 1.1, -0.8] as const

function Scrap({ specimen, index }: { specimen: Specimen; index: number }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[26rem] lg:mx-0"
      style={{ transform: `rotate(${TILT[index] ?? 0}deg)` }}
    >
      <div
        className="border-paper-100 relative border px-7 pt-9 pb-8 shadow-[0_1px_0_rgba(60,20,10,0.22)]"
        style={{ background: '#f9f2e3' }}
      >
        <p
          className="font-hand text-hand-500 text-[clamp(1.45rem,2vw,1.8rem)] leading-[1.35]"
          style={STYLE[specimen.id]}
          aria-hidden
        >
          {specimen.lines[0]}
          <br />
          {specimen.lines[1]}
        </p>
        <span className="sr-only">
          Handwriting sample showing {specimen.trait}: &ldquo;{specimen.lines[0]} {specimen.lines[1]}&rdquo;
        </span>

        {/* the analyst's note, in red pencil, bottom right */}
        <span
          aria-hidden
          className="font-hand text-pencil-600 absolute right-5 -bottom-3 -rotate-6 text-[1.15rem] leading-none font-medium"
        >
          {specimen.trait}
        </span>
        <Mark id={specimen.id} />
      </div>
    </div>
  )
}

/** One red-pencil mark per trait, drawn as the row arrives. */
function Mark({ id }: { id: Specimen['id'] }) {
  const common = {
    fill: 'none',
    stroke: 'var(--color-pencil-500)',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    pathLength: 100,
    className: 'draw-on-reveal',
    style: { '--at': '350ms', '--draw': '700ms' } as React.CSSProperties,
  }
  if (id === 'slant')
    return (
      <svg aria-hidden viewBox="0 0 60 40" className="pointer-events-none absolute top-2 right-4 h-8 w-12 overflow-visible">
        {/* three strokes leaning the way the letters do */}
        <path d="M 10 34 L 24 6 M 26 34 L 40 6 M 42 34 L 56 6" {...common} />
      </svg>
    )
  if (id === 'spacing')
    return (
      <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="pointer-events-none absolute right-7 bottom-5 left-7 h-4 overflow-visible">
        {/* a measuring bracket with even ticks */}
        <path d="M 2 12 L 198 10 M 2 6 L 2 18 M 66 5 L 66 17 M 132 4 L 132 16 M 198 4 L 198 16" {...common} />
      </svg>
    )
  return (
    <svg aria-hidden viewBox="0 0 60 60" className="pointer-events-none absolute top-3 right-5 h-10 w-10 overflow-visible">
      {/* a firm downward arrow: pressed */}
      <path d="M 30 4 L 30 44 M 16 32 L 30 46 L 44 32" {...common} />
    </svg>
  )
}
