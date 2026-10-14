import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseSecretKey, supabaseUrl } from '@/lib/supabase/env'

/**
 * The service-role client, used by the scheduled jobs and the test suite only.
 *
 * The retention job has no user to act as — it runs at 03:30 with nobody
 * signed in — and the rows it must reach belong to every customer at once.
 * That is the one shape of work RLS cannot express, so it is the one place
 * in the app this key is allowed. The keep-alive shares it for the same
 * reason: nobody is signed in when the cron fires.
 */
export function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
