/**
 * Stub for the `server-only` package under Vitest.
 *
 * The real module throws on import to stop a server module being pulled into
 * a client bundle. That is a bundler concern; a node test runner importing
 * the same file is exactly the case it is not meant to catch, and without
 * this alias every `import 'server-only'` module in src/lib would be
 * untestable.
 *
 * Wired up in vitest.config.ts. The guard that genuinely protects the secret
 * key is the `typeof window` check in src/lib/supabase/env.ts.
 */
export {}
