# Plan — T16 · Pay screen: per-order UPI QR and app link (riskiest slice)

> **Ticket:** T16 · Campfire TASK-22.3 · **Phase 7** · **Blocked by:** none.
> **Delivers:**
> - the `payments_mode` switch, held in the database (TP1)
> - the order code
> - wizard stage 4's pay screen (Design.md §6.1), shown only when the switch allows. In `demo` mode nothing changes for anyone.
>
> **Read first:** `technical-plan.md` §2.1, §2.2, §2.6, §2.7, §9.3 · Design.md §6.1 · `.design/exploration/final/pay-step.html`.

## Design decisions locked here
- **The switch is a `settings` row, enforced by SQL** (TP1). This replaces the ticket's "env var" wording: an env var cannot stop a direct RPC to the demo `submit_order()` once the mode is `live`.
- **The amount shown comes from `tier_price_inr()` via RPC.** It never comes from `tiers.ts` or the client.
- **One URI builder feeds both the QR and the link.** The QR is a server-rendered SVG, so the client bundle doesn't grow.
- **The real-device spike runs first** (TP11). If it fails, stop and go back to design review. Don't build around it.

## Tasks

**S0 · Real-device spike.** ⚠️ This gates everything below.
- **Probe script:** `scripts/upi-probe.mjs` reads `UPI_VPA`/`UPI_PAYEE_NAME` from `.env.local` and prints a `upi://pay` URI, plus a terminal or PNG QR, for a given amount. It writes to the E-Drive scratch dir, is gitignored, and is never deployed.
- **Run:** Tushar and a second payer run the matrix in `technical-plan.md` §9.3. That is GPay and PhonePe, on Android and iPhone, by link and by scan, at ₹1, then one payment at ₹2,001. Refund afterwards.
- **Record:** the outcome goes into `decisions.md` as **TP11-result**.
- *Gate:* every cell passes, or Tushar picks a fallback in design review.

**A1 · Migration `…_payments_mode.sql`.**
- Add the `settings` row `('payments_mode', '"demo"')`.
- Add a `before update` trigger on `settings` that refuses any `payments_mode` value outside `demo | admin_preview | live`.
- Add `payments_mode()` (stable, security definer, falls back to `'demo'`) and `upi_flow_for_caller()`. Grant both to `authenticated`.
- *Gate:* `tests/rls/payments-mode.test.ts` checks:
  - The default is `demo`.
  - After an admin sets `admin_preview`, the admin sees the UPI flow and a buyer doesn't.
  - In `live`, both see it.
  - A garbage value is refused.
  - A buyer can't update the row.

**A2 · Migration `…_order_code.sql`.**
- Add `orders.order_code text unique`.
- `gen_order_code()` builds 4 characters from `0123456789ABCDEFGHJKMNPQRSTVWXYZ`.
- A `before insert` trigger assigns it, with a 10-try loop on collision.
- Backfill existing rows, then set `not null`.
- *Gate:* new orders match `^[0-9A-HJKMNP-TV-Z]{4}$`, and no code is reused across 200 inserts (test).

**A3 · Migration: guard the demo submit.**
- Re-create `submit_order()` with a new first assert: `if public.upi_flow_for_caller() then raise … 'Payments have moved to UPI — reload the page'`.
- The rest of the body stays identical to `20260902200000`.
- *Gate:* in `live`, the demo submit is refused for a buyer. In `demo` it still works. The existing `submission.test.ts` stays green.

**B1 · `src/lib/payments/upi.ts`.**
- `buildUpiUri({ vpa, payeeName, amountInr, orderCode })`.
- `formatOrderCode(code)` returns `T-XXXX`.
- `getUpiConfig()` is server-only and returns `null` if either env var is blank.
- *Gate:* `tests/lib/payments/upi.test.ts` checks:
  - the exact string for a fixture VPA (`test@upi`)
  - `%20`, not `+`
  - `am=999.00`
  - `tn=Tegaki%20T-4F2A`
  - a special character in the payee name is encoded

**B2 · `src/lib/payments/qr.ts`.**
- `renderQrSvg(uri)` uses `qrcode`.
- Add `qrcode` as a dependency, and `jsqr`, `pngjs` and `@types/qrcode` as dev dependencies, each pinned to a version at least two weeks old.
- *Gate:* `tests/lib/payments/qr.test.ts` decodes the `toBuffer` PNG with jsQR, and the decoded text equals the URI for all three tiers.

