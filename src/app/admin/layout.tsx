import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lockup } from '@/components/brand/lockup'
import { Button } from '@/components/ui/button'
import { DashedRule } from '@/components/ui/card'
import { signOut } from '@/lib/auth/actions'
import { getAdmin } from '@/lib/auth/assert-admin'

export const metadata: Metadata = {
  title: 'Queue — Tegaki',
  robots: { index: false, follow: false },
}

/**
 * The analyst's side of the product.
 *
 * A signed-in buyer who guesses this URL is sent to their own dashboard
 * rather than to a refusal: they have done nothing wrong, and a wall would
 * only confirm that something is here. Anonymous visitors go to sign-in.
 *
 * This guard protects pages. It is not what protects the *work* — every
 * admin action re-checks, and `transition_order()` checks again in the
 * database. See `src/lib/auth/assert-admin.ts`.
 *
 * No decorative motion anywhere in here (Design.md §3.7): this is a screen
 * Tushar will use dozens of times a week, and animation on a tool that
 * frequent stops being delight and becomes latency.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin()
  if (!admin) redirect('/dashboard')

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" aria-label="Tegaki queue">
            <Lockup />
          </Link>
          <span className="border-shu-500 text-shu-500 rounded-full border px-3 py-1 font-mono text-xs tracking-[0.08em] uppercase">
            Analyst
          </span>
        </div>

        {/* Wraps: this row gained a Settings link in T10 and stopped fitting
            a 375px screen, which the responsive gate caught. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-washi-300 hidden font-mono text-xs sm:block">{admin.email}</p>
          <Button asChild variant="quiet" size="sm">
            <Link href="/admin/settings">Settings</Link>
          </Button>
          <Button asChild variant="quiet" size="sm">
            <Link href="/dashboard">My assessments</Link>
          </Button>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <DashedRule className="my-8" />

      <main>{children}</main>
    </div>
  )
}
