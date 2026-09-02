'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PAUSED_MESSAGE } from '@/lib/settings'
import { wizardPath } from './wizard'

/**
 * Start a new assessment.
 *
 * `buyer_id` is taken from the verified session rather than from anything the
 * caller sends. The RLS insert policy would reject a forged id anyway, but
 * not accepting one in the first place means there is no code path where it
 * could matter.
 */
export async function createDraftOrder() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data, error } = await supabase
    .from('orders')
    .insert({ buyer_id: user.id })
    .select('id')
    .single()

  if (error || !data) {
    // The pause is enforced by a trigger on the table, not by a check here,
    // so this is where that refusal is turned back into the designed notice.
    // 23514 is the check_violation the trigger raises with.
    if (error?.code === '23514') throw new Error(PAUSED_MESSAGE)

    throw new Error(`Could not start a new assessment: ${error?.message ?? 'no order returned'}`)
  }

  revalidatePath('/dashboard')
  redirect(wizardPath(data.id, 'profile'))
}

/** Abandon a draft started by mistake. Only drafts, and only your own. */
export async function deleteDraftOrder(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('orders').delete().eq('id', orderId).eq('status', 'draft')

  if (error) {
    throw new Error(`Could not discard that draft: ${error.message}`)
  }

  revalidatePath('/dashboard')
}
