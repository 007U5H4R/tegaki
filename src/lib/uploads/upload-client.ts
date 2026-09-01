import { createClient } from '@/lib/supabase/client'
import { SAMPLES_BUCKET } from './constants'

/**
 * Upload one file to the private samples bucket, with real progress.
 *
 * supabase-js has no progress callback, so this posts to the Storage REST
 * endpoint over XHR instead. That matters more here than it would elsewhere:
 * these are multi-megabyte phone photos, often on Indian mobile data, and a
 * long silence reads as a broken app. A faked progress bar would be worse —
 * it would keep moving while nothing was happening.
 *
 * Storage policies still govern the write; using XHR changes how the bytes
 * travel, not who is allowed to send them.
 */
export async function uploadSample(params: {
  file: File
  path: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<void> {
  const { file, path, onProgress, signal } = params

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Your session has expired. Sign in again to upload.')

  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${SAMPLES_BUCKET}/${path}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint, true)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('Content-Type', file.type)
    // Never silently replace an existing object: paths carry a fresh UUID, so
    // a collision would mean something is wrong, not that a retry is due.
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }
      // Storage returns JSON errors; fall back to the status if it does not.
      let message = `Upload failed (${xhr.status})`
      try {
        const body = JSON.parse(xhr.responseText)
        if (body?.message) message = body.message
      } catch {
        // Keep the status-based message.
      }
      reject(new Error(message))
    }

    xhr.onerror = () =>
      reject(new Error('The upload could not reach our servers. Check your connection.'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(file)
  })
}
