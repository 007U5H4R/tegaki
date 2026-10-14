# Decision Log — Tegaki

Decisions behind Solution-PRD v1.0 (2026-09-01) are recorded in `Discovery-PRD.md`. This log starts with the v1.1 payments amendment.

## S1 · Take real payment by a self-generated per-order UPI QR — accepted
**Context.** The pilot exists to answer "would a stranger pay?", and demo checkout cannot answer it. Cashfree needs merchant KYC that takes days to weeks.
**Decision.** Checkout shows a per-order `upi://pay` QR (exact server-side tier price, order code in the note) plus an "Open in UPI app" button. Tushar verifies each payment by hand.
**Rejected.** Gateway dynamic QR via Cashfree or Razorpay: automatic confirmation, but the KYC wait and a 2–3 day build are too much for ~10 pilot orders. It stays the post-pilot upgrade, and the `payments` table stays gateway-ready.

## S2 · Pay to Tushar's personal UPI ID, set in config — accepted
**Context.** A merchant UPI ID needs a sign-up; a personal one works today.
**Decision.** Personal VPA and payee name, both read from environment config.
**Rejected.** A merchant VPA now: cleaner for the bank, but an extra sign-up for a 10-order pilot. Because it is config, switching later needs no code change.

## S3 · Review the sample in parallel; gate approval on a verified payment — accepted
**Context.** Payment verification and sample review are both done by Tushar by hand.
**Decision.** No new order status. The order enters `sample_under_review` on submit, and the transition to `analysis_in_progress` is refused in the database unless the payment is `verified`.
**Rejected.** A separate "payment check" order status: cleaner audit trail, but more state-machine change. Pay after sample approval: no one pays for an unreadable photo, but it adds a round trip and a drop-off point.

## S4 · Screenshot required, UTR optional, with a reject-and-re-attach path — accepted
**Context.** Tushar asked for a screenshot stage. Indian customers expect to send one, and it saves hunting for a typed UTR.
**Decision.** The payment screenshot is required and the UTR is optional. If no matching credit is found: "Payment not found" with a reason, the customer re-attaches, and 14 days unresolved parks the order. The screenshot is evidence, not proof, and lives in a private bucket under sample-equivalent RLS and retention. No OCR.
**Rejected.** Both fields required: one more field for little gain. No in-app reject path: the dashboard could not explain a problem.

## S5 · Manual UPI refunds, recorded in admin — accepted
**Context.** The Refunds page promises a full refund for an unusable sample within 7 working days.
**Decision.** Tushar refunds from his UPI app, then records "Mark refunded" with the refund UTR and a note. Refunded is a payment state, not an order state.
**Rejected.** Unrecorded refunds: no audit trail, so the 7-day promise is easy to miss.

## S6 · Move hosting to Netlify free on tegaki.tusharpathak.com — rejected
**Context.** Vercel Hobby is non-commercial-only, and real payments make Tegaki commercial. A custom domain does not change the plan's terms.
**Decision.** Host on Netlify's free plan, which permits commercial use (to be re-verified in Stage 6), at `tegaki.tusharpathak.com`. Its DNS already lives in Tushar's Vercel DNS and CNAMEs to Netlify. The cron becomes a Netlify scheduled function, and the old `tegaki-one.vercel.app` URL redirects.
**Rejected.** Vercel Pro (~$20/month): zero migration risk, but breaks the ₹0/month goal. Cloudflare via OpenNext: the largest migration risk on Next 16. Staying on Hobby: risks suspension with customers' money in flight.

## S7 · The daily scheduled job doubles as a Supabase keep-alive — accepted
**Context.** On 2026-10-13 the free Supabase project paused unnoticed and Google sign-in broke silently, even though a nightly job existed. Its logs were not retained on Hobby, so the cause is unknown.
**Decision.** The scheduled job must do a real database read daily and log an error when the database does not answer. Why the existing job did not prevent the pause is investigated in Stage 6.
**Rejected.** Supabase Pro ($25/month): never pauses, but breaks the ₹0/month goal.

## S8 · Stay on Vercel Hobby at tegaki.tusharpathak.com, accepting the commercial-use risk — accepted
**Context.** S6 (move to Netlify) was rejected: Tushar wants to stay on Vercel. Hobby's terms are non-commercial only, and Tegaki now takes real money.
**Decision.** Stay on Vercel Hobby for the pilot and serve the site at `tegaki.tusharpathak.com`, with the old `tegaki-one.vercel.app` URL redirecting to it. The commercial-use breach is recorded as an accepted risk and revisited at the go/no-go note. If Vercel suspends the project: refund in-flight orders from the admin record, then upgrade to Pro.
**Rejected.** Vercel Pro (~$20/month): compliant and gives 1-day logs, but Tushar chose ₹0/month for the pilot. Netlify (S6): Tushar prefers to stay on Vercel.

