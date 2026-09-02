import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TaglineReveal } from '@/components/marketing/tagline-reveal'
import { TiersSection } from '@/components/marketing/tiers-section'

export const metadata: Metadata = {
  title: 'Tegaki — your handwriting holds a story',
  description:
    'A personal, growth-oriented handwriting assessment, analyzed by hand and delivered as a considered report. Pilot programme from ₹999.',
}

/**
 * The landing page — Design.md §3.2, sections 1, 2, 3 and 5.
 *
 * T12 adds the sample-report anatomy, excerpts, about and FAQ; T13 the ship
 * set; T14 swaps the hero poster for the scroll-scrub. The anchors those
 * sections will fill are already in the nav, so `#samples` and `#faq` resolve
 * to something rather than nowhere — see the placeholders at the bottom.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <TaglineReveal />
      <TiersSection />

      {/* Anchors the nav already points at. Empty landmarks would be worse
          than honest ones: a link that scrolls to nothing reads as broken. */}
      <section id="samples" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-washi-50 font-serif text-4xl">What a report looks like</h2>
        <p className="text-washi-300 mt-3 max-w-[52ch]">
          Specimen rows and full report excerpts arrive with the next release. Until then, every
          claim on this page is the same one your report will make: indicative, never diagnostic.
        </p>
      </section>

      <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-washi-50 font-serif text-4xl">Questions</h2>
        <p className="text-washi-300 mt-3 max-w-[52ch]">
          The full set — what to write, how your sample is stored, when it is deleted, and what
          happens if we cannot read it — arrives with the next release.
        </p>
      </section>
    </>
  )
}
