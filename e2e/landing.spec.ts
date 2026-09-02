import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow } from './support/overflow'
import { TIER_LIST, formatPrice } from '../src/lib/tiers'

/**
 * T11 — the landing page.
 *
 * The interesting test here is the contrast one. Design.md §5.1 says hero
 * copy over photography needs a scrim taking it to ≥7:1, and that is a claim
 * about *rendered pixels*, not about a class name. So the spec screenshots
 * the region behind the heading, finds the lightest pixel in it, and computes
 * the real ratio against the text colour. A scrim tuned by eye and asserted
 * by hope is how illegible heroes ship.
 */

const WASHI_50 = { r: 0xf7, g: 0xe8, b: 0xd2 } // --color-washi-50, sRGB

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** The lightest pixel behind the heading — the worst case the reader meets. */
async function lightestPixelBehind(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox()
  if (!box) throw new Error(`no bounding box for ${selector}`)

  // Screenshot the heading's own region with the text hidden, so what is
  // measured is the background the text sits on rather than the text itself.
  await page.locator(selector).evaluate((el) => {
    ;(el as HTMLElement).style.visibility = 'hidden'
  })
  const shot = await page.screenshot({ clip: box })
  await page.locator(selector).evaluate((el) => {
    ;(el as HTMLElement).style.visibility = ''
  })

  // Decode the PNG in the browser, where there is a canvas.
  return page.evaluate(async (bytes) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' })
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    let best = { r: 0, g: 0, b: 0, lum: -1 }
    const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      const l = lum(r, g, b)
      if (l > best.lum) best = { r, g, b, lum: l }
    }
    return { r: best.r, g: best.g, b: best.b }
  }, Array.from(shot))
}

test.describe('the landing page', () => {
  test('renders the whole argument, and reads on a phone', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your handwriting')
    await expect(page.getByText(/handwriting analysis/i).first()).toBeVisible()
    await expect(page.getByText(/hand-validated by Tushar Pathak/i)).toBeVisible()

    // The argument, in order.
    await expect(page.getByRole('heading', { name: /three steps/i })).toBeVisible()
    await expect(page.getByText('Written by hand.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /how deep should we go/i })).toBeVisible()

    await expectNoHorizontalOverflow(page, 'landing')
  })

  test('the hero copy is legible over the photograph', async ({ page }, info) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const lightest = await lightestPixelBehind(page, 'h1')
    const ratio = contrastRatio(lightest, WASHI_50)

    // Design.md §5.1: hero copy over photography requires a scrim to ≥7:1.
    // Measured against the LIGHTEST pixel in the region, so this is the worst
    // case a reader meets rather than the average.
    expect(
      ratio,
      `worst-case contrast behind the h1 at ${info.project.name} was ${ratio.toFixed(2)}:1 ` +
        `(lightest background pixel rgb(${lightest.r}, ${lightest.g}, ${lightest.b}))`,
    ).toBeGreaterThanOrEqual(7)
  })

  test('every price comes from the tier table', async ({ page }) => {
    await page.goto('/#pricing')

    for (const tier of TIER_LIST) {
      await expect(page.getByRole('heading', { name: tier.name })).toBeVisible()
      await expect(page.getByText(formatPrice(tier.priceInr), { exact: true })).toBeVisible()
      await expect(
        page.getByText(new RegExp(`${tier.turnaroundDays}-day turnaround`, 'i')).first(),
      ).toBeVisible()
    }

    // Exactly one tier may be anchored, or the anchor stops meaning anything.
    await expect(page.getByText('Most popular')).toHaveCount(1)
  })

  test('is complete with JavaScript switched off', async ({ browser }) => {
    // The reveals hide content by default only once JS has armed them. With
    // no JS the page must simply read — including the tagline, which is the
    // one most likely to be left invisible by a scroll-triggered effect.
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      await page.goto('/')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Written by hand.')).toBeVisible()
      await expect(page.getByText('Read with care.')).toBeVisible()
      await expect(page.getByRole('heading', { name: /how deep should we go/i })).toBeVisible()

      for (const tier of TIER_LIST) {
        await expect(page.getByRole('heading', { name: tier.name })).toBeVisible()
      }
    } finally {
      await context.close()
    }
  })

  test('the nav reaches every section it names', async ({ page }) => {
    await page.goto('/')

    for (const [label, id] of [
      ['How it works', 'how'],
      ['Pricing', 'pricing'],
      ['Samples', 'samples'],
      ['FAQ', 'faq'],
    ] as const) {
      await expect(page.locator(`#${id}`), `${label} has nowhere to go`).toHaveCount(1)
    }
  })

  test('offers a skip link before anything else', async ({ page }) => {
    await page.goto('/')

    const skip = page.getByRole('link', { name: /skip to content/i })

    // Asserted by DOM order and by what focus does to it, rather than by
    // pressing Tab: Safari only tabs to links when Full Keyboard Access is
    // on, so a Tab-based assertion would be testing the browser's setting
    // rather than the page.
    const firstFocusable = page
      .locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .first()
    await expect(firstFocusable).toHaveAttribute('href', '#main')

    await skip.focus()
    await expect(skip).toBeFocused()
    // sr-only until focused — it must genuinely appear, not merely exist.
    const box = await skip.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(40)
  })
})
