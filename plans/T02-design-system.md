# Plan — T02 · Design system foundation

> **Ticket:** T02 (`tickets.md`) · **Phase 1 · Foundation** · **Blocked by:** T01 (needs the running app, tokens, and fonts).
> **Inputs:** `Design.md` §2 (tokens/type/spacing/radius), §2.4 (seal B), §3.1 (nav), §4 (motion), §5.1 (contrast pairs).
> **Delivers:** every reusable primitive the later tickets consume, demonstrated in every state on a `/styleguide` route, plus the app shell (nav + footer with the seal lockup).

**Prime directive:** implement `Design.md` **verbatim**. No new hues, no invented spacing, no easing that isn't a named token. Where this plan and `Design.md` disagree, `Design.md` wins — and file the discrepancy.

---

## Tasks

### Group A — Foundations

**A1 · Tailwind theme mapping**
Map the CSS custom properties from T01 into the Tailwind theme (`@theme` / config): colours (`ink-*`, `washi-*`, `shu-*`, `ok/warn/err`), font families (`serif` → Instrument Serif, `sans` → Manrope, `mono` → Geist Mono), and confirm only the sanctioned spacing steps (0/2/4/8/12/16/24/32/40/48/64/80/96) and radius vocabulary (8px inputs · 16px cards · pill) are exposed.
*Gate:* `bg-ink-900 text-washi-50 font-serif rounded-2xl` all resolve; an unsanctioned value like `p-[13px]` is greppable-forbidden in the codebase (add a lint note).

**A2 · Motion primitives**
`src/lib/motion.ts` + CSS: `--ease-out`, `--ease-in-out`, `--ease-drawer`, durations (`--dur-press` 140ms, `--dur-pop` 180ms, `--dur-modal` 280ms, `--dur-reveal` 800ms). Add a `useReducedMotion`-aware helper and a global `prefers-reduced-motion` stylesheet block per `Design.md` §4.4.
*Gate:* grep finds no `transition: all`, no `ease-in`, no raw cubic-bezier outside the token file.

**A3 · Hanko seal component (chosen candidate B)**
`src/components/brand/seal.tsx` — SVG circle seal: thick vermilion rim, 手 centred, glyph converted to outline paths (no runtime font dependency), subtle baked-in edge irregularity. Props: `size` (16 → 160px), `title` for a11y. Per `Design.md` §2.4, verify legibility at 16px and simplify the interior if it fills in below 20px.
*Gate:* renders crisp at 16, 24, and 160px; `aria` labelling present; zero external requests.

**A4 · Brand lockup + footer**
`src/components/brand/lockup.tsx` (seal 24px + "Tegaki" serif + 手書き subtitle) and `src/components/shell/footer.tsx` with the story-line *"tegaki · 手書き · Japanese for handwritten."*, Privacy/Refund/Terms links (routes exist in T13 — link them now, dead-link check comes there), contact links, and the site-wide disclaimer line.
*Gate:* footer renders at 375px without wrapping breakage; JP glyphs use the subset font.

### Group B — Core controls

Each component ships **all** of: default / hover (pointer-fine gated) / active (`scale(0.97)`) / focus-visible (2px shu ring, 2px offset) / disabled — plus loading where meaningful. Hover motion is gated `@media (hover: hover) and (pointer: fine)`.

**B1 · Button** — `src/components/ui/button.tsx`: variants `primary` (shu-600 fill, washi text), `ghost` (1px washi border), `link`; sizes `md`/`sm`; pill radius; `text-base`/`text-sm` semibold; optional `loading` state with inline spinner replacing the label (width preserved — no layout jump).
*Gate:* all variant × state combinations render on `/styleguide`; contrast of primary label ≥4.5:1 (per `Design.md` §5.1).

**B2 · Input + Textarea + Label + Field error** — `src/components/ui/field.tsx`: visible label above, 8px radius, ink-900 fill, 1px ink-700 border → shu on focus; error message slot wired via `aria-describedby`; never placeholder-as-label.
*Gate:* keyboard focus order and error announcement verified with VoiceOver or Playwright a11y assertions.

**B3 · Checkbox + Toggle** — consent checkbox styling (16px box, shu check) and the WhatsApp-preference toggle; both ≥44px hit area via padding, label clickable.
*Gate:* operable by keyboard; hit target measured ≥44px.

**B4 · Card + Status chip** — `card.tsx` (ink-900, 16px radius, 24px padding, 1px ink-700 border) and `status-chip.tsx` (Geist Mono uppercase `text-xs`, icon + text, tint per state family — never colour alone). Chip variants map 1:1 to the PRD §6.6 states plus `draft`.
*Gate:* chips render every status; a colour-blind simulation still distinguishes them by icon + text.

