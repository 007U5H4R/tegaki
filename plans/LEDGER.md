# Tegaki Build Ledger

> Crash-recovery state for the build. Any fresh session resumes from here + `tegaki-handoff.md`.
> Format: `TICKET/TASK · status · model · note`. Statuses: `done` · `wip` · `blocked` · `parked`.

**Branch:** `build/pilot` (base: `main` @ `423a0c1`) · **Started:** 2026-09-01

---

## Phase 1 — Foundation

### T01 · Walking skeleton — 8 of 19 tasks done; rest gated on H1–H3
| Task | Status | Model | Note |
|---|---|---|---|
| A1 · git init + .gitignore | **done** | Opus (orchestrator) | Excluded `Sample Reports/` (real client data), hero masters, parked decks, local Claude settings |
| A2 · First commit | **done** | Opus | `423a0c1`, 210 files; `main` clean, work on `build/pilot` |
| A3 · Scaffold Next.js | **done** | Opus | `eeeb521`. Next 16.3.3 / React 19.2.8 / Tailwind 4.3.3. Non-empty dir → scaffolded in temp, rsynced in, reinstalled (pnpm store differs across volumes). Removed the scaffold's placeholder SVGs |
| A4 · TS strict + lint/format | **done** | Opus | `strict` + `noUncheckedIndexedAccess` + unused-symbol checks; Prettier + tailwind plugin; scripts typecheck/format/test/test:e2e |
| A5 · Design tokens + fonts | **done** | Opus | Full OKLCH scale, radius, motion, base surface, focus ring, reduced-motion. **3 spec corrections — see decisions below** |
| B1 · Env config | **done** | Opus | `ff69cf3` + `dfdb2cb`. `.env.local` written with the real project URL + publishable key. Uses Supabase's **current** naming (publishable/secret), not the retired anon/service_role |
| B2 · Supabase CLI init | **done** | Opus | `supabase/config.toml` committed. ⚠️ CLI **not yet linked** — needs Tushar (DB password is interactive) |
| B3–B5 · profiles + trigger + RLS | **done** | Opus | `f2c0467`. Applied to remote; `migration list` shows local == remote. Trigger is `security definer`, so clients cannot invent a profile or choose a role; `role` excluded from the UPDATE grant as a second, independent lock |
| C1–C2 · Client factories + proxy | **done** | Opus | `env.ts` fails loudly on missing config; server client created per request (never hoisted — would leak sessions). ⚠️ C2 is **`src/proxy.ts`**, the Next 16 rename of middleware. Build output confirms `ƒ Proxy (Middleware)` |
| C3 · Google provider | **done** | Opus + Tushar | GCP project `tegaki-507313`, consent screen External, client "Tegaki Web". Supabase provider **Enabled**; Tushar pasted the secret. Redirect URLs added for :3000 and :3100 |
| C4–C7 · Auth UI + protected route | **done** | Opus | `e2d7fa1`. **Verified in a real browser**: sign in → profile row created → dashboard reads it via RLS → sign out → `/dashboard` redirects again |
| C8 · Admin role helper | **done** | Opus | `resolveRole()` + 6 unit tests. Live check passed — the dashboard rendered the `ADMIN` label for the allowlisted account |
| D1 · Vitest | **done** | Opus | `.mts` config; alias via `fileURLToPath` (repo path contains a space) |
| D2 · Playwright | **done** | Opus | Desktop (Chromium) + mobile (WebKit/iPhone 13) projects |
| D3 · Auth redirect E2E | **done** | Opus | 4 tests. ⚠️ Next injects its own `role="alert"` route announcer, so bare `getByRole('alert')` matches two elements after a client-side nav — assertions are scoped to the message text |
| D4 · Two-account RLS suite | **done** | Opus | `2ce53ea`. 8 tests against the live project: own-row read, cross-account read returns nothing, unfiltered select still returns one row, cross-account update is a no-op, self-promotion to admin fails, anonymous sees nothing. **Found a real bug** — see decisions |
| — · Responsive gate E2E *(added)* | **done** | Opus | Not in the original plan: the 375px no-horizontal-scroll gate, wired now so every later route inherits it. **Proved it bites** by injecting a 900px child, watching it fail, then reverting |
| E1–E2 · GitHub + Vercel | **done** | Opus | Private repo `007U5H4R/tegaki`; Vercel project `tegaki`; production **https://tegaki-one.vercel.app** |
| E3 · Live verification | **done (one gap)** | Opus | Production serves `/`, `/sign-in`, and redirects `/dashboard` → `/sign-in`. **14/14 e2e pass against production.** OAuth reaches Google carrying the right client id, both redirect URIs and `scope=email profile`. ⚠️ The final consent click could not be automated — the browser extension lacks permission on `accounts.google.com`. Config is proven correct; the same flow completed end to end on localhost against this same Supabase project and Google client |
| E4 · Two real accounts on production | **open** | | Deliberately left for Tushar. Isolation is already proven at the database layer (D4), which is stronger evidence than a UI walkthrough; this is confirmation, not discovery |

**Suites green:** `typecheck` ✓ · `lint` ✓ · `test` **26/26** ✓ · `test:e2e` **14/14 against production** ✓ · `build` ✓

**Live proof so far** (localhost:3100 against the real Supabase project): Google sign-in completes; `handle_new_user()` created the profile with `full_name` from Google metadata; role resolved to `admin` from the compiled allowlist; the dashboard read the row back through the *user's own* client, so the RLS select policy is confirmed working; sign-out clears the session.

### T02 · Design system — **done** (`937944f`)
| Task | Status | Note |
|---|---|---|
| A1 · Tailwind theme | **done** | Landed in T01; verified in the compiled stylesheet |
| A2 · Motion primitives | **done** | Tokens in `@theme`; grep confirms no `transition: all`, no `ease-in`, no raw cubic-bezier outside the token file |
| A3 · Hanko seal | **done** | `components/brand/seal.tsx`. **Real 手 outline** extracted from Noto Serif JP via fontTools (939 bytes), not live text — the mark cannot reflow while a font loads. Rim thickens below 20px for favicon legibility. Verified at 16/24/48/96px |
| A4 · Lockup + story-line | **done** | `components/brand/lockup.tsx`; 手書き is real text in the subset face, so it stays selectable and zoomable |
| B1 · Button | **done** | primary/ghost/quiet × md/sm, plus loading (width preserved) and disabled. `:active` scale 0.97; hover gated to fine pointers |
| B2 · Field/Input/Textarea | **done** | Labels always visible; errors wired via `aria-describedby`, never colour alone |
| B3 · Checkbox + Toggle | **done** | Native input kept in the DOM (visually hidden, not removed) so keyboard, forms and assistive tech behave; whole label is the hit target |
| B4 · Card + Status chip | **done** | Chips map 1:1 to PRD §6.6 plus `draft`; **every chip has an icon and text** |
| B5 · Dashed rule + micro-label | **done** | The genkō yōshi motif and the "specimen label" voice |
| C5 · Stepper | **done** | Shares the dashed-connector lineage with the how-it-works and status rails (§3.8 continuity) |
| C6 · Dropzone + file rows | **done** | Presentation only; T04 wires uploads. Locked state **explains why** rather than greying out. Progress uses `scaleX`, skipping layout and paint |
| D1–D3 · Screen states | **done** | Skeletons shaped like real content; empty state is a designed trust moment; `ErrorState` **requires** a message and a retry handler, so the useless variant cannot be built |
| E1 · `/styleguide` | **done** | Every primitive in every state; `noindex` |
| E2–E4 · a11y / responsive / fidelity | **done** | 6 new e2e gates + `/styleguide` added to the responsive gate |

**Deferred deliberately:** nav (C1), mobile overlay (C2), modal (C3) and toast (C4). Nothing consumes them yet, and building screen chrome before the screens exist invites guessing. They land with T11 (nav) and T06 (toast/modal), against real requirements.

