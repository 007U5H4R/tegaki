# Setup steps for Tushar — H1 to H4

> These four things need your accounts, so I can't do them. Everything else in T01 is already built and green.
> Work top to bottom; **H1 unblocks the most.** Paste values back to me, or write them straight into `.env.local` yourself (that file is gitignored — it never reaches GitHub).

---

## H1 · Supabase project *(unblocks the database, auth and 9 tasks)*

1. Go to **supabase.com** → sign in → **New project**.
2. Name it `tegaki-pilot`. Region: **Mumbai (ap-south-1)** — closest to your users.
3. Set a database password and save it in your password manager (you'll rarely need it, but losing it is annoying).
4. Wait ~2 minutes for provisioning.
5. Open **Project Settings → API** and copy three values:

```
Project URL         →  NEXT_PUBLIC_SUPABASE_URL
anon / public key   →  NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key    →  SUPABASE_SERVICE_ROLE_KEY   ← secret, server-only
```

> The service-role key bypasses every security rule in the database. It is used in exactly two places (the retention cron and the test suite) and must never appear in a `NEXT_PUBLIC_` variable. If it ever leaks, rotate it in the same settings page.

---

## H2 · Google OAuth client *(unblocks sign-in)*

1. Go to **console.cloud.google.com** → create a project (`Tegaki`).
2. **APIs & Services → OAuth consent screen**: External · app name **Tegaki** · your email as support + developer contact. Save. (Leave it in "Testing" — add your own Google account plus any pilot users under *Test users*.)
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application*.
4. **Authorized redirect URI** — one entry, taken from your Supabase dashboard (**Authentication → Providers → Google**, it shows you the exact callback URL):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client secret**, then in Supabase go to **Authentication → Providers → Google**, enable it, paste both, and save.
6. Still in Supabase, under **Authentication → URL Configuration**, add both to *Redirect URLs*:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3100/auth/callback
   ```
   (The Vercel production URL gets added in H3, once it exists.)

---

## H3 · GitHub repo + Vercel *(unblocks deployment)*

1. Create a **private** GitHub repo named `tegaki`. Don't initialise it with a README — the repo here already has history.
2. Tell me the repo URL and I'll push `main` and `build/pilot`.
3. Go to **vercel.com** → **Add New → Project** → import `tegaki`.
4. Framework preset: **Next.js** (it should autodetect). Don't deploy yet — add the environment variables first, which I'll walk you through once H1 is done.
5. After the first deploy, send me the production URL (`https://<something>.vercel.app`). It goes into `NEXT_PUBLIC_SITE_URL`, the Supabase redirect list, and Google's authorized origins.

> Vercel's free Hobby plan forbids commercial use. The pilot takes **no real payments**, which is what keeps this compliant — see `Solution-PRD.md` §9. If real payments ever switch on, the plan has to change too.

---

## H4 · Admin email *(unblocks the admin panel)*

Just tell me which Google account should be the admin — presumably the one you'll sign in with. It becomes:

```
ADMIN_EMAILS="you@example.com"
```

Matching ignores case and whitespace, and multiple addresses can be comma-separated. Admin is granted by **deploy**, not by a database row, so nobody can promote an account from inside the app.

---

## What happens once these land

| You give me | I unblock |
|---|---|
| **H1** | The `profiles` table, RLS, the auth client wiring, the two-account isolation test suite |
| **H1 + H2** | Sign-in, sign-out, the protected dashboard, the auth redirect test |
| **H3** | Live deploy, and the real acceptance gate: sign in on the deployed URL with two separate Google accounts and prove neither can see the other's data |
| **H4** | Your account marked admin at profile creation |

Then Phase 1 finishes with T02 (the component library), and a QA agent checks the phase boundary before Phase 2 starts.

**Fastest path:** do **H1** first and send me the three values — that alone unblocks nine tasks and I can work while you do H2 and H3.
