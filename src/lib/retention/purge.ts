import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseSecretKey, supabaseUrl } from '@/lib/supabase/env'
import { SAMPLES_BUCKET } from '@/lib/uploads/constants'

export type RetentionReport = {
  examined: number
  objectsDeleted: number
  filesDeleted: number
  ordersPurged: number
  parked: number
  undeliveredBacklog: number
  objectErrors: string[]
}

/**
 * The service-role client, used here and in the test suite only.
 *
 * The retention job has no user to act as — it runs at 03:30 with nobody
 * signed in — and the rows it must reach belong to every customer at once.
 * That is the one shape of work RLS cannot express, so it is the one place
 * in the app this key is allowed.
 */
function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Delete the handwriting samples of orders delivered longer ago than the
 * retention window, and report exactly what happened.
 *
 * Objects first, rows second. The order is the whole design:
 *
 *   Rows first would mean a crash between the two steps leaves objects in a
 *   private bucket with nothing pointing at them — undeletable by any later
 *   run, because the run learns what to delete from the rows.
 *
 *   Objects first means a crash leaves rows whose objects are already gone.
 *   The next run finds those rows again, asks storage to remove keys that no
 *   longer exist (a no-op), and finishes the job. That is what makes this
 *   safe to run twice, and it is also why the interrupted state is the
 *   harmless one rather than the permanent one.
 *
 * The SQL function re-derives the deletion set rather than trusting the ids
 * this function collected. If the two ever disagreed, the database's answer
 * is the one that governs whose handwriting gets destroyed.
 */
export async function runRetention(options: { days?: number } = {}): Promise<RetentionReport> {
  const supabase = serviceClient()
  const days = options.days ?? null

  const { data: due, error: dueError } = await supabase.rpc('expiring_sample_files', {
    p_days: days,
  })
  if (dueError) throw new Error(`Could not list expiring samples: ${dueError.message}`)

  const paths = (due ?? []).map((row: { bucket_path: string }) => row.bucket_path)
  const orders = new Set((due ?? []).map((row: { order_id: string }) => row.order_id))

  const objectErrors: string[] = []
  let objectsDeleted = 0

  // Storage's remove() takes a list; batched so one enormous run cannot build
  // a request nothing will accept.
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100)
    const { data, error } = await supabase.storage.from(SAMPLES_BUCKET).remove(batch)
    if (error) {
      // Recorded, not thrown. One unreachable object must not stop the job
      // from destroying the other eighty — and the rows for this batch stay
      // put, so the next run tries again.
      objectErrors.push(error.message)
      continue
    }
    objectsDeleted += data?.length ?? 0
  }

  // Rows only for the batches whose objects actually went. If every batch
  // failed, nothing is purged and the run reports it rather than pretending.
  let ordersPurged = 0
  let filesDeleted = 0
  if (objectErrors.length === 0) {
    const { data, error } = await supabase.rpc('purge_expired_samples', { p_days: days })
    if (error) throw new Error(`Could not purge sample rows: ${error.message}`)
    const row = Array.isArray(data) ? data[0] : data
    ordersPurged = row?.orders_purged ?? 0
    filesDeleted = row?.files_deleted ?? 0
  }

  // The daily backstop for T08's re-upload window. A customer's own dashboard
  // sweeps their overdue orders when they visit, which covers everyone who
  // comes back; this covers everyone who does not.
  const { data: parked, error: parkError } = await supabase.rpc('park_overdue_orders')
  if (parkError) throw new Error(`Could not park overdue orders: ${parkError.message}`)

  const { data: backlog, error: backlogError } = await supabase.rpc('undelivered_backlog', {
    p_days: days,
  })
  if (backlogError)
    throw new Error(`Could not read the undelivered backlog: ${backlogError.message}`)

  return {
    examined: orders.size,
    objectsDeleted,
    filesDeleted,
    ordersPurged,
    parked: parked ?? 0,
    undeliveredBacklog: backlog ?? 0,
    objectErrors,
  }
}

/**
 * Honour a delete-my-data request for one order.
 *
 * `erase` decides whether the order row survives with its personal fields
 * nulled, or goes entirely. Both are legitimate answers to "delete my data"
 * and the person asking gets to pick — see plans/RUNBOOK-delete-my-data.md.
 */
export async function purgeOrderData(
  orderId: string,
  erase: boolean,
): Promise<{ objectsDeleted: number; objectErrors: string[] }> {
  const supabase = serviceClient()

  // The function returns the paths it is about to orphan, then deletes the
  // rows — so this is the only moment those paths are knowable.
  const { data, error } = await supabase.rpc('purge_order_data', {
    p_order_id: orderId,
    p_erase: erase,
  })
  if (error) throw new Error(`Could not erase this order's data: ${error.message}`)

  const byBucket = new Map<string, string[]>()
  for (const row of (data ?? []) as { bucket: string; path: string }[]) {
    byBucket.set(row.bucket, [...(byBucket.get(row.bucket) ?? []), row.path])
  }

  const objectErrors: string[] = []
  let objectsDeleted = 0
  for (const [bucket, keys] of byBucket) {
    const { data: removed, error: removeError } = await supabase.storage.from(bucket).remove(keys)
    // The rows are already gone by the time this runs, so a failure here
    // leaves an orphaned object that no later job will find. It is surfaced
    // to the analyst rather than swallowed: the runbook's manual step is to
    // clear it in the Supabase dashboard.
    if (removeError) objectErrors.push(`${bucket}: ${removeError.message}`)
    else objectsDeleted += removed?.length ?? 0
  }

  return { objectsDeleted, objectErrors }
}
