import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

// The signed-in specs create their own throwaway users, so the test process
// needs the same Supabase credentials the app runs on.
loadEnv({ path: '.env.local', quiet: true })
loadEnv({ path: '.env.test.local', override: true, quiet: true })

// Keep browser profiles on the same volume as the repo.
//
// Playwright writes a fresh profile per worker into the OS temp directory,
// which lives on the boot disk. This repo does not, and when that disk ran
// low the suite started failing with ENOSPC at browser launch — which
// surfaced as a *different* test failing on each run and looked exactly like
// a race condition. Half an hour went into chasing the wrong thing.
//
// `__dirname`, not `import.meta.url`: Playwright loads this config as
// CommonJS, where import.meta does not exist. It is also the config file's
// own directory rather than the caller's cwd, so this holds wherever the
// suite is started from.
const browserTmp = resolve(__dirname, '.playwright-tmp')
mkdirSync(browserTmp, { recursive: true })
process.env.TMPDIR = browserTmp

// The browser binaries themselves (~850 MB) default to ~/Library/Caches on
// the boot disk. Same reasoning: this machine's internal volume is the scarce
// one, so they live beside the other build caches on the external drive.
// Overridable, so CI — which has its own clean filesystem — is unaffected.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/Volumes/E Drive/Dev/.caches/ms-playwright'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // The PRD's real bar is "trustworthy and premium on a phone", so the
    // mobile viewport is a first-class project, not an afterthought.
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  // Reuse an already-running dev server locally; start one in CI.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
