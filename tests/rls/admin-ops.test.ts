import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

/**
 * T10 — closing the shop, and recording that a report actually reached
 * somebody.
 *
 * The pause is the interesting half. It is enforced by a trigger on `orders`
 * rather than by a check in the server action, because the promise being made
 * is "no new work reaches Tushar's queue" and an application check is only a
 * promise about callers who come through the application. Every test here
 * therefore attacks the table directly, not the UI.
 *
 * The rule it must *not* break: a customer already mid-wizard can still
 * finish. The pause protects the queue from new work; one person completing
 * an order they started is not a flood.
 *
 * ⚠️ This file runs on its own, after everything else — see the `test` script.
 * The pause is a single global row, so a run that overlaps a suite creating
 * orders closes the shop underneath it. That is not hypothetical: it failed
 * one or two unrelated tests on every one of three consecutive runs before
 * the split, each time in a different place.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY
const configured = Boolean(url && publishableKey && secretKey)

const password = 'tegaki-adminops-fixture-6ea20b'
const runId = Math.random().toString(36).slice(2, 10)
const analystEmail = `ops-analyst-${runId}@tegaki.test`
const buyerEmail = `ops-buyer-${runId}@tegaki.test`

describe.skipIf(!configured)('admin operations', () => {
  let service: SupabaseClient
  let analyst: SupabaseClient
  let buyer: SupabaseClient
  let analystUser: User
  let buyerUser: User

  beforeAll(async () => {
    service = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    analystUser = await makeUser(service, analystEmail)
    buyerUser = await makeUser(service, buyerEmail)
    await service.from('profiles').update({ role: 'admin' }).eq('id', analystUser.id)
    analyst = await signIn(analystEmail)
    buyer = await signIn(buyerEmail)
  })

  // The pause is global. Leaving it on would close the shop for every other
  // suite running in parallel — and for Tushar.
  afterEach(async () => {
    await service.from('settings').update({ value: false }).eq('key', 'pause_new_orders')
  })

  afterAll(async () => {
    await service.from('settings').update({ value: false }).eq('key', 'pause_new_orders')
    for (const u of [analystUser, buyerUser]) {
      if (u?.id) await service.auth.admin.deleteUser(u.id)
    }
  })

  // ── Who can throw the switch ──────────────────────────────────────────────

  it('lets anyone signed in read the setting', async () => {
    const { data, error } = await buyer
      .from('settings')
      .select('value')
      .eq('key', 'pause_new_orders')
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('does not let a customer close the shop', async () => {
    await buyer.from('settings').update({ value: true }).eq('key', 'pause_new_orders')
    expect(await paused(service)).toBe(false)
  })

  it('does not let anyone invent a new switch or delete one', async () => {
    const inserted = await analyst.from('settings').insert({ key: 'anything', value: true })
    expect(inserted.error, 'switches come from migrations, not from clients').not.toBeNull()

    await analyst.from('settings').delete().eq('key', 'pause_new_orders')
    const { count } = await service
      .from('settings')
      .select('key', { count: 'exact', head: true })
      .eq('key', 'pause_new_orders')
    expect(count).toBe(1)
  })

  it('lets the analyst close and reopen it', async () => {
    const closed = await analyst
      .from('settings')
      .update({ value: true })
      .eq('key', 'pause_new_orders')
    expect(closed.error).toBeNull()
    expect(await paused(service)).toBe(true)

    await analyst.from('settings').update({ value: false }).eq('key', 'pause_new_orders')
    expect(await paused(service)).toBe(false)
  })

  // ── What the pause actually stops ─────────────────────────────────────────

  it('refuses a new order while closed — attacked at the table, not the button', async () => {
    await setPaused(service, true)

    const { error } = await buyer.from('orders').insert({ buyer_id: buyerUser.id })

    expect(error?.message).toMatch(/temporarily closed/i)
    expect(await orderCount(service, buyerUser.id)).toBe(0)
  })

  it('lets an order already in flight be finished', async () => {
    // Started before the shop closed — this customer is mid-wizard.
    const id = await submittableDraft(service, buyerUser.id)
    await setPaused(service, true)

    const { error } = await buyer.rpc('submit_order', { p_order_id: id })

    // The pause protects the queue from NEW work. Somebody who already
    // started, paid attention and photographed two pages is not new work, and
    // turning them away at the last step would be the worst possible moment.
    expect(error, 'an in-flight order must still be completable').toBeNull()
    expect(await statusOf(service, id)).toBe('sample_under_review')
  })

  it('still lets the analyst create one while closed', async () => {
    await setPaused(service, true)

    const { error } = await analyst.from('orders').insert({ buyer_id: analystUser.id })
    expect(error, 'the analyst may need to reproduce something').toBeNull()
  })

  it('opens again the moment it is switched back', async () => {
    await setPaused(service, true)
    const blocked = await buyer.from('orders').insert({ buyer_id: buyerUser.id })
    expect(blocked.error).not.toBeNull()

    await setPaused(service, false)
    const { error } = await buyer.from('orders').insert({ buyer_id: buyerUser.id })
    expect(error).toBeNull()
  })

  // ── Delivered ─────────────────────────────────────────────────────────────

  it('refuses to mark an order delivered before it is completed', async () => {
    const id = await submittableDraft(service, buyerUser.id)
    await service.rpc('submit_order', { p_order_id: id })

    const { error } = await analyst.rpc('mark_delivered', { p_order_id: id })
    expect(error?.message).toMatch(/completed/i)
  })

  it('stamps a completed order once, and refuses a second time', async () => {
    const id = await deliveredReadyOrder(service, analyst, buyerUser.id)

    const first = await analyst.rpc('mark_delivered', { p_order_id: id })
    expect(first.error).toBeNull()

    const { data } = await service.from('orders').select('delivered_at').eq('id', id).single()
    expect(data?.delivered_at).not.toBeNull()

    // The retention clock (T15) counts from this date. A second click must
    // not move it.
    const second = await analyst.rpc('mark_delivered', { p_order_id: id })
    expect(second.error?.message).toMatch(/already/i)

    const { data: after } = await service
      .from('orders')
      .select('delivered_at')
      .eq('id', id)
      .single()
    expect(after?.delivered_at).toBe(data?.delivered_at)
  })

  it('does not let a customer mark their own order delivered', async () => {
    const id = await deliveredReadyOrder(service, analyst, buyerUser.id)

    const { error } = await buyer.rpc('mark_delivered', { p_order_id: id })
    expect(error).not.toBeNull()

    const { data } = await service.from('orders').select('delivered_at').eq('id', id).single()
    expect(data?.delivered_at).toBeNull()
  })

  it('does not let a customer write delivered_at directly either', async () => {
    const id = await deliveredReadyOrder(service, analyst, buyerUser.id)

    const { error } = await buyer
      .from('orders')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', id)

    // No column privilege, so this fails before any policy is consulted.
    expect(error).not.toBeNull()
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

async function setPaused(service: SupabaseClient, value: boolean): Promise<void> {
  const { error } = await service.from('settings').update({ value }).eq('key', 'pause_new_orders')
  if (error) throw error
}

async function paused(service: SupabaseClient): Promise<boolean> {
  const { data } = await service
    .from('settings')
    .select('value')
    .eq('key', 'pause_new_orders')
    .single()
  return data?.value === true
}

async function submittableDraft(service: SupabaseClient, buyerId: string): Promise<string> {
  const { data, error } = await service
    .from('orders')
    .insert({
      buyer_id: buyerId,
      tier: 'core',
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
    size_bytes: 200_000,
  })
  if (fileError) throw fileError
  return id
}

/** All the way to `completed`, with a report attached. */
async function deliveredReadyOrder(
  service: SupabaseClient,
  analyst: SupabaseClient,
  buyerId: string,
): Promise<string> {
  const id = await submittableDraft(service, buyerId)
  await service.rpc('submit_order', { p_order_id: id })

  for (const to of ['analysis_in_progress', 'report_generating']) {
    const { error } = await analyst.rpc('transition_order', { p_order_id: id, p_to: to })
    if (error) throw error
  }

  const { error } = await analyst.rpc('attach_report', {
    p_order_id: id,
    p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
    p_file_name: 'report.pdf',
    p_size_bytes: 2048,
    p_validated: true,
  })
  if (error) throw error
  return id
}

async function orderCount(service: SupabaseClient, buyerId: string): Promise<number> {
  const { count } = await service
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', buyerId)
  return count ?? 0
}

async function statusOf(service: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await service.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}
