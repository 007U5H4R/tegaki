-- T24 · the keep-alive heartbeat
--
-- Supabase pauses a free project on low *database* activity and does not say
-- what counts. A read-only RPC on near-empty tables may not, so the daily
-- keep-alive job writes: one row, overwritten once a day. The same row is the
-- evidence the admin settings page shows ("Last database heartbeat").

-- ── The row ─────────────────────────────────────────────────────────────────

create table public.heartbeat (
  -- One row, enforced by the database rather than by the job's good manners.
  id int primary key check (id = 1),
  beat_at timestamptz not null
);

comment on table public.heartbeat is
  'One row, overwritten daily by the keep-alive cron. Readable by the analyst only; written only by keepalive_ping().';

alter table public.heartbeat enable row level security;

create policy "heartbeat: admin reads"
  on public.heartbeat for select
  to authenticated
  using (public.is_admin());

-- No insert, update or delete policy for anybody: the only writer is the
-- security-definer function below.
revoke all on public.heartbeat from anon, authenticated;
grant select on public.heartbeat to authenticated;
grant all on public.heartbeat to service_role;

-- ── The write ───────────────────────────────────────────────────────────────

create or replace function public.keepalive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only the scheduled keep-alive may record a heartbeat'
      using errcode = 'insufficient_privilege';
  end if;

  select beat_at into previous from public.heartbeat where id = 1 for update;

  insert into public.heartbeat (id, beat_at)
  values (1, now())
  on conflict (id) do update set beat_at = excluded.beat_at;

  return previous;
end;
$$;

comment on function public.keepalive_ping() is
  'Upserts heartbeat(id=1, beat_at=now()) and returns the previous beat_at (null on the first ever ping). service_role only.';

create or replace function public.last_heartbeat()
returns timestamptz
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the analyst may read the heartbeat'
      using errcode = 'insufficient_privilege';
  end if;

  return (select beat_at from public.heartbeat where id = 1);
end;
$$;

comment on function public.last_heartbeat() is
  'When the keep-alive last wrote its heartbeat, or null if it never has. Admin or service_role only.';

revoke all on function public.keepalive_ping() from public, anon, authenticated;
revoke all on function public.last_heartbeat() from public, anon;

grant execute on function public.keepalive_ping() to service_role;
grant execute on function public.last_heartbeat() to authenticated, service_role;
