import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MicroLabel } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { DISCLAIMER, RISK_REVERSAL } from '@/lib/copy'
import { formatPrice, TIER_LIST } from '@/lib/tiers'
import { Reveal } from './reveal'

/**
 * Tiers — Design.md §3.3, landing variant.
 *
 * Three hairline-separated columns on desktop rather than three boxes: the
 * comparison is the point, and boxes make three separate arguments where one
 * is wanted. On mobile they become the stacked T02 cards.
 *
 * Every number comes from `tiers.ts`. A price that appears in two files is a
 * price that will eventually disagree with itself, and there is a test
 * asserting these match the PRD.
 */
export function TiersSection() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <MicroLabel>Pricing</MicroLabel>
        <h2 className="text-washi-50 mt-3 font-serif text-4xl">How deep should we go?</h2>
        <p className="text-washi-300 mt-3 max-w-[52ch]">
          Every depth reads the same sample. What changes is how much of it we write up, and how
          long that takes.
        </p>
      </Reveal>

      {/* Core sits first on a phone, where the ordering is a stack rather than
          a comparison — but the DOM order stays the price ladder, so reading
          order and focus order never disagree. `order` moves only the visual. */}
      <div className="border-ink-700 mt-14 grid gap-6 sm:mt-16 sm:grid-cols-3 sm:gap-0 sm:border-t">
        {TIER_LIST.map((tier, i) => (
          <Reveal
            key={tier.id}
            delay={i * 50}
            className={cn(
              'flex flex-col gap-6 rounded-2xl p-6 sm:rounded-none sm:p-8',
              'border-ink-700 border sm:border-x-0 sm:border-t-0 sm:border-b-0',
              i > 0 && 'sm:border-l',
              tier.popular
                ? 'bg-shu-900/25 order-first sm:order-none'
                : 'bg-ink-900 sm:bg-transparent',
            )}
          >
            <div>
              {tier.popular ? (
                <span className="border-shu-500 text-shu-500 mb-3 inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-[0.08em] uppercase">
                  Most popular
                </span>
              ) : null}

              <h3 className="text-washi-50 font-serif text-2xl">{tier.name}</h3>
              <p className="text-washi-50 mt-3 font-serif text-5xl">{formatPrice(tier.priceInr)}</p>
              <p className="text-washi-300 mt-3 font-mono text-xs tracking-[0.08em] uppercase">
                {tier.turnaroundDays}-day turnaround · {tier.pages}
              </p>
            </div>

            <ul className="flex flex-1 flex-col gap-2">
              {tier.contents.map((item) => (
                <li key={item} className="text-washi-300 flex gap-3 text-sm">
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant={tier.popular ? 'primary' : 'ghost'} className="w-full">
              <Link href="/sign-in">Begin your assessment</Link>
            </Button>
          </Reveal>
        ))}
      </div>

      <Reveal delay={150}>
        <p className="text-washi-300 mt-10 text-sm">
          {RISK_REVERSAL} The turnaround clock starts when your sample is approved, so a photo we
          cannot read costs you nothing.
        </p>
        <p className="text-ink-500 mt-2 text-sm">{DISCLAIMER}</p>
      </Reveal>
    </section>
  )
}

function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="text-shu-500 mt-0.5 size-4 shrink-0"
      aria-hidden
      focusable="false"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
