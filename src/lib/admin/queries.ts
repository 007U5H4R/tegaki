import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/orders/status'
import type { Tier } from '@/lib/tiers'

/**
 * Reading the queue.
 *
 * Every query here goes through the *admin's own* client, so the admin read
 * policies added in T07 are what grant access. The service key is not used
 * anywhere in the app; it stays reserved for cron (T15) and tests. That way
 * an admin request still carries an identity into the database and is still
 * subject to a rule somebody can read.
 */

/** A draft is not an order yet, so the queue never shows one. */
export const QUEUE_STATUSES = [
  'sample_under_review',
  'needs_reupload',
  'analysis_in_progress',
  'report_generating',
  'completed',
  'parked',
] as const satisfies readonly OrderStatus[]

export type QueueStatus = (typeof QUEUE_STATUSES)[number]

export function isQueueStatus(value: unknown): value is QueueStatus {
  return typeof value === 'string' && (QUEUE_STATUSES as readonly string[]).includes(value)
}

export type QueueRow = {
  id: string
  status: OrderStatus
  tier: Tier | null
  full_name: string | null
  subject_is_self: boolean
  subject_name: string | null
  submitted_at: string | null
  expected_delivery_date: string | null
  buyer: { email: string; full_name: string | null } | null
}

export async function getQueue(status?: QueueStatus): Promise<QueueRow[]> {
  const supabase = await createClient()

  // Close any re-upload windows that have expired before showing the queue,
  // so the analyst is never looking at an order the clock has already
  // decided about. Idempotent, and scoped by the function itself; T15's cron
  // is the backstop rather than the mechanism.
  await supabase.rpc('park_overdue_orders')

  let query = supabase
    .from('orders')
    .select(
      'id, status, tier, full_name, subject_is_self, subject_name, submitted_at, expected_delivery_date, buyer:profiles!orders_buyer_id_fkey(email, full_name)',
    )
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(`Could not load the queue: ${error.message}`)

  return (data ?? []) as unknown as QueueRow[]
}

/** How many orders sit in each state — the filter chips' counts. */
export async function getQueueCounts(): Promise<Record<QueueStatus, number>> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('orders').select('status').neq('status', 'draft')
  if (error) throw new Error(`Could not count the queue: ${error.message}`)

  const counts = Object.fromEntries(QUEUE_STATUSES.map((s) => [s, 0])) as Record<
    QueueStatus,
    number
  >

  for (const row of data ?? []) {
    const status = row.status as string
    if (isQueueStatus(status)) counts[status] += 1
  }

  return counts
}

export type AdminOrder = {
  id: string
  buyer_id: string
  status: OrderStatus
  tier: Tier | null
  full_name: string | null
  age: number | null
  gender: string | null
  city: string | null
  country: string | null
  email: string | null
  phone: string | null
  whatsapp_preferred: boolean
  subject_is_self: boolean
  subject_name: string | null
  subject_age: number | null
  consent_given_at: string | null
  guardrails_acked: Record<string, boolean> | null
  submitted_at: string | null
  approved_at: string | null
  expected_delivery_date: string | null
  rejected_reason: string | null
  reupload_deadline: string | null
  delivered_at: string | null
  samples_purged_at: string | null
  created_at: string
  buyer: { email: string; full_name: string | null } | null
}

export type AdminOrderFile = {
  id: string
  version: number
  bucket_path: string
  file_name: string
  mime: string
  size_bytes: number
  created_at: string
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, buyer_id, status, tier, full_name, age, gender, city, country, email, phone, whatsapp_preferred, subject_is_self, subject_name, subject_age, consent_given_at, guardrails_acked, submitted_at, approved_at, expected_delivery_date, rejected_reason, reupload_deadline, delivered_at, samples_purged_at, created_at, buyer:profiles!orders_buyer_id_fkey(email, full_name)',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error) throw new Error(`Could not load that order: ${error.message}`)
  return (data as unknown as AdminOrder) ?? null
}

export async function getAdminOrderFiles(orderId: string): Promise<AdminOrderFile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('order_files')
    .select('id, version, bucket_path, file_name, mime, size_bytes, created_at')
    .eq('order_id', orderId)
    .order('version', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Could not load the samples: ${error.message}`)
  return (data ?? []) as AdminOrderFile[]
}
