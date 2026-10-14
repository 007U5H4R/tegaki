# Plan — T19 · Payment not found, re-attach, and parking

> **Ticket:** T19 · Campfire TASK-22.6 · **Phase 8** · **Blocked by:** T18.
> **Delivers:**
> - The admin "Not found…" action, which requires a reason the customer will see.
> - On the customer's order card, an error panel that quotes that reason, with an inline re-attach.
> - Parking after 14 days of `not_found`.
> - The "Not found" queue filter.
>
> **Read first:** `technical-plan.md` §2.3 and §2.5 · Design.md §6.2 and §6.3 · `supabase/migrations/20260902140000_reupload_and_parking.sql` · `src/components/orders/reupload-panel.tsx` (the panel pattern to mirror).

## Design decisions locked here
- **Parking reuses the existing machinery.** A new edge is added, `sample_under_review → parked`. `park_overdue_orders()` gets a second loop. The 14 days are stated once, in `payment_park_days()` (TP9).
- **A re-attach keeps the history.** It adds a proof row rather than replacing the old one.
- **The reason is stored as typed** and rendered as text (React escapes it). It is never rendered as HTML.

## Tasks

**A1 · Migration `…_payment_not_found.sql`**
- Add the columns `not_found_reason` and `not_found_at`.
- `reject_payment(p_order_id, p_reason)`:
  - admin only;
  - allowed only from `awaiting_verification`;
  - refuses an empty trimmed reason with "Say what you could not find — the customer is shown this text".
- `reattach_payment_proof(p_order_id, p_path, p_utr)`:
  - owner only, and only while the payment is `not_found`;
  - the same path and object checks as T17;
  - inserts a proof, updates `utr`, sets the status back to `awaiting_verification`, and clears `not_found_*`.
- Add `payment_park_days()`, which returns 14.
- Re-create `transition_order()` with a new edge, `sample_under_review → parked`:
  - allowed for admin or system;
  - allowed for the owner only when the payment is `not_found` and `not_found_at < now() - payment_park_days()`.
- Re-create `park_overdue_orders()` with a second loop for the payment case. It stays idempotent and uses `for update skip locked`.

*Gate:* `tests/rls/payments-not-found.test.ts`:
- A missing reason is refused.
- A buyer can't call `reject_payment`.
- Only the owner can re-attach, and only while the payment is `not_found`. Another buyer is refused, and so is the owner when the payment is `awaiting_verification`.
- Proof history grows to 2 rows.
- **Boundary:** with `not_found_at` set to now − 13 days 23 hours, the order is not parked. At now − 14 days 1 minute, it is parked. Backdate through the service role.
- An owner can't park early through `transition_order`.

**A2 · Constant mirror**
- `PAYMENT_PARK_DAYS = 14` goes in `src/lib/payments/constants.ts`. A test asserts it equals `payment_park_days()`.

**B1 · Server actions**
- `rejectPayment(orderId, reason)` in `src/lib/admin/payment-actions.ts`.
- `reattachProof(orderId, path, utr)` in `src/lib/orders/payment-actions.ts`.

*Gate:* stubbed-error unit tests.

**C1 · Admin "Not found…"**
- A small trailing link, separated by at least 24px, that reveals a required textarea labelled "Why you couldn't find it (the customer sees this)" and the button **"Send to the customer"**.
- The panel shows the proof history: each screenshot with its time and its UTR.

*Gate:* submitting an empty reason shows an inline error with `role=alert`.

**C2 · Customer error panel** (in `payment-line.tsx`, mirroring `reupload-panel.tsx`)
- `role=alert`.
- The heading "We couldn't find this payment yet".
- Tushar's reason as a quote.
- An inline "Attach a new screenshot" dropzone, reusing the T17 upload helper and validator, plus an optional UTR field and **Send**.
- The contact email.
- "Orders without a found payment for 14 days are paused, not lost."

*Gate:* the 14 comes from `PAYMENT_PARK_DAYS`, never a literal. Targets are at least 44px.

**C3 · Parked by payment**
- The parked card already exists (T08). When the order was parked because of its payment, the copy says so ("paused while we look for your payment"), with the contact email.

*Gate:* render test.

**C4 · Queue pill "Not found"**, with a count.

**D1 · E2E `e2e/payments-not-found.spec.ts`**
1. The admin rejects with a reason.
2. The buyer sees the reason verbatim and re-attaches.
3. The admin sees 2 proofs and verifies.
4. The buyer sees "Paid".

## Definition of done
- [ ] The reason is required, and the customer sees it verbatim.
- [ ] Re-attach works only for the owner, and only while the payment is `not_found`. History is kept.
- [ ] Parking happens at 14 days, not 13 (boundary tests). The dashboard-load sweep and the nightly sweep both park.
- [ ] The customer sees "paused, not lost" copy with the contact address.
- [ ] typecheck, lint, the claims guard and the tests are green.
