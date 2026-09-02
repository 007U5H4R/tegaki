import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { runRetention } from '@/lib/retention/purge'

/**
 * The nightly retention job.
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. It is a
 * public URL that deletes customer data, so the check is the first thing that
 * happens and there is no second way in.
 *
 * Dynamic and uncached, explicitly: a cached retention job is a job that runs
 * once and then reports the same comforting numbers forever.
 *
 * The schedule lives in vercel.json as `0 22 * * *`, which is UTC — 03:30 IST,
 * the quietest hour for the only market this pilot serves. JSON cannot carry
 * a comment, so the conversion is written down here.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(request: Request): boolean {
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

export async function GET(request: Request) {
  if (!authorized(request)) {
    // Deliberately says nothing about whether a secret is configured.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const report = await runRetention()
    const ms = Date.now() - startedAt

    // One structured line per run. This is the only evidence the job ran at
    // all, and the only place the numbers ever appear — a silent job that
    // deletes nothing looks exactly like a working one.
    console.log('[retention]', JSON.stringify({ ...report, ms }))

    if (report.objectErrors.length > 0) {
      // Storage refused something. The rows were deliberately left behind so
      // tomorrow's run retries, but the operator needs to know today.
      console.error('[retention] storage errors', report.objectErrors)
    }
    if (report.undeliveredBacklog > 0) {
      console.warn(
        `[retention] ${report.undeliveredBacklog} completed order(s) were never marked delivered, so their samples have no retention clock.`,
      )
    }

    // A storage refusal means the rows were left in place for tomorrow, so
    // this run did not do its job. That has to be a red cron in Vercel's
    // dashboard, not a green one with a sad field inside it.
    const ok = report.objectErrors.length === 0
    return NextResponse.json({ ok, ...report, ms }, { status: ok ? 200 : 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[retention] failed', message)
    // 500 rather than a cheerful 200 with an error field: Vercel marks a
    // failing cron in the dashboard, and that is the alert.
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
