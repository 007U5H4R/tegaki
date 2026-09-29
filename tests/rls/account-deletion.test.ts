import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Deleting an account has to actually work.
 *
 * This exists because it did not. `order_files.uploader_id` was created
 * without an ON DELETE rule, so the moment somebody uploaded a sample their
 * account became undeletable — the API answered "Database error deleting
 * user" and nothing said why.
 *
 * It surfaced while clearing test accounts, which is a cheap place to find
 * it. The expensive places were T15, where deleting data on request is the
 * whole ticket, and a real customer asking to be forgotten.
 *
 * T15 will extend this file with the retention window; the guarantee it
 * builds on is the one asserted here.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const configured = Boolean(url && secretKey)

const runId = Math.random().toString(36).slice(2, 10)

describe.skipIf(!configured)('deleting an account', () => {
  let admin: SupabaseClient
  let user: User | null = null

  beforeAll(() => {
    admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    if (user?.id) await admin.auth.admin.deleteUser(user.id)
  })

  it('takes the whole trail with it, even after a sample was uploaded', async () => {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: `delete-me-${runId}@tegaki.test`,
      password: `t-${crypto.randomUUID()}`, // per run, never a fixed secret in the repo
      email_confirm: true,
    })
    if (createError) throw createError
    user = created.user!

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({ buyer_id: user.id, tier: 'core' })
      .select('id')
      .single()
    if (orderError) throw orderError

    const { error: fileError } = await admin.from('order_files').insert({
      order_id: order!.id,
      uploader_id: user.id,
      version: 1,
      bucket_path: `${user.id}/${order!.id}/v1/${crypto.randomUUID()}.jpg`,
      file_name: 'page-1.jpg',
      mime: 'image/jpeg',
      size_bytes: 120_000,
    })
    if (fileError) throw fileError

    await admin.rpc('submit_order', { p_order_id: order!.id })

    // The act itself. Before the cascade fix this failed with a bare 500.
    const { error } = await admin.auth.admin.deleteUser(user.id)
    expect(error, 'an account with an uploaded sample must still be deletable').toBeNull()

    const orderId = order!.id
    for (const table of ['orders', 'order_files', 'payments'] as const) {
      const column = table === 'orders' ? 'id' : 'order_id'
      const { count } = await admin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(column, orderId)
      expect(count, `${table} rows survived the account`).toBe(0)
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    expect(profile).toBeNull()

    user = null
  })
})
