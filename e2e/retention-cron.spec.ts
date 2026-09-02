import { expect, test } from '@playwright/test'

/**
 * T15 — the endpoint that deletes customer data is a public URL.
 *
 * Everything else in this product is reached by a signed-in person, so the
 * session is the gate. This route has no session: Vercel Cron calls it at
 * 03:30 with a bearer token and nothing else. That makes the token the only
 * thing between the open internet and every customer's handwriting, and it is
 * worth checking against the running server rather than reading the code and
 * concluding it looks right.
 *
 * Only the refusals are exercised here. Actually running the job is covered
 * in tests/rls/retention.test.ts, where fixtures can be placed either side of
 * the boundary; firing it at a live server from a browser test would delete
 * whatever happened to be due, which is not a thing a test should decide.
 */

const ROUTE = '/api/cron/retention'

test.describe('the retention cron endpoint', () => {
  test('refuses a caller with no credentials', async ({ request }) => {
    const response = await request.get(ROUTE)
    expect(response.status()).toBe(401)
  })

  test('refuses a wrong secret', async ({ request }) => {
    const response = await request.get(ROUTE, {
      headers: { authorization: 'Bearer not-the-secret' },
    })
    expect(response.status()).toBe(401)
  })

  test('refuses a secret in the wrong place', async ({ request }) => {
    // A query string would be logged by every proxy between here and Vercel,
    // so the token is only ever read from the Authorization header.
    const secret = process.env.CRON_SECRET
    test.skip(!secret, 'CRON_SECRET is not set in this environment')

    const response = await request.get(`${ROUTE}?secret=${secret}`)
    expect(response.status()).toBe(401)
  })

  test('says nothing about whether a secret is configured', async ({ request }) => {
    // Two different rejections that answer differently would tell an attacker
    // whether the deployment is guarded at all.
    const bare = await request.get(ROUTE)
    const wrong = await request.get(ROUTE, { headers: { authorization: 'Bearer wrong' } })

    expect(await bare.json()).toEqual(await wrong.json())
  })
})
