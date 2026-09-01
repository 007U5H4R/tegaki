# Plan — T04 · Private sample upload ⚠️ riskiest slice

> **Ticket:** T04 · **Phase 2 · Core loop** · **Blocked by:** T03.
> **Delivers:** versioned uploads to a **private** bucket with cross-account denial proven at the storage-policy level, plus the stage-2 UI: guardrails checklist gating the dropzone, ideal-vs-rejected gallery, multi-file upload with progress/remove/retry.
> **Why early:** this is where the project can actually fail — sensitive handwriting images behind storage policies, RLS, and signed URLs. Everything after is ordinary CRUD.

## Design decisions locked here

- **Storage path is the security boundary:** `samples/{auth.uid()}/{order_id}/v{version}/{uuid}.{ext}`. Policies key on `(storage.foldername(name))[1] = auth.uid()::text` — the canonical Supabase pattern. Nobody else can read, list, or write under another user's folder; there is **no** public read.
- **Client uploads directly to storage** with the authenticated client (progress events for free); a server action then records the `order_files` row. An orphaned object without a row is harmless (invisible, and swept by T15); a row without an object is prevented by inserting only after upload success.
- **Viewing is via short-lived signed URLs** minted server-side (owner or admin) — never raw storage URLs.
- **The uploader is a standalone component** (`SampleUploader`) so T05's wizard shell and T08's re-upload panel both consume it unchanged.

## Tasks

**A1 · Migration: `order_files`** — `id uuid pk`, `order_id uuid not null references orders(id) on delete cascade`, `uploader_id uuid not null references profiles(id)`, `version int not null default 1`, `bucket_path text not null unique`, `file_name text not null`, `mime text not null`, `size_bytes int not null`, `created_at`. Index on `(order_id, version)`.
*Gate:* db reset clean.

**A2 · Migration: RLS on `order_files`** — select/insert where the caller owns the parent order (`exists` subquery); insert additionally requires the parent order's status to be `draft` **or** `needs_reupload`; no update; delete only while the parent is `draft`.
*Gate:* psql — B cannot see A's rows; inserting against another's order fails; delete blocked once submitted.

**A3 · Migration: `samples` bucket + storage policies** — private bucket, 20 MB object limit, allowed MIME `image/jpeg, image/png, application/pdf`. Policies on `storage.objects` for bucket `samples`: insert/select/delete where first path folder = `auth.uid()`; delete additionally only while the linked order is still `draft` (path folder 2 = an order the caller owns in draft). No anonymous policy of any kind.
*Gate:* psql/policy test — cross-folder access denied in every verb.

**B1 · Upload helpers** — `src/lib/uploads/validate.ts` (type + size, specific error strings), `src/lib/uploads/paths.ts` (path builder + next-version resolver), `src/lib/uploads/signed-url.ts` (server-only `getSampleUrl(fileId, ttl=600)` for owner/admin — used by T07/T08).
*Gate:* unit tests: wrong type, oversize, version increments, path shape.

**B2 · Server actions** — `recordUpload(orderId, uploadedObject)` inserts the row (re-validating ownership + status); `removeUpload(fileId)` deletes row + object (draft only).
*Gate:* action-level tests incl. a forged `orderId` belonging to another user → rejected.

**C1 · `SampleUploader` component** — `src/components/upload/sample-uploader.tsx` on the T02 dropzone shell: multi-file, client validation before upload, per-file progress (`scaleX` bar), remove ✕, failed-file inline error + retry **without restarting the wizard**; list announces via `aria-live="polite"`.
*Gate:* happy path, rejected type, oversize, simulated network failure + retry — all through the UI.

**C2 · Guardrails checklist** — the four PRD items (unlined paper · 2+ pages · 3 original signatures · spontaneous original text) as required ticks; the dropzone stays disabled until all four are ticked (deliberate friction that prevents rejects). State persists with the draft (columns `guardrails_acked jsonb` via a small migration, or localStorage? — **persist on the order**: it survives resume and is auditable).
*Gate:* dropzone disabled → enabled flips only at 4/4; resume restores ticks.

**C3 · Ideal-vs-rejected gallery** — paired tiles with ✓/✕ badges (ok/err tints), T02 lightbox on tap, keyboard-navigable. Ships with **honest placeholder tiles** (labelled "guide image pending") until C4 swaps in real images.
*Gate:* lightbox keyboard pass; placeholders clearly labelled.

**C4 · Demo page** — temporary route `(app)/wizard-upload-demo/[orderId]` mounting checklist + gallery + uploader for this ticket's demo (T05 replaces it with the real stage-2 route and deletes the demo).
*Gate:* full stage-2 experience demoable against a real draft order.

**D1 · Storage security test suite** ⚠️ the ticket's core criterion — `tests/rls/storage-samples.test.ts`:
1. anonymous request to a raw object URL → denied;
2. user B `download`/`list`/`createSignedUrl` on A's path → denied;
3. owner signed URL works, then **expires** (short TTL) → denied;
4. upload to another user's folder → denied;
5. delete after submit → denied.
*Gate:* all five, and loosening the select policy breaks test 2 (prove the test bites).

**D2 · E2E** — `e2e/upload.spec.ts`: tick guardrails → upload 2 files → rows appear v1 → remove one → re-add.
*Gate:* green headless.

## Definition of done
- [ ] Bucket private; the five-way storage security suite passes and provably bites.
- [ ] Versioning recorded; re-upload path ready for T08.
- [ ] Specific inline errors for type/size/network; retry works mid-wizard.
- [ ] Checklist gates the dropzone and persists on the order.
- [ ] Four screen states on the uploader surface; a11y announcements in place.
