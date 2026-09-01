'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SAMPLES_BUCKET } from './constants'
import { parseSamplePath } from './paths'
import { validateFile } from './validate'

export type UploadRecord = {
  id: string
  order_id: string
  version: number
  bucket_path: string
  file_name: string
  mime: string
  size_bytes: number
  created_at: string
}

/**
 * The next version number for an order's samples.
 *
 * A re-upload after rejection starts a new version rather than replacing the
 * old one, so the history of what was sent and when survives (T08 depends on
 * this).
 */
export async function nextSampleVersion(orderId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('order_files')
    .select('version')
    .eq('order_id', orderId)
    .order('version', { ascending: false })
    .limit(1)

  if (error) throw new Error(`Could not read existing samples: ${error.message}`)
  return (data?.[0]?.version ?? 0) + 1
}

/**
 * Record a file that has just been uploaded to storage.
 *
 * The bytes go straight from the browser to Supabase Storage — which is what
 * gives us upload progress — and this action writes the row afterwards. The
 * path is re-derived and re-checked here rather than trusted: a client that
 * could name any path could claim someone else's object. Storage policies
 * would still refuse the write, but a row pointing at a stranger's file would
 * be a nasty thing to have in the table.
 */
export async function recordUpload(input: {
  orderId: string
  bucketPath: string
  fileName: string
  mime: string
  sizeBytes: number
}): Promise<UploadRecord> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You need to be signed in to upload a sample.')

  const parsed = parseSamplePath(input.bucketPath)
  if (!parsed) throw new Error('That upload path is not valid.')
  if (parsed.buyerId !== user.id || parsed.orderId !== input.orderId) {
    throw new Error('That upload path does not belong to this order.')
  }

  const check = validateFile({
    name: input.fileName,
    type: input.mime,
    size: input.sizeBytes,
  })
  if (!check.ok) throw new Error(check.message)

  const { data, error } = await supabase
    .from('order_files')
    .insert({
      order_id: input.orderId,
      uploader_id: user.id,
      version: parsed.version,
      bucket_path: input.bucketPath,
      file_name: input.fileName,
      mime: input.mime,
      size_bytes: input.sizeBytes,
    })
    .select('id, order_id, version, bucket_path, file_name, mime, size_bytes, created_at')
    .single()

  if (error) throw new Error(`Could not save that upload: ${error.message}`)

  revalidatePath('/dashboard')
  return data as UploadRecord
}

/**
 * Remove a sample the customer has just added.
 *
 * Deletes the object first, then the row. Doing it the other way round would
 * orphan bytes that nothing points at, and an orphaned handwriting sample in
 * a bucket is exactly the kind of thing a retention policy is supposed to
 * prevent. A re-run tidies any half-state.
 */
export async function removeUpload(fileId: string): Promise<void> {
  const supabase = await createClient()

  const { data: file, error: readError } = await supabase
    .from('order_files')
    .select('id, bucket_path')
    .eq('id', fileId)
    .single()

  if (readError || !file) throw new Error('That file could not be found.')

  const { error: storageError } = await supabase.storage
    .from(SAMPLES_BUCKET)
    .remove([file.bucket_path])
  if (storageError) throw new Error(`Could not remove that file: ${storageError.message}`)

  const { error: rowError } = await supabase.from('order_files').delete().eq('id', fileId)
  if (rowError) throw new Error(`Could not remove that file: ${rowError.message}`)

  revalidatePath('/dashboard')
}

/**
 * Acknowledge the sample guardrails. Persisted on the order so a resumed
 * wizard remembers, and so the acknowledgement is auditable.
 */
export async function saveGuardrails(
  orderId: string,
  acked: Record<string, boolean>,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ guardrails_acked: acked })
    .eq('id', orderId)

  if (error) throw new Error(`Could not save your checklist: ${error.message}`)
}
