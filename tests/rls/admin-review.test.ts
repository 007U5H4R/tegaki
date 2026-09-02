import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'
import { TIER_LIST } from '@/lib/tiers'

/**
 * T07 — the review, and who is allowed to perform it.
 *
 * Approval is the moment Tegaki starts owing somebody something: the
 * turnaround clock runs from here, not from checkout. Rejection costs a
 * customer days. Both are therefore admin-only, and both are proven here
 * against the live project rather than trusted to a route guard — a page can
 * be bypassed, a definer function cannot.
 *
 * The suite also checks the thing the ticket most easily gets wrong:
 * granting an admin visibility must not widen what a buyer can see. The T03
 * and T04 suites still passing is the other half of that proof.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

const REASON = 'The second page is out of focus — please photograph it again in daylight.'

describe.skipIf(!configured)('reviewing a sample', () => {
  let service: SupabaseClient
  let reviewer: SupabaseClient
  let buyer: SupabaseClient
  let other: SupabaseClient
  let adminUser: PoolMember
  let buyerUser: PoolMember
  let otherUser: PoolMember

  beforeAll(async () => {
    service = asService()

    adminUser = pool().analyst
    buyerUser = pool().buyerA
    otherUser = pool().buyerB

    // The allowlist is compiled into handle_new_user(), so a fixture account
    // is promoted directly. This is the one place a role is set by hand, and
    // it is deliberately not something the app can do.
    await service.from('profiles').update({ role: 'admin' }).eq('id', adminUser.id)

    reviewer = asMember(adminUser)
    buyer = asMember(buyerUser)
    other = asMember(otherUser)
  })

  // ── The turnaround promise ────────────────────────────────────────────────

  it('promises exactly the turnaround the tier table advertises', async () => {
    for (const tier of TIER_LIST) {
      const { data, error } = await service.rpc('tier_turnaround_days', { p_tier: tier.id })
      expect(error, tier.id).toBeNull()
      expect(data, `SQL turnaround for ${tier.id} disagrees with tiers.ts`).toBe(
        tier.turnaroundDays,
      )
    }
  })

  it.each(TIER_LIST.map((t) => [t.id, t.turnaroundDays] as const))(
    'stamps a %s approval with a delivery date %i days out',
    async (tier, days) => {
      const id = await submittedOrder(service, buyerUser.id, tier)

      const { error } = await reviewer.rpc('transition_order', {
        p_order_id: id,
        p_to: 'analysis_in_progress',
      })
      expect(error).toBeNull()

      const { data } = await service
        .from('orders')
        .select('status, approved_at, expected_delivery_date')
        .eq('id', id)
        .single()

      expect(data?.status).toBe('analysis_in_progress')
      expect(data?.approved_at).not.toBeNull()

      const expected = new Date()
      expected.setDate(expected.getDate() + days)
      expect(data?.expected_delivery_date).toBe(expected.toISOString().slice(0, 10))
    },
  )

  it('starts the clock at approval, not at checkout', async () => {
    // An order submitted a week ago and approved today is owed five days from
    // today. This is the PRD's whole reason for separating the two moments:
    // an unreadable photo must not eat the promise.
    const id = await submittedOrder(service, buyerUser.id, 'core', { daysAgo: 7 })

    await reviewer.rpc('transition_order', { p_order_id: id, p_to: 'analysis_in_progress' })

    const { data } = await service
      .from('orders')
      .select('expected_delivery_date')
      .eq('id', id)
      .single()

    const fiveDaysOut = new Date()
    fiveDaysOut.setDate(fiveDaysOut.getDate() + 5)
    expect(data?.expected_delivery_date).toBe(fiveDaysOut.toISOString().slice(0, 10))
  })

  // ── Rejection ─────────────────────────────────────────────────────────────

  it('will not turn a customer away without saying why', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    for (const reason of [null, '', '   ']) {
      const { error } = await reviewer.rpc('transition_order', {
        p_order_id: id,
        p_to: 'needs_reupload',
        p_reason: reason,
      })
      expect(error?.message, `reason ${JSON.stringify(reason)}`).toMatch(/say why/i)
    }

    expect(await statusOf(service, id)).toBe('sample_under_review')
  })

  it('stores the reason verbatim, and a fortnight to act on it', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { error } = await reviewer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'needs_reupload',
      p_reason: REASON,
    })
    expect(error).toBeNull()

    const { data } = await service
      .from('orders')
      .select('status, rejected_reason, reupload_deadline, approved_at')
      .eq('id', id)
      .single()

    expect(data?.status).toBe('needs_reupload')
    // Verbatim: the customer reads this exact sentence, so anything that
    // trimmed or rewrote it would be putting words in the analyst's mouth.
    expect(data?.rejected_reason).toBe(REASON)
    expect(data?.approved_at, 'a rejected sample was never approved').toBeNull()

    const deadline = new Date(data!.reupload_deadline as string)
    const fortnight = (deadline.getTime() - Date.now()) / 86_400_000
    expect(fortnight).toBeGreaterThan(13.9)
    expect(fortnight).toBeLessThan(14.1)
  })

  it('gives a replacement sample its own review, and dates the promise from that', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'express')

    await reviewer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'needs_reupload',
      p_reason: REASON,
    })

    // The buyer photographs the page again and sends it, which puts the order
    // back in the queue. Without a replacement the transition is refused —
    // that rule has its own tests in reupload.test.ts.
    await addReplacementSample(service, id, buyerUser.id)

    const { error: resubmit } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(resubmit).toBeNull()

    const { error: approve } = await reviewer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'analysis_in_progress',
    })
    expect(approve).toBeNull()

    const { data } = await service
      .from('orders')
      .select('approved_at, expected_delivery_date, rejected_reason')
      .eq('id', id)
      .single()

    // Three days from the approval of the sample that was actually usable.
    const threeDaysOut = new Date()
    threeDaysOut.setDate(threeDaysOut.getDate() + 3)
    expect(data?.expected_delivery_date).toBe(threeDaysOut.toISOString().slice(0, 10))
    expect(data?.approved_at).not.toBeNull()

    // The old reason is kept rather than cleared: it is a record of what
    // happened. Status is what decides whether the customer still sees it.
    expect(data?.rejected_reason).toBe(REASON)
  })

  // ── Who may review ────────────────────────────────────────────────────────

  it('does not let a buyer approve their own order', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'analysis_in_progress',
    })
    expect(error).not.toBeNull()
    expect(await statusOf(service, id)).toBe('sample_under_review')
  })

  it('does not let a buyer reject their own order to reset the clock', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'needs_reupload',
      p_reason: 'let me try again',
    })
    expect(error).not.toBeNull()
    expect(await statusOf(service, id)).toBe('sample_under_review')
  })

  it('does not let an unrelated signed-in user review anything', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { error } = await other.rpc('transition_order', {
      p_order_id: id,
      p_to: 'analysis_in_progress',
    })
    expect(error).not.toBeNull()
    expect(await statusOf(service, id)).toBe('sample_under_review')
  })

  // ── What an admin can see, and what that must not change ──────────────────

  it('lets the admin read every order and its buyer', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { data: orders } = await reviewer.from('orders').select('id').eq('id', id)
    expect(orders).toHaveLength(1)

    const { data: profile } = await reviewer
      .from('profiles')
      .select('email')
      .eq('id', buyerUser.id)
      .maybeSingle()
    expect(profile?.email).toBe(buyerUser.email)
  })

  it('lets the admin read the samples and the payment', async () => {
    const id = await submittedOrder(service, buyerUser.id, 'core')

    const { data: files } = await reviewer.from('order_files').select('id').eq('order_id', id)
    expect(files?.length).toBeGreaterThan(0)

    const { data: payments } = await reviewer.from('payments').select('id').eq('order_id', id)
    expect(payments).toHaveLength(1)
  })

  it('has not widened anything for an ordinary buyer', async () => {
    // The admin policies are additive on purpose. If granting an admin sight
    // of every order also let one buyer see another's, that would be a far
    // worse bug than the feature is worth.
    const mine = await submittedOrder(service, buyerUser.id, 'core')
    const theirs = await submittedOrder(service, otherUser.id, 'core')

    const { data: seen } = await buyer.from('orders').select('id')
    const ids = (seen ?? []).map((o) => o.id as string)
    expect(ids).toContain(mine)
    expect(ids).not.toContain(theirs)

    const { data: profiles } = await buyer.from('profiles').select('id')
    expect(profiles).toHaveLength(1)
    expect(profiles![0]!.id).toBe(buyerUser.id)
  })
})

// ── Fixtures ────────────────────────────────────────────────────────────────

/** An order sitting in `sample_under_review`, exactly as the queue receives it. */
async function submittedOrder(
  service: SupabaseClient,
  buyerId: string,
  tier: string,
  opts: { daysAgo?: number } = {},
): Promise<string> {
  const { data, error } = await service
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
    })
    .select('id')
    .single()
  if (error) throw error

  const id = data!.id as string

  const { error: fileError } = await service.from('order_files').insert({
    order_id: id,
    uploader_id: buyerId,
    version: 1,
    bucket_path: `${buyerId}/${id}/v1/${crypto.randomUUID()}.jpg`,
    file_name: 'page-1.jpg',
    mime: 'image/jpeg',
    size_bytes: 210_000,
  })
  if (fileError) throw fileError

  const { error: submitError } = await service.rpc('submit_order', { p_order_id: id })
  if (submitError) throw submitError

  if (opts.daysAgo) {
    const then = new Date(Date.now() - opts.daysAgo * 86_400_000).toISOString()
    await service.from('orders').update({ submitted_at: then, created_at: then }).eq('id', id)
  }

  return id
}

async function statusOf(service: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await service.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}

/** A fresh page, uploaded after the rejection — what makes a resubmission real. */
async function addReplacementSample(
  service: SupabaseClient,
  orderId: string,
  buyerId: string,
): Promise<void> {
  const { error } = await service.from('order_files').insert({
    order_id: orderId,
    uploader_id: buyerId,
    version: 2,
    bucket_path: `${buyerId}/${orderId}/v2/${crypto.randomUUID()}.jpg`,
    file_name: 'page-1-again.jpg',
    mime: 'image/jpeg',
    size_bytes: 195_000,
  })
  if (error) throw error
}
