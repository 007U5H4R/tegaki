# Tegaki — Session Handoff

> **Read this first in any new session.** Last updated: **2026-09-01** (end of t-design stage).
> Repo: `/Volumes/E Drive/Dev/Code/Claude/Graphology/` — **not a git repo yet** (init before the build stage).
> Obsidian mirror: `~/Documents/Documents - Tushar's Macbook/Obsidian Vault/Tegaki/Tegaki - Project Notes.md` (on conflict, Obsidian wins).

---

## 1. What Tegaki is

**Tegaki** (手書き — Japanese for "handwriting") is Tushar Pathak's pilot direct-to-consumer web app for his graphology practice. Customers sign in with Google, submit handwriting samples through a guided 4-stage wizard, choose a tier, and receive a premium **Personality & Behavioral Insight Assessment** PDF in their dashboard — positioned as an executive-coaching-grade *self-discovery tool*, never mystical or clinical.

It is a **proof-of-concept pet project**: no deadline, no expected audience (10 users in month 1 exceeds expectations), ₹0/month running cost. The question it answers is *"would a stranger trust and pay for this?"* — fulfillment stays manual behind the scenes.

---

## 2. Pipeline position

```
grilling ✅ → PRD ✅ → t-design ✅ → to-tickets ✅ → writing-plans ✅
   → BUILD ▶ Phase 1 in progress · T01 8/19 tasks done · ⏳ BLOCKED ON H1–H4 ⏳
   → /code-review + /security-review + /impeccable → pilot live
```

## ▶ THE PILOT IS DEPLOYED: **https://tegaki-one.vercel.app**

**Build state (2026-09-01):** `main` is the deploy branch (10 commits). Next.js 16.3.3 + React 19.2.8 + Tailwind 4.3.3; full `Design.md` token system; Vitest + Playwright (desktop **and** mobile). **Authentication works end to end** — verified in a browser against the live Supabase project. Suites: typecheck ✓ lint ✓ **26 unit** ✓ **14 e2e against production** ✓ build ✓.

**Infrastructure live:** Supabase `tegaki-pilot` (`rgawqxdfvgbocgatjrlg`, Mumbai), 3 migrations applied · Google Cloud `tegaki-507313`, OAuth configured, app in **Testing** status · GitHub `007U5H4R/tegaki` (private) · Vercel `tegaki` on the free Hobby plan, ₹0/month as the PRD requires.

**T01 is complete but for one confirmation:** signing in on production with **two different Google accounts** to see the isolation with your own eyes. It is confirmation rather than discovery — the guarantee is already proven at the database layer by the 8-test isolation suite, which is stronger evidence than a UI walkthrough. Note the Google app is in **Testing**, so any second account must first be added under *Audience → Test users*.

**Phase 1 is complete.** T02 shipped the design system: every primitive from `Design.md` with `/styleguide` as its regression surface (34 e2e tests). The hanko seal carries a real glyph outline extracted from Noto Serif JP, so the mark never reflows while a font loads. Nav, modal and toast are deliberately deferred to the tickets that first need them.

**Next: Phase 2, starting with T03** (`plans/T03-draft-order-dashboard.md`) — the `orders` table with the status machine enforced in Postgres, then the dashboard listing. No blockers. Remember the project-wide rule: every table migration must grant **both** `authenticated` (narrowly) and `service_role` (fully).

**Before Phase 2 closes, a QA agent should run the phase gate** per `plans/BUILD-ORCHESTRATION.md`: a stranger's account completing sign-in → submitted order on the deployed URL.

**Live progress: `plans/LEDGER.md`.**

**The plan set:** `plans/T01…T15` (one per code ticket), `plans/C1-C4-content-plans.md`, and `plans/BUILD-ORCHESTRATION.md` (workspace/ledger, dispatch model, review + fix loop, QA gates per phase, model assignment, human-in-the-loop list). `plans/T01-walking-skeleton.md` locks the stack decisions every plan inherits (pnpm, `@supabase/ssr`, Supabase CLI migrations, Vitest + Playwright, status machine as a Postgres definer function with column grants, media masters out of git) and the four setup items only Tushar can do (H1–H4: Supabase project, Google OAuth client, GitHub/Vercel link, admin email).

**Hero film (C5): ✅ COMPLETE.** The 15s v3 re-shoot fixed the text defect (page reads exactly the intended sentence; verified frame-by-frame) and the pen stays sharp through the rise. Keeper: `assets/hero/master-v3-15s-KEEPER.mp4` + 2K upscale + sliced frames in `assets/hero/frames/`. Credits: ~89 remaining, reserved for C4 (or Tushar photographs real scan-guide examples for free — ask him).

