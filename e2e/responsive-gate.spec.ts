import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow } from './support/overflow'

/**
 * The mandatory responsive gate from Design.md §5.2, applied to every page as
 * it lands. Each ticket adds its routes here rather than writing a fresh copy
 * of this test.
 *
 * "No horizontal scroll at 375px" is the PRD's stated bar, and it is the
 * failure that most often ships unnoticed because desktop looks fine.
 *
 * /styleguide earns its place here beyond its own sake: it renders every
 * primitive at once, so if any single component overflows on a phone, this
 * catches it before a real screen ever uses that component.
 */
const PAGES = ['/', '/sign-in', '/styleguide'] as const

test.describe('responsive gate', () => {
  for (const path of PAGES) {
    test(`${path} has no horizontal overflow at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(path)
      await expectNoHorizontalOverflow(page, path)
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
  // The mark now appears in the nav, the hero and the footer, so this asks
  // the first one rather than all of them.
  const jp = page.getByText('手書き').first()
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
