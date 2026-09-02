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
 * T10 — the analyst's controls, in a browser.
 *
 * The pause is global state, so this spec is written to leave it off however
 * it exits: every path that turns it on turns it off again in a `finally`.
 * A test that closes the shop and crashes has closed the shop.
 */

test.describe('admin operations', () => {
  test.skip(!supabaseConfigured, 'needs Supabase credentials in .env.local')

  let service: SupabaseClient
  let analyst: User | null = null
  let buyer: User | null = null

  test.beforeAll(async () => {
    service = adminClient()
  })

  test.afterAll(async () => {
    await service.from('settings').update({ value: false }).eq('key', 'pause_new_orders')
    for (const u of [analyst, buyer]) await destroyTestUser(service, u)
  })

  test('closing the shop hides the button and says why, without touching orders in flight', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-${Date.now()}`
    const analystSession = await createTestUser(service, `ops-analyst-${stamp}@tegaki.test`)
    const buyerSession = await createTestUser(service, `ops-buyer-${stamp}@tegaki.test`)
    analyst = analystSession.user
    buyer = buyerSession.user
    await promoteToAdmin(service, analyst.id)

    // A customer with work already under way.
    await seedSubmittedOrder(service, buyer.id, { subject: 'Asha Menon' })

    try {
      // ── The analyst closes it ─────────────────────────────────────────────
      await applySession(context, baseURL!, analystSession.session)
      await page.goto('/admin/settings')

      await expect(page.getByRole('heading', { name: /the shop/i })).toBeVisible()
      await expect(page.getByText(/^Open$/)).toBeVisible()
      await expectNoHorizontalOverflow(page, 'admin settings')

      await page.getByRole('button', { name: /close to new orders/i }).click()
      await expect(page.getByText(/closed to new orders/i).first()).toBeVisible({ timeout: 20_000 })

      // ── What the customer sees ────────────────────────────────────────────
      const buyerContext = await context.browser()!.newContext()
      try {
        await applySession(buyerContext, baseURL!, buyerSession.session)
        const buyerPage = await buyerContext.newPage()
        await buyerPage.goto('/dashboard')

        await expect(buyerPage.getByRole('button', { name: /new request/i })).toHaveCount(0)
        await expect(buyerPage.getByText(/temporarily closed to new orders/i)).toBeVisible()
        // The question a closed sign provokes, answered on the same screen.
        await expect(buyerPage.getByText(/existing orders are unaffected/i)).toBeVisible()
        await expect(buyerPage.getByText('Asha Menon')).toBeVisible()
        await expectNoHorizontalOverflow(buyerPage, 'dashboard while closed')
      } finally {
        await buyerContext.close()
      }

      // Hiding the button is not the enforcement — the table is. A direct
      // insert, bypassing the UI entirely, is refused too.
      const { createClient } = await import('@supabase/supabase-js')
      const asBuyer = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${buyerSession.session.access_token}` } },
        },
      )
      const { error } = await asBuyer.from('orders').insert({ buyer_id: buyer.id })
      expect(error?.message, 'the trigger refuses it, not the missing button').toMatch(
        /temporarily closed/i,
      )

      // ── Reopening ─────────────────────────────────────────────────────────
      await page.goto('/admin/settings')
      await page.getByRole('button', { name: /reopen to new orders/i }).click()
      await expect(page.getByText(/^Open$/)).toBeVisible({ timeout: 20_000 })

      const reopened = await asBuyer.from('orders').insert({ buyer_id: buyer.id })
      expect(reopened.error).toBeNull()
    } finally {
      await service.from('settings').update({ value: false }).eq('key', 'pause_new_orders')
    }
  })

  test('status controls offer only legal moves, and delivered stamps once', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-move-${Date.now()}`
    const staff = await createTestUser(service, `ops-move-analyst-${stamp}@tegaki.test`)
    const customer = await createTestUser(service, `ops-move-buyer-${stamp}@tegaki.test`)
    await promoteToAdmin(service, staff.user.id)

    try {
      const orderId = await seedSubmittedOrder(service, customer.user.id, { tier: 'express' })

      await applySession(context, baseURL!, staff.session)
      await page.goto(`/admin/orders/${orderId}`)

      // Under review: approve and reject, and nothing else the machine would
      // refuse — no "start the report" on an unapproved sample.
      await expect(page.getByRole('button', { name: /approve this sample/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /start the report/i })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /mark as delivered/i })).toHaveCount(0)

      await page.getByRole('button', { name: /approve this sample/i }).click()
      await page.getByRole('button', { name: /approve and start/i }).click()

      // Approved: now the generated control appears, and it states the cost.
      const start = page.getByRole('button', { name: /start the report/i })
      await expect(start).toBeVisible({ timeout: 20_000 })
      await start.click()
      await expect(page.getByText(/moves it into production/i)).toBeVisible()
      await page
        .getByRole('button', { name: /start the report/i })
        .last()
        .click()

      await expect(page.getByText(/deliver the report/i)).toBeVisible({ timeout: 20_000 })

      // Attach a report so the order completes.
      await page.locator('input[type="file"]').setInputFiles({
        name: 'report.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n%%EOF\n', 'utf8'),
      })
      await page.locator('label:has(input[type="checkbox"])').first().click()
      await page.getByRole('button', { name: /attach and complete/i }).click()

      // Completed: mark-delivered appears, and says what the date is for.
      const deliver = page.getByRole('button', { name: /mark as delivered/i })
      await expect(deliver).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText(/90-day retention clock/i)).toBeVisible()

      await deliver.click()
      await expect(page.getByText(/you marked this delivered/i)).toBeVisible({ timeout: 20_000 })
      await expect(page.getByRole('button', { name: /mark as delivered/i })).toHaveCount(0)

      const { data } = await service
        .from('orders')
        .select('delivered_at, status')
        .eq('id', orderId)
        .single()
      expect(data?.status).toBe('completed')
      expect(data?.delivered_at).not.toBeNull()

      // And the customer's rail closes.
      const buyerContext = await context.browser()!.newContext()
      try {
        await applySession(buyerContext, baseURL!, customer.session)
        const buyerPage = await buyerContext.newPage()
        await buyerPage.goto('/dashboard')
        await expect(buyerPage.getByText(/sent to you personally on/i)).toBeVisible()
      } finally {
        await buyerContext.close()
      }
    } finally {
      await destroyTestUser(service, staff.user)
      await destroyTestUser(service, customer.user)
    }
  })
})
