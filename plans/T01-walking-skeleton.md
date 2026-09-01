# Plan — T01 · Walking skeleton: Next.js + Supabase + Google auth

> **Ticket:** T01 (`tickets.md`) · **Phase 1 · Foundation** · **Blocked by:** nothing — this is the DAG root.
> **Inputs:** `Solution-PRD.md` §9 (architecture) · `Design.md` §2 (tokens only) · `tickets.md` (acceptance).
> **Delivers:** a deployed app where signing in with Google works on the live URL, one `profiles` row is created, `/dashboard` is protected, and no user can read another's profile.

---

## Stack decisions locked by this plan

These are stated once here and inherited by every later plan. Flagged rather than assumed — say so now if any is wrong.

| Decision | Choice | Why |
|---|---|---|
| Framework | **Next.js, App Router, TypeScript strict** | PRD §9. **Verify the current stable major at scaffold time** (`pnpm create next-app@latest`) — do not hard-code a version from memory. |
| Package manager | **pnpm** | Fast, strict about phantom dependencies. |
| Styling | **Tailwind (v4+, CSS-first `@theme`) + CSS custom properties** | `Design.md` tokens live as custom properties; Tailwind supplies the type/spacing scale the design rules are written against. Verify the current major at install time. |
| Auth/session | **`@supabase/ssr`** | The supported cookie-based pattern for App Router. `@supabase/auth-helpers-nextjs` is deprecated — do not use it. |
| Schema management | **Supabase CLI migrations** in `supabase/migrations/` | Every ticket brings its own table; schema must be version-controlled and replayable, never clicked into the dashboard. |
| Unit/integration tests | **Vitest** | Fast, TS-native. |
| End-to-end tests | **Playwright** | Needed for the auth redirect and, later, the full wizard loop. |
| Master media assets | **Not committed to git** | `assets/hero/*.png|mp4` are large and regenerable from the Higgsfield job ids recorded in `Hero-Video-Prompts.md`. Only derived, web-sized assets in `public/` get committed. |

**Scope boundary with T02:** T01 installs the **token file and fonts only** (so nothing later has to be un-styled). All component primitives — button, input, card, chip, stepper, dropzone, modal, toast, and the four screen-state primitives — belong to T02. Do not build them here.

---

## Human-in-the-loop points

These cannot be done by an agent and must be handed to Tushar. Stop and ask; do not fake or stub past them.

- **H1 · Create the Supabase project** (region: closest to India) and supply the project URL, anon key, and service-role key.
- **H2 · Configure the Google OAuth provider** in Supabase Auth — requires a Google Cloud OAuth client ID/secret and the authorized redirect URI.
- **H3 · Create the GitHub repo and link the Vercel project**, then confirm the production URL.
- **H4 · Confirm the admin allowlist email(s)** for `ADMIN_EMAILS`.

---

## Tasks

Each task is 2–5 minutes and ends with a verification gate. Do not start the next task until the current gate passes.

### Group A — Repository and scaffold

**A1 · Initialise the repository**
Run `git init` at the repo root. Create `.gitignore` covering `node_modules/`, `.next/`, `.env*.local`, `.vercel/`, `coverage/`, `playwright-report/`, `test-results/`, and `assets/hero/*.png`, `assets/hero/*.mp4`.
*Gate:* `git status` lists the docs (`*.md`) and `assets/hero/slice-frames.sh` but **not** the PNG/MP4 masters.

**A2 · First commit**
Commit the existing specification set (`Solution-PRD.md`, `Discovery-PRD.md`, `Design.md`, `tickets.md`, `tegaki-handoff.md`, `Hero-Video-Prompts.md`, `plans/`).
*Gate:* `git log --oneline` shows one commit; `git show --stat` lists only intended files.

**A3 · Scaffold the Next.js app at the repo root**
`pnpm create next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*"`. Keep the existing markdown and `assets/` in place.
*Gate:* `pnpm dev` serves the default page at `localhost:3000` with no console errors.

**A4 · Tighten TypeScript and formatting**
In `tsconfig.json` set `"strict": true`, `"noUncheckedIndexedAccess": true`. Add Prettier + `.prettierrc`. Add scripts: `typecheck`, `lint`, `format`.
*Gate:* `pnpm typecheck && pnpm lint` both exit 0.

**A5 · Install the design tokens and fonts**
In `src/app/globals.css`, declare the `Design.md` §2.1 OKLCH custom properties (`--ink-*`, `--washi-*`, `--shu-*`, state colours) and the §4.1 motion tokens. Load Instrument Serif, Manrope, and Geist Mono via `next/font/google`; load Noto Serif JP **subset to the glyphs actually used** (手, 書, き and the footer characters) via `unicode-range`. Set `<body>` to `--ink-950` background and `--washi-50` text.
*Gate:* a scratch page renders serif and sans specimens plus 手書き correctly; DevTools shows the JP font transferring only a few KB.

### Group B — Supabase project and schema

**B1 · Capture environment configuration** *(needs H1)*
Create `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`. Create the real `.env.local` (gitignored).
*Gate:* `.env.example` is committed, contains **no** real values, and `.env.local` does not appear in `git status`.

**B2 · Initialise the Supabase CLI**
`pnpm add -D supabase`, then `pnpm supabase init` and `pnpm supabase link --project-ref <ref>`.
*Gate:* `supabase/config.toml` exists and is committed.

**B3 · Migration: `profiles` table**
Create `supabase/migrations/<ts>_profiles.sql`: `profiles` with `id uuid primary key references auth.users(id) on delete cascade`, `email text not null`, `full_name text`, `role text not null default 'buyer' check (role in ('buyer','admin'))`, `created_at timestamptz not null default now()`.
*Gate:* `pnpm supabase db reset` applies cleanly against the local stack.

