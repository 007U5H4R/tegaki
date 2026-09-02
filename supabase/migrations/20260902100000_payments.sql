-- T06 · demo checkout: the payment record, and submitting as one atomic act
--
-- Solution-PRD §5: the pilot takes no real money. Checkout displays the price,
-- records that the order was placed, and confirms instantly — labelled as such
-- everywhere a customer can see it.
--
-- Two things here are structural rather than cosmetic:
--
--   `order_id` is UNIQUE. Double payment is not prevented by being careful
--   with the button; it is impossible, because a second row cannot exist.
--
--   Submitting is ONE function call. Inserting the payment and moving the
--   status are a single transaction, so there is no window in which an order
--   is paid but still a draft — the state a customer would report as "it took
--   my order and did nothing".

-- ── What a tier costs, according to the server ──────────────────────────────
--
-- This duplicates the prices in src/lib/tiers.ts, and the duplication is
-- deliberate: an amount the client sends is an amount the client chooses.
-- tiers.ts is authoritative for what is DISPLAYED, this function for what is
-- RECORDED, and `tests/rls/payments.test.ts` asserts the two agree — so the
-- drift fails a test rather than quietly undercharging.

create or replace function public.tier_price_inr(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'express'       then 999
    when 'core'          then 1999
    when 'comprehensive' then 2999
  end;
$$;

comment on function public.tier_price_inr(text) is
  'Server-side price for a tier, in whole rupees. Mirrors src/lib/tiers.ts; a test asserts they agree.';

revoke all on function public.tier_price_inr(text) from public;
grant execute on function public.tier_price_inr(text) to authenticated, service_role;

-- ── payments ────────────────────────────────────────────────────────────────

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,

  amount_inr int not null check (amount_inr > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),

  -- Gateway-ready shape, pilot-honest constraints. When Cashfree arrives it
  -- widens these two CHECKs and fills provider_reference; nothing else about
  -- the table needs to change. Permitting states the system cannot currently
  -- produce would only make the data harder to trust.
  provider text not null default 'demo' check (provider in ('demo')),
  provider_reference text,
  status text not null default 'demo_paid' check (status in ('demo_paid')),

  created_at timestamptz not null default now()
);

comment on table public.payments is
  'One row per submitted order. Pilot rows are demo only — no money moves. Written solely by submit_order().';
comment on column public.payments.order_id is
  'Unique: the schema itself makes a second payment for an order impossible.';

alter table public.payments enable row level security;

create policy "payments: read own"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.buyer_id = auth.uid()
    )
  );

create policy "payments: admin reads all"
  on public.payments for select
  to authenticated
  using (public.is_admin());

-- There is deliberately no insert, update or delete policy, and no such
-- grant. A payment row is a record of something that happened; the only way
-- one comes into existence is submit_order(), which runs as definer.
grant select on public.payments to authenticated;
grant all on public.payments to service_role;

-- ── Submitting ──────────────────────────────────────────────────────────────

create or replace function public.submit_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders;
  v_amount int;
  v_files int;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  -- The service role is the trusted server context (tests, future jobs); a
  -- client JWT can never claim it.
  if o.buyer_id <> auth.uid() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'That order is not yours' using errcode = 'insufficient_privilege';
  end if;

  if o.status <> 'draft' then
    raise exception 'This order has already been submitted'
      using errcode = 'check_violation';
  end if;

  if o.tier is null then
    raise exception 'Choose a tier before confirming your order'
      using errcode = 'check_violation';
  end if;

  select count(*) into v_files from public.order_files where order_id = p_order_id;
  if v_files = 0 then
    raise exception 'Add at least one handwriting sample before confirming your order'
      using errcode = 'check_violation';
  end if;

  -- The CHECK constraint on orders would refuse this write regardless. Saying
  -- it here first means a blocked submission explains itself, rather than
  -- surfacing as a raw constraint name the customer cannot act on.
  if not o.subject_is_self and o.consent_given_at is null then
    raise exception 'Confirm you have the subject''s permission before submitting'
      using errcode = 'check_violation';
  end if;

  v_amount := public.tier_price_inr(o.tier);
  if v_amount is null then
    raise exception 'No price is configured for the % tier', o.tier
      using errcode = 'check_violation';
  end if;

  insert into public.payments (order_id, amount_inr)
  values (p_order_id, v_amount);

  -- Same transaction, so a failure anywhere above leaves neither a payment
  -- nor a status change behind.
  o := public.transition_order(p_order_id, 'sample_under_review');

  return o;
end;
$$;

comment on function public.submit_order(uuid) is
  'Closes the customer half of the loop: records the demo payment and moves draft to sample_under_review, atomically.';

revoke all on function public.submit_order(uuid) from public;
grant execute on function public.submit_order(uuid) to authenticated, service_role;
