# Technical Plan — Tegaki payments amendment v1.1

> **Stage 6 · Technical Planning**, 2026-10-14.
> **Inputs:** `Solution-PRD.md` v1.1 · `Design.md` §6 (frozen) · `decisions.md` S1–S8, EV5, D1–D3 · `tickets.md` (T16–T25) · `milestones.md`.
> **Scope:** the architecture shared by T16–T25. Each ticket's atomic tasks and gates are in `plans/T16-…` through `plans/T25-…`; test cases are in `test-cases.md`; the decisions made here are TP1–TP11 in `decisions.md`.
> **No EVAL wiring** (EV5). Every ticket's done-gate is typecheck, lint, the claims guard and the tests its plan names.

## 1. What exists today (what we build on)

| Piece | Where | What it does |
|---|---|---|
| `payments` table | `supabase/migrations/20260902100000_payments.sql` | One row per order (`order_id` UNIQUE). The `provider` CHECK allows only `'demo'`, the `status` CHECK only `'demo_paid'`. No client write grants. |
| `submit_order(uuid)` | latest body in `20260902200000_review_gate_hardening.sql` | Asserts owner, draft, tier, at least one sample and consent. Inserts the payment at `tier_price_inr()`, sets the `tegaki.submitting` flag, then calls `transition_order(…, 'sample_under_review')`. |
| `transition_order()` | latest body in `20260902210000_submitting_flag_null.sql` | The only path that changes an order's status: a whitelist of edges and who may walk each one. `sample_under_review → analysis_in_progress` is admin or system. |
| `settings` table | `20260902170000_settings_and_delivery.sql` | Key/jsonb switches. Signed-in users read; only admins update. Holds `pause_new_orders` (`is_paused()`). The admin page `src/app/admin/settings/page.tsx` has `PauseSwitch`. |
| `park_overdue_orders()` | `20260902140000_reupload_and_parking.sql` | Parks overdue `needs_reupload` orders. Runs on every dashboard load (`getMyOrders`) and in the nightly job. |
| Retention | `20260902180000_retention.sql`, `src/lib/retention/purge.ts`, `src/app/api/cron/retention/route.ts` | Runs nightly at 22:00 UTC with a service-role client. Deletes objects first, then rows. Erasure on request goes through `purge_order_data()`, which returns `(bucket, path)`. |
| Samples bucket | `20260901160000_order_files.sql`, `src/lib/uploads/*` | Private, at `<buyer>/<order>/…`, with owner and admin storage policies. An `order_files` insert requires the object to exist. Signed URLs come from `src/lib/uploads/signed-url.ts`. |
| Admin allowlist | `is_admin()` (compiled into SQL) + `ADMIN_EMAILS` (`src/lib/auth/role.ts`) | Two copies of one list, kept in step by a signup test. |
| OAuth | `src/lib/auth/actions.ts` | `redirectTo` is derived from the request origin. Supabase's redirect allow-list is the real constraint. |
| Site URL | `src/lib/site.ts` | `NEXT_PUBLIC_SITE_URL`, falling back to `https://tegaki-one.vercel.app`. The OG card **image** also prints `tegaki-one.vercel.app` (`scripts/generate-og.mjs:74`). |

## 2. Architecture deltas

```
Buyer (phone)                         Next.js (Vercel Hobby)                       Supabase
─────────────                         ─────────────────────                        ────────
/wizard/[id]/checkout ───────────────► Pay screen (RSC)                            settings.payments_mode ◄─ admin switch
   · "Pay in UPI app" (upi://pay)       · payments_flow() → demo | upi              orders.order_code (T-XXXX)
   · QR (inline SVG, server-rendered)   · amount = tier_price_inr() via RPC         tier_price_inr()
                                        · UPI_VPA / UPI_PAYEE_NAME (server env)
/wizard/[id]/checkout/receipt ───────► Receipt screen
   · upload screenshot ───────────────────────────────────────────────────────────► storage: payment-screenshots (private)
   · "Send for review" ───────────────► submitWithReceipt() ─── rpc ──────────────► submit_order_with_receipt()
                                                                                       payments(upi_qr, awaiting_verification)
                                                                                       payment_proofs(path, utr)
/dashboard ──────────────────────────► OrderCard + PaymentLine ◄─ select ─────────── payments, payment_proofs (read own)
Admin /admin/orders/[id] ────────────► Find-it panel · verify / not found / refund ─► verify_payment / reject_payment / record_refund
                                                                                     transition_order(→analysis_in_progress)
                                                                                       └─ refuses unless payment verified|demo_paid
Vercel Cron 22:00 UTC ───────────────► /api/cron/retention ── + screenshots, + payment parking
Vercel Cron 10:00 UTC ───────────────► /api/cron/keepalive ── heartbeat write + read, loud failure
```

