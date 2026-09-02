import { config } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cleanStaleFixtures } from './support/fixtures'
import { POOL_PASSWORD, type FixturePool, type PoolMember } from './support/pool'

/**
 * Runs once per vitest run, before any suite.
 *
 * Two jobs. It sweeps whatever a previously interrupted run left behind, and
 * it creates the three fixture accounts every suite shares — see
 * `tests/support/pool.ts` for why sharing them matters. The access tokens are
 * handed to the workers with `provide`, because vitest runs each test file in
 * its own process and module state does not cross that line.
 */

declare module 'vitest' {
  interface ProvidedContext {
    pool: FixturePool
  }
}

type ProvidedContext = import('vitest').ProvidedContext

/**
 * Vitest hands globalSetup its `TestProject`, which carries `provide`. The
 * type is not exported under a stable name in v4, so it is described here by
 * the one member this file uses.
 */
type ProvidingContext = {
  provide: <K extends keyof ProvidedContext & string>(key: K, value: ProvidedContext[K]) => void
}

const RUN = Math.random().toString(36).slice(2, 8)

export async function setup({ provide }: ProvidingContext) {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env.test.local', override: true, quiet: true })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !publishableKey || !secretKey) {
    // The suites skip themselves when unconfigured; provide an empty pool so
    // `inject` still resolves rather than throwing in every file.
    provide('pool', {} as FixturePool)
    return
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const removed = await cleanStaleFixtures(admin)
  if (removed > 0) {
    console.log(`[fixtures] removed ${removed} stale test account(s) from a previous run`)
  }

  const [analyst, buyerA, buyerB] = await Promise.all([
    makeMember(admin, url, publishableKey, `pool-analyst-${RUN}@tegaki.test`),
    makeMember(admin, url, publishableKey, `pool-buyer-a-${RUN}@tegaki.test`),
    makeMember(admin, url, publishableKey, `pool-buyer-b-${RUN}@tegaki.test`),
  ])

  // The one place a role is set by hand. The real allowlist is compiled into
  // handle_new_user(), and the application has no path to promote anybody.
  const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', analyst.id)
  if (error) throw new Error(`could not promote the pool analyst: ${error.message}`)

  provide('pool', { analyst, buyerA, buyerB })

  return async () => {
    // Teardown. Storage objects go before the rows that point at them, which
    // is what `destroyMember` is careful about.
    for (const member of [analyst, buyerA, buyerB]) {
      await destroyMember(admin, member)
    }
  }
}

async function makeMember(
  admin: SupabaseClient,
  url: string,
  publishableKey: string,
  email: string,
): Promise<PoolMember> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: POOL_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`could not create ${email}: ${error.message}`)

  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signIn = await client.auth.signInWithPassword({ email, password: POOL_PASSWORD })
  if (signIn.error) throw new Error(`could not sign in ${email}: ${signIn.error.message}`)

  return {
    id: data.user!.id,
    email,
    accessToken: signIn.data.session!.access_token,
  }
}

async function destroyMember(admin: SupabaseClient, member: PoolMember): Promise<void> {
  const { data: files } = await admin
    .from('order_files')
    .select('bucket_path')
    .eq('uploader_id', member.id)
  const samplePaths = (files ?? []).map((f) => f.bucket_path as string)
  if (samplePaths.length) await admin.storage.from('samples').remove(samplePaths)

  const { data: reports } = await admin
    .from('reports')
    .select('bucket_path, orders!inner(buyer_id)')
    .eq('orders.buyer_id', member.id)
  const reportPaths = (reports ?? []).map((r) => r.bucket_path as string)
  if (reportPaths.length) await admin.storage.from('reports').remove(reportPaths)

  await admin.auth.admin.deleteUser(member.id)
}
