# Plan — T12 · Landing part 2: report anatomy, excerpts, about, FAQ, final CTA

> **Ticket:** T12 · **Phase 4** · **Blocked by:** T11, **C3** (excerpt content).
> **Delivers:** the persuasion half of the landing: specimen anatomy, per-tier excerpts, about-Tushar, FAQ with schema, final CTA band.

## Tasks

**A1 · Report anatomy section** — three specimen rows per `Design.md` §3.2-4 (slant · t-bar · lower loops): washi-cream crop card (paper is the figure) + Geist Mono trait label + one indicative sentence each, e.g. "A pronounced rightward slant *suggests* expressive engagement with others." Crops come from C3's fictional samples (or `Sample Reports/HW NS.pdf` crops anonymised beyond recognition — decision: **use C3 fictional material only**; real client scans never appear on the landing page, anonymised or not).
*Gate:* every sentence passes the claims grep; crops carry descriptive alt text.

**A2 · Excerpt tabs** — one washi excerpt card per tier (content from C3), tabbed (T02 pattern, clip-path active indicator), each labelled **"Illustrative sample — fictional subject"** visibly on the card, not in a footnote.
*Gate:* label visible at 375px; tab keyboard semantics (`role=tablist`, arrows).

**A3 · About Tushar** — analysis-desk still (C5-family prompt or supplied photo) as backdrop, short bio in the guardrail voice, real photograph **or** the honest placeholder frame ("Photo — Tushar Pathak") — never a generated face; credential chips only for claims Tushar confirms in writing.
*Gate:* no unverifiable claims ("10,000 samples", "Fortune 500") unless Tushar supplies them; placeholder acceptable.

**A4 · FAQ** — 8–10 accordions (T02 `grid-template-rows` pattern): is this scientific? (indicative framing) · what should I write? · unlined paper? · how do photos work? · who sees my handwriting? (privacy + 90-day deletion) · turnaround · re-upload window · refund policy · for someone else? (consent) · is this a medical/psychological diagnosis? (no — explicit). Plain-language answers, each ≤4 sentences. Add **FAQPage JSON-LD** with the same Q/A strings (single source: `src/content/faq.ts`).
*Gate:* Google Rich Results test validates; `aria-expanded` correct; answers pass the claims grep.

**A5 · Final CTA band** — large seal (SVG line-draw once on reveal, 900ms `--ease-in-out` then fill fade), H2 **"Ready when your pen is."**, primary CTA (identical action to hero).
*Gate:* line-draw runs once; reduced-motion shows the filled seal.

**B1 · Claims-guard script** — `scripts/check-claims.mjs`: greps `src/content` + marketing routes for banned absolutes (`reveals`, `proves`, `will make`, `destiny`, `diagnos`, `guarantee`, `scientifically proven`) and for `testimonial`; wired into `pnpm test`.
*Gate:* seeding a banned word fails the suite.

**B2 · E2E + a11y** — axe on the full landing; keyboard: tabs + accordions; schema snapshot test.
*Gate:* clean.

## Definition of done
- [ ] All sections live with C3 content; fictional labelling unmissable; zero testimonials.
- [ ] FAQPage schema validates; claims-guard wired into CI and biting.
- [ ] About section honest (real photo or labelled placeholder; confirmed credentials only).
- [ ] Standing gates verified.
