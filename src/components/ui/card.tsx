import { cn } from '@/lib/cn'

/**
 * Card — Design.md §2.3. A raised surface: ink-900 on the ink-950 ground,
 * 1px hairline, 16px radius, 24px padding.
 *
 * In a dark theme, elevation comes from luminance rather than shadow, since
 * a drop shadow on a near-black ground is invisible. Nesting is capped at two
 * levels by convention (§3.8); deeper stacks stop reading as depth and start
 * reading as noise.
 */
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('border-ink-700 bg-ink-900 rounded-2xl border p-6', className)} {...props} />
  )
}

/**
 * The dashed rule that separates landing sections — an echo of genkō yōshi,
 * the ruled paper Japanese is written on. Decorative, so it is hidden from
 * assistive technology.
 */
export function DashedRule({ className }: { className?: string }) {
  return <hr aria-hidden className={cn('border-ink-700 border-t border-dashed', className)} />
}

/**
 * The small uppercase mono label that sits above headings — the "specimen
 * label" voice borrowed from laboratory sample tags.
 */
export function MicroLabel({
  tone = 'accent',
  className,
  ...props
}: React.ComponentProps<'p'> & { tone?: 'accent' | 'muted' }) {
  return (
    <p
      className={cn(
        'font-mono text-xs tracking-[0.08em] uppercase',
        tone === 'accent' ? 'text-shu-500' : 'text-washi-300',
        className,
      )}
      {...props}
    />
  )
}
