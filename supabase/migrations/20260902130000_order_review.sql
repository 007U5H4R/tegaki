-- T07/A2 · reviewing a sample: approve, or ask for another try
--
-- Approval is the moment the promise starts. Solution-PRD §6.6 is explicit
-- that the turnaround clock runs from sample APPROVAL rather than from
-- checkout, so that an unreadable photo costs the customer nothing.
--
-- The delivery date is therefore computed once, here, and stored. Recomputing
-- it at render would make the promise drift every time the page loaded, and
-- "when will it arrive" is the one question this product must never answer
-- inconsistently.

alter table public.orders
  add column approved_at timestamptz,
  add column expected_delivery_date date,
  add column rejected_reason text,
  add column reupload_deadline timestamptz;

comment on column public.orders.expected_delivery_date is
  'Stamped once at approval from tier_turnaround_days(). Never recomputed — the promise must not drift.';
comment on column public.orders.rejected_reason is
  'Shown to the customer verbatim. Written only by transition_order(), which requires it to be non-empty.';

-- Deliberately absent from every grant: these are the review's to write, and
-- the review happens inside transition_order(). A missing privilege is a
-- stronger guarantee than a policy that happens to be correct today.

-- ── How long a tier takes ───────────────────────────────────────────────────
--
-- The sibling of tier_price_inr(): mirrors src/lib/tiers.ts, and the same
-- test asserts the two agree, so a turnaround edited in one place and not the
-- other fails a test instead of quietly promising the wrong date.

create or replace function public.tier_turnaround_days(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'express'       then 3
    when 'core'          then 5
    when 'comprehensive' then 7
  end;
$$;

comment on function public.tier_turnaround_days(text) is
  'Working days from sample approval to delivery. Mirrors src/lib/tiers.ts; a test asserts they agree.';

revoke all on function public.tier_turnaround_days(text) from public;
grant execute on function public.tier_turnaround_days(text) to authenticated, service_role;

-- ── The status machine, extended ────────────────────────────────────────────
--
-- The two-argument version is dropped rather than kept alongside: with a
-- defaulted third parameter, both would match a two-argument call and
-- Postgres would refuse it as ambiguous. Callers that pass two arguments
-- (submit_order) resolve to the new function unchanged.
--
-- No EDGE changes here. The edge list is the PRD's and it is complete; this
-- adds only the stamps each edge leaves behind.

drop function public.transition_order(uuid, text);

create or replace function public.transition_order(
  p_order_id uuid,
  p_to text,
  p_reason text default null
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
  v_days int;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
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

  -- Turning someone away costs them days, so it may not be done wordlessly.
  -- The customer is shown this text verbatim (T08); an empty one would leave
  -- them staring at a rejection with no idea what to fix.
  if p_to = 'needs_reupload' and v_reason is null then
    raise exception 'Say why the sample cannot be used — the customer is shown this text'
      using errcode = 'check_violation';
  end if;

  if p_to = 'analysis_in_progress' then
    v_days := public.tier_turnaround_days(o.tier);
    if v_days is null then
      raise exception 'No turnaround is configured for the % tier', coalesce(o.tier, 'unset')
        using errcode = 'check_violation';
    end if;
  end if;

  update public.orders
     set status = p_to,
         submitted_at = case
           when p_to = 'sample_under_review' and submitted_at is null then now()
           else submitted_at
         end,
         -- Stamped on the first approval only. Today no edge leads back into
         -- approval, so this can fire just once; the guard is here because a
         -- delivery date is a promise, and if a later ticket ever adds a
         -- route back it must not silently move one already given.
         approved_at = case
           when p_to = 'analysis_in_progress' and approved_at is null then now()
           else approved_at
         end,
         expected_delivery_date = case
           when p_to = 'analysis_in_progress' and expected_delivery_date is null
             then (now() + make_interval(days => v_days))::date
           else expected_delivery_date
         end,
         rejected_reason = case
           when p_to = 'needs_reupload' then v_reason
           else rejected_reason
         end,
         reupload_deadline = case
           when p_to = 'needs_reupload' then now() + interval '14 days'
           else reupload_deadline
         end
   where id = p_order_id
   returning * into o;

  return o;
end;
$$;

comment on function public.transition_order(uuid, text, text) is
  'The only way an order status changes. Validates the edge against PRD §6.6, the caller''s relationship to the order, and stamps the review timestamps that edge implies.';

revoke all on function public.transition_order(uuid, text, text) from public;
grant execute on function public.transition_order(uuid, text, text) to authenticated, service_role;
