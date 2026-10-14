import { timingSafeEqual } from 'node:crypto'

/**
 * Is this request carrying the cron secret?
 *
 * Shared by every route Vercel Cron calls. They are public URLs, so the
 * check is the first thing each route does and there is no second way in.
 */
export function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  // No secret configured means no way to authorize, so nothing runs. Failing
  // closed matters more here than anywhere else in the app.
  if (!secret) return false

  const header = request.headers.get('authorization') ?? ''
  const offered = header.startsWith('Bearer ') ? header.slice(7) : ''

  // Compared without leaking length or position through timing. The lengths
  // must match before timingSafeEqual will look at the bytes at all.
  const a = Buffer.from(offered)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
