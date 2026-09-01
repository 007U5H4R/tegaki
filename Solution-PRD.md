# Solution PRD — Tegaki (手書き)

> **Status:** v1.0 — for Tushar's approval · **Date:** 2026-09-01 · **Owner:** Tushar Pathak
> Distilled from `Discovery-PRD.md` (3 grilling rounds, all decisions settled 2026-09-01 — that file remains the audit trail; this file states only the final truth and is the input to `t-design` and `/to-tickets`).

---

## 1. What & Why

**Tegaki** (手書き — Japanese for "handwriting") is a pilot direct-to-consumer web app for Tushar Pathak's graphology practice. Customers sign in with Google, submit handwriting samples through a guided wizard, choose a tier, and receive a premium **Personality & Behavioral Insight Assessment** PDF in their dashboard — an executive-coaching-grade *self-discovery tool*, never a mystical or clinical reading.

This is a **proof-of-concept pet project**: no launch deadline, no expected audience (10 users in month 1 exceeds expectations), ₹0/month running cost. The pilot answers one question — *would a stranger trust and pay for this experience?* — while fulfillment stays manual behind the scenes.

**Voice & claims guardrail (site-wide, from Master Prompt v2.0):** indicative language ("suggests a tendency toward…"), growth-oriented framing, no absolute/deterministic/diagnostic claims. This is the brand voice and the claims-safety net.

## 2. Goals & success criteria (pilot)

1. Full loop works end-to-end on the deployed site: sign in → wizard → order tracked → offline fulfillment → validated report in dashboard + received by user.
2. **5–10 pilot users** complete the loop; every report delivered within its tier's promised turnaround (clock starts at sample approval).
3. Experience reads trustworthy and premium on a phone (~375px).
4. Zero handwriting samples or reports accessible to anyone except the subject's account and admin.
5. Post-pilot: a written go/no-go note on investing in launch-grade upgrades (§10).

## 3. Non-goals (pilot)

Payment-gateway integration (data model stays gateway-ready) · custom domain · transactional/lifecycle emails · WhatsApp Business API automation · in-app report generation · payment-screenshot OCR · client-side blur/lighting detection · testimonials until real ones exist · corporate packages · native mobile app · multi-analyst support · non-INR pricing.

## 4. Users

- **Buyer** (signed-in via Google): orders for themself or **for another subject** (name + age captured; **consent checkbox required** when subject ≠ buyer).
- **Admin** (Tushar): allowlisted email(s) via environment config; sees all orders, controls the pipeline.

## 5. Service tiers

| | **Express Insight** | **Core Personality** | **Comprehensive Profile** |
|---|---|---|---|
| Price (display) | ₹999 | ₹1,999 — "Most Popular" | ₹2,999 |
| Turnaround (from sample approval) | 3 days | 5 days | 7 days |
| Length | 1–2 pages | 3–5 pages | 6+ pages |
| Contents | Short intro · Executive Summary · 6-trait dashboard · top-3 strengths · one development insight · primary-signature note | Full 10–12-trait dashboard · **archetype title** · five core sections (Foundation / Independence / Discipline / Excellence / Emotional Awareness) · Strengths Profile · Development Opportunities · signature-vs-text comparison | All 16 Master-Prompt sections · MBTI correlation (indicative) · **radar chart** · public-projection signature analysis |

Pilot checkout is **demo mode**: prices are displayed, but the payment step is clearly labeled "Pilot — no real payment taken" and marks the order paid. (Real payments are a post-pilot upgrade; see §10.)

## 6. Product scope

### 6.1 Landing page
- Hero + how-it-works + tier comparison + sample-report excerpts + about-Tushar + FAQ + footer.
- **Brand identity:** red **hanko-style seal** emblem + "Tegaki" wordmark + 手書き brush-calligraphy subtitle; footer story-line *"tegaki · 手書き · Japanese for handwritten."* Aesthetic: **Warm Organic/Humanist** (earthy warm neutrals, soft 12–16px radii, subtle paper texture) with **editorial serif headings**. Japanese glyphs load as a subset (a few KB), never a full CJK font.
- **Social proof = the product itself:** excerpts from **fictional composite sample reports** (one per tier), clearly presented as samples. **No testimonials** until real pilot quotes exist; never fabricated ones.
- Disclaimer line + links to Privacy / Refund / Terms pages (simple static pages) + a contact link (mailto/WhatsApp deep-link to Tushar) — also the escape hatch for `parked` orders.
- **Link-preview set (mandatory):** OG + Twitter Card tags with a purpose-built 1200×630 image at absolute HTTPS URLs on the deployed domain — WhatsApp/Instagram sharing is the acquisition channel, so the unfurl is the storefront.

### 6.2 Auth
Google OAuth only (Supabase Auth). Account required before the wizard (the dashboard is a core trust feature). Admin = allowlisted email(s).

### 6.3 Submission wizard (4 stages, resumable)
1. **Profile & subject** — name, age, gender (used only for report pronouns/language), city, country, email, phone (+WhatsApp preference toggle); "who is this analysis for?" (self / someone else → subject name + age + **consent checkbox**). Wizard progress persists as a draft order — the user can leave and resume.
2. **Sample guidelines & upload** — interactive guardrails checklist (unlined paper · 2+ pages · 3 original signatures at the bottom · spontaneous original text, no poems/copied content); **ideal-vs-rejected scan gallery** (good lighting vs blur, unlined vs lined, full vs truncated signatures); multi-file upload, JPG/PNG/PDF, to private storage.
3. **Tier selection** — three cards, Core anchored "Most Popular"; links to the sample excerpts.
4. **Demo checkout** — order summary + price, pilot-mode notice, confirm → order created as paid (demo).

