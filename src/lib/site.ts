/**
 * Where this site lives, as an absolute URL.
 *
 * Open Graph and Twitter cards require absolute HTTPS URLs — a root-relative
 * `/og-cover.png` silently fails on LinkedIn and WhatsApp, and the failure
 * looks exactly like no image at all rather than like a mistake. Since
 * WhatsApp sharing is this pilot's entire acquisition channel, that is the
 * storefront quietly not opening.
 *
 * Falls back to the production host rather than to localhost: a crawler that
 * reached a build with the variable missing would cache a link to a machine
 * it cannot see, and cached failures are the expensive kind.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tegaki-one.vercel.app')
  .trim()
  .replace(/\/+$/, '')

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
