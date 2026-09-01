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
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
    },
  },
  resolve: {
    // fileURLToPath, not URL.pathname: this repo lives under a directory with
    // a space in its name, which pathname would leave percent-encoded.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