### 6.4 Customer dashboard
- All orders as cards: subject, tier, submitted date, status chip, expected-delivery date (approval + tier days).
- Completed orders: **report PDF download** (signed URL).
- `Needs Re-upload` orders: inline re-upload action with the rejection reason.
- "New Request" action always available.
- **Every data view implements all four screen states — loading, empty (first-run trust moment), error with retry, working.**

### 6.5 Admin panel
Order queue (newest first, filter by status) · sample viewer/download · **approve sample** (starts turnaround clock) / **reject with reason** (→ `Needs Re-upload`) · status controls · **upload report PDF** · **mark delivered** (after Tushar sends it manually) · **pause-new-orders switch** (wizard shows a "temporarily closed" notice).

### 6.6 Order status machine

| State | Entered by | Customer sees |
|---|---|---|
| `sample_under_review` | Wizard completion (demo-paid) | "Sample under review" |
| `needs_reupload` | Admin reject (with reason) | Reason + re-upload control |
| `analysis_in_progress` | Admin approve → clock starts | Expected delivery date |
| `report_generating` | Admin (analysis done, report in production) | Progress state |
| `completed` | Admin uploads validated PDF | Download + "sent to your email/WhatsApp" |
| `parked` | Auto: >14 days in `needs_reupload` | "Order parked — contact us" |

Re-upload returns the order to `sample_under_review`. No other transitions exist.

## 7. Fulfillment runbook (offline — not part of the app)

1. New-order signal: admin panel queue. The pilot ships **no automated admin alert** (conscious revision of the earlier "email alerts" decision — customer email infra was cut, and pilot users are known contacts). Optional zero-cost nice-to-have ticket: Resend can email Tushar's *own* address without a verified domain.
2. Tushar reviews the sample against the guardrails → approve/reject in admin.
3. **Analysis & report: Claude Code session** — Claude analyzes the handwriting scan end-to-end using the **tier-matched Master Prompt variant** (§8 content deliverables), exactly like the 2026-08-31 Varun run.
4. **Tushar validates the report — mandatory gate.** Edits/regenerates until satisfied. Nothing unvalidated ever reaches a customer.
5. Tushar uploads the PDF in admin (→ `completed`), then personally sends it from his own Gmail/WhatsApp per the buyer's delivery preference, and marks delivered.

## 8. Content deliverables (in build scope — not code)

1. **Three Master Prompt tier variants** (`prompts/express.md`, `prompts/core.md`, `prompts/comprehensive.md`) derived from Master Prompt v2.0, enforcing the §5 content splits.
2. **Branded PDF report template** (typography/layout matching the site identity; trait-dashboard table; radar chart for Comprehensive).
3. **Three fictional composite sample reports** (one per tier) + landing-page excerpts.
4. **Scan-guide gallery images** (ideal vs rejected examples).
5. **OG image** (1200×630, code-rendered wordmark — not diffusion-generated text).
6. Copy: guardrails checklist, disclaimer, Privacy/Refund/Terms, FAQ.

## 9. Architecture

- **Stack:** Next.js (App Router) + Supabase (Google auth, Postgres, **private** storage buckets for samples/reports with signed URLs) + Vercel **Hobby** (free `*.vercel.app` subdomain; ToS-clean because the pilot transacts no real money).
- **Entities:** `profiles` (auth mirror + role) · `orders` (buyer, subject fields, tier, status, timestamps, delivery prefs) · `order_files` (sample uploads, versioned for re-uploads) · `reports` (PDF ref, validated-at) · `payments` (demo record now; provider/reference/status fields **gateway-ready** for post-pilot Cashfree) · `settings` (pause switch).
- **Enforcement at the data layer:** RLS — buyers read/write only their own orders; only admin mutates statuses; storage buckets private by default. Status transitions validated server-side against §6.6.
- **Retention:** samples auto-deleted 90 days after delivery (scheduled job); reports persist in the dashboard; delete-my-data honored on request.
- **Responsive gates (mandatory):** no horizontal scroll, usable nav, readable content at ~375px and ~768px; desktop unchanged.

## 10. Post-pilot upgrade path (documented, not built)

Real payments via Cashfree (individuals onboard with PAN + Aadhaar + bank + Udyam/video-KYC; 0% UPI MDR promo through Mar 2027) → custom domain (**tegaki.in was available on 2026-09-01**) → branded + lifecycle email (Resend needs the domain) → WhatsApp utility messages (~₹0.115/msg) → in-app report-production tool → real testimonials from pilot users.

## 11. Risks

- **Single-operator turnaround** — mitigated by the pause switch + clock-starts-at-approval.
- **Claims/positioning** — mitigated by the §1 guardrail + disclaimers on site, checkout, and every report footer.
- **Sensitive data (handwriting)** — mitigated by private buckets, RLS, signed URLs, 90-day deletion.
- **Demo checkout mistaken for a real purchase** — mitigated by explicit pilot labeling at the checkout step and on receipts/status copy.

## 12. Process

Approved `Solution-PRD.md` → **t-design** (`Design.md`: Mobbin research, hanko/wordmark candidates, OKLCH tokens, components, motion) → **`/to-tickets`** (`tickets.md` DAG of tracer-bullet slices) → per-ticket plans → subagent-driven build (git worktree, TDD, QA gates) → `/code-review` + `/security-review` + `/impeccable` → pilot live.
