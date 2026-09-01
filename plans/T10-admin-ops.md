# Plan — T10 · Admin operations: status controls, mark delivered, pause switch

> **Ticket:** T10 · **Phase 3** · **Blocked by:** T07.
> **Delivers:** the `settings` table with the pause switch (enforced server-side), the remaining manual status controls, and mark-delivered — the timestamp T15's retention clock counts from.

## Design decisions locked here

- **Pause is enforced where orders are created, not where the button lives:** `createDraftOrder()` and `submit_order()` both check the setting server-side and fail with the specific "temporarily closed" error; the wizard shows the designed closed-notice card. Hiding UI is not enforcement.
- **Status controls are generated from the transition matrix** (exported from one place) — the UI can only ever offer edges the function will accept, so the two can't drift.
- `delivered_at` lands on `orders` here; `transition_order()` gains no new edges (mark-delivered is a stamp on an already-`completed` order, not a state).

## Tasks

**A1 · Migration: `settings`** — `key text pk`, `value jsonb not null`, `updated_at`; seed `('pause_new_orders','false')`. RLS: authenticated select; admin update (via `is_admin()`).
*Gate:* buyer can read, cannot write.

**A2 · Migration: `delivered_at timestamptz` on `orders`** + definer `mark_delivered(order_id)` (admin, requires `completed`, stamps once — second call raises).
*Gate:* SQL tests: happy, wrong-status, double-call, non-admin.

**B1 · Settings helpers** — `src/lib/settings.ts`: `isPaused()` (server), `setPaused(bool)` (admin action with `assertAdmin`).
**B2 · Enforce pause** — guard both order-creation paths; error message: "Tegaki is temporarily closed to new orders — existing orders are unaffected."
*Gate:* with pause on, a **direct server-action call** (not the UI) is rejected; an in-flight draft's other stages still work; submit of an existing draft — decision: **submit stays allowed** (the pause protects Tushar's queue from *new* work; a customer mid-wizard finishing is one order, not a flood). Test asserts exactly this behaviour.

**B3 · Wizard closed notice** — when paused, the wizard entry (`New request` action + wizard index) renders the designed closed card ("Temporarily closed — back soon", contact link) instead of creating drafts.
*Gate:* visible at 375px; existing orders' dashboards unaffected.

**B4 · Admin settings page** — `/admin/settings`: the pause toggle (warn-tinted when on, with consequence copy), current queue counts.
*Gate:* toggling persists and reflects immediately in a second browser.

**B5 · Manual status controls** — on order detail: buttons rendered from the allowed-edges export for the current status (in practice: `analysis_in_progress → report_generating`), each with a confirm dialog; **mark delivered** on completed orders (stamps `delivered_at`, rail shows Delivered).
*Gate:* only legal edges ever render; illegal direct calls raise (reuse C-suite tests).

**C1 · Tests** — pause on/off matrix incl. direct-call bypass attempt; mark-delivered suite; a static assertion that no app code writes `orders.status` (grep test: the string `update` + `status` on orders outside migrations fails the suite — crude but effective, and the column grant already enforces it at runtime).
*Gate:* green.

## Definition of done
- [ ] Pause blocks new orders server-side, leaves in-flight work alone, and shows the designed notice.
- [ ] Mark-delivered stamps once, admin-only, visible on the customer rail.
- [ ] Every status mutation in the codebase routes through the SQL functions — verified by grant, grep, and tests.
