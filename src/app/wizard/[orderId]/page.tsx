import { redirect } from 'next/navigation'
import { clampSegment, wizardPath } from '@/lib/orders/wizard'
import { createClient } from '@/lib/supabase/server'

/**
 * Entering the wizard without naming a stage resumes where the order
 * actually got to, which is the whole point of persisting wizard_stage.
 */
export default async function WizardIndex({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('wizard_stage')
    .eq('id', orderId)
    .maybeSingle()

  redirect(wizardPath(orderId, clampSegment('checkout', order?.wizard_stage ?? 1)))
}
