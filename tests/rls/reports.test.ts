import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { reportDownloadName } from '@/lib/reports/constants'

/**
 * T09 — the delivered report, and who may read it.
 *
 * This bucket holds a personality assessment with somebody's name on it, so
 * it is attacked the same way the samples were: as another signed-in
 * customer, as an anonymous client, and by a caller who knows the exact
 * object path.
 *
 * The path is the boundary, as it is for samples: an object under
 * `reports/{order_id}/` is readable by whoever owns that order and by the
 * analyst, and by nobody else. The app still hands customers a 60-second
 * signed link rather than a permanent one, so a forwarded URL goes stale.
 *
 * The other rule under test is the one the PRD is strictest about: nothing
 * unvalidated reaches a customer. `validated_at` is not nullable and only
 * `attach_report()` writes the row, so an unvalidated report cannot exist.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY
const configured = Boolean(url && publishableKey && secretKey)

const password = 'tegaki-reports-fixture-9c14ef'
const runId = Math.random().toString(36).slice(2, 10)
const analystEmail = `rep-analyst-${runId}@tegaki.test`
const buyerEmail = `rep-buyer-${runId}@tegaki.test`
const otherEmail = `rep-other-${runId}@tegaki.test`

const BUCKET = 'reports'
const A_PDF = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a])], {
  type: 'application/pdf',
})

describe.skipIf(!configured)('the delivered report', () => {
  let service: SupabaseClient
  let analyst: SupabaseClient
  let buyer: SupabaseClient
  let other: SupabaseClient
  let anon: SupabaseClient
  let analystUser: User
  let buyerUser: User
  let otherUser: User

  beforeAll(async () => {
    service = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    analystUser = await makeUser(service, analystEmail)
    buyerUser = await makeUser(service, buyerEmail)
    otherUser = await makeUser(service, otherEmail)
    await service.from('profiles').update({ role: 'admin' }).eq('id', analystUser.id)

    analyst = await signIn(analystEmail)
    buyer = await signIn(buyerEmail)
    other = await signIn(otherEmail)
    anon = createClient(url!, publishableKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    for (const u of [analystUser, buyerUser, otherUser]) {
      if (u?.id) await service.auth.admin.deleteUser(u.id)
    }
  })

  // ── The validation gate ───────────────────────────────────────────────────

  it('refuses to attach a report without the attestation', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)
    const path = `${id}/${crypto.randomUUID()}.pdf`

    for (const validated of [false, null]) {
      const { error } = await analyst.rpc('attach_report', {
        p_order_id: id,
        p_bucket_path: path,
        p_file_name: 'report.pdf',
        p_size_bytes: 1024,
        p_validated: validated,
      })
      expect(error?.message, `validated=${validated}`).toMatch(/validated/i)
    }

    expect(await statusOf(service, id)).toBe('report_generating')
    expect(await reportCount(service, id)).toBe(0)
  })

  it('stamps when the analyst confirmed it, and completes the order in the same breath', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)
    const path = `${id}/${crypto.randomUUID()}.pdf`

    const { error } = await analyst.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: path,
      p_file_name: 'report.pdf',
      p_size_bytes: 2048,
      p_validated: true,
    })
    expect(error).toBeNull()

    const { data } = await service
      .from('reports')
      .select('validated_at, uploaded_by, file_name')
      .eq('order_id', id)
      .single()

    expect(data?.validated_at).not.toBeNull()
    expect(data?.uploaded_by).toBe(analystUser.id)
    expect(await statusOf(service, id)).toBe('completed')
  })

  // ── When a report may be attached ─────────────────────────────────────────

  it('refuses to attach one to an order that is not in production', async () => {
    const id = await submittedOrder(service, buyerUser.id) // sample_under_review

    const { error } = await analyst.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
      p_file_name: 'report.pdf',
      p_size_bytes: 1024,
      p_validated: true,
    })

    expect(error?.message).toMatch(/report production/i)
    expect(await reportCount(service, id)).toBe(0)
  })

  it('refuses a second report for the same order', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)
    await analyst.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
      p_file_name: 'report.pdf',
      p_size_bytes: 1024,
      p_validated: true,
    })

    const { error } = await analyst.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
      p_file_name: 'report-v2.pdf',
      p_size_bytes: 1024,
      p_validated: true,
    })

    expect(error).not.toBeNull()
    expect(await reportCount(service, id)).toBe(1)
  })

  it('does not let a customer attach a report to their own order', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)

    const { error } = await buyer.rpc('attach_report', {
      p_order_id: id,
      p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
      p_file_name: 'i-wrote-this-myself.pdf',
      p_size_bytes: 1024,
      p_validated: true,
    })

    expect(error?.message).toMatch(/analyst/i)
    expect(await reportCount(service, id)).toBe(0)
    expect(await statusOf(service, id)).toBe('report_generating')
  })

  // ── Who can read a report row ─────────────────────────────────────────────

  it('lets the buyer read the row for their own report', async () => {
    const id = await deliveredOrder(service, analyst, buyerUser.id)

    const { data } = await buyer.from('reports').select('file_name').eq('order_id', id)
    expect(data).toHaveLength(1)
  })

  it('does not let another customer read it, even knowing the order id', async () => {
    const id = await deliveredOrder(service, analyst, buyerUser.id)

    const { data } = await other.from('reports').select('file_name').eq('order_id', id)
    expect(data ?? []).toHaveLength(0)
  })

  it('shows an anonymous visitor nothing', async () => {
    await deliveredOrder(service, analyst, buyerUser.id)

    const { data } = await anon.from('reports').select('id')
    expect(data ?? []).toHaveLength(0)
  })

  it('does not let a customer forge a report row', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)

    const { error } = await buyer.from('reports').insert({
      order_id: id,
      bucket_path: `${id}/forged.pdf`,
      file_name: 'forged.pdf',
      size_bytes: 10,
      validated_at: new Date().toISOString(),
      uploaded_by: buyerUser.id,
    })

    expect(error).not.toBeNull()
    expect(await reportCount(service, id)).toBe(0)
  })

  // ── Who can read the bytes ────────────────────────────────────────────────

  it('keeps the bucket shut to everyone but the analyst', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)
    const path = `${id}/${crypto.randomUUID()}.pdf`

    const upload = await analyst.storage.from(BUCKET).upload(path, A_PDF, {
      contentType: 'application/pdf',
    })
    expect(upload.error, 'the analyst may write').toBeNull()

    // The owner may read their own report — the object's first path segment
    // names an order they own, and that is the whole boundary.
    const asBuyer = await buyer.storage.from(BUCKET).download(path)
    expect(asBuyer.error, 'the owner may read their own report').toBeNull()

    // And can therefore mint the link the download button uses.
    const signed = await buyer.storage.from(BUCKET).createSignedUrl(path, 60)
    expect(signed.error, 'the owner may sign their own report').toBeNull()

    const asOther = await other.storage.from(BUCKET).download(path)
    expect(asOther.error, 'a stranger must not read it either').not.toBeNull()

    const asAnon = await anon.storage.from(BUCKET).download(path)
    expect(asAnon.error, 'anonymous must not read it').not.toBeNull()

    const asAnalyst = await analyst.storage.from(BUCKET).download(path)
    expect(asAnalyst.error, 'the analyst may read').toBeNull()

    await service.storage.from(BUCKET).remove([path])
  })

  it('does not let a customer upload into the reports bucket', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)

    const { error } = await buyer.storage
      .from(BUCKET)
      .upload(`${id}/${crypto.randomUUID()}.pdf`, A_PDF, { contentType: 'application/pdf' })

    expect(error).not.toBeNull()
  })

  it('hands out a link that works, then dies', async () => {
    const id = await orderInProduction(service, analyst, buyerUser.id)
    const path = `${id}/${crypto.randomUUID()}.pdf`
    await analyst.storage.from(BUCKET).upload(path, A_PDF, { contentType: 'application/pdf' })

    // Two links rather than one. Signing with a 1-second TTL and then
    // asserting the *fresh* fetch works is a race the network usually wins:
    // the round trip alone outlived the link. So freshness is proven at the
    // real 60-second TTL the action uses, and expiry with its own short one.
    const live = await analyst.storage.from(BUCKET).createSignedUrl(path, 60)
    const fresh = await fetch(live.data!.signedUrl)
    expect(fresh.ok, 'a fresh link works').toBe(true)
    expect(await fresh.text()).toContain('%PDF')

    const brief = await analyst.storage.from(BUCKET).createSignedUrl(path, 1)
    await new Promise((resolve) => setTimeout(resolve, 2500))
    const stale = await fetch(brief.data!.signedUrl)
    expect(stale.ok, 'an expired link is dead').toBe(false)

    await service.storage.from(BUCKET).remove([path])
  })
})

describe('the download filename', () => {
  it('says whose report it is, how deep, and when — not "report.pdf"', () => {
    expect(
      reportDownloadName({
        subject: 'Asha Menon',
        tierName: 'Core Personality',
        date: new Date('2026-09-02T00:00:00Z'),
      }),
    ).toBe('Tegaki-Asha-Menon-Core-Personality-2026-09-02.pdf')
  })

  it('survives a name with punctuation or non-Latin characters', () => {
    const name = reportDownloadName({
      subject: "N'Golo  Kanté/../etc",
      tierName: 'Express Insight',
      date: new Date('2026-09-02T00:00:00Z'),
    })
    expect(name).toMatch(/^Tegaki-[\w-]+-Express-Insight-2026-09-02\.pdf$/)
    // A filename is not a path: nothing that could climb out of a folder.
    expect(name).not.toContain('/')
    expect(name).not.toContain('..')
  })

  it('still produces something usable when the subject is missing', () => {
    expect(
      reportDownloadName({ subject: null, tierName: null, date: new Date('2026-09-02T00:00:00Z') }),
    ).toBe('Tegaki-2026-09-02.pdf')
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

async function submittedOrder(service: SupabaseClient, buyerId: string): Promise<string> {
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

  const { error: submitError } = await service.rpc('submit_order', { p_order_id: id })
  if (submitError) throw submitError
  return id
}

/** Approved, then moved into report production — where an upload is legal. */
async function orderInProduction(
  service: SupabaseClient,
  analyst: SupabaseClient,
  buyerId: string,
): Promise<string> {
  const id = await submittedOrder(service, buyerId)
  for (const to of ['analysis_in_progress', 'report_generating']) {
    const { error } = await analyst.rpc('transition_order', { p_order_id: id, p_to: to })
    if (error) throw error
  }
  return id
}

async function deliveredOrder(
  service: SupabaseClient,
  analyst: SupabaseClient,
  buyerId: string,
): Promise<string> {
  const id = await orderInProduction(service, analyst, buyerId)
  const { error } = await analyst.rpc('attach_report', {
    p_order_id: id,
    p_bucket_path: `${id}/${crypto.randomUUID()}.pdf`,
    p_file_name: 'report.pdf',
    p_size_bytes: 4096,
    p_validated: true,
  })
  if (error) throw error
  return id
}

async function reportCount(service: SupabaseClient, orderId: string): Promise<number> {
  const { count } = await service
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
  return count ?? 0
}

async function statusOf(service: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await service.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}
