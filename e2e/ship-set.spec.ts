import { expect, test } from '@playwright/test'
import { POLICIES } from '../src/content/policies'
import { expectNoHorizontalOverflow } from './support/overflow'

/**
 * T13 — the ship set, and the unfurl.
 *
 * WhatsApp sharing is this pilot's entire acquisition channel, so the link
 * preview is the storefront: the first Tegaki most people ever see is a card
 * in somebody's chat. The tests below check the things that make that card
 * appear at all — absolute HTTPS URLs, and an image that actually returns
 * 200 — because both fail silently. A crawler that gets a 404 shows no
 * image and no error, and it caches that.
 */

test.describe('the ship set', () => {
  test('every link in the chrome goes somewhere real', async ({ page, request, baseURL }) => {
    await page.goto('/')

    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))

    // A link to "#" is a button wearing a link's clothes.
    expect(hrefs.filter((h) => h === '#' || h === '')).toEqual([])

    const internal = [...new Set(hrefs.filter((h) => h.startsWith('/')))]
    expect(internal.length).toBeGreaterThan(3)

    for (const href of internal) {
      const res = await request.get(new URL(href, baseURL!).toString(), {
        maxRedirects: 0,
        failOnStatusCode: false,
      })
      // 200 or a redirect (the dashboard sends anonymous visitors to sign-in).
      expect(res.status(), `${href} is dead`).toBeLessThan(400)
    }
  })

  test('the policy pages exist and read', async ({ page }) => {
    for (const policy of POLICIES) {
      await page.goto(`/${policy.slug}`)
      await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible()
      await expect(page.getByText(/last updated/i)).toBeVisible()

      // The commitments a customer is most likely to be checking for.
      const body = await page.locator('article').innerText()
      expect(body.length, `${policy.slug} is thin`).toBeGreaterThan(600)

      await expectNoHorizontalOverflow(page, `/${policy.slug}`)
    }
  })

  test('the privacy page states the promises the product actually makes', async ({ page }) => {
    await page.goto('/privacy')
    const body = (await page.locator('article').innerText()).toLowerCase()

    // These are Solution-PRD positions, not decoration. If the policy stops
    // saying them, either the policy or the product has drifted.
    expect(body).toContain('90 days')
    expect(body).toContain('you and your analyst')
    expect(body).toContain('delete')
  })

  test('the refund page is honest that the pilot takes no payment', async ({ page }) => {
    await page.goto('/refunds')
    const body = (await page.locator('article').innerText()).toLowerCase()
    expect(body).toContain('no money is taken')
    expect(body).toContain('fourteen days')
  })

  test('contact offers a real address and no dead deep-link', async ({ page }) => {
    await page.goto('/contact')

    const mailto = page.locator('a[href^="mailto:"]').first()
    await expect(mailto).toBeVisible()
    await expect(mailto).toHaveAttribute('href', /^mailto:[^@\s]+@[^@\s]+$/)

    // No WhatsApp link until a real number exists. A dead wa.me link on the
    // page somebody reaches BECAUSE their order is stuck would be the worst
    // possible place for one.
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0)
  })

  test('a junk route gets the branded 404, not a stack trace', async ({ page }) => {
    const res = await page.goto('/this-route-does-not-exist')
    expect(res?.status()).toBe(404)

    await expect(page.getByRole('heading', { name: /isn.t in our files/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /back to the start/i })).toBeVisible()
  })

  test('the link preview is complete, absolute, and actually fetchable', async ({
    page,
    request,
    baseURL,
  }) => {
    await page.goto('/')

    // Absolute always; HTTPS specifically when this runs against the deployed
    // site, which is the only place a crawler will ever read these tags.
    const deployed = baseURL!.startsWith('https://')

    const meta = async (selector: string) => page.locator(selector).first().getAttribute('content')

    const image = await meta('meta[property="og:image"]')
    const url = await meta('meta[property="og:url"]')

    // Root-relative URLs silently fail on LinkedIn and WhatsApp — the card
    // renders with no image and no complaint.
    const scheme = deployed ? /^https:\/\// : /^https?:\/\//
    expect(image, 'og:image must be an absolute URL').toMatch(scheme)
    expect(url, 'og:url must be an absolute URL').toMatch(scheme)

    // On the deployed site the tags must point at the deployed site, not at
    // whatever host the build happened to know about.
    if (deployed) {
      expect(new URL(image!).origin, 'og:image points at another host').toBe(
        new URL(baseURL!).origin,
      )
    }

    expect(await meta('meta[property="og:title"]')).toBeTruthy()
    expect(await meta('meta[property="og:description"]')).toBeTruthy()
    expect(await meta('meta[property="og:site_name"]')).toBe('Tegaki')
    expect(await meta('meta[property="og:image:width"]')).toBe('1200')
    expect(await meta('meta[property="og:image:height"]')).toBe('630')
    expect(await meta('meta[property="og:image:alt"]')).toBeTruthy()
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image')

    const description = await meta('meta[name="description"]')
    expect(
      description!.length,
      'description is over the 155-char display limit',
    ).toBeLessThanOrEqual(160)

    // The image must exist where the tag says it does. A cached 404 is what
    // makes a preview look "broken" forever.
    //
    // Deployed: fetch the exact URL a crawler will fetch. Locally the tag
    // carries whatever NEXT_PUBLIC_SITE_URL says, which is not the port the
    // test server is on — so the path is resolved against the host under
    // test, which still proves the file is served.
    const target = deployed ? image! : new URL(new URL(image!).pathname, baseURL!).toString()
    const res = await request.get(target, { failOnStatusCode: false })
    expect(res.status(), `${target} did not return 200`).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
    expect(Number(res.headers()['content-length'] ?? 0)).toBeLessThan(300_000)
  })

  test('the favicon and touch icon are served', async ({ request, baseURL }) => {
    for (const path of ['/icon.svg', '/apple-icon.png']) {
      const res = await request.get(new URL(path, baseURL!).toString(), {
        failOnStatusCode: false,
      })
      expect(res.status(), `${path} is missing`).toBe(200)
    }
  })
})
