import { ACCEPTED_MIME, EXTENSION_BY_MIME, MAX_FILE_BYTES, type AcceptedMime } from './constants'

export type ValidationResult =
  { ok: true; mime: AcceptedMime; extension: string } | { ok: false; message: string }

/**
 * Client-side validation, mirrored by the database's CHECK constraints and
 * the bucket's own limits.
 *
 * Messages name the actual problem and the actual limit. "Invalid file" tells
 * someone nothing they can act on; "that photo is 24.3 MB, the limit is 20 MB"
 * tells them to retake it smaller.
 */
export function validateFile(file: { name: string; type: string; size: number }): ValidationResult {
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      message: `${file.name} is not a photo or PDF. Upload a JPG, PNG or PDF.`,
    }
  }

  if (file.size <= 0) {
    return { ok: false, message: `${file.name} appears to be empty.` }
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `${file.name} is ${formatMb(file.size)}, over the ${formatMb(MAX_FILE_BYTES)} limit. Try a smaller photo.`,
    }
  }

  const mime = file.type as AcceptedMime
  return { ok: true, mime, extension: EXTENSION_BY_MIME[mime] }
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
