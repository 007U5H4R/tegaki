# Plan — T03 · Draft order + dashboard list

> **Ticket:** T03 · **Phase 2 · Core loop** · **Blocked by:** T01, T02.
> **Delivers:** the `orders` table with the complete status machine enforced **in the database**, a "New request" action creating a draft, and the dashboard listing the user's orders — with cross-account isolation proven.

> ⚠️ **Project-wide migration rule (set at project creation, 2026-09-01).** The Supabase project has *Automatically expose new tables* **disabled** and *automatic RLS* **enabled**. So every migration that creates a table must **explicitly grant** what the API roles may do — e.g. `grant select, insert on <table> to authenticated;` — or the table is invisible to PostgREST. This is deliberate: nothing is reachable until we say so. It applies to T03, T04, T06, T09, T10 alike.

## Design decisions locked here

- **The status machine lives in Postgres.** A `security definer` function `transition_order(order_id, new_status)` owns every status change, validating the edge against the PRD §6.6 matrix **and the caller's role**. Column-level grants prevent any direct `status` write by clients. App code never writes `status` — it calls the function. (*Invariants enforced closest to the data.*)
- **Each later ticket adds its own columns via its own migration** — T03 creates only what the draft flow needs.
- **Tier metadata is a shared constant** — `src/lib/tiers.ts` (name, price ₹, turnaround days, page range, contents bullets) — single source for wizard, dashboard, and landing.

## Tasks

**A1 · Migration: `orders`** — `supabase/migrations/<ts>_orders.sql`: `id uuid pk default gen_random_uuid()`, `buyer_id uuid not null references profiles(id)`, `status text not null default 'draft'` with a CHECK across all seven states (`draft`, `sample_under_review`, `needs_reupload`, `analysis_in_progress`, `report_generating`, `completed`, `parked`), `tier text null check (tier in ('express','core','comprehensive'))`, `wizard_stage int not null default 1`, `submitted_at timestamptz`, `created_at/updated_at` + touch trigger.
*Gate:* `pnpm supabase db reset` clean.

**A2 · Migration: RLS + column grants** — enable RLS: buyer `select`/`insert`/`update` own rows (`buyer_id = auth.uid()`), update only while `status = 'draft'`. Then `revoke update on orders from authenticated; grant update (tier, wizard_stage, updated_at) on orders to authenticated;` — **`status` is not client-writable at all.**
*Gate:* in `psql` as an authenticated user: updating own draft's `tier` succeeds; updating `status` fails with permission denied.

**A3 · Migration: `transition_order()`** — `security definer` function holding the full §6.6 edge list with the allowed actor per edge:
| Edge | Actor |
|---|---|
| draft → sample_under_review | buyer (owner) |
| sample_under_review → needs_reupload | admin |
| sample_under_review → analysis_in_progress | admin |
| needs_reupload → sample_under_review | buyer (owner) |
| needs_reupload → parked | system/admin |
| analysis_in_progress → report_generating | admin |
| report_generating → completed | admin |
Anything else raises. The function stamps `submitted_at` on draft→sample_under_review. (Later tickets extend the *stamps*, never the edges.)
*Gate:* SQL tests — every allowed edge succeeds for its actor; every disallowed edge and every allowed edge with the wrong actor raises. Full matrix coverage: 7×7 minus allowed = all rejected.

**A4 · `src/lib/tiers.ts`** — the three tiers exactly per PRD §5, typed and frozen.
*Gate:* unit test snapshots prices 999/1999/2999 and days 3/5/7.

**A5 · Types + data helpers** — `src/lib/orders/types.ts` (Order, OrderStatus), `src/lib/orders/queries.ts` (`getMyOrders()` server-side).
*Gate:* typecheck.

**B1 · Server action: `createDraftOrder()`** — `src/app/(app)/dashboard/actions.ts`: inserts a draft owned by the caller, redirects to the wizard route (stub target until T05 — a placeholder page is fine).
*Gate:* clicking "New request" as a signed-in user creates exactly one row.

**B2 · Dashboard list** — rebuild `/dashboard` on T02 primitives: header "Your assessments" (serif) + "New request" pill; order cards (subject placeholder until T05 fields exist, tier if set, created date, status chip). **Four states:** skeleton cards on load, the designed empty state (seal + "Your first assessment begins with a handwriting sample." + CTA), inline error + retry, populated.
*Gate:* all four states exercised for real — zero rows, throttled load, a forced query failure, happy path.

**C1 · RLS test suite** — `tests/rls/orders.test.ts`: two users; each sees only their own orders; user B cannot select, update, or delete A's order; anonymous sees nothing.
*Gate:* passes; loosening the select policy makes it fail.

**C2 · Transition test suite** — `tests/rls/transitions.test.ts` driving `transition_order()` as buyer, admin, and wrong-actor for the full matrix.
*Gate:* full coverage per A3.

**C3 · E2E** — `e2e/draft-order.spec.ts`: sign in (test user) → New request → card appears with `draft` chip → empty state shown for a fresh second user.
*Gate:* green headless.

## Definition of done
- [ ] Draft creation + dashboard list work on the deployed URL.
- [ ] `status` is provably un-writable except through `transition_order()` (A2 gate).
- [ ] Full transition matrix tested (allowed × actor, rejected otherwise).
- [ ] Two-account isolation proven at the database level.
- [ ] Dashboard ships all four screen states on T02 primitives.
