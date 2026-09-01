import { createBrowserClient } from '@supabase/ssr'
import { supabasePublishableKey, supabaseUrl } from './env'

/** Supabase client for client components. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabasePublishableKey())
}
