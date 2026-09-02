import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteNav } from '@/components/marketing/site-nav'
import { createClient } from '@/lib/supabase/server'

/**
 * The public shell.
 *
 * A route group, so the landing page keeps `/` while getting a layout the
 * signed-in surfaces do not share.
 *
 * The nav needs to know whether somebody is signed in — a returning customer
 * should be offered their dashboard, not asked to begin again. That is the
 * only reason this layout touches auth, and getting it wrong costs a wrong
 * label rather than access to anything.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      {/* Design.md §5.2 requires it, and it is the first thing a keyboard
          user meets. Visible only when focused. */}
      <a
        href="#main"
        className="bg-shu-600 text-washi-50 focus-visible:outline-washi-50 sr-only rounded-full px-5 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>

      <SiteNav signedIn={Boolean(user)} />

      <main id="main">{children}</main>

      <SiteFooter />
    </>
  )
}
