# Tegaki Hero Film — Seedance 2.5 Prompt Kit

> Tushar's vision (2026-09-01): side macro of a right hand writing cursive with a luxurious fountain pen → camera arcs to top-down → playful pen twirl → coin-toss into the air toward camera → the floating pen then guides the whole scroll journey, exactly as Oryzo's coaster does. Color tone & quality: Oryzo (warm near-black, cream paper as the light source, film grain, cinematic).
> Built per the Seedance 2.5 Website/Prompt Pack method: ONE start image → ONE continuous take (30s ceiling) → 2K AIGC upscale → slice 180 frames → canvas scroll-scrub.

**Two brand corrections applied to the reference frames** (flag to Tushar):
1. **Unlined paper, no spiral notebook.** Tegaki's own upload guardrails demand unlined paper — the hero must model the behavior we ask of customers. Loose cream sheets replace the spiral notebook.
2. **Luxurious fountain pen** (dark lacquer, gold nib) replaces the ballpoint in the frames — per Tushar's own brief.
Background props kept: Rubik's cube (a nice "mind at work" note) + AirPods, both deep out of focus; a small vermilion hanko seal + paste tin added among them (the only red in frame — brand echo).

---

## Credit math — actuals

| Step | Estimated | **Actual** | Status |
|---|---|---|---|
| Start image (nano_banana_pro × 2 variants) | ~4–8 | **~4** | ✅ done — keeper: variant A |
| Draft pass: full choreography, 10s @ 480p | 30 | **25** | ✅ done — **passed** |
| Master: 30s one-take @ 720p | 195 | 195 | ⏳ awaiting go |
| 2K upscale (AIGC preset) | small | — | pending |
| **Balance** | 411 at start | **382 now** | ~187 would remain after the master |

The hero film **replaces** the Design.md §1.2 "hero macro" still. The scan-guide gallery tiles (~8 images, ~15–20 credits) still fit within the remainder.

---

## STEP 1 — Start image ✅ DONE (2026-09-01)

**Keeper: variant A — job id `be01148d-e2fe-4228-be28-a704bfdcfb1f`.** Pass this as `start_image` on every clip.
Both variants nailed the brief (fountain pen with gold nib, unlined cream sheet, correctly spelled cursive, hanko seal + paste tin, warm lamp). **A was chosen** for: deckle-edged handmade paper (more atelier, less stationery), genuinely dark shadows in the corners — the Oryzo "warm near-black void" grade — and higher separation between the glowing paper and the ground. B was uniformly golden-lit, its paper read as kraft rather than cream, and its background props were brighter and more in focus.

⚠️ **Open note — the Rubik's cube.** It brings saturated blue/green/orange into a palette whose whole discipline is *vermilion is the only saturated hue* (`Design.md` §2.1). It survives in the keeper because it sells "a mind at work" and it is Tushar's own idea. Mitigation applied in the video prompts: *"background objects deep in shadow with muted desaturated colours."* If it still fights the grade in the master, a ~4-credit start-image re-roll with the cube pushed further into darkness is the cheap fix.

Model: `nano_banana_pro` · aspect 16:9 · 2 variants, keep one.

```
Cinematic macro photograph, low side angle from the left: a right hand holding a
luxurious glossy black-lacquer fountain pen with a gold nib, mid-stroke writing
elegant cursive on a loose sheet of unlined warm cream paper, on a dark walnut
desk. The sentence "The best way to predict the future is to create it." is
already written in refined cursive ink, perfectly spelled. Background, deeply out
of focus: a Rubik's cube, white wireless earbuds in an open case, a small
vermilion-red Japanese hanko seal beside a red paste tin. Lighting: one warm
low practical lamp from the left, paper glowing as the only bright surface,
shadows falling to warm near-black, amber rim light on the pen barrel. Shallow
depth of field, visible film grain, premium product-film color grade, warm
dark cinematic still-life. No readable branding on any object. No watermark.
```

---

## API gotchas (learned the hard way, 2026-09-01 — read before calling)

1. **`mode: "omni_reference"` must be passed explicitly.** Omitting it defaults to `t2v`, which rejects `start_image` with a 422: *"mode 't2v' does not accept reference media."*
2. **The platform intercepts dark prompts with a house preset** (this run: "IN THE DARK"). This is wall #3 in Tushar's Prompt Pack. **Decline it** — resubmit the identical prompt with `declined_preset_id: "<the id returned>"`. Accepting the preset would override our choreography with a template.
3. **Real cost is lower than the pack's estimate:** 10s @ 480p = **25 credits** (pack said 30). Always `get_cost: true` first — it validates the params *and* prices the job without submitting.
4. `resolution` and `generate_audio` are top-level params, not nested.

---

## STEP 2 — Draft pass (25 credits, kills the riskiest assumption first)

The twirl + toss is the hardest beat for any video model (finger dexterity + object physics). **Refinement over the original plan:** rather than testing the toss in isolation, the 10s draft compresses the *entire* choreography — side macro → arc to top-down → twirl → toss. Same price, and it validates the camera arc as well as the hand work. If all three read cleanly at 480p, the 30s master inherits the direction.

