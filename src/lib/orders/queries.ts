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
  submitted_at: string | null
  created_at: string
  updated_at: string
}

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

  const { data, error } = await supabase
    .from('orders')
    .select('id, buyer_id, status, tier, wizard_stage, submitted_at, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load orders: ${error.message}`)
  return (data ?? []) as Order[]
}
