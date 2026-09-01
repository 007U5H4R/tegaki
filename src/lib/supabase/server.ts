import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabasePublishableKey, supabaseUrl } from './env'

/**
 * Supabase client for server components, server actions and route handlers.
 *
 * Must be created per request — never hoisted to a module-level singleton,
 * because it closes over that request's cookies and a shared instance would
 * leak one user's session into another's request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server components cannot set cookies. That is fine: the proxy
          // refreshes the session on every request, so the write here is
          // redundant rather than lost.
        }
      },
    },
  })
}