## EV1 · Evaluation categories for the payments amendment — rejected
**Context.** Real money and personal data (payment screenshots) are entering a CRUD app with no AI in this scope.
**Decision.** Evaluate functional, security, reliability, product acceptance, and focused design (payment step and status card). Most cases are deterministic pass/fail: critical and high must hit 100% with 0 skipped; medium must reach ≥90%. 28 cases (17 critical) in `evals/eval-cases.json`.
**Rejected.** AI evals: there is no AI behaviour. A new performance suite: nothing is latency-sensitive at ~10 orders/month, and the existing landing budget still applies. Scored quality metrics: correctness of money handling is binary.

## EV2 · Database and RLS suites run against the live Supabase project — rejected
**Context.** There is one Supabase project, and the RLS tests already create and delete throwaway users there. Tushar chose to keep it that way.
**Decision.** Keep running against the live project. Add a release-mode guard (EVAL-027) so a run where those suites skip for missing env vars fails instead of reporting green.
**Rejected.** A second free Supabase project: it also pauses after a week, so it would often be asleep on build day. Local Supabase in Docker: needs a multi-GB install.

## EV3 · No real-money acceptance run; manual scan-and-cancel instead — rejected
**Context.** Tushar declined a real-money run.
**Decision.** Replace it with EVAL-022: scan each tier's QR in GPay or PhonePe on a real Android phone, confirm payee, amount and note, then cancel. Accepted limitation: the first real customer is the first real UPI credit, mitigated by manual verification before any work starts (S3).
**Rejected.** Paying ₹999 to himself and refunding it: declined by Tushar. A ₹1 hidden test tier: adds a code path real customers never use.

## EV4 · Regression baseline at the start of Stage 7 — rejected
**Context.** No quality metric is being optimised, but the existing suites must not regress.
**Decision.** Before any code changes, run the existing suites on `main` and save the real output to `evals/results/baseline-v1.json` with provenance. Release compares against it.
**Rejected.** A scored baseline: there is nothing scored to compare.

## EV5 · Skip the Evaluation Design stage for Tegaki — accepted
**Context.** Stage 3 produced an evaluation plan for the payments amendment (EV1–EV4). Tushar decided this product does not need a separate evaluation stage.
**Decision.** Skip Stage 3 for Tegaki: no `evaluation-plan.md`, no `/evals` package, no EVAL IDs, no eval-report gates. The ordinary done-gates still apply to every change: typecheck, lint, the claims guard, and tests written alongside the code (including database-level tests for the payment gate, screenshot privacy and server-side amounts).
**Rejected.** The full evaluation plan (EV1–EV4): Tushar judged it more ceremony than this pilot needs.

## D1 · Pay step sequenced as "pay, then prove" — accepted
**Context.** On a phone, a UPI payment happens in another app. The customer leaves the wizard and returns needing to attach the receipt.
**Decision.** Two screens, one job each. The pay screen's headline is the transaction itself ("₹1,999 to Tushar Pathak"). Phones lead with an "Open in UPI app" link and keep the QR behind a disclosure; desktop leads with the QR. "I've paid, attach the receipt" opens the receipt screen (required screenshot, optional UTR, "Send for review"). Approved mockup: `.design/exploration/final/pay-step.html`.
**Rejected.** A single page with three numbered steps (Option A): fewer taps and full overview, but it puts the upload in front of someone who hasn't paid yet, and lands a returning phone user mid-page.

## D2 · Payment shown as its own line on the order card — accepted
**Context.** S3 keeps payment out of the order status, so the order card needs to show payment state separately.
**Decision.** A PAYMENT row under the status chip: *Checking your payment* · *We couldn't find this payment yet* (err panel with Tushar's reason verbatim + re-attach) · *Paid* · *Refunded* (with ref). Loading, error and empty states follow the existing dashboard patterns.
**Rejected.** A fifth node on the status rail: it would imply payment is an order status, contradicting S3.

## D3 · Admin verifies against a "Find it in your bank app" panel, with a visible approval gate — accepted
**Context.** Verification is manual (S1, S4), and the database refuses approval until a payment is verified (S3).
**Decision.** Show the screenshot beside the amount due, the note and the typed UTR. "Found it, mark paid" is primary; "Not found…" is a small trailing link that requires a reason the customer will see. "Approve sample" is visibly disabled until paid. Refunds have their own form for paid payments only. The queue gains payment filters.
**Rejected.** Verify and reject as adjacent equal buttons: a mis-tap on a money decision is too costly (Fitts, §3.8).

## TP1 · The payments switch lives in the database — accepted
**Context.** Stage 5 specified `PAYMENTS_MODE` as a server-only env var. The T18 approval gate must accept legacy `demo_paid`.
**Decision.** Keep the mode in `settings.payments_mode` (`demo` | `admin_preview` | `live`; an unknown value falls back to `demo`). SQL enforces it: the demo `submit_order()` refuses when the UPI flow applies to the caller, and `submit_order_with_receipt()` refuses when it doesn't. Tushar flips it on `/admin/settings`, with no redeploy.
**Rejected.** An env var. If the database can't see the mode, a buyer in `live` mode can still call the demo `submit_order()` over PostgREST, get a `demo_paid` row, and pass the approval gate: a free reading.

