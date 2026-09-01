# Tegaki — Ticket DAG

> **Status:** v1.0 — **SIGNED OFF by Tushar 2026-09-01** (granularity, sequencing, and blocking edges all confirmed as drafted).
> **Date:** 2026-09-01 · **Inputs:** approved `Solution-PRD.md` + approved `Design.md` (+ `Hero-Video-Prompts.md` for T14/C5).
> **Consumed by:** the `writing-plans` stage — one plan per ticket, worked at the DAG frontier (any ticket whose blockers are done).
>
> Every ticket is a **tracer-bullet vertical slice**: it cuts schema → policy → server → UI → test and is demoable on its own. **Each ticket brings its own table** rather than a big up-front schema, so no ticket is a pure layer.

---

## Reading this file

- **Blocked by** = the tickets that must be *done* first. Empty means it can start immediately.
- **Delivers** = the demoable increment. If you cannot show it to Tushar in the browser (or as a file), it is not done.
- **Acceptance** = the checks that close the ticket. UI tickets additionally inherit the **standing gates** below — they are not repeated per ticket.

### Standing gates (apply to every UI ticket, non-negotiable)
1. **Four screen states** exercised for real: loading (skeletons shaped like content) · empty (designed) · error (inline + working retry) · working.
2. **Responsive:** no horizontal scroll, nav usable, readable without zoom at **375px and 768px**; desktop unchanged.
3. **A11y:** keyboard-operable, visible focus ring (2px shu, offset 2px), labels visible, status never conveyed by colour alone, `prefers-reduced-motion` honoured.
4. **Design fidelity:** tokens/components/motion from `Design.md` verbatim — no new hues, no invented spacing, no re-deciding design in the plan.
5. **Content honesty:** no lorem ipsum, no fabricated testimonials/stats, indicative-claims voice (no "reveals/proves/will/destiny"), samples labelled as fictional.

---

## Phase map (for the subagent build stage)

| Phase | Tickets | QA gate at the boundary |
|---|---|---|
| **1 · Foundation** | T01, T02 | Auth + design system verified before anything is built on them |
| **2 · Core loop** | T03, T04, T05, T06 | A stranger can sign in and submit a sample end to end |
| **3 · Fulfillment** | T07, T08, T09, T10 | Tushar can run a full order from queue to delivered |
| **4 · Marketing surface** | T11, T12, T13, T14 | The landing page converts and unfurls correctly |
| **5 · Hardening** | T15 | Retention + data-deletion provably work |
| **Content (parallel)** | C1–C5 | Runs alongside; only C3 and C5 gate code tickets |

---

# Phase 1 — Foundation

## T01 · Walking skeleton: Next.js + Supabase + Google auth
**Blocked by:** — (start here)

**Delivers:** A deployed Next.js (App Router) app on Vercel Hobby with Supabase wired, Google OAuth sign-in/sign-out working against the live deployment, a `profiles` table mirroring `auth.users` (with `role`), and a protected `/dashboard` route that greets the signed-in user and redirects anonymous visitors to sign-in.

**Acceptance**
- Signing in with Google on the deployed `*.vercel.app` URL creates exactly one `profiles` row (trigger or server-side upsert), and signing out clears the session.
- `/dashboard` renders for a signed-in user; an anonymous request is redirected, verified by an automated test.
- RLS is **on** for `profiles`; a user cannot select another user's profile row (test with two real accounts).
- Environment config documented in `.env.example`; no secrets committed. Vercel env vars set for preview + production.
- `git init` done, first commit made, and the repo pushed (this ticket establishes the branch/worktree discipline for everything after it).

**Verification:** automated auth-redirect test + a two-account RLS test + a manual sign-in on the deployed URL.

---

## T02 · Design system foundation
**Blocked by:** T01

**Delivers:** The `Design.md` system as running code: OKLCH tokens as CSS custom properties, the four fonts loaded correctly (Instrument Serif, Manrope, Geist Mono, Noto Serif JP **subset** via `unicode-range`), the app shell (top nav + footer with the hanko lockup and story-line), and the reusable primitives every later ticket consumes — button (all states incl. `:active` scale), input, textarea, checkbox, card, status chip, dashed section rule, stepper, dropzone shell, modal/sheet, toast — plus the four screen-state primitives (skeleton, empty, error-with-retry, loading).

