import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback. Exchanges the one-time code for a session cookie.
 *
 * Errors redirect back to sign-in carrying a specific message rather than a
 * generic failure, because "something went wrong" on a sign-in screen is the
 * least actionable message in software.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Google reports user-facing refusals (for example a denied consent screen)
  // here rather than as a failed exchange.
  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) {
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(providerError)}`)
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent('That sign-in link was missing its code. Please try again.')}`,
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  // Only same-origin relative paths, so a crafted `next` cannot bounce a
  // freshly authenticated user off to another site.
  const destination = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${destination}`)
}
