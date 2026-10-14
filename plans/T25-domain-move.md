# Plan — T25 · Move to tegaki.tusharpathak.com

> **Ticket:** T25 · Campfire TASK-22.2 · **Phase 6 (ships first)** · **Blocked by:** —.
> **Delivers:** the app served at `tegaki.tusharpathak.com` on the existing Vercel project (`prj_9XfJoRJVG1i6gYkXJ4oLkYabR5uy`). `tegaki-one.vercel.app` 308-redirects to it, with path and query kept. Supabase Auth, Google OAuth, `NEXT_PUBLIC_SITE_URL` and the OG image are all updated.
> **Read first:** `technical-plan.md` §3.3, §9.2 · `src/lib/site.ts` · `src/lib/auth/actions.ts` · `scripts/generate-og.mjs` · `plans/T13-policies-linkpreview-shipset.md` (the link-preview gate).

## Design decisions locked here
- **Same project, same deployment, a new primary domain** (S8, TP8). Vercel can redirect the default `.vercel.app` domain to the custom one.
- **The OAuth redirect URI in Google doesn't change,** because Supabase hosts the callback. Only the Supabase allow-list and Site URL must change.
- **Old auth entries stay** until sign-in has been proven on the new domain. They're removed one week later.
- **External, outward-facing changes** (DNS, Vercel domains, Supabase, Google console) get Tushar's go-ahead in the session before each one is made.

## Tasks

**A1 · Vercel domain** (Vercel MCP `add_project_domain`, or the dashboard)
- Add `tegaki.tusharpathak.com` to the project. DNS is on Vercel, so expect automatic configuration.
- Then edit `tegaki-one.vercel.app` → **Redirect to** `tegaki.tusharpathak.com`, **308**.

*Gate:* `get_project_domain` shows the domain verified, and a TLS certificate is issued (`curl -sI https://tegaki.tusharpathak.com` returns 200).

**A2 · Env + redeploy**
- Production `NEXT_PUBLIC_SITE_URL=https://tegaki.tusharpathak.com`.
- Change the fallback in `src/lib/site.ts` to the new host too, so a build missing the variable still points somewhere real.
- Redeploy.

*Gate:* the page source on the new domain shows `og:url` and `og:image` with absolute `https://tegaki.tusharpathak.com/...`.

**A3 · Supabase Auth** (Dashboard → Authentication → URL Configuration; Tushar does it or approves it)
- Site URL: `https://tegaki.tusharpathak.com`.
- Redirect URLs: add `https://tegaki.tusharpathak.com/auth/callback`.
- Keep the existing `tegaki-one.vercel.app` and `localhost` entries for now.

*Gate:* a screenshot of the settings, or Tushar confirms them.

**A4 · Google OAuth client** (Google Cloud Console → Credentials and Branding)
- Authorized redirect URIs: **no change** (the Supabase callback stays).
- Authorized JavaScript origins: add `https://tegaki.tusharpathak.com`. This is harmless and future-proof for One Tap.
- Branding → Authorized domains: add `tusharpathak.com`.
- Brand verification is **not** required for basic sign-in, so skip it.

*Gate:* the console is saved.

**B1 · OG image**
- `scripts/generate-og.mjs` line 74 prints the host. Read it from `SITE_URL` (or update the literal) and regenerate `public/og-cover.png` at 1200×630.

*Gate:* look at the image itself, then re-scrape it in LinkedIn Post Inspector and opengraph.xyz.

**C1 · Prove it**
- **Sign-in:** a production Google sign-in walk-through on the new domain lands on `/dashboard`. Do it on a phone too.
- **Redirects:** for each of `curl -sI "https://tegaki-one.vercel.app/dashboard"`, `…/sign-in?tier=core` and `…/`, check that it returns 308 with `location: https://tegaki.tusharpathak.com/<same path and query>`.
- **Cron:** Vercel → Cron Jobs still lists both jobs. They run on the project, not on a domain.
- **Keep-alive:** if T24 has shipped, call it once on the new domain.

*Gate:* every check passes. Record the outputs in `plans/reports/T25-report.md`.

**C2 · Tidy (one week later)**
- Remove the old `tegaki-one.vercel.app/**` entry from Supabase Redirect URLs.
- Update the README links and the Obsidian notes.

*Gate:* sign-in still works.

**C3 · Repo references**
- `grep -rn "tegaki-one" src scripts README.md e2e` → update every user-facing reference. Playwright base URLs that target local dev are left alone.

## Definition of done
- [ ] Google sign-in completes to the dashboard on the new domain (production, desktop and phone).
- [ ] Old-URL deep links land on the same path and query on the new domain (308).
- [ ] OG tags and the OG image use the new absolute URL, re-scraped in an inspector.
- [ ] Typecheck, lint and the claims guard are green.