### 2.1 The payments switch lives in the database (TP1)
The ticket text says "server-only env var". **This plan moves the switch to `settings.payments_mode`.**

**Why.** If the database doesn't know the mode, then in `live` mode a buyer can still call the old `submit_order()` over PostgREST. That creates a `demo_paid` payment, and the approval gate must accept `demo_paid` for legacy orders. The result is a free reading. So the database has to know the mode and refuse the wrong submit path.

**Functions.**
- `public.payments_mode()` returns `'demo' | 'admin_preview' | 'live'`. A missing or unknown value returns `'demo'` (fail closed).
- `public.upi_flow_for_caller()` is true when the mode is `live`, or when it is `admin_preview` and `is_admin()` is true.
- `submit_order()` (demo) refuses when `upi_flow_for_caller()` is true. `submit_order_with_receipt()` refuses when it is false.

**Switching.** Tushar changes the mode on `/admin/settings` with a three-way `PaymentsModeSwitch` beside `PauseSwitch`. No redeploy is needed; this follows the same precedent as the pause switch. A `settings` trigger rejects any `payments_mode` value outside the three.

**App side.** The app reads the flow through `src/lib/payments/mode.ts` (`getPaymentsFlow()` → `'demo' | 'upi'`, via the `upi_flow_for_caller` RPC), so the page and the database cannot disagree.

**UPI config.** `UPI_VPA` and `UPI_PAYEE_NAME` stay **server-only env vars**: the database never needs them, and they must appear in no tracked file. `getUpiConfig()` returns `null` if either is blank, and the UI then renders the "Payments are paused" card (fail closed, Design §6.1).

### 2.2 Data model (additive only, one migration per ticket)

**`orders.order_code`** (T16) is the human matching key.
- 4 characters of Crockford base32 (no I, L, O, U), shown as `T-4F2A`.
- A `before insert` trigger assigns it, retrying on collision against a UNIQUE index. The migration backfills existing rows.
- It lives on the order because the pay screen shows it *before* any payment row exists (TP3).

**`payments`**, widened. T17 adds the provider, statuses and receipt columns; T18–T20 add their columns.

