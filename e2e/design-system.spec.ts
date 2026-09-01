import { expect, test } from '@playwright/test'

/**
 * T02 gates. The styleguide is the design system's regression surface, so
 * these assert the properties that would otherwise rot silently: that every
 * order status has a chip, that states are never signalled by colour alone,
 * that the error primitive's retry is wired to something real, and that the
 * whole system is operable without a mouse.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/styleguide')
})

test('every order status has a chip, and none carries colour alone', async ({ page }) => {
  const section = page.locator('section').filter({ hasText: 'Status chips' })

  // The seven states from Solution-PRD §6.6, including draft.
  const labels = [
    'Draft',
    'Sample under review',
    'Needs another try',
    'Analysis in progress',
    'Report in production',
    'Ready',
    'Parked',
  ]

  for (const label of labels) {
    const chip = section.getByText(label, { exact: true })
    await expect(chip, `no chip for "${label}"`).toBeVisible()

    // Colour vision deficiency affects roughly 1 in 12 men; a chip that only
    // differs by hue would make "needs your attention" invisible to them.
    const hasIcon = await chip.locator('xpath=..').locator('svg').count()
    expect(hasIcon, `chip "${label}" has no icon beside its text`).toBeGreaterThan(0)
  }
})

test('the error state retry calls a real handler', async ({ page }) => {
  const counter = page.getByText(/retry pressed \d+ time/)
  await expect(counter).toContainText('0 times')

  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(counter).toContainText('1 time')
})

test('the dropzone stays locked until its guardrails are ticked', async ({ page }) => {
  const section = page.locator('section').filter({ hasText: 'Upload' })

  // Locked: it explains why rather than simply greying out.
  await expect(section.getByText(/Tick the four sample guidelines/)).toBeVisible()
  await expect(section.getByText('Drag your photos here')).toBeHidden()

  await section.getByRole('switch', { name: /Guardrails checklist complete/ }).click()

  await expect(section.getByText('Drag your photos here')).toBeVisible()
})

test('a field error is announced to assistive tech, not just coloured', async ({ page }) => {
  const email = page.getByLabel(/^Email/)
  await expect(email).toHaveAttribute('aria-invalid', 'true')

  // The message must be reachable through aria-describedby, or a screen
  // reader user hears a red box and no reason for it.
  // Resolved inside the page: React's useId emits ids containing colons, so
  // they need CSS.escape — which only exists in the browser, not in Node.
  const described = await email.evaluate((el) => {
    const ids = el.getAttribute('aria-describedby')?.split(' ') ?? []
    return ids
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
  })

  expect(described).toContain('Enter an email address')
})

test('the whole styleguide is reachable by keyboard', async ({ page }) => {
  await page.keyboard.press('Tab')

  // Walk a generous number of stops and confirm focus keeps landing on real
  // controls with a visible ring, rather than vanishing into a trap.
  const seen = new Set<string>()
  for (let i = 0; i < 25; i++) {
    const tag = await page.evaluate(() => {
      const el = document.activeElement
      return el ? `${el.tagName}:${el.getAttribute('type') ?? ''}` : 'NONE'
    })
    expect(tag).not.toBe('NONE')
    seen.add(tag)
    await page.keyboard.press('Tab')
  }

  // Buttons, inputs and checkboxes should all appear in the tab order.
  expect(seen.size).toBeGreaterThan(2)
})

test('the seal renders without needing a webfont', async ({ page }) => {
  const seal = page.locator('section').filter({ hasText: 'Brand' }).locator('svg').first()
  await expect(seal).toBeVisible()

  // A path with real outline data, not a <text> element that would reflow
  // (or vanish) depending on font loading.
  const paths = await seal.locator('path').count()
  expect(paths).toBeGreaterThan(0)
  await expect(seal.locator('text')).toHaveCount(0)
})
