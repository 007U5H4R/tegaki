import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * Review-gate hardening (20260902200000): the two ways a buyer could get an
 * order into the queue without going through submit_order().
 */
const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)
const BYTES = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 3, 3, 3, 3])], {
  type: 'image/jpeg',
})

describe.skipIf(!configured)('getting into the queue', () => {
  let service: SupabaseClient
  let buyer: SupabaseClient
  let buyerUser: PoolMember

  beforeAll(() => {
    service = asService()
    buyerUser = pool().buyerA
    buyer = asMember(buyerUser)
  })

  async function draft(): Promise<string> {
    const { data, error } = await buyer
      .from('orders')
      .insert({ buyer_id: buyerUser.id })
      .select('id')
      .single()
    if (error) throw error
    return data!.id as string
  }

  it('refuses the owner walking draft → under review by hand', async () => {
    const id = await draft()
    const { error } = await buyer.rpc('transition_order', {
      p_order_id: id,
      p_to: 'sample_under_review',
    })
    expect(error, 'a buyer skipped submit_order()').not.toBeNull()
    const { data } = await service.from('orders').select('status').eq('id', id).single()
    expect(data?.status).toBe('draft')
  })

  it('refuses a file row with nothing behind it', async () => {
    const id = await draft()
    const { error } = await buyer.from('order_files').insert({
      order_id: id,
      uploader_id: buyerUser.id,
      version: 1,
      bucket_path: `${buyerUser.id}/${id}/v1/${crypto.randomUUID()}.jpg`,
      file_name: 'ghost.jpg',
      mime: 'image/jpeg',
      size_bytes: 1,
    })
    expect(error, 'a row was recorded for an object that does not exist').not.toBeNull()
  })

  it('refuses a file row pointing outside the caller’s own folder', async () => {
    const id = await draft()
    const { error } = await buyer.from('order_files').insert({
      order_id: id,
      uploader_id: buyerUser.id,
      version: 1,
      bucket_path: `${pool().buyerB.id}/${id}/v1/${crypto.randomUUID()}.jpg`,
      file_name: 'forged.jpg',
      mime: 'image/jpeg',
      size_bytes: 1,
    })
    expect(error).not.toBeNull()
  })

  it('refuses a file row that names its own id or timestamp', async () => {
    const id = await draft()
    const { error } = await buyer.from('order_files').insert({
      order_id: id,
      uploader_id: buyerUser.id,
      version: 1,
      bucket_path: `${buyerUser.id}/${id}/v1/x.jpg`,
      file_name: 'x.jpg',
      mime: 'image/jpeg',
      size_bytes: 1,
      created_at: '2020-01-01T00:00:00Z',
    })
    expect(error).not.toBeNull()
  })

  it('still records a real upload, and still submits through the front door', async () => {
    const id = await draft()
    const path = `${buyerUser.id}/${id}/v1/${crypto.randomUUID()}.jpg`
    const { error: up } = await buyer.storage
      .from('samples')
      .upload(path, BYTES, { contentType: 'image/jpeg' })
    expect(up).toBeNull()

    const { error: row } = await buyer.from('order_files').insert({
      order_id: id,
      uploader_id: buyerUser.id,
      version: 1,
      bucket_path: path,
      file_name: 'page-1.jpg',
      mime: 'image/jpeg',
      size_bytes: 8,
    })
    expect(row).toBeNull()

    await service
      .from('orders')
      .update({
        tier: 'core',
        wizard_stage: 4,
        full_name: 'Asha Menon',
        age: 34,
        city: 'Kochi',
        country: 'India',
        email: 'asha@example.com',
        phone: '+91 98765 43210',
      })
      .eq('id', id)

    const { error: submit } = await buyer.rpc('submit_order', { p_order_id: id })
    expect(submit).toBeNull()
    const { data } = await service.from('orders').select('status').eq('id', id).single()
    expect(data?.status).toBe('sample_under_review')
    await service.storage.from('samples').remove([path])
  })
})