**Suites after T02:** typecheck ✓ · lint ✓ · **26 unit** ✓ · **34 e2e** ✓ · build ✓

---

## Phase 2 — Core loop

### T03 · Draft order + dashboard — **done** (`abf3949`)
| Task | Status | Note |
|---|---|---|
| A1–A2 · `orders` + RLS + grants | **done** | Migration `20260901150000_orders.sql`, applied. Buyer reads/creates own; edits confined to `draft`; may delete own draft (abandoning a mistake) but never a submitted order |
| A3 · `transition_order()` | **done** | All seven PRD edges plus the actor entitled to each. `is_admin()` defined here so the machine could be written and tested whole; T07 adds only the policies that use it. `service_role` recognised as the trusted server context for cron and tests |
| A4 · `lib/tiers.ts` | **done** | Prices, turnarounds and contents in one place; `formatPrice` uses `en-IN` grouping (₹1,999 groups differently from Western convention) |
| A5 · Types + queries | **done** | `getMyOrders()` deliberately carries **no `buyer_id` predicate** — RLS does the filtering, so a broken policy fails the tests instead of hiding behind a correct-looking query |
| B1 · `createDraftOrder` | **done** | `buyer_id` from the verified session, never from the caller |
| B2 · Dashboard | **done** | Streams the list behind Suspense so the shell stays usable; `error.tsx` supplies the fourth state with Next's segment `reset()` as a real retry |
| C1–C2 · Test suites | **done** | **39 unit tests.** The full 7×7 matrix: 42 illegal edges rejected, 7 legal accepted. Plus: a buyer cannot submit another's draft, and cannot approve their own sample |
| C3 · E2E | **partial** | Order cards proven on `/styleguide` with fixtures. The signed-in walkthrough waits on the same blocker as T01/E4 — the browser extension cannot drive Google's consent screen |

**Suites after T03:** typecheck ✓ · lint ✓ · **39 unit** ✓ · **34 e2e** ✓ · build ✓

**Note for T05:** the dashboard's "New request" currently creates a draft and returns to the dashboard. Point it at the wizard once that route exists.

### T04 · Private sample upload — **done** (`27208f3`) ⚠️ the riskiest slice
| Task | Status | Note |
|---|---|---|
| A1–A3 · `order_files`, RLS, bucket, storage policies | **done** | Migration `20260901160000_order_files.sql`. Bucket **private**, 20 MB cap, three MIME types. **The path is the boundary:** `samples/{buyer_uid}/{order_id}/v{n}/{uuid}.{ext}` — every policy checks segment 1 against `auth.uid()`, and the upload policy proves segment 2 names an order the caller owns *and* that is open for uploads. **No anon policy exists at all** |
| B1 · Validate / paths / signed URLs | **done** | Limits shared by validator, CHECK constraints and bucket config, so the browser cannot accept what the database will reject. Signed URLs are 10 min and minted through the *caller's* client, so policies decide who may see what |
| B2 · Server actions | **done** | `recordUpload` re-derives and re-checks the path rather than trusting it; `removeUpload` deletes the object before the row, so a re-run tidies any half-state instead of orphaning bytes |
| C1 · `SampleUploader` | **done** | Standalone, so T08's re-upload panel mounts the identical interface. **Real upload progress** via XHR against the Storage REST endpoint — supabase-js has no progress callback, and a faked bar on a 20 MB phone upload would be worse than none |
| C2 · Guardrails checklist | **done** | Four PRD points, persisted on the order (survives resume, and is auditable for a service handling third-party consent). Dropzone stays locked and **says why** |
| C3 · Ideal-vs-rejected gallery | **deferred** | Waiting on **C4** imagery. Placeholder tiles would teach nothing; the guardrail text carries the requirement meanwhile |
| C4 · Demo route | **done** | `/upload-demo/[orderId]`, temporary. **T05 must delete it** when the wizard mounts the uploader at `/wizard/[orderId]/upload` |
| D1 · Storage security suite | **done** | **13 tests.** Owner reads; another user is refused download, signed URL, and listing; anonymous refused entirely; signed URL 200 then expired; upload into another's folder refused; upload naming another's order refused; upload to a submitted order refused; file rows hidden cross-account. Plus the hand-built XHR request, which a typo would otherwise only break in a browser |
| D2 · E2E upload walkthrough | **open** | Same blocker as T01/E4 — the extension cannot drive Google's consent screen, so no signed-in browser session. Components are proven on `/styleguide`, logic by unit tests, security directly against the live project. **Tushar can close this in 30 seconds:** sign in, then visit `/upload-demo/<order id>` |

**Suites after T04:** typecheck ✓ · lint ✓ · **67 unit** ✓ · **34 e2e** ✓ · build ✓

### T05 · Wizard shell + stage 1 — **done** (`b374d54`)
| Task | Status | Note |
|---|---|---|
| A1 · Stage-1 columns | **done** | Migration `20260901170000_order_profile.sql`. Plus a **CHECK constraint**: an order that has left `draft` must carry consent when the subject is not the buyer |
| A2 · Zod schema | **done** | One schema for browser and server. Phone accepts every real Indian format (+91, leading 0, spaces, dashes); gender is free text and optional, since it only shapes report pronouns |
| B1 · Wizard shell + guard | **done** | Layout loads and guards the order once, so no stage repeats the ownership check. Submitted orders redirect to the dashboard |
| B2 · Resume | **done** | Progress on `wizard_stage`, not in the browser — start on a phone, finish on a laptop. `clampSegment` sends a deep link back to the furthest stage actually reached and degrades safely on a corrupt value |
| B3 · Stage-1 form | **done** | Self/other as selectable cards; the subject panel expands with name, age and the consent checkbox |
| B4 · `save_order_profile()` | **done** | Definer function: stamps `consent_given_at` server-side from an explicit tick (never posted as a value), **clears it** if the buyer switches back to themselves, lowercases the email |
| B5 · Mount stage 2 | **done** | `SampleUploader` now at `/wizard/[orderId]/upload`; the temporary `/upload-demo` route is **deleted**; "New request" opens the wizard |
| C1–C2 · Tests | **done** | **26 new tests.** Consent proven at three layers, the last with the service role so it is the constraint itself talking, not a policy |

**Suites after T05:** typecheck ✓ · lint ✓ · **93 unit** ✓ · **34 e2e** ✓ · build ✓

### T06 · Tier + demo checkout + submit — **done** (`5a97ff6`)
| Task | Status | Note |
|---|---|---|
| A1 · `payments` | **done** | Migration `20260902100000_payments.sql`. `order_id` **unique** — a second payment for an order cannot exist. No insert policy *and* no insert grant for `authenticated`: rows come only from `submit_order()` |
| A2 · `submit_order()` | **done** | Definer, one transaction: asserts owner, draft, tier, ≥1 sample and **consent**, inserts the payment, calls `transition_order()`. No window where an order is paid but still a draft |
| — · `tier_price_inr()` *(added)* | **done** | Prices come from SQL, never from the form. A test asserts the SQL map and `tiers.ts` agree — the one duplicated fact in the system, now guarded mechanically |
| B1 · Stage 3 tier | **done** | Native radios in labels (arrow keys, `aria-checked` free from the browser). "Compare what's inside" is a disclosure, not a sheet — see decisions |
| B2 · Stage 4 checkout | **done** | Summary + serif price + warn-tinted pilot notice + risk reversal + disclaimer. Copy for all four lives in `src/lib/copy.ts` |
| B3 · Confirm | **done** | Seal stamps onto the summary (350ms, 2px settle) then navigates. The action deliberately **does not** redirect or revalidate — see decisions |
| B4 · Dashboard | **done** | Submitted orders show the chip, turnaround and "Pilot order — no payment was taken". Drafts gained a **Continue** button (see decisions) |
| C1 · Full-loop E2E | **done** | `e2e/submit-loop.spec.ts` — the phase-2 centrepiece. Passes on desktop **and** iPhone 13, **against production**, asserting the database as well as the screen |
| C2 · Payments RLS | **done** | 15 tests: cross-buyer read, anonymous, direct insert, amount rewrite, double-submit sequential **and** concurrent, and a service-role insert that the unique index refuses |

