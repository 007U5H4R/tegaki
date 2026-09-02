import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Seal } from '@/components/brand/seal'
import { Card, MicroLabel } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { EmptyState, SkeletonList } from '@/components/ui/states'
import { cn } from '@/lib/cn'
import {
  getQueue,
  getQueueCounts,
  isQueueStatus,
  QUEUE_STATUSES,
  type QueueRow,
  type QueueStatus,
} from '@/lib/admin/queries'
import { getAdmin } from '@/lib/auth/assert-admin'
import { ORDER_STATUS_LABELS } from '@/lib/orders/status'
import { TIER_DETAILS } from '@/lib/tiers'

export default async function AdminQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // The layout guards this route too, but a layout and its page render in
  // parallel: without this, a stranger's request would still run the queue
  // query while the layout was deciding to send them away.
  if (!(await getAdmin())) redirect('/dashboard')

  const { status } = await searchParams
  const active = isQueueStatus(status) ? status : undefined

  return (
    <div className="flex flex-col gap-8">
      <div>
        <MicroLabel>Review queue</MicroLabel>
        <h1 className="text-washi-50 mt-2 font-serif text-4xl">Work waiting on you</h1>
      </div>

      <Suspense fallback={<div className="h-9" />}>
        <Filters active={active} />
      </Suspense>

      <Suspense key={active ?? 'all'} fallback={<SkeletonList count={3} />}>
        <Rows status={active} />
      </Suspense>
    </div>
  )
}

async function Filters({ active }: { active?: QueueStatus }) {
  const counts = await getQueueCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="flex flex-wrap gap-2">
      <Chip href="/admin" label="All" count={total} active={!active} />
      {QUEUE_STATUSES.map((status) => (
        <Chip
          key={status}
          href={`/admin?status=${status}`}
          label={ORDER_STATUS_LABELS[status]}
          count={counts[status]}
          active={active === status}
        />
      ))}
    </div>
  )
}

function Chip({
  href,
  label,
  count,
  active,
}: {
  href: string
  label: string
  count: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'font-mono text-xs tracking-[0.08em] uppercase',
        active
          ? 'border-shu-500 bg-shu-900/30 text-washi-50'
          : 'border-ink-700 text-washi-300 hover:border-ink-500',
      )}
    >
      {label}
      <span className={cn('tabular-nums', active ? 'text-shu-500' : 'text-ink-500')}>{count}</span>
    </Link>
  )
}

async function Rows({ status }: { status?: QueueStatus }) {
  const orders = await getQueue(status)

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Seal size={64} title={null} />}
        title={status ? 'Nothing in this state.' : 'The queue is empty.'}
        body={
          status
            ? 'Try another filter — or the whole queue.'
            : 'When somebody submits a handwriting sample it lands here, newest first.'
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <QueueRowCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function QueueRowCard({ order }: { order: QueueRow }) {
  const tier = order.tier ? TIER_DETAILS[order.tier] : null
  const subject = order.subject_is_self ? order.full_name : order.subject_name

  return (
    <Card className="p-4 sm:p-5">
      <Link
        href={`/admin/orders/${order.id}`}
        className="focus-visible:outline-shu-500 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div className="min-w-0">
          <p className="text-washi-50 truncate font-serif text-lg">
            {subject ?? 'Unnamed subject'}
            {!order.subject_is_self && order.subject_name ? (
              <span className="text-washi-300 ml-2 text-sm">(third party)</span>
            ) : null}
          </p>
          <p className="text-ink-500 mt-1 truncate font-mono text-xs">
            {order.id.slice(0, 8).toUpperCase()}
            {order.buyer?.email ? ` · ${order.buyer.email}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="text-right">
            <p className="text-washi-300 font-mono text-xs">{tier?.name ?? 'No tier'}</p>
            <p className="text-ink-500 font-mono text-xs">
              {order.submitted_at ? formatDate(order.submitted_at) : 'not submitted'}
            </p>
          </div>
          <StatusChip status={order.status} />
        </div>
      </Link>
    </Card>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
