/**
 * How old the keep-alive's heartbeat may get before the admin page warns.
 *
 * The cron runs daily with up to an hour of jitter, so one missed run looks
 * like ~48 hours and a normal one never exceeds ~25. 36 hours sits between
 * them: a single failure trips it, ordinary jitter cannot.
 */
export const HEARTBEAT_STALE_HOURS = 36

const HOUR_MS = 3_600_000

export type HeartbeatState = 'fresh' | 'stale' | 'missing'

export function heartbeatState(beatAt: string | null, now: Date): HeartbeatState {
  if (!beatAt) return 'missing'
  const age = now.getTime() - new Date(beatAt).getTime()
  return age > HEARTBEAT_STALE_HOURS * HOUR_MS ? 'stale' : 'fresh'
}

/** "3 hours ago", "2 days ago" — coarse on purpose; the threshold is in hours. */
export function relativeTime(beatAt: string, now: Date): string {
  const hours = Math.max(0, Math.floor((now.getTime() - new Date(beatAt).getTime()) / HOUR_MS))
  if (hours < 1) return 'less than an hour ago'
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${Math.floor(hours / 24)} days ago`
}
