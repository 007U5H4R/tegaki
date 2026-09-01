import { cn } from '@/lib/cn'
import { Button } from './button'
import { Card } from './card'

/**
 * The four screen states every data view must ship (Solution-PRD §6.4).
 *
 * These exist as primitives so that "we'll add the empty state later" stops
 * being possible: a view that renders a list has to reach for one of these,
 * and the error state cannot be constructed without a retry handler.
 */

/**
 * Skeletons are shaped like the content they replace, not generic bars.
 * A card-shaped skeleton tells someone a card is coming; a spinner tells
 * them only that something, somewhere, is happening.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse motion-reduce:animate-none', className)} aria-hidden>
      <div className="bg-ink-800 h-5 w-1/3 rounded" />
      <div className="bg-ink-800 mt-3 h-3 w-1/4 rounded" />
      <div className="bg-ink-800 mt-6 h-2 w-full rounded" />
      <div className="bg-ink-800 mt-4 h-3 w-2/5 rounded" />
    </Card>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * The empty state is a first-run trust moment, not a shrug. It says what will
 * appear here, why it is safe, and offers the one action that fills it.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  body: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {icon ? <div className="text-shu-500 mb-6">{icon}</div> : null}
      <h2 className="text-washi-50 max-w-[420px] text-2xl">{title}</h2>
      <div className="text-washi-300 mt-3 max-w-[420px]">{body}</div>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}

/**
 * Errors are inline, specific, and always carry a working retry.
 *
 * `message` and `onRetry` are both required on purpose. "Something went
 * wrong" with no way forward is the state users hate most, and making it
 * impossible to construct is more reliable than a code review catching it.
 */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry: () => void
  className?: string
}) {
  return (
    <Card className={cn('border-err-500/40 bg-err-500/5', className)}>
      <div role="alert" className="flex flex-col gap-4">
        <p className="text-washi-50">{message}</p>
        <div>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </Card>
  )
}
