'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Start the Google OAuth flow.
 *
 * The callback origin is derived from the incoming request rather than from
 * NEXT_PUBLIC_SITE_URL, so the same code works on localhost, on a Vercel
 * preview URL and in production without anyone remembering to change an
 * environment variable. Every origin used still has to be present in
 * Supabase's redirect allow-list — that list, not this function, is what
 * actually constrains where a user can be sent.
 */
export async function signInWithGoogle() {
  const origin = await requestOrigin()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.url) {
    redirect('/sign-in?error=Google+sign-in+is+unavailable+right+now.')
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const protocol =
    headerList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}
