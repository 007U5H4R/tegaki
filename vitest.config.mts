import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Playwright owns e2e/; vitest owns unit and database-policy tests.
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // RLS tests talk to a real local Supabase, so they need room to breathe.
    testTimeout: 20_000,
    setupFiles: ['tests/setup.ts'],
    // Once per run: clears fixture accounts left behind by a run that was
    // interrupted before its afterAll could delete them.
    globalSetup: ['tests/global-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
    },
  },
  resolve: {
    alias: {
      // fileURLToPath, not URL.pathname: this repo lives under a directory
      // with a space in its name, which pathname would leave percent-encoded.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` is a build-time marker for the Next bundler and throws
      // on import anywhere else, which would make every server module
      // untestable. Stubbing it here does not weaken anything: the guard that
      // actually matters is supabaseSecretKey() refusing to read the key when
      // `window` exists, and that is asserted in tests/lib/env.test.ts.
      'server-only': fileURLToPath(new URL('./tests/support/server-only.ts', import.meta.url)),
    },
  },
})