**Suites after T06:** typecheck ✓ · lint ✓ · format ✓ · **109 unit** ✓ · **36 e2e against production** ✓ · build ✓

**The signed-in verification gap is closed.** `e2e/support/session.ts` signs a browser in by writing the `@supabase/ssr` session cookie directly (`base64-` + base64url JSON, chunked at 3180). Google's consent screen still cannot be automated and never will be here — but nothing after it needed to depend on that. T01/E4, T03, T04/D2 and T05 are now exercised as an assembled flow rather than layer by layer.

**Two T05 defects fixed:** the tier stage was unreachable (nothing advanced `wizard_stage` past the upload, so `clampSegment` bounced every visitor back), and a draft was unreachable from the dashboard, which made resume real but unusable.

### T07 · Admin queue + sample review — **done** (`2440cae`)
| Task | Status | Note |
|---|---|---|
| A1 · Admin policies | **done** | `20260902120000_admin_policies.sql`. Only `orders` and `profiles` were missing — `is_admin()` (T03), `order_files` (T04) and `payments` (T06) already had theirs. **Read-only: there is no admin INSERT/UPDATE/DELETE policy anywhere**, because nothing about an order is an admin's to rewrite outside `transition_order()` |
| A2 · Review columns + machine | **done** | `20260902130000_order_review.sql`. `approved_at`, `expected_delivery_date`, `rejected_reason`, `reupload_deadline` — none of them in any grant, so only the definer function writes them. The 2-arg `transition_order` was **dropped** and replaced by a 3-arg version: a defaulted third parameter alongside the old one would make every 2-arg call ambiguous |
| — · `tier_turnaround_days()` | **done** | Sibling of `tier_price_inr()`. Same drift guard: a test asserts the SQL map and `tiers.ts` agree, so a turnaround edited in one place fails a test rather than promising a wrong date |
| B1 · `requireAdmin()` | **done** | `src/lib/auth/assert-admin.ts`. Wrapped in React `cache()` — see decisions |
| B2 · Admin layout | **done** | Non-admins go to their own dashboard, not to a refusal; anonymous to sign-in. No decorative motion (Design.md §3.7) |
| B3 · Queue | **done** | Dense rows newest-first, filter chips with live counts, all four screen states including `error.tsx`. Drafts never appear — a draft is not an order yet |
| B4 · Order detail | **done** | Buyer + subject fields, consent timestamp for a third-party subject, guardrail checklist showing what was and was not confirmed |
| B5 · Sample viewer | **done** | Signed URLs, 10-minute TTL, minted through the **admin's own** client so the storage policy decides. Rendered on the washi surface: judging a photograph of paper against near-black would mislead about its own contrast |
| B6–B7 · Approve / reject | **done** | Native `<dialog>` — focus trap, Esc and backdrop for free, and §3.7 wants no motion here anyway. Approve states the consequence and the exact date; reject says "the customer sees this text exactly as you write it" *before* you type |
| C1–C2 · Tests | **done** | 14 SQL/authz tests + 6 e2e (3 × 2 projects). A buyer cannot approve their own order, cannot reject it to reset the clock, and a stranger reaches neither |

**Suites after T07:** typecheck ✓ · lint ✓ · format ✓ · **123 unit** ✓ · **42 e2e against production** ✓ · build ✓

### T08 · Status rail, re-upload loop, parking — **done** (`15bffec`)
| Task | Status | Note |
|---|---|---|
| A1 · Migration | **done** | `20260902140000_reupload_and_parking.sql`. Adds `rejected_at` + `resubmitted_at`; `transition_order()` gains two preconditions. A resubmission must carry a sample uploaded **after** the rejection, and the window must still be open |
| — · `park_overdue_orders()` | **done** | Definer, idempotent, scoped to what the caller may touch (own orders; everything for analyst/system). Goes through `transition_order()`, so parking leaves the same trail as any other status change |
| A2 · Status rail | **done** | `src/components/orders/status-rail.tsx`. Four nodes from PRD §6.6; `needs_reupload` and `parked` replace it with their panels rather than showing progress. Active node pulses on opacity only, and pauses when the tab hides |
| A3 · Dashboard card | **done** | Subject, tier + short id, the rail, "Expected by {date}" once approved, and the pilot note. `/styleguide` carries a specimen per lifecycle shape |
| B1 · Re-upload panel | **done** | The analyst's sentence **verbatim**, the deadline, and the same `SampleUploader` from wizard stage 2 — a customer whose sample was rejected meets the interface they already know. Resubmit is disabled until a replacement actually exists |
| B2 · Parked panel | **done** | The one state with no button forward, so it is not a dead end: a mailto escape hatch. **The WhatsApp deep-link the PRD also mentions is not built — it needs a phone number nobody has given, and a broken link is worse than one honest channel** |
| B3 · Sweep wiring | **done** | `getMyOrders()` and `getQueue()` both call `park_overdue_orders()` before reading, so no one ever sees an order the clock has already decided about |
| C1 · Tests | **done** | 12 SQL tests on a controlled clock (deadline ±1 hour) + 4 e2e. Round trip proven end to end: reject → panel shows the reason → upload v2 → resubmit → back in the queue, with v1 still in the table |

**Suites after T08:** typecheck ✓ · lint ✓ · format ✓ · **135 unit** ✓ · **46 e2e against production** ✓ · build ✓

### T09 · Report upload + download — **done** (`4982899`, `b9383d7`)
| Task | Status | Note |
|---|---|---|
| A1–A3 · Migration | **done** | `20260902150000_reports.sql`. `validated_at` is **not null** — an unvalidated report cannot exist in the table. `order_id` unique, so a second attach is impossible. `attach_report()` refuses outside `report_generating`, refuses non-admins, and inserts + completes in one transaction |
| — · Buyer storage policy | **done** | `20260902160000_reports_buyer_read.sql` — **corrects a wrong assumption in A2**; see decisions |
| B1 · Admin upload | **done** | PDF-only dropzone; the attestation gates the button, the action re-checks, the column enforces. Bytes go up first, row second: an orphaned object beats a completed order with nothing to download |
| — · `startReport()` *(added)* | **done** | The `analysis_in_progress → report_generating` edge. Not in the T09 plan — without it the upload panel is unreachable, and T09's own e2e had to seed the state in SQL. **T10/B5 replaces this with matrix-generated controls; delete it then** |
| B2 · Customer download | **done** | Minted on click, not rendered into the page — a signed URL in the HTML of every dashboard load is a working link left lying around. 60-second TTL, filename `Tegaki-{subject}-{tier}-{date}.pdf` |
| B3 · Status copy | **done** | The rail already covers `completed`; the card gains the download and the "also sent to you directly" note |
| C1 · Security tests | **done** | 15 tests. Attestation refused three ways, wrong-status refused, second attach refused, buyer-as-analyst refused, cross-account row read empty, anonymous empty, forged insert refused, bucket shut to strangers, link works then dies |
| C2 · E2E round trip | **done** | A real PDF, **byte-compared** after download, on desktop and iPhone, against production. Plus a second spec proving a stranger who knows the order id gets nothing |

**Suites after T09:** typecheck ✓ · lint ✓ · format ✓ · **150 unit** ✓ · **50 e2e against production** ✓ · build ✓

