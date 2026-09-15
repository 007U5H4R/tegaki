import type { Metadata } from 'next'
import { About } from '@/components/marketing/about'
import { Anatomy } from '@/components/marketing/anatomy'
import { Excerpts } from '@/components/marketing/excerpts'
import { Faq } from '@/components/marketing/faq'
import { FinalCta } from '@/components/marketing/final-cta'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TaglineReveal } from '@/components/marketing/tagline-reveal'
import { TiersSection } from '@/components/marketing/tiers-section'
import { FAQ } from '@/content/faq'

export const metadata: Metadata = {
  title: { absolute: 'Tegaki — your handwriting holds a story' },
  description:
    'A personal, growth-oriented handwriting assessment, read and written by hand and delivered as a considered report. Pilot programme from ₹999.',
}

/**
 * The landing page, as three materials.
 *
 * The terracotta wall (hero), then one long sheet of cream paper pulled out
 * from under it (how it works through the FAQ), then the wall again for the
 * closing band and the footer. The paper is a single surface on purpose:
 * section breaks are hairlines and spacing, not new backgrounds.
 *
 * As the hero leaves it slides 40px under the paper (`--hero-exit`, written
 * by HeroMotion, applied in hero.tsx), so the sheet reads as pulled up over
 * the wall rather than merely scrolled to.
 *
 * The FAQ schema is generated from the same `FAQ` array the accordion
 * renders, so the answers Google is shown and the answers a person is shown
 * cannot drift apart.
 */
export default function LandingPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Content is ours and static; no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Illustrated hero (2026-09 redesign). The scroll-scrub film in
          hero-scrub.tsx is no longer rendered; it stays on disk untouched. */}
      <Hero />
      <HowItWorks />

      <div className="paper-world bg-paper-50 text-inkl-900 grain relative" data-nav-surface="paper">
        <div className="relative z-[1]">
          <TaglineReveal />
          <Anatomy />
          {/* The one human the proposition rests on is introduced before the
              price is asked, not after. */}
          <About />
          <TiersSection />
          <Excerpts />
          <Faq />
        </div>
      </div>

      <FinalCta />
    </>
  )
}
