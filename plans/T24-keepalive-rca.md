# Plan — T24 · Supabase keep-alive and the pause RCA

> **Ticket:** T24 · Campfire TASK-22.1 · **Phase 6 (ships first)** · **Blocked by:** —.
> **Delivers:**
> - A daily scheduled job that **writes** a heartbeat and fails loudly when the database doesn't answer.
> - A stale-heartbeat panel in admin.
> - A written root cause of the 2026-10-13 pause, plus a regression guard for it.
>
> **Read first:** `technical-plan.md` §3.1, §3.2, §9.1 · `src/app/api/cron/retention/route.ts` · `vercel.json` · `e2e/retention-cron.spec.ts`.

## Design decisions locked here
- **A write, not a read** (§9.1). Supabase pauses on low *database* activity and doesn't define what counts. A write is the unambiguous kind.
- **A separate route on a different hour** (TP7). The two routes are independent, and the database gets touched twice a day.
- **The RCA comes before the fix is called done.** If the cause turns out to be H1 (the secret was missing from the deployment), the keep-alive alone wouldn't have saved us, because it shares the same secret.

## Tasks

**R1 · RCA evidence (do first; read-only).** Follow `technical-plan.md` §3.2 steps 1–5:
- Tushar opens Supabase → Reports / Usage (API + database requests, 2026-09-29 → 10-13). He shares a screenshot or the numbers.
- From Vercel → Cron Jobs, record the jobs, the enabled state and the last run.
- From Vercel → Env Vars, record when `CRON_SECRET` was last updated. Record the date only, **never the value**.
- Tushar searches his Supabase-account inbox for the pause warning and the pause notice.
- Call `curl -s -o /dev/null -w '%{http_code}' https://<prod>/api/cron/retention` with no header; expect 401.

Write **RCA1** in `decisions.md`: what was observed, the cause (or "most likely, with evidence X"), and the guard chosen.

*Gate:* Tushar reads RCA1.

**A1 · Extract `src/lib/cron/auth.ts`**
- Move `authorized()` out of the retention route and import it back into the route. This is a move, not a change.

*Gate:* existing retention route tests and `e2e/retention-cron.spec.ts` stay green.

**A2 · Migration `…_heartbeat.sql`**
- `heartbeat(id int primary key check (id = 1), beat_at timestamptz not null)`.
- RLS on: admins may select; there are no client writes.
- `keepalive_ping()`: security definer, service_role only. It upserts `beat_at = now()` and returns the previous `beat_at`.
- `last_heartbeat()`: for admins.

*Gate:* RLS tests:
- a buyer can't read or ping
- the service role can ping, and the second ping returns the first ping's time

**B1 · Route `src/app/api/cron/keepalive/route.ts`**
- `force-dynamic`, then `authorized()`, then the service client (from `purge.ts`'s `serviceClient`, extracted to `src/lib/supabase/service.ts` if it isn't shared yet).
- Calls `rpc('keepalive_ping')` with `AbortSignal.timeout(8000)`.
- Success: `console.log('[keepalive]', JSON.stringify({ ok: true, ms, previousBeatAt }))` and 200.
- Error or timeout: `console.error('[keepalive] DB did not answer', message)` and **503**.

*Gate:* `tests/lib/cron/keepalive.test.ts` with a stubbed client:
- healthy → 200 plus one info line
- RPC error → 503 plus an error line
- timeout → 503
- no or wrong secret → 401, with no RPC called

**B2 · Schedule**
- In `vercel.json`, add `{ "path": "/api/cron/keepalive", "schedule": "0 10 * * *" }`.
- Note in the route's comment: 10:00 UTC = 15:30 IST, 12 hours from retention.

*Gate:* JSON is valid. After deploy, Vercel → Cron Jobs lists both.

**C1 · Stale-heartbeat panel**
- On `/admin/settings`, show "Last database heartbeat: <relative time>".
- If it's older than 36 hours, or missing, show a warn panel: "The keep-alive hasn't run since <time>. Supabase may pause the database. Check Vercel → Cron Jobs."

*Gate:* render tests for fresh, stale and missing.

**C2 · Regression guard matched to RCA1**
- **If H1 (env missing at deploy):** add `scripts/check-env.mjs`, run as a `prebuild` step only when `VERCEL_ENV === 'production'`. It fails the build if `CRON_SECRET` is unset. (T16 extends the list with `UPI_VPA` and `UPI_PAYEE_NAME` when it lands.) Test the script.
- **If H2:** the heartbeat write is the guard. Note in RCA1 that a pause-free 30 days is the evidence, and add a check to the Obsidian follow-ups.
- **If H3:** the guard is the C1 panel, plus a note in the runbook.

**D1 · Production proof**
- Tushar calls the deployed route once with the secret, using `! curl -H "Authorization: Bearer $CRON_SECRET" …` from his own shell so the value never enters the transcript. Expect 200 and `[keepalive]` in Vercel logs.
- The admin panel shows a fresh heartbeat.

## Definition of done
- [ ] A healthy database gets a write, a 200 and one info line. A failing database gets an error line and a non-2xx response (route tests).
- [ ] The cron is in `vercel.json` behind `CRON_SECRET`.
- [ ] RCA1 is in `decisions.md`, with a regression guard for its cause.
- [ ] The stale-heartbeat panel is live, and the production call has been verified.
- [ ] Typecheck, lint, the claims guard and the tests are green.
