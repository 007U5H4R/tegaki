# Test Cases — Tegaki payments amendment v1.1

> **Stage 6**, 2026-10-14. These are the cases that prove T16–T25.
> - **Prefix `TC-P`:** keeps these clear of other TC namespaces.
> - **Not padded:** every case maps to a real risk in `technical-plan.md` §4–§5 or an acceptance line in `tickets.md`.
> - **No EVAL links** (EV5).
> - **Status:** every case starts at `planned`. The implementer sets `pass` or `fail`, and fills **Finding** with a commit or issue ref when a case fails.
>
> **Shared preconditions:** unless a case says otherwise:
> - The Supabase test env is set (`tests/rls` conventions: throwaway buyers A and B, admin user).
> - `payments_mode` is set per case through the service role, and restored afterwards.
> - Fixture VPA `test@upi`, payee "Test Payee".
>
> **Types:** RLS = database/RLS test against the live project · Unit · Route · E2E (Playwright) · Codebase (repo grep) · Manual.
> **Auto?:** Y = automate; N = stays manual.

## M-005 · Ops (T24, T25)

| ID | Title | Ticket | Steps, data | Expected | Type | Pri | Auto? | Status | Finding |
|---|---|---|---|---|---|---|---|---|---|
| TC-P01 | Keep-alive writes when healthy | T24/B1 | Call the route with a valid secret; stub RPC → `{previous: t0}` | 200; one `[keepalive]` info line; RPC called once | Route | High | Y | pass | T24 orchestrator gate run 2026-10-14 |
| TC-P02 | Keep-alive fails loudly | T24/B1 | Stub RPC error; separately, a hanging RPC that exceeds 8 s | 503 and a `console.error('[keepalive] …')`, for both | Route | Critical | Y | pass | T24 orchestrator gate run 2026-10-14 |
| TC-P03 | Keep-alive refuses without the secret | T24/B1 | No header; wrong header; `CRON_SECRET` unset | 401 in all three; RPC never called | Route | Critical | Y | pass | T24 orchestrator gate run 2026-10-14 |
| TC-P04 | Heartbeat is admin-read, service-write only | T24/A2 | Buyer selects `heartbeat` and calls `keepalive_ping`; service role pings twice | Buyer refused both; the second ping returns the first ping's time | RLS | High | Y | pass | T24 orchestrator gate run 2026-10-14 |
| TC-P05 | Stale heartbeat warns in admin | T24/C1 | Render with a beat 2 h old, 37 h old, and missing | Fresh text; warn panel; warn panel | Unit | Medium | Y | pass | T24 orchestrator gate run 2026-10-14 |
| TC-P06 | Both crons registered in production | T24/B2 | Vercel → Cron Jobs after deploy | Both `retention` and `keepalive` are listed and enabled | Manual | High | N | planned | |
| TC-P07 | RCA1 written with evidence | T24/R1 | Usage chart, cron state, env date, warning email | `decisions.md` RCA1 names a cause and a guard; Tushar has read it | Manual | High | N | planned | |
| TC-P08 | Sign-in on the new domain | T25/C1 | Production Google sign-in at `tegaki.tusharpathak.com`, on desktop and on phone | Lands on `/dashboard`, signed in | Manual | Critical | N | planned | |
| TC-P09 | Old URLs redirect with path and query | T25/C1 | `curl -sI` on `/`, `/dashboard`, `/sign-in?tier=core` at `tegaki-one.vercel.app` | 308; `location` is the same path and query on the new host | Manual | High | N | planned | |
| TC-P10 | Link preview uses the new host | T25/A2,B1 | View source; LinkedIn Post Inspector; opengraph.xyz | Absolute `https://tegaki.tusharpathak.com/…` OG URLs; the image shows the new host | Manual | Medium | N | planned | |

## M-006 · Pay tracer (T16, T17)

