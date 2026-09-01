# Plan — T13 · Policy pages, link preview, and the ship set

> **Ticket:** T13 · **Phase 4** · **Blocked by:** T11.
> **Why it matters:** WhatsApp/Instagram sharing is the entire acquisition channel — **the unfurl is the storefront.**

## Tasks

**A1 · Policy content** — `src/content/policies/` (privacy, refund, terms) drafted from the PRD's settled positions: handwriting images are sensitive personal data · samples auto-delete 90 days after delivery · reports persist in the dashboard · delete-my-data honoured on request (contact route) · consent required when subject ≠ buyer · refund only if no usable sample after the 14-day re-upload window · **pilot notice: checkout is demo mode, no real payment is taken** · indicative-insights disclaimer. Plain language, dated, "last updated" stamp.
*Gate:* claims grep passes; every PRD policy fact appears in the right page.

**A2 · Policy routes** — `(marketing)/privacy|refund|terms/page.tsx` on a readable washi-on-ink longform template (max-w-prose, serif headings); linked from the T02 footer (dead links now become live).
*Gate:* footer links resolve; readable at 375px.

**A3 · Contact route** — `(marketing)/contact/page.tsx`: mailto + WhatsApp deep-link (`wa.me/<Tushar's number>` — **ask Tushar for the number**, placeholder fails the build), framed as the escape hatch for parked orders too.
*Gate:* both links open their apps; number confirmed by Tushar, not invented.

**B1 · OG image, code-rendered** — `scripts/generate-og.tsx` (Satori/`@vercel/og` at build time, or a checked-in render): 1200×630, ink-950 ground, seal B left, "Tegaki" Instrument Serif, "What your handwriting suggests about you", 手書き subtitle → `public/og-cover.png` (<300 KB). **Never diffusion-rendered** (wordmark must be crisp).
*Gate:* pixel-checked at 1200×630; wordmark crisp at 100%.

**B2 · Metadata** — root layout `metadata` export: `<title>` "Tegaki — Handwriting Personality Assessment", ≤155-char claims-safe description, OG (`type/site_name/title/description/url/image` + width/height/alt) and `twitter:card=summary_large_image` set, **absolute HTTPS URLs** built from `NEXT_PUBLIC_SITE_URL`; `theme-color` `#131209`.
*Gate:* rendered HTML head contains absolute URLs (unit test on the metadata object).

**B3 · Favicon + 404 + skip link** — seal B as `icon.svg` + `favicon.ico` (+ `apple-icon`); `src/app/not-found.tsx` branded ("This page isn't in our files." + seal + way home); skip-to-content link first in the tab order (verify it exists from T02, wire the `#main` target).
*Gate:* favicon shows in the tab; 404 renders for a junk route; skip link focuses main.

**C1 · Live unfurl verification** ⚠️ the done gate — on the deployed production URL: `curl -I` og-cover.png → **HTTP 200**; run the URL through **LinkedIn Post Inspector** and **opengraph.xyz** (title + description + image all render); paste into a real WhatsApp chat and screenshot the unfurl; re-scrape after any change (`?v=N` for WhatsApp).
*Gate:* screenshots of all three attached to the ledger. Not done until seen.

**C2 · Dead-link crawl** — Playwright crawl of nav + footer + policy cross-links: zero 404s, zero `href="#"`.
*Gate:* green.

## Definition of done
- [ ] Three policy pages live with PRD-accurate content; contact links confirmed real.
- [ ] OG set complete with absolute URLs and a purpose-built code-rendered image that returns 200.
- [ ] Unfurl verified on LinkedIn Inspector + opengraph.xyz + a real WhatsApp paste (evidence recorded).
- [ ] Favicon, branded 404, skip link shipped; no dead links site-wide.
