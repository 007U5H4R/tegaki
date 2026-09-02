import { createClient } from '@/lib/supabase/client'
import { REPORTS_BUCKET, REPORT_MIME } from './constants'

/**
 * Put a report PDF into the private reports bucket, with real progress.
 *
 * Same XHR approach as the sample uploader, for the same reason: supabase-js
 * has no progress callback, and a multi-megabyte upload with no feedback
 * reads as a hung app. The storage policy still decides who may write — the
 * transport changes how the bytes travel, not who is allowed to send them.
 */
export async function uploadReport(params: {
  file: File
  path: string
  onProgress?: (percent: number) => void
}): Promise<void> {
  const { file, path, onProgress } = params

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Your session has expired. Sign in again to upload.')

  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${REPORTS_BUCKET}/${path}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint, true)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('Content-Type', REPORT_MIME)
    // Paths carry a fresh UUID, so a collision means something is wrong
    // rather than that a retry is due.
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      let message = `Upload failed (${xhr.status})`
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string }
        message = body.message ?? body.error ?? message
      } catch {
        // A non-JSON body is not worth guessing at; the status stands.
      }
      reject(new Error(message))
    }

    xhr.onerror = () => reject(new Error('The connection dropped while uploading.'))
    xhr.send(file)
  })
}
