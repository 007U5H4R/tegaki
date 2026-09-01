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

---

## Open human-in-the-loop items

| # | Needed for | What Tushar must do |
|---|---|---|
| ~~H1~~ | ~~T01/B1–B5~~ | ✅ **Done.** Project `tegaki-pilot`, ref `rgawqxdfvgbocgatjrlg`, ap-south-1 (Mumbai), Healthy |
| ~~H1b~~ | ~~migrations~~ | ✅ **Done.** CLI logged in and linked; both migrations pushed. Docker is unavailable here, so migrations go straight to the remote project — there is no local stack |
| **H1c** | T01/D4 RLS tests | ⏳ Paste the **secret key** into `SUPABASE_SECRET_KEY` in `.env.local` (dashboard → Settings → API Keys → Secret keys → reveal). It creates the two throwaway users the isolation suite needs |
| ~~H2~~ | ~~T01/C3~~ | ✅ **Done.** GCP project `tegaki-507313`; consent screen External, app "Tegaki"; client "Tegaki Web"; Tushar pasted the secret into Supabase |
| ~~H3~~ | ~~T01/E1–E4~~ | ✅ **Done.** Private repo `007U5H4R/tegaki`; Vercel project `tegaki`; production **https://tegaki-one.vercel.app**. Supabase Site URL and redirect list updated; `NEXT_PUBLIC_SITE_URL` set |

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
