-- Review-gate hardening, same class as 20260902190000.
--
-- 1. transition_order() allowed the owner to walk draft → sample_under_review
--    directly. Every submission invariant (tier, sample, consent, payment)
--    lives in submit_order(), which merely wraps that call — so a buyer with
--    a session JWT could POST /rpc/transition_order and land an unpaid,
--    sample-less order in the analyst's queue. The edge now requires a
--    transaction-local flag that only submit_order() sets.
--
-- 2. The INSERT grant on order_files was table-wide and the policy checked
--    only ownership, so a direct insert could record a "sample" that pointed
--    at any string with no object behind it — satisfying submit_order()'s
--    "at least one file" gate and the T08 "a replacement was uploaded after
--    the rejection" gate with nothing uploaded. The grant is narrowed to the
--    columns recordUpload() writes, and the policy now requires the path to
--    sit in the caller's own folder for this order AND to exist in storage.

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
  overdue boolean;
  v_days int;
  v_fresh_samples int;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  is_owner  := o.buyer_id = auth.uid();
  admin     := public.is_admin();
  is_system := coalesce(auth.role(), '') = 'service_role';
  overdue   := o.reupload_deadline is not null and now() > o.reupload_deadline;

  if o.status = 'draft' and p_to = 'sample_under_review' then
    -- Only through submit_order(), which sets this transaction-local flag
    -- after asserting tier, sample, consent and payment. A buyer calling
    -- this function directly is the owner but did not come that way.
    allowed := is_system
      or (is_owner and current_setting('tegaki.submitting', true) = o.id::text);

  elsif o.status = 'sample_under_review' and p_to in ('analysis_in_progress', 'needs_reupload') then
    allowed := admin or is_system;

  elsif o.status = 'needs_reupload' and p_to = 'sample_under_review' then
    allowed := is_owner or is_system;

  elsif o.status = 'needs_reupload' and p_to = 'parked' then
    -- Parking an order whose window has already closed is not a privilege:
    -- the deadline decided, not the caller, and the outcome is identical
    -- whoever asks. That is what lets the sweep run on an ordinary page load
    -- without handing anybody new powers. Parking one EARLY stays with the
    -- analyst.
    allowed := admin or is_system or (overdue and is_owner);

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
  if p_to = 'needs_reupload' and v_reason is null then
    raise exception 'Say why the sample cannot be used — the customer is shown this text'
      using errcode = 'check_violation';
  end if;

  -- A resubmission has to carry something new. Without this, "resubmit" is a
  -- button that returns the order to the queue unchanged and buys the
  -- customer nothing but another rejection.
  if o.status = 'needs_reupload' and p_to = 'sample_under_review' then
    select count(*) into v_fresh_samples
      from public.order_files f
     where f.order_id = p_order_id
       and (o.rejected_at is null or f.created_at > o.rejected_at);

    if v_fresh_samples = 0 then
      raise exception 'Add a replacement page before sending this back for review'
        using errcode = 'check_violation';
    end if;

    if overdue then
      raise exception 'The fourteen-day window for this order has closed'
        using errcode = 'check_violation';
    end if;
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
         -- The FIRST submission, kept for the audit trail. Resubmissions are
         -- recorded separately rather than overwriting it.
         submitted_at = case
           when p_to = 'sample_under_review' and submitted_at is null then now()
           else submitted_at
         end,
         resubmitted_at = case
           when o.status = 'needs_reupload' and p_to = 'sample_under_review' then now()
           else resubmitted_at
         end,
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
         rejected_at = case
           when p_to = 'needs_reupload' then now()
           else rejected_at
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
  -- Transaction-local, so it cannot outlive this call or leak to another.
  perform set_config('tegaki.submitting', p_order_id::text, true);
  o := public.transition_order(p_order_id, 'sample_under_review');

  return o;
end;
$$;

revoke insert on public.order_files from authenticated;
grant insert (order_id, uploader_id, version, bucket_path, file_name, mime, size_bytes)
  on public.order_files to authenticated;

drop policy "order_files: attach to own open order" on public.order_files;
create policy "order_files: attach to own open order"
  on public.order_files for insert
  to authenticated
  with check (
    uploader_id = auth.uid()
    and split_part(bucket_path, '/', 1) = auth.uid()::text
    and split_part(bucket_path, '/', 2) = order_id::text
    and exists (
      select 1 from public.orders o
      where o.id = order_files.order_id
        and o.buyer_id = auth.uid()
        and o.status in ('draft', 'needs_reupload')
    )
    -- A row may only describe bytes that are actually there.
    and exists (
      select 1 from storage.objects so
      where so.bucket_id = 'samples' and so.name = order_files.bucket_path
    )
  );
