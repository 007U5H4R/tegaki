import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow } from './support/overflow'
import { TIER_LIST, formatPrice } from '../src/lib/tiers'
import { FAQ } from '../src/content/faq'
import { EXCERPTS, FICTIONAL_LABEL } from '../src/content/excerpts'
import { SPECIMENS } from '../src/content/anatomy'

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
    await expect(page.getByText(/Two pages\. One human reader\./i).first()).toBeVisible()
    await expect(page.getByText(/we just know/i).first()).toBeVisible()

    // The argument, in order.
    await expect(page.getByRole('heading', { name: /from handwriting/i })).toBeVisible()
    await expect(page.getByText('Written by hand.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /how deep should we go/i })).toBeVisible()

    await expectNoHorizontalOverflow(page, 'landing')
  })

  test('the hero copy is legible over the photograph', async ({ page }, info) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const lightest = await lightestPixelBehind(page, 'h1')
    const ratio = contrastRatio(lightest, WASHI_50)

    // The hero is ivory display type on a flat terracotta wall (no photograph,
    // no scrim), so the bar is WCAG AA for text: 4.5:1. Measured against the
    // LIGHTEST pixel in the region, so this is the worst case a reader meets
    // rather than the average; the pigment texture only ever darkens the wall.
    expect(
      ratio,
      `worst-case contrast behind the h1 at ${info.project.name} was ${ratio.toFixed(2)}:1 ` +
        `(lightest background pixel rgb(${lightest.r}, ${lightest.g}, ${lightest.b}))`,
    ).toBeGreaterThanOrEqual(4.5)
  })

  test('every price comes from the tier table', async ({ page }) => {
    await page.goto('/#pricing')

    for (const tier of TIER_LIST) {
      await expect(page.getByRole('heading', { name: tier.name })).toBeVisible()
      await expect(page.getByText(formatPrice(tier.priceInr), { exact: true })).toBeVisible()
      await expect(
        page.getByText(new RegExp(`${tier.turnaroundDays} days`, 'i')).first(),
      ).toBeVisible()
    }

    // Exactly one tier may be anchored, or the anchor stops meaning anything.
    await expect(page.getByText('most people start here')).toHaveCount(1)
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

  test('shows the whole argument, not only the offer', async ({ page }) => {
    await page.goto('/')

    // Anatomy: observation and reading, kept apart.
    for (const specimen of SPECIMENS) {
      await expect(page.getByText(specimen.observation)).toBeVisible()
      await expect(page.getByText(specimen.reading)).toBeVisible()
    }

    await expect(page.getByRole('heading', { name: /read by one person/i })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Tushar Pathak' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /ready when your pen is/i })).toBeVisible()

    await expectNoHorizontalOverflow(page, 'full landing')
  })

  test('labels the sample excerpts as fictional, on the card', async ({ page }) => {
    await page.goto('/')

    // Not in a footnote: visible on the panel itself, before the words that
    // could be mistaken for somebody's real assessment.
    // The middle depth opens first — it is the one most people choose.
    await expect(page.getByText(FICTIONAL_LABEL)).toBeVisible()
    await expect(page.getByText(EXCERPTS[1]!.heading)).toBeVisible()

    // Tabs are operable from the keyboard, not just clickable.
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(EXCERPTS.length)
    await tabs.nth(1).focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByText(EXCERPTS[2]!.heading)).toBeVisible()
    await expect(page.getByText(FICTIONAL_LABEL)).toBeVisible()
  })

  test('answers the awkward questions, and says so to search engines too', async ({ page }) => {
    await page.goto('/')

    // The one that matters: the page says outright that this is not a
    // science, rather than leaving a visitor to assume otherwise.
    const honest = FAQ.find((f) => f.q === 'Is this scientific?')!
    await expect(page.getByText(honest.q)).toBeVisible()

    await page.getByText(honest.q).click()
    await expect(page.getByText(honest.a)).toBeVisible()

    // The schema and the accordion come from one array, so they cannot drift.
    const schema = await page.locator('script[type="application/ld+json"]').textContent()
    const parsed = JSON.parse(schema ?? '{}')
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(FAQ.length)
    expect(parsed.mainEntity[0].name).toBe(FAQ[0]!.q)
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe(FAQ[0]!.a)
  })

  test('makes no claim the product cannot stand behind', async ({ page }) => {
    await page.goto('/')
    const text = (await page.locator('body').innerText()).toLowerCase()

    // The rendered page, not the source — the claims guard reads the files,
    // this reads what a visitor actually sees.
    for (const banned of ['proven', 'destiny', 'guarantee', 'reveals', 'accurate']) {
      expect(text, `the page says "${banned}"`).not.toContain(banned)
    }

    // And zero testimonials until real ones exist (Solution-PRD §2).
    expect(text).not.toContain('testimonial')

    // Design.md §3.2 puts the disclaimer under the tier cards AND in the
    // footer — a visitor who scrolls straight to pricing should not have to
    // reach the bottom of the page to meet it.
    await expect(
      page.locator('#pricing').getByText(/indicative and growth-oriented/i),
    ).toBeVisible()
    await expect(
      page.getByRole('contentinfo').getByText(/indicative and growth-oriented/i),
    ).toBeVisible()
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
