/**
 * Fail loudly and early on missing or obviously wrong configuration.
 *
 * A Supabase client built with a bad value does not throw — it returns
 * confusing auth errors at request time instead, which is a miserable way to
 * discover that a deploy inherited `https://<project-ref>.supabase.co` from
 * the example file. These helpers turn that into a named error at the point
 * of use.
 *
 * The checks are deliberately shallow: shape, not validity. Only Supabase can
 * say whether a key is real, but nothing except a mistake produces a value
 * with angle brackets in it or a secret key in a publishable slot.
 */

/** Placeholders in `.env.example` are written `<like-this>`. */
const PLACEHOLDER = /[<>]/

function read(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  if (PLACEHOLDER.test(value)) {
    throw new Error(
      `Environment variable ${name} still holds a placeholder (${value}). Replace it with the real value from the Supabase dashboard.`,
    )
  }
  return value.trim()
}

export function supabaseUrl(): string {
  const value = read('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${value}`)
  }

  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  if (parsed.protocol !== 'https:' && !isLocal) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must be https, got ${parsed.protocol}//`)
  }

  // No trailing slash: supabase-js concatenates paths onto this.
  return value.replace(/\/+$/, '')
}

/** The publishable key (formerly "anon"). Safe in a browser; RLS does the work. */
export function supabasePublishableKey(): string {
  const value = read(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )

  if (value.startsWith('sb_secret_')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a SECRET key. That key bypasses every access rule and must never be sent to a browser — rotate it in the Supabase dashboard immediately, then set the publishable key here.',
    )
  }
  if (!value.startsWith('sb_publishable_') && !value.startsWith('eyJ')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY does not look like a Supabase key (expected sb_publishable_… or a legacy anon JWT).`,
    )
  }
  return value
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

  const value = read('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY)

  if (value.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SECRET_KEY holds the publishable key. Privileged work would silently run with ordinary permissions and fail in confusing ways.',
    )
  }
  if (!value.startsWith('sb_secret_') && !value.startsWith('eyJ')) {
    throw new Error(
      'SUPABASE_SECRET_KEY does not look like a Supabase key (expected sb_secret_… or a legacy service_role JWT).',
    )
  }
  return value
}
