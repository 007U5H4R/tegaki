import Link from 'next/link'
import { Seal } from '@/components/brand/seal'
import { Button } from '@/components/ui/button'
import { Reveal } from './reveal'

/**
 * The closing band — Design.md §3.2-9.
 *
 * The same action as the hero, deliberately: somebody who has read the whole
 * page should not have to decide between two different-sounding offers, and
 * a second CTA that phrases it differently reads as a second product.
 */
export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-32 sm:px-6">
      <Reveal className="flex flex-col items-center text-center">
        <Seal size={96} title={null} className="text-shu-500" />

        <h2 className="text-washi-50 mt-8 font-serif text-[clamp(2.25rem,6vw,3.5rem)]">
          Ready when your pen is.
        </h2>

        <p className="text-washi-300 mt-4 max-w-[46ch]">
          Two pages, unlined paper, and a few days. The clock does not start until your sample is
          accepted.
        </p>

        <div className="mt-8">
          <Button asChild>
            <Link href="/sign-in">Begin your assessment</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
