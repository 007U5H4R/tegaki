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
  title: 'Tegaki — your handwriting holds a story',
  description:
    'A personal, growth-oriented handwriting assessment, read and written by hand and delivered as a considered report. Pilot programme from ₹999.',
}

/**
 * The landing page — Design.md §3.2, in order.
 *
 * T14 swaps the hero poster for the scroll-scrub; everything here is final.
 *
 * The FAQ schema is generated from the same `FAQ` array the accordion
 * renders, so the answers Google is shown and the answers a person is shown
 * cannot drift apart. Two copies of that text would eventually disagree, and
 * the version search engines quote would be the one nobody proofreads.
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

      <Hero />
      <HowItWorks />
      <TaglineReveal />
      <Anatomy />
      <TiersSection />
      <Excerpts />
      <About />
      <Faq />
      <FinalCta />
    </>
  )
}
