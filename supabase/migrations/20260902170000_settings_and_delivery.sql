-- T10 · the pause switch, and the moment a report actually reaches somebody
--
-- Two unrelated things share this migration because both are small and both
-- are about the analyst's control over the queue rather than the customer's
-- journey through it.

-- ── Settings ────────────────────────────────────────────────────────────────
--
-- One row per switch. A table rather than an env var because Tushar has to be
-- able to close the shop from his phone at 11pm without a deploy — and because
-- a value that changes behaviour should be visible in the same place as the
-- data it affects.

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.settings is
  'Operational switches. Readable by anyone signed in, writable only by the analyst.';

create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

insert into public.settings (key, value)
values ('pause_new_orders', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.settings enable row level security;

-- Everyone signed in may read: the wizard needs to know whether to show the
-- closed notice, and there is nothing sensitive in a boolean.
create policy "settings: anyone signed in reads"
  on public.settings for select
  to authenticated
  using (true);

create policy "settings: admin writes"
  on public.settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No insert or delete for anybody: the set of switches is defined by
-- migrations, not by whoever is signed in.
grant select on public.settings to authenticated;
grant update (value, updated_at) on public.settings to authenticated;
grant all on public.settings to service_role;

create or replace function public.is_paused()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select value = 'true'::jsonb from public.settings where key = 'pause_new_orders'), false);
$$;

revoke all on function public.is_paused() from public;
grant execute on function public.is_paused() to authenticated, service_role, anon;

-- ── Enforcing the pause where orders are born ───────────────────────────────
--
-- Not in the server action. Hiding a button is not enforcement, and neither
-- is a check in application code that a direct PostgREST insert walks past.
-- The trigger is the enforcement; the action's job is to turn this error into
-- the designed notice.
--
-- Deliberately INSERT only. A customer already mid-wizard may finish and
-- submit: the pause exists to protect Tushar's queue from *new* work, and one
-- person completing an order they started is not a flood. The analyst can
-- still park anything they cannot take on.

create or replace function public.refuse_new_orders_when_paused()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- The analyst is exempt: they may need to create an order to reproduce
  -- something while the shop is shut.
  if public.is_paused() and not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Tegaki is temporarily closed to new orders — existing orders are unaffected'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger orders_refuse_when_paused
  before insert on public.orders
  for each row execute function public.refuse_new_orders_when_paused();

-- ── Delivered ───────────────────────────────────────────────────────────────
--
-- Not a status. `completed` means the report exists and is downloadable;
-- delivered means Tushar has actually sent it from his own Gmail or WhatsApp,
-- which is a thing that happens outside this system entirely. Modelling it as
-- a state would put a step the software cannot observe into the machine that
-- governs the ones it can.
--
-- It is also the timestamp T15's retention clock counts from.

alter table public.orders
  add column delivered_at timestamptz;

comment on column public.orders.delivered_at is
  'When the analyst confirmed they sent the report personally. Not a status — the sending happens outside this system. T15 counts retention from here.';

create or replace function public.mark_delivered(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders;
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst can mark an order delivered'
      using errcode = 'insufficient_privilege';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  if o.status <> 'completed' then
    raise exception 'Only a completed order can be marked delivered (this one is %)', o.status
      using errcode = 'check_violation';
  end if;

  -- Once. A second click must not move a date the retention clock counts from.
  if o.delivered_at is not null then
    raise exception 'This order was already marked delivered on %', o.delivered_at::date
      using errcode = 'check_violation';
  end if;

  update public.orders set delivered_at = now() where id = p_order_id returning * into o;
  return o;
end;
$$;

comment on function public.mark_delivered(uuid) is
  'Stamps when the analyst sent the report personally. Admin only, completed orders only, once.';

revoke all on function public.mark_delivered(uuid) from public;
grant execute on function public.mark_delivered(uuid) to authenticated, service_role;
