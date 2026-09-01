# Plan — T08 · Status rail, expected delivery, re-upload loop, parked

> **Ticket:** T08 · **Phase 3** · **Blocked by:** T07.
> **Delivers:** the customer-side lifecycle: the 4-node status rail, expected delivery, the rejection → re-upload → back-in-review loop, and automatic parking after 14 days.

## Design decisions locked here

- **Parking is lazy + swept:** a security-definer `park_overdue_orders()` transitions any `needs_reupload` order past its `reupload_deadline` (via `transition_order`, system actor). It runs on dashboard and admin-queue load (cheap, deterministic) and T15's cron sweeps it daily as the backstop. No customer ever sees a stale un-parked order.
- **Re-upload reuses `SampleUploader`** (T04) with `version = max+1`; history is never overwritten.
- The rail maps 1:1 to PRD §6.6 — no invented states, `needs_reupload`/`parked` replace the rail with their panels.

## Tasks

**A1 · Migration: `park_overdue_orders()`** + buyer resubmit support: extend `transition_order()` so `needs_reupload → sample_under_review` (buyer, owner) requires ≥1 file row with the **latest version** newer than the rejection, and clears… no — **history stays**: it nulls nothing, but stamps `resubmitted_at` (new column) and the customer view keys off status. Add `resubmitted_at timestamptz`.
*Gate:* SQL tests — resubmit without a new-version file raises; with one, transitions; parking moves only past-deadline rows.

**A2 · Status rail component** — `src/components/orders/status-rail.tsx`: nodes Sample review → Analysis → Report → Delivered (done = ok check, active = shu pulse pausing on `visibilitychange`, future = ink-700), Geist Mono labels.
*Gate:* renders correctly for every §6.6 status; pulse pauses when the tab hides; reduced-motion = no pulse.

**A3 · Dashboard card upgrade** — subject name (serif), tier + order id (Geist Mono), the rail, `expected_delivery_date` ("Expected by {date}") once approved.
*Gate:* every status renders its correct card variant (storybook-style states on `/styleguide` or fixtures in e2e).

**B1 · Needs-re-upload panel** — err-tinted common-region panel: heading "Your sample needs another try", the admin's `rejected_reason` **verbatim**, the re-upload deadline date, `SampleUploader` inline (new version), and a "Resubmit sample" action calling the transition.
*Gate:* e2e round trip — reject (as admin) → panel shows reason → upload v2 → resubmit → chip back to `sample_under_review`; v1 files still in the DB.

**B2 · Parked panel** — neutral notice ("This order is parked — the re-upload window closed."), contact escape hatch (mailto + WhatsApp deep-link from PRD contact), no dead ends.
*Gate:* renders when parked; links resolve.

**B3 · Wire the sweep** — call `park_overdue_orders()` in the dashboard and admin-queue loaders.
*Gate:* with a fixture deadline in the past, loading the dashboard flips the order to `parked` (controlled-clock test: set `reupload_deadline` directly in the fixture).

**C1 · Tests** — SQL: A1 matrix additions; e2e: B1 round trip; controlled-clock parking at deadline−1h (not parked) and +1h (parked); rail render per status.
*Gate:* green.

## Definition of done
- [ ] Reject → re-upload → resubmit round trip works on the deployed URL with version history intact.
- [ ] Parking triggers exactly at the 14-day boundary under a controlled clock, via the transition function only.
- [ ] Rail + panels cover every status with no invented states; four screen states on the dashboard remain intact.