**Acceptance**
- A `/styleguide` route (dev-only or noindex) renders every primitive in every state; it is the visual regression surface for later tickets.
- Fonts: the Japanese subset ships as a few KB (verify transferred bytes), and no layout shift on the wordmark when fonts swap.
- Motion tokens (`--ease-out`, `--ease-in-out`, `--ease-drawer`, durations) defined once and used by the primitives; no `transition: all`, no `ease-in`, nothing animating `width`/`height`/`margin`.
- Contrast spot-checked against `Design.md` §5.1 for each primitive on its intended surface.
- Chosen **hanko seal** rendered as an SVG component (see open decision in `tegaki-handoff.md` §5.2) and used in nav, footer, and favicon.

**Verification:** `/styleguide` walked at 375/768/1440px, keyboard-only pass, reduced-motion pass, DevTools font-transfer check.

---

# Phase 2 — Core loop

## T03 · Draft order + dashboard list
**Blocked by:** T01, T02

**Delivers:** The `orders` table (buyer, subject fields, tier, status, timestamps, delivery prefs) with RLS; a server-side status-transition validator seeded with the `draft` state; a "New request" action that creates a draft order; and the dashboard listing the signed-in user's orders as cards with a status chip.

**Acceptance**
- Clicking "New request" creates one `draft` order owned by the caller; the dashboard shows it immediately.
- **Isolation proven:** a second account cannot read, update, or delete the first account's order — tested at the database level, not just the UI.
- The transition validator rejects any status change not permitted by `Solution-PRD.md` §6.6, with a test per rejected transition.
- Dashboard empty state is the designed first-run trust moment (`Design.md` §3.5), not a blank panel.

**Verification:** two-account RLS test suite + transition-validator unit tests + the four screen states on the dashboard.

---

## T04 · Private sample upload  ⚠️ RISKIEST SLICE — build early
**Blocked by:** T03

**Delivers:** The `order_files` table (versioned for re-uploads) + a **private** Supabase storage bucket; wizard stage 2's uploader: the interactive guardrails checklist that gates the dropzone, the ideal-vs-rejected gallery, multi-file upload (JPG/PNG/PDF) with per-file progress, remove, and retry-on-failure.

**Why first:** this is where the project's real risk lives — sensitive handwriting images, private buckets, signed URLs, and RLS. Everything else is ordinary CRUD.

**Acceptance**
- Files land in a bucket that is **private by default**; the object URL is not publicly readable (verify with an unauthenticated request → denied).
- A second account cannot read, list, or download the first account's files — proven at the storage-policy level.
- Upload of a disallowed type or oversized file fails with a specific inline error, not a generic one; a failed upload can be retried without restarting the wizard.
- The dropzone stays disabled until all guardrail items are ticked; the gallery opens in a lightbox and is keyboard-accessible.
- `order_files` rows record a version so a later re-upload does not overwrite history.

**Verification:** storage-policy tests (anonymous + cross-account) · upload happy path, rejected type, oversized file, network-failure retry · the four screen states.

**Note:** ships with honest placeholder tiles if **C4** is not ready; swapping in the real gallery images is a follow-up of minutes, not a blocker.

---

## T05 · Wizard shell + stage 1 (profile & subject)
**Blocked by:** T02, T03

**Delivers:** The 4-stage wizard shell with the stepper (numbered, connector rail, completed/current/future states), draft persistence and **resume** (leave and come back to the saved stage), and stage 1: name, age, gender, city, country, email, phone + WhatsApp-preference toggle, and the "who is this analysis for?" choice (self / someone else → subject name + age + **consent checkbox**).

