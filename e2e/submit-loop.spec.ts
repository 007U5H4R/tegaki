import { expect, test } from '@playwright/test'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  adminClient,
  applySession,
  createTestUser,
  destroyTestUser,
  supabaseConfigured,
} from './support/session'
import { expectNoHorizontalOverflow } from './support/overflow'
import { cleanStaleFixtures } from '../tests/support/fixtures'

/**
 * T06/C1 — the whole customer loop, in a real browser.
 *
 * This is the test the project has been missing. Everything else proves a
 * layer: the database refuses what it should, a component renders what it
 * should. This proves the parts are actually wired to each other — that
 * somebody can arrive signed in, describe themselves, photograph two pages,
 * choose a depth, confirm, and end up with an order an analyst can work on.
 *
 * It asserts the browser AND the database, because a UI that says "Sample
 * under review" over an order still sitting in draft would pass a
 * screen-only check.
 */

const A_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
])

test.describe('the customer loop', () => {
  test.skip(!supabaseConfigured, 'needs Supabase credentials in .env.local')

  let admin: SupabaseClient
  let user: User | null = null

  test.beforeAll(async () => {
    admin = adminClient()
    // Same sweep vitest runs: a spec that fails mid-flight never reaches its
    // afterAll, and those accounts are real rows in a real project.
    await cleanStaleFixtures(admin)
  })

  test.afterAll(async () => {
    await destroyTestUser(admin, user)
  })

  test('sign in, describe, upload, choose, confirm', async ({ context, page, baseURL }, info) => {
    // Uploads to the real bucket over a real network make this the slowest
    // spec in the suite by a distance.
    test.setTimeout(120_000)

    const email = `loop-${info.project.name}-${Date.now()}@tegaki.test`
    const created = await createTestUser(admin, email)
    user = created.user
    await applySession(context, baseURL!, created.session)

    // ── Arriving ────────────────────────────────────────────────────────────
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Your assessments' })).toBeVisible()

    // The empty state, exercised for real rather than asserted from a fixture.
    await expect(page.getByText(/first assessment begins/i)).toBeVisible()

    await page.getByRole('button', { name: /begin your assessment/i }).click()
    await expect(page).toHaveURL(/\/wizard\/[0-9a-f-]+\/profile$/)
    await expectNoHorizontalOverflow(page, 'wizard stage 1')

    // ── Stage 1 · who this is for ───────────────────────────────────────────
    await page.getByLabel('Full name').fill('Asha Menon')
    // Labels carry a required marker, so these match on the visible label text
    // rather than exactly. "Their age" only exists on the someone-else path.
    await page.getByLabel('Age').fill('34')
    await page.getByLabel('City').fill('Kochi')
    await page.getByLabel('Country').fill('India')
    await page.getByLabel('Email').fill('asha@example.com')
    await page.getByLabel('Phone').fill('+91 98765 43210')
    await page.getByRole('button', { name: /continue to your sample/i }).click()

    await expect(page).toHaveURL(/\/upload$/)
    await expectNoHorizontalOverflow(page, 'wizard stage 2')

    // ── Stage 2 · the sample ────────────────────────────────────────────────
    // The dropzone stays locked until every guardrail is ticked; a rejected
    // sample costs the customer days, so the friction is the point.
    // Clicked by their labels, the way a person does it. The input itself is
    // a transparent overlay behind the drawn box, so clicking the label is
    // both the real interaction and the one worth proving works.
    const checklist = page.locator('label:has(input[type="checkbox"])')
    const count = await checklist.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) await checklist.nth(i).click()
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4)

    await page.locator('input[type="file"]').setInputFiles([
      { name: 'page-1.jpg', mimeType: 'image/jpeg', buffer: A_JPEG },
      { name: 'page-2.jpg', mimeType: 'image/jpeg', buffer: A_JPEG },
    ])

    await expect(page.getByText('page-1.jpg')).toBeVisible()
    await expect(page.getByText('page-2.jpg')).toBeVisible()
    // Checked again with rows present: a file name is the likeliest thing on
    // this screen to push a phone layout sideways.
    await expectNoHorizontalOverflow(page, 'wizard stage 2 with uploaded files')
    await expect(page.getByRole('button', { name: /choose your depth/i })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: /choose your depth/i }).click()

    await expect(page).toHaveURL(/\/tier$/)
    await expectNoHorizontalOverflow(page, 'wizard stage 3')

    // ── Stage 3 · the depth ─────────────────────────────────────────────────
    await expect(page.getByText('Most popular')).toBeVisible()
    await page.getByRole('radio', { name: /core personality/i }).check()
    await page.getByRole('button', { name: /review your order/i }).click()

    await expect(page).toHaveURL(/\/checkout$/)

    // ── Stage 4 · confirming ────────────────────────────────────────────────
    // The pilot notice is a promise, not decoration: taking an order without
    // taking money is only honest if nobody can miss being told.
    await expect(page.getByText(/no real payment is taken/i)).toBeVisible()
    // Exact: the wizard header also carries "Core Personality · ₹1,999".
    await expect(page.getByText('₹1,999', { exact: true })).toBeVisible()
    await expect(page.getByText(/indicative and growth-oriented/i)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'wizard stage 4')

    await page.getByRole('button', { name: /confirm my order/i }).click()

    // The param, not merely the path: it is what carries the confirmation
    // across the navigation, and losing it is a silent failure.
    await expect(page).toHaveURL(/\/dashboard\?submitted=1$/, { timeout: 30_000 })
    await expect(page.getByText(/sample received/i)).toBeVisible()
    await expect(page.getByText('Sample under review')).toBeVisible()
    await expect(page.getByText(/no payment was taken/i)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'dashboard with a submitted order')

    // ── What actually landed in the database ────────────────────────────────
    const { data: orders } = await admin
      .from('orders')
      .select('id, status, tier, submitted_at, full_name')
      .eq('buyer_id', created.user.id)

    expect(orders).toHaveLength(1)
    expect(orders![0]).toMatchObject({
      status: 'sample_under_review',
      tier: 'core',
      full_name: 'Asha Menon',
    })
    expect(orders![0]!.submitted_at).not.toBeNull()

    const orderId = orders![0]!.id as string

    const { count: files } = await admin
      .from('order_files')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId)
    expect(files).toBe(2)

    const { data: payments } = await admin
      .from('payments')
      .select('amount_inr, provider, status')
      .eq('order_id', orderId)

    expect(payments).toHaveLength(1)
    expect(payments![0]).toMatchObject({
      amount_inr: 1999,
      provider: 'demo',
      status: 'demo_paid',
    })
  })
})
