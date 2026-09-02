import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TIER_LIST } from '@/lib/tiers'

/**
 * T06 — submitting an order, and the two things that must not go wrong.
 *
 * A customer must never be charged twice, and a customer must never end up
 * paid-but-unsubmitted. Both are settled in the database rather than in the
 * button: `payments.order_id` is unique, and `submit_order()` does the
 * insert and the status change in one transaction.
 *
 * The suite also guards the one duplicated fact in the system — tier prices
 * exist in both src/lib/tiers.ts and SQL — by asserting the two agree.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY
const configured = Boolean(url && publishableKey && secretKey)

const password = 'tegaki-payments-fixture-3c8b41'
const runId = Math.random().toString(36).slice(2, 10)
const buyerEmail = `pay-buyer-${runId}@tegaki.test`
const otherEmail = `pay-other-${runId}@tegaki.test`

describe.skipIf(!configured)('submitting an order', () => {
  let admin: SupabaseClient
  let buyer: SupabaseClient
  let other: SupabaseClient
  let anon: SupabaseClient
  let buyerUser: User
  let otherUser: User

  beforeAll(async () => {
    admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    buyerUser = await makeUser(admin, buyerEmail)
    otherUser = await makeUser(admin, otherEmail)
    buyer = await signIn(buyerEmail)
    other = await signIn(otherEmail)
    anon = createClient(url!, publishableKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    for (const u of [buyerUser, otherUser]) {
      if (u?.id) await admin.auth.admin.deleteUser(u.id)
    }
  })

  // ── The prices ────────────────────────────────────────────────────────────

  it('charges exactly what the tier table displays', async () => {
    // The one place a price is written twice. If someone edits tiers.ts and
    // forgets the migration, a customer sees ₹2,999 and is recorded as having
    // paid ₹1,999 — so this failing is the point of it existing.
    for (const tier of TIER_LIST) {
      const { data, error } = await admin.rpc('tier_price_inr', { p_tier: tier.id })
      expect(error, tier.id).toBeNull()
      expect(data, `SQL price for ${tier.id} disagrees with tiers.ts`).toBe(tier.priceInr)
    }
  })

  // ── The happy path ────────────────────────────────────────────────────────

  it('records the payment and moves the order in one call', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })
    expect(error).toBeNull()

    const { data: order } = await admin
      .from('orders')
      .select('status, submitted_at')
      .eq('id', id)
      .single()
    expect(order?.status).toBe('sample_under_review')
    expect(order?.submitted_at).not.toBeNull()

    const { data: payment } = await admin
      .from('payments')
      .select('amount_inr, currency, provider, status')
      .eq('order_id', id)
      .single()
    expect(payment).toMatchObject({
      amount_inr: 1999,
      currency: 'INR',
      provider: 'demo',
      status: 'demo_paid',
    })
  })

  // ── What must be true before an order can be submitted ────────────────────

  it('refuses an order with no tier chosen', async () => {
    const id = await submittableDraft(admin, buyerUser.id, null)

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })
    expect(error?.message).toMatch(/tier/i)

    expect(await paymentCount(admin, id)).toBe(0)
    expect(await statusOf(admin, id)).toBe('draft')
  })

  it('refuses an order with no handwriting sample', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core', { withFile: false })

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })
    expect(error?.message).toMatch(/sample/i)

    expect(await paymentCount(admin, id)).toBe(0)
    expect(await statusOf(admin, id)).toBe('draft')
  })

  it("refuses someone else's assessment without consent, in words a customer can act on", async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core', {
      subject: { name: 'Rahul Menon', age: 12 },
    })

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })
    // Not a raw constraint name — the CHECK would refuse this write anyway,
    // and the function exists to say why first.
    expect(error?.message).toMatch(/permission/i)
    expect(error?.message).not.toMatch(/orders_consent_required_when_submitted/)

    expect(await paymentCount(admin, id)).toBe(0)
  })

  it('accepts it once consent is recorded', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core', {
      subject: { name: 'Rahul Menon', age: 12, consented: true },
    })

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })
    expect(error).toBeNull()
    expect(await statusOf(admin, id)).toBe('sample_under_review')
  })

  it("refuses to submit another buyer's order", async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')

    const { error } = await other.rpc('submit_order', { p_order_id: id })
    expect(error).not.toBeNull()

    expect(await paymentCount(admin, id)).toBe(0)
    expect(await statusOf(admin, id)).toBe('draft')
  })

  // ── Double submission ─────────────────────────────────────────────────────

  it('leaves exactly one payment when the button is pressed twice', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'comprehensive')

    const first = await buyer.rpc('submit_order', { p_order_id: id })
    expect(first.error).toBeNull()

    const second = await buyer.rpc('submit_order', { p_order_id: id })
    expect(second.error?.message).toMatch(/already been submitted/i)

    expect(await paymentCount(admin, id)).toBe(1)
  })

  it('leaves exactly one payment when both presses land at once', async () => {
    // The realistic version of a double-click: two requests in flight, neither
    // aware of the other. `select ... for update` serialises them.
    const id = await submittableDraft(admin, buyerUser.id, 'express')

    const results = await Promise.all([
      buyer.rpc('submit_order', { p_order_id: id }),
      buyer.rpc('submit_order', { p_order_id: id }),
    ])

    expect(results.filter((r) => r.error === null)).toHaveLength(1)
    expect(await paymentCount(admin, id)).toBe(1)
  })

  it('cannot be paid twice even by a caller that bypasses the function', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')
    await buyer.rpc('submit_order', { p_order_id: id })

    // The service role bypasses RLS entirely, so this is the unique index
    // itself talking rather than a policy.
    const { error } = await admin.from('payments').insert({ order_id: id, amount_inr: 1 })
    expect(error).not.toBeNull()
    expect(await paymentCount(admin, id)).toBe(1)
  })

  // ── Who can see a payment ─────────────────────────────────────────────────

  it('lets the buyer read their own payment', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')
    await buyer.rpc('submit_order', { p_order_id: id })

    const { data } = await buyer.from('payments').select('amount_inr').eq('order_id', id)
    expect(data).toHaveLength(1)
  })

  it('does not let another buyer read it, even knowing the order id', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')
    await buyer.rpc('submit_order', { p_order_id: id })

    const { data } = await other.from('payments').select('amount_inr').eq('order_id', id)
    expect(data ?? []).toHaveLength(0)
  })

  it('shows an anonymous visitor nothing at all', async () => {
    const { data } = await anon.from('payments').select('id')
    expect(data ?? []).toHaveLength(0)
  })

  it('does not let a client write a payment row directly', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'core')

    const { error } = await buyer.from('payments').insert({ order_id: id, amount_inr: 1 })
    expect(error).not.toBeNull()
    expect(await paymentCount(admin, id)).toBe(0)
  })

  it('does not let a buyer rewrite what they were recorded as paying', async () => {
    const id = await submittableDraft(admin, buyerUser.id, 'comprehensive')
    await buyer.rpc('submit_order', { p_order_id: id })

    await buyer.from('payments').update({ amount_inr: 1 }).eq('order_id', id)

    const { data } = await admin.from('payments').select('amount_inr').eq('order_id', id).single()
    expect(data?.amount_inr).toBe(2999)
  })
})

// ── Fixtures ────────────────────────────────────────────────────────────────

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

/**
 * A draft that is ready to submit, seeded with the service role so each test
 * starts from exactly the state it is about rather than replaying the wizard.
 */
