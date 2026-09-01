# Plan — T14 · Hero scroll-scrub film

> **Ticket:** T14 · **Phase 4** · **Blocked by:** T11, C5 (✅ film shot 2026-09-01 — v3 master, 15s).
> **Delivers:** the pen-guided scroll journey per `Design.md` §4.2b: 180 preloaded frames on a full-bleed canvas, scrubbing the film across the pinned landing chapters. Mobile never pays for it.

## Inputs (from C5 — ✅ produced 2026-09-01, actuals)

- `assets/hero/frames/hero_001.jpg … hero_180.jpg` — **1280px wide, ffmpeg q6, 6.6 MB total** (sliced from the 2560×1440 AIGC upscale; 1600px/q86 measured 13 MB because film grain fights JPEG — 1280/q6 was the best smoothness-per-byte, and slices from the 2K source stay clean)
- `assets/hero/hero-poster.jpg` — 1600px, 148 KB (the fallback everywhere JS/motion/width says no)
- `assets/hero/hero-mobile.mp4` — 6s, 960px, **246 KB** muted loop (well under the 1.5 MB cap — safe to use on mobile)
- Masters: `master-v3-2k-KEEPER.mp4` (22 MB, not committed) · `master-v3-15s-720p.mp4` · contact sheet.

## Beat → chapter map (15s film, 180 frames)

| Frames | Film beat | Pinned chapter copy |
|---|---|---|
| 1–45 | Side macro, nib hovering over the finished sentence | Hero copy (lower-left, scrim) |
| 46–90 | Arc up and over to the overhead flat lay | How-it-works chapter |
| 91–120 | Pen twirl between fingers | Tagline: "Written by hand. / Read with care." |
| 121–150 | The toss — pen rising toward camera | Tiers approach (copy cross-fades out) |
| 151–180 | Sharp floating pen on the void | Final CTA chapter |

Copy cross-fades at the boundary frames (±6 frames feather). Exact frame marks tuned by eye during build; the map above is the starting point.

## Tasks

**A1 · Serve the frames** — copy the frame set + poster into `public/hero/` (these derived assets ARE committed, unlike the masters); record total bytes in the ledger.
*Gate:* 180 files served; poster loads.

**A2 · Gate matrix first** — `useHeroScrubEligible()`: `matchMedia('(min-width: 769px)')` AND NOT `prefers-reduced-motion` AND JS present. Ineligible → render the T11 static hero untouched. **The frame fetch itself is behind the gate** — assert zero `/hero/hero_*.jpg` requests at 375px.
*Gate:* Playwright network assertion on mobile viewport: 0 frame requests; reduced-motion desktop: 0 frame requests.

**A3 · Preloader with the counter** — fetch frames with bounded concurrency (6) into `ImageBitmap`s; the percentage counter is part of the show (Geist Mono, shu accent, wipes away at 100 per the Website-Pack loading-screen principle); hero copy + nav interactive throughout; `AbortController` cancels on unmount/navigation.
*Gate:* throttled-network run shows the counter then the scrub; navigating away mid-load aborts (network panel confirms).

**A4 · The scrub** — sticky 100svh `<canvas>` inside a ~400vh section; scroll fraction → eased frame index (`Math.round(eased(progress) * 179)`); paint via `requestAnimationFrame` **only when the index changes**; `drawImage` cover-fit with the same focal crop as the poster; devicePixelRatio-capped at 2.
*Gate:* DevTools performance trace shows no paints on idle scroll ticks; scrub is smooth forwards **and backwards** at 1440px.

**A5 · Chapter copy layer** — absolutely-positioned copy blocks cross-fading on the frame marks (opacity/transform only); hero copy never covers the pen (lower-left rule holds through every beat — check at the toss frames where the pen crosses the frame).
*Gate:* copy legible at every 10% scroll position (scripted screenshot sweep).

**A6 · Fallbacks verified** — ineligible contexts render the static hero: 375px, reduced-motion, JS-off. Optional: swap the mobile static for the `hero-mobile.mp4` muted loop if it's ≤1.5 MB (`playsinline`, `muted`, `loop`, poster set).
*Gate:* all three fallback paths screenshot-verified; page complete in each.

**B1 · Perf regression check** — Lighthouse mobile on the deployed preview **must stay ≥85** (mobile never downloads frames, so the score should hold from T11); desktop LCP stays the poster/first frame.
*Gate:* scores recorded before/after in the ledger.

**B2 · E2E sweep** — scripted scroll 0→100→0 capturing frames at 0/25/50/75/100%: beats match the map; no console errors; memory stable across three sweeps (no bitmap leak).
*Gate:* green, screenshots in the ledger.

## Definition of done
- [ ] Desktop scrub plays the film both directions, smoothly, chapters in sync with the beat map.
- [ ] Mobile/reduced-motion/no-JS provably never fetch a frame and render a complete hero.
- [ ] Preload counter styled as part of the show; abort works.
- [ ] Frame budget ≤6 MB recorded; Lighthouse mobile ≥85 maintained.
