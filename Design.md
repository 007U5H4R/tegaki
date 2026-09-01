# Design Specification (`Design.md`) — Tegaki (手書き)

> **Status:** v1.0 — for Tushar's sign-off · **Date:** 2026-09-01 · **Stage:** t-design (input: approved `Solution-PRD.md`)
> **Aesthetic amendment (user-directed, 2026-09-01):** supersedes the PRD §6.1 light "Warm Organic/Humanist" base. Tushar selected the **Oryzo direction** (oryzo.ai, Lusion — CSS Design Awards Site of the Month, Apr 2026): warm-**dark** cinematic, spacious, product-as-hero. The hanko-seal + 手書き brush identity, editorial serif headings, and soft-radius warmth **carry over** onto the dark ground. Copy voice stays on the **PRD indicative-claims guardrail** (Tushar's explicit choice; the Figma mockup's hype voice is rejected).
> Everything downstream (`/to-tickets`, per-ticket plans, build) implements this file **verbatim** — no re-deciding design in plans.

---

## 1. Executive Visual Strategy & Discovery

### 1.1 Design thesis

**"A quiet, cinematic atelier for handwriting."** Tegaki treats a handwriting sample the way Oryzo treats its product: one artifact, photographed like an object of study, floating in a warm dark void. Ink is the material; paper is the light source. The vermilion hanko seal is the only saturated color on the page — it reads as both brand mark and "seal of a considered, human-validated craft." Trust is built through restraint: generous space, hairline structure, serif headlines, zero hype.

Named traits **extracted** from references (never copied — new identity per the reference-evidence rule):