| ID | Title | Ticket | Steps, data | Expected | Type | Pri | Auto? | Status | Finding |
|---|---|---|---|---|---|---|---|---|---|
| TC-P11 | Real-device payment spike | T16/S0 | ₹1 via link and via scan, in GPay and PhonePe, on Android and iPhone; one ₹2,001 via link | Every cell completes, or the failure is recorded and goes to design review (TP11-result) | Manual | Critical | N | planned | |
| TC-P12 | UPI URI is exact and encoded | T16/B1 | `buildUpiUri({vpa:'test@upi', payeeName:'Test & Payee', amountInr:1999, orderCode:'4F2A'})` | `pa=test%40upi`, `pn=Test%20%26%20Payee`, `am=1999.00`, `cu=INR`, `tn=Tegaki%20T-4F2A`; no `+` | Unit | Critical | Y | planned | |
| TC-P13 | QR decodes to the link | T16/B2 | For each tier: render the QR, then decode it with jsQR | The decoded string equals `buildUpiUri(...)` exactly | Unit | Critical | Y | planned | |
| TC-P14 | Amount is server-side | T16/B4 | Stub `tiers.ts` Core = 1; RPC `tier_price_inr('core')` = 1999 | The pay screen and URI show 1999 | Unit | Critical | Y | planned | |
| TC-P15 | Fail closed without UPI config | T16/C3 | `UPI_VPA` unset; separately, `UPI_PAYEE_NAME` blank | No `upi://` and no QR SVG in the HTML; the "Payments are paused" card renders; one error log | Unit | Critical | Y | planned | |
| TC-P16 | Mode resolution and DB enforcement | T16/A1,A3 | Modes demo / admin_preview / live / garbage × admin / buyer: call `upi_flow_for_caller()` and demo `submit_order()` | Flow: F/F, T/F, T/T; garbage is refused on write and reads as demo. Demo submit is refused exactly when the flow is T | RLS | Critical | Y | planned | |
| TC-P17 | Demo mode unchanged | T16/C1 | Mode `demo`, buyer at checkout | HTML matches the pre-T16 snapshot; seal stamp and dashboard as today | E2E | High | Y | planned | |
| TC-P18 | Admin-preview shows UPI to admins only | T16/C5 | Admin sets `admin_preview` in settings; admin and buyer each open checkout | Admin sees the pay screen; buyer sees the demo checkout | E2E | High | Y | planned | |
| TC-P19 | No VPA in tracked files | T16/D1 | Run the guard; plant a fake handle (a name, `@`, then a bank suffix such as `okaxis`) in a temp tracked file | Green on the real tree; red with the plant | Codebase | Critical | Y | planned | |
| TC-P20 | Order code format and uniqueness | T16/A2 | Insert 200 orders | Every code matches `^[0-9A-HJKMNP-TV-Z]{4}$` and none repeats; existing rows are backfilled | RLS | Medium | Y | planned | |
| TC-P21 | Pay screen responsive and accessible | T16/C2,D2 | 375 / 768 / 1280 | No horizontal scroll and no console errors; app link leads on phone, QR leads on desktop; QR `aria-label`; targets ≥44px | E2E | High | Y | planned | |
| TC-P22 | Submit requires a screenshot | T17/A2 | Direct RPC with a missing object; with another user's path; with a malformed UTR `12345` | Each refused; order still `draft`; 0 payments | RLS | Critical | Y | planned | |
| TC-P23 | Screenshot privacy | T17/A1 | Buyer B lists, reads, signs and uploads into A's folder; anon does the same; admin reads | B and anon refused on all; admin allowed | RLS | Critical | Y | planned | |
| TC-P24 | File limits | T17/A1,B2 | 10 MB + 1 byte PNG; a HEIC file; a 2 MB JPG | Rejected with a clear message; rejected ("JPG or PNG"); accepted. Bucket config equals the constants | Unit+RLS | High | Y | planned | |
| TC-P25 | Happy submit, exactly once | T17/D1 | Phone viewport: pay → receipt → attach PNG + UTR `123456789012` → double-click "Send for review" | Stamp plays; 1 payment `awaiting_verification`, 1 proof; dashboard shows "Checking your payment" | E2E | Critical | Y | planned | |
| TC-P26 | Receipt screen resumes | T17/C2 | Reload `/checkout/receipt`; open it directly in a new tab | The receipt screen renders, with focus on the H1 | E2E | Medium | Y | planned | |

## M-006 · Verify loop (T18, T19, T20)

