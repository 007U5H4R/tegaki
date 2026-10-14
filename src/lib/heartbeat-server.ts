import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * When the keep-alive last wrote its heartbeat, as an ISO string, or null.
 *
 * A failed read is also null: the panel then warns, which is the right side
 * to err on for an alert whose silence is the failure it exists to catch.
 */
export async function getLastHeartbeat(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('last_heartbeat')
  if (error) {
    console.error('heartbeat read failed', { message: error.message })
    return null
  }
  return data ?? null
}
