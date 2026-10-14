import { Card, MicroLabel } from '@/components/ui/card'
import { heartbeatState, relativeTime } from '@/lib/heartbeat'
import { cn } from '@/lib/cn'

/**
 * When the keep-alive last reached the database.
 *
 * This is the cheapest alert there is: Tushar opens admin regularly, so a
 * stale heartbeat shows up where he already looks. Like the pause card, it
 * turns warn-tinted when something needs doing — and carries an icon and a
 * sentence, so the warning does not rest on colour alone.
 */
export function HeartbeatStatus({ beatAt, now }: { beatAt: string | null; now: Date }) {
  const state = heartbeatState(beatAt, now)
  const warn = state !== 'fresh'

  // IST, because that is where the person reading it is, and pinned so the
  // server render does not depend on the server's own zone.
  const absolute = beatAt
    ? new Date(beatAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' IST'
    : null

  return (
    <Card className={cn('flex flex-col gap-3', warn && 'border-warn-500/40 bg-warn-500/5')}>
      <div>
        <MicroLabel tone={warn ? 'accent' : 'muted'}>Database keep-alive</MicroLabel>
        <p className="text-washi-50 mt-2">
          Last database heartbeat: {beatAt ? relativeTime(beatAt, now) : 'never'}
        </p>
      </div>

      {warn ? (
        <p role="alert" className="text-warn-500 flex items-start gap-2 text-sm">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3 1.5 17.5h17L10 3Z" />
            <path d="M10 8.5v4M10 15h.01" />
          </svg>
          <span>
            {absolute
              ? `The keep-alive hasn't run since ${absolute}.`
              : 'The keep-alive has not run yet.'}{' '}
            Supabase may pause the database. Check Vercel → Cron Jobs.
          </span>
        </p>
      ) : null}
    </Card>
  )
}
