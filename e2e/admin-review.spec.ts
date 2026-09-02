import { expect, test, type Page } from '@playwright/test'
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
 * T07/C2 — the analyst's half of the loop, in a real browser.
 *
 * Two things are being proven. That the review works: an order can be sent
 * back with a reason, or approved with the right date attached. And that the
 * queue is genuinely closed — a signed-in customer who guesses the URL gets
 * nowhere, whatever the navigation happens to show them.
 */

const REASON = 'The second page is out of focus — please photograph it flat, in daylight.'

/** The queue row for one order, found by the short id the row prints. */
function queueRow(page: Page, orderId: string) {
  return page.locator('a', { hasText: orderId.slice(0, 8).toUpperCase() })
}

test.describe('the review queue', () => {
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

  test('an analyst reviews a sample: one sent back, one approved', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-${Date.now()}`
    const analystSession = await createTestUser(service, `rev-analyst-${stamp}@tegaki.test`)
    const buyerSession = await createTestUser(service, `rev-buyer-${stamp}@tegaki.test`)
    analyst = analystSession.user
    buyer = buyerSession.user

    await promoteToAdmin(service, analyst.id)

    const toReject = await seedSubmittedOrder(service, buyer.id, {
      tier: 'core',
      subject: 'Rahul Menon',
    })
    const toApprove = await seedSubmittedOrder(service, buyer.id, {
      tier: 'express',
      subject: 'Priya Nair',
    })

    await applySession(context, baseURL!, analystSession.session)

    // ── The queue ───────────────────────────────────────────────────────────
    //
    // Rows are located by order id, not by subject name. An analyst sees
    // every order in the project, so the desktop and mobile runs of this
    // spec can see each other's fixtures — a name would match twice.
    const rejectRow = queueRow(page, toReject)
    const approveRow = queueRow(page, toApprove)

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /work waiting on you/i })).toBeVisible()
    await expect(rejectRow).toBeVisible()
    await expect(rejectRow).toContainText('Rahul Menon')
    await expect(approveRow).toBeVisible()
    await expectNoHorizontalOverflow(page, 'admin queue')

    // Filters narrow the list rather than merely decorating it.
    await page.getByRole('link', { name: /^sample under review/i }).click()
    await expect(page).toHaveURL(/status=sample_under_review/)
    await expect(rejectRow).toBeVisible()

    // ── Sending one back ────────────────────────────────────────────────────
    await page.goto(`/admin/orders/${toReject}`)
    await expect(page.getByRole('heading', { name: 'Rahul Menon' })).toBeVisible()
    await expect(page.getByText('page-1.jpg')).toBeVisible()
    await expectNoHorizontalOverflow(page, 'admin order detail')

    await page.getByRole('button', { name: /ask for another try/i }).click()
    await expect(page.getByText(/exactly as you write it/i)).toBeVisible()

    // Too short a reason is refused, and says why — inside the dialog, beside
    // the text it is about. (Next adds its own role="alert" route announcer,
    // so alerts are matched by their message rather than by role alone.)
    await page.getByLabel(/what went wrong/i).fill('blurry')
    await page.getByRole('button', { name: /send it back/i }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: /at least 15 characters/i }),
    ).toHaveCount(1)

    await page.getByLabel(/what went wrong/i).fill(REASON)
    await page.getByRole('button', { name: /send it back/i }).click()

    await expect(page.getByText('Needs another try')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(REASON)).toBeVisible()

    // ── Approving the other ─────────────────────────────────────────────────
    await page.goto(`/admin/orders/${toApprove}`)
    await page.getByRole('button', { name: /approve this sample/i }).click()

    // The dialog must state the consequence, not merely ask for a click.
    await expect(page.getByText(/starts the 3-day turnaround/i)).toBeVisible()
    await page.getByRole('button', { name: /approve and start/i }).click()

    await expect(page.getByText('Analysis in progress')).toBeVisible({ timeout: 20_000 })

    // ── What actually landed in the database ────────────────────────────────
    const { data: rejected } = await service
      .from('orders')
      .select('status, rejected_reason, reupload_deadline, approved_at')
      .eq('id', toReject)
      .single()

    expect(rejected?.status).toBe('needs_reupload')
    expect(rejected?.rejected_reason).toBe(REASON)
    expect(rejected?.reupload_deadline).not.toBeNull()
    expect(rejected?.approved_at, 'a rejected sample was never approved').toBeNull()

    const { data: approved } = await service
      .from('orders')
      .select('status, approved_at, expected_delivery_date')
      .eq('id', toApprove)
      .single()

    expect(approved?.status).toBe('analysis_in_progress')
    expect(approved?.approved_at).not.toBeNull()

    const threeDaysOut = new Date()
    threeDaysOut.setDate(threeDaysOut.getDate() + 3)
    expect(approved?.expected_delivery_date).toBe(threeDaysOut.toISOString().slice(0, 10))
  })

  test('a signed-in customer cannot reach the queue', async ({ browser, baseURL }, info) => {
    const stamp = `${info.project.name}-${Date.now()}`
    const customer = await createTestUser(service, `rev-nosy-${stamp}@tegaki.test`)

    const context = await browser.newContext()
    try {
      await applySession(context, baseURL!, customer.session)
      const page = await context.newPage()

      for (const path of ['/admin', `/admin/orders/${crypto.randomUUID()}`]) {
        await page.goto(path)
        // Sent to their own dashboard rather than shown a refusal: they have
        // done nothing wrong, and a wall would confirm something is here.
        await expect(page, path).toHaveURL(/\/dashboard/)
      }
    } finally {
      await context.close()
      await destroyTestUser(service, customer.user)
    }
  })

  test('an anonymous visitor is sent to sign in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
