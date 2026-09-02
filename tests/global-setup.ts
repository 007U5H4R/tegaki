import { config } from 'dotenv'
import { cleanStaleFixtures } from './support/fixtures'

/**
 * Runs once per vitest run, before any suite. Playwright's signed-in spec
 * does the same thing in its own `beforeAll`, so whichever runner is used
 * first tidies up after any earlier run that died mid-flight.
 */
export async function setup() {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env.test.local', override: true, quiet: true })

  const removed = await cleanStaleFixtures()
  if (removed > 0) {
    console.log(`[fixtures] removed ${removed} stale test account(s) from a previous run`)
  }
}
