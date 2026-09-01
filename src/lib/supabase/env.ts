/**
 * Fail loudly and early on missing configuration.
 *
 * A Supabase client built with `undefined` keys does not throw — it just
 * returns auth errors at runtime, which is a miserable thing to debug. These
 * helpers turn a config mistake into an immediate, named error instead.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value
}

export function supabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

/** The publishable key (formerly "anon"). Safe in a browser; RLS does the work. */
export function supabasePublishableKey(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}

/**
 * The secret key (formerly "service_role"). Bypasses RLS completely.
 *
 * Only the retention cron (T15) and the test suite may call this. If you are
 * reaching for it inside a request handler, the answer is almost always an
 * RLS policy instead.
 */
export function supabaseSecretKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('SUPABASE_SECRET_KEY must never be read in the browser.')
  }
  return required('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY)
}
