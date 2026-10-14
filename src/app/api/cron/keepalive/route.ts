import { NextResponse } from 'next/server'
import { authorized } from '@/lib/cron/auth'
import { serviceClient } from '@/lib/supabase/service'

/**
 * The daily database keep-alive.
 *
 * Supabase pauses a project on low database activity, so this *writes* a
 * heartbeat row through `keepalive_ping()` — a write is the unambiguous kind
 * of activity. The admin settings page reads the same row back and warns
 * when it goes stale.
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`, same as
 * the retention job, and the check is the first thing that happens.
 *
 * The schedule lives in vercel.json as `0 10 * * *`, which is UTC — 15:30
 * IST, twelve hours from retention, so the database is touched twice a day
 * by two independent routes. JSON cannot carry a comment, so the conversion
 * is written down here.
 */
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 8_000

export async function GET(request: Request) {
  if (!authorized(request)) {
    // Deliberately says nothing about whether a secret is configured.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const { data, error } = await serviceClient()
      .rpc('keepalive_ping')
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
    if (error) throw new Error(error.message)

    const ms = Date.now() - startedAt
    const previousBeatAt: string | null = data ?? null

    // One structured line per run: the only evidence the job reached the
    // database, and what the previous run's evidence was.
    console.log('[keepalive]', JSON.stringify({ ok: true, ms, previousBeatAt }))
    return NextResponse.json({ ok: true, ms, previousBeatAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[keepalive] DB did not answer', message)
    // 503 rather than a cheerful 200: Vercel marks a failing cron in the
    // dashboard, and that is the alert.
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}
