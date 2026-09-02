'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/assert-admin'
import { createClient } from '@/lib/supabase/server'
import { TIER_DETAILS } from '@/lib/tiers'
import { MAX_REPORT_BYTES, REPORTS_BUCKET, reportDownloadName } from './constants'

export type AttachState = { ok?: true; error?: string }
export type DownloadState = { url?: string; error?: string }

/**
 * Record a validated report against an order and complete it.
 *
 * The bytes are already in storage by the time this runs — the browser puts
 * them there under the admin storage policy. This writes the row and moves
 * the status, and `attach_report()` does both in one transaction, so there is
 * no state where a report exists against an order still in production, nor a
 * completed order with nothing to download.
 *
 * `validated` is passed as a boolean and stamped server-side, so the client
 * never chooses when validation happened.
 */
export async function attachReport(input: {
  orderId: string
  bucketPath: string
  fileName: string
  sizeBytes: number
  validated: boolean
}): Promise<AttachState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'That area is for the analyst only.' }
  }

  if (!input.validated) {
    return {
      error:
        'Confirm you have read and validated this report before attaching it — nothing unvalidated reaches a customer.',
    }
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_REPORT_BYTES) {
    return { error: 'That file is empty or over the 25 MB limit.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('attach_report', {
    p_order_id: input.orderId,
    p_bucket_path: input.bucketPath,
    p_file_name: input.fileName,
    p_size_bytes: input.sizeBytes,
    p_validated: true,
  })

  if (error) {
    console.error('attach_report failed', {
      orderId: input.orderId,
      code: error.code,
      message: error.message,
    })
    // Our own guards raise check_violation with messages written to be read.
    if (error.code === '23514') return { error: error.message }
    return { error: 'We could not attach that report just then. Please try again.' }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/orders/${input.orderId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Mint a short-lived link to the caller's own report.
 *
 * Sixty seconds. A signed URL is a bearer token in a query string — it lands
 * in browser history and in whatever the customer forwards — so the window in
 * which a copied link still works is a minute rather than a week.
 *
 * Ownership is not checked here by comparing ids. The URL is minted through
 * the *caller's own* client, and there is no buyer policy on the reports
 * bucket at all, so a forged order id fails on the row read: RLS returns
 * nothing, and nothing is what gets signed.
 */
export async function getReportDownloadUrl(orderId: string): Promise<DownloadState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You need to be signed in to download your report.' }

  // Read through the caller's client: the RLS policy on `reports` joins to
  // orders.buyer_id, so another account's report simply is not there.
  const { data: report, error } = await supabase
    .from('reports')
    .select(
      'bucket_path, file_name, order_id, orders!inner(tier, full_name, subject_is_self, subject_name)',
    )
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) {
    console.error('report lookup failed', { orderId, code: error.code, message: error.message })
    return { error: 'We could not open your report just then. Please try again.' }
  }
  if (!report) return { error: 'That report could not be found.' }

  const order = report.orders as unknown as {
    tier: string | null
    full_name: string | null
    subject_is_self: boolean
    subject_name: string | null
  }

  const subject = order.subject_is_self ? order.full_name : order.subject_name
  const tier = order.tier ? TIER_DETAILS[order.tier as keyof typeof TIER_DETAILS] : null

  // Signed through the caller's own client, never the service key. A storage
  // policy lets a buyer read objects whose first path segment names an order
  // they own, so a forged order id fails twice over: the row read above
  // returns nothing, and the object would not be readable either.
  const { data: signed, error: signError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(report.bucket_path as string, 60, {
      download: reportDownloadName({
        subject,
        tierName: tier?.name ?? null,
        date: new Date(),
      }),
    })

  if (signError || !signed?.signedUrl) {
    console.error('signing failed', { orderId, message: signError?.message })
    return { error: 'We could not open your report just then. Please try again.' }
  }

  return { url: signed.signedUrl }
}
