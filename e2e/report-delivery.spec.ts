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
 * T09 — the last link in the chain, in a real browser.
 *
 * The analyst takes an approved order into production, attaches a PDF with
 * the validation attestation, and the customer downloads it. The bytes are
 * compared at the end: a delivery that hands somebody a corrupted or
 * truncated file is not a delivery.
 *
 * It also checks the attestation actually gates the button, because that
 * checkbox is the only thing standing between a generated document and a
 * customer's inbox (Solution-PRD §7.4).
 */

// A tiny but genuinely valid single-page PDF, so the round trip carries real
// bytes rather than a blob that happens to be labelled application/pdf.
const A_REAL_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF
`,
  'utf8',
)

test.describe('delivering the report', () => {
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

  test('analyst attaches a validated PDF, customer downloads exactly it', async ({
    context,
    page,
    baseURL,
  }, info) => {
    test.setTimeout(120_000)

    const stamp = `${info.project.name}-${Date.now()}`
    const analystSession = await createTestUser(service, `del-analyst-${stamp}@tegaki.test`)
    const buyerSession = await createTestUser(service, `del-buyer-${stamp}@tegaki.test`)
    analyst = analystSession.user
    buyer = buyerSession.user
    await promoteToAdmin(service, analyst.id)

    const orderId = await seedSubmittedOrder(service, buyer.id, {
      tier: 'core',
      subject: 'Asha Menon',
    })

    // ── The analyst's side ──────────────────────────────────────────────────
    await applySession(context, baseURL!, analystSession.session)
    await page.goto(`/admin/orders/${orderId}`)

    await page.getByRole('button', { name: /approve this sample/i }).click()
    await page.getByRole('button', { name: /approve and start/i }).click()

    // T10 generates this control from the transition matrix and confirms it,
    // so the click opens a dialog and the dialog's button performs the move.
    await expect(page.getByRole('button', { name: /start the report/i })).toBeVisible({
      timeout: 20_000,
    })
    await page.getByRole('button', { name: /start the report/i }).click()
    await expect(page.getByText(/moves it into production/i)).toBeVisible()
    await page
      .getByRole('button', { name: /start the report/i })
      .last()
      .click()

    await expect(page.getByText(/deliver the report/i)).toBeVisible({ timeout: 20_000 })
    await expectNoHorizontalOverflow(page, 'admin report upload')

    const attach = page.getByRole('button', { name: /attach and complete/i })
    await expect(attach, 'nothing uploaded yet').toBeDisabled()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'asha-report.pdf',
      mimeType: 'application/pdf',
      buffer: A_REAL_PDF,
    })
    await expect(page.getByText('asha-report.pdf')).toBeVisible()

    // The upload has finished, but the attestation has not been given — and
    // that alone must hold the door.
    await expect(attach, 'uploaded, but not yet attested').toBeDisabled({ timeout: 30_000 })
    await expect(page.getByText(/nothing unvalidated reaches a customer/i)).toBeVisible()

    // Clicked by its label, the way a person does it — the input itself is a
    // transparent overlay behind the drawn box.
    await page.locator('label:has(input[type="checkbox"])').first().click()
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1)
    await expect(attach).toBeEnabled()
    await attach.click()

    await expect(page.getByText('Ready')).toBeVisible({ timeout: 30_000 })

    // ── The customer's side ─────────────────────────────────────────────────
    const buyerContext = await context.browser()!.newContext()
    try {
      await applySession(buyerContext, baseURL!, buyerSession.session)
      const buyerPage = await buyerContext.newPage()
      await buyerPage.goto('/dashboard')

      await expect(buyerPage.getByText('Ready')).toBeVisible()
      await expectNoHorizontalOverflow(buyerPage, 'dashboard with a delivered report')

      const download = buyerPage.getByRole('button', { name: /download report/i })
      await expect(download).toBeVisible()

      const [downloaded] = await Promise.all([
        buyerPage.waitForEvent('download', { timeout: 30_000 }),
        download.click(),
      ])

      // The filename says whose report it is, not "report.pdf".
      expect(downloaded.suggestedFilename()).toBe(
        'Tegaki-Asha-Menon-Core-Personality-' + new Date().toISOString().slice(0, 10) + '.pdf',
      )

      const stream = await downloaded.createReadStream()
      const chunks: Buffer[] = []
      for await (const chunk of stream) chunks.push(chunk as Buffer)
      const received = Buffer.concat(chunks)

      // Byte-identical. A delivery that hands somebody a truncated file is
      // not a delivery.
      expect(received.equals(A_REAL_PDF), 'the downloaded PDF differs from the one uploaded').toBe(
        true,
      )
    } finally {
      await buyerContext.close()
    }

    // ── What landed ─────────────────────────────────────────────────────────
    const { data: report } = await service
      .from('reports')
      .select('file_name, size_bytes, validated_at, uploaded_by')
      .eq('order_id', orderId)
      .single()

    expect(report?.file_name).toBe('asha-report.pdf')
    expect(report?.size_bytes).toBe(A_REAL_PDF.length)
    expect(report?.validated_at, 'the attestation is recorded').not.toBeNull()
    expect(report?.uploaded_by).toBe(analyst.id)

    const { data: order } = await service.from('orders').select('status').eq('id', orderId).single()
    expect(order?.status).toBe('completed')
  })

  test('a customer cannot pull a stranger’s report', async ({ browser, baseURL }, info) => {
    const stamp = `${info.project.name}-nosy-${Date.now()}`
    const owner = await createTestUser(service, `del-owner-${stamp}@tegaki.test`)
    const nosy = await createTestUser(service, `del-nosy-${stamp}@tegaki.test`)
    const staff = await createTestUser(service, `del-staff-${stamp}@tegaki.test`)
    await promoteToAdmin(service, staff.user.id)

    const context = await browser.newContext()
    try {
      const orderId = await seedSubmittedOrder(service, owner.user.id)

      // Take it all the way to delivered, server-side.
      const { createClient } = await import('@supabase/supabase-js')
      const asStaff = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${staff.session.access_token}` } },
        },
      )
      for (const to of ['analysis_in_progress', 'report_generating']) {
        await asStaff.rpc('transition_order', { p_order_id: orderId, p_to: to })
      }
      await asStaff.rpc('attach_report', {
        p_order_id: orderId,
        p_bucket_path: `${orderId}/${crypto.randomUUID()}.pdf`,
        p_file_name: 'report.pdf',
        p_size_bytes: A_REAL_PDF.length,
        p_validated: true,
      })

      // The report genuinely exists.
      const { data: real } = await service.from('reports').select('id').eq('order_id', orderId)
      expect(real, 'the report was delivered').toHaveLength(1)

      // The nosy customer signs in and finds nothing of it: no order on their
      // dashboard, so no download button.
      await applySession(context, baseURL!, nosy.session)
      const page = await context.newPage()
      await page.goto('/dashboard')
      await expect(page.getByRole('button', { name: /download report/i })).toHaveCount(0)

      // And asking the API directly, as them, returns nothing — knowing the
      // order id buys them exactly as much as not knowing it.
      const asNosy = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${nosy.session.access_token}` } },
        },
      )
      const { data: peeked } = await asNosy
        .from('reports')
        .select('bucket_path')
        .eq('order_id', orderId)
      expect(peeked ?? [], 'a stranger must not see the report row').toHaveLength(0)
    } finally {
      await context.close()
      for (const u of [owner.user, nosy.user, staff.user]) await destroyTestUser(service, u)
    }
  })
})
