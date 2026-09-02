'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/assert-admin'
import { createClient } from '@/lib/supabase/server'
import { MAX_REASON_LENGTH, MIN_REASON_LENGTH } from './constants'

export type ReviewState = { error?: string; ok?: true }

/**
 * Approve the sample, which starts the clock.
 *
 * The delivery date is computed and stored inside `transition_order()`, not
 * here — the promise is made once, in one place, by the same statement that
 * changes the status.
 */
export async function approveOrder(orderId: string): Promise<ReviewState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'That area is for the analyst only.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('transition_order', {
    p_order_id: orderId,
    p_to: 'analysis_in_progress',
  })

  if (error) {
    console.error('approveOrder failed', { orderId, code: error.code, message: error.message })
    return { error: readable(error.code, error.message, 'We could not approve that just then.') }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Ask for a replacement sample.
 *
 * The reason is shown to the customer word for word, so it is validated here
 * as well as in the database: a rejection that says nothing costs somebody
 * days and tells them nothing about how to fix it.
 */
export async function rejectOrder(orderId: string, reason: string): Promise<ReviewState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'That area is for the analyst only.' }
  }

  const trimmed = reason.trim()

  if (trimmed.length < MIN_REASON_LENGTH) {
    return {
      error: `Say what is wrong with the sample and what would fix it — the customer sees this text. At least ${MIN_REASON_LENGTH} characters.`,
    }
  }
  if (trimmed.length > MAX_REASON_LENGTH) {
    return { error: `Keep it under ${MAX_REASON_LENGTH} characters so it stays readable.` }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('transition_order', {
    p_order_id: orderId,
    p_to: 'needs_reupload',
    p_reason: trimmed,
  })

  if (error) {
    console.error('rejectOrder failed', { orderId, code: error.code, message: error.message })
    return { error: readable(error.code, error.message, 'We could not send that back just then.') }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * 23514 is the check_violation our own guards raise with, and those messages
 * are written to be read ("Say why the sample cannot be used"). Anything else
 * is an internal failure, and repeating Postgres at somebody is not help.
 */
function readable(code: string | undefined, message: string, fallback: string): string {
  return code === '23514' ? message : fallback
}

/**
 * Move an approved order into report production.
 *
 * The one edge between approval and delivery, and without it T09's upload
 * panel is unreachable — an order can be approved and a report can be
 * attached, but nothing gets from one to the other. T10 replaces this with
 * controls generated from the transition matrix, at which point this can go;
 * a single hand-written button is the smaller of the two wrongs meanwhile.
 */
export async function startReport(orderId: string): Promise<ReviewState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'That area is for the analyst only.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('transition_order', {
    p_order_id: orderId,
    p_to: 'report_generating',
  })

  if (error) {
    console.error('startReport failed', { orderId, code: error.code, message: error.message })
    return { error: readable(error.code, error.message, 'We could not start that just then.') }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}
