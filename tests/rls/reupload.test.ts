import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * T08 — the fortnight after a rejection.
 *
 * A rejected order gives the customer fourteen days to send a better page.
 * Two rules make that window mean something, and both are enforced in the
 * database rather than by the screen that happens to be open:
 *
 *   A resubmission must carry something new. Otherwise "resubmit" is a button
 *   that returns the order to the queue unchanged, to be rejected a second
 *   time — spending the one thing the customer is short of.
 *
 *   The window must close by itself. A deadline nobody enforces quietly
 *   becomes infinite, and an order stuck in "needs another try" forever is
 *   worse for the customer than one honestly parked.
 *
 * The clock is controlled by writing `reupload_deadline` directly, so the
 * boundary is tested at an hour either side rather than by waiting a
 * fortnight.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

const REASON = 'The second page is out of focus — please photograph it flat, in daylight.'
const HOUR = 3_600_000

describe.skipIf(!configured)('the re-upload window', () => {
  let service: SupabaseClient
  let analyst: SupabaseClient
  let buyer: SupabaseClient
  let other: SupabaseClient
  let analystUser: PoolMember
  let buyerUser: PoolMember
  let otherUser: PoolMember

  beforeAll(async () => {
    service = asService()

    analystUser = pool().analyst
    buyerUser = pool().buyerA
    otherUser = pool().buyerB
    await service.from('profiles').update({ role: 'admin' }).eq('id', analystUser.id)

    analyst = asMember(analystUser)
    buyer = asMember(buyerUser)
    other = asMember(otherUser)
  })

  // ── Sending a replacement ─────────────────────────────────────────────────

  it('refuses a resubmission that carries no new page', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error?.message).toMatch(/replacement page/i)
    expect(await statusOf(service, id)).toBe('needs_reupload')
  })

  it('refuses one that only points at the page already rejected', async () => {
    // The original v1 file is still attached — it is the rejected one. Only a
    // sample uploaded AFTER the rejection counts as a replacement.
    const id = await rejectedOrder(service, analyst, buyerUser.id)

    const { count } = await service
      .from('order_files')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', id)
    expect(count, 'the rejected sample is still on the order').toBe(1)

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error).not.toBeNull()
  })

  it('accepts one that does, and keeps the rejected page as history', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await addReplacement(service, id, buyerUser.id)

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error).toBeNull()

    const { data: order } = await service
      .from('orders')
      .select('status, submitted_at, resubmitted_at, rejected_reason')
      .eq('id', id)
      .single()

    expect(order?.status).toBe('sample_under_review')
    expect(order?.resubmitted_at).not.toBeNull()
    // The first submission is not overwritten — both moments are facts.
    expect(order?.submitted_at).not.toBeNull()
    expect(new Date(order!.resubmitted_at as string).getTime()).toBeGreaterThanOrEqual(
      new Date(order!.submitted_at as string).getTime(),
    )

    // Version history survives: a rejected page and its replacement are both
    // evidence, and "the file I sent was fine" needs to be checkable.
    const { data: files } = await service
      .from('order_files')
      .select('version')
      .eq('order_id', id)
      .order('version')
    expect(files?.map((f) => f.version)).toEqual([1, 2])
  })

  it('does not let a stranger resubmit somebody else’s order', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await addReplacement(service, id, buyerUser.id)

    const { error } = await other.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error).not.toBeNull()
    expect(await statusOf(service, id)).toBe('needs_reupload')
  })

  // ── The boundary ──────────────────────────────────────────────────────────

  it('still accepts a replacement an hour before the window closes', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() + HOUR)
    await addReplacement(service, id, buyerUser.id)

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error).toBeNull()
  })

  it('refuses one an hour after it closes', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() - HOUR)
    await addReplacement(service, id, buyerUser.id)

    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error?.message).toMatch(/window/i)
  })

  // ── Parking ───────────────────────────────────────────────────────────────

  it('leaves an order alone an hour before its deadline', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() + HOUR)

    await buyer.rpc('park_overdue_orders')
    expect(await statusOf(service, id)).toBe('needs_reupload')
  })

  it('parks it an hour after', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() - HOUR)

    const { data, error } = await buyer.rpc('park_overdue_orders')
    expect(error).toBeNull()
    expect(data).toBeGreaterThanOrEqual(1)
    expect(await statusOf(service, id)).toBe('parked')
  })

  it('is safe to run twice — parking is not a second event', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() - HOUR)

    await buyer.rpc('park_overdue_orders')
    const { error } = await buyer.rpc('park_overdue_orders')

    expect(error).toBeNull()
    expect(await statusOf(service, id)).toBe('parked')
  })

  it('sweeps only what the caller may touch', async () => {
    const mine = await rejectedOrder(service, analyst, buyerUser.id)
    const theirs = await rejectedOrder(service, analyst, otherUser.id)
    await setDeadline(service, mine, Date.now() - HOUR)
    await setDeadline(service, theirs, Date.now() - HOUR)

    await buyer.rpc('park_overdue_orders')

    expect(await statusOf(service, mine)).toBe('parked')
    // A buyer loading their dashboard must not reach into another account's
    // orders, even to do something the clock had already decided.
    expect(await statusOf(service, theirs)).toBe('needs_reupload')

    // The analyst's sweep covers everything.
    await analyst.rpc('park_overdue_orders')
    expect(await statusOf(service, theirs)).toBe('parked')
  })

  it('does not let a buyer park an order early to skip the wait', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)
    await setDeadline(service, id, Date.now() + 5 * 24 * 3600_000)

    const { error } = await buyer.rpc('transition_order', { p_order_id: id, p_to: 'parked' })
    expect(error).not.toBeNull()
    expect(await statusOf(service, id)).toBe('needs_reupload')
  })

  it('lets the analyst park one early', async () => {
    const id = await rejectedOrder(service, analyst, buyerUser.id)

    const { error } = await analyst.rpc('transition_order', { p_order_id: id, p_to: 'parked' })
    expect(error).toBeNull()
    expect(await statusOf(service, id)).toBe('parked')
  })
})

// ── Fixtures ────────────────────────────────────────────────────────────────

/** A submitted order the analyst has sent back, with its original page attached. */
async function rejectedOrder(
  service: SupabaseClient,
  analyst: SupabaseClient,
  buyerId: string,
): Promise<string> {
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
  await addSample(service, id, buyerId, 1)

  const { error: submitError } = await service.rpc('submit_order', { p_order_id: id })
  if (submitError) throw submitError

  const { error: rejectError } = await analyst.rpc('transition_order', {
    p_order_id: id,
    p_to: 'needs_reupload',
    p_reason: REASON,
  })
  if (rejectError) throw rejectError

  return id
}

async function addReplacement(
  service: SupabaseClient,
  orderId: string,
  buyerId: string,
): Promise<void> {
  await addSample(service, orderId, buyerId, 2)
}

async function addSample(
  service: SupabaseClient,
  orderId: string,
  buyerId: string,
  version: number,
): Promise<void> {
  const { error } = await service.from('order_files').insert({
    order_id: orderId,
    uploader_id: buyerId,
    version,
    bucket_path: `${buyerId}/${orderId}/v${version}/${crypto.randomUUID()}.jpg`,
    file_name: `page-1-v${version}.jpg`,
    mime: 'image/jpeg',
    size_bytes: 200_000,
  })
  if (error) throw error
}

/** Moves the clock rather than waiting a fortnight for it. */
async function setDeadline(service: SupabaseClient, orderId: string, at: number): Promise<void> {
  const { error } = await service
    .from('orders')
    .update({ reupload_deadline: new Date(at).toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

async function statusOf(service: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await service.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}
