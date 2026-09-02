import type { BrowserContext } from '@playwright/test'
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

/**
 * Signing a browser in, without Google.
 *
 * Every authenticated screen in Tegaki sits behind Google OAuth, and Google's
 * consent screen cannot be driven from an automated browser. Left there, the
 * entire signed-in half of the product — the wizard, the dashboard, the whole
 * customer loop — would never be exercised end to end.
 *
 * So the browser is handed a session directly: a throwaway email/password user
 * is created with the service key, signed in through supabase-js, and the
 * resulting session written into the cookie `@supabase/ssr` reads. Auth is not
 * what these tests are about; what happens *after* signing in is.
 *
 * The cookie format is `base64-` + base64url(JSON) chunked at 3180 characters,
 * matching @supabase/ssr's own writer. If a future version changes it, these
 * tests fail by landing back on /sign-in rather than passing quietly.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

export const supabaseConfigured = Boolean(url && publishableKey && secretKey)

const MAX_CHUNK_SIZE = 3180
const PASSWORD = 'tegaki-e2e-fixture-0f41ad'

export function adminClient(): SupabaseClient {
  return createClient(url!, secretKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** `sb-<project-ref>-auth-token`, the default storage key for this project. */
function storageKey(): string {
  const ref = new URL(url!).hostname.split('.')[0]
  return `sb-${ref}-auth-token`
}

export async function createTestUser(
  admin: SupabaseClient,
  email: string,
): Promise<{ user: User; session: Session }> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`could not create the test user: ${error.message}`)

  const client = createClient(url!, publishableKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (signIn.error) throw new Error(`could not sign the test user in: ${signIn.error.message}`)

  return { user: data.user!, session: signIn.data.session! }
}

/**
 * Promote a fixture account to analyst.
 *
 * The real allowlist is compiled into `handle_new_user()`, so a throwaway
 * account is always a buyer. This is the only place a role is set by hand,
 * and deliberately not something the application itself can do.
 */
export async function promoteToAdmin(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', userId)
  if (error) throw new Error(`could not promote the test admin: ${error.message}`)
}

export async function applySession(
  context: BrowserContext,
  baseURL: string,
  session: Session,
): Promise<void> {
  const key = storageKey()
  const encoded = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`

  // base64url uses only URL-safe characters, so encodeURIComponent is a no-op
  // here and the chunk boundaries are plain slices — the escape-sequence
  // handling in @supabase/ssr's chunker never comes into play.
  const chunks: { name: string; value: string }[] =
    encoded.length <= MAX_CHUNK_SIZE
      ? [{ name: key, value: encoded }]
      : Array.from({ length: Math.ceil(encoded.length / MAX_CHUNK_SIZE) }, (_, i) => ({
          name: `${key}.${i}`,
          value: encoded.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE),
        }))

  // `url` and `path` are mutually exclusive in Playwright; the origin's own
  // path (`/`) is what we want anyway.
  await context.addCookies(
    chunks.map((chunk) => ({ ...chunk, url: baseURL, sameSite: 'Lax' as const })),
  )
}

/**
 * Removes the user, which cascades to their profile, orders and file rows.
 * Storage objects are not covered by that cascade, so they go first —
 * an orphaned handwriting sample is exactly what the retention rules exist
 * to prevent, test data included.
 */
export async function destroyTestUser(admin: SupabaseClient, user: User | null): Promise<void> {
  if (!user?.id) return

  const { data: files } = await admin
    .from('order_files')
    .select('bucket_path')
    .eq('uploader_id', user.id)

  const paths = (files ?? []).map((f) => f.bucket_path as string)
  if (paths.length) await admin.storage.from('samples').remove(paths)

  // Reports live under `reports/{order_id}/`, and the order rows are about to
  // cascade away with the user — so the objects have to go first or nothing
  // will know they were ever connected to anybody.
  const { data: reports } = await admin
    .from('reports')
    .select('bucket_path, orders!inner(buyer_id)')
    .eq('orders.buyer_id', user.id)

  const reportPaths = (reports ?? []).map((r) => r.bucket_path as string)
  if (reportPaths.length) await admin.storage.from('reports').remove(reportPaths)

  await admin.auth.admin.deleteUser(user.id)
}
