import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Your assessments — Tegaki',
  robots: { index: false },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // getUser(), not getSession(): it verifies the token with the auth server
  // rather than trusting a cookie the browser handed us.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // Reading through the user's own client, so RLS is doing the work here. If
  // the policy were wrong this query would return nothing rather than someone
  // else's row.
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-shu-500 font-mono text-xs tracking-[0.08em] uppercase">
        Tegaki · 手書き
        {profile?.role === 'admin' ? ' · admin' : ''}
      </p>

      <h1 className="text-washi-50 mt-4 text-4xl">Your assessments</h1>

      <p className="text-washi-300 mt-3">
        Signed in as {profile?.full_name ? `${profile.full_name} · ` : ''}
        {profile?.email ?? user.email}
      </p>

      <div className="border-ink-700 mt-10 rounded-2xl border p-6">
        <p className="text-washi-300">
          Your orders will appear here. The submission wizard arrives in the next ticket.
        </p>
      </div>

      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="border-washi-300/40 text-washi-50 duration-press hover:border-washi-50 rounded-full border px-5 py-2 text-sm font-semibold transition-[transform,border-color] ease-out active:scale-[0.97]"
        >
          Sign out
        </button>
      </form>
    </main>
  )
}
