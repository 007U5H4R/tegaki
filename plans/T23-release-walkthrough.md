# Plan — T23 · Release: full phone walk-through and switch to live

> **Ticket:** T23 · Campfire TASK-22.10 · **Phase 9** · **Blocked by:** T16–T22, T24, T25.
> **Delivers:** a production walk-through in `admin_preview` at 375px, then `payments_mode = live`, then a follow-up PR that removes the dead demo checkout code and wording.
> **Read first:** `technical-plan.md` §6–§7 · `test-cases.md` (all TC-P*) · every T16–T22 report.

## Design decisions locked here
- **The release run must actually run the database suites** (TP10).
  - With `REQUIRE_DB_TESTS=1`, `tests/setup.ts` throws when the Supabase env vars are missing, so a skip shows as red.
  - Today the RLS suites skip silently when those vars are absent.
- **The switch flip is the release.** Rollback is the switch flipped back (`technical-plan.md` §7).
- **Demo removal is a separate PR** made after a quiet first order. It is never in the same deploy as the flip.

## Tasks

**A1 · Release guard**
- In `tests/setup.ts`, or wherever `describe.skipIf` reads the env: when `process.env.REQUIRE_DB_TESTS === '1'` and the Supabase env vars are missing, throw `Error('Release run requires the database suites — set the Supabase env vars')`.
- Add the `package.json` script `test:release` = `REQUIRE_DB_TESTS=1 vitest run`.

*Gate:* `REQUIRE_DB_TESTS=1 SUPABASE_URL= pnpm vitest run` fails. With the env vars present, the run is green and reports 0 skipped DB tests.

**A2 · Release commit checks.** Run on `main` after T22 has merged and record the real output in `plans/reports/T23-release.md`:
- `pnpm exec next typegen && pnpm -s typecheck`
- `pnpm exec eslint .`
- `node scripts/check-claims.mjs`
- `pnpm test:release`
- `pnpm exec playwright test`

**B1 · Production walk-through.** Tushar on his phone, with Claude driving desktop admin.
- **Setup:** `payments_mode = admin_preview`, at `tegaki.tusharpathak.com`.
- **Steps:**
  1. Sign in with Google.
  2. Go through stages 1–3.
  3. The pay screen shows the right amount, payee and `T-XXXX`.
  4. Scan-and-cancel the QR, and test the app link (per the TP11 result).
  5. Attach a receipt.
  6. The dashboard shows "Checking your payment".
  7. In admin, "Not found…" with a reason.
  8. The buyer sees the reason and re-attaches.
  9. Admin verifies, then approves.
  10. On a second test order, admin verifies and records a refund; the buyer's card shows "Refunded".
- **Evidence:** screenshots at 375px saved to `plans/reports/T23-walkthrough/`.

*Gate:* every step passes, and Tushar signs off in writing.

**B2 · Clean up production test data.** Use `purge_order_data(order, erase => true)` on each walk-through order, which also removes the screenshots (T22).

*Gate:* a query shows 0 rows for the test orders and 0 objects in their folders.

**C1 · Flip**
1. `/admin/settings` → **Live**.
2. Watch the first real order: the payment row, Tushar's verification, and the approval.
3. Write the go-live line in the Obsidian notes and `HANDOFF.md`.

**C2 · Demo removal PR** (after the first verified real order)
- Delete:
  - `src/components/wizard/demo-checkout.tsx`
  - the `demo` branch of `paymentCopy()` and `policies()`
  - `PILOT_*`
  - the `tiers.ts` comment
- Keep:
  - SQL `submit_order()`, which refuses in `live` (dropping it is out of scope)
  - the `demo_paid` acceptance in the gate, which legacy orders still need
- Update the tests that asserted demo-mode behaviour.

*Gate:* the A2 suite passes again on that PR.

## Definition of done
- [ ] All tests, typecheck, lint and the claims guard pass on the release commit, with DB suites actually run (0 skipped).
- [ ] The walk-through passes and Tushar signs it off.
- [ ] Test data is gone.
- [ ] The mode is `live`, and the first real order is verified end to end.
- [ ] The demo code has been removed in a follow-up PR.
