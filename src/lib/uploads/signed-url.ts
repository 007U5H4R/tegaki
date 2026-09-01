import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { SAMPLES_BUCKET } from './constants'

/** Ten minutes: long enough to open and read, short enough that a copied link goes stale. */
const DEFAULT_TTL_SECONDS = 600

/**
 * Mint a short-lived URL for one sample.
 *
 * Server-only, and deliberately routed through the *caller's* client rather
 * than the service key, so storage policies decide whether this person may
 * see this object. The owner and the admin can; nobody else can, and this
 * function does not need to know which case applies.
 *
 * Signed URLs are the only way a sample is ever viewed. The bucket is
 * private, so there is no long-lived link that could be pasted into a chat,
 * indexed, or left in browser history.
 */
export async function getSampleUrl(
  bucketPath: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(SAMPLES_BUCKET)
    .createSignedUrl(bucketPath, ttlSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(`Could not open that sample: ${error?.message ?? 'no URL returned'}`)
  }

  return data.signedUrl
}
