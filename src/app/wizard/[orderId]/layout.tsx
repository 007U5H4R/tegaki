import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Lockup } from '@/components/brand/lockup'
import { DashedRule } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import { WIZARD_STEPS } from '@/lib/orders/wizard'
import { createClient } from '@/lib/supabase/server'
import { TIER_DETAILS, formatPrice } from '@/lib/tiers'

/**
 * The wizard shell.
 *
 * Loads the order once and guards it, so no stage page has to repeat the
 * ownership check. A stranger's order id returns nothing through RLS, which
 * makes a wrong guess indistinguishable from a non-existent order — exactly
 * what it should be.
 */
export default async function WizardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, tier, wizard_stage')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  // A submitted order is no longer something to edit; the dashboard is where
  // its progress lives.
  if (order.status !== 'draft') redirect('/dashboard')

  const tier = order.tier ? TIER_DETAILS[order.tier as keyof typeof TIER_DETAILS] : null

  return (
    <div data-theme="paper" className="bg-paper-50 text-inkl-900 grain min-h-dvh">
      <div className="relative z-[1] mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard">
            <Lockup tone="ink" />
            <span className="sr-only"> — back to your assessments</span>
          </Link>
          {tier ? (
            <p className="text-inkl-900/70 font-mono text-xs">
              {tier.name} · {formatPrice(tier.priceInr)}
            </p>
          ) : null}
        </header>

        <DashedRule className="my-8" />

        <Stepper steps={WIZARD_STEPS} current={Math.max(order.wizard_stage - 1, 0)} />

        <div className="mt-12">{children}</div>
      </div>
    </div>
  )
}
