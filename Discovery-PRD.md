# Discovery PRD — Tegaki (Graphology Service Platform)

> **Status:** v1.0-RC — grilling complete (3 rounds, 2026-09-01); frontier empty; **awaiting Tushar's sign-off**
> **Date:** 2026-09-01 · **Owner:** Tushar Pathak · **Scribe:** Claude
> This is a *discovery* document: it records what is settled, what was found in the workspace, and what is still an open decision. It becomes the approved PRD only after the open questions are answered and Tushar signs off. **No build starts from this draft.**

---

## 1. Vision

**Tegaki** (手書き — Japanese for "handwriting") — a direct-to-consumer web platform for Tushar Pathak's handwriting-analysis practice: customers upload handwriting samples, pay via UPI, and receive a premium **Personality & Behavioral Insight Assessment** — positioned as an executive-coaching-grade *self-discovery tool*, not a mystical reading. The platform productizes what is today a fully manual practice (analysis → Master Prompt v2.0 → polished report docx/PDF).

**Positioning guardrail (from the existing Master Prompt, carried forward):** insights are indicative, growth-oriented, never deterministic or clinical. Marketing copy and report language must keep this framing — it is both the brand voice and the claims-safety net.

**Scale reframe (Round 2, 2026-09-01):** Tegaki v1 is a **pilot / proof-of-concept pet project**, not a commercial launch — no audience expected (10 users in month 1 would exceed expectations), no launch deadline, near-zero running cost. The product surface (landing, wizard, portal, admin) is still built properly; the *operational* machinery (payment gateway, custom domain, email infra, in-app report production) is deliberately deferred until the concept proves out.

## 2. What exists today (discovered in workspace)

| Asset | What it is | Relevance |
|---|---|---|
| `Graphology Prompt.docx` | **Master Prompt v2.0** — transforms a raw handwriting analysis into the 16-section premium report (structure, tone, trait dashboard, MBTI section) | The core report-generation IP; maps to Tier 3 output |
| `Sample Reports/Varun - Personality Assessment Report.md/.docx` | Full premium report generated 2026-08-31 (md → docx via python) — proof the AI-assisted pipeline already works manually | Tier 3 sample candidate (needs anonymization) |
| `Sample Reports/Nancy Saxena - …docx`, `graphology Assessment.docx`, `HW NS.pdf` | Earlier report + **"Behavioral Blueprint Assessment — by Tushar Pathak"** branded template + a raw handwriting scan | Existing brand name candidate; shows input format (scanned handwriting PDF) |
| `Graphodeck/` (57 images, 2022) | Trait-named graphology cards (aggressive, ambivert, t-bars, slants…) | Possible knowledge base / marketing content — role unconfirmed |
| `graphocards/` (151 numbered images + an Instagram-format video) | Social-media-style content cards | Suggests an Instagram funnel exists/existed — unconfirmed |
| No code, no git repo, no Obsidian project folder yet | — | Greenfield build |

**Current manual workflow (inferred, to confirm):** client hands over handwriting sample → Tushar performs graphological analysis → Master Prompt turns it into premium prose (Claude) → converted to branded docx/PDF → delivered personally.

## 3. Target users

- **Primary:** Indian consumers seeking personal insight / self-discovery, paying ₹999–₹2,999 via UPI; discovered via social content (likely Instagram) and word of mouth.
- **Secondary:** buyers ordering an analysis for someone else (partner, child, hire?) — supported via "multiple profiles" in the wizard; raises a consent question (open, Q10).
- **Out of scope for v1 (proposed):** corporate/HR assessment packages, non-India payments.

## 4. Decisions treated as settled (from Tushar's blueprint)

1. **Three tiers:** Express Insight ₹999 / 3-day / 1–2 pages · Core Personality ₹1,999 / 5-day / 3–5 pages (anchored as "Most Popular") · Comprehensive Profile ₹2,999 / 7-day / 6+ pages with MBTI mapping + spider (radar) chart. Signature analysis depth scales by tier.
2. **4-stage submission wizard:** (1) profile & delivery preferences (incl. subject ≠ account holder) → (2) sample guardrails + upload (checklist: unlined paper, 2+ pages, 3 signatures, spontaneous text; ideal-vs-rejected scan gallery; JPG/PNG/PDF multi-upload) → (3) tier selection with sample previews → (4) UPI payment.
3. **Auth:** Google OAuth; account required (dashboard is a core trust feature).
4. **User portal:** multi-request dashboard with status pipeline and per-order delivery preferences (dashboard / +email / +WhatsApp).
5. **Payment direction — superseded twice:** Round 1 chose a hosted gateway (Cashfree) from day 1; **Round 2's pilot reframe reversed that** — no KYC/gateway for the POC. Pilot payment mode is Round 3's Q18: demo checkout (recommended) or the original manual UPI-QR + screenshot flow.
6. **Tone/claims:** self-discovery framing, indicative language, no clinical/deterministic claims.

