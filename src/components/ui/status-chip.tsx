import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/lib/orders/status'
import { ORDER_STATUS_LABELS } from '@/lib/orders/status'

/**
 * Status chip — Design.md §3.6, mapped one-to-one onto the order states in
 * Solution-PRD §6.6. No invented states.
 *
 * Every chip carries an icon *and* text. Colour alone would fail anyone with
 * a colour vision deficiency, and "under review" versus "needs your attention"
 * is exactly the distinction they could not afford to miss.
 */

// The warn/err/ok tints stay (low-saturation washes read on cream too); only
// the TEXT darkens on paper, since the -500 hues miss 4.5:1 on paper-50.
const TONE: Record<OrderStatus, string> = {
  draft:
    'border-ink-500/40 bg-ink-800 text-washi-300 in-[[data-theme=paper]]:border-inkl-900/20 in-[[data-theme=paper]]:bg-inkl-900/8 in-[[data-theme=paper]]:text-inkl-900/70',
  sample_under_review:
    'border-warn-500/40 bg-warn-500/10 text-warn-500 in-[[data-theme=paper]]:text-warn-700',
  needs_reupload:
    'border-err-500/40 bg-err-500/10 text-err-500 in-[[data-theme=paper]]:text-err-700',
  analysis_in_progress:
    'border-warn-500/40 bg-warn-500/10 text-warn-500 in-[[data-theme=paper]]:text-warn-700',
  report_generating:
    'border-warn-500/40 bg-warn-500/10 text-warn-500 in-[[data-theme=paper]]:text-warn-700',
  completed: 'border-ok-500/40 bg-ok-500/10 text-ok-500 in-[[data-theme=paper]]:text-ok-700',
  parked:
    'border-ink-500/40 bg-ink-800 text-washi-300 in-[[data-theme=paper]]:border-inkl-900/20 in-[[data-theme=paper]]:bg-inkl-900/8 in-[[data-theme=paper]]:text-inkl-900/70',
}

const ICON: Record<OrderStatus, React.ReactNode> = {
  draft: <Dot />,
  sample_under_review: <Clock />,
  needs_reupload: <Alert />,
  analysis_in_progress: <Clock />,
  report_generating: <Clock />,
  completed: <Check />,
  parked: <Pause />,
}

export function StatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'font-mono text-xs tracking-[0.08em] uppercase',
        TONE[status],
        className,
      )}
    >
      {ICON[status]}
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

function Dot() {
  return (
    <svg viewBox="0 0 8 8" className="size-2" aria-hidden focusable="false">
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  )
}

function Clock() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden focusable="false">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Alert() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden focusable="false">
      <path
        d="M8 2.5 14.5 13.5h-13L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6.75v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.25" r="0.85" fill="currentColor" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden focusable="false">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8.25 7.25 10.5 11 5.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Pause() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden focusable="false">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 5.75v4.5M9.5 5.75v4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
