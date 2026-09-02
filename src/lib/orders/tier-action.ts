'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isTier } from '@/lib/tiers'
import { wizardPath } from './wizard'

export type TierState = { error?: string }

/**
 * Leave the sample stage for the tier stage.
 *
 * `wizard_stage` is what lets someone resume, so it has to advance when they
 * actually finish a stage rather than when they merely visit the next one —
 * otherwise the tier page bounces them straight back to uploading.
 *
 * The file check here is for the customer's benefit, not for security:
 * `submit_order()` refuses a sampleless order regardless, and being told
 * "upload a page first" beats reaching checkout and being turned away.
 */
export async function goToTier(orderId: string): Promise<void> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('order_files')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)

  if ((count ?? 0) === 0) {
    redirect(wizardPath(orderId, 'upload'))
  }

  const { error } = await supabase
    .from('orders')
    .update({ wizard_stage: 3 })
    .eq('id', orderId)
    .lt('wizard_stage', 3)

  if (error) throw new Error(`Could not continue: ${error.message}`)

  revalidatePath('/dashboard')
  redirect(wizardPath(orderId, 'tier'))
}

/**
 * Save the chosen tier.
 *
 * The price is deliberately not part of this: it is looked up server-side at
 * submission from `tier_price_inr()`. A form that posted an amount would be a
 * form that could post ₹1.
 */
export async function saveTier(
  orderId: string,
  _prev: TierState,
  formData: FormData,
): Promise<TierState> {
  const tier = formData.get('tier')

  if (!isTier(tier)) {
    return { error: 'Choose one of the three depths to continue.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ tier, wizard_stage: 4 })
    .eq('id', orderId)

  if (error) {
    return { error: `We could not save that: ${error.message}` }
  }

  revalidatePath('/dashboard')
  redirect(wizardPath(orderId, 'checkout'))
}
