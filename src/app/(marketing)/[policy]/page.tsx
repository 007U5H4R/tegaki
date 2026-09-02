import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashedRule, MicroLabel } from '@/components/ui/card'
import { POLICIES, policyBySlug } from '@/content/policies'

/**
 * The three policy pages, from one template.
 *
 * A longform reading column rather than the marketing grid: these are
 * documents somebody reads top to bottom when they are deciding whether to
 * trust a stranger with their handwriting, and that is not a moment for
 * three columns and a reveal animation.
 */

export function generateStaticParams() {
  return POLICIES.map((p) => ({ policy: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>
}): Promise<Metadata> {
  const { policy: slug } = await params
  const policy = policyBySlug(slug)
  if (!policy) return {}

  return {
    title: policy.title,
    description: policy.standfirst,
    // A policy page is not what should surface for "handwriting analysis",
    // but it must stay reachable and indexable for anyone checking.
    alternates: { canonical: `/${policy.slug}` },
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy: slug } = await params
  const policy = policyBySlug(slug)
  if (!policy) notFound()

  return (
    <article className="mx-auto w-full max-w-[68ch] px-4 pt-32 pb-24 sm:px-6">
      <MicroLabel>Tegaki</MicroLabel>
      <h1 className="text-washi-50 mt-3 font-serif text-[clamp(2.25rem,6vw,3.25rem)]">
        {policy.title}
      </h1>
      <p className="text-washi-300 mt-4 text-lg">{policy.standfirst}</p>
      <p className="text-ink-500 mt-4 font-mono text-xs">Last updated {policy.updated}</p>

      <DashedRule className="my-10" />

      {policy.sections.map((section) => (
        <section key={section.heading} className="mb-10">
          <h2 className="text-washi-50 font-serif text-2xl">{section.heading}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i} className="text-washi-300 mt-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <DashedRule className="my-10" />

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/contact">Ask us something</Link>
        </Button>
        {POLICIES.filter((p) => p.slug !== policy.slug).map((other) => (
          <Button key={other.slug} asChild variant="quiet" size="sm">
            <Link href={`/${other.slug}`}>{other.title}</Link>
          </Button>
        ))}
      </div>
    </article>
  )
}
