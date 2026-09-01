import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signInWithGoogle } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sign in — Tegaki',
  robots: { index: false },
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-shu-500 font-mono text-xs tracking-[0.08em] uppercase">
          Tegaki · 手書き
        </p>

        <h1 className="text-washi-50 mt-4 text-4xl">Sign in</h1>

        <p className="text-washi-300 mt-3">
          Your assessments live in your account, so a handwriting sample is only ever visible to you
          and to your analyst.
        </p>

        {error ? (
          <p
            role="alert"
            className="border-err-500/40 bg-err-500/10 text-washi-50 mt-6 rounded-lg border px-4 py-3 text-sm"
          >
            {error}
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mt-8">
          <button
            type="submit"
            className="bg-shu-600 text-washi-50 duration-press hover:bg-shu-700 w-full rounded-full px-6 py-3 text-base font-semibold transition-[transform,background-color] ease-out active:scale-[0.97]"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-ink-500 mt-8 text-xs">
          Insights are indicative and growth-oriented — never diagnostic.
        </p>
      </div>
    </main>
  )
}
