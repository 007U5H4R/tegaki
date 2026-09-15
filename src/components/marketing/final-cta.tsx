import Link from 'next/link'
import { Seal } from '@/components/brand/seal'
import { Reveal } from './reveal'
import { TornEdge } from './torn-edge'

/**
 * The closing band: the paper ends, the wall shows again.
 *
 * The same action as the hero, deliberately: somebody who has read the whole
 * page should not have to decide between two different-sounding offers, and
 * a second CTA that phrases it differently reads as a second product.
 */
export function FinalCta() {
  return (
    <section data-nav-surface="terra" className="wall text-paper-50 relative">
      {/* the cream sheet's torn lower edge, over the terracotta */}
      <TornEdge side="bottom" fill="var(--color-paper-50)" className="relative z-[1] h-12 sm:h-16" />

      <div className="relative z-[1] mx-auto flex w-full max-w-[84rem] flex-col items-center px-5 pt-16 pb-24 text-center sm:px-8 sm:pt-20 sm:pb-32">
        <Reveal soft className="flex flex-col items-center">
          <Seal size={84} title={null} className="text-paper-50" />

          <h2 className="font-display mt-9 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] font-bold tracking-[-0.015em] text-balance">
            Ready when your pen is.
          </h2>

          <p className="mt-5 max-w-[42ch] text-[1.08rem] leading-relaxed opacity-90">
            Two pages, unlined paper, and a few days. The clock does not start until your sample is
            accepted.
          </p>

          <Link
            href="/sign-in"
            className="cta-ink font-hand mt-10 inline-flex min-h-13 items-center gap-2.5 rounded-full px-7 py-3 text-[1.45rem] leading-none font-semibold"
          >
            <span>Read my handwriting</span>
            <span className="cta-arrow" aria-hidden>
              →
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
