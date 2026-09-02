import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * The hero — Design.md §3.2-1, static-poster variant.
 *
 * T14 replaces the poster with the scroll-scrub canvas. Everything else here
 * is final, and the poster stays as the fallback for reduced motion and
 * no-JS — the scrub is a desktop enhancement, never a mobile data tax.
 *
 * **Two layouts, and the reason is measured.** From `sm` up the copy sits
 * lower-left over the photograph behind a gradient scrim, exactly as the
 * design describes: the pen, the hand and the written line all stay visible
 * beside it.
 *
 * On a phone that arrangement cannot work, and `e2e/landing.spec.ts` is what
 * proved it. A 16:9 photograph cropped to a 390×844 viewport is a narrow
 * vertical slice, and a heading this size covers nearly all of it. Tuning the
 * scrim until the copy reached the required 7:1 took the image to a black
 * rectangle — legible, and no longer a photograph of anything. So the phone
 * gets the image *above* the copy at full strength, undarkened, with the
 * words on the ink ground beneath it. The subject stays visible, which is
 * what the rule was protecting.
 *
 * The contrast is asserted from rendered pixels rather than assumed: the spec
 * samples the lightest pixel behind the heading and computes the real ratio.
 * The first attempt measured 1.9:1 against a required 7:1.
 */
export function Hero() {
  return (
    <section className="relative isolate sm:flex sm:min-h-[100svh] sm:items-end sm:overflow-hidden">
      {/* Phone: a real image block, at full strength. sm+: full-bleed behind
          the copy. One <Image>, two placements. */}
      <div className="relative h-[38svh] w-full sm:absolute sm:inset-0 sm:-z-10 sm:h-auto">
        <Image
          src="/hero-poster.jpg"
          alt="A fountain pen writing in cursive on unlined cream paper, lit warmly on a wooden desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_38%] sm:object-[62%_32%]"
        />
        {/* On the phone this only softens the seam into the copy below. */}
        <div
          aria-hidden
          className="from-ink-950 absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent sm:hidden"
        />
      </div>

      {/* The scrims are the sm+ story only — on a phone there is nothing to
          scrim, because the copy is not over the image. */}
      <div
        aria-hidden
        className="from-ink-950 via-ink-950/92 absolute inset-0 -z-10 hidden bg-gradient-to-t via-58% to-transparent to-82% sm:block"
      />
      <div
        aria-hidden
        className="from-ink-950 via-ink-950/90 absolute inset-0 -z-10 hidden bg-gradient-to-r via-40% to-transparent to-68% sm:block"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-0 sm:pb-24">
        <div className="hero-rise max-w-[680px]">
          <p
            className="text-shu-500 font-mono text-xs tracking-[0.14em] uppercase"
            style={{ '--rise': '0ms' } as React.CSSProperties}
          >
            Handwriting analysis ·{' '}
            <span className="font-jp" lang="ja">
              手書き
            </span>
          </p>

          <h1
            className="text-washi-50 mt-5 font-serif text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05]"
            style={{ '--rise': '60ms' } as React.CSSProperties}
          >
            Your handwriting
            <br />
            holds a story.
          </h1>

          <p
            className="text-washi-300 mt-6 text-lg text-balance"
            style={{ '--rise': '120ms' } as React.CSSProperties}
          >
            A personal, growth-oriented assessment of what your writing suggests about how you think
            and work — analyzed by hand, delivered as a considered report.
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-4"
            style={{ '--rise': '180ms' } as React.CSSProperties}
          >
            <Button asChild>
              <Link href="/sign-in">Begin your assessment</Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="#samples">See a sample report</a>
            </Button>
          </div>

          <p
            className="text-washi-300 mt-6 font-mono text-xs"
            style={{ '--rise': '240ms' } as React.CSSProperties}
          >
            Pilot programme · reports hand-validated by Tushar Pathak
          </p>
        </div>
      </div>
    </section>
  )
}
