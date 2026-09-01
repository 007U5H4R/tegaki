import { expect, test } from '@playwright/test'

/**
 * The mandatory responsive gate from Design.md §5.2, applied to every page as
 * it lands. Right now that is only the token specimen; each later ticket adds
 * its routes to PAGES rather than writing a fresh copy of this test.
 *
 * "No horizontal scroll at 375px" is the PRD's stated bar, and it is the
 * failure that most often ships unnoticed because desktop looks fine.
 */
const PAGES = ['/'] as const

test.describe('responsive gate', () => {
  for (const path of PAGES) {
    test(`${path} has no horizontal overflow at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(path)

      const { scrollWidth, clientWidth, offender } = await page.evaluate(() => {
        const doc = document.documentElement
        // Name the widest offending element so a failure says what to fix.
        let offender: string | null = null
        let widest = doc.clientWidth
        for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
          const right = el.getBoundingClientRect().right
          if (right > widest + 1) {
            widest = right
            offender = `${el.tagName.toLowerCase()}.${el.className || '(no class)'}`
          }
        }
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offender }
      })

      expect(scrollWidth, `widest overflowing element: ${offender ?? 'none'}`).toBeLessThanOrEqual(
        clientWidth + 1,
      )
    })

    test(`${path} renders its content at 768px`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(path)
      await expect(page.locator('main')).toBeVisible()
    })
  }
})

test('the brand glyphs render with the subset Japanese face', async ({ page }) => {
  await page.goto('/')
  const jp = page.getByText('手書き')
  await expect(jp).toBeVisible()

  // Guards the 1.3 KB subset wiring (Design.md §2.2). The family name is
  // derived by next/font from the import identifier, so assert on that and
  // then confirm the face genuinely loaded rather than silently falling back.
  const family = await jp.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('notoSerifJp')

  await page.waitForFunction(() => document.fonts.status === 'loaded')
  const loaded = await page.evaluate(() =>
    Array.from(document.fonts).some(
      (f) => f.family.includes('notoSerifJp') && f.status === 'loaded',
    ),
  )
  expect(loaded, 'the subset Japanese face did not load').toBe(true)
})
