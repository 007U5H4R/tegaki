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
| B1 · Env config | **done** | Opus | `ff69cf3`. `.env.example` documents all 6 vars incl. why the service-role key is confined to cron + tests |
| B2–B5 · Supabase CLI + profiles + RLS | **blocked** | | Needs **H1** |
| C1–C2 · Client factories + proxy | **blocked** | | Needs H1 for real values. ⚠️ C2 is `proxy.ts` in Next 16, not `middleware.ts` |
| C3 · Google provider | **blocked** | | Needs **H2** |
| C4–C7 · Auth UI + protected route | **blocked** | | Needs H1/H2 |
| C8 · Admin role helper | **done** | Opus | `resolveRole()` + 6 unit tests; fails closed on missing email / empty allowlist / blank slot from a trailing comma. Real value needs **H4** |
| D1 · Vitest | **done** | Opus | `.mts` config; alias via `fileURLToPath` (repo path contains a space) |
| D2 · Playwright | **done** | Opus | Desktop (Chromium) + mobile (WebKit/iPhone 13) projects |
| D3 · Auth redirect E2E | **blocked** | | Needs the dashboard (C7) |
| D4 · Two-account RLS suite | **blocked** | | Needs **H1** |
| — · Responsive gate E2E *(added)* | **done** | Opus | Not in the original plan: the 375px no-horizontal-scroll gate, wired now so every later route inherits it. **Proved it bites** by injecting a 900px child, watching it fail, then reverting |
| E1–E4 · Deploy + live verify | **blocked** | | Needs **H3** |

**Suites green at this point:** `typecheck` ✓ · `lint` ✓ · `test` 6/6 ✓ · `test:e2e` 6/6 ✓ (desktop + mobile) · `build` ✓

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

- **`Sample Reports/` is gitignored.** It holds named individuals' personality assessments plus a handwriting scan — sensitive personal data under Tegaki's own privacy policy. The repo is destined for GitHub, so it stays local. **Flagged to Tushar.**
- **pnpm installed globally** (11.25.0) — corepack was unavailable on this machine's Node 26.7.0.

## Spec corrections made while implementing (all folded back into the source documents)

1. **`middleware.ts` → `proxy.ts`.** Next.js 16 deprecated and renamed the file convention (its bundled docs say so explicitly, and ship a codemod). The T01 plan's C2 task has been corrected. The same docs note proxy is for *optimistic* checks only and is not an authorization boundary — which is why real authorization stays in server components and actions.
2. **Motion tokens moved into `@theme`.** Tailwind ships `--ease-out` as `cubic-bezier(0, 0, .2, 1)` — precisely the weak curve `Design.md` §4.1 rules out. Defining ours inside the theme makes the `ease-out` *utility* resolve to the strong curve, so there is one motion system rather than two that silently disagree. Durations named `--duration-*` so Tailwind emits matching utilities.
3. **The Japanese face is self-hosted and subset.** `next/font/google` emitted **276 woff2 chunks totalling 8 MB** for three glyphs — a direct violation of `Design.md` §2.2 ("a few KB, never a full CJK font"). Subset the upstream face to 手書き with fontTools: **1,352 bytes**, and the site's entire font payload dropped to 15 files / 192 KB. Regenerate with `python3 -m fontTools.subset noto-full.woff2 --text="手書き" --flavor=woff2` if the JP copy ever changes.
4. **`Design.md` hex fallbacks corrected.** They were eyeballed approximations that disagreed with their own authoritative OKLCH values — `--ink-950` was written `#131209` but resolves to `#0d0b06`. Replaced with true computed conversions; `theme-color` now tracks the real value. Contrast is unaffected in the safe direction (the ground got darker, so ratios rose).
