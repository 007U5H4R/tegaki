import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * T05 — consent, guaranteed by the database.
 *
 * When somebody orders an assessment of another person's handwriting, that
 * person has agreed to nothing by being written about. The form asks for
 * confirmation, the server action re-checks it, and these tests prove the
 * third and only real guarantee: Postgres itself refuses to hold an order
 * that has left draft without consent recorded.
 *
 * A rule enforced only in a form is a rule that lasts until someone changes
 * the form.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

const profileArgs = (over: Record<string, unknown> = {}) => ({
  p_full_name: 'Asha Menon',
  p_age: 34,
  p_gender: null,
  p_city: 'Kochi',
  p_country: 'India',
  p_email: 'asha@example.com',
  p_phone: '+91 98765 43210',
  p_whatsapp: true,
  p_subject_is_self: true,
  p_subject_name: null,
  p_subject_age: null,
  p_consent: false,
  ...over,
})

describe.skipIf(!configured)('consent for a third-party subject', () => {
  let admin: SupabaseClient
  let buyer: SupabaseClient
  let other: SupabaseClient
  let buyerUser: PoolMember
  let otherUser: PoolMember

  beforeAll(async () => {
    admin = asService()
    buyerUser = pool().buyerA
    otherUser = pool().buyerB
    buyer = asMember(buyerUser)
    other = asMember(otherUser)
  })

  it('saves a self-assessment without asking for consent', async () => {
    const id = await newDraft(buyer, buyerUser.id)

    const { error } = await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs(),
    })
    expect(error).toBeNull()

    const { data } = await admin
      .from('orders')
      .select('consent_given_at, wizard_stage')
      .eq('id', id)
      .single()
    expect(data?.consent_given_at).toBeNull()
    expect(data?.wizard_stage).toBe(2)
  })

  it("refuses to save someone else's assessment without consent", async () => {
    const id = await newDraft(buyer, buyerUser.id)

    const { error } = await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({
        p_subject_is_self: false,
        p_subject_name: 'Rahul Menon',
        p_subject_age: 12,
        p_consent: false,
      }),
    })

    expect(error).not.toBeNull()
    expect(error?.message).toMatch(/consent/i)
  })

  it('stamps the moment consent was confirmed', async () => {
    const id = await newDraft(buyer, buyerUser.id)

    await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({
        p_subject_is_self: false,
        p_subject_name: 'Rahul Menon',
        p_subject_age: 12,
        p_consent: true,
      }),
    })

    const { data } = await admin
      .from('orders')
      .select('consent_given_at, subject_name')
      .eq('id', id)
      .single()
    expect(data?.consent_given_at).not.toBeNull()
    expect(data?.subject_name).toBe('Rahul Menon')
  })

  it('clears consent when the buyer switches back to their own handwriting', async () => {
    const id = await newDraft(buyer, buyerUser.id)

    await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({
        p_subject_is_self: false,
        p_subject_name: 'Rahul Menon',
        p_subject_age: 12,
        p_consent: true,
      }),
    })

    await buyer.rpc('save_order_profile', { p_order_id: id, ...profileArgs() })

    const { data } = await admin
      .from('orders')
      .select('consent_given_at, subject_name')
      .eq('id', id)
      .single()

    // A timestamp that outlived the answer it belonged to would be a lie in
    // the audit trail.
    expect(data?.consent_given_at).toBeNull()
    expect(data?.subject_name).toBeNull()
  })

  it('will not let an order leave draft without consent, whatever the app does', async () => {
    // Written with the service role, which bypasses RLS entirely — so this
    // is the constraint itself talking, not a policy.
    const { data: seeded } = await admin
      .from('orders')
      .insert({
        buyer_id: buyerUser.id,
        subject_is_self: false,
        subject_name: 'Rahul Menon',
        subject_age: 12,
      })
      .select('id')
      .single()

    const { error } = await admin
      .from('orders')
      .update({ status: 'sample_under_review' })
      .eq('id', seeded!.id)

    expect(error, 'the CHECK constraint should have refused this').not.toBeNull()
  })

  it('permits leaving draft once consent is recorded', async () => {
    const { data: seeded } = await admin
      .from('orders')
      .insert({
        buyer_id: buyerUser.id,
        subject_is_self: false,
        subject_name: 'Rahul Menon',
        subject_age: 12,
        consent_given_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    const { error } = await admin.rpc('transition_order', {
      p_order_id: seeded!.id,
      p_to: 'sample_under_review',
    })
    expect(error).toBeNull()
  })

  it("refuses to save into another buyer's order", async () => {
    const id = await newDraft(buyer, buyerUser.id)

    const { error } = await other.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({ p_full_name: 'Not Asha' }),
    })
    expect(error).not.toBeNull()

    const { data } = await admin.from('orders').select('full_name').eq('id', id).single()
    expect(data?.full_name).not.toBe('Not Asha')
  })

  it('refuses to edit an order that has already been submitted', async () => {
    const id = await newDraft(buyer, buyerUser.id)
    await buyer.rpc('save_order_profile', { p_order_id: id, ...profileArgs() })
    await buyer.rpc('transition_order', { p_order_id: id, p_to: 'sample_under_review' })

    const { error } = await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({ p_full_name: 'Changed My Mind' }),
    })
    expect(error).not.toBeNull()
  })

  it('normalises the email, so a stray capital does not become a second identity', async () => {
    const id = await newDraft(buyer, buyerUser.id)

    await buyer.rpc('save_order_profile', {
      p_order_id: id,
      ...profileArgs({ p_email: '  Asha@Example.COM ' }),
    })

    const { data } = await admin.from('orders').select('email').eq('id', id).single()
    expect(data?.email).toBe('asha@example.com')
  })
})

async function newDraft(client: SupabaseClient, buyerId: string): Promise<string> {
  const { data, error } = await client
    .from('orders')
    .insert({ buyer_id: buyerId })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}
