import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { TierForm } from '@/components/wizard/tier-form'
import { Button } from '@/components/ui/button'
import { clampSegment, wizardPath } from '@/lib/orders/wizard'
import { createClient } from '@/lib/supabase/server'
import { isTier } from '@/lib/tiers'

export default async function TierStage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('tier, wizard_stage')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  const allowed = clampSegment('tier', order.wizard_stage)
  if (allowed !== 'tier') redirect(wizardPath(orderId, allowed))

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-washi-50 font-serif text-3xl">How deep should we go?</h1>
        <p className="text-washi-300 mt-3">
          Every depth reads the same sample. What changes is how much of it we write up, and how
          long that takes.
        </p>
      </div>

      <TierForm orderId={orderId} defaultTier={isTier(order.tier) ? order.tier : null} />

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={wizardPath(orderId, 'upload')}>Back</Link>
        </Button>
      </div>
    </div>
  )
}