## TP2 · Screenshots are rows in `payment_proofs` — accepted
**Context.** A re-attach must keep the old screenshot for the admin (T19), and retention needs the paths (T22). `payments.order_id` is UNIQUE.
**Decision.** A child table `payment_proofs` (path, UTR, mime, size), written only by the definer RPCs. It lives in a private `payment-screenshots` bucket, at `<buyer>/<order>/<uuid>.<ext>`.
**Rejected.** A single screenshot column on `payments`: a re-attach would overwrite the evidence.

## TP3 · Order code on the order — accepted
**Context.** The pay screen shows the UPI note `Tegaki T-XXXX` before any payment row exists.
**Decision.** Store `orders.order_code` as 4 Crockford-base32 characters. A trigger assigns it, it carries a UNIQUE index, and existing rows are backfilled. The admin queue can search by it.
**Rejected.** Deriving it from the UUID prefix: collisions with no constraint to catch them.

## TP4 · QR rendered server-side with `qrcode` — accepted
**Decision.** A pure `buildUpiUri()` feeds both the link and `QRCode.toString(svg)`, rendered inline by a server component, so no client JS is added. Tests decode the QR with `jsqr` and `pngjs`.
**Rejected.** A client QR component: more bundle, for no benefit.

## TP5 · The receipt screen is its own route — accepted
**Decision.** Use `/wizard/[id]/checkout/receipt`, so a reload or a return from the UPI app resumes by URL. No new column is needed.
**Rejected.** A persisted `pay_step` column: state for something the URL already holds.

## TP6 · Screenshots are JPG or PNG, up to 10 MB — accepted
**Context.** Design §6.1 says "JPG, PNG or HEIC". Chrome can't display HEIC, so the admin couldn't view the evidence. iOS Safari converts HEIC to JPEG when `accept` excludes it, and iPhone screenshots are PNG anyway.
**Decision.** Accept JPG and PNG only. The dropzone copy says "JPG or PNG". This is a browser-constraint adjustment the Design freeze permits.

## TP7 · Keep-alive is a separate cron that writes a heartbeat — accepted
**Context.** Supabase pauses on low *database* activity without defining what counts (technical-plan §9.1). The retention route returns 401 before touching the database if its secret is wrong.
**Decision.** A new `/api/cron/keepalive` at 10:00 UTC upserts a one-row `heartbeat`. It returns 503 with an error log on failure. Admin settings shows the heartbeat's age and warns after 36 hours.
**Rejected.** Folding it into the retention route: one failure would silence both. An in-database `pg_cron` job: it stops when the database pauses. An external uptime service: one more account for a 10-order pilot.

## TP8 · Domain move on the same project, old domain 308-redirects — accepted
**Decision.** Add `tegaki.tusharpathak.com` and redirect `tegaki-one.vercel.app` to it (308) through Vercel's domain settings. Update the Supabase Site URL and allow-list, plus Google's JS origins and authorized domain; the redirect URI is unchanged. Regenerate the OG image, which prints the old host.

## TP9 · Parking an unfound payment reuses the parking machinery — accepted
**Decision.** Add a new edge, `sample_under_review → parked`. The owner may walk it only once the payment has been `not_found` for more than `payment_park_days()` (14). `park_overdue_orders()` gains a second loop, so both the dashboard sweep and the nightly job park.

## TP10 · Release runs can't skip the database suites — accepted
**Context.** The RLS suites skip silently when the Supabase env vars are missing.
**Decision.** With `REQUIRE_DB_TESTS=1` (`pnpm test:release`), a missing env var throws. T23's release run uses it.

## TP11 · T16 opens with a real-device payment spike — proposed (needs Tushar)
**Context.** Research (technical-plan §9.3) found three risks. iOS opens an arbitrary UPI app with no chooser. GPay is reported to warn on or decline app-initiated payments to personal VPAs *after* the PIN. There is a report, unverified, that NPCI caps share-and-pay at ₹2,000, and Comprehensive costs ₹2,999. A scan-and-cancel test can't detect failures that only appear after the PIN.
**Decision (proposed).** Before any UI is built, Tushar and a second payer pay ₹1 via link and via scan, in GPay and PhonePe, on Android and iPhone, plus one payment of ₹2,001 via the link, and refund them. If intents fail, phones lead with "Pay to UPI ID" (copy ID + amount), which goes back to design review. If amounts over ₹2,000 fail, decide the Comprehensive path before T23.
**Tension.** EV3 recorded that Tushar declined a real-money test. This spike costs about ₹2,003, all refunded.
