# Plan — T11 · Landing part 1: shell, static hero, how-it-works, tagline, tiers

> **Ticket:** T11 · **Phase 4 · Marketing** · **Blocked by:** T02.
> **Delivers:** the public landing route with the static-poster hero, the first three argument sections, and tier cards routing into the wizard. T14 swaps the hero for the scrub; everything else here is final.

## Copy locked here (PRD guardrail voice — no re-writing in the build)

- Micro-label: `HANDWRITING ANALYSIS · 手書き`
- H1: **"Your handwriting holds a story."**
- Sub: "A personal, growth-oriented assessment of what your writing suggests about how you think and work — analyzed by hand, delivered as a considered report."
- CTAs: **"Begin your assessment"** (primary) · "See a sample report" (ghost, → excerpts section anchor)
- Proof line: `Pilot programme · reports hand-validated by Tushar Pathak`
- Steps: **Write & photograph** ("Two pages, unlined paper, three signatures — our guide walks you through it.") · **Choose your depth** ("Express, Core or Comprehensive — ₹999 to ₹2,999.") · **Receive your report** ("A considered PDF in your dashboard within 3–7 days of sample approval.")
- Tagline (reveal moment): **"Written by hand. / Read with care."**
- Tier disclaimer: "Insights are indicative and growth-oriented — never diagnostic."

## Tasks

**A1 · Marketing layout** — `src/app/(marketing)/layout.tsx`: public nav variant (T02) + footer; `src/app/(marketing)/page.tsx` scaffold with section anchors (`#how`, `#pricing`, `#samples`, `#faq`).
*Gate:* nav links scroll to anchors; signed-in users see "Dashboard" in the nav.

**A2 · Hero (static)** — full-bleed `next/image` poster (`public/hero-poster.jpg` from C5; until it lands, a graded crop of `start-A`), gradient scrim, copy **lower-left** (never centred over the pen), 680px caps, meaningful line breaks, both CTAs ≥44px. `priority` + responsive `sizes`.
*Gate:* copy contrast over the image ≥7:1 at 375/768/1440 (scrim tuned per breakpoint); LCP is the poster.

**A3 · Entrance choreography** — micro-label → H1 → sub → CTAs fade-rise stagger 60ms, 600ms `--ease-out`, once; complete page without JS; nav/CTA interactive immediately.
*Gate:* Playwright no-JS context renders all copy; reduced-motion shows final state.

**B1 · How-it-works** — three steps, serif numerals in shu, dashed connector rail (the shared "process rail" language), turnaround note under step 3: "The clock starts when your sample is approved."
*Gate:* rail collapses to vertical at 375px; matches `Design.md` §3.2-2.

**B2 · Tagline reveal** — `tagline-reveal.tsx`: two lines, `text-5xl` serif, per-word IntersectionObserver activation 30%→100% washi in reading order, 400ms `--ease-out` each; **never** an unthrottled scroll listener; reduced-motion renders full-colour immediately.
*Gate:* words activate one at a time on scroll; scrolling back up does not re-trigger (once).

**B3 · Tier section** — desktop: three columns split by 1px hairlines (Square pattern), no boxes; mobile: stacked T02 cards, **Core first**; per tier: serif name, serif `text-5xl` price, Geist Mono turnaround line, 4–6 bullets, CTA (Core filled, others ghost), OpenTable-style MOST POPULAR chip + shu-900 wash on Core; data 100% from `tiers.ts`; disclaimer line beneath; CTAs → `/wizard` entry (auth redirect handles anonymous).
*Gate:* prices/days match PRD §5 exactly (snapshot test against `tiers.ts`); stacked order verified at 375px.

**B4 · Scroll reveals** — sections enter `translate-y-16 + blur(6px) + opacity-0 → 0`, 800ms `--ease-out`, IO `{once:true, rootMargin:'-80px'}`, children stagger 50ms; dashed rules "write in" via clip-path.
*Gate:* reduced-motion pass; no layout shift from reveals (transform/opacity only).

**C1 · Performance gate** — fonts preloaded + `font-display: swap` with size-adjusted fallbacks; below-fold sections `content-visibility` or lazy; Lighthouse **mobile ≥ 85** on the deployed preview.
*Gate:* Lighthouse run recorded in the ledger with the score.

**C2 · E2E + a11y** — axe pass on the page; keyboard walk (skip link → nav → CTAs → tiers); screenshots at 375/768/1440 attached to the ledger.
*Gate:* zero axe critical violations.

## Definition of done
- [ ] Landing renders complete without JS; hero copy never covers the pen subject.
- [ ] Tagline reveal + scroll reveals per spec, reduced-motion safe.
- [ ] Tier data single-sourced; Core anchored; CTAs enter the wizard flow.
- [ ] Lighthouse mobile ≥85 recorded; axe clean; 375/768 verified.