| Reference | Trait taken | How Tegaki uses it |
|---|---|---|
| Oryzo (user's pick) | Warm dark void; one hero artifact; hairline + dashed dividers; pill controls; full-viewport cinematic sections; uppercase micro-labels | Handwriting macro as the hero artifact; dashed rules restyled as **genkō yōshi** (Japanese manuscript-paper) grid motifs |
| Figma mockup (user's) | Section *sequence* only: steps → tiers → **report anatomy** → analyst bio → FAQ | The "Sample Report Anatomy" section survives (it's genuinely persuasive); its styling is redesigned to this system |
| [Square pricing](https://mobbin.com/sites/sections/9be32053-9812-4f70-af2b-f4b22f765cf9) | Dark pricing: hairline column separators, serif prices, pill CTAs | Tier section skeleton |
| [OpenTable pricing](https://mobbin.com/sites/sections/0c81e36a-14f6-471d-9ce7-8930b284a9f2) | Outlined "Most Popular" chip above the middle plan | Core Personality anchor chip |
| [adidas order tracker](https://mobbin.com/screens/484bc185-eccb-4996-8b95-4a18ae59c35c) | Horizontal 3-node progress rail with expected-delivery date | Dashboard order-status rail (§3.6) |
| [Oyster upload form](https://mobbin.com/flows/c4af8d8e-9d46-4057-95b8-14a122c1403c) | Dashed dropzone with accepted-types/size helper line; file row with remove ✕ | Wizard stage-2 uploader |
| [Air upload flow](https://mobbin.com/flows/ddfa79b5-914e-49a7-b388-65e7593284c9) | "How it works" 3-step panel beside the dropzone; upload-complete toast | Wizard stage-2 guardrails panel + upload feedback |
| [Retool stepped container](https://mobbin.com/flows/a1455802-1786-40dd-be09-055210466940) | Numbered stepper with connector line, completed-state indication | Wizard 4-stage stepper |

### 1.2 Generative media assets (Higgsfield — specced, generation gated on Tushar's credit approval; 411 credits available)

All photographic assets share one prompt DNA so the site reads as a single shoot. **No AI-generated people presented as real** (no fake testimonials/avatars — PRD rule). Text/wordmarks are never diffusion-rendered.

| Asset | Spec | Prompt (model: `soul_2` unless noted) |
|---|---|---|
| **Hero film** (landing — replaces the static hero macro) | Seedance 2.5 one-take, 30s, 720p→2K upscale, sliced to 180 frames for canvas scroll-scrub. Full prompt kit, credit math (~235–250 cr), fallbacks: **`Hero-Video-Prompts.md`** | Side macro of hand writing cursive with black-lacquer fountain pen → camera arcs to top-down → pen twirl → coin-toss toward camera → floating pen on warm near-black void (the scroll-guiding object, Oryzo-coaster pattern) |
| **Section still — signatures** | 16:9 | "Overhead still-life of three handwritten signature specimens on cream paper cards arranged on dark walnut wood, warm spotlight, macro detail of ink texture, cinematic, no readable words" |
| **Section still — analysis desk** (about-Tushar backdrop) | 16:9 | "Moody desk scene: magnifying loupe over a handwritten page, brass pen rest, warm lamplight pooling on paper, dark surroundings, editorial photography, film grain" |
| **Scan-guide gallery** (8 tiles: 4 ideal / 4 rejected) | 1:1 tiles | Shot pairs: "sharp well-lit handwriting page on unlined paper" vs "blurry / lined-paper / cropped / shadowed" variants — same prompt DNA, flaw stated explicitly |
| **OG image 1200×630** | Code-rendered (Satori/canvas), **not** diffusion: ink-950 ground, seal mark left, "Tegaki" serif wordmark + "What your handwriting suggests about you" + 手書き subtitle | — (build task; §8 PRD deliverable) |

Fictional sample-report subjects use **initial-medallions on washi tint** (not photos) — honest, since the subjects are fictional composites and labeled as such.

### 1.3 Core aesthetic (via web-design-engineer)

- **Design Read** — artifact: landing + 3 product surfaces (wizard/dashboard/admin) · audience: Indian consumers ₹999–2,999, mobile-first, arriving via WhatsApp link · visual language: warm-dark cinematic editorial ("Kissaten noir × stationery atelier") · mode: greenfield · dials: visual-variance 7, motion-intensity 5 (landing) / 2 (app), info-density 3 (landing) / 6 (admin), asset-dependence 8, brand-fidelity 9.
- **Anti-cliché commitments:** no purple-pink gradients, no glassmorphism, no emoji-as-icons, no SVG-drawn scenes/people, no fake logos/testimonials/stats, no Inter/Roboto. Dark ground is **warm** (#131209 family), never GitHub-blue-black.
- **One committed theme.** The product ships dark-only (deliberate single look). Report PDFs and sample previews render on **washi cream** surfaces inside dark chrome — paper is literally the figure against the ink ground (figure-ground: content = light, chrome = dark).

### 1.4 Conversion strategy (via landing-page-design)

- **One offer, one audience, one action:** a personal handwriting assessment → self-discovery buyers → CTA **"Begin your assessment"** (never "Learn more").
- **Layout type B (long-form story)** — the offer needs education + skepticism handling. Traffic arrives warm (WhatsApp/IG shares), so the OG unfurl is the true above-the-fold: its promise must match the hero verbatim.
- **Proof = the product itself:** report excerpts (fictional composites, labeled) sit beside the tier cards they support. No testimonials until real ones exist.
- **Risk reversal:** "Sample not usable? Full refund." + 14-day re-upload window, stated at tiers and checkout.
- **SEO/AEO:** index the landing page (evergreen). `<title>`: "Tegaki — Handwriting Personality Assessment" · meta description ≤155 chars, claims-safe. FAQ in plain Q&A + FAQPage schema.

### 1.5 PWA & mobile considerations

- Mobile-first at 375px; the cinematic layout collapses to single column with full-bleed imagery and inset controls (§3.9).
- Touch targets ≥44×44px everywhere; primary wizard actions full-width, bottom-anchored within the content flow (thumb reach).
- `theme-color` #131209; safe-area insets respected on sticky elements (`env(safe-area-inset-*)`).
- Wizard survives interruption: draft order persists server-side per PRD §6.3; resuming shows the stepper at the saved stage.
- Offline/flaky-network state: every data view implements loading / empty / **error-with-retry** / working (PRD mandate, §5 checklist). Uploads show per-file progress and resumable retry on failure.

---

## 2. Design Tokens & Brand System

### 2.1 Color — OKLCH (hex fallbacks committed; state pairs pre-checked for contrast)

> **Hex fallbacks corrected 2026-09-01 (T01/A5).** The OKLCH values are authoritative; the hexes below are now the **true computed conversions** taken from the compiled stylesheet, replacing the approximations in the original draft (which were off by enough to matter — `--ink-950` was written as `#131209` but actually resolves to `#0d0b06`). `theme-color` in the app tracks the computed value.

```css
:root {
  /* Ink — warm dark ground (figure-ground: ground) */
  --ink-950: oklch(0.15 0.012 85);  /* #0d0b06  page void */
  --ink-900: oklch(0.20 0.015 80);  /* #1a150e  raised surface / cards */
  --ink-800: oklch(0.25 0.018 80);  /* #262118  elevated: modals, popovers, admin rows */
  --ink-700: oklch(0.32 0.018 78);  /* #383229  hairline borders, dashed rules */
  --ink-500: oklch(0.58 0.030 78);  /* #847867  disabled text, placeholder, metadata */

  /* Washi — paper light (figure) */
  --washi-50:  oklch(0.94 0.030 85); /* #f4ead5  primary text, report-paper surface */
  --washi-300: oklch(0.78 0.040 82); /* #c4b59b  secondary text, captions */

  /* Shu — vermilion seal (the ONLY saturated hue) */
  --shu-500: oklch(0.60 0.190 32);  /* #da452c  seal mark, accents, focus ring, active states */
  --shu-600: oklch(0.53 0.175 31);  /* #bc3422  filled CTA background (AA with washi-50 text) */
  --shu-700: oklch(0.46 0.155 30);  /* #9c271b  CTA hover/pressed */
  --shu-900: oklch(0.25 0.060 30);  /* #39150f  vermilion wash: selected-card tint, chip bg */

  /* State (used only in chips/alerts, always icon + text, never color alone) */
  --ok-500:   oklch(0.65 0.100 150); /* #5FA377  approved / completed */
  --warn-500: oklch(0.75 0.120 80);  /* #D9A441  under review / in progress */
  --err-500:  oklch(0.68 0.170 30);  /* #F2695C  needs re-upload / errors (lighter than shu → distinct from brand red) */
}
```

Rules: backgrounds are **flat** (no gradients — sole exception §2.2 hero heading text). New tints derive via `oklch()` from these hues only; no rogue hues. Total hue count: ink/washi (one warm axis) + shu + ok/warn/err = within budget.

### 2.2 Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings / prices | **Instrument Serif** (Google Fonts, 400) | Editorial serif per brand decision; no italics; sentence case |
| UI / body / forms | **Manrope** (400 / 500 / 600) | Approved list; cap at semibold-weight feel (600) |
| Micro-labels / chips / order IDs / status | **Geist Mono** (400 / 500), uppercase, tracking `0.08em` | The "specimen label" voice (Oryzo trait) |
| 手書き glyphs | **Noto Serif JP**, subset to the exact glyphs used (手, 書, き + footer chars) via `unicode-range`; few KB, never full CJK | PRD §6.1 |

- Scale: Tailwind steps only. Hero H1 `text-5xl` (375px) → `text-7xl` (≥1024px) via breakpoints; section H2 `text-3xl`→`text-4xl`; body `text-base`/`text-lg`; micro-labels `text-xs`.
- Hero heading gradient (the one allowed gradient, text-only, dark theme): left→right `#FFFFFF → #9B9B9B` — **overridden to brand**: `--washi-50 → --washi-300` (warm, not neutral gray).
- Heading/subheading `max-width: 680px`; manual line breaks at thought boundaries; `text-wrap: balance` headings, `pretty` body. No hyphens in copy; no orphans.
- Buttons: `text-base` 600 (primary), `text-sm` 600 (nav).

### 2.3 Spacing, radius, elevation

- **Spacing tokens only:** 0 / 2 / 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96 px. Section rhythm: 96px desktop / 64px mobile between landing sections; 24px card padding; 16px form-field gaps; group separation ≥2× intra-group gap.
- **Radius vocabulary:** cards & report surfaces 16px (`rounded-2xl`) · inputs & file rows 8px (nested formula: 16 − 8 padding) · buttons & chips pill (`rounded-full`) · images inside 24px-padded cards 8px. Never below 2px results — leave square.
- **Elevation = luminance, not shadow** (dark theme): surface stack ink-950 → ink-900 → ink-800, each level also gains a 1px `--ink-700` border. Modals add scrim `oklch(0.10 0.01 85 / 0.72)` + `backdrop-blur(4px)`. Max nesting: two container levels (common-region discipline).
- **Signature structural motif:** 1px **dashed** `--ink-700` horizontal rules between landing sections (genkō yōshi echo); solid 1px hairlines inside components. Full-bleed media; text/controls inside layout margins (16px mobile / 24px tablet / max-w-[1200px] centered desktop).

### 2.4 Brand mark — hanko seal · **Candidate B, chosen by Tushar 2026-09-01**

**The mark:** a **circle** — thick `--shu-500` rim ring with a single **手** glyph centred in `--shu-500` on the transparent/ink interior. Code-authored SVG, never diffusion-generated. Glyph rendered from Noto Serif JP converted to outlines (no font dependency inside the mark). A subtle 0.5px irregular edge (SVG turbulence displacement, low amplitude) gives the stamped-by-hand feel; the irregularity is baked into the path, not a runtime filter.

**Why B:** it is the most legible of the four at 16px, which matters because the mark does triple duty as nav lockup, favicon, and OG stamp. Single-glyph circular seals also read unmistakably as a *seal* rather than as a logo in a box.

**Specimen sizes** (the mark must be authored to survive all three):
| Context | Size | Treatment |
|---|---|---|
| Favicon / app icon | 16–32px | Rim thickens proportionally; interior glyph simplified if it fills in below 20px |
| Nav + footer lockup | 24px | Full detail, paired with wordmark |
| Final-CTA band + dashboard empty state | 96–160px | Full detail + the line-draw animation (§4.2) |

**Lockup:** seal (24px) + "Tegaki" in Instrument Serif + 手書き (Noto Serif JP, `--washi-300`, `text-xs`). Footer story-line: *"tegaki · 手書き · Japanese for handwritten."*

---

## 3. Component Architecture & Spatial Layout

### 3.1 Navigation
Slim top bar, `--ink-950/85` + `backdrop-blur(12px)`, 1px bottom hairline; height 64px. Left: seal + wordmark. Right (desktop): How it works · Pricing · Samples · FAQ (Geist Mono uppercase `text-sm`) + pill CTA "Begin your assessment" (`--shu-600`). Signed-in: "Dashboard" replaces CTA. Mobile: hamburger → full-screen overlay `--ink-950/95` + blur, links stagger in (§4). Current page indicated (washi-50 + shu underline dot). Hamburger morphs to ✕ (rotate ±45°, never disappears).

### 3.2 Landing page — section sequence (Layout B)
1. **Hero (100svh, scroll-scrub film):** full-bleed `<canvas>` painting the hero-film frame keyed to scroll position (spec §4.2b). Copy sits **lower-left over a gradient scrim** (never centered over the pen — the subject stays visible). Micro-label (Geist Mono, shu): "HANDWRITING ANALYSIS · 手書き". H1: "Your handwriting holds a story." Sub: "A personal, growth-oriented assessment of what your writing suggests about how you think and work — analyzed by hand, delivered as a considered report." CTA pill + ghost secondary "See a sample report". Proof line under CTA (Geist Mono, `text-xs`): "Pilot programme · reports hand-validated by Tushar Pathak". The film's beats map to the pinned chapters: writing macro = hero → overhead flat-lay = how-it-works → pen twirl = tagline → toss-toward-camera = tiers approach → floating pen on void = final CTA. Frame-preload counter styled as part of the show (Geist Mono percentage, shu accent, wipes at 100). **≤768px, reduced-motion, or no-JS:** static `hero-poster.jpg` (mobile may use the ~1.5 MB muted loop) — the scrub is a desktop/tablet enhancement, never a mobile data tax.
2. **How it works** — 3 numbered steps (Write & photograph → Choose your depth → Receive your report, with turnaround note "clock starts when your sample is approved"). Numbers in Instrument Serif `text-4xl` shu; dashed connector rail.
3. **Tagline reveal (mandatory moment):** two lines, `text-5xl` serif, word-by-word scroll activation (§4.3): "Written by hand. / Read with care." Muted 30% → full washi.
4. **Sample report anatomy** — three specimen rows (slant / t-bar / lower loops), each: washi-cream crop card (the *paper* is the figure) + trait name + one indicative sentence ("A pronounced rightward slant *suggests* expressive engagement…"). Micro-labels Geist Mono.
5. **Tiers** (§3.3).
6. **Report excerpts** — one washi-paper excerpt card per tier, tabbed; fictional composite subjects labeled "Illustrative sample — fictional subject".
7. **About Tushar** — analysis-desk still + short bio, real photograph of Tushar (asset from him; placeholder card until supplied — never a generated face).
8. **FAQ** — 8–10 accordion items (claims-safe: is this scientific? what should I write? privacy/deletion? re-upload? refund?…) + FAQPage schema.
9. **Final CTA band** — seal mark large (SVG line-draw on scroll), H2 "Ready when your pen is." + CTA (identical action to hero).
10. **Footer** — story-line, Privacy / Refund / Terms, contact (mailto + WhatsApp deep-link), disclaimer line: "Insights are indicative and growth-oriented — never diagnostic."
Disclaimer also appears as a one-liner under tier cards and on checkout.

### 3.3 Tier cards (Square skeleton × OpenTable chip)
Desktop: 3 columns separated by 1px hairlines (no boxed cards); mobile: stacked cards (ink-900, 16px radius) with Core first. Each: name (serif `text-2xl`) · price "₹1,999" (serif `text-5xl`) · turnaround (Geist Mono: "5-DAY TURNAROUND") · 4–6 contents bullets (Manrope, ✓ from icon set) · pill CTA. **Core Personality:** outlined shu chip "MOST POPULAR" above name, `--shu-900` wash background panel, filled CTA (others: ghost). Price display only — checkout is demo (pilot note lives at checkout, not repeated here).

### 3.4 Submission wizard (authenticated, 4 stages, resumable)
Layout: max-w-[640px] column; stepper on top (Retool pattern): numbered circles + connector line; completed = shu fill + check, current = shu ring, future = ink-700. Stage labels Geist Mono `text-xs` uppercase. Persistent tier/price summary line once chosen. Stage transitions per §4.
- **S1 Profile & subject:** grouped fields (16px gaps, 32px between groups). "Who is this analysis for?" = two selectable common-region cards (Myself / Someone else); the latter expands subject name + age + **consent checkbox** (checkbox is a required gate; error state if unchecked). Phone + WhatsApp-preference toggle.
- **S2 Guidelines & upload:** two-panel (desktop) / stacked (mobile): left = interactive guardrails checklist (4 items, user ticks each; upload unlocks when all ticked — deliberate friction that prevents rejects); ideal-vs-rejected gallery as paired thumbnails with ✓/✕ badges (err-500/ok-500), tap → lightbox. Right = Oyster-style dashed dropzone ("JPG, PNG or PDF · up to 20 MB each"), multi-file; per-file row: thumbnail, name, size, progress bar (shu), remove ✕; failed file → inline retry.
- **S3 Tier selection:** §3.3 cards in-wizard (radio behavior, shu-900 selected wash + shu ring); link "Compare what's inside" → excerpt sheet.
- **S4 Demo checkout:** order summary card + price; **pilot notice** banner (warn-500 tinted, icon + "Pilot mode — no real payment is taken. Your order is confirmed instantly."); confirm pill → success moment (§4.5) → dashboard.

### 3.5 Customer dashboard
Header: "Your assessments" (serif) + pill "New request" (always visible). Order cards (ink-900, 16px radius, 24px padding): subject name (serif `text-xl`) · tier + order ID (Geist Mono) · **status rail** (§3.6) · expected delivery date · contextual action. Completed → primary "Download report (PDF)" (signed URL) + note "Also sent to your email/WhatsApp". Needs re-upload → err-tinted panel with the rejection reason verbatim + inline dropzone (S2 component reused). Parked → contact link.
**Empty state (first-run trust moment):** centered seal mark (line-draw once), serif "Your first assessment begins with a handwriting sample.", two lines on how it works, CTA "Begin your assessment". Loading: skeleton cards shaped like real cards (no spinners). Error: inline message + "Try again" button.

### 3.6 Status rail (order card)
Horizontal 4-node rail (adidas pattern): Sample review → Analysis → Report → Delivered. Node = 8px dot + Geist Mono label; done = ok-500 check, active = shu pulse (§4), future = ink-700. `needs_reupload` replaces the rail with the err panel; `parked` shows a neutral notice + contact. Maps 1:1 to PRD §6.6 states — no invented states.

### 3.7 Admin panel
Same tokens, denser (info-density 6): table/list of orders (ink rows, 12px padding, hairline separators), filter chips by status, newest first. Row → detail: sample viewer (washi surface), approve (ok, confirm dialog states "starts the N-day clock") / reject-with-reason (textarea required) / status controls / report-PDF upload (same dropzone) / mark-delivered / pause-new-orders switch (global, warn-tinted when on; wizard then shows "temporarily closed" notice card). Admin skips ceremony: no scroll animation, instant transitions.

### 3.8 Perceptual weighting (perception-law pass)
- **Visual anchors:** each viewport has exactly one — hero: the nib macro (copy is secondary by size); tiers: Core's shu chip + wash; dashboard card: status rail. Squint test specified per section in QA.
- **Fitts:** all targets ≥44px; wizard primary action full-width at column bottom; destructive/secondary actions (remove file, reject) small and separated ≥24px from primaries; admin approve/reject never adjacent — reject sits trailing with confirm step.
- **Common region:** selectable choices (self/other, tiers) are bordered cards; form groups use spacing first, boxes only where selection semantics exist. Max two nesting levels.
- **Figure-ground:** washi content surfaces on ink chrome; modals get scrim + blur; selected states shift luminance + border, never color alone.
- **Continuity:** stepper rail, how-it-works rail, and status rail all share the same dashed-connector language — one lineage of "process" visuals.

### 3.9 Responsive behavior (gates, PRD-mandated)
- 375px: single column; hero copy over darkened lower half of the macro (scrim ensures contrast); tier cards stacked, Core first; nav → overlay; no horizontal scroll anywhere (verify).
- 768px: two-column moments return (S2 panels, anatomy rows); nav inline.
- ≥1024px: full cinematic spacing; content max 1200px; media full-bleed.
- Tables (admin) scroll inside their own `overflow-x-auto` container.

---

## 4. Motion & Micro-Interactions Spec

### 4.1 Tokens & policy
```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* entrances, exits, reveals */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement, stepper */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* sheets, mobile nav overlay */
--dur-press: 140ms; --dur-pop: 180ms; --dur-modal: 280ms; --dur-reveal: 800ms;
```
- Stack: **CSS transitions/`@starting-style` + IntersectionObserver + WAAPI. No GSAP, no smooth-scroll engine, no Three.js** — justified: mobile-first Indian audience on mid-range Android; form-heavy product surfaces; the cinematic register comes from photography + restraint. Native scroll everywhere. (Sole library exception: none at pilot.)
- Only `transform`, `opacity`, `clip-path` animate. Never `transition: all`. Never `ease-in`. Never scroll-listener-driven reveals — IntersectionObserver only.
- **Admin + keyboard-initiated actions: no animation.** App-surface (wizard/dashboard) motion stays ≤250ms; landing owns the delight budget.

### 4.2 Landing choreography
- **Hero intro (once, on load):** static poster frame is complete without JS. Then: micro-label + H1 + sub + CTAs fade-rise `translateY(16px)+opacity` staggered 60ms, 600ms `--ease-out`. Nav/CTA usable immediately, including during frame preload.
- **4.2b Hero scroll-scrub (desktop/tablet):** 180 JPEG frames (1600px, q86, from the 2K-upscaled Seedance one-take — `Hero-Video-Prompts.md`) preloaded behind a percentage counter, painted to a full-bleed canvas via `requestAnimationFrame` reading scroll progress across the pinned landing chapters (CSS `position: sticky` container, ~400vh scroll run). Scrub is bidirectional and buttery (frame index = eased scroll fraction × 179; paint only on index change). Copy chapters cross-fade at fixed progress marks. This **is** the page's "3D" — no Three.js (§4.1 stands). Fallbacks per §3.2-1; frames lazy-abort if the user navigates before preload completes.
- **Scroll reveals:** sections enter `translate-y-16 + blur(6px) + opacity-0 → 0/0/1`, 800ms `--ease-out`, `IntersectionObserver { once: true, rootMargin: "-80px" }`; children stagger 50ms.
- **Tagline reveal:** per-word IntersectionObserver, each word 30%→100% washi over 400ms `--ease-out` as it crosses the trigger line; reading order; never a block flip.
- **Seal line-draw (final CTA + dashboard empty state):** SVG `stroke-dashoffset` draw 900ms `--ease-in-out`, then fill fades in; runs once.
- **Section rules:** dashed rules "write in" via `clip-path: inset(0 100% 0 0) → inset(0)` 600ms when revealed.

### 4.3 Component micro-interactions
| Element | Spec |
|---|---|
| All pressables | `:active` `scale(0.97)`, 140ms `--ease-out`; hover (fine pointers only): luminance lift + `translateY(-1px)` |
| Primary CTA hover | Background `--shu-600 → --shu-700` 160ms `ease` |
| Accordion (FAQ) | `grid-template-rows 0fr→1fr` 240ms `--ease-in-out`; chevron rotates 180° in sync |
| Stepper advance | Connector fill wipes `--ease-in-out` 300ms; new panel enters `translateX(24px)+fade` 220ms `--ease-out`, old exits reverse (direction-aware for Back) |
| Dropzone | Drag-over: border ink-700→shu-500 + `scale(1.01)` 150ms; file rows enter with 40ms stagger, `@starting-style` fade-rise |
| Upload progress | Width via `transform: scaleX` (transform-origin left), linear |
| Toast (order confirmed, admin saves) | Enter/exit bottom `translateY(100%)`, 400ms transitions (not keyframes — interruptible); swipe-to-dismiss follows entry axis |
| Modal / lightbox | Scrim fade 200ms; panel `scale(0.96)+fade` 280ms `--ease-out`, origin center; exit 180ms |
| Mobile nav overlay | `--ease-drawer` 400ms; links `translate-y-12+fade` stagger 60ms |
| Status rail active node | 2s opacity pulse 60%↔100%, pauses when tab hidden (`visibilitychange`) |
| Checkout success | Seal stamps onto summary: `scale(1.2)+fade → scale(1.0)` 350ms `--ease-out` with 2px settle — the one celebratory beat (rare-tier) |
| Tooltips | 300ms open delay; adjacent tooltips instant; 125ms `--ease-out`, origin at trigger |

### 4.4 Reduced motion & gating
`prefers-reduced-motion: reduce` → keep opacity/color fades ≤200ms; kill translate/scale/blur/parallax/line-draw/pulse (render final states). All hover motion gated `@media (hover: hover) and (pointer: fine)`. Stagger never blocks interaction.

---

## 5. Accessibility & QA Checklist

### 5.1 Contrast (computed, dark theme)
| Pair | Ratio | Verdict |
|---|---|---|
| washi-50 on ink-950 (body) | ~15.3:1 | AAA |
| washi-300 on ink-950 (secondary) | ~9.8:1 | AAA |
| washi-300 on ink-900 (captions on cards) | ~8.6:1 | AAA |
| washi-50 on shu-600 (CTA text) | ~4.9:1 | AA ✓ (16px/600) |
| shu-500 on ink-950 (accents, large serif only) | ~4.3:1 | AA-large ✓ — never for body text |
| err-500 on ink-950 | ~5.6:1 | AA ✓, always icon + text |
| ink-950 on washi-50 (report/paper surfaces) | ~15.3:1 | AAA |
Hero copy over photography requires a scrim layer to ≥7:1 — verify per breakpoint.

### 5.2 Checklist (build gates — every item verified before "done")
- [ ] **States:** every data view ships loading (skeletons shaped like content) / empty (designed, §3.5) / error (inline + real retry) / working. Exercised for real: zero rows, mid-load, forced failure, happy path.
- [ ] **Keyboard:** full flows operable (wizard end-to-end, accordion, modals with focus trap + Esc + focus return, lightbox). Visible focus ring: 2px shu-500 offset 2px, never removed. Skip-to-content link.
- [ ] **Forms:** labels always visible (no placeholder-as-label); errors inline, specific, `aria-describedby`; consent checkbox enforced with clear message; client-side email/phone/file-type validation.
- [ ] **Semantics:** landmark elements, one `h1`/page, alt text on every meaningful image (specimen crops get descriptive alts), status chips have text (never color-only), upload progress has `aria-live="polite"` announcements.
- [ ] **Touch:** targets ≥44px verified on device; hover-only affordances have tap equivalents.
- [ ] **Reduced motion** path exercised (OS setting on) — page complete and legible with JS disabled (static hero frame).
- [ ] **Responsive gates:** 375px + 768px — no horizontal scroll, nav usable, content readable without zoom; desktop unchanged.
- [ ] **Link preview:** OG/Twitter tags in static `index`/layout head; purpose-built 1200×630 `og-cover.png` at absolute HTTPS URL; verified via LinkedIn Post Inspector + opengraph.xyz + a real WhatsApp paste; image never 404s during deploy.
- [ ] **Ship set:** branded favicon (seal D), custom 404 (seal + "This page isn't in our files." + way back), Privacy/Refund/Terms linked in footer, `<title>` + meta description, no dead links, current-nav indicated.
- [ ] **Content honesty:** no lorem ipsum, no fabricated testimonials/stats, fictional samples labeled, disclaimer present site-wide + checkout + report footer; copy passes the indicative-claims guardrail (grep for banned absolutes: "reveals", "proves", "will", "destiny", diagnostic terms).
- [ ] **Performance:** hero image responsive (`srcset`, AVIF/WebP, priority), below-fold media lazy, fonts subset + `font-display: swap` (serif fallback: Georgia stack; JP subset only), no layout shift from font swap on the wordmark (size-adjust), Lighthouse mobile ≥85 on landing.

### 5.3 Open items for Tushar (checkpoint decisions)
1. **Seal candidate** A / B / C / D (§2.4) — pick one (favicon uses D-style knockout regardless of lockup choice? default: chosen mark everywhere).
2. **Higgsfield generation approval** — ~4 stills + 8 gallery tiles ≈ 60–100 credits of the 411 available; or supply own photography.
3. Real photo of you for §3.2-7 (or ship the section with an honest placeholder frame at pilot).
```
