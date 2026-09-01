import { cn } from '@/lib/cn'
import { Seal } from './seal'

/**
 * The Tegaki lockup — Design.md §2.4.
 *
 * Seal, wordmark, and the 手書き subtitle. The Japanese is the brand's whole
 * origin story, so it is real text in the subset face rather than an image:
 * it stays selectable, searchable and legible when zoomed.
 */
export function Lockup({
  size = 24,
  showSubtitle = true,
  className,
}: {
  size?: number
  showSubtitle?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {/* Decorative: the wordmark beside it already names the brand, so
          announcing "Tegaki" twice would be noise for a screen reader. */}
      <Seal size={size} title={null} className="text-shu-500" />
      <span className="flex items-baseline gap-2">
        <span className="text-washi-50 font-serif text-xl leading-none">Tegaki</span>
        {showSubtitle ? (
          <span className="font-jp text-washi-300 text-xs" lang="ja">
            手書き
          </span>
        ) : null}
      </span>
    </span>
  )
}

/**
 * The footer story-line. Explaining the name is the cheapest trust the brand
 * can buy: an unfamiliar Japanese word is a small barrier, and one line
 * removes it.
 */
export function BrandStoryLine({ className }: { className?: string }) {
  return (
    <p className={cn('text-ink-500 font-mono text-xs', className)}>
      tegaki ·{' '}
      <span className="font-jp" lang="ja">
        手書き
      </span>{' '}
      · Japanese for handwritten
    </p>
  )
}
