import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env'

/**
 * Session refresh on every request.
 *
 * Next.js 16 renamed the middleware convention to `proxy`. Its own docs are
 * explicit that this layer is for optimistic checks and is NOT a session
 * management or authorization solution — so this file refreshes the auth
 * cookie and does nothing else. Every real access decision is made in a
 * server component or server action, where it can be trusted.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Touching getUser() is what actually refreshes an expiring token. Do not
  // remove it, and do not run code between creating the client and this call.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Auth cookies are
     * irrelevant to those, and running on them wastes a function invocation
     * per asset.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?)$).*)',
  ],
}