async function submittableDraft(
  admin: SupabaseClient,
  buyerId: string,
  tier: string | null,
  opts: {
    withFile?: boolean
    subject?: { name: string; age: number; consented?: boolean }
  } = {},
): Promise<string> {
  const { withFile = true, subject } = opts

  const { data, error } = await admin
    .from('orders')
    .insert({
      buyer_id: buyerId,
      tier,
      wizard_stage: 4,
      full_name: 'Asha Menon',
      age: 34,
      city: 'Kochi',
      country: 'India',
      email: 'asha@example.com',
      phone: '+91 98765 43210',
      subject_is_self: !subject,
      subject_name: subject?.name ?? null,
      subject_age: subject?.age ?? null,
      consent_given_at: subject?.consented ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (error) throw error

  const id = data!.id as string

  if (withFile) {
    const { error: fileError } = await admin.from('order_files').insert({
      order_id: id,
      uploader_id: buyerId,
      version: 1,
      bucket_path: `${buyerId}/${id}/v1/${crypto.randomUUID()}.jpg`,
      file_name: 'page-1.jpg',
      mime: 'image/jpeg',
      size_bytes: 240_000,
    })
    if (fileError) throw fileError
  }

  return id
}

async function paymentCount(admin: SupabaseClient, orderId: string): Promise<number> {
  const { count } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
  return count ?? 0
}

async function statusOf(admin: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await admin.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}
