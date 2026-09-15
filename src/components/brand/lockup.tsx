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
  tone = 'washi',
  large = false,
}: {
  size?: number
  showSubtitle?: boolean
  className?: string
  /**
   * `washi`: vermilion seal, cream wordmark on the ink ground.
   * `paper`: all warm ivory — the landing hero's terracotta wall.
   * `ink`:   all deep ink — the landing page's cream sections.
   */
  tone?: 'washi' | 'paper' | 'ink'
  /** The landing page's nav: wordmark and subtitle scale gently with the viewport. */
  large?: boolean
}) {
  const seal = { washi: 'text-shu-500', paper: 'text-paper-50', ink: 'text-inkl-900' }[tone]
  const word = { washi: 'text-washi-50', paper: 'text-paper-50', ink: 'text-inkl-900' }[tone]
  const sub = { washi: 'text-washi-300', paper: 'text-paper-50/75', ink: 'text-inkl-900/70' }[tone]
  return (
    <span className={cn('inline-flex items-center', large ? 'gap-3' : 'gap-2.5', className)}>
      {/* Decorative: the wordmark beside it already names the brand, so
          announcing "Tegaki" twice would be noise for a screen reader. */}
      <Seal size={size} title={null} className={cn(seal, large && 'size-[clamp(1.6rem,1.9vw,2.3rem)]')} />
      <span className="flex items-baseline gap-2">
        <span
          className={cn(
            'font-serif leading-none',
            large ? 'text-[clamp(1.35rem,1.65vw,2rem)]' : 'text-xl',
            word,
          )}
        >
          Tegaki
        </span>
        {showSubtitle ? (
          <span className={cn('font-jp', large ? 'text-[clamp(0.8rem,0.95vw,1.15rem)]' : 'text-xs', sub)} lang="ja">
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
