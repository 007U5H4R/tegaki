import { redirect } from 'next/navigation'
import { MicroLabel } from '@/components/ui/card'
import { HeartbeatStatus } from '@/components/admin/heartbeat-status'
import { PauseSwitch } from '@/components/admin/pause-switch'
import { getQueueCounts, QUEUE_STATUSES } from '@/lib/admin/queries'
import { getAdmin } from '@/lib/auth/assert-admin'
import { ORDER_STATUS_LABELS } from '@/lib/orders/status'
import { getLastHeartbeat } from '@/lib/heartbeat-server'
import { isPaused } from '@/lib/settings'

export default async function AdminSettings() {
  // The layout guards this route too; a layout and its page render in
  // parallel, so the page checks for itself rather than reading settings on
  // behalf of somebody the layout is about to turn away.
  if (!(await getAdmin())) redirect('/dashboard')

  const [paused, counts, beatAt] = await Promise.all([
    isPaused(),
    getQueueCounts(),
    getLastHeartbeat(),
  ])

  return (
    <div className="flex flex-col gap-10">
      <div>
        <MicroLabel>Settings</MicroLabel>
        <h1 className="text-washi-50 mt-2 font-serif text-4xl">The shop</h1>
      </div>

      <PauseSwitch paused={paused} />

      <HeartbeatStatus beatAt={beatAt} now={new Date()} />

      <section className="flex flex-col gap-4">
        <h2 className="text-washi-50 font-serif text-2xl">What is in the queue</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {QUEUE_STATUSES.map((status) => (
            <div
              key={status}
              className="border-ink-700 flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <dt className="text-washi-300 font-mono text-xs tracking-[0.08em] uppercase">
                {ORDER_STATUS_LABELS[status]}
              </dt>
              <dd className="text-washi-50 font-serif text-2xl tabular-nums">{counts[status]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
