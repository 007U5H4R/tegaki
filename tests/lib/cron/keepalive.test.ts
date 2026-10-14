import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The keep-alive exists to turn "the database went quiet" into a red cron and
 * an error line, instead of a pause nobody noticed. So each way it can fail
 * has to be asserted: a route that answers 200 while the database is silent
 * is worse than no route.
 */
const rpc = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  serviceClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}))

describe('the keep-alive route', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret'
    rpc.mockReset()
    vi.restoreAllMocks()
  })

  const call = async (secret: string | null = 'test-secret') => {
    const { GET } = await import('@/app/api/cron/keepalive/route')
    return GET(
      new Request('http://x/api/cron/keepalive', {
        headers: secret === null ? {} : { authorization: `Bearer ${secret}` },
      }),
    )
  }

  const chain = (result: { data: unknown; error: { message: string } | null }) => ({
    abortSignal: () => Promise.resolve(result),
  })

  it('is 200 with one info line when the database answers', async () => {
    rpc.mockReturnValue(chain({ data: '2026-10-13T10:00:00Z', error: null }))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await call()

    expect(res.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('keepalive_ping')
    expect(log).toHaveBeenCalledTimes(1)
    const [label, payload] = log.mock.calls[0]!
    expect(label).toBe('[keepalive]')
    expect(JSON.parse(payload as string)).toMatchObject({
      ok: true,
      previousBeatAt: '2026-10-13T10:00:00Z',
    })
    expect(err).not.toHaveBeenCalled()
  })

  it('is 503 with an error line when the RPC errors', async () => {
    rpc.mockReturnValue(chain({ data: null, error: { message: 'connection refused' } }))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await call()

    expect(res.status).toBe(503)
    expect(err).toHaveBeenCalledWith('[keepalive] DB did not answer', 'connection refused')
  })

  it('is 503 when the database never answers within the timeout', async () => {
    vi.useFakeTimers()
    try {
      // Hangs until the route's own AbortSignal fires, then rejects like fetch does.
      rpc.mockReturnValue({
        abortSignal: (signal: AbortSignal) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new Error('The operation timed out.')))
          }),
      })
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})

      const pending = call()
      await vi.advanceTimersByTimeAsync(8_001)
      const res = await pending

      expect(res.status).toBe(503)
      expect(err).toHaveBeenCalledWith('[keepalive] DB did not answer', expect.any(String))
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['no secret', null],
    ['the wrong secret', 'nope'],
  ])('is 401 and never touches the database with %s', async (_label, secret) => {
    const res = await call(secret)
    expect(res.status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })
})
