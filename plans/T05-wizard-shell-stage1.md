# Plan — T05 · Wizard shell + stage 1 (profile & subject)

> **Ticket:** T05 · **Phase 2** · **Blocked by:** T02, T03.
> **Delivers:** the 4-stage wizard shell (stepper, resume, direction-aware transitions) and stage 1 with the self/other choice and the consent gate.

## Design decisions locked here

- **Route shape:** `src/app/(app)/wizard/[orderId]/layout.tsx` (stepper + guard) with stage pages `profile/`, `upload/`, `tier/`, `checkout/`. The layout loads the order server-side; not-owner or not-`draft` → redirect to `/dashboard`.
- **Resume = `orders.wizard_stage`** (1–4). The layout redirects any deeper URL back to the furthest allowed stage; completing a stage advances it. Field values live on the order row, so resume is free.
- **Validation is one Zod schema per stage** in `src/lib/orders/wizard-schema.ts`, shared by client (inline errors) and server action (authoritative).

## Tasks

**A1 · Migration: stage-1 columns on `orders`** — `full_name text`, `age int check (age between 5 and 120)`, `gender text`, `city text`, `country text`, `email text`, `phone text`, `whatsapp_preferred boolean not null default false`, `subject_is_self boolean not null default true`, `subject_name text`, `subject_age int`, `consent_given_at timestamptz`, `guardrails_acked jsonb not null default '{}'`. Extend the T03 column grant to make these buyer-updatable (status stays locked).
*Gate:* db reset clean; psql confirms `status` still not writable.

**A2 · Zod stage-1 schema** — required name/age/email/phone/city/country; gender optional (used only for report pronouns — say so in helper text); `subject_is_self=false` ⇒ `subject_name` + `subject_age` required **and** `consent` must be `true` (refine with the specific message: "Please confirm you have this person's consent to analyse their handwriting.").
*Gate:* unit tests: happy self, happy other, other-without-consent fails with that exact message, age bounds, email/phone formats.

**B1 · Wizard layout + guard** — loads order, renders the T02 stepper (labels: PROFILE · SAMPLE · TIER · CONFIRM) with completed/current/future states from `wizard_stage`, tier/price summary line once `tier` is set, and the stage outlet.
*Gate:* deep-linking to `/tier` with `wizard_stage=1` redirects to `/profile`; non-owner redirected out.

**B2 · Stage transitions** — direction-aware panel animation per `Design.md` §4.3 (enter `translateX(24px)`+fade 220ms `--ease-out`, reverse for Back); connector wipe on advance; reduced-motion renders instantly.
*Gate:* forward and back both animate correctly; reduced-motion pass.

**B3 · Stage-1 form** — T02 field primitives, groups per `Design.md` §3.4 (16px in-group, 32px between): identity, contact (+WhatsApp toggle), then "Who is this analysis for?" as two selectable common-region cards (Myself / Someone else); the latter expands subject fields + consent checkbox. Primary action full-width at column bottom.
*Gate:* keyboard-only completion; visible labels; error summary focuses the first invalid field.

**B4 · Server action `saveStage1`** — validates with the Zod schema server-side, writes the columns, stamps `consent_given_at` when consent ticked, sets `wizard_stage=2`, redirects to `upload/`.
*Gate:* forged submissions (missing consent, not-owner) rejected server-side regardless of client state.

**B5 · Mount stage 2** — move the T04 `SampleUploader` + checklist + gallery into `upload/page.tsx`; continue requires ≥1 uploaded file; advances `wizard_stage=3`. Delete the T04 demo route.
*Gate:* stage 2 works inside the shell; demo route gone.

**C1 · Resume E2E** — fill stage 1 → leave to dashboard → "Continue" on the draft card (add the card action) → land on stage 2 with stage-1 values persisted.
**C2 · Consent-gate E2E** — "someone else" without consent blocks with the inline message; ticking it proceeds.
*Gate (both):* green headless.

## Definition of done
- [ ] Resume restores stage + values; deep links clamp to the allowed stage.
- [ ] Consent is a hard server-side gate with a specific message.
- [ ] Stage 1+2 run inside the shell with direction-aware transitions.
- [ ] Standing gates (states / 375px / a11y / tokens) verified on both stages.
