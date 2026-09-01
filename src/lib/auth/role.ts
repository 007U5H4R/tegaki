export type Role = 'buyer' | 'admin'

/**
 * Resolve a signed-in user's role from the admin allowlist.
 *
 * The allowlist is an env var rather than a database flag so that gaining
 * admin requires a deploy, not a row update — there is no in-app path to
 * promote an account.
 *
 * This decides what to STORE on the profile. It is not an authorization
 * check: every admin route and server action calls its own guard (T07), so a
 * stale stored role can never by itself grant access.
 */
export function resolveRole(
  email: string | null | undefined,
  allowlist: string | undefined = process.env.ADMIN_EMAILS,
): Role {
  const candidate = normalizeEmail(email)
  if (!candidate) return 'buyer'

  const admins = (allowlist ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter((entry): entry is string => entry !== null)

  return admins.includes(candidate) ? 'admin' : 'buyer'
}

/**
 * Lowercase and trim so that "  Tushar@Example.com " matches
 * "tushar@example.com". Local-parts are technically case-sensitive per RFC
 * 5321, but no real mail provider treats them that way, and an allowlist that
 * missed on capitalisation would be a confusing lockout.
 */
function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}