Model: `seedance_2_5` · **mode `omni_reference`** · `start_image` = Step 1 job id · duration 10 · 480p · 16:9 · `generate_audio false` · `declined_preset_id` as needed.

**Draft actually run (job `3f49975f-fe1d-4821-a7ca-6f06e14de5b3`):** the Step 3 master prompt compressed to 10 seconds, plus the added grade note *"background objects deep in shadow with muted desaturated colours"* — see the Rubik's-cube note under Step 1.

```
One continuous unbroken cinematic shot, a single take with no cuts and no camera
shake. Top-down view of the same right hand from the reference image holding the
same glossy black fountain pen with gold nib above a loose cream unlined sheet on
a dark walnut desk. The hand pauses writing, then playfully spins the pen one
smooth full rotation between index finger and thumb, fingers relaxed and precise,
the pen staying sharp in focus. Then the hand flicks the pen straight upward like
a coin toss: the pen rises toward the camera, rotating slowly end over end, gold
nib catching the warm lamplight, background falling away into soft warm darkness.
One continuous shot, no cuts. Warm near-black cinematic grade, cream paper the
only bright surface, film grain, shallow depth of field, premium product-film
cinematography.
```

**Keep-gate:** fingers stay anatomically clean through the twirl; pen stays rigid and glossy; toss reads as one motion. If it fails twice, fallback plan B below.

### ✅ Draft verdict (2026-09-01) — PASSED, proceed to master

Assets: `assets/hero/draft-480p-choreography.mp4` + `assets/hero/draft-contact-sheet.jpg` (10 frames @ 1fps).

| Beat | Result |
|---|---|
| Side macro writing (0–1s) | ✅ Matches the start image exactly; ink and paper hold |
| Arc toward overhead (1–4s) | ⚠️ Smooth and continuous, but **stops at an elevated three-quarter, never reaches a true flat lay** |
| Pen twirl (5–7s) | ✅ **Fingers stay anatomically clean** — the single biggest risk, cleared |
| Toss toward camera (7–9s) | ✅ Reads as one motion, pen rises into the lens, gold nib flares |
| Floating-pen end state (9–10s) | ⚠️ Correct staging but **too defocused** — the hero's guiding object must be sharp |
| Written text across all frames | ✅ Stable and legible throughout — no morphing (a real risk with generated text) |

**Three fixes folded into the Step 3 master prompt below:**
1. Demand a **true bird's-eye flat lay** ("directly overhead, the page flat and square to frame"), not merely "top-down".
2. Keep the **pen in sharp focus** as it approaches the lens; only the background falls away.
3. Push the background props **deeper into shadow in the opening seconds**, where the Rubik's cube's saturation fights the palette.

---

## ⚠️ MASTER v2 VERDICT (2026-09-01) — mostly excellent, one real defect

**Rendered:** `assets/hero/master-720p-30s.mp4` (30.04s, 1280×720, 6.4 MB) · job `d7174781-47f0-4d19-80b0-0abfceaf3fb9` · contact sheet `assets/hero/master-contact-sheet.jpg`.

**What the two fixes bought us:**
- ★ **Pen stays sharp on the rise — fixed and outstanding.** The final ~8 seconds are exactly the Oryzo end state: the pen standing vertical, crisp, centred, gold bands catching the light, background fallen to warm near-black void. This is the scroll-guiding object and it is perfect.
- ★ **Props deeper in shadow — fixed.** The Rubik's cube is materially dimmer than in the draft and stops competing with the page.
- ⚠️ **True bird's-eye — still not reached.** The arc tops out around 60–70°, not perpendicular. Cosmetic; it reads well regardless. Not worth re-rolling for.

### ❌ The defect: the sentence gains a spurious word

The page reads **"The best way to / predict the future is to / create it.create."** — the model appended a second *"create."* because the prompt told the hand to keep writing and to "finish a word", so it obligingly generated more text. The calligraphy is beautiful and stable (no morphing, no garbling) — it is simply **one extra word, cleanly and legibly wrong**.

**Why it matters here specifically:** this is a handwriting-analysis site. Legibly incorrect handwriting in the hero undermines the exact competence we are selling. Visitors will read that line.

**Where it appears:** clean for roughly the first 8 seconds; the spurious word lands around 8–10s and stays visible through the flat-lay section (~10–22s); irrelevant in the final third once the paper leaves frame.

**Root cause (fix for any re-shoot):** the prompt must state that the writing is *already finished*. Remove every instruction that implies new ink — "keeps writing", "finishes a word", "glides across the sheet writing". Replace with: *"The sentence is already fully written and never changes; no new words appear; the nib glides just above the paper without adding any ink."*

### Options (Tushar's call — a full 30s re-roll is NOT affordable)

