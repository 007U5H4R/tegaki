-- T03 · orders, and the status machine that owns them
--
-- Solution-PRD §6.6 defines a small state machine. It lives here, in the
-- database, rather than in application code — because a rule enforced by the
-- app is a rule that holds only for callers who go through the app.
--
-- Three independent locks keep status honest:
--   1. no RLS policy lets a client write `status`
--   2. the UPDATE grant does not include the `status` column at all, so even
--      a mistakenly widened policy cannot help
--   3. every legal edge lives in transition_order(), which also checks WHO
--      is asking, not merely what they are asking for
--
-- Project rule (auto-exposure is off): every table grants narrowly to
-- `authenticated` and fully to `service_role`. Forgetting the second fails
-- only in server-side paths, which is a slow way to find out.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,

  status text not null default 'draft' check (
    status in (
      'draft',
      'sample_under_review',
      'needs_reupload',
      'analysis_in_progress',
      'report_generating',
      'completed',
      'parked'
    )
  ),

  tier text check (tier in ('express', 'core', 'comprehensive')),
  wizard_stage int not null default 1 check (wizard_stage between 1 and 4),

  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is
  'One assessment request. Status is never written directly — see transition_order().';

create index orders_buyer_created_idx on public.orders (buyer_id, created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── Who is asking ───────────────────────────────────────────────────────────
--
-- is_admin() is defined here rather than in T07 so the status machine can be
-- complete and fully tested in one go. T07 adds the admin *policies* that use
-- it; the edges themselves never change again.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'True when the caller''s profile carries the admin role. Role is set at signup from a compiled allowlist and is not client-writable.';

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.orders enable row level security;

create policy "orders: read own"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid());

create policy "orders: create own"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid());

-- Editing is confined to a draft. Once an order is submitted its details are
-- what the analyst is working from, so they stop being the buyer's to change.
create policy "orders: edit own draft"
  on public.orders for update
  to authenticated
  using (buyer_id = auth.uid() and status = 'draft')
  with check (buyer_id = auth.uid() and status = 'draft');

-- Abandoning a request you started by mistake is reasonable; deleting one an
-- analyst has begun work on is not.
create policy "orders: delete own draft"
  on public.orders for delete
  to authenticated
  using (buyer_id = auth.uid() and status = 'draft');

-- ── Grants ──────────────────────────────────────────────────────────────────
--
-- `status` and `submitted_at` are absent from the UPDATE grant on purpose:
-- they are the machine's to set, and a missing privilege is a stronger
-- guarantee than a policy that merely happens to be written correctly today.

grant select, insert, delete on public.orders to authenticated;
grant update (tier, wizard_stage, updated_at) on public.orders to authenticated;
grant all on public.orders to service_role;

-- ── The status machine ──────────────────────────────────────────────────────

create or replace function public.transition_order(
  p_order_id uuid,
  p_to text
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders;
  is_owner boolean;
  is_system boolean;
  admin boolean;
  allowed boolean := false;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  is_owner  := o.buyer_id = auth.uid();
  admin     := public.is_admin();
  -- The service role is the trusted server context: scheduled jobs and the
  -- test suite. A client JWT can never claim it.
  is_system := coalesce(auth.role(), '') = 'service_role';

  -- The complete edge list from Solution-PRD §6.6. Later tickets add the
  -- side effects they need (timestamps, reasons); none of them adds an edge.
  if o.status = 'draft' and p_to = 'sample_under_review' then
    allowed := is_owner or is_system;

  elsif o.status = 'sample_under_review' and p_to in ('analysis_in_progress', 'needs_reupload') then
    allowed := admin or is_system;

  elsif o.status = 'needs_reupload' and p_to = 'sample_under_review' then
    allowed := is_owner or is_system;

  elsif o.status = 'needs_reupload' and p_to = 'parked' then
    allowed := admin or is_system;

  elsif o.status = 'analysis_in_progress' and p_to = 'report_generating' then
    allowed := admin or is_system;

  elsif o.status = 'report_generating' and p_to = 'completed' then
    allowed := admin or is_system;

  else
    raise exception 'Cannot move an order from % to %', o.status, p_to
      using errcode = 'check_violation';
  end if;

  if not allowed then
    raise exception 'Not permitted to move this order from % to %', o.status, p_to
      using errcode = 'insufficient_privilege';
  end if;

  update public.orders
     set status = p_to,
         submitted_at = case
           when p_to = 'sample_under_review' and submitted_at is null then now()
           else submitted_at
         end
   where id = p_order_id
   returning * into o;

  return o;
end;
$$;

comment on function public.transition_order(uuid, text) is
  'The only way an order status changes. Validates the edge against PRD §6.6 and the caller''s relationship to the order.';

revoke all on function public.transition_order(uuid, text) from public;
grant execute on function public.transition_order(uuid, text) to authenticated, service_role;