## 5. Discovery findings — gaps, risks, challenges

1. **The operator half is unspecified (biggest gap).** The blueprint specs the customer side only. Turnaround promises live or die in: order notifications to Tushar, payment verification, sample QC, analysis workflow, report generation, delivery triggering. Needs an admin surface (Q2).
2. **Status machine is incomplete.** `Payment Under Verification → Analysis in Progress → Report Generating → Completed` has no failure paths: payment not found, **sample rejected → re-upload loop**, refund. Also: when does the turnaround clock start — payment or sample approval? (Q7; recommendation: approval.)
3. **Per-tier report content doesn't exist yet.** Only the full 16-section (Tier-3-grade) format exists. Tier 1/2 templates, per-tier anonymized samples for the preview modal, and the radar-chart rendering are new content/design workstreams (depends on Q3).
4. **Manual UPI trade-offs — gateway research now in (2026-09-01).** Manual UPI is zero-fee and works day-1, but: fake-screenshot fraud risk, manual verification latency (the first status exists *because* of this choice), and business volume on a personal VPA can draw bank/tax scrutiny. **Research findings:** Razorpay and Cashfree both onboard unregistered individuals (personal PAN + Aadhaar + bank account; one business proof such as a free Udyam registration, or a video-KYC fallback; ~1–2 days; onboarding open since Dec 2023). Fees: Razorpay ~2% (with 0% up to ₹5L GMV/90 days for merchants activating after 1-Jul-2026 — a new signup now qualifies); Cashfree 1.95% standard with **0% MDR on UPI + domestic cards up to ₹20L/month through Mar 2027**. Settlement T+1/T+2. Stripe India is invite-only (not usable); Instamojo is the light-paperwork fallback. → **Claude's Q4 recommendation updated: gateway (Cashfree first) from day 1**, which deletes the screenshot upload, the UTR field, the verification queue, and two failure states; manual UPI only as a fallback if KYC stalls (Q4). *Pilot reframe (Round 2): gateway deferred entirely — see §6 Round 2 outcomes and Q18.*
5. **WhatsApp "delivery router" implies automation — research confirms manual is fine.** One-at-a-time sends to opted-in customers via the free WhatsApp Business app are ToS-compliant and ₹0. Programmatic delivery (Meta Cloud API / BSPs like AiSensy or Gupshup) costs ~₹0.115 per utility message post-Jul-2025 pricing (sources vary slightly) plus template approval and possible BSP platform fees (₹0–3,200/mo). Recommendation unchanged: manual for v1 with an admin "mark as sent" action; automate only when volume justifies it (Q1).
6. **Solo-capacity vs. turnaround promises.** 3/5/7-day promises across concurrent orders with one analyst and (presumably) a day job need a queue cap or dynamic "current turnaround" display (Q5).
7. **Hosting/legal facts (verified):** Vercel's free Hobby plan explicitly bars commercial use (Fair Use Guidelines + pricing FAQ); Pro is US$20/mo/seat. Cloudflare Pages/Workers free tier permits commercial use (secondary sources; primary ToS fetch failed). Policy pages needed: refund, privacy (handwriting images are sensitive personal data — retention policy needed), terms, disclaimer (Q9/Q10).
8. **Brand settled in Round 1: "Tegaki"** (Tushar's choice). Domain check (registry RDAP/whois, 2026-09-01): **tegaki.in and tegaki.co.in available**; tegaki.co available; tegaki.io probably available (verify at checkout); tegaki.com / .studio / .app taken. tegaki.org was an old open-source Japanese handwriting-recognition project — unrelated space, low conflict risk. Japanese brand layer requested by Tushar: 手書き subtitle + Japanese-lettered logo conveying "legal, loyal, trustworthy" — execution open (Q12).
9. **Mandatory web-deliverable gates (global standard):** mobile-first responsiveness (~375px/768px verified), OG/Twitter link-preview set with purpose-built 1200×630 image, and all four screen states (loading/empty/error/working) on every data view — the dashboard's empty state is a first-run trust moment.

## 6. Grilling log

### Round 1 — outcomes (2026-09-01)

Tushar: *"I will go with your recommendation"* — read as accepting **all** Round-1 recommendations (blanket reading to be confirmed — Q11), with these specifics from him:

- **Brand = "Tegaki"** (手書き, Japanese for handwriting) — overrides the "Behavioral Blueprint" suggestion. Japanese brand layer requested: 手書き subtitle + Japanese-lettered logo that reads "legal, loyal, trustworthy" (execution open — Q12).
- **Acquisition channel = WhatsApp and/or Instagram; volume unknown** → hedge: admin "pause new orders" switch + honest "current turnaround" banner.
- Settled per recommendation: v1 cut list (no payment OCR, no WhatsApp automation, no blur detection, no per-tier preview modals) · minimal in-app admin panel + new-order email alerts · report-production pipeline in scope as build Phase 2 · **payment gateway from day 1 (Cashfree first)** · failure-path policy (14-day re-upload window; refund only if no valid sample; turnaround clock starts at sample approval) · aesthetic base = Warm Organic/Humanist + editorial serif · stack = Next.js + Supabase + Vercel Pro + Resend (~US$25/mo + domain) · consent checkbox, 90-day sample auto-delete, site-wide indicative-insights disclaimer + policy pages.

### Round 2 — open frontier (asked in chat, 2026-09-01)

| # | Question | Claude's recommendation |
|---|---|---|
| Q11 | Confirm the blanket reading of "go with your recommendation" (all of Q1–Q10, not just Q4) | Assumed yes — one word confirms |
| Q12 | Japanese identity execution: literal anime lettering vs. shodō brush-calligraphy / hanko-seal identity | Brush-calligraphy 手書き + red hanko-style seal mark; anime display type as accent only, if at all |
| Q13 | Per-tier report content split + how per-tier sample previews get produced | Section maps proposed in chat; fictional sample subject (no consent issues) |
| Q14 | Remaining launch facts: audience size per channel, hours/week, target launch date, Cashfree KYC readiness (Udyam?), testimonials | Facts needed from Tushar |
| Q15 | Which domain(s) to buy | **tegaki.in** (available) + optionally tegaki.co.in defensively |
| Q16 | Customer status-change emails (received / approved / needs re-upload / ready) | Yes — Resend, from orders@tegaki.in |
| Q17 | Landing-page reuse of Instagram presence / graphocards decks | Link IG only if active; defer content reuse to post-launch |

*Still deferred:* radar-chart spec and tier-effort/margin check (depend on Q13); notification copy (depends on Q16).

### Round 2 — outcomes (2026-09-01): the pilot reframe

Tushar's answers reframed v1 as a proof-of-concept pet project:

- **Q14:** No audience expected — 10 users in month 1 exceeds expectations (a). Report production stays **manual in Claude Code, exactly like the Varun run** — the in-app Phase-2 production tool is cut (b). No launch deadline — pet project (c). **No Cashfree KYC / no gateway** for the pilot (d). No testimonials exist; Tushar asked to seed some → honesty flag raised, alternatives proposed (e → Q19).
- **Q15:** **No domain purchase.** Deploy to a Vercel or Railway subdomain (choice coupled to payment mode — Q18). Consequence: no custom sender address, and Resend can't email arbitrary recipients without a verified domain — see Q16 outcome.
- **Q16:** **No lifecycle emails.** Single delivery moment: report generated → Tushar validates → go-ahead → uploaded to dashboard + sent via email/WhatsApp. Assumed manual sending from Tushar's own Gmail/WhatsApp (zero infra) — confirmation folded into Q18.
- **Q17:** No existing content or active social presence — landing assets get created fresh in t-design; the card decks stay parked.
- **Q11/Q12/Q13** went unanswered → Q12 (Japanese identity) and Q13 (tier split + samples) re-asked in Round 3; Q11 folded into Round 3's consolidated confirm-at-sign-off.

### Round 3 — open frontier (asked in chat, 2026-09-01)

| # | Question | Claude's recommendation |
|---|---|---|
| Q12 | (re-ask) Japanese identity: anime lettering vs. shodō/hanko seal | Hanko seal + brush 手書き (option a) |
| Q13 | (re-ask) Tier content split + how sample previews get made | Approve split as proposed; fictional sample subjects |
| Q18 | Pilot payment mode + hosting (coupled) + delivery mechanics | **Demo checkout + Vercel Hobby (₹0)**; manual UPI-QR + Railway (~US$5/mo) only if the pilot should test real willingness-to-pay; Tushar sends the final PDF from his own Gmail/WhatsApp |
| Q19 | Testimonials for the pilot | **None at launch** — a sample-report excerpt is the social proof; collect real quotes from pilot users; any layout quotes must be labeled "illustrative" |
| Q20 | Fulfillment loop mechanics: does Tushar supply the raw graphological analysis, or does Claude analyze the scan with Tushar reviewing? | Document whichever the Varun run used as the pilot runbook; Tushar's validation gates delivery either way |

### Round 3 — outcomes (2026-09-01)

Tushar: *"I will go with your recommendation"* — all five accepted:

- **Q12 = (a)** shodō/hanko identity: "Tegaki" wordmark + red hanko-style seal emblem + 手書き brush-calligraphy subtitle + footer line *"tegaki · 手書き · Japanese for handwritten"*; t-design produces 3–4 candidates to pick from.
- **Q13** tier content split approved as proposed; site sample previews use **fictional composite subjects**.
- **Q18 = (a)** demo checkout (pilot mode marks orders paid) + **Vercel Hobby at ₹0/mo**; delivery = PDF to dashboard after Tushar's go-ahead, sent manually from his own Gmail/WhatsApp.
- **Q19 = (a)+(c)** no testimonials at launch; collect real quotes from pilot users. (Seeding fabricated testimonials declined on honesty/legal grounds.)
- **Q20 = (ii)** *(accepted via recommendation — flagged as an assumption to correct if wrong)*: Claude analyzes the handwriting scan end-to-end per tier; **Tushar's validation is a mandatory gate** before anything reaches a customer.

**Frontier empty — grilling complete. Awaiting sign-off.**

## 7. Draft success criteria — pilot edition (to confirm at sign-off)

- The full loop works end-to-end on the deployed site: sign in → wizard (profile → guarded sample upload → tier → payment step per Q18) → order tracked in dashboard → Tushar fulfills via the manual Claude runbook → validated report appears in the dashboard and reaches the user.
- **5–10 pilot users** complete the loop; each report delivered within its tier's promised turnaround.
- The experience reads trustworthy and premium on a phone (~375px) — the pilot's real question is *"would a stranger pay for this?"*
- Zero handwriting samples or reports accessible to anyone but the subject's account and admin; pilot data gets the same consent + deletion treatment as production would.
- A written go/no-go note after the pilot: what converted, what confused, and whether to invest in launch-grade upgrades (gateway, domain, automation).

## 8. Out-of-scope for the pilot (launch-grade upgrades, deferred)

Payment-gateway integration (data model stays gateway-ready) · custom domain, branded email + lifecycle emails · WhatsApp Business API automation · in-app report-production tool (production stays in Claude Code) · payment-screenshot OCR · client-side blur/lighting detection · testimonials until real ones exist · corporate packages · native mobile app · multi-analyst support · non-INR payments.

## 9. Process from here (per Tushar's global workflow)

Grilling rounds → **final PRD + explicit sign-off** → `t-design` (Design.md; Q8 feeds it) → `/to-tickets` (tickets.md DAG) → per-ticket plans → subagent-driven build (worktree, TDD, QA gates) → `/code-review` + `/security-review` + `/impeccable` → launch.
Background research complete (2026-09-01): gateway-for-individuals ✓, WhatsApp pricing ✓, hosting terms ✓ — findings folded into §5 with sources available on request.

## 10. Final pilot scope — one page

**Build:** Tegaki (手書き) — pilot D2C graphology web app. Next.js + Supabase (Google auth, Postgres, private storage with signed URLs) on **Vercel Hobby** (free `*.vercel.app` subdomain), ₹0/mo running cost.

**Pages/flows:**
1. **Landing** — Warm Organic/Humanist + editorial serif; hanko/shodō brand identity; tier table (₹999 / ₹1,999 "Most Popular" / ₹2,999 · 3/5/7-day turnaround); fictional sample-report excerpts as social proof; disclaimer + privacy/refund/terms pages; OG link-preview set with purpose-built 1200×630 image (WhatsApp/Instagram sharing is the channel); mobile-first (~375px/768px verified); all four screen states (loading/empty/error/working) on every data view.
2. **4-stage wizard** (Google sign-in required): profile & subject (self-or-other + consent checkbox) → sample guardrails checklist + ideal-vs-rejected gallery + multi-file upload (JPG/PNG/PDF) → tier selection → **demo checkout** (pilot mode; clearly labeled).
3. **Customer dashboard** — orders with statuses `Sample Under Review → Analysis in Progress → Report Generating → Completed`, plus `Needs Re-upload`; report PDF download on completion; new-request action.
4. **Admin (Tushar, email-allowlisted)** — order queue, sample download, approve/reject sample (reject → re-upload state), status controls, report-PDF upload, mark-delivered, pause-new-orders switch.

**Fulfillment (offline runbook, not in-app):** scan → Claude analyzes per tier (Master Prompt variants for Express/Core/Comprehensive per §6 Q13; radar chart + MBTI at Tier 3 only) → branded PDF → **Tushar validates (mandatory gate)** → uploads via admin → sends from his own Gmail/WhatsApp. Turnaround clock starts at sample approval. Samples auto-delete 90 days post-delivery.

**Explicitly deferred:** everything in §8.

**Next stages:** t-design (`Design.md`; inputs: this PRD + Q12 identity + Q8 aesthetic) → `/to-tickets` (`tickets.md`) → per-ticket plans → subagent-driven build → `/code-review` + `/security-review` + `/impeccable` → pilot goes live.
