import { Card, MicroLabel } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { StatusRail } from '@/components/orders/status-rail'
import { ReuploadPanel } from '@/components/orders/reupload-panel'
import { DownloadReport } from '@/components/orders/download-report'
import { CONTACT_EMAIL, PILOT_ORDER_NOTE } from '@/lib/copy'
import { RETENTION_DAYS } from '@/lib/retention/constants'
import type { Order } from '@/lib/orders/queries'
import { RAIL_POSITION } from '@/lib/orders/status'
import { TIER_DETAILS } from '@/lib/tiers'

/**
 * One order on the dashboard — Design.md §3.6.
 *
 * Three shapes, decided by status. A live order shows the rail and, once
 * approved, the date it is promised for. A rejected one replaces the rail
 * with the analyst's words and a way to act on them. A parked one replaces
 * it with a way to reach a human.
 *
 * The rail is never shown for `needs_reupload` or `parked`: progress bars on
 * a stalled order are a lie told to the person waiting.
 */
export function OrderCard({ order, action }: { order: Order; action?: React.ReactNode }) {
  const tier = order.tier ? TIER_DETAILS[order.tier] : null
  const subject = order.subject_is_self ? order.full_name : order.subject_name
  const onRail = RAIL_POSITION[order.status] !== undefined

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-inkl-900 font-serif text-xl">
            {subject ?? (order.status === 'draft' ? 'New assessment' : 'Your assessment')}
          </h3>
          <p className="text-inkl-900/70 mt-1 font-mono text-xs">
            {/* Short id: enough for Tushar and a customer to refer to the same
                order over WhatsApp, without printing a full UUID at anyone. */}
            {order.id.slice(0, 8).toUpperCase()}
            {tier ? ` · ${tier.name}` : ''} · started{' '}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <StatusChip status={order.status} />
      </div>

      {onRail ? <StatusRail status={order.status} delivered={Boolean(order.delivered_at)} /> : null}

      {order.status === 'draft' ? (
        <p className="text-inkl-900/70 text-sm">
          You have not finished this request yet. Nothing has been submitted.
        </p>
      ) : null}

      {order.expected_delivery_date ? (
        <p className="text-inkl-900/70 text-sm">
          Expected by{' '}
          <strong className="text-inkl-900">{formatDay(order.expected_delivery_date)}</strong>
          {tier ? ` · ${tier.turnaroundDays} days from when your sample was accepted` : ''}
        </p>
      ) : null}

      {order.status === 'sample_under_review' ? (
        <p className="text-inkl-900/70 text-sm">
          Your analyst is checking the sample is readable. The turnaround starts once it is
          accepted, so a photo we cannot use costs you nothing.
        </p>
      ) : null}

      {order.status === 'needs_reupload' ? (
        <ReuploadPanel
          orderId={order.id}
          buyerId={order.buyer_id}
          reason={order.rejected_reason}
          deadlineLabel={order.reupload_deadline ? formatDay(order.reupload_deadline) : null}
          guardrails={order.guardrails_acked}
        />
      ) : null}

      {order.status === 'completed' ? (
        <>
          <DownloadReport orderId={order.id} />
          {order.delivered_at ? (
            <p className="text-inkl-900/70 text-sm">
              Sent to you personally on {formatDay(order.delivered_at)}.
            </p>
          ) : null}
          {order.samples_purged_at ? <SamplesPurgedNote at={order.samples_purged_at} /> : null}
        </>
      ) : null}

      {order.status === 'parked' ? <ParkedPanel /> : null}

      {order.status !== 'draft' ? (
        <p className="text-inkl-900/50 text-sm">{PILOT_ORDER_NOTE}</p>
      ) : null}

      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </Card>
  )
}

/**
 * A parked order is the one state with no button that moves it forward, so
 * it must not be a dead end (Solution-PRD §6.4). The way out is a person.
 */
function ParkedPanel() {
  return (
    <div className="border-inkl-900/12 bg-inkl-900/5 flex flex-col gap-2 rounded-2xl border p-5">
      <MicroLabel tone="muted">Re-upload window closed</MicroLabel>
      <p className="text-inkl-900 text-sm">
        The two-week window for sending a replacement sample has closed, so this order is on hold.
        Nothing has been lost and your sample is still here.
      </p>
      <p className="text-inkl-900/70 text-sm">
        If you would still like it assessed,{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Parked Tegaki order')}`}
          className="text-inkl-900 underline underline-offset-2"
        >
          email us
        </a>{' '}
        and we will reopen it.
      </p>
    </div>
  )
}

/**
 * The retention promise, kept and shown.
 *
 * A customer whose samples were destroyed should be told by the product, not
 * discover it from a policy page — and the difference between "deleted" and
 * "there was never anything here" is one only the timestamp can settle. It
 * sits beside the download deliberately: the sentence that reassures is the
 * one that says the report is unaffected.
 */
function SamplesPurgedNote({ at }: { at: string }) {
  return (
    <div className="border-inkl-900/15 flex flex-col gap-1 rounded-2xl border border-dashed p-4">
      <MicroLabel tone="muted">Samples deleted</MicroLabel>
      <p className="text-inkl-900/70 text-sm">
        Your handwriting was deleted on {formatDay(at)}, {RETENTION_DAYS} days after your report was
        sent, as our retention policy promises. Your report is unaffected and stays downloadable
        here.
      </p>
    </div>
  )
}

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
