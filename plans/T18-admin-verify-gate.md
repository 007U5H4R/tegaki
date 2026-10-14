# Plan — T18 · Admin verify and the approval gate

> **Ticket:** T18 · Campfire TASK-22.5 · **Phase 8** · **Blocked by:** T17.
> **Delivers:**
> - `verify_payment()`.
> - The database approval gate (verified **or** legacy `demo_paid`).
> - The admin "Find it in your bank app" panel with the screenshot viewer.
> - "Found it, mark paid".
> - The disabled "Approve sample".
> - The "Payments to check" queue filter.
> - The order-code search.
> - The dashboard's "Paid" line.
>
> **Read first:** `technical-plan.md` §2.3, §2.4, §2.8 · Design.md §6.3 · `.design/exploration/final/dashboard-admin.html` · `src/app/admin/orders/[id]/page.tsx` · `src/lib/admin/actions.ts`.

## Design decisions locked here
- **The gate lives in `transition_order()`, not in the button.** It also refuses the service role: no code path approves an unpaid sample.
- **`demo_paid` passes the gate.** Legacy demo orders, and orders placed while the switch is `demo`, keep working (Stage 5 sign-off item 2).
- **`verify_payment` also accepts `not_found` as a starting state,** because Tushar may find a payment after rejecting it.

## Tasks

**A1 · Migration `…_payment_verify.sql`**
- **Columns:** add `verified_at` and `verified_by uuid references auth.users`.
- **`verify_payment(p_order_id)`:**
  - security definer, `is_admin()` only;
  - allowed from `awaiting_verification` or `not_found`;
  - clears `not_found_*`.
- **`admin_payment_counts()`:** returns `{to_check, not_found, paid, refunded}`.
- **`transition_order()`:** re-created from its latest body (`20260902210000`) with the gate block from `technical-plan.md` §2.4, placed right after the `allowed` check.

*Gate:* `tests/rls/payments-gate.test.ts`.
- **Approve is refused** for `awaiting_verification`, `not_found` and `refunded`. It is refused for an admin and for the service role.
- **Approve is allowed** for `verified` and for `demo_paid`.
- `needs_reupload` works with no verified payment.
- A buyer calling `verify_payment` is refused.
- A buyer can't update any payment column. Write a direct PATCH test; there's no grant.
- The existing `admin-review.test.ts` and `submission.test.ts` stay green.

**B1 · Queries**
- `getAdminOrder()` adds the payment and proofs: `payments(*, payment_proofs(*))`, with proofs newest first.
- `getQueue()` accepts `payment?: 'to_check' | 'not_found' | 'paid' | 'refunded'` and `code?: string`. The code is matched case-insensitively and with or without the `T-` prefix.

*Gate:* typecheck, plus a unit test of the filter → query mapping.

**B2 · `src/lib/admin/payment-actions.ts`: `verifyPayment(orderId)`**
- Calls `getAdmin()`, then the RPC.
- `revalidatePath` covers the order page and the queue.

*Gate:* a unit test with a stubbed RPC error.

**C1 · Admin order page: payment section** (`src/components/admin/payment-panel.tsx`)
- **Screenshot viewer:** a washi surface, max width 14rem, with "Open full size" (a signed URL with a 10-minute TTL, opened in a new tab).
- **"Find it in your bank app" panel:**
  - Amount due.
  - The note, `Tegaki T-XXXX`, in mono.
  - The typed UTR, or "not given".
  - When it was sent.
- **Primary action:** "Found it, mark paid", with an ok fill.
- A ≥24px gap, then a placeholder slot for T19's "Not found…" link.
- **States:** a payment that is `verified` shows "Paid ₹X on <date>". One that is `demo_paid` shows "Pilot demo order: no payment taken".

*Gate:* targets ≥44px, and the dark ink theme tokens.

**C2 · Approve gate in the UI**
- The existing approve control is disabled unless the payment status is in (`verified`, `demo_paid`), with the visible text "Mark the payment as paid first."
- The server action still surfaces the database's message if it is reached anyway.

*Gate:* an e2e check that the button is disabled, then enabled after verifying.

**C3 · Queue filter pills and search** (`src/app/admin/page.tsx`)
- **Pills:** "All · Payments to check" with counts, `aria-pressed`, min height 44px. T19 and T20 add their own pills.
- **Rows** show "◷ Payment to check · ₹X".
- **Search box:** "Order code".

*Gate:* keyboard operable. The counts match the DB.

**C4 · Dashboard "Paid"**
- `payment-line.tsx` gains the verified state: ok-700, a check icon, "₹X · <date>", no panel.

*Gate:* icon plus text.

**D1 · E2E `e2e/payments-verify.spec.ts`**
1. Seed a submitted UPI order using the service role.
2. Sign in as admin and open it.
3. Confirm Approve is disabled.
4. Click "Found it, mark paid".
5. Approve now works, and the order moves to `analysis_in_progress`.
6. The buyer's dashboard shows "Paid".

## Definition of done
- [ ] The database refuses approval without `verified` or `demo_paid`, for every caller including the service role (RLS tests on the function).
- [ ] Buyers can't touch payment state.
- [ ] Rejecting a sample still works when the payment isn't verified.
- [ ] Admins can verify from the Find-it panel. The queue filters and the code search work.
- [ ] The dashboard shows "Paid".
- [ ] Typecheck, lint, the claims guard and the tests are green. Screenshots of the admin page at 1280 and 375.