| Column | Type | Rule |
|---|---|---|
| `provider` | text | `in ('demo','upi_qr')` |
| `status` | text | `in ('demo_paid','awaiting_verification','verified','not_found','refunded')`, with CHECK `(provider='demo') = (status='demo_paid')` |
| `utr` | text null | `~ '^[0-9]{12}$'` (the customer's latest typed UTR) |
| `submitted_at` | timestamptz | When the receipt was received |
| `verified_at`, `verified_by` | timestamptz, uuid | Set only by `verify_payment` |
| `not_found_reason`, `not_found_at` | text, timestamptz | Set by `reject_payment`; the reason is shown verbatim to the buyer |
| `refund_utr`, `refund_note`, `refunded_at`, `refunded_by` | | Set by `record_refund`; `refund_utr ~ '^[0-9]{12}$'` |

**`payment_proofs`** (T17, new) holds one row per screenshot the buyer has sent (TP2).
- Columns: `id`, `payment_id → payments on delete cascade`, `bucket_path` (unique), `utr`, `mime`, `size_bytes`, `created_at`.
- A re-attach adds a row, so admin keeps the history (T19), and retention has a list of paths to delete (T22).
- RLS: buyers read their own rows (through payment → order); admins read all. **No client write grants**: rows are written only by the definer RPCs.

**Storage bucket `payment-screenshots`** (T17).
- Private. `file_size_limit` is 10 MB; `allowed_mime_types` is `image/jpeg, image/png` (HEIC is dropped, TP6).
- Path: `<buyer_id>/<order_id>/<uuid>.<ext>`.
- Policies:
  - The owner may insert into their own folder while the order is `draft`, or while its payment is `not_found` (re-attach).
  - The owner and admins may select.
  - No client deletes; the service role deletes for retention.

### 2.3 Payment state machine
Enforced in the definer RPCs; there are no client write grants.

```
   ∅ ── submit_order() (mode allows demo) ──────► demo_paid    (terminal)
   ∅ ── submit_order_with_receipt() ────────────► awaiting_verification ──verify_payment──► verified ──record_refund──► refunded
                                                      ▲          │
                                                      │          └──reject_payment(reason)──► not_found ──verify_payment──► verified
                                                      └──────────reattach_payment_proof───────────┘
```

| RPC | Caller | Asserts and does |
|---|---|---|
| `submit_order_with_receipt(p_order_id, p_path, p_utr)` | owner | **Asserts:** everything `submit_order` asserts, plus `upi_flow_for_caller()`, plus the object exists in `payment-screenshots` at `p_path` inside the caller's folder for this order, plus `p_utr` is null or 12 digits. **Does, in one transaction:** inserts the payment (`upi_qr`, `awaiting_verification`, amount = `tier_price_inr`) and the proof, then calls `transition_order(→ sample_under_review)`. |
| `verify_payment(p_order_id)` | admin | `awaiting_verification` or `not_found` (Tushar may find it late) → `verified`. Stamps who and when. |
| `reject_payment(p_order_id, p_reason)` | admin | `awaiting_verification` → `not_found`. The reason is required and trimmed. |
| `reattach_payment_proof(p_order_id, p_path, p_utr)` | owner | Payment is `not_found` and the object exists in the caller's folder → adds a proof row, updates `utr`, and moves back to `awaiting_verification`. Proof history is kept. |
| `record_refund(p_order_id, p_utr, p_note)` | admin | `verified` → `refunded`. The refund UTR is required (12 digits). Order status is untouched (S5). |

### 2.4 The approval gate (T18, S3)
`transition_order()` gains one guard. It sits inside the function, so no caller bypasses it:

```sql
if p_to = 'analysis_in_progress' and not exists (
  select 1 from public.payments p
  where p.order_id = p_order_id and p.status in ('verified', 'demo_paid')
) then
  raise exception 'Mark the payment as paid before approving the sample' using errcode = 'check_violation';
end if;
```

`needs_reupload` is unaffected: rejecting a sample needs no payment. The guard deliberately applies to `is_system` too; a test proves that the service role is refused as well.

### 2.5 Parking an unfound payment (T19, TP9)
- **New edge:** `transition_order` gains `sample_under_review → parked`.
  - Admin or system may walk it any time.
  - The owner may walk it only when their payment has been `not_found` for more than 14 days. This is the same "the deadline decided" rule as `needs_reupload → parked`, which keeps the dashboard-load sweep working without granting new privileges.
- **Sweep:** `park_overdue_orders()` gains a second loop over `sample_under_review` orders whose payment is `not_found` with `not_found_at < now() - payment_park_days()`.
- **The 14-day threshold** is stated once, in `payment_park_days()` returning 14. `src/lib/payments/constants.ts` mirrors it, and a test asserts the two agree (the same pattern as `retention_days()`).

### 2.6 The QR and the link (T16, TP4, TP11)
**URI.** `src/lib/payments/upi.ts` has `buildUpiUri({ vpa, payeeName, amountInr, orderCode })`. It returns, for example, `upi://pay?pa=…&pn=…&am=1999.00&cu=INR&tn=Tegaki%20T-4F2A`.
- Every value goes through `encodeURIComponent`; spaces become `%20`, never `+`.
- `am` always has two decimals.
- It is a pure function and the single source for both the QR and the link.

**QR.**
- Rendered with the `qrcode` package on the server: `QRCode.toString(uri, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })`, inline in a server component, so no client JavaScript.
- White tile, about 14rem.
- `role="img"` with `aria-label` "UPI QR: pay ₹1,999 to <payee>, note Tegaki T-4F2A".

**Test decode.** The unit test renders the same URI with `QRCode.toBuffer`, decodes it with `jsqr` and `pngjs`, and asserts the result equals `buildUpiUri(...)`.
- New dependency: `qrcode`.
- New devDependencies: `jsqr`, `pngjs`, `@types/qrcode`.
- All pinned to versions at least two weeks old.

**Phone vs desktop.** Chosen by CSS (`sm:` = 640px, Design §6.1), not by UA sniffing. Both trees render; on phones the QR sits inside `<details>`.

**Platform behaviour.** §9.3 covers what iOS and personal-VPA intents actually do. It is the riskiest unknown in the whole amendment, so T16 opens with a real-device spike (TP11).

### 2.7 Screens and routes (T16, T17, TP5)
**Checkout page.** `src/app/wizard/[orderId]/checkout/page.tsx` branches on `getPaymentsFlow()`:
- `demo`: today's page, unchanged. Its body moves into `src/components/wizard/demo-checkout.tsx`.
- `upi`: `<PayScreen>`.

**Receipt page.** `src/app/wizard/[orderId]/checkout/receipt/page.tsx` is new.
- Resume works by URL: returning from the UPI app keeps the tab, and a reload stays put.
- If the buyer comes back through the dashboard's "Continue", they land on the pay screen, whose secondary CTA goes to the receipt. No new column is needed.

**Focus.** The H1 has `tabIndex={-1}` and is focused on mount by a small client component, `FocusHeading`.

**Upload.**
- Follows the existing client-upload pattern (`src/lib/uploads/upload-client.ts`), against the new bucket.
- The file uploads when it is chosen; submit sends only the path.
- `src/lib/payments/constants.ts` holds the 10 MB and MIME limits, shared by the client validator, the bucket config and a test.

**Seal stamp.** `ConfirmOrder`'s stamp beat is reused unchanged; only the action it calls changes.

### 2.8 Admin (T18–T20)
- **Order query:** `getAdminOrder()` also selects the payment and its proofs. Proof signed URLs reuse `signed-url.ts` with the new bucket and a 10-minute TTL.
- **Server actions** in `src/lib/admin/payment-actions.ts`: `verifyPayment`, `rejectPayment`, `recordRefund`. Each calls `getAdmin()` first, then the RPC, and maps `23514` messages to the UI. The database guard is the real enforcement.
- **Queue filters:** `?payment=to_check|not_found|paid|refunded`. Counts come from one `admin_payment_counts()` RPC.
- **Order-code search:** the queue gets a search box. An unexplained credit carrying `Tegaki T-XXXX` must be traceable to its order.
- **"Approve sample":** disabled unless the payment is `verified` or `demo_paid`, with the reason as text. The RPC refuses regardless.

## 3. Ops (T24, T25)

### 3.1 Keep-alive (T24, TP7)
- **Route:** `src/app/api/cron/keepalive/route.ts`. It reuses the retention route's `authorized()`, extracted to `src/lib/cron/auth.ts`. That is a move with no behaviour change; the retention tests guard it.
- **Write, not just a read** (§9.1: Supabase counts *database* activity, and a write is the unambiguous kind):
  - The `keepalive_ping()` RPC upserts `heartbeat(id=1, beat_at=now())` and returns the previous `beat_at`.
  - `heartbeat` is a one-row table, RLS-on, readable by admins only.
- **Logging:**
  - Healthy: `console.log('[keepalive]', { ok, ms, previousBeatAt })` and status 200.
  - Failure, or a timeout after 8 s (`AbortSignal.timeout`): `console.error('[keepalive] DB did not answer', …)` and status 503, so the cron shows red in Vercel.
- **Stale-heartbeat signal:** the admin settings page shows "Last heartbeat: <time>". If it is more than 36 hours old, it switches to a warn panel. Tushar visits admin regularly, which makes this the cheapest alert that needs no third-party service.
- **Schedule:** `vercel.json` adds `{ "path": "/api/cron/keepalive", "schedule": "0 10 * * *" }`. That is 12 hours from retention, so the database is touched twice a day by independent routes. Hobby allows daily crons, with ±59 minutes of jitter.
- **Last resort:** Supabase emails the account owner about a week before pausing (§9.1). Tushar confirms which inbox the Supabase account uses.

### 3.2 Pause RCA (T24), evidence plan run during the ticket
**Known.**
- The last production deploys were 2026-09-29 and 2026-10-13.
- `CRON_SECRET` exists in production.
- The retention route returns **401 before touching the database** when the secret mismatches. A misconfigured cron therefore produces *zero* database activity while still "running".
- Supabase says even regular use "may not be enough" to avoid pausing (§9.1).
- The 2026-09-02 project notes listed "`CRON_SECRET` must exist in Vercel, or the nightly retention job 401s" as an open item only Tushar could close. When it was actually added is the first fact to establish.

**Hypotheses.**
- **H1:** the deployment serving 09-29 → 10-13 lacked `CRON_SECRET`, or held a different value. Env changes only reach new deployments.
- **H2:** Supabase's inactivity measure ignored the job's RPCs (read-only `security definer` calls on near-empty tables).
- **H3:** the cron was not registered for that deployment.

**Evidence.**
1. **Supabase → Reports / Usage:** daily API and database requests, 09-29 → 10-13. One burst per day means the cron reached the database, which rules out H1 and H3.
2. **Vercel → Settings → Cron Jobs:** registered, enabled, last run.
3. **Vercel → Environment Variables:** the `CRON_SECRET` "updated" date compared with the 09-29 deploy.
4. **The warning email** (Tushar's Supabase inbox): its date, and any reason it gives.
5. **The deployed route:** called with a wrong secret (expect 401), and by Tushar with the right one (expect 200 and a `[retention]` line within the 1-hour log window).

**Output.** An **RCA1** entry in `decisions.md`, plus a regression guard matched to the cause:
- If H1: a build-time check (`scripts/check-env.mjs`, run from `build` when `VERCEL_ENV=production`) fails the build if `CRON_SECRET`, `UPI_VPA` or `UPI_PAYEE_NAME` is missing.
- If H2: the heartbeat write above is the fix, and the next pause-free month is the evidence.

### 3.3 Domain move (T25, TP8)
Full steps are in `plans/T25-domain-move.md`; confirmations are in §9.2.
1. Add `tegaki.tusharpathak.com` to the Vercel project. DNS is on Vercel, so the record is automatic.
2. Edit `tegaki-one.vercel.app` and choose **Redirect to** `tegaki.tusharpathak.com` with **308**. Verify that path and query survive with `curl -sI`.
3. Set `NEXT_PUBLIC_SITE_URL=https://tegaki.tusharpathak.com` (production) and redeploy.
4. Supabase Auth:
   - Set the Site URL to the new domain.
   - Add `https://tegaki.tusharpathak.com/auth/callback`; an exact path is what Supabase recommends for production.
   - Keep the old entries until the cutover is verified, then remove them.
5. Google OAuth client:
   - The redirect URI stays the Supabase callback; no change.
   - Add `https://tegaki.tusharpathak.com` to Authorized JavaScript origins (harmless).
   - Add `tusharpathak.com` to the consent screen's authorized domains.
   - Brand verification is **not** needed for basic sign-in.
6. Regenerate `public/og-cover.png` with the new host text (`scripts/generate-og.mjs`), then re-scrape it in LinkedIn Post Inspector and opengraph.xyz.

## 4. Observability and failure modes

| Failure | How we'd know | Behaviour |
|---|---|---|
| Supabase pauses | Keep-alive 503 shows a red cron in Vercel; the stale-heartbeat panel in admin; Supabase's warning email | T24 makes a pause unlikely and loud |
| `UPI_VPA` unset | The pay card shows "Payments are paused"; `console.error('[payments] UPI config missing')` | No QR, no submit (fail closed) |
| `payments_mode` row missing or invalid | `payments_mode()` returns `demo` | Today's checkout (fail closed) |
| The UPI app blocks or warns on a P2P intent | The customer can't pay, or sees a "risky" warning (§9.3) | Copy-UPI-ID and copy-amount fallback; T16's spike decides what leads |
| Wrong amount paid, or the note edited | Tushar sees the mismatch in the Find-it panel | "Not found…" with a reason, then re-attach; or a refund (S5) |
| Paid, but no receipt ever attached | The order stays `draft`; the credit is unmatched | Tushar searches the `T-XXXX` code in the admin queue |
| Upload succeeds but submit fails | An orphan object in the buyer's folder | A retry reuses the path. A sweep for orphans is out of scope (§8) |
| Vercel suspends the project (S8) | The site is down | Refund in-flight orders from the admin record, then upgrade to Pro |

## 5. Security notes
- **The amount is never client-supplied.** The RPCs read `tier_price_inr(o.tier)`, and the pay screen reads the same function via RPC, so what is displayed equals what is recorded. The price-parity test still guards `tiers.ts` for the marketing pages.
- **Screenshot paths are validated in SQL.** The path must be in the caller's folder for this order, and the object must exist. This is the same defence as `order_files`.
- **Every money write is an admin RPC** behind `is_admin()`. `authenticated` has no table write grants on `payments`, `payment_proofs` or `heartbeat`.
- **The VPA lives only in env.** A codebase test fails if any tracked file contains a UPI handle pattern outside an allowlisted fixture. It is rendered only to signed-in buyers on the pay screen.
- **The mode can't be bypassed through RPC** (TP1).

## 6. Testing strategy

| Layer | Where | Runs |
|---|---|---|
| Pure unit: UPI URI, QR decode, order-code format, validators, mode resolution | `tests/lib/payments/*.test.ts` | Always |
| Database and RLS: RPC guards, the gate, bucket policies, parking boundary, retention boundary | `tests/rls/payments-*.test.ts`, against the live project | When env vars are present. **With `REQUIRE_DB_TESTS=1` (release), a skip fails** (TP10) |
| Codebase guards: no VPA in tracked files, no demo wording in `live` copy | `tests/codebase/*.test.ts` | Always |
| Routes: keep-alive and retention with a stubbed client | `tests/lib/cron/*.test.ts` | Always |
| E2E: pay → receipt → dashboard line; admin verify → approve; reject → re-attach | `e2e/payments-*.spec.ts`, phone and desktop projects | Locally, against the dev server and live Supabase |
| Manual | The T16 real-device spike; T23 walk-through | T16, T23 |

Commands, unchanged:
- `pnpm exec next typegen && pnpm -s typecheck`
- `pnpm exec eslint .`
- `node scripts/check-claims.mjs`
- `pnpm vitest run`
- `pnpm exec playwright test`, with `PLAYWRIGHT_BROWSERS_PATH` and `TMPDIR` on the E Drive

## 7. Sequencing, deployment, migration, rollback

**Order.** T24 ∥ T25, then T16, then T17, then (T18 → T19 ∥ T20) ∥ T21 ∥ T22, then T23.
- One branch per ticket off `main`, merged when green. Vercel deploys `main`.

**Migrations.**
- Additive, one file per ticket (`202610…_payments_*.sql`), applied with `supabase db push` before the merge that needs them.
- Each is safe under the old code: new columns are nullable or defaulted, CHECKs only widen, and nothing changes behaviour while the mode is `demo`.
- The T18 gate needs no backfill: every existing payment is `demo_paid`, which the gate allows.

**Release (T23).**
1. Walk through the flow in `admin_preview`.
2. Flip the mode to `live` on `/admin/settings`.
3. Watch the first order.
4. In a follow-up PR, delete the demo checkout component and the `PILOT_*` strings. The SQL `submit_order()` stays and refuses in `live`; dropping it is a later cleanup.

**Rollback.**
- Flip `payments_mode` back to `demo`. This is instant and needs no deploy. In-flight UPI orders keep their payment rows, and admin can still verify, reject or refund them.
- For code: Vercel Instant Rollback. The migrations are additive, so old code still runs.

## 8. Out of scope (logged, not built)
- Gateway or webhook verification.
- OCR.
- An orphan-screenshot sweep.
- Email or WhatsApp notifications on payment state.
- GST invoices.
- A rich proof-history UI (a list is enough).
- Dropping SQL `submit_order()`.
- An external uptime monitor.

## 9. Confirmations requested by the handoff (researched 2026-10-14)

### 9.1 Supabase free-plan activity rules (T24)
**What the official doc says** ([Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)):
- A free project is paused after **7 days of low *database* activity**. "A few user requests to the database each day" is typically enough.
- The doc also warns that ordinary use "may not be enough".
- Supabase emails a warning about a week before pausing, then again when it pauses.

**What it does not say.** It doesn't define whether service-role REST or RPC calls count. Community answers (e.g. [discussion #13121](https://github.com/orgs/supabase/discussions/13121)) say real queries or transactions count and idle connections don't. Writes are the unambiguous case.

**Consequence.** The keep-alive *writes* a heartbeat row (§3.1), and an in-database `pg_cron` job can't help, because it stops when the database pauses. There are anecdotes of daily pings still getting paused, which is why the RCA checks Usage first rather than assuming.

### 9.2 Google OAuth and Supabase redirect steps for the new domain (T25)
**Supabase** ([Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)):
- Site URL is the default redirect.
- In the allow-list, `*` stays within one segment and `**` matches anything.
- Exact paths are recommended in production.

**Google** ([Supabase Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google)):
- The *redirect URI* is only the Supabase callback `https://<ref>.supabase.co/auth/v1/callback`, so it is **unchanged**.
- Authorized JavaScript origins matter only for browser-initiated GIS / One Tap flows. Adding the new origin is harmless.
- The consent screen's authorized domains must cover every domain used by its links. Adding `tusharpathak.com` needs Search Console verification **only for brand verification** (name and logo on the consent screen), which basic `openid email profile` sign-in does not need.

**Vercel** ([Deploying & redirecting](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)):
- The default `.vercel.app` domain can be set to "Redirect to" a custom domain.
- The status code and the path/query preservation are verified with `curl -sI` in T25 rather than assumed.

### 9.3 UPI intent on iOS, and P2P limits (T16): the riskiest unknown
**iOS.** `upi://pay` opens *some* installed UPI app, with **no chooser**, and which one is undefined. With none installed, nothing happens, and a web page can't detect installed apps ([upi_pay docs](https://pub.dev/packages/upi_pay)). App-specific schemes (`gpay://upi/pay`, `phonepe://pay`, `paytmmp://pay`) are widely used ([Cashfree](https://www.cashfree.com/docs/payments/online/mobile/misc/upi_intent_support_js_sdk.md), [Razorpay iOS](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/webview/upi-intent-ios.md)), but their exact paths are folklore until tested on a device.

**Personal VPA (P2P) intents. Unverified, but material:**
- Developer reports of GPay showing "this payment may be risky" or declining *after the PIN* on app-initiated payments to non-merchant VPAs.
- A report (MediaNama, Aug 2025) that NPCI caps "Share-intent-and-pay" and "QR-share-and-pay" at **₹2,000**. The circular itself was not found.
- Comprehensive costs **₹2,999**.
- NPCI's end of P2P *collect* requests (Oct 2025) doesn't affect payer-initiated pay links.

**What this means.** The "Open in UPI app" primary CTA on phones (D1) may fail for real customers, and a scan-and-cancel test **cannot detect it**, because the failures reported happen after the PIN. TP11 therefore makes T16 open with a **real-device spike before any UI is built**:
1. Tushar generates a ₹1 link and QR locally (`scripts/upi-probe.mjs`; it is never deployed).
2. A second person pays it from GPay and from PhonePe, on Android and on iPhone, via the link and via scanning.
3. They repeat one payment at ₹2,001 via the link, then Tushar refunds both.

**Outcomes.**
- **All pass:** build D1 as designed.
- **The intent fails but scanning passes:** phones lead with "Pay to UPI ID", meaning Copy UPI ID plus Copy amount, then paste in any UPI app, and the QR stays for a second device. That changes a frozen CTA, so it goes back to design review before T16 continues.
- **Over ₹2,000 fails:** decide the Comprehensive tier's path with Tushar (split payment, or bank transfer details) before T23.
