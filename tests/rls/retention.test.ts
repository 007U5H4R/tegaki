import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'
import { RETENTION_DAYS } from '@/lib/retention/constants'
import { SAMPLES_BUCKET } from '@/lib/uploads/constants'

/**
 * T15 — the promise to destroy something.
 *
 * The policy page tells customers their handwriting is deleted 90 days after
 * their report is sent. Every other guarantee in this product is about
 * keeping data safe; this one is about getting rid of it, and it fails in the
 * opposite direction: silently, invisibly, by simply never running. Nobody
 * complains that their old data still exists.
 *
 * So the boundary is asserted from both sides rather than assumed, the job is
 * run twice to prove the second run is harmless, and the storage objects are
 * checked directly — a row deleted while the bytes remain in a private bucket
 * is not deletion, it is losing the receipt.
 *
 * The clock is moved by writing `delivered_at`, so 89, 90 and 91 days are
 * three fixtures rather than three months.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

const DAY = 86_400_000
const HOUR = 3_600_000
const SAMPLE_BYTES = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 9, 9, 9, 9])], {
  type: 'image/jpeg',
})

describe.skipIf(!configured)('the retention window', () => {
  let service: SupabaseClient
  let analyst: SupabaseClient
  let buyer: SupabaseClient
  let analystUser: PoolMember
  let buyerUser: PoolMember

  beforeAll(async () => {
    service = asService()
    analystUser = pool().analyst
    buyerUser = pool().buyerA
    await service.from('profiles').update({ role: 'admin' }).eq('id', analystUser.id)
    analyst = asMember(analystUser)
    buyer = asMember(buyerUser)
  })

  // ── The number itself ─────────────────────────────────────────────────────

  it('promises the same window the policy page states', async () => {
    const { data, error } = await service.rpc('retention_days')
    expect(error).toBeNull()
    // If these drift, the site promises one thing and the job does another,
    // and nothing else in the system would ever notice.
    expect(data, 'SQL retention_days() disagrees with RETENTION_DAYS').toBe(RETENTION_DAYS)
  })

  // ── The boundary ──────────────────────────────────────────────────────────

  it('deletes at 91 days and keeps at 89', async () => {
    const at89 = await deliveredOrder(service, buyerUser.id, 89)
    const at91 = await deliveredOrder(service, buyerUser.id, 91)

    const { data: due } = await service.rpc('expiring_sample_files', { p_days: null })
    const dueOrders = new Set((due ?? []).map((r: { order_id: string }) => r.order_id))
    expect(dueOrders.has(at91)).toBe(true)
    expect(dueOrders.has(at89)).toBe(false)

    await service.rpc('purge_expired_samples', { p_days: null })

    expect(await fileCount(service, at91)).toBe(0)
    expect(await fileCount(service, at89)).toBe(1)
  })

  it('turns over within the hour either side of the ninetieth day', async () => {
    // Written in hours rather than whole days on purpose.
    //
    // A fixture dated "exactly 90 days ago" is dated 90 days before the
    // moment it was built, and by the time the assertion runs a few seconds
    // have passed — so it is really 90 days and change, and whether it is due
    // depends on how slow the test was. An earlier version of this test
    // asserted such an order survives and failed for that reason, not
    // because anything was wrong.
    //
    // An hour either side is a boundary a clock can actually be held against,
    // and it pins the behaviour more tightly than whole days do.
    const justUnder = await deliveredOrder(service, buyerUser.id, 90, { plusMs: HOUR })
    const justOver = await deliveredOrder(service, buyerUser.id, 90, { plusMs: -HOUR })

    await service.rpc('purge_expired_samples', { p_days: null })

    expect(await fileCount(service, justUnder), 'destroyed an hour early').toBe(1)
    expect(await fileCount(service, justOver), 'kept an hour late').toBe(0)
  })

  it('records that a purge happened, so "deleted" is not confused with "never uploaded"', async () => {
    const id = await deliveredOrder(service, buyerUser.id, 120)

    const { data: before } = await service
      .from('orders')
      .select('samples_purged_at')
      .eq('id', id)
      .single()
    expect(before?.samples_purged_at).toBeNull()

    await service.rpc('purge_expired_samples', { p_days: null })

    const { data: after } = await service
      .from('orders')
      .select('samples_purged_at')
      .eq('id', id)
      .single()
    expect(after?.samples_purged_at).not.toBeNull()
  })

  it('leaves the report alone — that is the thing the customer keeps', async () => {
    const id = await deliveredOrder(service, buyerUser.id, 200, { withReport: true })

    await service.rpc('purge_expired_samples', { p_days: null })

    expect(await fileCount(service, id)).toBe(0)
    const { count } = await service
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', id)
    expect(count, 'the retention job destroyed the report').toBe(1)

    const { data: order } = await service.from('orders').select('status').eq('id', id).single()
    expect(order?.status, 'the order stopped being completed').toBe('completed')
  })

  it('never touches an order that was never delivered', async () => {
    // Completed long ago but never marked delivered: no clock was ever
    // started, so nothing may be destroyed. Holding a file too long is the
    // recoverable mistake; deleting one early is not.
    const id = await deliveredOrder(service, buyerUser.id, 300, {
      withReport: true,
      undelivered: true,
    })

    await service.rpc('purge_expired_samples', { p_days: null })
    expect(await fileCount(service, id)).toBe(1)

    // But it is counted, because a hole nobody counts is a hole nobody closes.
    const { data: backlog, error } = await service.rpc('undelivered_backlog', { p_days: null })
    expect(error).toBeNull()
    expect(backlog).toBeGreaterThanOrEqual(1)
  })

  // ── Running it twice ──────────────────────────────────────────────────────

  it('is safe to run twice — the second run deletes nothing and errors nothing', async () => {
    await deliveredOrder(service, buyerUser.id, 95)

    const { data: first, error: firstError } = await service.rpc('purge_expired_samples', {
      p_days: null,
    })
    expect(firstError).toBeNull()
    expect(row(first).files_deleted).toBeGreaterThanOrEqual(1)

    const { data: second, error: secondError } = await service.rpc('purge_expired_samples', {
      p_days: null,
    })
    expect(secondError).toBeNull()
    expect(row(second).files_deleted).toBe(0)
    expect(row(second).orders_purged).toBe(0)
  })

  // ── Storage, not just rows ────────────────────────────────────────────────

  it('destroys the bytes, not only the row that pointed at them', async () => {
    const { runRetention } = await import('@/lib/retention/purge')

    const id = await deliveredOrder(service, buyerUser.id, 100, { realObject: true })
    const { data: files } = await service
      .from('order_files')
      .select('bucket_path')
      .eq('order_id', id)
    const path = files![0]!.bucket_path as string

    // It is genuinely there before the job runs, or this test proves nothing.
    const { data: present } = await service.storage.from(SAMPLES_BUCKET).download(path)
    expect(present, 'fixture object was never uploaded').not.toBeNull()

    const report = await runRetention()
    expect(report.objectErrors).toEqual([])
    expect(report.objectsDeleted).toBeGreaterThanOrEqual(1)

    const { data: gone, error } = await service.storage.from(SAMPLES_BUCKET).download(path)
    expect(gone).toBeNull()
    expect(error, 'the object survived the retention job').not.toBeNull()
    expect(await fileCount(service, id)).toBe(0)
  })

  // ── Who may run it ────────────────────────────────────────────────────────

  it('does not let a buyer enumerate what is due for deletion', async () => {
    const { error } = await buyer.rpc('expiring_sample_files', { p_days: null })
    expect(error).not.toBeNull()
  })

  it('does not let a buyer purge anything', async () => {
    const id = await deliveredOrder(service, buyerUser.id, 400)

    const { error } = await buyer.rpc('purge_expired_samples', { p_days: null })
    expect(error).not.toBeNull()
    expect(await fileCount(service, id), 'a buyer triggered a global purge').toBe(1)
  })

  it('does not let a buyer erase their own order to dodge a record', async () => {
    // Erasure is honoured, but by the analyst, on request — not by whoever
    // can post to the endpoint. A self-serve delete button on a paid order is
    // also a way to remove the evidence of a dispute.
    const id = await deliveredOrder(service, buyerUser.id, 1)

    const { error } = await buyer.rpc('purge_order_data', { p_order_id: id, p_erase: true })
    expect(error).not.toBeNull()

    const { data } = await service.from('orders').select('id').eq('id', id).maybeSingle()
    expect(data?.id).toBe(id)
  })

  // ── Erasure on request ────────────────────────────────────────────────────

  it('redacts on request: the person goes, the record stays', async () => {
    const id = await deliveredOrder(service, buyerUser.id, 1, { withReport: true })

    const { data: paths, error } = await analyst.rpc('purge_order_data', {
      p_order_id: id,
      p_erase: false,
    })
    expect(error).toBeNull()
    // Both buckets are reported, because both hold something of theirs.
    expect((paths ?? []).map((p: { bucket: string }) => p.bucket).sort()).toEqual([
      'reports',
      'samples',
    ])

    const { data: order } = await service
      .from('orders')
      .select('id, full_name, email, phone, city, age, tier, samples_purged_at')
      .eq('id', id)
      .single()

    expect(order?.id, 'the row was deleted when only redaction was asked for').toBe(id)
    for (const field of ['full_name', 'email', 'phone', 'city', 'age'] as const) {
      expect(order?.[field], `${field} survived a redaction`).toBeNull()
    }
    // Kept deliberately: the books have to balance afterwards.
    expect(order?.tier).not.toBeNull()
    expect(order?.samples_purged_at).not.toBeNull()

    expect(await fileCount(service, id)).toBe(0)
  })

  it('erases on request: nothing survives, including the payment', async () => {
    const id = await deliveredOrder(service, buyerUser.id, 1, { withReport: true })

    const { error } = await analyst.rpc('purge_order_data', { p_order_id: id, p_erase: true })
    expect(error).toBeNull()

    for (const table of ['orders', 'order_files', 'payments', 'reports'] as const) {
      const column = table === 'orders' ? 'id' : 'order_id'
      const { count } = await service
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(column, id)
      expect(count, `${table} rows survived an erasure`).toBe(0)
    }
  })
})

// ── Fixtures ────────────────────────────────────────────────────────────────

function row(data: unknown): { orders_purged: number; files_deleted: number } {
  const first = Array.isArray(data) ? data[0] : data
  return first as { orders_purged: number; files_deleted: number }
}

async function fileCount(service: SupabaseClient, orderId: string): Promise<number> {
  const { count } = await service
    .from('order_files')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
  return count ?? 0
}

/**
 * A delivered order with one sample, its delivery dated `daysAgo`.
 *
 * `delivered_at` is written directly rather than via `mark_delivered()`,
 * which stamps `now()` — the whole point here is to sit an order on a
 * specific side of a boundary that is otherwise three months away.
 */
