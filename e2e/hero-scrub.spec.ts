import { expect, test } from '@playwright/test'

/**
 * T14 — the scroll-scrub, and the thing it must never do.
 *
 * The frame set is 6.8 MB. Design.md is explicit that the scrub is a desktop
 * enhancement and never a mobile data tax, and this product's audience is on
 * mid-range Android over Indian mobile data. So the most important test here
 * is not that the film plays — it is that a phone, a visitor who asked for
 * reduced motion, and a page without JavaScript **never request a single
 * frame**.
 */

const FRAME = /\/hero\/hero_\d{3}\.jpg/

test.describe('the hero scrub', () => {
  test('a phone never downloads a frame', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (r) => {
      if (FRAME.test(r.url())) requested.push(r.url())
    })

    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(1500)

    expect(requested, `a phone fetched ${requested.length} frames`).toEqual([])
    // And it still gets a complete hero.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('img', { name: /fountain pen writing/i })).toBeVisible()
  })

  test('a visitor who asked for less motion never downloads a frame', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    })
    try {
      const page = await context.newPage()
      const requested: string[] = []
      page.on('request', (r) => {
        if (FRAME.test(r.url())) requested.push(r.url())
      })

      await page.goto('/')
      await page.mouse.wheel(0, 2000)
      await page.waitForTimeout(1500)

      expect(requested, `reduced motion fetched ${requested.length} frames`).toEqual([])
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('a page without JavaScript never downloads a frame', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    })
    try {
      const page = await context.newPage()
      const requested: string[] = []
      page.on('request', (r) => {
        if (FRAME.test(r.url())) requested.push(r.url())
      })

      await page.goto('/')
      expect(requested).toEqual([])
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('an eligible desktop plays the film, both directions', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    try {
      const page = await context.newPage()
      const errors: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })

      await page.goto('/')

      // The canvas only exists for eligible visitors.
      const canvas = page.locator('canvas')
      await expect(canvas).toHaveCount(1)

      // Frames are fetched only once eligibility is known.
      await page.waitForResponse((r) => FRAME.test(r.url()), { timeout: 30_000 })

      const at = async (fraction: number) => {
        await page.evaluate((f) => {
          const el = document.querySelector('section.relative') as HTMLElement
          window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * f)
        }, fraction)
        await page.waitForTimeout(450)
        return canvas.screenshot()
      }

      const start = await at(0)
      const middle = await at(0.5)
      const end = await at(0.98)

      // Different frames, so the scrub is actually scrubbing.
      expect(Buffer.compare(start, middle), 'the canvas did not change').not.toBe(0)
      expect(Buffer.compare(middle, end), 'the canvas did not change').not.toBe(0)

      // Backwards too — the failure mode of an index-cached painter.
      const backToStart = await at(0)
      expect(Buffer.compare(backToStart, middle), 'scrubbing back did not repaint').not.toBe(0)

      // The h1 and its CTA are present throughout: they are the page's
      // primary action and may not depend on a scroll position.
      await expect(page.getByRole('heading', { level: 1 })).toBeAttached()
      await expect(
        page.getByRole('link', { name: /begin your assessment/i }).first(),
      ).toBeAttached()

      expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([])
    } finally {
      await context.close()
    }
  })
})
