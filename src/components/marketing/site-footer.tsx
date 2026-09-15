import Link from 'next/link'
import { BrandStoryLine, Lockup } from '@/components/brand/lockup'
import { DISCLAIMER } from '@/lib/copy'

/**
 * Footer, on the deepest terracotta.
 *
 * The policy links point at routes T13 builds. They are listed here because
 * the footer is where somebody looks for them, and a footer that grows those
 * links later is a footer nobody learned to trust.
 */
const LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/refunds', label: 'Refunds' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
] as const

export function SiteFooter() {
  return (
    <footer data-nav-surface="terra" className="bg-terra-700 text-paper-50">
      <div className="mx-auto w-full max-w-[84rem] px-5 pt-14 pb-14 sm:px-8 lg:px-[4vw]">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Lockup tone="paper" />
            <div className="mt-3 max-w-[42ch]">
              <BrandStoryLine className="text-paper-50/70" />
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-1 sm:flex-col sm:gap-0">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-paper-50/80 hover:text-paper-50 inline-flex min-h-11 items-center text-[0.95rem] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-paper-50/70 border-paper-50/15 mt-10 border-t pt-6 text-sm">{DISCLAIMER}</p>
      </div>
    </footer>
  )
}
