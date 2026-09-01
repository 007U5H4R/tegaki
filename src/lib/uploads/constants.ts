/**
 * Upload limits, shared by the client validator, the server action, the
 * `order_files` CHECK constraints and the bucket configuration.
 *
 * These four must agree. When they disagree the browser accepts a file the
 * database then rejects, and the customer is told their upload failed with
 * no idea why.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const
export type AcceptedMime = (typeof ACCEPTED_MIME)[number]

/** For the file input's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_MIME.join(',')

export const EXTENSION_BY_MIME: Record<AcceptedMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
}

export const SAMPLES_BUCKET = 'samples'

/**
 * The four sample guardrails from Solution-PRD §6.3.
 *
 * Each has to be ticked before the dropzone unlocks. That friction is
 * deliberate: a rejected sample costs the customer days of waiting and
 * Tushar a round of correspondence, so a few seconds of reading here is the
 * cheapest possible intervention.
 */
export const GUARDRAILS = [
  { id: 'unlined', label: 'I have written on unlined, blank paper.' },
  { id: 'twoPages', label: 'My sample is at least two pages long.' },
  { id: 'signatures', label: 'I have signed three times at the bottom.' },
  {
    id: 'spontaneous',
    label: 'I wrote something of my own — not a poem, quote or copied passage.',
  },
] as const

export type GuardrailId = (typeof GUARDRAILS)[number]['id']

export function allGuardrailsAcked(acked: Record<string, boolean> | null | undefined): boolean {
  if (!acked) return false
  return GUARDRAILS.every((g) => acked[g.id] === true)
}
