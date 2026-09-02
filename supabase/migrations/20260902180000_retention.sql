-- T15 · Retention and erasure.
--
-- Two different promises, kept by the same machinery:
--
--   The policy page tells customers their handwriting is deleted 90 days
--   after their report is delivered. That is a promise to destroy something
--   on a schedule, and a promise nobody enforces is a lie with a delay.
--
--   Anyone may ask for their data to be erased. That is a promise to destroy
--   something on request.
--
-- Both are written here rather than in the route handler that calls them.
-- A cron endpoint is a URL: it can be called twice, called late, or not
-- called at all, and one day it will be rewritten by somebody who does not
-- know what `delivered_at` means. What may be deleted, and when, is decided
-- in one place that the API cannot talk its way past.

-- ── The window ──────────────────────────────────────────────────────────────
--
-- Ninety days, stated once. `src/lib/retention/constants.ts` carries the same
-- number for the copy that tells customers about it, and a test asserts the
-- two agree — the alternative is a policy page that promises one thing while
-- the job does another.

create or replace function public.retention_days()
returns int
language sql
immutable
set search_path = public, pg_temp
as $$ select 90 $$;

comment on function public.retention_days() is
  'The sample-retention window in days. Mirrored by RETENTION_DAYS in src/lib/retention/constants.ts; retention.test.ts asserts they agree.';

-- ── The record of a purge ───────────────────────────────────────────────────
--
-- Without this, "this order has no samples" and "this order's samples were
-- deleted" look identical, and the dashboard cannot tell a customer which
-- happened. It is also the only evidence that the promise was kept.

alter table public.orders
  add column samples_purged_at timestamptz;

comment on column public.orders.samples_purged_at is
  'When the handwriting samples were destroyed — by the retention job or on request. Distinguishes "deleted" from "never uploaded".';

-- ── What is due for deletion ────────────────────────────────────────────────
--
-- Returns paths, not just ids, because the caller has work to do that SQL
-- cannot: removing a row from storage.objects does not remove the bytes from
-- the backing store, so the object must go through the Storage API. This
-- function decides *which* objects; the route handler only carries them.

create or replace function public.expiring_sample_files(p_days int default null)
returns table (order_id uuid, bucket_path text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d int := coalesce(p_days, public.retention_days());
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst or a scheduled job may enumerate expiring samples'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    select f.order_id, f.bucket_path
    from public.order_files f
    join public.orders o on o.id = f.order_id
    -- Strictly older than the window: an order delivered exactly d days ago
    -- has not yet passed its ninetieth day.
    where o.delivered_at is not null
      and o.delivered_at < now() - make_interval(days => d)
    order by f.order_id, f.version;
end;
$$;

comment on function public.expiring_sample_files(int) is
  'Sample objects belonging to orders delivered more than the retention window ago. Admin or service_role only.';

-- ── Doing it ────────────────────────────────────────────────────────────────
--
-- Takes the orders whose objects the caller has already removed and drops
-- their rows. Deliberately keyed on the same predicate rather than trusting
-- the list it is handed: a caller that passed the wrong ids could otherwise
-- delete a live order's samples, and this function is the last thing standing
-- between a bug and a customer's handwriting.
--
-- Object first, row second, and this re-checks the window — so a run that
-- dies halfway leaves rows whose objects are already gone, and the next run
-- finds them again and finishes the job. Removing an object that is not there
-- is a no-op, which is what makes the whole thing safe to run twice.

create or replace function public.purge_expired_samples(p_days int default null)
returns table (orders_purged int, files_deleted int)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d int := coalesce(p_days, public.retention_days());
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst or a scheduled job may purge samples'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  with due as (
    select o.id
    from public.orders o
    where o.delivered_at is not null
      and o.delivered_at < now() - make_interval(days => d)
      and exists (select 1 from public.order_files f where f.order_id = o.id)
  ), gone as (
    delete from public.order_files f
    using due
    where f.order_id = due.id
    returning f.order_id
  ), stamped as (
    update public.orders o
       set samples_purged_at = coalesce(o.samples_purged_at, now())
     where o.id in (select order_id from gone)
    returning o.id
  )
  select (select count(*)::int from stamped), (select count(*)::int from gone);
