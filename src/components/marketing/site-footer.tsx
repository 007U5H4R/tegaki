import Link from 'next/link'
import { BrandStoryLine, Lockup } from '@/components/brand/lockup'
import { DashedRule } from '@/components/ui/card'
import { DISCLAIMER } from '@/lib/copy'

/**
 * Footer — Design.md §3.2-10.
 *
 * The policy links point at routes T13 builds. They are listed here because
 * the footer is where somebody looks for them, and a footer that grows those
 * links later is a footer nobody learned to trust.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <DashedRule className="mb-10" />

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Lockup />
          <div className="mt-3 max-w-[42ch]">
            <BrandStoryLine />
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          <Link href="/privacy" className="text-washi-300 hover:text-washi-50 text-sm">
            Privacy
          </Link>
          <Link href="/refunds" className="text-washi-300 hover:text-washi-50 text-sm">
            Refunds
          </Link>
          <Link href="/terms" className="text-washi-300 hover:text-washi-50 text-sm">
            Terms
          </Link>
          <Link href="/contact" className="text-washi-300 hover:text-washi-50 text-sm">
            Contact
          </Link>
        </nav>
      </div>

      <p className="text-ink-500 mt-10 text-sm">{DISCLAIMER}</p>
    </footer>
  )
}
