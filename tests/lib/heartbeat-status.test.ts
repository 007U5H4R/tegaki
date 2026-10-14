import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HeartbeatStatus } from '@/components/admin/heartbeat-status'
import { HEARTBEAT_STALE_HOURS } from '@/lib/heartbeat'

/**
 * The stale-heartbeat panel is the only alert for a silent keep-alive, so each
 * of its three states is rendered and the warning is asserted as text and a
 * role, not just a colour.
 */
const now = new Date('2026-10-14T12:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
const render = (beatAt: string | null) =>
  renderToStaticMarkup(createElement(HeartbeatStatus, { beatAt, now }))

describe('the heartbeat panel', () => {
  it('shows the relative time and no warning when fresh', () => {
    const html = render(hoursAgo(5))
    expect(html).toContain('Last database heartbeat: 5 hours ago')
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('Supabase may pause')
  })

  it('warns, in words, when older than the threshold', () => {
    const html = render(hoursAgo(HEARTBEAT_STALE_HOURS + 1))
    expect(html).toContain('role="alert"')
    expect(html).toContain('The keep-alive hasn&#x27;t run since')
    expect(html).toContain('Supabase may pause the database')
    expect(html).toContain('Vercel → Cron Jobs')
  })

  it('does not warn just inside the threshold', () => {
    expect(render(hoursAgo(HEARTBEAT_STALE_HOURS - 1))).not.toContain('role="alert"')
  })

  it('warns when there has never been a heartbeat', () => {
    const html = render(null)
    expect(html).toContain('Last database heartbeat: never')
    expect(html).toContain('role="alert"')
    expect(html).toContain('has not run yet')
  })
})
