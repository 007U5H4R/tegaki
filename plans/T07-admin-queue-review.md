# Plan — T07 · Admin queue + sample review (approve / reject)

> **Ticket:** T07 · **Phase 3 · Fulfillment** · **Blocked by:** T04, T06.
> **Delivers:** the allowlisted admin surface: queue, sample viewer via signed URLs, approve (clock starts) and reject-with-reason.

## Design decisions locked here

- **Two-layer admin guard:** `src/app/admin/layout.tsx` checks `profiles.role='admin'` for the UI, **and** every admin server action calls `assertAdmin()` (`src/lib/auth/assert-admin.ts`) — route protection alone is not security.
- **Admin data access via RLS policies, not the service key:** a SQL helper `is_admin()` (checks the caller's profile role) backs `admin can select/all` policies on `orders`/`order_files`. The service-role key stays reserved for cron (T15) and tests.
- **`expected_delivery_date` is stored at approval** (approval date + tier days), never recomputed at render — one fact, one place.
- Admin surfaces skip decorative motion entirely (`Design.md` §3.7).

## Tasks

**A1 · Migration: `is_admin()` + admin policies** — `is_admin()` stable security-definer; policies: admin full select on `orders`, `order_files`, `payments`, `profiles`.
*Gate:* psql — admin sees all rows; a buyer still sees only their own (rerun the T03/T04 RLS suites — they must stay green).

**A2 · Migration: review columns on `orders`** — `approved_at timestamptz`, `expected_delivery_date date`, `rejected_reason text`, `reupload_deadline timestamptz`. Extend `transition_order()` stamps: → `analysis_in_progress` requires admin and stamps `approved_at`, computes `expected_delivery_date` from a SQL tier→days map; → `needs_reupload` requires admin, requires a non-empty reason argument (add `p_reason` param), stamps `rejected_reason` + `reupload_deadline = now() + interval '14 days'`.
*Gate:* SQL tests per tier (3/5/7 days), reason-required, buyer attempting either edge → raises.

**B1 · `assertAdmin()` helper** — throws unless the session's profile role is admin; unit-tested.
**B2 · Admin layout + guard** — `/admin` layout: role check, slim admin nav (Queue · Settings), no animation.
*Gate:* non-admin signed-in user → redirect; anonymous → sign-in.

**B3 · Queue page** — `/admin/page.tsx`: orders newest-first as dense rows (subject, tier, buyer email, submitted date, status chip), filter chips per status with counts, empty/loading/error states.
*Gate:* filters work; four states real.

**B4 · Order detail** — `/admin/orders/[id]/page.tsx`: buyer + subject fields (incl. consent timestamp when subject≠self), guardrails-acked display, file list with thumbnails.
*Gate:* renders a real submitted order completely.

**B5 · Sample viewer** — signed URLs via the T04 helper (10-minute TTL) rendered in a washi-surface viewer (image inline, PDF embedded), plus download links.
*Gate:* URL works, then expires (short-TTL test); a buyer hitting the admin action path is rejected by `assertAdmin()`.

**B6 · Approve action** — confirm dialog stating the consequence ("Starts the N-day clock — expected delivery {date}"), then `transition_order(→analysis_in_progress)`.
**B7 · Reject action** — required-reason textarea (specific validation message), then `transition_order(→needs_reupload, reason)`. The reason is shown verbatim to the customer (T08) — say so in the dialog ("The customer will see this exact text.").
*Gate (B6/B7):* stamps and dates land correctly per tier; empty reason blocked client- and server-side.

**C1 · Authorization test suite** — `tests/admin/authz.test.ts`: every admin server action called as a non-admin → rejected; as anonymous → rejected.
**C2 · E2E** — `e2e/admin-review.spec.ts`: admin signs in → sees the T06 test order → rejects with a reason → order shows `needs_reupload`; second order approved → `analysis_in_progress` with the right expected date.
*Gate (both):* green.

## Definition of done
- [ ] Non-admin access denied at route **and** action level, proven by tests.
- [ ] Approve stamps `approved_at` + stored `expected_delivery_date` per tier.
- [ ] Reject requires a reason; reason + 14-day deadline persisted.
- [ ] Sample viewing only via expiring signed URLs.
- [ ] Existing RLS suites still green (admin policies widened nothing for buyers).
