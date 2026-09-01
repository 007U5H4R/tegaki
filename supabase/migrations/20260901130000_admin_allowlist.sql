-- T01/C8 · admin allowlist, database side
--
-- Supersedes the `current_setting('app.admin_emails')` approach in the
-- previous migration: Supabase's managed Postgres denies `ALTER DATABASE ...
-- SET` to the migration role ("permission denied to set parameter"), so a
-- database-level GUC is not available to us.
--
-- The allowlist is therefore compiled into the function. That keeps the
-- property we actually wanted: there is no runtime path to admin. No row to
-- UPDATE, no setting to flip, no API surface — promoting an account requires
-- a migration, reviewed and deployed like any other code change.
--
-- Keep in step with ADMIN_EMAILS in the environment. The app's resolveRole()
-- applies the identical rule (lowercase, trim, exact match), and both are
-- exercised by the signup tests.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  admin_emails constant text[] := array['snowreaderofficial@gmail.com'];
  candidate text := lower(trim(coalesce(new.email, '')));
  resolved_role text := 'buyer';
begin
  -- An empty candidate must never match a blank allowlist entry.
  if candidate <> '' and exists (
    select 1
    from unnest(admin_emails) as entry
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
