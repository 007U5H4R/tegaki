import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ReviewActions } from '@/components/admin/review-actions'
import { ReportUpload } from '@/components/admin/report-upload'
import { StartReport } from '@/components/admin/start-report'
import { SampleViewer } from '@/components/admin/sample-viewer'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { getAdminOrder, getAdminOrderFiles } from '@/lib/admin/queries'
import { getAdmin } from '@/lib/auth/assert-admin'
import { GUARDRAILS } from '@/lib/uploads/constants'
import { expectedDeliveryDate, formatPrice, TIER_DETAILS } from '@/lib/tiers'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  // See the note in the queue page: layout and page render in parallel, so
  // this route checks for itself rather than minting signed URLs to a
  // sample on behalf of somebody the layout is about to turn away.
  if (!(await getAdmin())) redirect('/dashboard')

  const { id } = await params

  const [order, files] = await Promise.all([getAdminOrder(id), getAdminOrderFiles(id)])
  if (!order) notFound()

  const tier = order.tier ? TIER_DETAILS[order.tier] : null
  const acked = order.guardrails_acked ?? {}

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Button asChild variant="quiet" size="sm" className="self-start px-0">
          <Link href="/admin">← Queue</Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <MicroLabel>{order.id.slice(0, 8).toUpperCase()}</MicroLabel>
            <h1 className="text-washi-50 mt-2 font-serif text-3xl">
              {order.subject_is_self ? order.full_name : order.subject_name}
            </h1>
            <p className="text-washi-300 mt-1 text-sm">
              {tier ? `${tier.name} · ${formatPrice(tier.priceInr)}` : 'No tier chosen'}
              {order.submitted_at ? ` · submitted ${formatDate(order.submitted_at)}` : ''}
            </p>
          </div>
          <StatusChip status={order.status} />
        </div>
      </div>

      {/* The review itself, at the top: it is the only reason this page is
          open, and scrolling past the paperwork to reach it every time would
          be a small tax paid dozens of times a week. */}
      {order.status === 'sample_under_review' && tier ? (
        <ReviewActions
          orderId={order.id}
          turnaroundDays={tier.turnaroundDays}
          expectedDelivery={formatDay(expectedDeliveryDate(tier.id, new Date()))}
        />
      ) : order.status === 'analysis_in_progress' ? (
        <StartReport orderId={order.id} />
      ) : order.status === 'report_generating' ? (
        <ReportUpload
          orderId={order.id}
          subject={order.subject_is_self ? order.full_name : order.subject_name}
        />
      ) : (
        <ReviewSummary order={order} />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-washi-50 font-serif text-2xl">The sample</h2>
        <SampleViewer files={files} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-washi-50 font-serif text-2xl">What they told us</h2>

        <Card className="flex flex-col gap-6">
          {!order.subject_is_self ? (
            <div className="border-shu-900 bg-shu-900/20 rounded-lg border p-4">
              <MicroLabel>Third-party subject</MicroLabel>
              <p className="text-washi-50 mt-2 text-sm">
                This assessment is of{' '}
                <strong>{order.subject_name ?? 'someone whose name is missing'}</strong>
                {order.subject_age ? `, age ${order.subject_age}` : ''}, not the buyer.
              </p>
              <p className="text-washi-300 mt-1 text-sm">
                {order.consent_given_at
                  ? `The buyer confirmed they have their permission on ${formatDate(order.consent_given_at)}.`
                  : 'No consent is recorded — which should be impossible for a submitted order.'}
              </p>
            </div>
          ) : null}

          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Buyer account" value={order.buyer?.email ?? '—'} />
            <Detail label="Contact email" value={order.email ?? '—'} />
            <Detail
              label="Phone"
              value={`${order.phone ?? '—'}${order.whatsapp_preferred ? ' · WhatsApp preferred' : ''}`}
            />
            <Detail label="Age" value={order.age ? String(order.age) : '—'} />
            <Detail label="Gender" value={order.gender || 'not given'} />
            <Detail
              label="Where they are"
              value={[order.city, order.country].filter(Boolean).join(', ') || '—'}
            />
          </dl>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-washi-50 font-serif text-2xl">What they confirmed</h2>
        <Card>
          <ul className="flex flex-col gap-3">
            {GUARDRAILS.map((rail) => (
              <li key={rail.id} className="flex items-start gap-3 text-sm">
                <span aria-hidden className={acked[rail.id] ? 'text-ok-500' : 'text-err-500'}>
                  {acked[rail.id] ? '✓' : '✕'}
                </span>
                <span className={acked[rail.id] ? 'text-washi-300' : 'text-washi-50'}>
                  {rail.label}
                  {acked[rail.id] ? '' : ' — not confirmed'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}

/** What the review already decided, for an order past the review stage. */
function ReviewSummary({ order }: { order: Awaited<ReturnType<typeof getAdminOrder>> }) {
  if (!order) return null

  if (order.status === 'needs_reupload') {
    return (
      <Card className="border-err-500/40 bg-err-500/5 flex flex-col gap-2">
        <MicroLabel tone="muted">Sent back for another try</MicroLabel>
        <p className="text-washi-50">{order.rejected_reason}</p>
        {order.reupload_deadline ? (
          <p className="text-washi-300 text-sm">
            They have until {formatDate(order.reupload_deadline)} to send a replacement.
          </p>
        ) : null}
      </Card>
    )
  }

  if (order.approved_at) {
    return (
      <Card className="flex flex-col gap-2">
        <MicroLabel tone="muted">Approved</MicroLabel>
        <p className="text-washi-50">
          Approved on {formatDate(order.approved_at)}
          {order.expected_delivery_date
            ? ` · report promised by ${formatDay(new Date(order.expected_delivery_date))}`
            : ''}
          .
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <p className="text-washi-300 text-sm">
        Nothing to review here — this order is {order.status.replace(/_/g, ' ')}.
      </p>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500 font-mono text-xs tracking-[0.08em] uppercase">{label}</dt>
      <dd className="text-washi-50 mt-1 break-words">{value}</dd>
    </div>
  )
}

function formatDate(iso: string): string {
  return formatDay(new Date(iso))
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