| Option | Cost | Trade-off |
|---|---|---|
| **A · Re-shoot shorter (15s) with the corrected prompt** | ~98 cr | Affordable, fixes it at source. 180 frames from 15s is still a smooth scrub. **Recommended.** |
| **B · Crop the scrub framing** | 0 cr | Compose the canvas so the third line sits outside the viewport during the flat-lay beats. Free, but constrains the hero composition. |
| **C · Ship as-is** | 0 cr | The ending is superb and the copy scrim covers part of the page. But the wrong word is legible for a third of the scroll. |
| **D · Patch in post** | 0 cr | Clone blank paper over the extra word across the affected frames. The page rotates through the arc, so this is fiddly and likely to look retouched. |

---

## STEP 3 — Master: the 30-second one-take (195 credits) ✅ RUN — see verdict above

Model: `seedance_2_5` · **mode `omni_reference`** · `start_image` = `be01148d-e2fe-4228-be28-a704bfdcfb1f` · duration 30 · **720p** · 16:9 · `generate_audio false` · decline any preset interception.

**v2 — the three draft fixes are baked in (marked ★):**

```
One continuous unbroken 30-second cinematic shot, a single take with no cuts and
no camera shake, premium product-film cinematography throughout. The same right
hand from the reference image with the same glossy black-lacquer fountain pen with
gold nib, the same loose cream unlined paper on the same dark walnut desk.

The camera starts in a low side macro from the left, extremely close: the gold
nib glides across the cream sheet writing flowing elegant cursive, wet ink
glistening for a moment behind the nib, the already-written cursive line staying
exactly as it is. ★ The background objects sit deep in shadow throughout, their
colours heavily muted and far out of focus, so the cream page is the only bright
surface in frame.

The camera then arcs slowly and smoothly up and over the hand in one continuous
move, ★ rising all the way into a true bird's-eye overhead shot looking straight
down, the sheet of paper lying perfectly flat and square to the frame in a clean
overhead flat lay, while the hand keeps writing calmly below.

The hand finishes a word and pauses. It playfully spins the pen one smooth full
rotation between index finger and thumb, relaxed and precise. Then it flicks the
pen straight up like a coin toss: the pen rises directly toward the camera in
slow motion, rotating gently end over end, gold nib flashing in the warm
lamplight, the desk and paper falling away below into soft warm darkness.
★ The pen itself stays crisply in sharp focus for the entire rise, every detail
of the lacquer barrel and the engraved gold nib readable, while only the
background blurs away, until the pen hangs large, sharp and centred against a
warm near-black void, still slowly rotating as the take ends.

Constant gentle camera motion only, one continuous shot, no cuts, no camera
shake, no hard exposure changes. Color grade: warm near-black shadows, cream
paper as the only light source, amber practical light, subtle film grain,
photoreal, luxurious and calm.
```

**Why the ending matters:** the final ~4 seconds (pen floating on dark void) are the handoff — those frames ARE the "Oryzo coaster" state. The scroll journey ends, and any later section can reuse a final frame as a static floating-pen figure.

## STEP 4 — Upscale & slice

1. Upscale the keeper to **2K, AIGC preset** (`upscale_video`).
2. Slice **180 frames, 1600px wide, JPEG quality 86**: `ffmpeg -i hero_2k.mp4 -vf "fps=6,scale=1600:-2" -q:v 3 frames/hero_%03d.jpg` (adjust fps so total ≈ 180).
3. Also export: `hero-poster.jpg` (frame 1, the static no-JS/reduced-motion hero) and `hero-mobile.mp4` (≤768px fallback: H.265/VP9, ~1.5 MB, 10s excerpt of beats 1–2, autoplay muted loop).

## STEP 5 — Build instruction (paste to Claude at build time, per Website Pack pattern)

```
Wire the Tegaki hero as a canvas scroll-scrub per Design.md §4.2: preload the 180
frames with a percentage counter styled as the loading moment (Geist Mono, shu
accent, wipes away at 100), paint to a full-bleed <canvas> keyed to scroll
progress across the pinned landing chapters — hero copy (lower-left over a
gradient scrim, never centered over the pen) → how-it-works → tagline → tiers —
so scrolling writes, arcs overhead, twirls, and tosses the pen toward the
visitor, the float landing at the final CTA. Desktop/tablet only; at ≤768px and
under prefers-reduced-motion or no-JS serve hero-poster.jpg (mobile may use the
1.5 MB hero-mobile.mp4 loop instead). Scrubbing must be smooth backwards and
forwards. Launch on localhost and verify the scrub end to end at 1440px and the
poster fallback at 375px before reporting done.
```

---

## Plan B (if the twirl/toss draft fails twice)

Split into two chained clips (same references, same grade): **Clip A** (18s): side macro → arc to top-down, continuous writing. **Clip B** (12s): `start_image` = Clip A's final frame; twirl → toss → float. Cut together — the top-down pause hides the seam. Cost: 117 + 78 = 195, same total.

## Not doing (decided)

- No Three.js/GLB pen — the "3D" comes entirely from the video scrub (Website Pack's core trick), which matches the no-WebGL decision in Design.md §4.1.
- No audio (`generate_audio false`) — frames are harvested, video is never published with sound.
- No readable new words mid-video (mangled-text risk); the finished quote lives only in the start image where the image model renders it reliably.
