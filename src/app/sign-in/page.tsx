import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lockup } from '@/components/brand/lockup'
import { signInWithGoogle } from '@/lib/auth/actions'
import { DISCLAIMER } from '@/lib/copy'
import { createClient } from '@/lib/supabase/server'
import { isTier, TIER_DETAILS } from '@/lib/tiers'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
}

/**
 * Sign in, on the same cream paper as the landing page.
 *
 * The landing page's tier buttons arrive here with `?tier=`, and the page
 * says so — "you were looking at Core Personality" — rather than dropping
 * the choice on the floor. The wizard still asks for the depth explicitly,
 * so nothing here pre-commits anyone; it only keeps the thread.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tier?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { error, tier } = await searchParams
  const chosen = isTier(tier) ? TIER_DETAILS[tier] : null

  return (
    <main className="bg-paper-50 text-inkl-900 grain flex min-h-dvh flex-col px-5 py-8 sm:px-8">
      <div className="relative z-[1] flex items-center justify-between">
        <Link href="/" aria-label="Tegaki — home">
          <Lockup tone="ink" />
        </Link>
        <Link href="/" className="link-fine text-[0.95rem] font-medium">
          Back to the page
        </Link>
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-16">
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.4rem)] leading-[1] font-bold tracking-[-0.015em]">
          Sign in to send
          <br />
          your two pages.
        </h1>

        <p className="mt-5 text-[1.05rem] leading-relaxed opacity-85">
          Your assessments live in your account, so a handwriting sample is only ever visible to you
          and to your analyst.
        </p>

        {chosen ? (
          <p className="font-hand text-pencil-600 mt-6 -rotate-1 text-[1.35rem] leading-tight font-medium">
            you were looking at {chosen.name} — we&rsquo;ll ask again inside, no rush.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="border-pencil-500/50 bg-pencil-500/10 mt-6 border px-4 py-3 text-sm"
          >
            {error}
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mt-9">
          <button
            type="submit"
            className="cta-ink font-hand inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full px-7 py-3 text-[1.4rem] leading-none font-semibold"
          >
            <span>Continue with Google</span>
            <span className="cta-arrow" aria-hidden>
              →
            </span>
          </button>
        </form>

        <p className="mt-8 text-[0.85rem] opacity-65">{DISCLAIMER}</p>
      </div>
    </main>
  )
}
