import { expect, test, type Page } from '@playwright/test'

/**
 * Next injects `<div role="alert" id="__next-route-announcer__">` for screen
 * readers, so a bare getByRole('alert') matches two elements after any
 * client-side navigation. Scope to the message we actually care about, which
 * asserts the copy as well as the presence.
 */
function errorAlert(page: Page, text: string | RegExp) {
  return page.getByRole('alert').filter({ hasText: text })
}

/**
 * T01/D3 — the protected-route guard.
 *
 * This must fail loudly if the dashboard redirect is ever removed, so it
 * checks the destination rather than merely "did not render", which a blank
 * page would also satisfy.
 */
test.describe('authentication guard', () => {
  test('anonymous visitors are sent from /dashboard to /sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in$/)
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })

  test('the sign-in page states who can see a handwriting sample', async ({ page }) => {
    await page.goto('/sign-in')

    // Privacy is the pilot's central promise, so the claim is asserted rather
    // than left to survive a careless copy edit.
    await expect(page.getByText(/only ever visible to you/i)).toBeVisible()
    await expect(page.getByText(/indicative and growth-oriented/i)).toBeVisible()
  })

  test('an OAuth error is shown to the visitor, not swallowed', async ({ page }) => {
    await page.goto('/sign-in?error=Google%20said%20no')
    await expect(errorAlert(page, 'Google said no')).toBeVisible()
  })

  test('the callback rejects a request that carries no code', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/sign-in\?error=/)
    // Specific, not "something went wrong" — the least useful message a
    // sign-in screen can give.
    await expect(errorAlert(page, /missing its code/i)).toBeVisible()
  })
})
