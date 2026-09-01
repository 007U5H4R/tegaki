# Tegaki Build Ledger

> Crash-recovery state for the build. Any fresh session resumes from here + `tegaki-handoff.md`.
> Format: `TICKET/TASK · status · model · note`. Statuses: `done` · `wip` · `blocked` · `parked`.

**Branch:** `build/pilot` (base: `main` @ `423a0c1`) · **Started:** 2026-09-01

---

## Phase 1 — Foundation

### T01 · Walking skeleton
| Task | Status | Model | Note |
|---|---|---|---|
| A1 · git init + .gitignore | **done** | Opus (orchestrator) | Excluded `Sample Reports/` (real client data), hero masters, parked decks, local Claude settings |
| A2 · First commit | **done** | Opus (orchestrator) | `423a0c1`, 210 files; `main` clean, work on `build/pilot` |
| A3 · Scaffold Next.js | wip | Opus (orchestrator) | Non-empty dir → scaffold in temp, then merge in |
| A4 · TS strict + lint/format | — | | |
| A5 · Design tokens + fonts | — | | |
| B1 · Env config | **blocked** | | Needs **H1** (Supabase project from Tushar) |
| B2–B5 · Supabase CLI + profiles + RLS | blocked | | Needs H1 |
| C1–C2 · Client factories + middleware | — | | Can proceed before H1 (typecheck only) |
| C3 · Google provider | blocked | | Needs **H2** (Google OAuth client) |
| C4–C8 · Auth UI + role helper | blocked | | C4–C7 need H1/H2 to test; C8 needs **H4** (admin email) |
| D1–D4 · Test harnesses + RLS suite | — | | D1/D2 can proceed now |
| E1–E4 · Deploy + live verify | blocked | | Needs **H3** (GitHub + Vercel link) |

### T02 · Design system
| Task | Status | Model | Note |
|---|---|---|---|
| all | — | | Blocked by T01 |

---

## Open human-in-the-loop items

| # | Needed for | What Tushar must do |
|---|---|---|
| **H1** | T01/B1–B5 | Create the Supabase project (region nearest India); provide project URL, anon key, service-role key |
| **H2** | T01/C3 | Create a Google Cloud OAuth client; provide client ID + secret; set redirect URI |
| **H3** | T01/E1–E4 | Create the GitHub repo; link the Vercel project; confirm the production URL |
| **H4** | T01/C8 | Confirm the admin allowlist email(s) |

---

## Decisions taken during the build

- **2026-09-01 · `Sample Reports/` is gitignored.** It holds named individuals' personality assessments plus a handwriting scan — sensitive personal data under Tegaki's own privacy policy. The repo is destined for GitHub, so it stays local. Flagged to Tushar.
- **2026-09-01 · pnpm installed globally** (11.25.0) — corepack was unavailable on this machine's Node 26.7.0.
