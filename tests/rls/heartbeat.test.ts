import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asMember, asService, pool } from '../support/pool'

/**
 * T24 — the keep-alive heartbeat.
 *
 * The write has to be reachable by the scheduled job and by nobody else, and
 * the row has to be readable by the analyst and nobody else. The second ping
 * returning the first one's time is what the cron route logs as
 * `previousBeatAt`, so it is asserted rather than assumed.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

describe.skipIf(!configured)('the heartbeat', () => {
  let service: SupabaseClient
  let analyst: SupabaseClient
  let buyer: SupabaseClient

  beforeAll(async () => {
    service = asService()
    await service.from('profiles').update({ role: 'admin' }).eq('id', pool().analyst.id)
    analyst = asMember(pool().analyst)
    buyer = asMember(pool().buyerA)
  })

  it('refuses a buyer the ping', async () => {
    const { error } = await buyer.rpc('keepalive_ping')
    expect(error).not.toBeNull()
  })

  it('refuses even the analyst the ping — it is the cron job only', async () => {
    const { error } = await analyst.rpc('keepalive_ping')
    expect(error).not.toBeNull()
  })

  it('refuses a buyer the read, by table and by function', async () => {
    const viaTable = await buyer.from('heartbeat').select('beat_at')
    // Either a permission error or an RLS-emptied result; never a row.
    expect(viaTable.data ?? []).toHaveLength(0)

    const viaRpc = await buyer.rpc('last_heartbeat')
    expect(viaRpc.error).not.toBeNull()
  })

  it('lets the service role ping twice, the second returning the first time', async () => {
    const first = await service.rpc('keepalive_ping')
    expect(first.error).toBeNull()

    const { data: row } = await service.from('heartbeat').select('beat_at').eq('id', 1).single()
    expect(row?.beat_at).toBeTruthy()

    const second = await service.rpc('keepalive_ping')
    expect(second.error).toBeNull()
    expect(new Date(second.data as string).getTime()).toBe(new Date(row!.beat_at).getTime())
  })

  it('keeps a single row however often it pings', async () => {
    await service.rpc('keepalive_ping')
    const { count } = await service.from('heartbeat').select('id', { count: 'exact', head: true })
    expect(count).toBe(1)
  })

  it('lets the analyst read the heartbeat', async () => {
    await service.rpc('keepalive_ping')
    const { data, error } = await analyst.rpc('last_heartbeat')
    expect(error).toBeNull()
    expect(data).toBeTruthy()

    const viaTable = await analyst.from('heartbeat').select('beat_at')
    expect(viaTable.data).toHaveLength(1)
  })

  it('has no client write path', async () => {
    const write = await analyst
      .from('heartbeat')
      .upsert({ id: 1, beat_at: new Date().toISOString() })
    expect(write.error).not.toBeNull()
  })
})
