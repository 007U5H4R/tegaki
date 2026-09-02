import { expect, type Page } from '@playwright/test'

/**
 * The mandatory no-horizontal-scroll gate (Design.md §5.2).
 *
 * Extracted from responsive-gate.spec.ts when the wizard needed it: those
 * pages sit behind authentication, so they cannot be swept by the anonymous
 * page list and have to assert as they are walked through.
 *
 * Names the widest offending element, because "something overflows" is a
 * much slower thing to fix than "this div does".
 */
export async function expectNoHorizontalOverflow(page: Page, where: string): Promise<void> {
  const { scrollWidth, clientWidth, offender } = await page.evaluate(() => {
    const doc = document.documentElement
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

  expect(
    scrollWidth,
    `${where} overflows horizontally; widest offending element: ${offender ?? 'none'}`,
  ).toBeLessThanOrEqual(clientWidth + 1)
}
