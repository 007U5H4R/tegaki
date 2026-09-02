import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asAnonymous, asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * T04 — the promise this whole product rests on.
 *
 * Solution-PRD §2.4: "Zero handwriting samples or reports accessible to
 * anyone except the subject's account and admin."
 *
 * Everything else in the build is ordinary CRUD. This is the part where a
 * mistake means a stranger reads someone's handwriting, so the tests below
 * attack the bucket from every angle available to an attacker who knows the
 * exact object path: as another signed-in user, as an anonymous client, and
 * with an expired link.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const configured = Boolean(
  url && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY,
)

const BUCKET = 'samples'

const SAMPLE_BYTES = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 4])], {
  type: 'image/jpeg',
})

describe.skipIf(!configured)('handwriting samples are private', () => {
  let admin: SupabaseClient
  let alice: SupabaseClient
  let bob: SupabaseClient
  let aliceUser: PoolMember
  let bobUser: PoolMember
  let aliceOrder: string
  let alicePath: string

  beforeAll(async () => {
    admin = asService()

    aliceUser = pool().buyerA
    bobUser = pool().buyerB
    alice = asMember(aliceUser)
    bob = asMember(bobUser)

    aliceOrder = await newDraft(alice, aliceUser.id)
    alicePath = `${aliceUser.id}/${aliceOrder}/v1/${crypto.randomUUID()}.jpg`

    const { error } = await alice.storage.from(BUCKET).upload(alicePath, SAMPLE_BYTES, {
      contentType: 'image/jpeg',
    })
    if (error) throw new Error(`fixture upload failed: ${error.message}`)
  })

  // The object is this suite's to clean up; the accounts are the run's, and
  // are torn down in tests/global-setup.ts.
  afterAll(async () => {
    await admin.storage.from(BUCKET).remove([alicePath])
  })

  it('lets the owner read their own sample', async () => {
    const { data, error } = await alice.storage.from(BUCKET).download(alicePath)
    expect(error).toBeNull()
    expect(await data?.size).toBeGreaterThan(0)
  })

  it('refuses another signed-in user who knows the exact path', async () => {
    const { data, error } = await bob.storage.from(BUCKET).download(alicePath)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it('refuses another user a signed URL for it', async () => {
    // Signing is itself an authorised act — otherwise anyone could mint a
    // working link for a file they cannot read directly.
    const { data, error } = await bob.storage.from(BUCKET).createSignedUrl(alicePath, 60)
    expect(data?.signedUrl ?? null).toBeNull()
    expect(error).not.toBeNull()
  })

  it("hides the owner's folder from another user's listing", async () => {
    const { data } = await bob.storage.from(BUCKET).list(`${aliceUser.id}/${aliceOrder}/v1`)
    expect(data ?? []).toHaveLength(0)
  })

  it('refuses an anonymous client entirely', async () => {
    const anon = asAnonymous()

    const { error: downloadError } = await anon.storage.from(BUCKET).download(alicePath)
    expect(downloadError).not.toBeNull()

    const { data: signed } = await anon.storage.from(BUCKET).createSignedUrl(alicePath, 60)
    expect(signed?.signedUrl ?? null).toBeNull()
  })

  it('serves the object over a signed URL, and stops once it expires', async () => {
    const { data } = await alice.storage.from(BUCKET).createSignedUrl(alicePath, 1)
    expect(data?.signedUrl).toBeTruthy()

    const fresh = await fetch(data!.signedUrl)
    expect(fresh.status).toBe(200)

    // A leaked link must not be a permanent key to somebody's handwriting.
    await new Promise((r) => setTimeout(r, 2500))
    const stale = await fetch(data!.signedUrl)
    expect(stale.status).toBeGreaterThanOrEqual(400)
  })

  it('refuses an upload into another user’s folder', async () => {
    const forged = `${aliceUser.id}/${aliceOrder}/v1/${crypto.randomUUID()}.jpg`
    const { error } = await bob.storage.from(BUCKET).upload(forged, SAMPLE_BYTES, {
      contentType: 'image/jpeg',
    })
    expect(error).not.toBeNull()
  })

  it('refuses an upload naming an order the uploader does not own', async () => {
    // Right first segment, wrong order: the policy checks both.
    const bobOwnFolderOthersOrder = `${bobUser.id}/${aliceOrder}/v1/${crypto.randomUUID()}.jpg`
    const { error } = await bob.storage.from(BUCKET).upload(bobOwnFolderOthersOrder, SAMPLE_BYTES, {
      contentType: 'image/jpeg',
    })
    expect(error).not.toBeNull()
  })

  it('refuses uploads once the order is no longer accepting them', async () => {
    const order = await newDraft(alice, aliceUser.id)
    await admin.rpc('transition_order', { p_order_id: order, p_to: 'sample_under_review' })

    const path = `${aliceUser.id}/${order}/v1/${crypto.randomUUID()}.jpg`
    const { error } = await alice.storage.from(BUCKET).upload(path, SAMPLE_BYTES, {
      contentType: 'image/jpeg',
    })
    expect(error, 'a submitted order must not accept new bytes').not.toBeNull()
  })

  it('accepts an upload posted the way the browser client posts it', async () => {
    // uploadSample() builds this URL and these headers by hand, because
    // supabase-js offers no progress callback. A typo there would only ever
    // surface in a browser, so the same shape is exercised here.
    // The token comes from the pool member rather than alice.auth.getSession():
    // a pool client carries its JWT in an Authorization header and has no
    // session object, which is the one thing that differs from signing in.
    expect(aliceUser.accessToken).toBeTruthy()

    const order = await newDraft(alice, aliceUser.id)
    const path = `${aliceUser.id}/${order}/v1/${crypto.randomUUID()}.jpg`

    const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aliceUser.accessToken}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false',
      },
      body: SAMPLE_BYTES,
    })

    expect(response.status, await response.text()).toBeLessThan(300)
    await admin.storage.from(BUCKET).remove([path])
  })

  it('refuses that same hand-built request without a token', async () => {
    const path = `${aliceUser.id}/${aliceOrder}/v1/${crypto.randomUUID()}.jpg`

    const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: SAMPLE_BYTES,
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  it("hides another user's file rows", async () => {
    await alice.from('order_files').insert({
      order_id: aliceOrder,
      uploader_id: aliceUser.id,
      version: 1,
      bucket_path: alicePath,
      file_name: 'sample.jpg',
      mime: 'image/jpeg',
      size_bytes: 8,
    })

    const { data } = await bob.from('order_files').select('id').eq('order_id', aliceOrder)
    expect(data ?? []).toHaveLength(0)

    const { data: own } = await alice.from('order_files').select('id').eq('order_id', aliceOrder)
    expect(own?.length ?? 0).toBeGreaterThan(0)
  })

  it('refuses a file row attached to an order the caller does not own', async () => {
    const { error } = await bob.from('order_files').insert({
      order_id: aliceOrder,
      uploader_id: bobUser.id,
      version: 1,
      bucket_path: `${bobUser.id}/${aliceOrder}/v9/${crypto.randomUUID()}.jpg`,
      file_name: 'forged.jpg',
      mime: 'image/jpeg',
      size_bytes: 8,
    })
    expect(error).not.toBeNull()
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
