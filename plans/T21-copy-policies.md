# Plan — T21 · Copy and policies for real payment

> **Ticket:** T21 · Campfire TASK-22.8 · **Phase 9** · **Blocked by:** T17.
> **Delivers:** real-payment wording wherever a customer can see demo-payment wording. The `payments_mode` switch chooses which wording shows, so the old wording stays live while the mode is `demo`. T23 deletes the demo wording after launch.
> **Read first:** `technical-plan.md` §2.1 · `src/lib/copy.ts` · `src/content/policies/index.ts` · `src/content/faq.ts` · `scripts/check-claims.mjs`.

## Every demo-payment string, found by grep on 2026-10-14
| File | Line | Text |
|---|---|---|
| `src/lib/copy.ts` | 17, 18, 21 | `PILOT_NOTICE_TITLE` / `_BODY`, `PILOT_ORDER_NOTE` |
| `src/app/wizard/[orderId]/checkout/page.tsx` | 58 | "nothing is charged" (moves into `demo-checkout.tsx` in T16) |
| `src/content/policies/index.ts` | 42 | Privacy: "This pilot takes no real payment…" |
| `src/content/policies/index.ts` | 90–93 | Refunds: "The pilot takes no payment" / "once payments are real…" |
| `src/content/policies/index.ts` | 119 | Refunds: "Once payments are real, a refund will be issued…" |
| `src/lib/tiers.ts` | 8 | A code comment, not customer-visible. Update it in T23 |

The FAQ (`src/content/faq.ts`) has no payment answer today. Add one entry: "How do I pay?"

## Design decisions locked here
- **Two copy sets, one switch.**
  - `src/lib/copy.ts` exports `paymentCopy(flow: 'demo' | 'upi')`.
  - `src/content/policies/index.ts` exports `policies(mode)`.
  - Public pages can't call `upi_flow_for_caller()`, because no one is signed in. They read `payments_mode()`, which this ticket also grants to `anon`. A mode string isn't sensitive.
- **Policy pages revalidate every 5 minutes** (`export const revalidate = 300`). The page's other content stays static, and a switch flip is reflected within 5 minutes.
- **The new text says only what is true:**
  - Payment is by UPI to Tushar's personal UPI ID.
  - Tushar checks each payment by hand.
  - Payment screenshots are kept privately and deleted on the sample schedule.
  - Refunds go back to the paying UPI account within 7 working days of being agreed.
- **No VPA appears in any copy.** It's shown only on the pay screen.

## Tasks

**A1 · Grant** `payments_mode()` to `anon`, in migration `…_payments_mode_anon.sql`.
*Gate:* an anon client can read the mode but can't read `settings` rows other than through this function. The existing policy already restricts `settings` to authenticated users.

**B1 · `paymentCopy(flow)`** in `copy.ts`.
- The `demo` strings are the current ones.
- The `upi` strings are the dashboard microcopy that replaces `PILOT_ORDER_NOTE` (in `upi` mode the payment line carries the meaning, so the note is omitted).

*Gate:* unit test.

**B2 · `policies(mode)`**
- **Privacy:** what is collected. Payment screenshots and an optional UTR, private, deleted on the sample schedule.
- **Refunds:** the real UPI refund process, in 7 working days.
- **Terms:** search for "no payment" or "pilot" wording about money and replace it.

Keep the claims voice.

*Gate:* `node scripts/check-claims.mjs` passes.

**B3 · FAQ entry, `live`/`admin_preview` only**
"How do I pay?" → by UPI. The QR or app link fills in the exact amount and a note. Tushar matches it by hand. Analysis starts once the payment shows up.

**C1 · Wire the pages** (`src/app/(policies)/…` or wherever the policy routes live) to call `getPaymentsModePublic()`, with `revalidate = 300`.

**D1 · Render tests**, in `tests/codebase/payment-copy.test.ts`:
- In `live` mode, render every customer-visible policy and FAQ string plus `paymentCopy('upi')`, and assert that none matches `/no (real )?payment|pilot takes no|nothing is charged|demo checkout|once payments are real/i`.
- In `demo` mode, assert the current strings are returned unchanged.

**D2 · Tushar's read-through**
Put the changed policy text side by side, old against new, in `plans/reports/T21-policy-diff.md`. Tushar approves it before T23.

## Definition of done
- [ ] In `live` mode, no customer-visible page renders demo-payment wording. In `demo` mode nothing changes (render tests for both).
- [ ] The claims guard passes.
- [ ] Tushar has approved the new policy text in writing.
- [ ] typecheck · lint · tests green.
