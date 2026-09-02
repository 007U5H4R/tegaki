import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from './status'
import type { Tier } from '@/lib/tiers'

export type Order = {
  id: string
  buyer_id: string
  status: OrderStatus
  tier: Tier | null
  wizard_stage: number
  full_name: string | null
  subject_is_self: boolean
  subject_name: string | null
  guardrails_acked: Record<string, boolean> | null
  submitted_at: string | null
  expected_delivery_date: string | null
  rejected_reason: string | null
  reupload_deadline: string | null
  created_at: string
  updated_at: string
}

const ORDER_COLUMNS =
  'id, buyer_id, status, tier, wizard_stage, full_name, subject_is_self, subject_name, guardrails_acked, submitted_at, expected_delivery_date, rejected_reason, reupload_deadline, created_at, updated_at'

/**
 * The signed-in user's orders, newest first.
 *
 * Read through the *user's own* client, so row-level security does the
 * filtering. There is deliberately no `buyer_id` predicate here: adding one
 * would mask a broken policy behind a correct-looking query, and the
 * isolation tests would still pass while the database was wide open.
 */
export async function getMyOrders(): Promise<Order[]> {
  const supabase = await createClient()

  // A re-upload window that has closed is closed whether or not a scheduled
  // job has noticed yet, so the sweep runs before the read. It only touches
  // this caller's own overdue orders, and it is idempotent — see
  // park_overdue_orders(). T15's cron is the backstop, not the mechanism.
  await supabase.rpc('park_overdue_orders')

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load orders: ${error.message}`)
  return (data ?? []) as Order[]
}

/** The files on one of the caller's own orders, newest version first. */
export async function getMyOrderFiles(
  orderId: string,
): Promise<{ id: string; file_name: string; size_bytes: number; version: number }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('order_files')
    .select('id, file_name, size_bytes, version')
    .eq('order_id', orderId)
    .order('version', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Could not load your samples: ${error.message}`)
  return data ?? []
}