| ID | Title | Ticket | Steps, data | Expected | Type | Pri | Auto? | Status | Finding |
|---|---|---|---|---|---|---|---|---|---|
| TC-P27 | Approval gate in the database | T18/A1 | `transition_order(→analysis_in_progress)` as admin **and** as service role, for each payment status | Refused for `awaiting_verification`, `not_found`, `refunded`; allowed for `verified`, `demo_paid` | RLS | Critical | Y | planned | |
| TC-P28 | Sample rejection is unaffected | T18/A1 | `→ needs_reupload` with a reason, payment unverified | Allowed | RLS | High | Y | planned | |
| TC-P29 | Buyers can't touch payment state | T18/A1 | Buyer: PATCH `payments` (status, amount, verified_*); calls `verify_payment`, `reject_payment`, `record_refund` | All refused; row unchanged | RLS | Critical | Y | planned | |
| TC-P30 | Verify, then approve | T18/D1 | Admin opens a seeded order; Approve is disabled; "Found it, mark paid"; Approve | Disabled with its reason, then enabled; order `analysis_in_progress`; buyer sees "Paid" | E2E | Critical | Y | planned | |
| TC-P31 | Queue filters and code search | T18/C3, T19/C4, T20/C3 | Seed one order per payment state; click each pill; search `t-4f2a` and `4F2A` | Counts and rows match the DB; both searches find the order | E2E | Medium | Y | planned | |
| TC-P32 | Not found needs a reason | T19/A1 | `reject_payment` with `''` and `'   '`; buyer calls it | Refused, refused, refused | RLS | High | Y | planned | |
| TC-P33 | Re-attach rules | T19/A1 | Owner re-attaches while `not_found`; owner re-attaches while `awaiting_verification`; buyer B re-attaches A's | Allowed (2 proofs, status back to `awaiting_verification`); refused; refused | RLS | High | Y | planned | |
| TC-P34 | Parking boundary at 14 days | T19/A1 | Backdate `not_found_at` to now − 13 d 23 h and to now − 14 d 1 min; run the sweep as owner and as service role | First not parked; second parked; owner can't park early via `transition_order` | RLS | High | Y | planned | |
| TC-P35 | Reject, re-attach, verify loop | T19/D1 | Admin "Not found…" with a reason containing `<b>`; buyer views it and re-attaches; admin verifies | Reason shown verbatim as text (not HTML); 2 proofs in admin; buyer sees "Paid" | E2E | High | Y | planned | |
| TC-P36 | Refund rules | T20/A1 | `record_refund` from each non-verified status; without a UTR; as a buyer; twice | All refused except the first valid call from `verified`; order status unchanged | RLS | High | Y | planned | |
| TC-P37 | Refund shows to the customer | T20/D1 | Admin records refund UTR `123456789012` on a parked, verified order | Card shows "Refunded ₹X on <date> · ref 123456789012"; Refunded filter lists it | E2E | Medium | Y | planned | |

## M-006 · Ship set (T21, T22, T23)

| ID | Title | Ticket | Steps, data | Expected | Type | Pri | Auto? | Status | Finding |
|---|---|---|---|---|---|---|---|---|---|
| TC-P38 | No demo wording in live | T21/D1 | Render all policy and FAQ content plus payment copy in `live` mode, and in `demo` mode | Live: no match for the demo-wording regex. Demo: strings unchanged | Codebase | Critical | Y | planned | |
| TC-P39 | Claims guard passes | T21/B2 | `node scripts/check-claims.mjs` | Exit 0 | Codebase | High | Y | planned | |
| TC-P40 | Screenshot retention boundary | T22/A1 | Delivered 89, 90 and 91 days ago, each with a proof; run the purge twice | Only the 91-day proofs are gone, both object and row; second run deletes 0; payment rows remain | RLS | High | Y | planned | |
| TC-P41 | Erasure removes screenshots | T22/A1,B2 | `purge_order_data` in redact and erase modes on an order with 2 proofs | Paths returned for both modes; objects gone; redact keeps the payment amount and status | RLS | High | Y | planned | |
| TC-P42 | Retention logs its counts | T22/B1 | Route with a stubbed client | `[retention]` line includes `screenshotObjectsDeleted`, `proofsDeleted`; a storage error gives 500 | Route | Medium | Y | planned | |
| TC-P43 | Release run can't skip DB suites | T23/A1 | `REQUIRE_DB_TESTS=1` with the Supabase env unset; then with it set | Fails loudly; then green with 0 skipped DB tests | Unit | Critical | Y | planned | |
| TC-P44 | Production phone walk-through | T23/B1 | The 10-step script in `plans/T23-release-walkthrough.md`, at 375px in `admin_preview` | Every step passes; screenshots saved; Tushar signs off | Manual | Critical | N | planned | |
| TC-P45 | Rollback by switch | T23/C1 | Set mode `live` → `demo` with an in-flight UPI order | Buyers see the demo checkout; the admin can still verify, reject and refund the in-flight order | E2E | High | Y | planned | |