end;
$$;

comment on function public.purge_expired_samples(int) is
  'Deletes order_files rows for orders past the retention window and stamps samples_purged_at. Returns both counts because a job that cannot say what it destroyed is not observable. Idempotent. Admin or service_role only.';

-- ── The miss the job cannot fix ─────────────────────────────────────────────
--
-- An order that was completed but never marked delivered has no retention
-- clock, so its samples are kept indefinitely. That is the conservative
-- choice — better to hold a file too long than to destroy one belonging to
-- somebody still waiting for their report — but it is a hole, and a hole
-- nobody counts is a hole nobody closes. Every run reports this number.

create or replace function public.undelivered_backlog(p_days int default null)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d int := coalesce(p_days, public.retention_days());
  n int;
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst or a scheduled job may read the backlog'
      using errcode = 'insufficient_privilege';
  end if;

  -- Dated from the report, not from `updated_at`: attach_report() writes the
  -- report and completes the order in one transaction, so the report's
  -- created_at IS the completion moment. `updated_at` moves whenever anything
  -- touches the row, which would quietly reset a clock that is meant to be
  -- counting how long a file has been kept.
  select count(*) into n
  from public.orders o
  join public.reports r on r.order_id = o.id
  where o.status = 'completed'
    and o.delivered_at is null
    and r.created_at < now() - make_interval(days => d)
    and exists (select 1 from public.order_files f where f.order_id = o.id);

  return n;
end;
$$;

comment on function public.undelivered_backlog(int) is
  'Completed orders never marked delivered, older than the window — samples the retention clock never started on. Reported by every cron run.';

-- ── Erasure on request ──────────────────────────────────────────────────────
--
-- Two modes, because "delete my data" means two different things and the
-- person asking is entitled to choose:
--
--   redact  — the files and the personal details go; the order row stays with
--             its dates, tier and payment so the books still balance and a
--             later "did you ever charge me?" can be answered honestly.
--   erase   — the order goes entirely, taking files, payment and report with
--             it by cascade. Nothing remains to answer questions with.
--
-- Returns every storage path it orphaned so the caller can delete the bytes.
-- Collected before the deletes, because afterwards there is nothing to ask.

create or replace function public.purge_order_data(p_order_id uuid, p_erase boolean default false)
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst may erase an order''s data'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  return query
    select 'samples'::text, f.bucket_path from public.order_files f where f.order_id = p_order_id
    union all
    select 'reports'::text, r.bucket_path from public.reports r where r.order_id = p_order_id;

  if p_erase then
    -- order_files, payments and reports all cascade from here.
    delete from public.orders where id = p_order_id;
  else
    delete from public.order_files where order_id = p_order_id;
    delete from public.reports where order_id = p_order_id;

    update public.orders
       set full_name = null,
           subject_name = null,
           email = null,
           phone = null,
           city = null,
           age = null,
           rejected_reason = null,
           samples_purged_at = coalesce(samples_purged_at, now())
     where id = p_order_id;
  end if;
end;
$$;

comment on function public.purge_order_data(uuid, boolean) is
  'Honours a delete-my-data request for one order. Returns the storage paths orphaned so the caller can delete the objects. Admin or service_role only.';

revoke all on function public.retention_days() from public;
revoke all on function public.expiring_sample_files(int) from public;
revoke all on function public.purge_expired_samples(int) from public;
revoke all on function public.undelivered_backlog(int) from public;
revoke all on function public.purge_order_data(uuid, boolean) from public;

grant execute on function public.retention_days() to authenticated, service_role;
grant execute on function public.expiring_sample_files(int) to authenticated, service_role;
grant execute on function public.purge_expired_samples(int) to authenticated, service_role;
grant execute on function public.undelivered_backlog(int) to authenticated, service_role;
grant execute on function public.purge_order_data(uuid, boolean) to authenticated, service_role;
