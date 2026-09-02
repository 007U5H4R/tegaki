'use server'

import { createClient } from '@/lib/supabase/server'

export type SubmitState = { ok?: true; error?: string }

/**
 * Confirm the order.
 *
 * Deliberately does not redirect. The stamp animation is the one celebratory
 * beat in the product (Design.md §4.3) and it has to play on the page that
 * was just confirmed; a redirect from the action would swap the page out
 * before anyone saw it. The client navigates once the beat is over.
 *
 * Everything that makes a submission valid — ownership, a tier, a sample,
 * consent, and exactly one payment — is asserted inside `submit_order()`, in
 * one transaction. This function's only job is to say what went wrong in
 * words the customer can act on.
 */
export async function submitOrder(orderId: string): Promise<SubmitState> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('submit_order', { p_order_id: orderId })

  if (error) {
    // 23514 is the check_violation our own guards raise with, and those
    // messages are written for customers ("Choose a tier before confirming
    // your order"). Anything else is an internal failure, and repeating
    // Postgres at somebody is not help.
    if (error.code === '23514') return { error: error.message }

    console.error('submit_order failed', { orderId, code: error.code, message: error.message })
    return { error: 'We could not confirm your order just then. Please try again.' }
  }

  // Deliberately no revalidatePath. Revalidating from here re-renders the
  // route the customer is still standing on — the wizard — whose layout sends
  // a submitted order straight to the dashboard, cutting off the stamp and
  // losing the confirmation the client was about to navigate with. The client
  // refreshes the dashboard when it gets there instead.
  return { ok: true }
}
