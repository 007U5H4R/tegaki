import 'server-only'

import { createClient } from '@/lib/supabase/server'

export const PAUSE_KEY = 'pause_new_orders'

/**
 * The message a customer sees when the shop is shut.
 *
 * Written once, and worded so it answers the question it provokes: is my
 * existing order affected? It is not, and saying so is the difference between
 * a closed sign and an alarming one.
 */
export const PAUSED_MESSAGE =
  'Tegaki is temporarily closed to new orders — existing orders are unaffected.'

/**
 * Is the shop closed to new orders?
 *
 * This is a *display* question. Enforcement lives in a trigger on `orders`
 * (T10's migration), because hiding a button is not enforcement and neither
 * is an application check that a direct API insert walks straight past.
 */
export async function isPaused(): Promise<boolean> {
  const supabase = await createClient()

  // Through `is_paused()`, the same security-definer function the trigger on
  // `orders` consults. Reading the table directly worked for a signed-in
  // customer and failed with "permission denied" for an anonymous one, which
  // is the wrong shape for a question whose answer is a closed sign.
  const { data, error } = await supabase.rpc('is_paused')

  // Fail open, deliberately. A settings read that errors should not close a
  // working shop — the trigger is what actually holds the door, so the worst
  // case here is a customer who is told the truth a moment late.
  if (error) {
    console.error('settings read failed', { key: PAUSE_KEY, message: error.message })
    return false
  }

  return data === true
}
