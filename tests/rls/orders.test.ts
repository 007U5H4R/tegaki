import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orders/status'

/**
 * T03 — orders isolation and the status machine.
 *
 * Two halves. The first proves one buyer cannot see or touch another's
 * orders. The second walks the ENTIRE transition matrix: for all 49
 * from/to pairs, either the edge is in PRD §6.6 and succeeds for the right
 * actor, or it is rejected. A state machine tested only on its happy path is
 * a state machine whose illegal edges nobody has ever tried.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY
const configured = Boolean(url && publishableKey && secretKey)

const password = 'tegaki-orders-fixture-4b1e77'
const runId = Math.random().toString(36).slice(2, 10)
const aliceEmail = `orders-alice-${runId}@tegaki.test`
const bobEmail = `orders-bob-${runId}@tegaki.test`

/** The legal edges, straight from Solution-PRD §6.6. */
const LEGAL: ReadonlyArray<[OrderStatus, OrderStatus]> = [
  ['draft', 'sample_under_review'],
  ['sample_under_review', 'analysis_in_progress'],
  ['sample_under_review', 'needs_reupload'],
  ['needs_reupload', 'sample_under_review'],
  ['needs_reupload', 'parked'],
  ['analysis_in_progress', 'report_generating'],
  ['report_generating', 'completed'],
]

const isLegal = (from: OrderStatus, to: OrderStatus) =>
  LEGAL.some(([f, t]) => f === from && t === to)