async function deliveredOrder(
  service: SupabaseClient,
  buyerId: string,
  daysAgo: number,
  opts: {
    withReport?: boolean
    undelivered?: boolean
    realObject?: boolean
    /** Nudges the delivery date later (positive) or earlier (negative). */
    plusMs?: number
  } = {},
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

  const path = `${buyerId}/${id}/v1/${crypto.randomUUID()}.jpg`

  if (opts.realObject) {
    const { error: uploadError } = await service.storage
      .from(SAMPLES_BUCKET)
      .upload(path, SAMPLE_BYTES, { contentType: 'image/jpeg' })
    if (uploadError) throw new Error(`fixture upload failed: ${uploadError.message}`)
  }

  const { error: fileError } = await service.from('order_files').insert({
    order_id: id,
    uploader_id: buyerId,
    version: 1,
    bucket_path: path,
    file_name: 'page-1.jpg',
    mime: 'image/jpeg',
    size_bytes: 200_000,
  })
  if (fileError) throw fileError

  const { error: submitError } = await service.rpc('submit_order', { p_order_id: id })
  if (submitError) throw submitError

  await service.rpc('transition_order', { p_order_id: id, p_to: 'analysis_in_progress' })
  await service.rpc('transition_order', { p_order_id: id, p_to: 'report_generating' })

  if (opts.withReport) {
    const { error: reportError } = await service.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
      p_file_name: 'report.pdf',
      p_size_bytes: 120_000,
      p_validated: true,
    })
    if (reportError) throw reportError
  } else {
    await service.from('orders').update({ status: 'completed' }).eq('id', id)
  }

  const when = new Date(Date.now() - daysAgo * DAY + (opts.plusMs ?? 0)).toISOString()
  if (!opts.undelivered) {
    await service.from('orders').update({ delivered_at: when }).eq('id', id)
  }
  if (opts.withReport) {
    await service.from('reports').update({ created_at: when }).eq('order_id', id)
  }

  return id
}
