import { BrandStoryLine, Lockup } from '@/components/brand/lockup'
import { DISCLAIMER } from '@/lib/copy'

/** Footer, on the deepest terracotta. */
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
        </div>

        <p className="text-paper-50/70 border-paper-50/15 mt-10 border-t pt-6 text-sm">
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  )
}
