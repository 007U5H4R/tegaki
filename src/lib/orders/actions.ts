'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase.from('orders').insert({ buyer_id: user.id })

  if (error) {
    throw new Error(`Could not start a new assessment: ${error.message}`)
  }

  revalidatePath('/dashboard')
  // The wizard arrives in T05; until then the dashboard is where a fresh
  // draft becomes visible.
  redirect('/dashboard')
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
