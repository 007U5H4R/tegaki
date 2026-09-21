import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ConfirmOrder } from '@/components/wizard/confirm-order'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { DISCLAIMER, PILOT_NOTICE_BODY, PILOT_NOTICE_TITLE, RISK_REVERSAL } from '@/lib/copy'
import { clampSegment, wizardPath } from '@/lib/orders/wizard'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, isTier, TIER_DETAILS } from '@/lib/tiers'

export default async function CheckoutStage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('tier, wizard_stage, full_name, subject_is_self, subject_name')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  const allowed = clampSegment('checkout', order.wizard_stage)
  if (allowed !== 'checkout') redirect(wizardPath(orderId, allowed))

  // Reaching checkout without a tier means the order is in a state this page
  // cannot render honestly, so it goes back rather than showing a blank price.
  if (!isTier(order.tier)) redirect(wizardPath(orderId, 'tier'))

  const { count } = await supabase
    .from('order_files')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)

  const pages = count ?? 0
  const tier = TIER_DETAILS[order.tier]
  const subject = order.subject_is_self ? (order.full_name ?? 'You') : order.subject_name

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-inkl-900 font-serif text-3xl">Confirm your order</h1>
        <p className="text-inkl-900/70 mt-3">
          One last look before it reaches your analyst. You can still go back and change anything.
        </p>
      </div>

      {/* Unmissable by design: taking an order without taking money is only
          honest if nobody can miss being told. Above the button, not below
          it — on a phone the notice sat under the fold while a red
          "Confirm my order" sat under "₹1,999". */}
      <div className="border-warn-500/40 bg-warn-500/10 flex gap-4 rounded-2xl border p-5">
        <InfoIcon />
        <p className="text-inkl-900 text-sm">
          <strong className="font-semibold">{PILOT_NOTICE_TITLE}</strong>{' '}
          <span className="text-inkl-900/70">
            {PILOT_NOTICE_BODY} Tegaki is running as a pilot, so no card details are asked for and
            nothing is charged.
          </span>
        </p>
      </div>

      <ConfirmOrder orderId={orderId}>
        <Card className="flex flex-col gap-6">
          <div>
            <MicroLabel tone="muted">Assessment for</MicroLabel>
            <p className="text-inkl-900 mt-1 font-serif text-xl">{subject}</p>
          </div>

          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Depth" value={tier.name} />
            <Row label="Report length" value={tier.pages} />
            <Row
              label="Turnaround"
              value={`${tier.turnaroundDays} days from sample approval`}
              hint="The clock starts when your sample is accepted, not now — so a photo we cannot read costs you nothing."
            />
            <Row label="Pages received" value={`${pages} ${pages === 1 ? 'file' : 'files'}`} />
          </dl>

          <div className="border-inkl-900/15 flex items-end justify-between border-t pt-6">
            <MicroLabel tone="muted">Total</MicroLabel>
            <p className="text-inkl-900 font-serif text-4xl sm:text-5xl">
              {formatPrice(tier.priceInr)}
            </p>
          </div>
        </Card>
      </ConfirmOrder>

      <div className="text-inkl-900/70 flex flex-col gap-2 text-sm">
        <p>
          {RISK_REVERSAL} If we cannot read your sample we will ask for a replacement, and you have
          14 days to send one.
        </p>
        <p>{DISCLAIMER}</p>
      </div>

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={wizardPath(orderId, 'tier')}>Back</Link>
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
      <dt className="text-inkl-900/70">{label}</dt>
      <dd className="text-inkl-900 text-right">
        {value}
        {hint ? <span className="text-inkl-900/60 mt-1 block text-xs">{hint}</span> : null}
      </dd>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="text-warn-700 size-5 shrink-0"
      aria-hidden
      focusable="false"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.25" r="0.9" fill="currentColor" />
    </svg>
  )
}
