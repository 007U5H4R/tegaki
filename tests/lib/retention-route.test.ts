import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The cron route's answer has to match what happened. A run whose storage
 * deletes failed skipped the row purge, so it must report failure — Vercel's
 * cron monitor only reads the status code.
 */
const runRetention = vi.fn()
vi.mock('@/lib/retention/purge', () => ({ runRetention: () => runRetention() }))

const base = {
  examined: 1,
  objectsDeleted: 0,
  filesDeleted: 0,
  ordersPurged: 0,
  parked: 0,
  undeliveredBacklog: 0,
}

describe('the retention route', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret'
    runRetention.mockReset()
  })

  const call = async () => {
    const { GET } = await import('@/app/api/cron/retention/route')
    return GET(
      new Request('http://x/api/cron/retention', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )
  }

  it('is 200 when every object went', async () => {
    runRetention.mockResolvedValue({ ...base, objectErrors: [] })
    expect((await call()).status).toBe(200)
  })

  it('is 500 when storage refused, because nothing was purged', async () => {
    runRetention.mockResolvedValue({ ...base, objectErrors: ['boom'] })
    const res = await call()
    expect(res.status).toBe(500)
    expect((await res.json()).ok).toBe(false)
  })
})