**Acceptance**
- Leaving mid-wizard and returning restores the saved stage and field values from the draft order.
- Choosing "someone else" reveals the subject fields and makes the consent checkbox a hard gate: submitting without it shows a specific inline error and does not advance.
- Validation is inline and specific (email format, required fields, age bounds); labels are always visible.
- Stage transitions are direction-aware (forward/back) per `Design.md` §4.3.

**Verification:** resume test (write → leave → return) · consent-gate test · validation tests per field · keyboard-only completion of stage 1.

---

## T06 · Wizard stages 3–4 (tier + demo checkout) → order submitted
**Blocked by:** T04, T05

**Delivers:** Stage 3 tier selection (three cards, Core anchored "Most Popular", radio semantics) and stage 4 demo checkout: order summary, price, the **pilot-mode notice**, and confirm — which creates the `payments` demo record and moves the order to `sample_under_review`. This closes the customer half of the loop.

**Acceptance**
- Confirming creates exactly one `payments` row with provider/reference/status fields present but empty (**gateway-ready** for post-pilot Cashfree) and transitions the order `draft → sample_under_review` through the validator.
- The pilot notice is unmissable at the checkout step and repeated on the resulting order card, so a demo checkout can never be mistaken for a real purchase.
- Double-submitting (double-click, back-then-confirm) does not create two orders or two payment rows.
- Tier selection is keyboard-operable as a radio group and announces the selected tier.

**Verification:** end-to-end test — sign in → stage 1 → upload → tier → confirm → order appears in the dashboard as `sample_under_review` · double-submit test · the four screen states.

---

# Phase 3 — Fulfillment

## T07 · Admin queue + sample review (approve / reject)
**Blocked by:** T04, T06

**Delivers:** The admin surface behind an env-allowlisted email check: the order queue (newest first, filter by status), the sample viewer with signed-URL download, **approve** (starts the turnaround clock and sets `analysis_in_progress`) and **reject with reason** (sets `needs_reupload`).

**Acceptance**
- A non-allowlisted signed-in user gets a 403/redirect on every `/admin` route and every admin server action — tested at the action level, not just the route.
- Approving stamps `approved_at` and computes the expected delivery date as approval + the tier's days (3/5/7); the value is stored, not recomputed on render.
- Rejecting requires a non-empty reason; the reason is persisted and surfaced verbatim to the customer.
- Signed URLs for samples are short-lived; an expired URL denies access.
- Admin surfaces skip decorative motion (`Design.md` §3.7).

**Verification:** authorization tests for every admin action · clock-start test per tier · signed-URL expiry test.

---

## T08 · Status rail, expected delivery, re-upload loop, parked
**Blocked by:** T07

**Delivers:** The customer-side status rail on order cards (4 nodes, done/active/future), the expected-delivery date display, the `needs_reupload` panel showing the rejection reason with an inline re-upload that returns the order to `sample_under_review`, and the auto-`parked` state after 14 days in `needs_reupload` with a contact escape hatch.

**Acceptance**
- Re-uploading creates a **new version** in `order_files` (history preserved) and transitions back through the validator; the rejection reason clears from the active view.
- The parking rule triggers at >14 days and the parked card shows the contact route (mailto + WhatsApp deep link).
- The rail maps 1:1 to the PRD status machine — no invented states.
- The active node's pulse pauses when the tab is hidden.

**Verification:** re-upload round-trip test · parking-rule test with a controlled clock · rail rendering test per status.

---

## T09 · Report upload and download
**Blocked by:** T07

**Delivers:** The `reports` table; admin upload of the validated PDF (→ `completed`, stamping `validated_at`); and the customer's download via a signed URL, with the "also sent to your email/WhatsApp" note.

**Acceptance**
- Only an admin can upload a report; only the owning buyer (and admin) can download it — proven cross-account.
- The report bucket is private; download works only via a short-lived signed URL.
- Uploading transitions `report_generating → completed` through the validator and the dashboard card updates to the download action.
- The download filename is meaningful (subject + tier + date), not a UUID.

**Verification:** cross-account download-denial test · transition test · a real PDF round-trip.

---

## T10 · Admin operations: status controls, mark delivered, pause switch
**Blocked by:** T07

