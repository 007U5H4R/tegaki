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

  await removeOrphanedObjects(admin)

  return stale.length
}

/**
 * Objects in a private bucket that nothing points at any more.
 *
 * Deleting a user cascades the rows away but leaves the bytes: storage has no
 * foreign keys. A run killed between upload and cleanup therefore leaves a
 * handwriting sample or a personality report sitting in a private bucket with
 * no owner and no row referencing it — precisely what a retention policy
 * exists to prevent, test data included.
 *
 * Both buckets name their owner in the first path segment, so an orphan is a
 * top-level folder whose id is no longer in the table it points at:
 *
 *   samples/{buyer_uid}/…   → gone when that profile is gone
 *   reports/{order_id}/…    → gone when that order is gone
 */
async function removeOrphanedObjects(admin: SupabaseClient): Promise<number> {
  return (
    (await sweepBucket(admin, 'reports', 'orders')) +
    (await sweepBucket(admin, 'samples', 'profiles'))
  )
}

async function sweepBucket(
  admin: SupabaseClient,
  bucket: 'reports' | 'samples',
  table: 'orders' | 'profiles',
): Promise<number> {
  const { data: folders } = await admin.storage.from(bucket).list('', { limit: 1000 })
  if (!folders?.length) return 0

  const ids = folders.map((f) => f.name).filter((name) => UUID.test(name))
  if (!ids.length) return 0

  const { data: live } = await admin.from(table).select('id').in('id', ids)
  const alive = new Set((live ?? []).map((row) => row.id as string))

  let removed = 0
  for (const id of ids) {
    if (alive.has(id)) continue
    removed += await removeTree(admin, bucket, id)
  }
  return removed
}

/** Storage has no recursive delete, so walk it — these trees are three deep at most. */
async function removeTree(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
  depth = 0,
): Promise<number> {
  if (depth > 4) return 0

  const { data: entries } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (!entries?.length) return 0

  // A storage "folder" is a synthetic prefix with no id; real objects have one.
  const files = entries.filter((e) => e.id).map((e) => `${prefix}/${e.name}`)
  const dirs = entries.filter((e) => !e.id).map((e) => `${prefix}/${e.name}`)

  let removed = 0
  if (files.length) {
    await admin.storage.from(bucket).remove(files)
    removed += files.length
  }
  for (const dir of dirs) removed += await removeTree(admin, bucket, dir, depth + 1)

  return removed
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