**B3 · `src/lib/payments/mode.ts`.**
- `getPaymentsFlow(): Promise<'demo' | 'upi'>` calls `rpc('upi_flow_for_caller')`.
- On an RPC error it returns `'demo'` and logs with `console.error`.
- *Gate:* a unit test with a stubbed client covers true, false and error (error gives `demo`).

**B4 · Amount from the server.**
- `getServerPrice(orderId)` selects `tier`, then calls `rpc('tier_price_inr', { p_tier })`.
- *Gate:* a test shows the page passes the RPC value to the screen even when `tiers.ts` is stubbed to a different price.

**C1 · Split the checkout page.**
- Move the current demo body into `src/components/wizard/demo-checkout.tsx`.
- `checkout/page.tsx` loads the order (now including `order_code`) and branches on `getPaymentsFlow()`.
- *Gate:* in `demo` mode the rendered HTML is unchanged. Snapshot the demo component before and after the move.

**C2 · `src/components/wizard/pay-screen.tsx`.** A server component, built to Design.md §6.1.
- **Heading block:**
  - The micro-label "Step 4 of 4 · Pay".
  - The H1 "₹1,999 to <payee>".
  - A sub-line with the note code (nowrap).
- **Paper card:**
  - Below 640px: the primary pill linking to the URI, then a `<details>` titled "Paying from another phone? Show the QR".
  - At 640px and up: the QR tile and the "Scan with…" line.
  - Always: "UPI ID `<vpa>` · Copy". `CopyButton` is a tiny client island with a target of at least 24px.
- **Under the card:**
  - The secondary pill "I've paid, attach the receipt", linking to `checkout/receipt`.
  - The reassurance line.
- **Stepper:** stage 4 is labelled "Pay", in the UPI flow only.
- *Gate:* the QR has an `aria-label`, the primary target is at least 44px, and the grayscale order holds (headline, then method, then next step).

**C3 · Fail closed.**
- When `getUpiConfig() === null`, render no QR and no link.
- Show a card instead: "Payments are paused for a moment. Write to <CONTACT_EMAIL>".
- Log `console.error('[payments] UPI config missing')` once per render.
- *Gate:* a render test with the env unset finds no `upi://` and no `<svg role=img>`.

**C4 · Receipt route stub.**
- `checkout/receipt/page.tsx` renders only the H1 "Send us the receipt" and "Back to the QR". T17 fills it in.
- Add a `FocusHeading` client component that focuses the H1 on mount and scrolls to the top.
- *Gate:* walking pay → receipt → back by keyboard lands focus on the H1 each time.

**C5 · Admin switch.**
- `src/components/admin/payments-mode-switch.tsx` is a radio group of three. Each option has one line explaining who sees what.
- It calls the server action `setPaymentsMode`, which sits behind `getAdmin()`.
- It goes on `/admin/settings`, below `PauseSwitch`.
- *Gate:* in an e2e test, an admin sets `admin_preview`. The admin sees the pay screen, and a buyer account still sees the demo checkout.

**D1 · VPA leak guard.**
- `tests/codebase/no-upi-handle.test.ts` runs `git ls-files`, then greps for `/[a-z0-9._-]+@(ok)?(axis|hdfc|icici|sbi|ybl|ibl|paytm|upi|apl|okhdfcbank|oksbi|okicici|okaxis)\b/i`.
- The fixture `test@upi` is allowlisted.
- *Gate:* green normally, and red when a fake handle is planted in a temporary tracked file.

**D2 · Screenshots.**
- Capture the pay screen at 375, 768 and 1280 in `admin_preview` on the local dev server.
- *Gate:* no horizontal scroll and no console errors.

**D3 · Manual scan-and-cancel, on production after deploy, in `admin_preview`.**
- For each tier, open the QR and the link in GPay and in PhonePe.
- Confirm the payee, amount and note, then cancel.

## Definition of done
- [ ] The S0 spike is recorded (TP11-result) as a pass, or as a design-review decision.
- [ ] `demo` mode is byte-for-byte unchanged for buyers.
- [ ] `admin_preview` shows the pay screen to admins only.
- [ ] The database refuses the demo submit when the UPI flow applies.
- [ ] The decoded QR equals the link and carries the server price and `Tegaki T-XXXX`.
- [ ] The fail-closed render is proven.
- [ ] The VPA appears in no tracked file.
- [ ] typecheck, lint, the claims guard, unit tests and RLS tests are all green.
- [ ] Screenshots exist at all three widths.
