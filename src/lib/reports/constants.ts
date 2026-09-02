/**
 * Limits and paths for delivered reports.
 *
 * Kept apart from the sample uploader's constants: a sample is a photo taken
 * on a phone, a report is a PDF produced by the analyst, and the two have
 * different limits, different types and different rules about who may read
 * them. Sharing one module would invite one set of rules to drift into the
 * other.
 */

export const REPORTS_BUCKET = 'reports'

/** Matches the bucket's own cap and the CHECK on `reports.size_bytes`. */
export const MAX_REPORT_BYTES = 25 * 1024 * 1024

export const REPORT_MIME = 'application/pdf'

/**
 * `reports/{order_id}/{uuid}.pdf`
 *
 * No buyer id in the path, unlike samples. Storage policies here name the
 * admin rather than comparing a path segment to `auth.uid()`, because no
 * customer ever reads this bucket directly — they go through a server action
 * that mints a short-lived signed URL.
 */
export function reportObjectPath(orderId: string): string {
  return `${orderId}/${crypto.randomUUID()}.pdf`
}

/**
 * What the file is called when it lands in someone's Downloads folder.
 *
 * "report.pdf" among thirty other PDFs is a file nobody can find again. This
 * one says whose it is, how deep it goes, and when it arrived.
 */
export function reportDownloadName(params: {
  subject: string | null
  tierName: string | null
  date: Date
}): string {
  const { subject, tierName, date } = params

  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const parts = ['Tegaki']
  if (subject) parts.push(slug(subject))
  if (tierName) parts.push(slug(tierName))
  parts.push(date.toISOString().slice(0, 10))

  return `${parts.filter(Boolean).join('-')}.pdf`
}

/** Client-side check, mirroring the bucket cap and the CHECK constraint. */
export function validateReportFile(file: {
  name: string
  type: string
  size: number
}): { ok: true } | { ok: false; message: string } {
  if (file.type !== REPORT_MIME) {
    return { ok: false, message: 'Reports are delivered as PDF. That file is not one.' }
  }
  if (file.size <= 0) {
    return { ok: false, message: 'That file is empty.' }
  }
  if (file.size > MAX_REPORT_BYTES) {
    return {
      ok: false,
      message: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 25 MB.`,
    }
  }
  return { ok: true }
}
