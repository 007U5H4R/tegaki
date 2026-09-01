import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * T01/D4 — the isolation guarantee.
 *
 * The PRD's fourth success criterion is that no handwriting sample or report
 * is reachable by anyone except its subject's account and the admin. This
 * suite is where that claim is actually tested, at the database level rather
 * than through the UI, because the UI is not the security boundary — RLS is.
 *
 * Two real users are created against the live project, each given their own
 * anon-key client carrying their own JWT, and then asked to read the other's
 * row. The service-role client exists only to create and destroy fixtures.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

const configured = Boolean(url && publishableKey && secretKey)
const password = 'tegaki-rls-fixture-9f2c41'

// A unique run id keeps parallel or repeated runs from colliding, and makes
// orphaned fixtures obvious if teardown ever fails.
const runId = Math.random().toString(36).slice(2, 10)
const alice = `rls-alice-${runId}@tegaki.test`
const bob = `rls-bob-${runId}@tegaki.test`

describe.skipIf(!configured)('profiles row level security', () => {
  let admin: SupabaseClient
  let aliceUser: User
  let bobUser: User
  let aliceClient: SupabaseClient
  let bobClient: SupabaseClient

  beforeAll(async () => {
    admin = createClient(url!, secretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    aliceUser = await createConfirmedUser(admin, alice)
    bobUser = await createConfirmedUser(admin, bob)

    aliceClient = await signIn(url!, publishableKey!, alice)
    bobClient = await signIn(url!, publishableKey!, bob)
  })

  afterAll(async () => {
    // Always clean up: leaving fixture users behind would inflate the
    // project's user count and confuse the next run.
    for (const user of [aliceUser, bobUser]) {
      if (user?.id) await admin.auth.admin.deleteUser(user.id)
    }
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
    expect(data?.[0]?.email).toBe(alice)
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
    const anon = createClient(url!, publishableKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await anon.from('profiles').select('id')
    expect(data ?? []).toHaveLength(0)
  })
})

async function createConfirmedUser(admin: SupabaseClient, email: string): Promise<User> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user) throw new Error(`No user returned for ${email}`)
  return data.user
}

async function signIn(projectUrl: string, key: string, email: string): Promise<SupabaseClient> {
  const client = createClient(projectUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}
