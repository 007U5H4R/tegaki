-- T01/B3–B5 · profiles
--
-- Mirrors auth.users with the fields the app actually needs, and carries the
-- role. Everything downstream (orders, files, reports) hangs off this table.
--
-- Project note: this project was created with "automatically expose new
-- tables" DISABLED, so privileges must be granted explicitly at the bottom of
-- this file or PostgREST cannot see the table at all.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'buyer' check (role in ('buyer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Auth mirror plus role. Role is derived from the ADMIN_EMAILS allowlist at signup, never set by a client.';

create index profiles_email_idx on public.profiles (lower(email));

-- ── updated_at ──────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Profile creation on signup ──────────────────────────────────────────────
--
-- security definer because it writes to a table the signing-up user has no
-- INSERT policy for. Deliberate: profile rows are created by the system, not
-- by clients, so a client can never invent one or choose its own role.
--
-- The role comes from a database setting rather than the app, so a compromised
-- client cannot ask to be an admin. Keep app.admin_emails in step with the
-- ADMIN_EMAILS env var; the app's resolveRole() applies the same rule.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowlist text := coalesce(current_setting('app.admin_emails', true), '');
  candidate text := lower(trim(new.email));
  resolved_role text := 'buyer';
begin
  if candidate <> '' and exists (
    select 1
    from unnest(string_to_array(allowlist, ',')) as entry
    where lower(trim(entry)) = candidate
      and trim(entry) <> ''
  ) then
    resolved_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    resolved_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row level security ──────────────────────────────────────────────────────
--
-- A user reads and updates only their own row. There is deliberately NO
-- policy letting one user see another's profile, and none letting a client
-- INSERT or DELETE — creation is the trigger's job, deletion cascades from
-- auth.users.

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Grants ──────────────────────────────────────────────────────────────────
--
-- Explicit because auto-exposure is off for this project. `role` is
-- deliberately excluded from the UPDATE grant: even with a passing RLS policy,
-- a user cannot promote themselves, because the privilege simply is not there.

grant select on public.profiles to authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;