**B4 · Migration: profile auto-creation trigger**
In the same or a following migration, add a `security definer` function `handle_new_user()` inserting into `profiles` on `auth.users` insert, and the matching trigger.
*Gate:* inserting a row into `auth.users` locally produces exactly one `profiles` row.

**B5 · Migration: RLS on `profiles`**
Enable RLS. Policies: `select` where `auth.uid() = id`; `update` where `auth.uid() = id` (restricted to `full_name`). **No** policy granting cross-user reads.
*Gate:* with RLS on, a query as user A for user B's row returns zero rows — verified in `psql`, not the UI.

### Group C — Auth wiring

**C1 · Supabase client factories**
`src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server components/actions, cookie-aware), `src/lib/supabase/middleware.ts` (session refresh helper) — all via `@supabase/ssr`.
*Gate:* `pnpm typecheck` passes; each factory returns a typed client.

**C2 · Middleware**
`src/middleware.ts` refreshing the session and matching all routes except static assets and images.
*Gate:* loading any page sets/refreshes the Supabase auth cookie.

**C3 · Google provider configuration** *(needs H2)*
Enable Google in Supabase Auth; set the redirect URI to `<site>/auth/callback`; add both the Vercel production URL and `http://localhost:3000` to allowed redirects.
*Gate:* the provider shows enabled in the Supabase dashboard.

**C4 · Sign-in page**
`src/app/(auth)/sign-in/page.tsx` — the hanko lockup, one "Continue with Google" button, and the indicative-claims disclaimer line. Server action calls `signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
*Gate:* clicking the button reaches Google's consent screen locally.

**C5 · OAuth callback route**
`src/app/auth/callback/route.ts` — exchanges the code for a session and redirects to `/dashboard`; on error redirects to `/sign-in?error=...` with a specific, non-generic message.
*Gate:* a full local sign-in lands on `/dashboard` with a session cookie set.

**C6 · Sign-out action**
`src/app/(app)/actions/sign-out.ts` — server action calling `supabase.auth.signOut()` then redirecting to `/`.
*Gate:* after sign-out, `/dashboard` redirects to `/sign-in`.

**C7 · Protected dashboard route**
`src/app/(app)/dashboard/page.tsx` — server component reading the session; anonymous → `redirect('/sign-in')`. Renders the signed-in email and a sign-out control. Plain layout; T02 supplies the real shell.
*Gate:* signed in renders the greeting; signed out redirects.

**C8 · Admin role helper** *(needs H4)*
`src/lib/auth/role.ts` — `resolveRole(email)` returning `'admin'` when the email is in `ADMIN_EMAILS` (comma-separated), else `'buyer'`. Call it in the profile-creation path so admin accounts are marked. **Enforcement of admin routes is T07** — this ticket only resolves and stores the role.
*Gate:* unit test covers admin email, non-admin email, casing differences, and surrounding whitespace.

### Group D — Tests

**D1 · Vitest setup**
`pnpm add -D vitest @vitest/coverage-v8`; `vitest.config.ts`; `pnpm test` script.
*Gate:* a trivial test runs and passes.

**D2 · Playwright setup**
`pnpm create playwright`; configure `baseURL` to the dev server; `pnpm test:e2e` script.
*Gate:* the example spec runs headless and passes.

**D3 · Auth redirect E2E test**
`e2e/auth.spec.ts` — an anonymous request to `/dashboard` lands on `/sign-in`.
*Gate:* the test fails if the redirect is removed (verify by temporarily deleting it — this is the point of the gate).

**D4 · Two-account RLS test** ⚠️ the ticket's real acceptance criterion
`tests/rls/profiles.test.ts` — create two users via the service-role client, then, using each user's **anon** client, assert each reads only their own profile row and gets zero rows for the other.
*Gate:* the test passes with RLS on and **fails** when the `select` policy is loosened — prove both directions.

### Group E — Deploy and verify

**E1 · Push to GitHub** *(needs H3)*
Create the remote, push `main`.
*Gate:* `git diff main..HEAD --stat` is empty and the remote shows the expected file list — nothing unintended, no `.env.local`, no media masters.

**E2 · Vercel project and environment variables**
Link the project; set the four env vars for preview and production.
*Gate:* the Vercel dashboard lists all four in both environments.

**E3 · Production deploy and live verification**
Deploy. Then, on the live `*.vercel.app` URL: sign in with a real Google account, confirm `/dashboard` renders the greeting, confirm exactly one `profiles` row exists, sign out, confirm `/dashboard` redirects.
*Gate:* all five checks pass **on the deployed URL**, not just locally. Record the URL in `tegaki-handoff.md`.

**E4 · Second-account isolation check on production**
Sign in with a second Google account; confirm a second `profiles` row and that neither account can read the other's row.
*Gate:* verified against the production database.

---

## Definition of done

- [ ] Google sign-in works **on the deployed URL**, creating exactly one `profiles` row per account.
- [ ] `/dashboard` is protected; anonymous access redirects, proven by a test that fails when the guard is removed.
- [ ] RLS on `profiles` is proven in both directions by the two-account test.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` all pass.
- [ ] No secrets committed; `.env.example` documents every variable.
- [ ] Design tokens and fonts installed; the JP subset is a few KB.
- [ ] Repo is under git with a clean, intentional file list.

## Notes for the implementer

- **Do not build component primitives.** Ugly-but-correct is the right outcome here; T02 makes it beautiful.
- **Do not click schema into the Supabase dashboard.** Every schema change is a migration file, or the next twelve tickets have no reproducible database.
- If a human-in-the-loop item blocks you, stop and report which one. Do not stub credentials or fake a deploy.
