'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ResubmitState = { ok?: true; error?: string }

/**
 * Send a replacement page back for review.
 *
 * The rules live in `transition_order()`: it is your order, it is actually in
 * `needs_reupload`, a sample was uploaded *after* the rejection, and the
 * fourteen-day window is still open. All four are checked in the database, so
 * this function's job is to say what went wrong in words worth reading.
 */
export async function resubmitSample(orderId: string): Promise<ResubmitState> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transition_order', {
    p_order_id: orderId,
    p_to: 'sample_under_review',
  })

  if (error) {
    // 23514 is the check_violation our own guards raise with, and those
    // messages are written for customers ("Add a replacement page before
    // sending this back for review").
    if (error.code === '23514') return { error: error.message }

    console.error('resubmitSample failed', { orderId, code: error.code, message: error.message })
    return { error: 'We could not send that back just then. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