### T10 · Admin operations — **done** (`b5168c4`)
| Task | Status | Note |
|---|---|---|
| A1 · `settings` | **done** | `20260902170000_settings_and_delivery.sql`. One row per switch; anyone signed in reads, only the analyst writes, and **no one inserts or deletes** — the set of switches comes from migrations |
| A2 · `delivered_at` + `mark_delivered()` | **done** | Admin only, completed orders only, **once** — the retention clock counts from it, so a second click must not move it |
| — · Pause **trigger** | **done** | Enforced on `orders` INSERT, not in the action. Deliberately insert-only: a customer mid-wizard can still finish. The analyst is exempt (they may need to reproduce something while shut) |
| B1 · Settings helpers | **done** | `isPaused()` goes through the `is_paused()` definer function — see decisions. Fails **open**: a settings read that errors must not close a working shop |
| B2 · Enforcement | **done** | e2e bypasses the UI entirely with a direct API insert and is refused by the trigger. That is the test that matters; the hidden button is only courtesy |
| B3 · Closed notice | **done** | Warn-tinted, and answers the question a closed sign provokes: existing orders are unaffected. Verified at 375px |
| B4 · `/admin/settings` | **done** | Pause toggle (warn-tinted when on) + live queue counts |
| B5 · Status controls | **done** | Generated from `TRANSITIONS`, the same list the 49-pair matrix test walks against the live function. **T09's `startReport()` deleted as planned.** Completing stays out of it: attaching the report is what completes an order |
| C1 · Tests | **done** | 12 SQL/authz + 4 e2e + **6 static**. The grep test was proven to bite: one offending line fails it by name and file |

**Suites after T10:** typecheck ✓ · lint ✓ · format ✓ · **168 unit** ✓ · **54 e2e against production** ✓ · build ✓

