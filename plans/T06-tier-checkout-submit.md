# Plan — T06 · Wizard stages 3–4: tier + demo checkout → submitted

> **Ticket:** T06 · **Phase 2** · **Blocked by:** T04, T05.
> **Delivers:** tier selection, the clearly-labelled demo checkout, and the transition that closes the customer half of the loop: `draft → sample_under_review`.

## Design decisions locked here

- **`payments` is gateway-ready but demo-only:** provider fields exist and stay empty except `provider='demo'`, `status='demo_paid'`. `order_id` is **unique** — the schema itself makes double-payment impossible.
- **Submit is one atomic server action**: insert payment + `transition_order(draft→sample_under_review)` in a single Postgres function call (`submit_order(order_id)`, security definer) so a crash can't leave a paid-but-draft order.
- Prices come only from `src/lib/tiers.ts` — never inline.

## Tasks

**A1 · Migration: `payments`** — `id uuid pk`, `order_id uuid not null unique references orders(id)`, `amount_inr int not null`, `currency text not null default 'INR'`, `provider text not null default 'demo'`, `provider_reference text`, `status text not null default 'demo_paid'`, `created_at`. RLS: buyer selects own (via order join); **no client insert** — rows are created only inside `submit_order()`.
*Gate:* psql — client insert denied; select-own works.

**A2 · Migration: `submit_order(order_id)`** — security definer: asserts caller owns the order, status is `draft`, `tier` is set, and ≥1 `order_files` row exists; inserts the payment (amount from a SQL tier→price map mirroring `tiers.ts`); calls `transition_order()`; returns the new state. Unique `order_id` + status assert make it idempotent-safe: a second call raises cleanly.
*Gate:* SQL tests — happy path; no-tier fails; no-files fails; second call fails without a second payment row.

**B1 · Stage 3: tier selection** — `tier/page.tsx`: three T02 cards as a radio group (`Design.md` §3.3 in-wizard: selected = shu-900 wash + shu ring), Core pre-anchored with the MOST POPULAR chip, contents bullets from `tiers.ts`, "Compare what's inside" link opening the excerpt sheet (placeholder content until C3). Saving sets `tier` + `wizard_stage=4`.
*Gate:* keyboard radio semantics (arrow keys, `aria-checked`); selection persists on resume.

**B2 · Stage 4: demo checkout** — `checkout/page.tsx`: summary card (subject, tier, turnaround from `tiers.ts`, file count), price in serif `text-5xl`, the **pilot notice** (warn-tinted, icon + "Pilot mode — no real payment is taken. Your order is confirmed instantly."), refund/re-upload risk-reversal line, confirm button with loading state.
*Gate:* notice unmissable at 375px; disclaimer line present.

**B3 · Confirm action** — calls `submit_order()`; success → seal-stamp moment (§4.3: scale 1.2→1.0, 350ms, the one celebratory beat) → redirect to dashboard with toast "Sample received — we'll review it shortly." Button disabled from first click (loading state) — the DB constraint is the real double-submit guard, the UI just avoids the error.
*Gate:* double-click and back-then-confirm produce exactly one payment and one transition (assert in DB).

**B4 · Dashboard reflects submission** — the card now shows `sample_under_review` chip + "Pilot order — no payment was taken" microcopy.
*Gate:* visible on the deployed URL.

**C1 · Full-loop E2E** ⚠️ the phase-2 QA centrepiece — `e2e/submit-loop.spec.ts`: sign in → stage 1 → upload 2 files → pick Core → confirm → dashboard shows `sample_under_review`; DB has 1 order, 2 files, 1 payment.
**C2 · RLS payments test** — B cannot read A's payment; anonymous nothing.
*Gate (both):* green.

## Definition of done
- [ ] A stranger's account can complete sign-in → submitted order end to end on the deployed URL.
- [ ] Exactly one payment row per order, enforced by schema; double-submit proven safe.
- [ ] Pilot labelling on checkout **and** the resulting order card.
- [ ] Standing gates verified on stages 3–4.