**Delivers:** The `settings` table with the **pause-new-orders** switch (the wizard then shows a "temporarily closed" notice instead of accepting orders), manual status controls for the remaining transitions, and **mark delivered** after Tushar sends the PDF himself.

**Acceptance**
- Flipping pause on blocks new order creation **server-side** (not merely hiding the button) and shows the designed closed notice; existing drafts and in-flight orders are unaffected.
- Every manual status control routes through the same validator — no direct writes bypassing it.
- Mark-delivered is recorded with a timestamp and is the trigger the retention job (T15) counts from.

**Verification:** pause-on/pause-off tests including a direct server-action call while paused · validator-coverage test asserting no code path writes `status` directly.

---

# Phase 4 — Marketing surface

## T11 · Landing part 1 — shell, hero (static), how it works, tagline, tiers
**Blocked by:** T02

**Delivers:** The public landing route with the nav/footer shell, the hero using the **static poster** (the scroll-scrub arrives in T14), the 3-step how-it-works, the mandatory tagline-reveal moment (word-by-word on scroll), and the tier comparison with the Core anchor — each tier CTA routing into the wizard.

**Acceptance**
- Hero copy sits lower-left over a gradient scrim, never centred over the subject; heading and sub capped at 680px with meaningful line breaks.
- Tagline words activate one at a time in reading order via IntersectionObserver — never an unthrottled scroll listener, never a whole-block flip.
- Tier prices and turnarounds match `Solution-PRD.md` §5 exactly; the indicative-claims disclaimer appears under the tiers.
- Lighthouse mobile ≥85 on the landing route with the static hero.

**Verification:** 375/768/1440px pass · reduced-motion pass (reveals render final state) · no-JS pass (page complete and readable) · Lighthouse run.

---

## T12 · Landing part 2 — report anatomy, excerpts, about, FAQ, final CTA
**Blocked by:** T11, C3

**Delivers:** The sample-report anatomy section (three specimen rows on washi-cream crop cards), the per-tier report excerpts tabbed and clearly labelled as fictional composites, the about-Tushar section, the FAQ accordion with FAQPage schema, and the final CTA band.

**Acceptance**
- Every sample carries a visible "Illustrative sample — fictional subject" label; **no testimonials appear anywhere**.
- FAQ answers are claims-safe and match the site-wide voice; the schema validates in Google's Rich Results test.
- The about section uses a real photograph of Tushar or an honest placeholder frame — never a generated face.
- Accordion is keyboard-operable with correct `aria-expanded`, and animates via `grid-template-rows`.

**Verification:** schema validation · a copy grep for banned absolutes ("reveals", "proves", "will", "destiny", diagnostic terms) · keyboard pass.

---

## T13 · Policy pages, link preview, and the ship set
**Blocked by:** T11

**Delivers:** Privacy / Refund / Terms static pages, the contact route, the **code-rendered** 1200×630 OG image, the full OG + Twitter Card tag set in the static document head, branded favicon, custom 404, and the skip-to-content link.

**Why it matters:** WhatsApp and Instagram sharing is the entire acquisition channel — the unfurl *is* the storefront.

**Acceptance**
- `og:image` and `og:url` are **absolute HTTPS** on the deployed domain; fetching the image URL returns HTTP 200.
- The unfurl renders with title, description, and image in the **LinkedIn Post Inspector** and **opengraph.xyz**, and in a real WhatsApp paste.
- The wordmark in the OG image is code-rendered (Satori/canvas), not diffusion-generated.
- 404 is branded with a way back; policy pages state the 90-day retention and the delete-my-data route.

**Verification:** live inspector runs (both tools) + a real WhatsApp/Slack paste + an HTTP 200 check on the image URL.

---

## T14 · Hero scroll-scrub film
**Blocked by:** T11, C5

**Delivers:** The canvas frame-sequence hero per `Design.md` §4.2b: 180 preloaded frames painted to a full-bleed canvas keyed to scroll across the pinned chapters, the preload percentage counter styled as part of the show, chapter copy cross-fades, and the fallbacks.