describe.skipIf(!configured)('orders', () => {
  let admin: SupabaseClient
  let alice: SupabaseClient
  let bob: SupabaseClient
  let aliceUser: User
  let bobUser: User

  beforeAll(async () => {
    admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    aliceUser = await makeUser(admin, aliceEmail)
    bobUser = await makeUser(admin, bobEmail)
    alice = await signIn(aliceEmail)
    bob = await signIn(bobEmail)
  })

  afterAll(async () => {
    for (const u of [aliceUser, bobUser]) {
      if (u?.id) await admin.auth.admin.deleteUser(u.id)
    }
  })

  describe('isolation', () => {
    it('shows a buyer only their own orders', async () => {
      const mine = await newDraft(alice, aliceUser.id)
      await newDraft(bob, bobUser.id)

      const { data } = await alice.from('orders').select('id, buyer_id')
      expect(data?.every((o) => o.buyer_id === aliceUser.id)).toBe(true)
      expect(data?.some((o) => o.id === mine)).toBe(true)
    })

    it("returns nothing when a buyer asks for someone else's order by id", async () => {
      const hers = await newDraft(alice, aliceUser.id)

      const { data, error } = await bob.from('orders').select('id').eq('id', hers)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('refuses an order inserted on behalf of somebody else', async () => {
      const { error } = await bob.from('orders').insert({ buyer_id: aliceUser.id })
      expect(error).not.toBeNull()
    })

    it("cannot delete another buyer's draft", async () => {
      const hers = await newDraft(alice, aliceUser.id)

      await bob.from('orders').delete().eq('id', hers)

      const { data } = await admin.from('orders').select('id').eq('id', hers)
      expect(data, 'the draft should still exist').toHaveLength(1)
    })

    it('shows an anonymous client nothing at all', async () => {
      const anon = createClient(url!, publishableKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data } = await anon.from('orders').select('id')
      expect(data ?? []).toHaveLength(0)
    })
  })

  describe('status is not client-writable', () => {
    it('rejects a direct status update even by the owner', async () => {
      const id = await newDraft(alice, aliceUser.id)

      const { error } = await alice.from('orders').update({ status: 'completed' }).eq('id', id)

      // Blocked by the missing column privilege, not merely by a policy.
      expect(error).not.toBeNull()

      const { data } = await admin.from('orders').select('status').eq('id', id).single()
      expect(data?.status).toBe('draft')
    })

    it('still allows the owner to edit their draft’s tier', async () => {
      const id = await newDraft(alice, aliceUser.id)

      const { error } = await alice.from('orders').update({ tier: 'core' }).eq('id', id)
      expect(error).toBeNull()

      const { data } = await admin.from('orders').select('tier').eq('id', id).single()
      expect(data?.tier).toBe('core')
    })

    it('stops the owner editing an order once it has been submitted', async () => {
      const id = await newDraft(alice, aliceUser.id)
      await alice.rpc('transition_order', { p_order_id: id, p_to: 'sample_under_review' })

      await alice.from('orders').update({ tier: 'comprehensive' }).eq('id', id)

      const { data } = await admin.from('orders').select('tier').eq('id', id).single()
      expect(data?.tier, 'a submitted order is no longer the buyer’s to change').not.toBe(
        'comprehensive',
      )
    })
  })

  describe('the full transition matrix', () => {
    it('rejects every edge that is not in the PRD', async () => {
      const illegal = ORDER_STATUSES.flatMap((from) =>
        ORDER_STATUSES.filter((to) => !isLegal(from, to)).map((to) => [from, to] as const),
      )

      // 49 pairs minus 7 legal ones.
      expect(illegal).toHaveLength(ORDER_STATUSES.length ** 2 - LEGAL.length)

      for (const [from, to] of illegal) {
        const id = await seedAt(admin, aliceUser.id, from)
        const { error } = await admin.rpc('transition_order', { p_order_id: id, p_to: to })
        expect(error, `${from} → ${to} should have been rejected`).not.toBeNull()
      }
    })

    it('accepts every legal edge for the trusted server context', async () => {
      for (const [from, to] of LEGAL) {
        const id = await seedAt(admin, aliceUser.id, from)
        const { error } = await admin.rpc('transition_order', { p_order_id: id, p_to: to })
        expect(error, `${from} → ${to} should have been allowed`).toBeNull()

        const { data } = await admin.from('orders').select('status').eq('id', id).single()
        expect(data?.status).toBe(to)
      }
    })

    it('lets the owner submit their own draft, and stamps submitted_at', async () => {
      const id = await newDraft(alice, aliceUser.id)

      const { error } = await alice.rpc('transition_order', {
        p_order_id: id,
        p_to: 'sample_under_review',
      })
      expect(error).toBeNull()

      const { data } = await admin
        .from('orders')
        .select('status, submitted_at')
        .eq('id', id)
        .single()
      expect(data?.status).toBe('sample_under_review')
      expect(data?.submitted_at).not.toBeNull()
    })

    it("refuses to let a buyer submit somebody else's draft", async () => {
      const hers = await newDraft(alice, aliceUser.id)

      const { error } = await bob.rpc('transition_order', {
        p_order_id: hers,
        p_to: 'sample_under_review',
      })
      expect(error).not.toBeNull()
    })

    it('refuses to let a buyer approve their own sample', async () => {
      // The whole point of review: only an analyst starts the clock.
      const id = await seedAt(admin, aliceUser.id, 'sample_under_review')

      const { error } = await alice.rpc('transition_order', {
        p_order_id: id,
        p_to: 'analysis_in_progress',
      })
      expect(error).not.toBeNull()

      const { data } = await admin.from('orders').select('status').eq('id', id).single()
      expect(data?.status).toBe('sample_under_review')
    })
  })
})

async function makeUser(admin: SupabaseClient, email: string): Promise<User> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data.user!
}

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(url!, publishableKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

async function newDraft(client: SupabaseClient, buyerId: string): Promise<string> {
  const { data, error } = await client
    .from('orders')
    .insert({ buyer_id: buyerId })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

/**
 * Place a fixture directly at a status. Uses the service role, which bypasses
 * RLS — the only sanctioned way to reach a mid-lifecycle state without
 * walking the machine, and precisely why the tests need it.
 */
async function seedAt(
  admin: SupabaseClient,
  buyerId: string,
  status: OrderStatus,
): Promise<string> {
  const { data, error } = await admin
    .from('orders')
    .insert({ buyer_id: buyerId, status, tier: 'core' })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}
