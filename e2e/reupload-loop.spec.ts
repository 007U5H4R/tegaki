import { expect, test } from '@playwright/test'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  adminClient,
  applySession,
  createTestUser,
  destroyTestUser,
  promoteToAdmin,
  supabaseConfigured,
} from './support/session'
import { seedSubmittedOrder } from './support/orders'
import { expectNoHorizontalOverflow } from './support/overflow'

/**
 * T08 — what happens after a sample is turned down.
 *
 * The round trip in full: the analyst sends an order back, the customer sees
 * that sentence on their dashboard, photographs the page again, and puts the
 * order back in the queue. Then the two states the customer cannot act their
 * way out of — a closed window, and the parked order it produces.
 *
 * The clock is moved by writing `reupload_deadline`, so the fourteen-day
 * boundary is exercised in seconds rather than waited out.
 */

const REASON = 'The second page is out of focus — please photograph it flat, in daylight.'

const A_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
])

test.describe('after a rejection', () => {
  test.skip(!supabaseConfigured, 'needs Supabase credentials in .env.local')

  let service: SupabaseClient
  let analyst: User | null = null
  let buyer: User | null = null

  test.beforeAll(async () => {
    service = adminClient()
  })

  test.afterAll(async () => {
    for (const u of [analyst, buyer]) await destroyTestUser(service, u)
  })

  test('the customer sees why, sends a replacement, and lands back in the queue', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-${Date.now()}`
    const analystSession = await createTestUser(service, `reup-analyst-${stamp}@tegaki.test`)
    const buyerSession = await createTestUser(service, `reup-buyer-${stamp}@tegaki.test`)
    analyst = analystSession.user
    buyer = buyerSession.user
    await promoteToAdmin(service, analyst.id)

    const orderId = await seedSubmittedOrder(service, buyer.id, { subject: 'Asha Menon' })

    // The analyst turns it down, through the same function the UI uses.
    const analystApi = await signedInApi(analystSession.session.access_token)
    const { error: rejectError } = await analystApi.rpc('transition_order', {
      p_order_id: orderId,
      p_to: 'needs_reupload',
      p_reason: REASON,
    })
    expect(rejectError).toBeNull()

    // ── The customer's side ─────────────────────────────────────────────────
    await applySession(context, baseURL!, buyerSession.session)
    await page.goto('/dashboard')

    await expect(page.getByText('Needs another try', { exact: true })).toBeVisible()
    await expect(page.getByText(/what your analyst saw/i)).toBeVisible()
    // Verbatim. The analyst's sentence is all the customer has to work from.
    await expect(page.getByText(REASON)).toBeVisible()
    await expect(page.getByText(/send a replacement by/i)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'dashboard with a rejected order')

    // Nothing to send yet, so the action is not offered.
    const resubmit = page.getByRole('button', { name: /send it back for review/i })
    await expect(resubmit).toBeDisabled()
    await expect(page.getByText(/add your replacement page first/i)).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'page-1-again.jpg',
      mimeType: 'image/jpeg',
      buffer: A_JPEG,
    })
    await expect(page.getByText('page-1-again.jpg')).toBeVisible()
    await expect(resubmit).toBeEnabled({ timeout: 30_000 })

    await resubmit.click()
    await expect(page.getByText('Sample under review')).toBeVisible({ timeout: 30_000 })

    // ── What landed ─────────────────────────────────────────────────────────
    const { data: order } = await service
      .from('orders')
      .select('status, resubmitted_at, rejected_reason')
      .eq('id', orderId)
      .single()

    expect(order?.status).toBe('sample_under_review')
    expect(order?.resubmitted_at).not.toBeNull()

    // The rejected page is kept, not overwritten: a rejected sample and its
    // replacement are both evidence.
    const { data: files } = await service
      .from('order_files')
      .select('version')
      .eq('order_id', orderId)
      .order('version')
    expect(files?.map((f) => f.version)).toEqual([1, 2])
  })

  test('a closed window parks the order, and the parked order offers a way out', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-park-${Date.now()}`
    const analystSession = await createTestUser(service, `park-analyst-${stamp}@tegaki.test`)
    const buyerSession = await createTestUser(service, `park-buyer-${stamp}@tegaki.test`)
    await promoteToAdmin(service, analystSession.user.id)

    try {
      const orderId = await seedSubmittedOrder(service, buyerSession.user.id)

      const analystApi = await signedInApi(analystSession.session.access_token)
      await analystApi.rpc('transition_order', {
        p_order_id: orderId,
        p_to: 'needs_reupload',
        p_reason: REASON,
      })

      // Wind the clock past the deadline rather than waiting a fortnight.
      await service
        .from('orders')
        .update({ reupload_deadline: new Date(Date.now() - 3_600_000).toISOString() })
        .eq('id', orderId)

      await applySession(context, baseURL!, buyerSession.session)

      // Simply loading the dashboard closes the window — no cron needed for
      // the customer to see the truth about their own order.
      await page.goto('/dashboard')
      await expect(page.getByText('Parked', { exact: true })).toBeVisible()
      await expect(page.getByText(/re-upload window closed/i)).toBeVisible()
      await expect(page.getByText(/two-week window/i)).toBeVisible()

      // Not a dead end: the one state with no button forward still has a
      // person behind it.
      const mailto = page.getByRole('link', { name: /email us/i })
      await expect(mailto).toBeVisible()
      await expect(mailto).toHaveAttribute('href', /^mailto:.+@.+/)

      expect(await statusOf(service, orderId)).toBe('parked')
    } finally {
      await destroyTestUser(service, analystSession.user)
      await destroyTestUser(service, buyerSession.user)
    }
  })
})

/** A Supabase client acting as one signed-in user, for setting up state. */
async function signedInApi(accessToken: string): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  )
}

async function statusOf(service: SupabaseClient, orderId: string): Promise<string> {
  const { data } = await service.from('orders').select('status').eq('id', orderId).single()
  return data?.status as string
}
