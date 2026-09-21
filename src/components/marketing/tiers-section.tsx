import Link from 'next/link'
import { cn } from '@/lib/cn'
import { DISCLAIMER, RISK_REVERSAL } from '@/lib/copy'
import { formatPrice, TIER_LIST } from '@/lib/tiers'
import { Reveal } from './reveal'

/**
 * Tiers, on the paper.
 *
 * Three columns separated by hairlines rather than three boxes: the
 * comparison is the point, and boxes make three separate arguments where
 * one is wanted. The middle depth is the one most people choose, and it is
 * marked the way the analyst marks anything — a note in red pencil with a
 * small arrow — instead of a chip.
 *
 * Every number comes from `tiers.ts`. A price that appears in two files is a
 * price that will eventually disagree with itself.
 */
export function TiersSection() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-[84rem] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-[4vw]">
      <Reveal soft className="max-w-[44rem]">
        <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-bold tracking-[-0.015em] text-balance">
          How deep should we go?
        </h2>
        <p className="mt-5 max-w-[54ch] text-[1.05rem] leading-relaxed opacity-85">
          Every depth is read by the same person — Tushar Pathak — from the same two pages. What changes
          is how much of what he sees gets written up, and how long that takes.
        </p>
      </Reveal>

      {/* Core sits first on a phone, where the ordering is a stack rather than
          a comparison — but the DOM order stays the price ladder, so reading
          order and focus order never disagree. `order` moves only the visual. */}
      <div className="border-inkl-900/15 mt-14 grid gap-y-12 border-t pt-4 lg:mt-16 lg:grid-cols-3 lg:gap-y-0 lg:pt-0">
        {TIER_LIST.map((tier, i) => (
          <Reveal
            as="li"
            soft
            key={tier.id}
            delay={i * 90}
            className={cn(
              'relative flex list-none flex-col gap-7 px-1 pt-10 pb-2 lg:px-9 lg:pt-14 lg:pb-12',
              'border-inkl-900/15 lg:border-l lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0',
              tier.popular && 'bg-terra-500/8 order-first lg:order-none lg:-mt-px lg:border-t lg:border-t-terra-500/50',
            )}
          >
            {tier.popular ? (
              <span
                aria-hidden
                className="font-hand text-pencil-600 absolute -top-6 left-2 -rotate-3 text-[1.25rem] leading-none font-medium lg:top-4 lg:left-9"
              >
                most people start here
                <svg
                  viewBox="0 0 40 40"
                  className="absolute top-3 -right-9 h-8 w-8 overflow-visible"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 4 6 C 18 8 28 18 32 34 M 24 28 L 32 36 L 38 26" pathLength="100" className="draw-on-reveal" style={{ '--at': '500ms' } as React.CSSProperties} />
                </svg>
              </span>
            ) : null}

            <div>
              <h3 className="font-display text-[1.55rem] leading-tight font-semibold">{tier.name}</h3>
              <p className="font-display mt-4 text-[3rem] leading-none font-bold tracking-[-0.02em]">
                {formatPrice(tier.priceInr)}
              </p>
              <p className="mt-3 text-[0.95rem] opacity-75">
                {tier.turnaroundDays} days · {tier.pages}
              </p>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5">
              {tier.contents.map((item) => (
                <li key={item} className="flex gap-3 text-[0.98rem] leading-snug opacity-90">
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/sign-in?tier=${tier.id}`}
              className={cn(
                'font-hand inline-flex min-h-12 items-center justify-center gap-2.5 self-start rounded-full px-6 py-2.5 text-[1.3rem] leading-none font-semibold',
                tier.popular ? 'cta-ink' : 'cta-line',
              )}
            >
              <span>Read my handwriting</span>
              <span className="cta-arrow" aria-hidden>
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal soft delay={200} className="border-inkl-900/15 mt-12 border-t pt-6 lg:mt-0">
        <p className="max-w-[62ch] text-[0.95rem] leading-relaxed opacity-85">
          {RISK_REVERSAL} The turnaround clock starts when your sample is approved, so a photo we
          cannot read costs you nothing.
        </p>
        <p className="mt-2 max-w-[62ch] text-[0.9rem] opacity-65">
          {DISCLAIMER} Not a science, and{' '}
          <a href="#faq" className="link-fine">
            the questions below
          </a>{' '}
          say so plainly.
        </p>
      </Reveal>
    </section>
  )
}

/** A red-pencil tick: two quick strokes, not an icon-library check. */
function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="text-pencil-500 mt-1 size-4 shrink-0"
      aria-hidden
      focusable="false"
    >
      <path
        d="M 2.5 8.5 C 4 10 5 11.5 6 12.5 C 8 8.5 10.5 5.5 14 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
