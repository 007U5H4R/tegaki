import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { inject } from 'vitest'

/**
 * Three accounts, created once for the whole run.
 *
 * Every suite used to create and sign in its own two or three users, which
 * came to roughly forty auth calls per verification. Two runs inside an hour
 * tripped GoTrue's rate limiter, and every affected suite then failed at
 * `beforeAll` with `AuthApiError: Request rate limit reached` — a cadence
 * problem that reads exactly like a catastrophic regression. It cost real
 * time three times before this existed.
 *
 * So the pool is created once in `tests/global-setup.ts`, signed in once, and
 * its access tokens handed to the workers. A worker builds a client by
 * putting the token in an Authorization header, which is what
 * `signInWithPassword` would have produced anyway: PostgREST, GoTrue and
 * Storage all read the JWT from that header, so `auth.uid()`, RLS and storage
 * policies behave identically. Six auth calls per run instead of forty.
 *
 * What this deliberately does NOT change: the accounts are real, distinct,
 * and unprivileged. Isolation is still proven between two genuinely separate
 * users, because that is the guarantee the suites exist to test.
 *
 * One difference to know about: a pool client has **no session object**, so
 * `client.auth.getSession()` returns null. Anything that needs the raw JWT —
 * a hand-built Storage request, for instance — takes it from the member's
 * `accessToken` instead, which is more direct anyway.
 */

export type PoolMember = {
  id: string
  email: string
  accessToken: string
}

export type FixturePool = {
  /** Promoted to `admin` in the profiles table. */
  analyst: PoolMember
  /** Two ordinary customers, for every "can A see B's data" question. */
  buyerA: PoolMember
  buyerB: PoolMember
}

export const POOL_PASSWORD = 'tegaki-pool-fixture-2f8c05'

/**
 * A client acting as one pool member.
 *
 * Note it carries the *publishable* key plus the member's JWT — exactly the
 * shape a browser has. Passing the secret key here instead would make every
 * test pass for the wrong reason.
 */
export function asMember(member: PoolMember): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${member.accessToken}` } },
    },
  )
}

/** The service-role client, for seeding and asserting behind RLS. */
export function asService(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** An unauthenticated client — the anonymous visitor. */
export function asAnonymous(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export function pool(): FixturePool {
  return inject('pool') as FixturePool
}
