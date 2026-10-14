# Plan — T20 · Refunds recorded in admin

> **Ticket:** T20 · Campfire TASK-22.7 · **Phase 8** · **Blocked by:** T18.
> **Delivers:**
> - an admin-only "Record refund" form on paid payments, which moves the payment to `refunded`
> - the customer's "Refunded" line on the order card
> - the "Paid" and "Refunded" queue filters
>
> **Read first:** `technical-plan.md` §2.3 · Design.md §6.2–6.3 · decision S5.

## Design decisions locked here
- **Refunded is a payment state, not an order state** (S5). The order's status doesn't change.
- **A refund can only start from `verified`.** Nothing was received in any other state.
- **The refund UTR is required:** it is the only proof the 7-day promise was kept.

## Tasks

**A1 · Migration `…_payment_refund.sql`**
- Add four columns: `refund_utr` (with a 12-digit check), `refund_note`, `refunded_at` and `refunded_by`.
- Add `record_refund(p_order_id, p_utr, p_note)`:
  - admin only
  - only from `verified`
  - refuses a missing or malformed UTR
- Extend `admin_payment_counts()` if it is still missing anything.

*Gate:* `tests/rls/payments-refund.test.ts`:
- Refused from `awaiting_verification`, `not_found` and `demo_paid`.
- Refused for a buyer.
- Refused without a UTR.
- The order status is unchanged after a refund.
- A second refund is refused.

**B1 · `recordRefund(orderId, utr, note)`** in `src/lib/admin/payment-actions.ts`.

**C1 · Admin refund form**
- Shown only for `verified` payments.
- Two fields: "Refund UTR" (required, mono, numeric) and "Note".
- One button: **"Record refund"**.
- Once refunded, the panel shows "Refunded ₹X on <date> · ref <utr>" and the note.

*Gate:* fields are labelled, and errors have `role=alert`.

**C2 · Customer "Refunded" line**
- Lives in `payment-line.tsx`.
- A neutral inkl/5 panel: "Refunded ₹X on <date> · sent back to the UPI account you paid from · ref `<utr>`".

**C3 · Queue pills**
- Add "Paid" and "Refunded", with counts.

**D1 · E2E `e2e/payments-refund.spec.ts`**
1. Start with a verified order that was then parked.
2. The admin records a refund.
3. The buyer's card shows the refund line.
4. The "Refunded" filter lists the order.

## Definition of done
- [ ] A refund is possible only from `verified`, only by an admin, and only with a UTR (RLS tests).
- [ ] The customer's card shows the refund line.
- [ ] The "Paid" and "Refunded" filters work.
- [ ] Typecheck, lint, the claims guard and the tests are green.