**B5 · Dashed rule + micro-label** — the genkō-yōshi dashed 1px divider (`ink-700`) and the Geist Mono uppercase micro-label (`tracking 0.08em`, shu or washi-300).
*Gate:* matches `Design.md` §2.3/§3.2 visually at all three breakpoints.

### Group C — Structural components

**C1 · Top nav** — `src/components/shell/nav.tsx` per `Design.md` §3.1: 64px, `--ink-950/85` + `backdrop-blur(12px)`, hairline bottom border, lockup left; links (Geist Mono `text-sm` uppercase) + pill CTA right; signed-in swaps CTA for "Dashboard"; current page indicated (washi + shu dot).
*Gate:* renders over a light image without contrast failure; current-page indicator works.

**C2 · Mobile nav overlay** — hamburger morphs to ✕ (lines rotate ±45°, never vanish); full-screen `--ink-950/95` + blur overlay; links stagger in (`translate-y-12` → 0, 60ms steps, `--ease-drawer` 400ms); focus trapped while open; Esc closes.
*Gate:* keyboard-only open/navigate/close; reduced-motion renders instantly.

**C3 · Modal / sheet + scrim** — centred modal (`scale(0.96)`+fade in 280ms, out 180ms, origin centre), scrim `oklch(0.10 0.01 85 / 0.72)` + `backdrop-blur(4px)`; focus trap, Esc, focus-return to trigger.
*Gate:* focus returns to the trigger on close; scroll locked behind.

**C4 · Toast** — bottom entry/exit via `translateY(100%)`, CSS **transitions not keyframes** (interruptible), swipe-to-dismiss along the entry axis, timer pauses when the tab is hidden.
*Gate:* rapid-fire toasts retarget smoothly; `visibilitychange` pauses the timer.

**C5 · Stepper** — the 4-stage wizard stepper: numbered circles, connector rail, states completed (shu fill + check) / current (shu ring) / future (ink-700); labels Geist Mono `text-xs` uppercase; connector fill wipes 300ms `--ease-in-out` on advance.
*Gate:* renders stages 1–4 in every combination; `aria-current="step"` present.

**C6 · Dropzone shell** — dashed 1px border, helper line ("JPG, PNG or PDF · up to 20 MB each"), drag-over state (border → shu, `scale(1.01)` 150ms), disabled state (for the guardrails gate). File-row component: thumbnail, name, size, progress bar (`scaleX`, origin left), remove ✕, error + retry state. **No upload logic** — T04 wires it.
*Gate:* all visual states reachable via `/styleguide` toggles.

### Group D — Screen-state primitives

**D1 · Skeleton** — shaped like real content (card-shaped, line-shaped), shimmer via opacity only under reduced motion.
**D2 · Empty state** — slot-based: icon/seal + serif heading + body + CTA (the dashboard first-run moment consumes this in T03).
**D3 · Error state** — inline message + working "Try again" button slot; specific-message prop required (no generic "something went wrong" default — make the prop mandatory).
*Gate (all three):* demonstrated on `/styleguide`; the error primitive's retry is a real callback, not decoration.

### Group E — The styleguide route and gates

**E1 · `/styleguide` page** — `src/app/styleguide/page.tsx`, `noindex`, dev-visible: every primitive in every state, the colour tokens with their computed contrast pairs, the type scale, and the seal at 16/24/96/160px.
*Gate:* the page is the ticket's demo artifact.

**E2 · Accessibility pass** — keyboard-only walk of every interactive primitive; focus ring visible on each; reduced-motion pass renders final states.
**E3 · Responsive pass** — `/styleguide` at 375/768/1440px: no horizontal scroll, nav usable, mobile overlay correct.
**E4 · Design-fidelity self-review** — diff every rendered value against `Design.md` §2–§4; file any deviation as a discrepancy rather than silently "improving" it.
*Gate:* the three passes are recorded (checklist in the PR/ledger), not asserted.

---

## Definition of done

- [ ] `/styleguide` shows every primitive in every state, including the four screen-state primitives.
- [ ] Zero unsanctioned values: greps for `transition: all`, `ease-in`, raw hex colours outside the token file, and off-scale spacing all come back clean.
- [ ] Seal B is a self-contained SVG component, legible at 16px.
- [ ] Keyboard, reduced-motion, and 375/768 passes recorded.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass; visual states have at least smoke-level component tests.

## Notes for the implementer

- Build **only** what `tickets.md` T02 names. The wizard, dashboard, and landing consume these primitives in their own tickets — resist pre-building screens.
- The toast/modal/dropzone are the components most likely to tempt you toward a library. If you reach for one, stop and check `Design.md` §4's constraints first; hand-rolling per the specs above is the default.
