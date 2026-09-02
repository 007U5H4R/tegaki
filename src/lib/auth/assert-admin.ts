import 'server-only'

import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export class NotAdminError extends Error {
  constructor(message = 'That area is for the analyst only.') {
    super(message)
    this.name = 'NotAdminError'
  }
}

export type AdminIdentity = { userId: string; email: string }

/**
 * Who is asking, and are they the analyst?
 *
 * Every admin server action calls this. The route guard in the admin layout
 * is separate and deliberately duplicated: a layout protects a *page*, while
 * a server action is an endpoint anybody can post to, whatever the UI
 * showed them. Route protection alone is not security.
 *
 * This is still not the last line of defence. `transition_order()` checks the
 * caller itself, so a mistake here cannot approve an order — it can only let
 * somebody see a screen they should not. Three independent checks, each of
 * which would have to fail.
 */
export async function requireAdmin(client?: SupabaseClient): Promise<AdminIdentity> {
  const supabase = client ?? (await createClient())

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new NotAdminError('You need to be signed in.')

  // Read through the caller's own client, so RLS applies. An admin reads
  // their row because they own it, not because they are an admin.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new NotAdminError('We could not check your access just then.')
  if (profile?.role !== 'admin') throw new NotAdminError()

  return { userId: user.id, email: (profile.email as string) ?? user.email ?? '' }
}

/**
 * The same question, for a page that would rather redirect than throw.
 *
 * Cached per request, because a layout and the page inside it render in
 * parallel and both must ask. Without this, every admin page view would run
 * the check twice — and, worse, a page whose layout is about to redirect a
 * stranger would still go ahead and query the queue on their behalf.
 */
export const getAdmin = cache(async (client?: SupabaseClient): Promise<AdminIdentity | null> => {
  try {
    return await requireAdmin(client)
  } catch {
    return null
  }
})
