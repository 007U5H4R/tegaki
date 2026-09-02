-- T09 · the finished report: attaching one, and reading it back
--
-- This is the last link in the chain and the one carrying the strictest
-- promise in the product. Solution-PRD §7.4: nothing unvalidated ever reaches
-- a customer. Fulfilment is manual — Claude drafts the report, Tushar reads
-- it — and that human check is the only thing standing between a generated
-- document and somebody's inbox.
--
-- So attaching a report is not an upload. It is an attestation, and the
-- database will not record one without it: `validated_at` is `not null`, and
-- the only function that writes the row stamps it from an explicit
-- confirmation. A report row cannot exist unvalidated.

create table public.reports (
  id uuid primary key default gen_random_uuid(),

  -- Unique: one report per order. A second attach is refused by the schema,
  -- not by remembering to check.
  order_id uuid not null unique references public.orders (id) on delete cascade,

  bucket_path text not null unique,
  file_name text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 26214400),

  -- Not nullable, and that is the point. There is no such thing as an
  -- unvalidated report in this table.
  validated_at timestamptz not null,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,

  created_at timestamptz not null default now()
);

comment on table public.reports is
  'One delivered report per order. Rows are written only by attach_report(), which requires an explicit validation attestation.';
comment on column public.reports.validated_at is
  'When the analyst confirmed they had read and validated this report. Not nullable — PRD §7.4 permits no unvalidated delivery.';

create index reports_order_idx on public.reports (order_id);

alter table public.reports enable row level security;

create policy "reports: buyer reads own"
  on public.reports for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = reports.order_id and o.buyer_id = auth.uid()
    )
  );

create policy "reports: admin reads all"
  on public.reports for select
  to authenticated
  using (public.is_admin());

-- No insert, update or delete policy, and no such grant. The row is a record
-- of a validated delivery; the only way one appears is attach_report().
grant select on public.reports to authenticated;
grant all on public.reports to service_role;

-- ── The private bucket ──────────────────────────────────────────────────────
--
-- Same reasoning as `samples`: private, because a URL is not a secret. It
-- leaks through browser history, referrer headers and forwarded screenshots,
-- and this bucket holds a personality assessment with somebody's name on it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  false,
  26214400, -- 25 MB, matching the size check above
  array['application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage policies ────────────────────────────────────────────────────────
--
-- Note what is missing: there is NO buyer policy on this bucket at all.
--
-- Customers never touch report storage directly. Their download goes through
-- a server action that checks ownership and mints a 60-second signed URL,
-- so the window in which a leaked link is useful is a minute rather than
-- forever. `samples` works the other way round — the owner reads their own
-- folder — because there the customer is the one who put the bytes there.

create policy "reports: admin writes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reports' and public.is_admin());

create policy "reports: admin reads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'reports' and public.is_admin());

create policy "reports: admin removes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reports' and public.is_admin());

-- ── Attaching a report ──────────────────────────────────────────────────────

create or replace function public.attach_report(
  p_order_id uuid,
  p_bucket_path text,
  p_file_name text,
  p_size_bytes int,
  p_validated boolean
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders;
  actor uuid := auth.uid();
  is_system boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not (public.is_admin() or is_system) then
    raise exception 'Only the analyst can attach a report'
      using errcode = 'insufficient_privilege';
  end if;

  -- The attestation. Passed as a boolean and stamped here rather than posted
  -- as a timestamp, so the client never chooses when validation happened —
  -- exactly as consent works in save_order_profile().
  if not coalesce(p_validated, false) then
    raise exception 'Confirm you have read and validated this report before attaching it'
      using errcode = 'check_violation';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  if o.status <> 'report_generating' then
    raise exception 'A report can only be attached while the order is in report production (this one is %)', o.status
      using errcode = 'check_violation';
  end if;

  insert into public.reports (order_id, bucket_path, file_name, size_bytes, validated_at, uploaded_by)
  values (
    p_order_id,
    p_bucket_path,
    p_file_name,
    p_size_bytes,
    now(),
    coalesce(actor, o.buyer_id)
  );

  -- Same transaction: an order cannot be marked completed without its report,
  -- and a report cannot exist against an order still in production.
  o := public.transition_order(p_order_id, 'completed');

  return o;
end;
$$;

comment on function public.attach_report(uuid, text, text, int, boolean) is
  'Records a validated report against an order and completes it, atomically. Refuses without an explicit attestation.';

revoke all on function public.attach_report(uuid, text, text, int, boolean) from public;
grant execute on function public.attach_report(uuid, text, text, int, boolean) to authenticated, service_role;
