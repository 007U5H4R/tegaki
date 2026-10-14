# HANDOFF — Tegaki payments amendment (v1.1)

> Single baton for the build workflow (`~/.claude/workflow/build-workflow.md`). Rewrite this file at each stage end. The long-form project history stays in `tegaki-handoff.md` (pilot build, 2026-09-02).

## Stage just completed
**Stage 2 · Solution Design — approved 2026-10-14.** Stage 3 skipped (EV5). Stage 4 approved (D1–D3). Stage 5 signed off (T16–T25). Tier: **Full** (real money, new UI, public surface). Stage 1 is not re-run: `Discovery-PRD.md` still stands, and the change is an amendment to an approved Solution-PRD.

## Key decisions (all in `decisions.md`)
- **S1** Real payment by a self-generated per-order `upi://pay` QR plus an "Open in UPI app" button. Verification is manual. No gateway; Cashfree stays post-pilot.
- **S2** Pay to Tushar's personal UPI ID. The VPA and payee name are env config, never hard-coded.
- **S3** No new order status. The DB transition `sample_under_review → analysis_in_progress` is refused unless the payment is `verified`.
- **S4** Screenshot required, UTR optional. "Payment not found" + reason → customer re-attaches. 14 days unresolved → `parked`. The screenshot sits in a private bucket under sample-equivalent RLS and 90-day retention. No OCR.
- **S5** Manual UPI refunds, recorded in admin (refund UTR + note). `refunded` is a payment state, not an order state.
- **S6** Netlify: **rejected**.
- **S7** The daily scheduled job does a real DB read as a Supabase keep-alive and logs an error if the DB doesn't answer. Investigate why the existing `/api/cron/retention` didn't prevent the 2026-10-13 pause.
- **S8** Stay on **Vercel Hobby**, serve at `tegaki.tusharpathak.com` (old URL redirects). The commercial-use breach is an **accepted risk**; fallback: refund in-flight orders, upgrade to Pro.

## Outputs
- `Solution-PRD.md`: v1.1, approved. Changed sections: §2 (goal 6), §3, §5, §6.3–§6.7 (new §6.7), §9, §11.
- `decisions.md`: S1–S8.
- Campfire: **TASK-22** "Take real payment by per-order UPI QR with manual verification" (feature, High, P1), In Progress.
- No code changed yet. Branch: `main` (create a worktree/branch at Stage 7).

## Facts the next stages must not miss
- Existing payments schema: `supabase/migrations/20260902100000_payments.sql`. `tier_price_inr()` is the server-side price. `payments.order_id` is UNIQUE. `provider` CHECK allows only `'demo'`, and status allows only `'demo_paid'`. Both must widen. `submit_order()` is the atomic submit.
- Price parity test: `tests/rls/payments.test.ts`. RLS tests: `tests/rls/` (13 files).
- Demo copy to replace: `PILOT_NOTICE_TITLE` and `PILOT_ORDER_NOTE` in `src/lib/copy.ts`; the Refunds page "Once payments are real…" line in `src/content/policies/index.ts`; the FAQ; the wizard step `src/components/wizard/confirm-order.tsx`; `src/lib/orders/submit-action.ts`. `scripts/check-claims.mjs` guards marketing copy.
- **The GitHub repo `007U5H4R/tegaki` is PUBLIC.** Never put the client's name, the UPI ID or any secret in committed files. Commit `baa71f9` on the unpushed `feat/tegaki-machine` branch has the sample client's full name in its message; reword it before that branch is ever pushed.
- Vercel Hobby keeps runtime logs for 1 hour only. `CRON_SECRET` exists in Vercel (production + preview).
- Supabase project `rgawqxdfvgbocgatjrlg` was paused on 2026-10-13 and resumed that day; Google sign-in was verified to reach Google.

## Open questions
- None blocking Stage 3. Stage 6 should confirm how `tegaki.tusharpathak.com` is attached (same Vercel team, DNS already on Vercel).