### T11 · Landing part 1 — **done** (`9f0c5ad`, `4cdbd61`, `bde166c`)
| Task | Status | Note |
|---|---|---|
| A1 · Marketing shell | **done** | `(marketing)` route group keeps `/` while giving the public pages a layout the signed-in surfaces do not share. Nav (T02's deferred one, built now against real sections) + footer + skip link |
| A2 · Hero | **done** | Static poster from C5. **Two layouts — see decisions.** Copy lower-left over a scrim from `sm` up; image above copy on a phone |
| A3 · Entrance | **done** | Pure CSS keyframes with per-child `--rise`, so it plays without JS and the page is complete if it never runs |
| B1 · How it works | **done** | Three steps on the dashed rail this product uses for every kind of progress; the turnaround note sits under step three, before anybody pays |
| B2 · Tagline reveal | **done** | Per-word IntersectionObserver, once, reading order. Muted level raised from Design.md's 30% — see decisions |
| B3 · Tiers | **done** | Hairline columns on desktop, stacked with Core first on a phone via CSS `order` only, so reading and focus order stay the price ladder. Every number from `tiers.ts`, asserted by e2e |
| B4 · Scroll reveals | **done** | Hidden state applied by the effect, never rendered — no-JS shows everything |
| C1 · Performance | **done** | **Lighthouse mobile on production: Performance 97 · Accessibility 100 · Best Practices 100 · SEO 100.** LCP 2.1 s, CLS 0, TBT 120 ms. Gate was ≥85 |
| C2 · a11y + e2e | **done** | Zero axe failures after fixing two real ones (below). 12 landing tests × 2 viewports, including a no-JS pass and a measured contrast check |

**Suites after T11:** typecheck ✓ · lint ✓ · format ✓ · **168 unit** ✓ · **66 e2e against production** ✓ · build ✓

### T12 · Landing part 2 — **done** (`9299a92`, `71efcf4`)
| Task | Status | Note |
|---|---|---|
| — · C3 content | **done (text half)** | Three fictional composite subjects in `src/content/excerpts.ts`. **The sample PDFs C3 also calls for are not built** — they need C1 (prompt variants) and C2 (report template), neither of which exists |
| A1 · Report anatomy | **done** | Three specimen rows. Crops cut from **Tegaki's own hero photograph** — the C3 plan forbids real client scans here, anonymised or not. Each row states the observation before the reading |
| A2 · Excerpt tabs | **done** | Washi cards, proper `role="tablist"` with arrow keys and roving tabindex. **"Illustrative sample — fictional subject" sits on the card**, same size as the byline |
| A3 · About | **done** | Tushar's real photograph from the portfolio repo. **No credential chips** — the plan permits them only for claims confirmed in writing, and none have been |
| A4 · FAQ | **done** | Ten items via native `<details>`. FAQPage JSON-LD generated from the same array the accordion renders, so the two cannot drift |
| A5 · Final CTA | **done** | Seal, "Ready when your pen is.", same action as the hero — a second CTA phrased differently reads as a second product |
| B1 · Claims guard | **done** | `scripts/check-claims.mjs`, wired ahead of `pnpm test`. Proven to bite: a planted sentence trips four separate patterns |
| B2 · E2E + a11y | **done** | 20 landing tests × 2 viewports. **Lighthouse mobile on production: 97 / 100 / 100 / 100**, zero axe failures, CLS 0 |

**Suites after T12:** typecheck ✓ · lint ✓ · format ✓ · claims ✓ · **168 unit** ✓ · **74 e2e against production** ✓ · build ✓

### T13 · Policies, link preview, ship set — **done** (`566b13e`)
| Task | Status | Note |
|---|---|---|
| A1 · Policy content | **done** | `src/content/policies/`. Every fact is a position the PRD already settled — 90-day deletion, 14-day window, refund only when no usable sample arrived, consent when subject ≠ buyer, no real payment in the pilot. Written to be read, not to be skipped |
| A2 · Policy routes | **done** | One longform template at `/[policy]`, `generateStaticParams` over the three slugs. The footer's dead links now resolve |
| A3 · Contact | **done (one gap)** | Email only. **No WhatsApp link: the number has not been supplied**, and the plan says a placeholder must fail rather than ship |
| B1 · OG image | **done** | `scripts/generate-og.mjs` renders it in Chromium with the real fonts — 1200×630, 193 KB. Seal outline read from `seal.tsx` so the two cannot drift. Never diffusion-rendered; a wordmark has to be crisp and no image model can be trusted to spell |
| B2 · Metadata | **done** | Full OG + Twitter set with **absolute** URLs from `src/lib/site.ts`; `metadataBase`, canonical, title template, `en_IN` |
| B3 · Favicon + 404 | **done** | Seal B as `icon.svg` + `apple-icon.png` (both generated from one source); branded 404 that offers the two places somebody was probably heading |
| C1 · Live unfurl | **partly — see below** | og-cover.png returns **HTTP 200** on production, bytes identical to the repo, and every tag is absolute HTTPS pointing at the right host. **The LinkedIn Inspector and WhatsApp paste need Tushar** |
| C2 · Dead-link crawl | **done** | Every internal href on the landing page resolves; zero `href="#"` |

**Suites after T13:** typecheck ✓ · lint ✓ · format ✓ · claims ✓ · **168 unit** ✓ · **90 e2e against production** ✓ · build ✓

---

### T14 · Hero scroll-scrub — **done** (`4d769b9`)
| Task | Status | Note |
|---|---|---|
| A1 · Frames | **done** | 180 JPEGs at 1280×720 in `public/hero/`, 6.6 MB, committed. The unreferenced `hero-mobile.mp4` was cut before commit — the phone path deliberately uses the static hero, and an unused 240 KB video is dead weight |
| A2 · Eligibility | **done** | `use-hero-scrub.ts`: wide viewport **and** no reduced-motion preference, decided in an effect so SSR never guesses. Frames are requested only after that answer is known |
| A3 · Canvas painter | **done** | `hero-scrub.tsx`. `HTMLImageElement`, **not `ImageBitmap`** — 180 decoded bitmaps is ≈660 MB pinned in a JS allocation the collector cannot evict. Concurrency 6, `AbortController`, dPR capped at 2, repaints only when the frame index changes |
| A4 · Chapters | **done** | Five beats. Copy deliberately shares no sentence with any section further down the page — an earlier pass reused the tagline and the closing CTA line, so the page said both twice |
| B1 · Mobile/reduced/no-JS gate | **done** | Four Playwright tests count network requests rather than trusting the code. Lighthouse's own network log independently confirms **0 frames** on mobile |
| B2 · Perf regression | **done** | Production, mobile emulation: **performance 98 · a11y 100 · best practices 100 · SEO 100**. Local desktop 97 |
| B3 · Memory sweep | **done** | Three full scrubs down and up: heap **+0.1 MB**, node count flat, released on navigation |

**What measurement changed, twice.** The scroll→frame mapping was an ease-in-out that looked reasonable and quietly ate the last two chapters — at 78% of the scroll it was already on frame 162, so the tiers beat got a sliver of travel. Only a screenshot sweep showed it; the code read fine either way. It is linear now.

**A correction recorded against T14.** Its two mobile gate tests scrolled with `page.mouse.wheel`, which mobile WebKit does not support — so the tests written to prove a phone downloads no frames were throwing on the one project they were about. A truncated `tail` of the runner output was read as a pass. Fixed in T15 (`window.scrollTo`); both projects green. The claim itself held — Lighthouse and a separate fallback sweep had each shown zero frames independently — but it was reported as verified on evidence that did not verify it.

---

### T15 · Retention job and delete-my-data — **done** (`67aee50`)
| Task | Status | Note |
|---|---|---|
| A1 · Route handler | **done** | `/api/cron/retention`, `CRON_SECRET` bearer compared with `timingSafeEqual`, fails closed when unset. Returns and logs `{examined, objectsDeleted, filesDeleted, ordersPurged, parked, undeliveredBacklog}`; a failure is a **500** so Vercel marks the cron red |
| A2 · Schedule | **done (one gap)** | `vercel.json` → `0 22 * * *` UTC = 03:30 IST. ⏳ **`CRON_SECRET` must be added in Vercel** or the job 401s nightly — see H4 |
| A3 · Customer-facing truth | **done** | `samples_purged_at` on `orders`, so "deleted" and "never uploaded" are distinguishable. The completed card shows the date and says the report is unaffected; the admin sample viewer says the same instead of rendering empty |
| B1 · Delete-my-data | **done** | Two modes on `/admin/orders/[id]` — redact (person goes, anonymous order stays so the books balance) or erase (nothing survives). Typed order-id confirmation. `plans/RUNBOOK-delete-my-data.md` has the wording to quote the customer and the manual step when storage refuses |
| C1 · Boundary suite | **done** | 13 tests: 89/91 days, the hour either side of the ninetieth, double-run idempotency, undelivered order skipped **and counted**, report survives, buyer refused on all three functions, redact vs erase |
| C2 · Live verification | **done** | Seeded an order delivered 92 days ago with a real object, ran the endpoint: `examined 1, objectsDeleted 1, filesDeleted 1, ordersPurged 1`. Second run all zeros, no errors. Object confirmed **gone** from the bucket; report row and `completed` status untouched. Probe account removed |

**The design decision worth keeping.** What may be deleted is decided in SQL, not in the route handler. A cron endpoint is a URL — callable twice, callable late, and one day rewritten by somebody who does not know what `delivered_at` means. `purge_expired_samples()` re-derives the deletion set rather than trusting the ids it is handed.

**Objects before rows, deliberately.** Rows-first means a crash between the steps strands bytes in a private bucket that no later run can find, because a run learns what to delete from the rows. Objects-first strands rows whose objects are already gone, and tomorrow's run finishes the job. The interrupted state is the harmless one.

**A test that could not measure what it claimed.** The 90-day boundary cannot be tested in whole days: a fixture dated "exactly 90 days ago" is dated 90 days before the moment it was built, so by assertion time it is 90 days *and change*, and whether it is due depends on how slow the test was. The first version asserted such an order survives and failed for that reason alone. It is pinned at an hour either side now — stricter, and deterministic.

**Suites after T15:** typecheck ✓ · lint ✓ · format ✓ · claims ✓ · **181 unit** ✓ · **106 e2e** ✓ · build ✓ · production Lighthouse mobile **98/100/100/100** ✓

---


---

---

---

---

---

---

## Open human-in-the-loop items

| # | Needed for | What Tushar must do |
|---|---|---|
| ~~H1~~ | ~~T01/B1–B5~~ | ✅ **Done.** Project `tegaki-pilot`, ref `rgawqxdfvgbocgatjrlg`, ap-south-1 (Mumbai), Healthy |
| ~~H1b~~ | ~~migrations~~ | ✅ **Done.** CLI logged in and linked; both migrations pushed. Docker is unavailable here, so migrations go straight to the remote project — there is no local stack |
| **H1c** | T01/D4 RLS tests | ⏳ Paste the **secret key** into `SUPABASE_SECRET_KEY` in `.env.local` (dashboard → Settings → API Keys → Secret keys → reveal). It creates the two throwaway users the isolation suite needs |
| ~~H2~~ | ~~T01/C3~~ | ✅ **Done.** GCP project `tegaki-507313`; consent screen External, app "Tegaki"; client "Tegaki Web"; Tushar pasted the secret into Supabase |
| ~~H3~~ | ~~T01/E1–E4~~ | ✅ **Done.** Private repo `007U5H4R/tegaki`; Vercel project `tegaki`; production **https://tegaki-one.vercel.app**. Supabase Site URL and redirect list updated; `NEXT_PUBLIC_SITE_URL` set |
| **H4** | T15 cron | ⏳ **Add `CRON_SECRET` in Vercel** → project `tegaki` → Settings → Environment Variables → Production. Generate with `openssl rand -hex 32`. Vercel Cron sends it as `Authorization: Bearer $CRON_SECRET` automatically once the variable exists. **Until then the nightly retention job returns 401 and never runs** — the endpoint fails closed, which is the safe direction, but the 90-day deletion the privacy policy promises will not happen. Confirm afterwards in Vercel → Logs, filtering `[retention]` |

## Live infrastructure

| Thing | Value |
|---|---|
| Production | https://tegaki-one.vercel.app |
| Vercel project / team | `prj_9XfJoRJVG1i6gYkXJ4oLkYabR5uy` / `team_pLaStAJybzggE3tGD5ioih5M` |
| GitHub | `007U5H4R/tegaki` (**private**), branch `main` is the deploy branch |
| Supabase redirect allow-list | `localhost:3000`, `localhost:3100`, `tegaki-one.vercel.app`, and `tegaki-*-tushar-49a6.vercel.app` (wildcard, so preview deploys work; scoped to Tushar's own Vercel team subdomain) |

**Branch policy changed 2026-09-01 (Tushar's decision):** `build/pilot` was fast-forward merged into `main`, and `main` is now the deploy branch. The original plan kept `main` pristine until the code-review gate; that rule protects known-good code, and `main` held only specs, so there was nothing to protect. **The review gate moves from pre-merge to pre-launch** — same protection for a pilot with no users.
| ~~H4~~ | ~~T01/C8~~ | ✅ **Done.** `snowreaderofficial@gmail.com` — the Google account, not the Outlook one the env file originally had, which would have left no admin access at all |

## Google OAuth reference (tegaki-507313)

- **Client ID:** `346888874267-re5inp03nc5b76bss0elbvb8b4en7hkh.apps.googleusercontent.com`
- **Redirect URI registered with Google:** `https://rgawqxdfvgbocgatjrlg.supabase.co/auth/v1/callback`
- **Supabase redirect allow-list:** `http://localhost:3000/auth/callback`, `http://localhost:3100/auth/callback`
- **Publishing status: Testing.** Only listed test users can sign in (1 of 100 used). Either add each pilot user under *Audience → Test users*, or publish the app — publishing needs no Google verification for us, since we request only basic email/profile scopes.

---

## Decisions taken during the build

- **2026-09-01 · `teachspark` paused to free a Supabase slot.** The free plan caps a user at **2 active projects** and Tushar was at the limit (`railcite` + `teachspark`; a third was already paused). Tushar chose to pause `teachspark` — reversible for up to a year, data retained, backups downloadable after that. Upgrading to Pro was declined because it breaks the pilot's ₹0/month premise.
- **2026-09-01 · Project security toggles hardened at creation** (see the consequence note below):
  - *Enable Data API* — **on** (supabase-js needs it).
  - *Automatically expose new tables* — **OFF**. Supabase's own advice, and correct for a product whose top risk is unauthorised access to handwriting samples. **Consequence: every migration must now grant table privileges explicitly**; a new table is invisible to the API until it does.
  - *Enable automatic RLS* — **ON**. An event trigger enables RLS on every new public-schema table. Our migrations enable it anyway; this is the belt-and-braces that catches a migration that forgets.
- **`Sample Reports/` is gitignored.** It holds named individuals' personality assessments plus a handwriting scan — sensitive personal data under Tegaki's own privacy policy. The repo is destined for GitHub, so it stays local. **Flagged to Tushar.**
- **pnpm installed globally** (11.25.0) — corepack was unavailable on this machine's Node 26.7.0.

## Spec corrections made while implementing (all folded back into the source documents)

1. **`middleware.ts` → `proxy.ts`.** Next.js 16 deprecated and renamed the file convention (its bundled docs say so explicitly, and ship a codemod). The T01 plan's C2 task has been corrected. The same docs note proxy is for *optimistic* checks only and is not an authorization boundary — which is why real authorization stays in server components and actions.
2. **Motion tokens moved into `@theme`.** Tailwind ships `--ease-out` as `cubic-bezier(0, 0, .2, 1)` — precisely the weak curve `Design.md` §4.1 rules out. Defining ours inside the theme makes the `ease-out` *utility* resolve to the strong curve, so there is one motion system rather than two that silently disagree. Durations named `--duration-*` so Tailwind emits matching utilities.
3. **The Japanese face is self-hosted and subset.** `next/font/google` emitted **276 woff2 chunks totalling 8 MB** for three glyphs — a direct violation of `Design.md` §2.2 ("a few KB, never a full CJK font"). Subset the upstream face to 手書き with fontTools: **1,352 bytes**, and the site's entire font payload dropped to 15 files / 192 KB. Regenerate with `python3 -m fontTools.subset noto-full.woff2 --text="手書き" --flavor=woff2` if the JP copy ever changes.
4. **`service_role` had no grants at all.** Disabling "automatically expose new tables" switches off default privileges for **every** role, not just client-facing ones, so privileged queries failed with `42501`. The isolation tests all passed; only the admin fixtures broke — which is a good failure mode, but it would have resurfaced much later as a mysteriously broken retention cron. Granting `service_role` full access costs nothing, since the key already bypasses RLS by design. **Every table migration must now grant both roles.**
5. **Env guard hardened after a production 500.** The first deploy returned 500 on every route because `NEXT_PUBLIC_SUPABASE_URL` never made it into Vercel — the bulk paste silently dropped the first line. The guard named the exact variable, which is why this took a minute to diagnose rather than an hour. It now also rejects placeholders, malformed URLs, plain http for remote hosts, and the two key mix-ups (a secret key where a browser would read it; the publishable key in the privileged slot).
6. **`Design.md` hex fallbacks corrected.** They were eyeballed approximations that disagreed with their own authoritative OKLCH values — `--ink-950` was written `#131209` but resolves to `#0d0b06`. Replaced with true computed conversions; `theme-color` now tracks the real value. Contrast is unaffected in the safe direction (the ground got darker, so ratios rose).
7. **`order_files.uploader_id` had no ON DELETE rule.** It defaulted to NO ACTION, so once somebody uploaded a single sample their account became **undeletable** — the API answered "Database error deleting user" and named nothing. Their orders would have cascaded from `buyer_id` and the file rows from `order_id`; this one column refused, for no benefit. Fixed to `on delete cascade` in `20260902110000_order_files_uploader_cascade.sql`, with `tests/rls/account-deletion.test.ts` as the scar. Found while clearing test accounts, which is the cheap place to find it — the expensive places were **T15**, where deleting data on request is the whole ticket, and the first real customer asking to be forgotten.
8. **Test fixtures were accumulating in the live project.** 21 leftover `@tegaki.test` accounts, 71 orders, 33 payments and 64 file rows, from runs that were interrupted before their `afterAll`. Not merely untidy: they are live accounts whose passwords sit in source control, and by T07 they would have filled the admin queue with orders nobody placed. All removed (one real account, Tushar's, untouched and never had any orders). The recurrence guard is `tests/support/fixtures.ts`, swept once per vitest run via `globalSetup` and again in the Playwright spec's `beforeAll`; it only touches the reserved `@tegaki.test` domain and only accounts older than an hour, so a concurrent run cannot delete another's fixtures.

---

## Decisions taken during T06

- **Tier cards are one stacked column at every width**, not `Design.md` §3.3's three desktop columns. That layout is specified for the landing page; the wizard is a 640px reading column where three columns would only cramp. It also keeps visual order, DOM order and focus order identical — a CSS-reordered "Core first on mobile" would put the focus order at odds with what is on screen. Core is anchored by its chip and wash, which §6 names as the section's visual anchor anyway.
- **"Compare what's inside" is a disclosure, not a sheet.** The plan called for an excerpt sheet with placeholder content until C3. Building a modal primitive to hold placeholder text is speculative; the honest comparison — what each depth includes — is data we already have, so it ships as a real comparison now and C3 can add excerpts where they belong.
- **`submit_order()` returns rather than redirects, and revalidates nothing.** The stamp is the one celebratory beat in the product and it has to play on the page just confirmed, so the client navigates afterwards. `revalidatePath` in the action re-rendered the route the customer was still standing on — the wizard — whose layout sends a submitted order straight to the dashboard, cutting the stamp short and dropping the confirmation param. Cost 20 minutes to find; the e2e test now asserts the param, so it cannot regress silently.
- **`payments` CHECK constraints permit only `demo` / `demo_paid`.** The columns are gateway-ready; the constraints are pilot-honest. Permitting states the system cannot produce would make the data harder to trust, and widening two CHECKs is a one-line migration when Cashfree arrives.
- **A "Continue" button was added to draft order cards** — not in the T06 plan. T05 built wizard resume and justified it at length, but nothing linked to it, so a customer who closed the tab could not get back to their draft. Resume that exists only as a URL is not a feature.

## Decisions taken during T07

- **Admin access goes through RLS policies, never the service key.** The service key is used nowhere in the application — only cron (T15) and test fixtures. A policy keeps the admin's identity in the request and keeps the rule readable and testable; the key answers to nobody. The admin policies are also strictly **read-only**: `transition_order()` is the sole writer, and a broad "admin can update orders" policy would have been wider than any real requirement.
- **`getAdmin()` is wrapped in React `cache()`, and the pages guard themselves.** A layout and the page inside it render in **parallel**, so the layout's redirect does not stop the page's queries: a stranger's request to `/admin` was running the queue query — and logging `permission denied for table orders` — while the layout was deciding to send them away. Each page now checks too, and the cache means that costs no extra round trip.
- **A `'use server'` module may only export async functions.** Exporting the two reason-length constants from `src/lib/admin/actions.ts` silently turned the file into a module with **no exports at all**; the build failed at the import, not at the export. They live in `src/lib/admin/constants.ts` now.
- **Rejection reasons have a 15-character floor.** "Blurry" is a verdict; "the second page is out of focus, please photograph it flat in daylight" is something a customer can act on — and one sentence is all they get. Enforced in the action, and non-emptiness again in the database.
- **Native `<dialog>` instead of a modal component.** It brings a focus trap, Esc, backdrop and an inert background, and Design.md §3.7 rules out decorative motion on admin surfaces — which is the only thing a hand-rolled modal would have added. The deferred T02 modal primitive stays deferred until a customer-facing screen needs one.
- **The reject dialog and the page keep separate error slots.** One shared slot rendered the same sentence twice at once — inside the dialog and behind it. Found by an e2e strict-mode violation, which is a good reason to assert on messages rather than on roles.
- **The dashboard links to the queue for admins.** Not in the plan, but the queue was otherwise reachable only by typing the URL. The guard is what makes it safe; a link is what makes it usable.

## Decisions taken during T08

- **Parking an already-overdue order is not a privilege.** The `needs_reupload → parked` edge is allowed to the owner once `now() > reupload_deadline`, because the deadline decided rather than the caller, and the outcome is identical whoever asks. That is what lets the sweep run on an ordinary page load without granting anybody new powers. Parking one **early** stays with the analyst, and a test proves a buyer cannot do it to skip the wait.
- **A resubmission must carry a sample uploaded after the rejection.** Not "at least one file" — the rejected page is still attached, so that test would pass with nothing new. Without this rule, "resubmit" is a button that returns the order to the queue unchanged to be rejected again, spending the one thing the customer is short of. `rejected_at` exists to make the comparison possible.
- **The sweep runs on page load, not only on a schedule.** T15's cron becomes the backstop rather than the mechanism, so no customer is ever looking at an order the clock has already decided about. It is idempotent and scoped, so calling it on every dashboard render is cheap and safe.
- **The contact escape hatch is email only.** The PRD names a mailto *and* a WhatsApp deep-link; the deep-link needs a phone number nobody has supplied, and a broken link on the one screen with no way forward is worse than a single honest channel. `CONTACT_EMAIL` in `src/lib/copy.ts` is Tushar's own address, which is what the PRD specifies for a pilot with no support infrastructure. **Ask him whether he wants a different address, and for a number if he wants the WhatsApp link.**
- **`needs_reupload` is deliberately absent from `/styleguide`.** Its panel mounts a real uploader, and an uploader pointed at a fictional order is a control that fails when anyone uses it. The T02 dropzone test caught it the moment it was added. That variant is covered where it can be exercised for real, in `e2e/reupload-loop.spec.ts`.
- **Client components must not format dates.** `ReuploadPanel` formatted the deadline itself, so Node and WebKit each ran their own ICU for `en-IN`, React saw a hydration mismatch and regenerated the tree — which wiped an upload in progress. Only the **mobile** project caught it. Dates are formatted on the server and passed down as strings; a sweep confirmed no other client component formats one.
- **The machine's disk filled up mid-ticket** (887 MB free of 228 GB on the internal volume) and Playwright began failing with `ENOSPC` on browser profile creation — appearing as different tests failing on each run, which looked exactly like a race condition. Cleared the tooling caches this work created; **the underlying problem is Tushar's, not the project's** (the repo lives on the external drive with 52 GB free) and will keep causing spurious failures until he frees space.

## Decisions taken during T09

- **The attestation is enforced in three places and guaranteed in one.** The checkbox gates the button, `attachReport()` re-checks, and `reports.validated_at` is `not null` with `attach_report()` as the only writer. Solution-PRD §7.4 permits no unvalidated delivery, and fulfilment is manual — that read-through is the only thing between a generated document and somebody's inbox. A rule enforced only in a form lasts until someone changes the form.
- **A wrong assumption, caught by the browser.** The first migration gave the reports bucket **no buyer storage policy at all**, on the reasoning that customers never touch it directly — they go through a server action. The shape was right, the mechanics were wrong: **signing a URL is itself an authorised read of the object**, so `createSignedUrl` as the buyer failed with "Object not found" and the download button did nothing. The e2e caught it as a download event that never fired; a probe confirmed it before anything was rewritten. The buyer now gets the narrowest read there is — the object's first path segment must name an order they own — which is the `samples` shape, and works for the same reason: the path is the boundary. **The misleading comment in the first migration is corrected by the second rather than edited in place; an applied migration is history.**
- **Bytes first, row second.** If the upload succeeds and `attach_report()` fails, an object is orphaned in a private bucket. The other order — row first — would show a customer a completed order with nothing to download. Of the two failures the orphan is the one nobody notices at the wrong moment, and the sweep below now catches it.
- **`startReport()` is a deliberate stopgap.** T10 owns status controls, generated from the transition matrix so the UI can only offer edges the function accepts. But without this one edge, T09's upload panel cannot be reached at all and its own plan had to seed the state in SQL. A feature nothing can reach is not shipped. **Delete it when T10/B5 lands.**
- **Private buckets now get swept for orphans.** T09's test runs left ten PDFs in `reports` with no owning row — and checking turned up one in `samples` too, already there, unnoticed because nothing had looked. Deleting a user cascades rows but not bytes; storage has no foreign keys. An orphaned personality report in a private bucket is exactly what retention exists to prevent, and test data is a rehearsal for the real thing rather than an exception to it.
- **A one-second signed URL cannot prove freshness.** The first expiry test signed for one second, fetched, and asserted the fetch worked — a race the network usually wins, because the round trip alone outlived the link. Freshness is now proven at the real 60-second TTL and expiry with its own short one. *A test that fails for a reason unrelated to the thing it names is worse than no test.*

## Decisions taken during T10

- **The pause is a trigger on `orders`, not a check in the server action.** Hiding a button is not enforcement, and neither is application code that a direct PostgREST insert walks straight past — the e2e proves this by bypassing the UI entirely and being refused. **Insert-only, deliberately:** somebody already mid-wizard can still submit. The pause protects the queue from *new* work, and turning a customer away at the last step, after they have photographed two pages, would be the worst possible moment to do it.
- **Delivered is a stamp, not a status.** `completed` means the report exists and is downloadable; delivered means Tushar actually sent it from his own Gmail — which happens outside this system entirely. Modelling it as a state would put a step the software cannot observe into the machine that governs the ones it can. The customer's rail only closes when it is set, so the product never claims credit for something it did not see.
- **The admin controls are generated from `TRANSITIONS`,** the same list `tests/rls/orders.test.ts` walks against the live `transition_order()`. The UI can only offer edges the database would accept, and a hand-written button cannot outlive the rule it was written for. Completing is deliberately unlabelled: an order is completed by attaching the report, so a button here would be a way to produce a completed order with nothing to download.
- **`isPaused()` reads through `is_paused()`, not the table.** Reading `settings` directly worked for a signed-in customer and failed with `permission denied` for an anonymous one — the wrong shape for a question whose answer is a closed sign. It is also asked only *after* the auth check now: no work on behalf of a visitor about to be redirected. (Same class as T07's parallel-render finding.)
- **`tests/codebase/status-writes.test.ts` is a grep, and that is fine.** Three things already stop application code writing `orders.status` at runtime — the missing column grant, the absent policy, and `transition_order()`. This adds the check that fails in *review* instead. Proven to bite before being trusted: one offending line fails it by name and file.
- **`admin-ops.test.ts` runs alone, after everything else** (`package.json`'s `test` script). The pause is a single global row, so a run overlapping a suite that creates orders closes the shop underneath it — that failed one or two unrelated tests on each of three consecutive runs before the split, in a different place each time.

## Fixture pool — Supabase auth rate limits (fixed on the unit side)

**The problem.** Each RLS suite created and signed in its own two or three users: ~40 auth calls per `pnpm test`. Running verification twice inside an hour tripped GoTrue's rate limiter, and every affected suite then failed at `beforeAll` with `AuthApiError: Request rate limit reached` — which reads as a catastrophic regression and is not one. It cost real time three times during T09 and T10.

**The fix** (`tests/support/pool.ts` + `tests/global-setup.ts`). Three accounts — an analyst and two buyers — are created and signed in **once per run**, and their access tokens handed to the workers with vitest's `provide`/`inject`, because each test file runs in its own process and module state does not cross that line. A suite builds a client by putting the token in an Authorization header, which is exactly what `signInWithPassword` produces: PostgREST, GoTrue and Storage all read the JWT from that header, so `auth.uid()`, RLS and storage policies behave identically.

**6 auth calls per invocation, down from ~40.** Verified by three consecutive full runs — the case that used to fail — all green, with no accounts left behind.

Things worth knowing:
- **A pool client has no session object**, so `client.auth.getSession()` returns null. Anything needing the raw JWT takes it from the member's `accessToken`. One storage test did the former and had to change.
- **Never delete a pool member from a suite.** They belong to the whole run and are torn down in `global-setup`. Suites still clean up their own storage objects and their own global state (`admin-ops` reopens the shop).
- `account-deletion.test.ts` still creates its own user, because deleting one is the thing it tests.
- Assertions must stay **scoped to specific ids** rather than counting all of a user's rows: the accounts are shared across suites running in parallel.

**Still outstanding: the e2e side, which is now the larger consumer** — 34 users per full run across both projects, so ~68 auth calls. Sharing buyers there is not safe as written: several specs assert that a stranger's dashboard shows nothing, which a shared account would invalidate. The analyst *could* be shared (every admin assertion is id-scoped). Worth doing if rate limits reappear; not done, because the unit side was the one that actually kept failing and this would trade real isolation for a modest saving.

## Decisions taken during T11

- **The hero contrast is measured, not asserted.** Design.md §5.1 requires hero copy over photography to reach 7:1, which is a claim about rendered pixels rather than about a class name. `e2e/landing.spec.ts` screenshots the region behind the heading with the text hidden, finds the **lightest** pixel in it, and computes the real ratio. The first measurement was **1.9:1** — an illegible hero that looked perfectly fine in review, and would have shipped.
- **Then the opposite failure.** Tuning the scrim until it passed took the photograph to a black rectangle, and the same design document says the subject stays visible. Recomposing the crop (`object-position`) so the written line sits out of the copy's band fixed desktop: pen, hand and handwriting all legible beside the words, at 7:1.
- **The phone gets a different layout, and that is a deviation.** A 16:9 photograph cropped to 390×844 is a narrow vertical slice, and a heading this size covers nearly all of it — every scrim strong enough to pass took the image to black. So on a phone the picture sits **above** the copy at full strength, undarkened, with the words on the ink ground beneath. Design.md §6 says "hero copy over darkened lower half of the macro"; this keeps what that rule was protecting, which is that somebody can see the handwriting. **Flagged for Tushar rather than quietly changed.**
- **The tagline's muted level is 58%, not Design.md's 30%.** Measured, 30% is below the 3:1 floor for large text and axe fails the page on it — and the same document makes the accessibility gate mandatory, so the number gives way to the gate. The before/after contrast is still obvious.
- **Lockup links are named by their content.** An `aria-label` replaces the accessible name outright, so any spacing difference between the wordmark and 手書き is a WCAG 2.5.3 mismatch — axe kept flagging it through two attempts at wording the label. Letting the content name the link makes them identical by construction; extra context is appended with `sr-only` text rather than substituted for what is on screen. Same fix applied to the wizard and admin lockups, which axe had not reached because they are behind auth.
- **Reveals hide content only after JavaScript arms them.** The resting state in CSS is the visible one, so a page with no JS, an old browser or a thrown exception simply reads. A reveal that hides content by default is a reveal that can hide it forever — and there is a spec that loads the page with JavaScript disabled to keep that honest.
- **`#samples` and `#faq` are real sections with honest placeholder copy,** not empty anchors. The nav names them, and a link that scrolls to nothing reads as broken. T12 fills them.

## Decisions taken during T12

- **The anatomy crops come from our own hero photograph.** The C3 plan is explicit that a real client scan never appears on the landing page, anonymised or otherwise — a crop small enough to feel anonymous is still somebody's hand. The hero frame is imagery generated for this project and carries all three traits the section names, so it was cut three ways rather than sourcing anything else.
- **The fictional label sits on the card, not in a footnote.** Solution-PRD §2 rules out testimonials until real ones exist; a "sample report" that let a reader assume it was somebody's real assessment would be the same dishonesty in better clothes. It is rendered in the same size as the byline, above the words that could be mistaken.
- **The FAQ says outright that this is not a science and not a diagnosis.** Uncomfortable on a sales page, and the reason to believe the rest of it. The schema is generated from the same array the accordion renders — two copies of that text would eventually disagree, and the version search engines quote is the one nobody proofreads.
- **The claims guard was rewritten before it was trusted.** Version one grepped whole lines and produced **twenty-five false positives** — a component called `Reveal`, import paths, CSS custom properties, and its own explanatory comments. A guard that cries wolf gets switched off. It now strips comments and reads only string literals and JSX text that look like prose (has a space, and a capital or sentence punctuation — which excludes Tailwind class lists and paths). The two places the copy legitimately names "scientific" and "diagnosis" are **listed explicitly**, because it is denying them; an enumerated exception is reviewable in a way a cleverer regex is not. It caught one real claim on the way in: placeholder copy promising what a report "will make".
- **The portrait is graded in CSS, not in the file.** Its blue backdrop is the only saturated hue on the site that is not vermilion. A warm pass settles it into the page; the original file is untouched, so undoing it is deleting one class. **No credential chips** — the plan allows them only for claims Tushar confirms in writing.
- **Metadata tokens are calibrated for the dark ground.** `text-ink-500` is the metadata colour on ink-950; on the washi excerpt card it measures **3.61:1**, below the 4.5:1 small text needs, and Lighthouse failed the page on it. Worth holding as a class of bug rather than an instance — the washi card is the only light surface on the site, and a token named for its role on one surface is not automatically right on the other.

### Still open from C3

The three **sample report PDFs** are not built. They need C1 (the per-tier prompt variants) and C2 (the report template), neither of which has been done — the landing page shows excerpts, which is what it needed, but "see a sample report" has no downloadable artefact behind it yet. Worth doing before the pilot takes real users.

## Decisions taken during T13

- **The OG card is rendered in a browser, not generated.** Chromium is already present for the test suite, so `scripts/generate-og.mjs` renders real HTML with the real fonts and screenshots it at 1200×630. A wordmark has to be crisp at 100%, and no diffusion model can be trusted to spell. The seal outline is read out of `seal.tsx`, so the mark on the card and the mark on the site are one mark.
- **It is a checked-in PNG rather than generated per request.** A crawler that gets a slow or failed response caches the failure, and a preview broken on first paste is broken for everybody who ever sees that message.
- **Every OG URL is absolute, and the test knows the difference between environments.** A root-relative image silently fails on LinkedIn and WhatsApp — no image, no error. Locally the tags carry `NEXT_PUBLIC_SITE_URL` (a different port from the test server), so the spec resolves the path against the host under test; deployed, it asserts the exact URL a crawler will fetch, its origin, its status and its content type.
- **No WhatsApp deep-link on the contact page.** The number has not been supplied and the plan says a placeholder must fail rather than ship. A dead `wa.me` link on the page somebody reaches *because* their order is stuck would be the worst possible place for one.
- **The policies describe the product that exists.** Including the uncomfortable parts: the pilot takes no money, graphology is not an established science, and reports are not written for hiring decisions. A customer who has just read a page that talks plainly and then meets three screens of borrowed legalese has learned which one was the marketing.
- **Two more claims-guard exceptions, both denials.** "not a diagnosis" and "availability is not guaranteed". Flipping the second to "is guaranteed" still fails the guard, which is the property that makes an enumerated exception list safe rather than a loophole.

### Open for Tushar on T13

- **The WhatsApp number**, if the deep-link is wanted on the contact page and the parked-order panel.
- **Two verifications only he can do:** paste `https://tegaki-one.vercel.app` into a WhatsApp chat and check the unfurl, and run it through the LinkedIn Post Inspector. What is proven from here: the image returns 200, its bytes match the repo, and every tag is absolute HTTPS pointing at the right host — which is what makes those two succeed.

### Known load flake

`reupload-loop.spec.ts` failed once in a full 90-test run waiting for the status chip, and passed on both projects in isolation immediately after, and in the next full run. Four Playwright workers share one `next dev` server, and first-hit route compilation under that load can outrun a 30-second wait. Recorded rather than chased: the behaviour it covers is separately proven by `tests/rls/reupload.test.ts`.
