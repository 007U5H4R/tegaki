import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { asAnonymous, asMember, asService, pool, type PoolMember } from '../support/pool'

/**
 * T01/D4 — the isolation guarantee.
 *
 * The PRD's fourth success criterion is that no handwriting sample or report
 * is reachable by anyone except its subject's account and the admin. This
 * suite is where that claim is actually tested, at the database level rather
 * than through the UI, because the UI is not the security boundary — RLS is.
 *
 * Two real users, each given their own publishable-key client carrying their
 * own JWT, and then asked to read the other's row. The service-role client
 * exists only to seed and assert behind RLS.
 *
 * The accounts come from the shared pool created once per run — see
 * `tests/support/pool.ts`. They are still two genuinely separate,
 * unprivileged users, which is the only property this suite depends on.
 */

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SECRET_KEY,
)

describe.skipIf(!configured)('profiles row level security', () => {
  let admin: SupabaseClient
  let aliceUser: PoolMember
  let bobUser: PoolMember
  let aliceClient: SupabaseClient
  let bobClient: SupabaseClient

  beforeAll(() => {
    admin = asService()
    // Created and torn down once for the whole run, in tests/global-setup.ts.
    aliceUser = pool().buyerA
    bobUser = pool().buyerB
    aliceClient = asMember(aliceUser)
    bobClient = asMember(bobUser)
  })

  it('creates exactly one profile per signup, via the trigger', async () => {
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, role')
      .in('id', [aliceUser.id, bobUser.id])

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
  })

  it('defaults a non-allowlisted account to buyer', async () => {
    const { data } = await admin.from('profiles').select('role').eq('id', aliceUser.id).single()
    expect(data?.role).toBe('buyer')
  })

  it('lets a user read their own profile', async () => {
    const { data, error } = await aliceClient
      .from('profiles')
      .select('id, email')
      .eq('id', aliceUser.id)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.email).toBe(aliceUser.email)
  })

  it("returns nothing when a user asks for someone else's profile", async () => {
    const { data, error } = await bobClient
      .from('profiles')
      .select('id, email')
      .eq('id', aliceUser.id)

    // RLS filters rather than errors: the row is invisible, not forbidden.
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('never leaks another row through an unfiltered select', async () => {
    // The query a careless client would write. It must still return only self.
    const { data } = await bobClient.from('profiles').select('id')

    expect(data).toHaveLength(1)
    expect(data?.[0]?.id).toBe(bobUser.id)
  })

  it("refuses to update someone else's profile", async () => {
    const { data } = await bobClient
      .from('profiles')
      .update({ full_name: 'overwritten by bob' })
      .eq('id', aliceUser.id)
      .select()

    expect(data ?? []).toHaveLength(0)

    const { data: after } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', aliceUser.id)
      .single()
    expect(after?.full_name).not.toBe('overwritten by bob')
  })

  it('refuses to let a user promote themselves to admin', async () => {
    // Blocked twice over: no policy permits it, and `role` is excluded from
    // the UPDATE grant, so the privilege does not exist either.
    const { error } = await aliceClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', aliceUser.id)

    expect(error).not.toBeNull()

    const { data: after } = await admin
      .from('profiles')
      .select('role')
      .eq('id', aliceUser.id)
      .single()
    expect(after?.role).toBe('buyer')
  })

  it('shows nothing at all to an anonymous client', async () => {
    const { data } = await asAnonymous().from('profiles').select('id')
    expect(data ?? []).toHaveLength(0)
  })
})
