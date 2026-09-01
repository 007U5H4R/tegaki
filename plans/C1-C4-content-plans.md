# Plans — C1–C4 · Content workstream

> Parallel to the code DAG. Only C3 gates a code ticket (T12); C4's images swap into T04/T11 whenever ready. C5 (hero film) is complete — see `Hero-Video-Prompts.md`.

---

## C1 · Master Prompt tier variants

**Inputs:** `Graphology Prompt.docx` (Master Prompt v2.0) · PRD §5 content splits · the Varun run (`Sample Reports/`) as the reference of what "good" looks like.

1. Extract the docx text (`python-docx` or `textutil -convert txt`) into `prompts/master-v2-source.md` for diff-able provenance.
2. Derive three variants, each a **complete, self-contained prompt**:
   - `prompts/express.md` — 1–2 pages: short intro · Executive Summary · 6-trait dashboard · top-3 strengths · one development insight · primary-signature note. Explicit exclusion list (no MBTI, no archetype, no radar).
   - `prompts/core.md` — 3–5 pages: full 10–12-trait dashboard · archetype title · the five core sections (Foundation / Independence / Discipline / Excellence / Emotional Awareness) · Strengths Profile · Development Opportunities · signature-vs-text comparison.
   - `prompts/comprehensive.md` — 6+ pages: all 16 Master-Prompt sections · MBTI correlation (explicitly indicative) · radar-chart data block (named traits + 0–10 scores emitted as JSON for C2's chart) · public-projection signature analysis.
3. Every variant embeds the guardrail block verbatim: indicative language, growth-oriented framing, no absolute/deterministic/diagnostic claims, the report-footer disclaimer line.
4. Each variant states its **input contract** (handwriting scan images + subject name/age/gender for pronouns) and **output contract** (markdown structure C2 consumes, section headings fixed).
5. **Test-run all three on the same scan** (`Sample Reports/HW NS.pdf`) in a Claude session; check length, section compliance, tone, and that Express ⊂ Core ⊂ Comprehensive in scope.

**Done when:** three runs produce correctly-scoped drafts and **Tushar approves each variant's structure** (his validation gate exists at every real order anyway — this approves the *template*).

---

## C2 · Branded PDF report template

**Decision:** print-styled **HTML → PDF** (Playwright's `page.pdf()` — already in the stack) rather than docx: it reuses the exact site fonts/tokens, so the report and the site are one brand object. A4, washi-cream page, ink text, serif headings, seal in the header, disclaimer in every footer.

1. `report-template/report.css` — print stylesheet on the Design.md tokens (A4 margins, page numbers, avoid-break rules for the trait table).
2. `report-template/render.mjs` — md/JSON (C1 output contract) → HTML → PDF via headless Chromium; trait-dashboard table; **radar chart as inline SVG** generated from the comprehensive variant's JSON scores (pure function, unit-testable — no chart library).
3. Filename convention matches T09: `Tegaki-{subject}-{tier}-{date}.pdf`.
4. Verify by re-rendering the Varun report content through the template.

**Done when:** the Varun content renders as a PDF Tushar would actually send, at all three tier lengths, radar included at Comprehensive.

---

## C3 · Three fictional composite sample reports ⚠️ gates T12

1. Invent three **fictional** subjects (distinct ages/contexts; no real person's data, no real scans — describe the fictional handwriting characteristics in the prompt input instead of supplying a real image, or generate a synthetic handwriting image via C4's pipeline).
2. Run each through its C1 variant → C2 template → three sample PDFs (`public/samples/` web-optimized).
3. Choose landing excerpts (one strong passage per tier) into `src/content/excerpts.ts` with the mandatory label: **"Illustrative sample — fictional subject."**
4. Crops for T12's anatomy section (slant / t-bar / lower loops) come from the synthetic handwriting imagery — never from a real client scan.

**Done when:** three labelled PDFs exist, excerpts chosen, every sentence claims-safe, and Tushar signs off the fictional subjects read as credible-but-clearly-illustrative.

---

## C4 · Scan-guide gallery (8 tiles)

**Budget:** ~16–32 credits (nano_banana_pro, 1:1, 8 generations) — or Tushar photographs real examples with his phone (free, arguably more honest; **ask him which** before generating).

Prompt DNA (shared): "Overhead photograph of a handwriting sample page on a dark walnut desk, warm lamp light, photoreal" + per tile:
| # | Kind | Variant |
|---|---|---|
| 1 | ✅ ideal | sharp, evenly lit, unlined cream paper, full page in frame |
| 2 | ✅ ideal | two full pages side by side, three signatures visible at the bottom |
| 3 | ✅ ideal | phone-photo angle but flat, no shadow, all edges visible |
| 4 | ✅ ideal | crisp close detail, ink clearly legible |
| 5 | ❌ reject | motion-blurred, text illegible |
| 6 | ❌ reject | ruled/lined notebook paper |
| 7 | ❌ reject | page cropped, signatures cut off at the bottom edge |
| 8 | ❌ reject | harsh shadow across the page, half unreadable |

Output: `public/guide/{ideal,reject}-N.webp` + captions in `src/content/scan-guide.ts` (each caption names the flaw in one clause). Swap into T04's gallery, replacing the placeholders.

**Done when:** each rejection reason is obvious **without** reading the caption (squint test), and the tiles are wired into the wizard gallery.
