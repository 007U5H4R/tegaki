import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * A buyer may create a draft, and only a draft.
 *
 * Found at the review gate: INSERT on orders was granted on every column, so
 * a direct PostgREST call could fabricate an order in any status with any
 * stamps. UPDATE had been column-restricted all along; INSERT had not.
 */
const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

describe.skipIf(!configured)('creating an order', () => {
  let service: SupabaseClient
  let buyer: SupabaseClient
  let buyerUser: PoolMember

  beforeAll(() => {
    service = asService()
    buyerUser = pool().buyerA
    buyer = asMember(buyerUser)
  })

  it('still lets a buyer start a draft', async () => {
    const { data, error } = await buyer
      .from('orders')
      .insert({ buyer_id: buyerUser.id })
      .select('id, status')
      .single()
    expect(error).toBeNull()
    expect(data?.status).toBe('draft')
    await service.from('orders').delete().eq('id', data!.id)
  })

  it.each([
    ['status', 'analysis_in_progress'],
    ['expected_delivery_date', '2026-12-25'],
    ['approved_at', new Date().toISOString()],
    ['delivered_at', new Date().toISOString()],
    ['submitted_at', new Date().toISOString()],
    ['samples_purged_at', new Date().toISOString()],
    ['tier', 'core'],
  ])('refuses an insert that sets %s', async (column, value) => {
    const { data, error } = await buyer
      .from('orders')
      .insert({ buyer_id: buyerUser.id, [column]: value })
      .select('id')
    expect(error, `a buyer inserted ${column} directly`).not.toBeNull()
    expect(data).toBeNull()
  })
})
