/**
 * Limits on a rejection reason, shared by the dialog and the server action.
 *
 * They live here rather than beside the action because a `'use server'`
 * module may only export async functions — a constant exported from one
 * silently turns the whole file into something with no exports at all.
 *
 * The minimum is not arbitrary. "Blurry" is a verdict; "the second page is
 * out of focus, please photograph it flat in daylight" is something the
 * customer can act on, and they only get one sentence to work from.
 */

export const MIN_REASON_LENGTH = 15
export const MAX_REASON_LENGTH = 500
