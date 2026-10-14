# Plan — T17 · Receipt screen and submit with proof

> **Ticket:** T17 · Campfire TASK-22.4 · **Phase 7** · **Blocked by:** T16.
> **Delivers:** the receipt screen (Design.md §6.1); the widened `payments` table, `payment_proofs`, and the private `payment-screenshots` bucket; `submit_order_with_receipt()`; and the dashboard's "Checking your payment" line.
> **Read first:** `technical-plan.md` §2.2, §2.3, §2.7 · Design.md §6.1–6.2 · `plans/T06-tier-checkout-submit.md` · `supabase/migrations/20260901160000_order_files.sql` (the storage-policy pattern).

## Design decisions locked here
- **Upload on choose, submit the path.** The RPC checks again that the object exists in the caller's folder for this order, the same defence `order_files` uses.
- **Screenshots are JPG or PNG, up to 10 MB** (TP6). HEIC is dropped for two reasons:
  - Chrome can't display it to the admin.
  - When `accept` leaves HEIC out, iOS Safari converts HEIC photos to JPEG, and iPhone screenshots are PNG anyway.

  The dropzone copy therefore becomes "JPG or PNG". That is a browser-constraint adjustment, which the Design freeze permits.
- **One payment per order still holds** (`order_id` UNIQUE). Each new screenshot adds a `payment_proofs` row.

## Tasks

**A1 · Migration `…_payments_upi.sql`**
- **`payments`:** widen the `provider` and `status` CHECKs, add the pairing CHECK, and add `utr` (12-digit check) and `submitted_at`.
- **`payment_proofs`:** new table. RLS lets the owner and admins read; there are no client write grants.
- **Bucket `payment-screenshots`:** private, 10 MB, `image/jpeg` and `image/png`.
- **Storage policies:**
  - The owner may insert under `<uid>/<order>/` while the order is `draft` or its payment is `not_found`. The `not_found` clause is written now, so T19 needs no policy change.
  - The owner may select their own objects; admins may select all.
  - No client deletes.

*Gate:* `tests/rls/storage-payment-screenshots.test.ts`:
- The owner can upload and read.
- Buyer B can't list, read, sign or upload into A's folder.
- Anonymous users get nothing.
- Admins can read.
- An upload to a submitted order whose payment is not `not_found` is refused.

**A2 · Migration: `submit_order_with_receipt(p_order_id uuid, p_path text, p_utr text default null)`**

It asserts everything `submit_order` does, and also:
- `upi_flow_for_caller()` is true.
- The object exists in `payment-screenshots` at `p_path`.
- `split_part(p_path,'/',1) = auth.uid()` and `split_part(p_path,'/',2) = p_order_id`.
- `p_utr` is null or matches `^[0-9]{12}$`. Blank counts as null.

Then, in one transaction, it:
1. Inserts the payment (`upi_qr`, `awaiting_verification`, `tier_price_inr`, `utr`, `submitted_at=now()`).
2. Inserts the proof.
3. Sets the `tegaki.submitting` flag.
4. Calls `transition_order(→ sample_under_review)`.

*Gate:* `tests/rls/payments-submit-receipt.test.ts`:
- The happy path produces exactly 1 payment and 1 proof.
- A missing object is refused and the order stays draft.
- A path in another user's folder is refused.
- A malformed UTR is refused.
- A second call is refused and creates no second payment.
- A buyer is refused in `demo` mode.
- An admin is allowed in `admin_preview`.

**B1 · `src/lib/payments/constants.ts`**
Holds `SCREENSHOT_MAX_BYTES`, `SCREENSHOT_MIME`, `PAYMENT_SCREENSHOTS_BUCKET` and `UTR_PATTERN`.

*Gate:* a test reads the bucket config through the service client and asserts it equals these constants.

**B2 · Client upload helper**
`src/lib/payments/upload-screenshot.ts`:
- Validates type and size first, using the same validator style as `src/lib/uploads/validate.ts`.
- Uploads to `<uid>/<order>/<uuid>.<ext>` and returns the path.

*Gate:* validator unit tests:
- A file of 10 MB + 1 byte is rejected with a clear message.
- A HEIC file is rejected with "Please send a JPG or PNG screenshot".
- A PNG is accepted.

**B3 · Server action `submitWithReceipt(orderId, path, utr)`**
Lives in `src/lib/orders/submit-action.ts`, next to `submitOrder`, with the same error mapping:
- `23514` → that error's message.
- Anything else → a generic message, plus a `console.error`.

*Gate:* typecheck, and a unit test with a stubbed RPC error.

**C1 · Receipt screen**
In `checkout/receipt/page.tsx` and `src/components/wizard/receipt-form.tsx`:
- The H1 "Send us the receipt", with its explanatory line.
- A dashed dropzone: "Choose a screenshot · JPG or PNG · up to 10 MB". Once a file is chosen it becomes a file row with a thumbnail (object URL), the name, the size, and **Remove**.
- The UTR field, labelled "UPI reference (UTR) · optional": `inputmode=numeric`, mono, with client validation that mirrors the 12-digit rule.
- The primary button **"Send for review"**, disabled until the upload has finished.
- The §6.1 copy lines, and the link "Back to the QR".
- `ConfirmOrder`, reused with the new action, so the stamp plays and then the page navigates to `/dashboard`.

*Gate:*
- Errors use `role=alert`.
- The field is labelled.
- Targets are at least 44px.
- Focus lands on the H1.

**C2 · Resume**
- Opening `/checkout/receipt` directly (on reload, or on return from the UPI app) renders the screen.
- If the order is no longer a draft, the existing wizard layout redirects to the dashboard, as it does today.

*Gate:* an e2e test that reloads on the receipt screen.

**C3 · Dashboard payment line, first state**
- `src/components/orders/payment-line.tsx` renders inside `OrderCard`, under the header, whenever a payment exists and is not `demo_paid`.
- **"Checking your payment"** state: warn-700, a clock icon, "₹X · receipt received <date>", and the one explanatory line.
- `getMyOrders` selects `payments(status, amount_inr, submitted_at, verified_at, not_found_reason, refunded_at, refund_utr)` through the embedded relation. RLS restricts it to the buyer's own rows.

*Gate:*
- Every state shows an icon and text, never colour alone.
- The loading skeleton includes the payment row.

**D1 · E2E: `e2e/payments-submit.spec.ts`**
Runs on the phone project, in `admin_preview`, as the admin test user:
1. Complete stages 1–3.
2. Open the pay screen and tap "I've paid".
3. Attach the fixture PNG and type a UTR.
4. Tap "Send for review" and see the stamp.
5. The dashboard shows "Checking your payment".

Afterwards the DB holds 1 payment in `awaiting_verification` and 1 proof.

*Gate:* green, and a double-click on "Send for review" still produces only one payment.

## Definition of done
- [ ] The DB refuses a submit without a screenshot, even through a direct RPC, and the order stays draft.
- [ ] RLS tests prove screenshot privacy: only the owner and admins can read.
- [ ] Type and size limits are enforced on the client, in the bucket, and in a test.
- [ ] UTR is optional, and must be 12 digits when given.
- [ ] The receipt screen resumes on reload, the stamp plays, and a double submit is safe.
- [ ] The dashboard shows "Checking your payment".
- [ ] typecheck, lint, the claims guard and the tests are green; screenshots taken at 375 and 1280.
