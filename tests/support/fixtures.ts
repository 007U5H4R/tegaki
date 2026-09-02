import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Sweeping up after test runs that did not finish.
 *
 * Every suite deletes its own users in `afterAll`, but a run that is
 * interrupted — a failing Playwright spec, a cancelled vitest — never gets
 * there, and the leftovers accumulate in a real Supabase project. That is
 * worse than untidy: they are live accounts whose passwords are in source
 * control, and by T07 they would fill the admin queue with orders nobody
 * placed.
 *
 * So each run sweeps before it starts. Only addresses in the reserved
 * fixture domain are touched, and only ones old enough that they cannot
 * belong to a run happening right now.
 */

export const FIXTURE_DOMAIN = '@tegaki.test'

/** Old enough that no live run could still be using it. */
const STALE_AFTER_MS = 60 * 60 * 1000

export function isFixtureEmail(email: string | undefined): boolean {
  return Boolean(email?.endsWith(FIXTURE_DOMAIN))
}

export async function cleanStaleFixtures(client?: SupabaseClient): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) return 0

  const admin =
    client ??
    createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data) return 0

  const cutoff = Date.now() - STALE_AFTER_MS
  const stale = data.users.filter(
    (u) => isFixtureEmail(u.email) && new Date(u.created_at).getTime() < cutoff,
  )

  for (const user of stale) {
    // Storage objects are not covered by the row cascade, so they go first.
    const { data: files } = await admin
      .from('order_files')
      .select('bucket_path')
      .eq('uploader_id', user.id)

    const paths = (files ?? []).map((f) => f.bucket_path as string)
    if (paths.length) await admin.storage.from('samples').remove(paths)

    await admin.auth.admin.deleteUser(user.id)
  }

  return stale.length
}
