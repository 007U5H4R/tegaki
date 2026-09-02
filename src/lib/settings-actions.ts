'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/assert-admin'
import { createClient } from '@/lib/supabase/server'
import { PAUSE_KEY } from './settings'

export type SettingState = { ok?: true; error?: string }

/**
 * Open or close the shop.
 *
 * The action checks the caller, and so does the RLS policy on `settings` —
 * the second is what actually holds, since an action is an endpoint whatever
 * the UI showed.
 */
export async function setPaused(paused: boolean): Promise<SettingState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'That area is for the analyst only.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('settings').update({ value: paused }).eq('key', PAUSE_KEY)

  if (error) {
    console.error('setPaused failed', { paused, message: error.message })
    return { error: 'We could not change that just then. Please try again.' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}