## Stage 3 · Evaluation Design — skipped (EV5, 2026-10-14)
Tushar decided Tegaki needs no separate evaluation stage. EV1–EV4 were drafted and rejected. No `evaluation-plan.md`, no `/evals`, no EVAL IDs. The normal done-gates still apply: typecheck, lint, claims guard, and tests written with the code. That includes DB-level tests for the payment gate (S3), screenshot privacy (S4), server-side amount (S1), and a fail-closed check when `UPI_VPA` is unset.

## Stage 4 · UI/UX Design — approved 2026-10-14
- Direction **B, "Pay, then prove"**, plus the shared dashboard and admin screens, approved by Tushar.
- Spec: `Design.md` **§6 Payments v1.1** (Design Freeze block at the top of §6).
- Approved mockup: `.design/exploration/final/` (`pay-step.html`, `dashboard-admin.html`). The full gallery is in `.design/exploration/index.html`.
- Decisions D1–D3 are in `decisions.md`.
- **Theme note:** `Design.md` §2 still describes the old dark theme. For the paper customer surfaces the live code is the token reference; admin stays dark.

## Stage 5 · Problem Breakdown — signed off 2026-10-14
- **Tickets:** 10 tickets, T16–T25, appended to `tickets.md`; new `milestones.md` (M-005 ops, M-006 payments).
- **Campfire:** TASK-22.1…22.10 under TASK-22; milestones m-4 / m-5. The ID mapping is at the end of `tickets.md`.
- **Release model:** each ticket ships when done, behind the server-side switch `PAYMENTS_MODE` = `demo` (default) | `admin_preview` (admins only) | `live`. T23 flips it to `live` and removes the demo checkout.
- **Consequence:** the T18 approval gate must also accept legacy `demo_paid`.
- **Ops ships first:** T24 (keep-alive + RCA) and T25 (domain).
- **Frontier:** T24, T25, T16.

## Stage 6 · Technical Planning — drafted 2026-10-14 (awaiting Tushar's sign-off)
- **Outputs:**
  - `technical-plan.md`
  - `test-cases.md` (TC-P01–P45)
  - `plans/T16-…` through `plans/T25-…`
  - TP1–TP11 in `decisions.md`
  - The plan links in `tickets.md` and on the Campfire TASK-22.1–22.10 plans
- **Scope changes:**
  - TP1: the payments switch lives in `settings`, enforced in SQL. An env var would let a live-mode buyer call the demo submit.
  - TP6: no HEIC.
  - TP7: the keep-alive writes a heartbeat.
  - TP9: payment parking reuses the existing parking machinery.
- **Confirmations (technical-plan §9):**
  - **Supabase** pauses on low *database* activity and doesn't define what counts, so the keep-alive writes.
  - **Google's redirect URI is unchanged**, because Supabase hosts the callback. Change the Supabase Site URL and allow-list, add the JS origin and the authorized domain, and regenerate the OG image, which shows the old host.
  - **iOS has no UPI chooser.** P2P intent warnings and a possible ₹2,000 cap are reported, which leads to TP11.
- **Open for Tushar:**
  1. **TP11 real-money spike:** about ₹2,003, refunded. It conflicts with EV3, where Tushar declined real money.
  2. Which inbox the Supabase account emails go to.
  3. The footer policy links were removed in TASK-21. With real money the policies should be reachable; T21 could add them back.

## Next stage: Stage 7 · Execution (after sign-off)
Skill `bw-execution`. Follow `plans/BUILD-ORCHESTRATION.md`: one implementer per ticket, spec and quality review, and the ledger in `plans/LEDGER.md`.

- **Order:** T24 ∥ T25 → T16 (S0 spike first) → T17 → T18 → (T19 ∥ T20) ∥ T21 ∥ T22 → T23.
- **Branches:** one per ticket off `main`. Read `git diff main..HEAD --stat` before every push.
- **Rules that apply throughout:**
  - The repo is public: no VPA, no client name, no secrets.
  - Apply migrations with `supabase db push` before the merge that needs them.
  - Get Tushar's go-ahead before every external change (Vercel domains, Supabase Auth, Google console).
