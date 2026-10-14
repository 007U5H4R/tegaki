# T24 report (TASK-22.1) keep-alive: A1, A2, B1, B2, C1

## Files changed
Modified: `src/app/api/cron/retention/route.ts` (authorized() moved out), `src/lib/retention/purge.ts` (serviceClient moved out), `vercel.json`, `src/app/admin/settings/page.tsx`.
New: `src/lib/cron/auth.ts`, `src/lib/supabase/service.ts`, `src/app/api/cron/keepalive/route.ts`, `src/lib/heartbeat.ts` (36h constant + pure state/relative-time), `src/lib/heartbeat-server.ts` (rpc read), `src/components/admin/heartbeat-status.tsx`, `supabase/migrations/20261014100000_heartbeat.sql`, `tests/lib/cron/keepalive.test.ts`, `tests/lib/heartbeat-status.test.ts`, `tests/rls/heartbeat.test.ts`.

## Tasks
- A1: pure move of `authorized()` to `src/lib/cron/auth.ts`; `serviceClient` to `src/lib/supabase/service.ts` (keeps `server-only`), used by retention and keep-alive. Retention tests green.
- A2: `heartbeat` table (id=1 check), RLS admin-select, no client writes; `keepalive_ping()` service_role only (raises otherwise, execute revoked from public/anon/authenticated); `last_heartbeat()` admin or service_role.
- B1: route per spec (force-dynamic, 8s AbortSignal.timeout via `.abortSignal`, 200 + `[keepalive]` line, 503 + `[keepalive] DB did not answer`, 401 without RPC).
- B2: vercel.json entry added, retention kept; comment in route (10:00 UTC = 15:30 IST).
- C1: `<HeartbeatStatus>` card under PauseSwitch; `HEARTBEAT_STALE_HOURS = 36` in `src/lib/heartbeat.ts`; warn variant has icon + role="alert" text, shows IST absolute time. Missing -> "never" + "has not run yet" warning.

## Gates
- TDD red observed: keepalive tests 5/5 failed before the route; heartbeat panel suite failed to load before the component; RLS suite 3 failed before migration.
- `pnpm exec next typegen`: types generated. `pnpm -s typecheck`: clean (after fixing a possibly-undefined in my test).
- `pnpm exec eslint .`: 0 errors, 5 warnings, all in files I did not touch (.design/exploration/_src/common.js, hero-scene.tsx).
- `node scripts/check-claims.mjs`: "Claims guard: clean."
- `pnpm vitest run tests/lib tests/rls/heartbeat.test.ts tests/rls/retention.test.ts`: Test Files 9 passed (9), Tests 81 passed (81).
- Prettier on my files: clean (repo-wide prettier --check reports 12 pre-existing unformatted files, e.g. marketing components; untouched).

## Migration
`supabase db push --dry-run` listed ONLY `20261014100000_heartbeat.sql`; then pushed it to the linked project. RLS tests pass against it.

## Deviations / notes
- Added `src/lib/heartbeat-server.ts` (separate from `heartbeat.ts`) so the pure helpers and the 36h constant are importable by tests without server-only code.
- Panel render test uses react-dom/server `renderToStaticMarkup` (no testing-library in repo; vitest only includes `*.test.ts`).
- RLS test also asserts even the analyst cannot call `keepalive_ping` (cron only) and that the table has a single row.
- Not done by design: R1, C2, D1. Not committed or pushed.
- Unrelated working-tree changes I did NOT make and did not touch: `backlog/tasks/task-8 ...` shows as deleted and `task-9 ...` as modified (another tool, likely Campfire sync). Check before committing.

## Open questions
- On first deploy the heartbeat is empty, so the admin panel warns "never" until the first cron (or D1 manual call). Expected.