**Acceptance**
- Scrubbing is smooth **both directions** at 1440px; frames paint only on index change (no wasted repaints).
- At ≤768px, under `prefers-reduced-motion`, or with JS disabled, the static poster renders and the page is complete — the frame set is never downloaded on mobile.
- Hero copy remains readable at every scroll position and never sits centred over the pen.
- Total transferred frame bytes measured and recorded; preload aborts cleanly if the visitor navigates away.

**Verification:** desktop scrub end-to-end forward and backward · 375px fallback · reduced-motion fallback · no-JS fallback · network-tab byte measurement.

---

# Phase 5 — Hardening

## T15 · Retention job and delete-my-data
**Blocked by:** T04, T10

**Delivers:** The scheduled job that deletes handwriting samples 90 days after delivery (reports persist in the dashboard), plus an honoured delete-my-data request path.

**Acceptance**
- The job deletes both the storage objects and the `order_files` rows for orders delivered >90 days ago, and deletes nothing else — proven with fixtures on both sides of the boundary.
- The job is idempotent and safe to run twice; a failure is observable (logged with counts), not silent.
- Deletion is reflected in the customer's view without breaking the order card or its report download.

**Verification:** fixture tests at 89 / 90 / 91 days · double-run idempotency test · manual run against seeded data with counts reported.

---

# Content workstream (parallel — not code)

| # | Ticket | Blocked by | Delivers | Done when |
|---|---|---|---|---|
| **C1** | Master Prompt tier variants | — | `prompts/express.md`, `prompts/core.md`, `prompts/comprehensive.md` derived from Master Prompt v2.0, enforcing the §5 content splits | Each variant produces a correctly-scoped report from the same scan in a test run; Tushar approves all three |
| **C2** | Branded PDF report template | C1 | Typography/layout matching the site identity, trait-dashboard table, radar chart for Comprehensive | A real report renders end to end as a PDF Tushar would send |
| **C3** | Three fictional sample reports | C2 | One composite sample per tier + the landing-page excerpts | Subjects are fictional, labelled, and contain no real person's data |
| **C4** | Scan-guide gallery images | — | 8 tiles: 4 ideal / 4 rejected (blur, lined paper, cropped signature, shadow) | Each rejection reason is visually obvious without reading the caption |
| **C5** | Hero film assets | — | Per `Hero-Video-Prompts.md`: start image → 30-credit draft → 195-credit master → 2K upscale → 180 frames + poster + mobile loop | Twirl and toss read cleanly; frames sliced at 1600px q86; poster exported |

**Credit note:** C5 ≈ 235–250 credits and C4 ≈ 15–20 of the **411** available. Run C5's draft pass and get Tushar's go/no-go before the 195-credit master.

---

## Dependency graph

```
T01 ─┬─ T02 ─┬─ T03 ─┬─ T04 ─┬─ T06 ─ T07 ─┬─ T08
     │       │       │       │             ├─ T09
     │       │       └─ T05 ─┘             └─ T10 ─┐
     │       │                                     ├─ T15
     │       │                          T04 ───────┘
     │       └─ T11 ─┬─ T12 ← C3 ← C2 ← C1
     │               ├─ T13
     │               └─ T14 ← C5
     └─ (C1, C4, C5 start any time — no code blockers)
```

**Frontier at kickoff:** T01 · C1 · C4 · C5.

---

## Sign-off record (2026-09-01)

1. **Granularity** — approved as drafted: 15 code + 5 content tickets.
2. **Sequencing** — approved: loop first, landing fourth.
3. **T04 first** — confirmed: private upload stays the early riskiest slice.
4. **Per-file tickets** — not published; this consolidated file + `plans/T*.md` are the build's briefs (per-file copies would drift; the ledger tracks per-task state instead).

**Plans:** every ticket now has its implementation plan in `plans/` (T01–T15, C1–C4), plus `plans/BUILD-ORCHESTRATION.md` for the build itself. Hanko seal = **candidate B**; hero film (C5) = **shot and passed** (15s v3 master, see `Hero-Video-Prompts.md`).