**Open now:** Tushar's build-start approval (phase 1 begins with T01/H1–H4, which need him at the keyboard).

**Note:** there is no `/to-tickets` skill installed on this machine (checked 2026-09-01). The stage was executed manually per the CLAUDE.md spec. Same is true of `/handoff` — this file is maintained by hand.

---

## 3. Canonical files

| File | What it is | Status |
|---|---|---|
| `Solution-PRD.md` | **The product truth.** Final scope, tiers, wizard, dashboard, admin, status machine, architecture, fulfillment runbook | Approved (implicitly, by ordering t-design) |
| `Discovery-PRD.md` | Audit trail — 3 grilling rounds, research findings, why each decision was made | Historical reference |
| `Design.md` | **The design truth.** OKLCH tokens, typography, components, motion, a11y/QA gates. Downstream stages implement it *verbatim* | v1.0 — **APPROVED 2026-09-01** |
| `tickets.md` | **The build truth.** 15 code tickets + 5 content tickets as a tracer-bullet DAG, with phases, blocking edges, and standing gates. Consumed by the planning stage | v1.0 draft — awaiting granularity sign-off |
| `Hero-Video-Prompts.md` | Seedance 2.5 prompt kit for the hero film: start image → draft pass → 30s master → upscale/slice → build instruction | Ready to run |
| `Graphology Prompt.docx` | **Master Prompt v2.0** — the core report-generation IP (16-section premium report) | Source for the 3 tier variants (build deliverable) |
| `Sample Reports/` | Varun + Nancy full reports, a raw handwriting scan (`HW NS.pdf`) | Proof the manual pipeline works; tier-3 sample candidate |
| `Graphodeck/`, `graphocards/` | 2022 trait-card image decks (57 + 151 files) | **Parked** — no confirmed role |

---

## 4. Decisions locked (do not re-litigate)

### Product & scope
- **Tiers:** Express ₹999 / 3-day / 1–2pg · **Core ₹1,999 / 5-day / 3–5pg ("Most Popular")** · Comprehensive ₹2,999 / 7-day / 6+pg (MBTI + radar chart). Turnaround clock starts at **sample approval**, not payment.
- **Demo checkout** — prices display, no gateway, order marked paid, clearly labeled "Pilot — no real payment taken." Data model stays gateway-ready for post-pilot Cashfree.
- **Manual fulfillment:** Claude analyzes the scan end-to-end per tier (Master Prompt variants) → branded PDF → **Tushar validates (mandatory gate)** → admin upload → he sends from his own Gmail/WhatsApp.
- **No testimonials** until real ones exist. Tushar asked to seed fabricated ones; refusal accepted, sample-report excerpts are the social proof instead.
- Consent checkbox when subject ≠ buyer · 90-day sample auto-delete · 14-day re-upload window · refund only if no valid sample · indicative-claims disclaimer site-wide.

### Stack & hosting
- **Next.js (App Router) + Supabase** (Google auth, Postgres, private storage + signed URLs) on **Vercel Hobby** (free `*.vercel.app`, ToS-clean because no real money moves). ₹0/mo.
- RLS at the data layer; status transitions validated server-side; admin = env-allowlisted email.
- No custom domain (tegaki.in was available 2026-09-01 if that changes), no email infra, no WhatsApp API.

### Design (this session's output)
- **Aesthetic amended by Tushar to the Oryzo direction** (oryzo.ai by Lusion, CSS Design Awards Site of the Month Apr 2026) — warm-**dark** cinematic, superseding the PRD's light "Warm Organic/Humanist". Hanko-seal + 手書き identity, editorial serif, and soft radii carry over onto the dark ground.
- **Palette:** ink `#131209` void · washi cream `#F7EFE2` · vermilion shu `#D9482F` as the *only* saturated hue. **Type:** Instrument Serif / Manrope / Geist Mono + Noto Serif JP (subset).
- **Copy voice stays on the PRD indicative-claims guardrail** — Tushar's explicit choice. The Figma mockup's hype voice ("3 STEPS TO DESTINY", "CRIMINAL PSYCHOLOGY") was **rejected**; only its section *sequence* survived (the "Sample Report Anatomy" section is worth keeping).
- **No GSAP, no Three.js, no smooth-scroll library** — mobile-first Indian audience on mid-range Android. CSS transitions + IntersectionObserver + WAAPI only.

