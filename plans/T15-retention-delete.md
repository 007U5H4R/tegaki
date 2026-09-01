# Plan — T15 · Retention job and delete-my-data

> **Ticket:** T15 · **Phase 5 · Hardening** · **Blocked by:** T04, T10.
> **Delivers:** the 90-day sample-deletion job (delivered orders only; reports persist), the daily parking sweep backstop, and the admin data-purge path honouring delete-my-data.

## Design decisions locked here

- **Vercel Cron → route handler** (`/api/cron/retention`), authorized by a `CRON_SECRET` bearer check, using the service-role client (its one sanctioned app use). Hobby allows daily crons — daily at 03:30 IST.
- **The clock runs from `delivered_at`** (T10's stamp), not `completed`: "90 days after delivery" per the PRD. Orders completed but never marked delivered are **not** deleted (conservative), and the job reports them so Tushar sees the miss.
- **Observable or it's broken:** every run returns and logs `{examined, deleted_files, deleted_objects, parked, skipped_undelivered}`; failures return 500 with the error — visible in Vercel logs. A silent job is a failed job.

## Tasks

**A1 · Route handler** — `src/app/api/cron/retention/route.ts` (GET): bearer-checks `CRON_SECRET`; selects orders with `delivered_at < now() - interval '90 days'` that still have `order_files`; for each: delete storage objects under `samples/{buyer}/{order}/`, then the `order_files` rows (object first, row second — a re-run cleans up any half-state, which is what makes it idempotent); calls `park_overdue_orders()` as the daily backstop; returns the counts JSON.
*Gate:* unit-level test with mocked storage + real local DB fixtures.

**A2 · `vercel.json` cron entry** — daily schedule; `CRON_SECRET` env var in Vercel (added to `.env.example`).
*Gate:* deployed cron listed in the Vercel dashboard; manual invocation with the secret works, without it → 401.

**A3 · Customer-facing truth** — the completed order card after sample deletion still renders correctly: report download intact, samples section (if any UI showed thumbnails) shows "Samples deleted per our 90-day retention policy" instead of broken images.
*Gate:* fixture-driven render of a purged order — no broken image, download still works.

**B1 · Admin data purge (delete-my-data)** — on `/admin/orders/[id]`: "Delete this order's data" (confirm dialog naming exactly what goes: samples + report + files rows; the order row is kept with fields nulled for the audit trail — or fully deleted on request; **surface both options in the dialog**). A user-level purge runbook (all orders for an email) documented in `plans/RUNBOOK-delete-my-data.md`.
*Gate:* purge removes objects + rows; the dashboard shows the order gone/emptied gracefully.

**C1 · Boundary test suite** — fixtures at delivered 89/90/91 days: only 91 (and 90+ε) purged; undelivered old order skipped **and counted** in `skipped_undelivered`; double-run: second run deletes zero and errors zero (idempotent); secret-less call → 401.
*Gate:* all green; counts asserted exactly.

**C2 · Live verification** — seed a synthetic delivered-92-days-ago order on production (test account), run the cron manually, verify deletion + counts in the response and Vercel logs, then clean up.
*Gate:* evidence in the ledger.

## Definition of done
- [ ] 90-day boundary exact under a controlled clock; reports and dashboards survive purges.
- [ ] Job idempotent, secret-guarded, and observably reporting counts on every run.
- [ ] Parking backstop swept daily; delete-my-data purge works and is documented.
