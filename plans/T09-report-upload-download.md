# Plan — T09 · Report upload and download

> **Ticket:** T09 · **Phase 3** · **Blocked by:** T07.
> **Delivers:** the `reports` table + private bucket, admin PDF upload with the mandatory validation attestation (→ `completed`), and the customer's signed-URL download.

## Design decisions locked here

- **Buyers never touch the `reports` bucket directly.** No buyer storage policy exists; downloads go through a server action that verifies ownership and mints a 60-second signed URL. Admin writes via an admin storage policy.
- **The validation gate is explicit:** the upload form carries a required attestation checkbox — "I have validated this report" — because *nothing unvalidated ever reaches a customer* (PRD §7.4). `validated_at` is stamped from it.
- **Download filename is human:** `Tegaki-{subject}-{tier}-{YYYY-MM-DD}.pdf` via the signed URL's download parameter.

## Tasks

**A1 · Migration: `reports`** — `id uuid pk`, `order_id uuid not null unique references orders(id)`, `bucket_path text not null unique`, `file_name text not null`, `size_bytes int not null`, `validated_at timestamptz not null`, `uploaded_by uuid not null references profiles(id)`, `created_at`. RLS: buyer select own (order join); admin all; **no client insert** (insert happens in a definer function `attach_report()`).
*Gate:* db reset clean; psql denial checks.

**A2 · Migration: `reports` bucket + policies** — private bucket, PDF only, 25 MB cap; storage policies: admin insert/select/delete; nothing else.
*Gate:* buyer direct storage read denied.

**A3 · Migration: `attach_report(order_id, path, name, size)`** — definer: `assertAdmin` equivalent in SQL (`is_admin()`), requires order status `report_generating`, inserts the row with `validated_at = now()`, calls `transition_order(→completed)`.
*Gate:* SQL tests — from `report_generating` succeeds; from any other status raises; non-admin raises; second attach raises (unique order_id).

**B1 · Admin upload UI** — on `/admin/orders/[id]`: PDF-only dropzone (T02 shell), the required attestation checkbox with the exact copy above, upload → storage (admin policy) → `attach_report()`.
*Gate:* unticked attestation blocks with a specific message; success flips the order to `completed` in the queue.

**B2 · Customer download** — on the completed dashboard card: primary "Download report (PDF)" → server action (ownership check → 60s signed URL with `download` filename) + the note "Also sent to your email/WhatsApp by Tushar."
*Gate:* downloaded file opens; filename matches the pattern; URL dead after expiry.

**B3 · Status copy** — completed card shows delivered-state rail (Report done; Delivered pending until T10's mark-delivered).
*Gate:* visual per `Design.md` rail spec.

**C1 · Security tests** — `tests/rls/reports.test.ts`: B cannot fetch A's report row nor a signed URL via the action (forged orderId → rejected); anonymous denied; buyer denied direct storage read.
**C2 · E2E round trip** — seed order to `report_generating` (via transition function as admin) → admin uploads a real small PDF with attestation → customer downloads it and the bytes match.
*Gate (both):* green.

## Definition of done
- [ ] Only admin can attach; only from `report_generating`; attestation mandatory and stamped.
- [ ] Owner-only download via expiring signed URL with a human filename, proven cross-account.
- [ ] Real PDF round-trips byte-identical on the deployed URL.