### Hero film (Tushar's concept, this session)
- Oryzo's coaster pattern, done with a fountain pen: side macro of a hand writing cursive → camera arcs to top-down → playful pen twirl → coin-toss toward camera → **floating pen guides the whole scroll**.
- Technique per Tushar's Seedance 2.5 packs: **one continuous take → 2K upscale → 180 frames → canvas scroll-scrub**. The "3D" is entirely the video; no WebGL needed.
- Brand corrections applied to his reference frames: **unlined loose paper** (our own upload guardrails demand it), **fountain pen** not ballpoint, hanko seal added to the out-of-focus props.
- Mobile/reduced-motion/no-JS get a static poster — the scrub is a desktop/tablet enhancement, never a mobile data tax.

---

## 5. Open decisions — asset choices (block specific tickets, not the plan)

1. ~~Sign off `Design.md`~~ — **done 2026-09-01.**
2. **Hanko seal candidate** *(blocks T02)* — `Design.md` §2.4 offers four SVG concepts: **A** square jitsuin (most official) · **B** circle 手 (most minimal) · **C** ink-bleed column (most artisan) · **D** knockout block (best favicon/OG stamp).
3. **Hero film — master shot, one defect to resolve** *(C5 → T14)*. Start image ✅ (keeper: variant A, job `be01148d-e2fe-4228-be28-a704bfdcfb1f`) · draft ✅ passed · **master ✅ rendered** (`assets/hero/master-720p-30s.mp4`). The ending is superb — sharp floating pen on a warm void, exactly the scroll-guiding object. **But the page gains a spurious word: "create it.create."** — the model wrote extra text because the prompt told the hand to keep writing. On a handwriting-analysis site that is a credibility problem. **Options and the root-cause fix are in `Hero-Video-Prompts.md` §Master v2 Verdict; recommended is a ~98-credit 15s re-shoot.** Balance: **187** of the original 411 — a full 30s re-roll (195) is no longer affordable. Scan-guide tiles (C4) ≈ 15–20 credits, not started.
4. **A real photograph of Tushar** for the about section *(blocks T12)* — never a generated face. Ship an honest placeholder frame at pilot if unavailable.

---

## 6. Next stage — per-ticket plans (`writing-plans`)

**Gate first:** answer the four questions at the end of `tickets.md` (granularity, sequencing, T04-first, per-file publication), then the planning stage starts.

**Inputs:** `Solution-PRD.md` + `Design.md` + `tickets.md`. **Output:** one plan per ticket, worked at the DAG frontier (blockers first), each broken into 2–5 minute atomic tasks with exact file paths, interfaces, and a verification gate. Plans implement `Design.md` tokens/components/motion verbatim — no placeholders, no re-deciding design.

**Frontier at kickoff:** T01 (walking skeleton) · C1 (prompt variants) · C4 (scan-guide images) · C5 (hero film).

**Then:** subagent-driven build — git worktree/branch + ledger, one fresh implementer per task, TDD red→green→refactor, two-stage task review, bounded fix loop, and a **QA-tester agent at every phase boundary** (phases are mapped in `tickets.md`).

**Model/effort notes:** planning is structural — Opus 5 or Sonnet 5 at high effort is adequate. Reserve the most capable tier for design-judgment tasks and the final review gate. *(Session currently: Opus 5 (1M context), high effort.)* Subagent model routing is process-wide, set by env vars at session start — you cannot mix vendors within one session; phase across sessions if you want GPT for some stage.

---

## 7. Environment gotchas (discovered the hard way — don't re-burn calls)

- **Mobbin share links 403 on server-side fetch.** `WebFetch` cannot read `mobbin.com/sites/...`. The Mobbin MCP search doesn't index those shared site pages either — searching an app name there returns unrelated results. To view a Mobbin reference, use the browser or ask Tushar to describe/screenshot it.
- **The Claude-in-Chrome extension was not connected** this session (`tabs_context_mcp` → "Browser extension is not connected"). If browser work is needed, Tushar must connect it first.
- **Figma MCP works** — `get_screenshot` with fileKey + nodeId returns a short-lived PNG URL; `curl` it to the scratchpad and Read it.
- **The repo is not under git.** Do `git init` + a first commit before the build stage — the orchestration playbook needs a worktree/branch, and there is currently no undo.
- Tushar's Seedance 2.5 reference packs live at `~/Downloads/Documents/The-Seedance-2.5-{Website-Pack,Prompt-Pack,Prompt-Pack-2}.pdf`.

---

## 8. Non-goals (deferred to post-pilot — say no to these)

Payment gateway · custom domain · branded/lifecycle email · WhatsApp Business API automation · in-app report-production tool · payment-screenshot OCR · client-side blur detection · testimonials · corporate packages · native app · multi-analyst · non-INR pricing.
